import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter (per IP)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

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

function validateInput(data: any): { valid: boolean; error?: string; bookingType?: 'bus' | 'tour' } {
  if (!data.ticketNumber || typeof data.ticketNumber !== 'string') {
    return { valid: false, error: 'Ticket number is required' };
  }
  
  if (!data.email || typeof data.email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const ticketUpper = data.ticketNumber.toUpperCase().trim();
  
  // Bus booking format: TKT-YYYY-XXXXXX
  const busTicketRegex = /^TKT-\d{4}-\d{6}$/;
  // Tour booking format: MT-XXXXXXXX (alphanumeric)
  const tourTicketRegex = /^MT-[A-Z0-9]{6,10}$/;
  
  if (busTicketRegex.test(ticketUpper)) {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true, bookingType: 'bus' };
  }
  
  if (tourTicketRegex.test(ticketUpper)) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true, bookingType: 'tour' };
  }
  
  return { valid: false, error: 'Invalid ticket number format' };
}

async function addSecurityDelay(min: number = 500, max: number = 1500): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min) + min);
  await new Promise(resolve => setTimeout(resolve, delay));
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(rateLimitResult.retryAfter || 60), ...corsHeaders } }
      );
    }

    const requestData = await req.json();
    const validation = validateInput(requestData);
    if (!validation.valid) {
      await addSecurityDelay();
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const ticketNumber = requestData.ticketNumber.toUpperCase().trim();
    const email = requestData.email.toLowerCase().trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (validation.bookingType === 'tour') {
      // Look up tour booking
      const { data: tourBooking, error: tourError } = await supabase
        .from('tour_bookings')
        .select(`
          id,
          booking_number,
          status,
          contact_first_name,
          contact_last_name,
          contact_email,
          contact_phone,
          participants,
          total_price,
          base_price,
          pickup_surcharge,
          created_at,
          booking_type,
          tour_id,
          tour_date_id,
          tariff_id,
          payment_method,
          paid_at
        `)
        .eq('booking_number', ticketNumber)
        .single();

      await addSecurityDelay();

      if (tourError || !tourBooking) {
        console.log('Tour booking not found for:', ticketNumber);
        return new Response(
          JSON.stringify({ success: false, error: 'No booking found. Please verify your ticket number and email.' }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (tourBooking.contact_email.toLowerCase() !== email) {
        console.log('Email mismatch for tour booking:', ticketNumber);
        return new Response(
          JSON.stringify({ success: false, error: 'No booking found. Please verify your ticket number and email.' }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Fetch tour details
      const { data: tour } = await supabase
        .from('package_tours')
        .select('destination, country, location, image_url')
        .eq('id', tourBooking.tour_id)
        .single();

      const { data: tourDate } = await supabase
        .from('tour_dates')
        .select('departure_date, return_date, duration_days')
        .eq('id', tourBooking.tour_date_id)
        .single();

      const { data: tariff } = await supabase
        .from('tour_tariffs')
        .select('name, slug')
        .eq('id', tourBooking.tariff_id)
        .single();

      const safeTourBooking = {
        id: tourBooking.id,
        booking_number: tourBooking.booking_number,
        status: tourBooking.status,
        contact_first_name: tourBooking.contact_first_name,
        contact_last_name: tourBooking.contact_last_name,
        participants: tourBooking.participants,
        total_price: tourBooking.total_price,
        base_price: tourBooking.base_price,
        pickup_surcharge: tourBooking.pickup_surcharge,
        created_at: tourBooking.created_at,
        booking_type: tourBooking.booking_type,
        payment_method: tourBooking.payment_method,
        paid_at: tourBooking.paid_at,
        tour: tour || null,
        tour_date: tourDate || null,
        tariff: tariff || null,
      };

      console.log('Tour booking found and verified:', ticketNumber);

      return new Response(
        JSON.stringify({ success: true, booking: safeTourBooking, type: 'tour' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Bus booking lookup (existing logic)
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

    await addSecurityDelay();

    if (bookingError || !booking) {
      console.log('Booking not found for ticket:', ticketNumber);
      return new Response(
        JSON.stringify({ success: false, error: 'No booking found. Please verify your ticket number and email.' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (booking.passenger_email.toLowerCase() !== email) {
      console.log('Email mismatch for booking:', ticketNumber);
      return new Response(
        JSON.stringify({ success: false, error: 'No booking found. Please verify your ticket number and email.' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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
      JSON.stringify({ success: true, booking: safeBooking, type: 'bus' }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in lookup-booking:", error);
    await addSecurityDelay();
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
