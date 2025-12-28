import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter (per IP)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 lookups per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }
  
  record.count++;
  return { allowed: true };
}

// Input validation
function validateInput(data: any): { valid: boolean; error?: string } {
  if (!data.ticketNumber || typeof data.ticketNumber !== 'string') {
    return { valid: false, error: 'Ticket number is required' };
  }
  
  if (!data.email || typeof data.email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  // Validate ticket number format: TKT-YYYY-XXXXXX
  const ticketRegex = /^TKT-\d{4}-\d{6}$/;
  if (!ticketRegex.test(data.ticketNumber.toUpperCase())) {
    return { valid: false, error: 'Invalid ticket number format' };
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

// Add artificial delay to prevent timing attacks
async function addSecurityDelay(min: number = 500, max: number = 1500): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min) + min);
  await new Promise(resolve => setTimeout(resolve, delay));
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter || 60),
            ...corsHeaders 
          } 
        }
      );
    }

    const requestData = await req.json();
    
    // Validate input
    const validation = validateInput(requestData);
    if (!validation.valid) {
      // Add delay to prevent enumeration
      await addSecurityDelay();
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const ticketNumber = requestData.ticketNumber.toUpperCase().trim();
    const email = requestData.email.toLowerCase().trim();

    // Use service role to bypass RLS for this secure lookup
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query booking with BOTH ticket number AND email verification
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        ticket_number,
        status,
        passenger_first_name,
        passenger_last_name,
        passenger_email,
        price_paid,
        created_at,
        trip:trips(
          departure_date,
          departure_time,
          arrival_time,
          route:routes(name)
        ),
        origin_stop:stops!bookings_origin_stop_id_fkey(name, city),
        destination_stop:stops!bookings_destination_stop_id_fkey(name, city),
        seat:seats(seat_number)
      `)
      .eq('ticket_number', ticketNumber)
      .single();

    // Add security delay before responding
    await addSecurityDelay();

    if (bookingError || !booking) {
      console.log('Booking not found for ticket:', ticketNumber);
      // Generic error to prevent enumeration
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No booking found. Please verify your ticket number and email.' 
        }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify email matches (case-insensitive)
    if (booking.passenger_email.toLowerCase() !== email) {
      console.log('Email mismatch for booking:', ticketNumber);
      // Same generic error to prevent enumeration
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No booking found. Please verify your ticket number and email.' 
        }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Return booking data (excluding sensitive fields we don't need to expose)
    const safeBooking = {
      id: booking.id,
      ticket_number: booking.ticket_number,
      status: booking.status,
      passenger_first_name: booking.passenger_first_name,
      passenger_last_name: booking.passenger_last_name,
      price_paid: booking.price_paid,
      created_at: booking.created_at,
      trip: booking.trip,
      origin_stop: booking.origin_stop,
      destination_stop: booking.destination_stop,
      seat: booking.seat
    };

    console.log('Booking found and verified:', ticketNumber);

    return new Response(
      JSON.stringify({ success: true, booking: safeBooking }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in lookup-booking:", error);
    // Add delay on errors too
    await addSecurityDelay();
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
