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
    }
    Views: {
      [_ in never]: never
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
      generate_ticket_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
