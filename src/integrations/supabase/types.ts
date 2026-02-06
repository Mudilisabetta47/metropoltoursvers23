export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          record_id: string | null
          record_identifier: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          record_identifier?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          record_identifier?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booked_by_agent_id: string | null
          created_at: string
          destination_stop_id: string
          extras: Json | null
          id: string
          origin_stop_id: string
          passenger_email: string
          passenger_first_name: string
          passenger_last_name: string
          passenger_phone: string | null
          price_paid: number
          seat_id: string
          status: Database["public"]["Enums"]["booking_status"]
          ticket_number: string
          trip_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booked_by_agent_id?: string | null
          created_at?: string
          destination_stop_id: string
          extras?: Json | null
          id?: string
          origin_stop_id: string
          passenger_email: string
          passenger_first_name: string
          passenger_last_name: string
          passenger_phone?: string | null
          price_paid: number
          seat_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          ticket_number: string
          trip_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booked_by_agent_id?: string | null
          created_at?: string
          destination_stop_id?: string
          extras?: Json | null
          id?: string
          origin_stop_id?: string
          passenger_email?: string
          passenger_first_name?: string
          passenger_last_name?: string
          passenger_phone?: string | null
          price_paid?: number
          seat_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          ticket_number?: string
          trip_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_destination_stop_id_fkey"
            columns: ["destination_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_origin_stop_id_fkey"
            columns: ["origin_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          amenities: string[] | null
          created_at: string
          id: string
          is_active: boolean
          layout: Json
          license_plate: string
          name: string
          total_seats: number
        }
        Insert: {
          amenities?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          layout?: Json
          license_plate: string
          name: string
          total_seats?: number
        }
        Update: {
          amenities?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          layout?: Json
          license_plate?: string
          name?: string
          total_seats?: number
        }
        Relationships: []
      }
      cms_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          section_key: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          section_key: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          section_key?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      command_logs: {
        Row: {
          command_type: string
          created_at: string
          error_message: string | null
          id: string
          parameters: Json | null
          result: string
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          command_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          parameters?: Json | null
          result?: string
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          command_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          parameters?: Json | null
          result?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cookie_consents: {
        Row: {
          analytics: boolean
          created_at: string
          id: string
          marketing: boolean
          necessary: boolean
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analytics?: boolean
          created_at?: string
          id?: string
          marketing?: boolean
          necessary?: boolean
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analytics?: boolean
          created_at?: string
          id?: string
          marketing?: boolean
          necessary?: boolean
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      employee_shifts: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          assigned_bus_id: string | null
          assigned_trip_id: string | null
          created_at: string
          id: string
          notes: string | null
          role: string
          shift_date: string
          shift_end: string | null
          shift_start: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_bus_id?: string | null
          assigned_trip_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          role?: string
          shift_date?: string
          shift_end?: string | null
          shift_start: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_bus_id?: string | null
          assigned_trip_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          role?: string
          shift_date?: string
          shift_end?: string | null
          shift_start?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_shifts_assigned_bus_id_fkey"
            columns: ["assigned_bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_shifts_assigned_trip_id_fkey"
            columns: ["assigned_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_id: string | null
          source_type: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_id?: string | null
          source_type?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_id?: string | null
          source_type?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      operations_metrics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_date: string
          metric_hour: number | null
          metric_type: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_hour?: number | null
          metric_type: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_hour?: number | null
          metric_type?: string
          value?: number
        }
        Relationships: []
      }
      package_tour_inquiries: {
        Row: {
          created_at: string
          departure_date: string
          destination: string
          email: string
          first_name: string
          id: string
          inquiry_number: string
          last_name: string
          message: string | null
          participants: number
          phone: string | null
          status: string
          total_price: number
          tour_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          departure_date: string
          destination: string
          email: string
          first_name: string
          id?: string
          inquiry_number: string
          last_name: string
          message?: string | null
          participants?: number
          phone?: string | null
          status?: string
          total_price: number
          tour_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          departure_date?: string
          destination?: string
          email?: string
          first_name?: string
          id?: string
          inquiry_number?: string
          last_name?: string
          message?: string | null
          participants?: number
          phone?: string | null
          status?: string
          total_price?: number
          tour_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      package_tours: {
        Row: {
          country: string
          created_at: string
          current_participants: number | null
          departure_date: string
          description: string | null
          destination: string
          discount_percent: number | null
          duration_days: number
          highlights: string[] | null
          id: string
          image_url: string | null
          included_services: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          itinerary: Json | null
          location: string
          max_participants: number | null
          price_from: number
          return_date: string
          updated_at: string
        }
        Insert: {
          country?: string
          created_at?: string
          current_participants?: number | null
          departure_date: string
          description?: string | null
          destination: string
          discount_percent?: number | null
          duration_days?: number
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          included_services?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          location: string
          max_participants?: number | null
          price_from: number
          return_date: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          current_participants?: number | null
          departure_date?: string
          description?: string | null
          destination?: string
          discount_percent?: number | null
          duration_days?: number
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          included_services?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          location?: string
          max_participants?: number | null
          price_from?: number
          return_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      price_tiers: {
        Row: {
          created_at: string
          id: string
          occupancy_max: number
          occupancy_min: number
          price_multiplier: number
          route_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          occupancy_max: number
          occupancy_min: number
          price_multiplier?: number
          route_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          occupancy_max?: number
          occupancy_min?: number
          price_multiplier?: number
          route_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_tiers_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          base_price: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      scanner_events: {
        Row: {
          booking_id: string | null
          bus_id: string | null
          created_at: string
          error_reason: string | null
          id: string
          latitude: number | null
          longitude: number | null
          result: string
          scan_type: string
          scanner_user_id: string
          stop_id: string | null
          ticket_number: string | null
          trip_id: string | null
        }
        Insert: {
          booking_id?: string | null
          bus_id?: string | null
          created_at?: string
          error_reason?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          result?: string
          scan_type?: string
          scanner_user_id: string
          stop_id?: string | null
          ticket_number?: string | null
          trip_id?: string | null
        }
        Update: {
          booking_id?: string | null
          bus_id?: string | null
          created_at?: string
          error_reason?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          result?: string
          scan_type?: string
          scanner_user_id?: string
          stop_id?: string | null
          ticket_number?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scanner_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scanner_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_agent_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scanner_events_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scanner_events_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scanner_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_holds: {
        Row: {
          created_at: string
          destination_stop_id: string
          expires_at: string
          id: string
          origin_stop_id: string
          seat_id: string
          session_id: string
          trip_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          destination_stop_id: string
          expires_at: string
          id?: string
          origin_stop_id: string
          seat_id: string
          session_id: string
          trip_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          destination_stop_id?: string
          expires_at?: string
          id?: string
          origin_stop_id?: string
          seat_id?: string
          session_id?: string
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seat_holds_destination_stop_id_fkey"
            columns: ["destination_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_holds_origin_stop_id_fkey"
            columns: ["origin_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_holds_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_holds_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      seats: {
        Row: {
          bus_id: string
          column_number: number
          created_at: string
          id: string
          is_active: boolean
          row_number: number
          seat_number: string
          seat_type: string
        }
        Insert: {
          bus_id: string
          column_number: number
          created_at?: string
          id?: string
          is_active?: boolean
          row_number: number
          seat_number: string
          seat_type?: string
        }
        Update: {
          bus_id?: string
          column_number?: number
          created_at?: string
          id?: string
          is_active?: boolean
          row_number?: number
          seat_number?: string
          seat_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seats_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          created_at: string
          description: string | null
          features: string[] | null
          highlight: string | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          highlight?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          highlight?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stops: {
        Row: {
          city: string
          created_at: string
          id: string
          name: string
          price_from_start: number
          route_id: string
          stop_order: number
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          name: string
          price_from_start?: number
          route_id: string
          stop_order: number
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          name?: string
          price_from_start?: number
          route_id?: string
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      system_status: {
        Row: {
          error_message: string | null
          id: string
          last_check: string
          latency_ms: number | null
          metadata: Json | null
          service_name: string
          status: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          last_check?: string
          latency_ms?: number | null
          metadata?: Json | null
          service_name: string
          status?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          last_check?: string
          latency_ms?: number | null
          metadata?: Json | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          arrival_time: string
          base_price: number
          bus_id: string
          created_at: string
          departure_date: string
          departure_time: string
          id: string
          is_active: boolean
          route_id: string
          updated_at: string
        }
        Insert: {
          arrival_time: string
          base_price: number
          bus_id: string
          created_at?: string
          departure_date: string
          departure_time: string
          id?: string
          is_active?: boolean
          route_id: string
          updated_at?: string
        }
        Update: {
          arrival_time?: string
          base_price?: number
          bus_id?: string
          created_at?: string
          departure_date?: string
          departure_time?: string
          id?: string
          is_active?: boolean
          route_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_positions: {
        Row: {
          bus_id: string
          created_at: string
          delay_minutes: number | null
          driver_name: string | null
          eta_next_stop: string | null
          heading: number | null
          id: string
          last_stop_id: string | null
          latitude: number
          longitude: number
          next_stop_id: string | null
          passenger_count: number | null
          speed_kmh: number | null
          status: string
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          bus_id: string
          created_at?: string
          delay_minutes?: number | null
          driver_name?: string | null
          eta_next_stop?: string | null
          heading?: number | null
          id?: string
          last_stop_id?: string | null
          latitude: number
          longitude: number
          next_stop_id?: string | null
          passenger_count?: number | null
          speed_kmh?: number | null
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          bus_id?: string
          created_at?: string
          delay_minutes?: number | null
          driver_name?: string | null
          eta_next_stop?: string | null
          heading?: number | null
          id?: string
          last_stop_id?: string | null
          latitude?: number
          longitude?: number
          next_stop_id?: string | null
          passenger_count?: number | null
          speed_kmh?: number | null
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_positions_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_positions_last_stop_id_fkey"
            columns: ["last_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_positions_next_stop_id_fkey"
            columns: ["next_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_positions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bookings_agent_view: {
        Row: {
          booked_by_agent_id: string | null
          created_at: string | null
          destination_stop_id: string | null
          extras: Json | null
          id: string | null
          origin_stop_id: string | null
          passenger_email: string | null
          passenger_first_name: string | null
          passenger_last_name: string | null
          passenger_phone: string | null
          price_paid: number | null
          seat_id: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          ticket_number: string | null
          trip_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booked_by_agent_id?: string | null
          created_at?: string | null
          destination_stop_id?: string | null
          extras?: Json | null
          id?: string | null
          origin_stop_id?: string | null
          passenger_email?: never
          passenger_first_name?: never
          passenger_last_name?: never
          passenger_phone?: never
          price_paid?: number | null
          seat_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          ticket_number?: string | null
          trip_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booked_by_agent_id?: string | null
          created_at?: string | null
          destination_stop_id?: string | null
          extras?: Json | null
          id?: string | null
          origin_stop_id?: string | null
          passenger_email?: never
          passenger_first_name?: never
          passenger_last_name?: never
          passenger_phone?: never
          price_paid?: number | null
          seat_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          ticket_number?: string | null
          trip_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_destination_stop_id_fkey"
            columns: ["destination_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_origin_stop_id_fkey"
            columns: ["origin_stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_agent_view: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: never
          first_name?: never
          id?: string | null
          last_name?: never
          phone?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: never
          first_name?: never
          id?: string | null
          last_name?: never
          phone?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_trip_price: {
        Args: {
          p_destination_stop_id: string
          p_origin_stop_id: string
          p_trip_id: string
        }
        Returns: number
      }
      check_seat_availability: {
        Args: {
          p_destination_stop_order: number
          p_origin_stop_order: number
          p_seat_id: string
          p_trip_id: string
        }
        Returns: boolean
      }
      cleanup_expired_holds: { Args: never; Returns: number }
      generate_inquiry_number: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      get_audit_logs: {
        Args: {
          p_action?: string
          p_limit?: number
          p_offset?: number
          p_table_name?: string
          p_user_id?: string
        }
        Returns: {
          action: string
          created_at: string
          details: Json
          id: string
          record_id: string
          record_identifier: string
          table_name: string
          user_email: string
          user_id: string
        }[]
      }
      get_bookings_for_agent: {
        Args: { p_limit?: number; p_offset?: number; p_status?: string }
        Returns: {
          booked_by_agent_id: string
          created_at: string
          destination_stop_id: string
          extras: Json
          id: string
          origin_stop_id: string
          passenger_email: string
          passenger_first_name: string
          passenger_last_name: string
          passenger_phone: string
          price_paid: number
          seat_id: string
          status: string
          ticket_number: string
          trip_id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_incident_counts: {
        Args: never
        Returns: {
          count: number
          severity: string
        }[]
      }
      get_scanner_stats_hourly: {
        Args: never
        Returns: {
          fraud_suspected: number
          invalid_scans: number
          total_scans: number
          valid_scans: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_pii_access: {
        Args: {
          p_action: string
          p_details?: Json
          p_record_id?: string
          p_record_identifier?: string
          p_table_name: string
        }
        Returns: string
      }
      mask_email: { Args: { email: string }; Returns: string }
      mask_name: { Args: { name: string }; Returns: string }
      mask_phone: { Args: { phone: string }; Returns: string }
      reveal_booking_pii: {
        Args: { p_booking_id: string }
        Returns: {
          created_at: string
          destination_stop_id: string
          id: string
          origin_stop_id: string
          passenger_email: string
          passenger_first_name: string
          passenger_last_name: string
          passenger_phone: string
          price_paid: number
          seat_id: string
          status: string
          ticket_number: string
          trip_id: string
        }[]
      }
      reveal_profile_pii: {
        Args: { p_profile_id: string }
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "customer" | "agent" | "admin"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      seat_status: "available" | "reserved" | "booked"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "agent", "admin"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      seat_status: ["available", "reserved", "booked"],
    },
  },
} as const
