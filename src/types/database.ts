// Database types for METROPOL TOURS

export type AppRole = 'customer' | 'agent' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type SeatStatus = 'available' | 'reserved' | 'booked';

export interface Route {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stop {
  id: string;
  route_id: string;
  name: string;
  city: string;
  stop_order: number;
  price_from_start: number;
  created_at: string;
}

export interface Bus {
  id: string;
  name: string;
  license_plate: string;
  total_seats: number;
  layout: BusLayout;
  amenities: string[];
  is_active: boolean;
  created_at: string;
}

export interface BusLayout {
  rows: number;
  seatsPerRow: number;
  aisle: number;
  wcRow?: number;
}

export interface Seat {
  id: string;
  bus_id: string;
  seat_number: string;
  row_number: number;
  column_number: number;
  seat_type: string;
  is_active: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  route_id: string;
  bus_id: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripWithDetails extends Trip {
  route: Route;
  bus: Bus;
  stops: Stop[];
  available_seats: number;
  total_seats: number;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Booking {
  id: string;
  ticket_number: string;
  user_id: string | null;
  trip_id: string;
  origin_stop_id: string;
  destination_stop_id: string;
  seat_id: string;
  passenger_first_name: string;
  passenger_last_name: string;
  passenger_email: string;
  passenger_phone: string | null;
  price_paid: number;
  status: BookingStatus;
  booked_by_agent_id: string | null;
  extras: BookingExtra[];
  created_at: string;
  updated_at: string;
}

export interface BookingExtra {
  id: string;
  name: string;
  price: number;
}

export interface BookingWithDetails extends Booking {
  trip: TripWithDetails;
  origin_stop: Stop;
  destination_stop: Stop;
  seat: Seat;
}

export interface SeatHold {
  id: string;
  trip_id: string;
  seat_id: string;
  origin_stop_id: string;
  destination_stop_id: string;
  session_id: string;
  user_id: string | null;
  expires_at: string;
  created_at: string;
}

export interface PriceTier {
  id: string;
  route_id: string | null;
  occupancy_min: number;
  occupancy_max: number;
  price_multiplier: number;
  created_at: string;
}

export interface CookieConsent {
  id: string;
  session_id: string;
  user_id: string | null;
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  created_at: string;
  updated_at: string;
}

// Seat display status for the seat map
export type SeatDisplayStatus = 'available' | 'selected' | 'reserved' | 'booked';

export interface SeatWithStatus extends Seat {
  status: SeatDisplayStatus;
  isSelectable: boolean;
}
