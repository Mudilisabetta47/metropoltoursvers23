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
      admin_mail_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_mailbox: {
        Row: {
          body: string
          created_at: string
          folder: string
          id: string
          is_archived: boolean
          is_read: boolean
          is_starred: boolean
          recipient_email: string | null
          recipient_name: string | null
          replied_at: string | null
          reply_body: string | null
          sender_email: string | null
          sender_name: string | null
          source_id: string | null
          source_type: string
          subject: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          folder?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          is_starred?: boolean
          recipient_email?: string | null
          recipient_name?: string | null
          replied_at?: string | null
          reply_body?: string | null
          sender_email?: string | null
          sender_name?: string | null
          source_id?: string | null
          source_type?: string
          subject: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          folder?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          is_starred?: boolean
          recipient_email?: string | null
          recipient_name?: string | null
          replied_at?: string | null
          reply_body?: string | null
          sender_email?: string | null
          sender_name?: string | null
          source_id?: string | null
          source_type?: string
          subject?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          metadata: Json | null
          notification_type: string
          read_at: string | null
          recipient_id: string | null
          recipient_role: string | null
          severity: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          severity?: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          section_key: string
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          section_key: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          section_key?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
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
      automation_email_log: {
        Row: {
          booking_id: string | null
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          sent_at: string
          status: string
        }
        Insert: {
          booking_id?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          sent_at?: string
          status?: string
        }
        Update: {
          booking_id?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_email_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "tour_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_contracts: {
        Row: {
          b2b_customer_id: string
          conditions: Json | null
          contract_number: string
          created_at: string
          document_url: string | null
          id: string
          notes: string | null
          signed_at: string | null
          status: string
          title: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          b2b_customer_id: string
          conditions?: Json | null
          contract_number: string
          created_at?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          signed_at?: string | null
          status?: string
          title: string
          updated_at?: string
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          b2b_customer_id?: string
          conditions?: Json | null
          contract_number?: string
          created_at?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          signed_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      b2b_customers: {
        Row: {
          account_manager: string | null
          address: string | null
          city: string | null
          company_name: string
          contact_person: string | null
          country: string | null
          created_at: string
          credit_limit: number | null
          customer_number: string | null
          discount_percent: number | null
          email: string | null
          iban: string | null
          id: string
          invoice_frequency: string | null
          is_active: boolean
          notes: string | null
          payment_terms_days: number | null
          phone: string | null
          postal_code: string | null
          updated_at: string
          vat_id: string | null
        }
        Insert: {
          account_manager?: string | null
          address?: string | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          customer_number?: string | null
          discount_percent?: number | null
          email?: string | null
          iban?: string | null
          id?: string
          invoice_frequency?: string | null
          is_active?: boolean
          notes?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          vat_id?: string | null
        }
        Update: {
          account_manager?: string | null
          address?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          customer_number?: string | null
          discount_percent?: number | null
          email?: string | null
          iban?: string | null
          id?: string
          invoice_frequency?: string | null
          is_active?: boolean
          notes?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          vat_id?: string | null
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
      bus_maintenance: {
        Row: {
          bus_id: string
          completed_date: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          maintenance_type: string
          notes: string | null
          status: string
          title: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          bus_id: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          maintenance_type?: string
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          bus_id?: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          maintenance_type?: string
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_maintenance_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
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
      complaint_messages: {
        Row: {
          attachments: Json | null
          author_id: string | null
          author_type: string
          complaint_id: string
          created_at: string
          id: string
          is_internal: boolean | null
          message: string
        }
        Insert: {
          attachments?: Json | null
          author_id?: string | null
          author_type?: string
          complaint_id: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message: string
        }
        Update: {
          attachments?: Json | null
          author_id?: string | null
          author_type?: string
          complaint_id?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          assigned_to: string | null
          booking_id: string | null
          category: string
          channel: string | null
          created_at: string
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          description: string
          first_response_at: string | null
          id: string
          internal_notes: string | null
          refund_amount: number | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          sla_due_at: string
          status: string
          subject: string
          ticket_number: string
          tour_booking_id: string | null
          updated_at: string
          voucher_code: string | null
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          category: string
          channel?: string | null
          created_at?: string
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          description: string
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          refund_amount?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          sla_due_at?: string
          status?: string
          subject: string
          ticket_number: string
          tour_booking_id?: string | null
          updated_at?: string
          voucher_code?: string | null
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          category?: string
          channel?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          refund_amount?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          sla_due_at?: string
          status?: string
          subject?: string
          ticket_number?: string
          tour_booking_id?: string | null
          updated_at?: string
          voucher_code?: string | null
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
      coupons: {
        Row: {
          amount_off: number | null
          code: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_redemptions: number | null
          min_amount: number | null
          percent_off: number | null
          stripe_coupon_id: string | null
          times_redeemed: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          amount_off?: number | null
          code: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          min_amount?: number | null
          percent_off?: number | null
          stripe_coupon_id?: string | null
          times_redeemed?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          amount_off?: number | null
          code?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          min_amount?: number | null
          percent_off?: number | null
          stripe_coupon_id?: string | null
          times_redeemed?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      depots: {
        Row: {
          address: string | null
          capacity_buses: number | null
          city: string
          code: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity_buses?: number | null
          city: string
          code: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity_buses?: number | null
          city?: string
          code?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      driver_licenses: {
        Row: {
          adr_certificate: boolean | null
          created_at: string
          document_url: string | null
          driver_id: string
          expires_at: string
          id: string
          issued_by: string | null
          issued_date: string | null
          license_class: string
          license_number: string
          module_95_expires: string | null
          module_95_number: string | null
          notes: string | null
          reminder_days: number | null
          updated_at: string
        }
        Insert: {
          adr_certificate?: boolean | null
          created_at?: string
          document_url?: string | null
          driver_id: string
          expires_at: string
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          license_class: string
          license_number: string
          module_95_expires?: string | null
          module_95_number?: string | null
          notes?: string | null
          reminder_days?: number | null
          updated_at?: string
        }
        Update: {
          adr_certificate?: boolean | null
          created_at?: string
          document_url?: string | null
          driver_id?: string
          expires_at?: string
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          license_class?: string
          license_number?: string
          module_95_expires?: string | null
          module_95_number?: string | null
          notes?: string | null
          reminder_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      driver_messages: {
        Row: {
          created_at: string
          id: string
          is_broadcast: boolean
          message: string
          priority: string
          read_at: string | null
          recipient_id: string | null
          recipient_role: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_broadcast?: boolean
          message: string
          priority?: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          created_at?: string
          id?: string
          is_broadcast?: boolean
          message?: string
          priority?: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_role?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      driver_navigation: {
        Row: {
          created_at: string
          destination_address: string | null
          destination_lat: number
          destination_lng: number
          destination_name: string
          driver_user_id: string
          id: string
          notes: string | null
          sent_by: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_address?: string | null
          destination_lat: number
          destination_lng: number
          destination_name: string
          driver_user_id: string
          id?: string
          notes?: string | null
          sent_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_address?: string | null
          destination_lat?: number
          destination_lng?: number
          destination_name?: string
          driver_user_id?: string
          id?: string
          notes?: string | null
          sent_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_trainings: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          cost: number | null
          created_at: string
          driver_id: string
          expires_at: string | null
          hours: number | null
          id: string
          notes: string | null
          passed: boolean | null
          provider: string | null
          title: string
          training_type: string
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          driver_id: string
          expires_at?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          passed?: boolean | null
          provider?: string | null
          title: string
          training_type: string
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          driver_id?: string
          expires_at?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          passed?: boolean | null
          provider?: string | null
          title?: string
          training_type?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      employee_shifts: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          assigned_bus_id: string | null
          assigned_trip_id: string | null
          break_duration_minutes: number | null
          break_start: string | null
          created_at: string
          depot_id: string | null
          dispatch_location: string | null
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
          break_duration_minutes?: number | null
          break_start?: string | null
          created_at?: string
          depot_id?: string | null
          dispatch_location?: string | null
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
          break_duration_minutes?: number | null
          break_start?: string | null
          created_at?: string
          depot_id?: string | null
          dispatch_location?: string | null
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
          {
            foreignKeyName: "employee_shifts_depot_id_fkey"
            columns: ["depot_id"]
            isOneToOne: false
            referencedRelation: "depots"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          bus_id: string | null
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          net_amount: number
          notes: string | null
          payment_method: string | null
          receipt_filename: string | null
          receipt_url: string | null
          recorded_by: string | null
          status: string
          tax_amount: number
          tax_rate: number
          trip_id: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          bus_id?: string | null
          category?: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          net_amount?: number
          notes?: string | null
          payment_method?: string | null
          receipt_filename?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          status?: string
          tax_amount?: number
          tax_rate?: number
          trip_id?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          bus_id?: string | null
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          net_amount?: number
          notes?: string | null
          payment_method?: string | null
          receipt_filename?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          status?: string
          tax_amount?: number
          tax_rate?: number
          trip_id?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_compliance: {
        Row: {
          bus_id: string
          certificate_number: string | null
          compliance_type: string
          cost: number | null
          created_at: string
          document_url: string | null
          due_date: string
          id: string
          inspector: string | null
          last_check_date: string | null
          notes: string | null
          reminder_days: number
          status: string
          updated_at: string
        }
        Insert: {
          bus_id: string
          certificate_number?: string | null
          compliance_type: string
          cost?: number | null
          created_at?: string
          document_url?: string | null
          due_date: string
          id?: string
          inspector?: string | null
          last_check_date?: string | null
          notes?: string | null
          reminder_days?: number
          status?: string
          updated_at?: string
        }
        Update: {
          bus_id?: string
          certificate_number?: string | null
          compliance_type?: string
          cost?: number | null
          created_at?: string
          document_url?: string | null
          due_date?: string
          id?: string
          inspector?: string | null
          last_check_date?: string | null
          notes?: string | null
          reminder_days?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fuel_log: {
        Row: {
          bus_id: string
          country: string | null
          created_at: string
          driver_id: string | null
          fuel_card: string | null
          fuel_type: string
          id: string
          liters: number
          notes: string | null
          odometer_km: number | null
          price_per_liter: number
          receipt_url: string | null
          refuel_date: string
          station_name: string | null
          total_cost: number
          trip_id: string | null
        }
        Insert: {
          bus_id: string
          country?: string | null
          created_at?: string
          driver_id?: string | null
          fuel_card?: string | null
          fuel_type?: string
          id?: string
          liters: number
          notes?: string | null
          odometer_km?: number | null
          price_per_liter: number
          receipt_url?: string | null
          refuel_date?: string
          station_name?: string | null
          total_cost: number
          trip_id?: string | null
        }
        Update: {
          bus_id?: string
          country?: string | null
          created_at?: string
          driver_id?: string | null
          fuel_card?: string | null
          fuel_type?: string
          id?: string
          liters?: number
          notes?: string | null
          odometer_km?: number | null
          price_per_liter?: number
          receipt_url?: string | null
          refuel_date?: string
          station_name?: string | null
          total_cost?: number
          trip_id?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          escalated_at: string | null
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          sla_due_at: string | null
          sop_progress: Json | null
          sop_template_id: string | null
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
          escalated_at?: string | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          sla_due_at?: string | null
          sop_progress?: Json | null
          sop_template_id?: string | null
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
          escalated_at?: string | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          sla_due_at?: string | null
          sop_progress?: Json | null
          sop_template_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          desired_salary: string | null
          earliest_start_date: string | null
          email: string
          experience_years: string | null
          first_name: string
          how_found_us: string | null
          id: string
          internal_notes: string | null
          is_read: boolean
          job_listing_id: string | null
          last_name: string
          message: string | null
          phone: string | null
          postal_code: string | null
          resume_filename: string | null
          resume_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          desired_salary?: string | null
          earliest_start_date?: string | null
          email: string
          experience_years?: string | null
          first_name: string
          how_found_us?: string | null
          id?: string
          internal_notes?: string | null
          is_read?: boolean
          job_listing_id?: string | null
          last_name: string
          message?: string | null
          phone?: string | null
          postal_code?: string | null
          resume_filename?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          desired_salary?: string | null
          earliest_start_date?: string | null
          email?: string
          experience_years?: string | null
          first_name?: string
          how_found_us?: string | null
          id?: string
          internal_notes?: string | null
          is_read?: boolean
          job_listing_id?: string | null
          last_name?: string
          message?: string | null
          phone?: string | null
          postal_code?: string | null
          resume_filename?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          benefits: string[]
          created_at: string
          department: string
          description: string | null
          employment_type: string
          id: string
          is_active: boolean
          location: string
          requirements: string[]
          salary_range: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          benefits?: string[]
          created_at?: string
          department?: string
          description?: string | null
          employment_type?: string
          id?: string
          is_active?: boolean
          location?: string
          requirements?: string[]
          salary_range?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          benefits?: string[]
          created_at?: string
          department?: string
          description?: string | null
          employment_type?: string
          id?: string
          is_active?: boolean
          location?: string
          requirements?: string[]
          salary_range?: string | null
          sort_order?: number
          title?: string
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
      ops_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          priority: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          priority?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          priority?: string
          user_id?: string
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
          category: string | null
          country: string
          created_at: string
          current_participants: number | null
          departure_date: string
          description: string | null
          destination: string
          discount_percent: number | null
          documents_required: string | null
          duration_days: number
          gallery_images: string[] | null
          hero_image_url: string | null
          highlights: string[] | null
          id: string
          image_url: string | null
          included_services: string[] | null
          insurance_info: string | null
          is_active: boolean | null
          is_featured: boolean | null
          itinerary: Json | null
          location: string
          max_participants: number | null
          meta_description: string | null
          meta_title: string | null
          min_participants: number | null
          price_from: number
          publish_status: string | null
          published_at: string | null
          return_date: string
          short_description: string | null
          slug: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          country?: string
          created_at?: string
          current_participants?: number | null
          departure_date: string
          description?: string | null
          destination: string
          discount_percent?: number | null
          documents_required?: string | null
          duration_days?: number
          gallery_images?: string[] | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          included_services?: string[] | null
          insurance_info?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          location: string
          max_participants?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_participants?: number | null
          price_from: number
          publish_status?: string | null
          published_at?: string | null
          return_date: string
          short_description?: string | null
          slug?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          country?: string
          created_at?: string
          current_participants?: number | null
          departure_date?: string
          description?: string | null
          destination?: string
          discount_percent?: number | null
          documents_required?: string | null
          duration_days?: number
          gallery_images?: string[] | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          included_services?: string[] | null
          insurance_info?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          location?: string
          max_participants?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_participants?: number | null
          price_from?: number
          publish_status?: string | null
          published_at?: string | null
          return_date?: string
          short_description?: string | null
          slug?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      passenger_data_tokens: {
        Row: {
          booking_id: string
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          booking_id: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Update: {
          booking_id?: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "passenger_data_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "tour_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          description: string | null
          driver_id: string
          entry_date: string
          export_batch: string | null
          exported_at: string | null
          hours: number | null
          id: string
          notes: string | null
          receipt_url: string | null
          shift_id: string | null
          status: string
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          description?: string | null
          driver_id: string
          entry_date?: string
          export_batch?: string | null
          exported_at?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          receipt_url?: string | null
          shift_id?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          description?: string | null
          driver_id?: string
          entry_date?: string
          export_batch?: string | null
          exported_at?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          receipt_url?: string | null
          shift_id?: string | null
          status?: string
          trip_id?: string | null
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
      scan_logs: {
        Row: {
          booking_id: string | null
          id: string
          message: string | null
          qr_payload: string | null
          result: string
          scan_time: string
          ticket_id: string | null
          trip_id: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          id?: string
          message?: string | null
          qr_payload?: string | null
          result?: string
          scan_time?: string
          ticket_id?: string | null
          trip_id?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          id?: string
          message?: string | null
          qr_payload?: string | null
          result?: string
          scan_time?: string
          ticket_id?: string | null
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_agent_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
      shift_handovers: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          notes: string | null
          open_issues: string | null
          shift_date: string
          status: string
          summary: string
          to_user_id: string | null
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          notes?: string | null
          open_issues?: string | null
          shift_date?: string
          status?: string
          summary: string
          to_user_id?: string | null
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          notes?: string | null
          open_issues?: string | null
          shift_date?: string
          status?: string
          summary?: string
          to_user_id?: string | null
        }
        Relationships: []
      }
      sop_templates: {
        Row: {
          auto_escalate_minutes: number | null
          created_at: string
          description: string | null
          escalate_to_role: string | null
          id: string
          incident_type: string
          is_active: boolean
          name: string
          severity: string | null
          steps: Json
          updated_at: string
        }
        Insert: {
          auto_escalate_minutes?: number | null
          created_at?: string
          description?: string | null
          escalate_to_role?: string | null
          id?: string
          incident_type: string
          is_active?: boolean
          name: string
          severity?: string | null
          steps?: Json
          updated_at?: string
        }
        Update: {
          auto_escalate_minutes?: number | null
          created_at?: string
          description?: string | null
          escalate_to_role?: string | null
          id?: string
          incident_type?: string
          is_active?: boolean
          name?: string
          severity?: string | null
          steps?: Json
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
      tickets: {
        Row: {
          booking_id: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          id: string
          qr_payload: string
          status: string
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          id?: string
          qr_payload: string
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          id?: string
          qr_payload?: string
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_agent_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      toll_accounts: {
        Row: {
          account_number: string
          bus_id: string | null
          contract_end: string | null
          contract_start: string | null
          country: string
          created_at: string
          current_balance: number | null
          device_id: string | null
          id: string
          is_active: boolean
          low_balance_threshold: number | null
          monthly_fee: number | null
          notes: string | null
          provider: string
          updated_at: string
        }
        Insert: {
          account_number: string
          bus_id?: string | null
          contract_end?: string | null
          contract_start?: string | null
          country?: string
          created_at?: string
          current_balance?: number | null
          device_id?: string | null
          id?: string
          is_active?: boolean
          low_balance_threshold?: number | null
          monthly_fee?: number | null
          notes?: string | null
          provider: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          bus_id?: string | null
          contract_end?: string | null
          contract_start?: string | null
          country?: string
          created_at?: string
          current_balance?: number | null
          device_id?: string | null
          id?: string
          is_active?: boolean
          low_balance_threshold?: number | null
          monthly_fee?: number | null
          notes?: string | null
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      tour_booking_audit: {
        Row: {
          action: string
          booking_id: string
          created_at: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          performed_by: string | null
          performed_by_email: string | null
        }
        Insert: {
          action: string
          booking_id: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
          performed_by_email?: string | null
        }
        Update: {
          action?: string
          booking_id?: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
          performed_by_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_booking_audit_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "tour_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_booking_insurance: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          insured_persons: Json | null
          is_active: boolean
          notes: string | null
          policy_number: string | null
          policy_pdf_url: string | null
          policy_status: string
          price: number | null
          product: string | null
          provider: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          insured_persons?: Json | null
          is_active?: boolean
          notes?: string | null
          policy_number?: string | null
          policy_pdf_url?: string | null
          policy_status?: string
          price?: number | null
          product?: string | null
          provider?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          insured_persons?: Json | null
          is_active?: boolean
          notes?: string | null
          policy_number?: string | null
          policy_pdf_url?: string | null
          policy_status?: string
          price?: number | null
          product?: string | null
          provider?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_booking_insurance_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "tour_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_bookings: {
        Row: {
          base_price: number
          booking_number: string
          booking_type: string
          contact_email: string
          contact_first_name: string
          contact_last_name: string
          contact_phone: string | null
          created_at: string
          customer_notes: string | null
          discount_amount: number | null
          discount_code: string | null
          id: string
          internal_notes: string | null
          luggage_addons: Json | null
          paid_at: string | null
          participants: number
          passenger_details: Json
          payment_method: string | null
          payment_reference: string | null
          pickup_stop_id: string | null
          pickup_surcharge: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tariff_id: string
          total_price: number
          tour_date_id: string
          tour_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          base_price: number
          booking_number?: string
          booking_type?: string
          contact_email: string
          contact_first_name: string
          contact_last_name: string
          contact_phone?: string | null
          created_at?: string
          customer_notes?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          id?: string
          internal_notes?: string | null
          luggage_addons?: Json | null
          paid_at?: string | null
          participants?: number
          passenger_details?: Json
          payment_method?: string | null
          payment_reference?: string | null
          pickup_stop_id?: string | null
          pickup_surcharge?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tariff_id: string
          total_price: number
          tour_date_id: string
          tour_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          base_price?: number
          booking_number?: string
          booking_type?: string
          contact_email?: string
          contact_first_name?: string
          contact_last_name?: string
          contact_phone?: string | null
          created_at?: string
          customer_notes?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          id?: string
          internal_notes?: string | null
          luggage_addons?: Json | null
          paid_at?: string | null
          participants?: number
          passenger_details?: Json
          payment_method?: string | null
          payment_reference?: string | null
          pickup_stop_id?: string | null
          pickup_surcharge?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tariff_id?: string
          total_price?: number
          tour_date_id?: string
          tour_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_bookings_pickup_stop_id_fkey"
            columns: ["pickup_stop_id"]
            isOneToOne: false
            referencedRelation: "tour_pickup_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_bookings_tariff_id_fkey"
            columns: ["tariff_id"]
            isOneToOne: false
            referencedRelation: "tour_tariffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_bookings_tour_date_id_fkey"
            columns: ["tour_date_id"]
            isOneToOne: false
            referencedRelation: "tour_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "package_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_combination_members: {
        Row: {
          combination_id: string
          created_at: string
          id: string
          sort_order: number
          tour_id: string
        }
        Insert: {
          combination_id: string
          created_at?: string
          id?: string
          sort_order?: number
          tour_id: string
        }
        Update: {
          combination_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_combination_members_combination_id_fkey"
            columns: ["combination_id"]
            isOneToOne: false
            referencedRelation: "tour_combinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_combination_members_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "package_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_combinations: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tour_customer_notes: {
        Row: {
          created_at: string
          created_by: string | null
          customer_email: string
          id: string
          note: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_email: string
          id?: string
          note: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_email?: string
          id?: string
          note?: string
        }
        Relationships: []
      }
      tour_dates: {
        Row: {
          booked_seats: number
          created_at: string
          departure_date: string
          duration_days: number | null
          early_bird_deadline: string | null
          early_bird_discount_percent: number | null
          id: string
          is_active: boolean
          notes: string | null
          price_basic: number
          price_business: number | null
          price_flex: number | null
          price_smart: number | null
          promo_code: string | null
          promo_discount_percent: number | null
          return_date: string
          status: string
          total_seats: number
          tour_id: string
          updated_at: string
        }
        Insert: {
          booked_seats?: number
          created_at?: string
          departure_date: string
          duration_days?: number | null
          early_bird_deadline?: string | null
          early_bird_discount_percent?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          price_basic: number
          price_business?: number | null
          price_flex?: number | null
          price_smart?: number | null
          promo_code?: string | null
          promo_discount_percent?: number | null
          return_date: string
          status?: string
          total_seats?: number
          tour_id: string
          updated_at?: string
        }
        Update: {
          booked_seats?: number
          created_at?: string
          departure_date?: string
          duration_days?: number | null
          early_bird_deadline?: string | null
          early_bird_discount_percent?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          price_basic?: number
          price_business?: number | null
          price_flex?: number | null
          price_smart?: number | null
          promo_code?: string | null
          promo_discount_percent?: number | null
          return_date?: string
          status?: string
          total_seats?: number
          tour_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_dates_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "package_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_document_sends: {
        Row: {
          booking_id: string
          created_at: string
          document_type: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_by: string | null
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          document_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_by?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          document_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_document_sends_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "tour_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_email_templates: {
        Row: {
          body_html: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      tour_extras: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          max_per_booking: number
          name: string
          price: number
          price_type: string
          sort_order: number
          tour_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          max_per_booking?: number
          name: string
          price?: number
          price_type?: string
          sort_order?: number
          tour_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          max_per_booking?: number
          name?: string
          price?: number
          price_type?: string
          sort_order?: number
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_extras_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "package_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_inclusions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          sort_order: number
          title: string
          tour_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          sort_order?: number
          title: string
          tour_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          sort_order?: number
          title?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_inclusions_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "package_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_invoices: {
        Row: {
          amount: number
          booking_id: string
          cancelled_at: string | null
          created_at: string
          id: string
          invoice_number: string
          issued_at: string | null
          net_amount: number
          notes: string | null
          paid_at: string | null
          status: string
          tax_amount: number
          tax_rate: number
        }
        Insert: {
          amount: number
          booking_id: string
          cancelled_at?: string | null
          created_at?: string
          id?: string
          invoice_number: string
          issued_at?: string | null
          net_amount?: number
          notes?: string | null
          paid_at?: string | null
          status?: string
          tax_amount?: number
          tax_rate?: number
        }
        Update: {
          amount?: number
          booking_id?: string
          cancelled_at?: string | null
          created_at?: string
          id?: string
          invoice_number?: string
          issued_at?: string | null
          net_amount?: number
          notes?: string | null
          paid_at?: string | null
          status?: string
          tax_amount?: number
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "tour_invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "tour_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_legal: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          section_key: string
          sort_order: number
          title: string
          tour_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          section_key: string
          sort_order?: number
          title: string
          tour_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          section_key?: string
          sort_order?: number
          title?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_legal_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "package_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_legal_documents: {
        Row: {
          content: string | null
          created_at: string
          document_type: string
          file_url: string | null
          id: string
          is_current: boolean
          title: string
          valid_from: string | null
          version: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          document_type: string
          file_url?: string | null
          id?: string
          is_current?: boolean
          title: string
          valid_from?: string | null
          version?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          document_type?: string
          file_url?: string | null
          id?: string
          is_current?: boolean
          title?: string
          valid_from?: string | null
          version?: string
        }
        Relationships: []
      }
      tour_luggage_addons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_per_booking: number
          name: string
          price: number
          tour_id: string
          weight_limit_kg: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_per_booking?: number
          name: string
          price: number
          tour_id: string
          weight_limit_kg?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_per_booking?: number
          name?: string
          price?: number
          tour_id?: string
          weight_limit_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_luggage_addons_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "package_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_offer_items: {
        Row: {
          created_at: string
          description: string
          id: string
          offer_id: string
          quantity: number
          sort_order: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          offer_id: string
          quantity?: number
          sort_order?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          offer_id?: string
          quantity?: number
          sort_order?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "tour_offer_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "tour_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_offers: {
        Row: {
          created_at: string
          created_by: string | null
          customer_email: string
          customer_name: string
          departure_date: string | null
          destination: string
          discount_amount: number | null
          discount_percent: number | null
          id: string
          inquiry_id: string | null
          notes: string | null
          offer_number: string
          participants: number
          status: string
          subtotal: number
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_email: string
          customer_name: string
          departure_date?: string | null
          destination: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          inquiry_id?: string | null
          notes?: string | null
          offer_number?: string
          participants?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_email?: string
          customer_name?: string
          departure_date?: string | null
          destination?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          inquiry_id?: string | null
          notes?: string | null
          offer_number?: string
          participants?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_offers_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "package_tour_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_payment_entries: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          method: string
          note: string | null
          recorded_at: string
          recorded_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          recorded_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          recorded_at?: string
          recorded_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_payment_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "tour_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_pickup_stops: {
        Row: {
          address: string | null
          arrival_offset_minutes: number | null
          city: string
          created_at: string
          departure_time: string
          id: string
          is_active: boolean
          location_name: string
          max_passengers: number | null
          meeting_point: string | null
          notes: string | null
          route_id: string
          sort_order: number
          surcharge: number
        }
        Insert: {
          address?: string | null
          arrival_offset_minutes?: number | null
          city: string
          created_at?: string
          departure_time: string
          id?: string
          is_active?: boolean
          location_name: string
          max_passengers?: number | null
          meeting_point?: string | null
          notes?: string | null
          route_id: string
          sort_order?: number
          surcharge?: number
        }
        Update: {
          address?: string | null
          arrival_offset_minutes?: number | null
          city?: string
          created_at?: string
          departure_time?: string
          id?: string
          is_active?: boolean
          location_name?: string
          max_passengers?: number | null
          meeting_point?: string | null
          notes?: string | null
          route_id?: string
          sort_order?: number
          surcharge?: number
        }
        Relationships: [
          {
            foreignKeyName: "tour_pickup_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "tour_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_routes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          distance_km: number | null
          duration_hours: number | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          tour_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          distance_km?: number | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          tour_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          distance_km?: number | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_routes_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "package_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_tariffs: {
        Row: {
          cancellation_days: number | null
          cancellation_fee_percent: number | null
          created_at: string
          hand_luggage_only: boolean
          id: string
          included_features: string[] | null
          is_active: boolean
          is_recommended: boolean
          is_refundable: boolean
          name: string
          price_modifier: number
          seat_reservation: boolean
          slug: string
          sort_order: number
          suitcase_included: boolean
          suitcase_weight_kg: number | null
          tour_id: string
          updated_at: string
        }
        Insert: {
          cancellation_days?: number | null
          cancellation_fee_percent?: number | null
          created_at?: string
          hand_luggage_only?: boolean
          id?: string
          included_features?: string[] | null
          is_active?: boolean
          is_recommended?: boolean
          is_refundable?: boolean
          name: string
          price_modifier?: number
          seat_reservation?: boolean
          slug: string
          sort_order?: number
          suitcase_included?: boolean
          suitcase_weight_kg?: number | null
          tour_id: string
          updated_at?: string
        }
        Update: {
          cancellation_days?: number | null
          cancellation_fee_percent?: number | null
          created_at?: string
          hand_luggage_only?: boolean
          id?: string
          included_features?: string[] | null
          is_active?: boolean
          is_recommended?: boolean
          is_refundable?: boolean
          name?: string
          price_modifier?: number
          seat_reservation?: boolean
          slug?: string
          sort_order?: number
          suitcase_included?: boolean
          suitcase_weight_kg?: number | null
          tour_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_tariffs_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "package_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_otp_log: {
        Row: {
          actual_arrival: string | null
          actual_departure: string | null
          delay_minutes: number | null
          delay_reason: string | null
          id: string
          recorded_at: string
          scheduled_arrival: string | null
          scheduled_departure: string
          trip_id: string
        }
        Insert: {
          actual_arrival?: string | null
          actual_departure?: string | null
          delay_minutes?: number | null
          delay_reason?: string | null
          id?: string
          recorded_at?: string
          scheduled_arrival?: string | null
          scheduled_departure: string
          trip_id: string
        }
        Update: {
          actual_arrival?: string | null
          actual_departure?: string | null
          delay_minutes?: number | null
          delay_reason?: string | null
          id?: string
          recorded_at?: string
          scheduled_arrival?: string | null
          scheduled_departure?: string
          trip_id?: string
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
      vehicle_damages: {
        Row: {
          actual_cost: number | null
          bus_id: string
          created_at: string
          damage_date: string
          damage_type: string
          description: string
          documents: Json | null
          driver_id: string | null
          estimated_cost: number | null
          id: string
          insurance_claim_number: string | null
          insurance_reported_at: string | null
          location: string | null
          notes: string | null
          photos: Json | null
          police_report_number: string | null
          reported_by: string | null
          resolved_at: string | null
          severity: string
          status: string
          third_party_involved: boolean | null
          trip_id: string | null
          updated_at: string
          workshop_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          bus_id: string
          created_at?: string
          damage_date?: string
          damage_type: string
          description: string
          documents?: Json | null
          driver_id?: string | null
          estimated_cost?: number | null
          id?: string
          insurance_claim_number?: string | null
          insurance_reported_at?: string | null
          location?: string | null
          notes?: string | null
          photos?: Json | null
          police_report_number?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          third_party_involved?: boolean | null
          trip_id?: string | null
          updated_at?: string
          workshop_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          bus_id?: string
          created_at?: string
          damage_date?: string
          damage_type?: string
          description?: string
          documents?: Json | null
          driver_id?: string | null
          estimated_cost?: number | null
          id?: string
          insurance_claim_number?: string | null
          insurance_reported_at?: string | null
          location?: string | null
          notes?: string | null
          photos?: Json | null
          police_report_number?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          third_party_involved?: boolean | null
          trip_id?: string | null
          updated_at?: string
          workshop_id?: string | null
        }
        Relationships: []
      }
      vehicle_positions: {
        Row: {
          bus_id: string
          created_at: string
          delay_minutes: number | null
          driver_name: string | null
          driver_user_id: string | null
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
          driver_user_id?: string | null
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
          driver_user_id?: string | null
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
      vignettes: {
        Row: {
          bus_id: string
          country: string
          created_at: string
          document_url: string | null
          id: string
          notes: string | null
          price: number | null
          reminder_days: number | null
          serial_number: string | null
          valid_from: string
          valid_until: string
          vignette_type: string | null
        }
        Insert: {
          bus_id: string
          country: string
          created_at?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          reminder_days?: number | null
          serial_number?: string | null
          valid_from: string
          valid_until: string
          vignette_type?: string | null
        }
        Update: {
          bus_id?: string
          country?: string
          created_at?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          reminder_days?: number | null
          serial_number?: string | null
          valid_from?: string
          valid_until?: string
          vignette_type?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          error_message: string | null
          event_id: string
          id: string
          payload: Json | null
          response_body: string | null
          retry_count: number
          sent_at: string
          status_code: number | null
          success: boolean
          ticket_id: string | null
          url: string
        }
        Insert: {
          error_message?: string | null
          event_id?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          retry_count?: number
          sent_at?: string
          status_code?: number | null
          success?: boolean
          ticket_id?: string | null
          url: string
        }
        Update: {
          error_message?: string | null
          event_id?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          retry_count?: number
          sent_at?: string
          status_code?: number | null
          success?: boolean
          ticket_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      weekend_trips: {
        Row: {
          base_price: number
          country: string
          created_at: string
          departure_city: string
          departure_point: string | null
          destination: string
          distance: string | null
          duration: string | null
          full_description: string | null
          gallery_images: string[] | null
          hero_image_url: string | null
          highlights: string[] | null
          id: string
          image_url: string | null
          inclusions: string[] | null
          is_active: boolean
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          not_included: string[] | null
          route_id: string | null
          short_description: string | null
          slug: string
          sort_order: number
          tags: string[] | null
          updated_at: string
          via_stops: Json | null
        }
        Insert: {
          base_price?: number
          country?: string
          created_at?: string
          departure_city?: string
          departure_point?: string | null
          destination: string
          distance?: string | null
          duration?: string | null
          full_description?: string | null
          gallery_images?: string[] | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          inclusions?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          not_included?: string[] | null
          route_id?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          tags?: string[] | null
          updated_at?: string
          via_stops?: Json | null
        }
        Update: {
          base_price?: number
          country?: string
          created_at?: string
          departure_city?: string
          departure_point?: string | null
          destination?: string
          distance?: string | null
          duration?: string | null
          full_description?: string | null
          gallery_images?: string[] | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          inclusions?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          not_included?: string[] | null
          route_id?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          tags?: string[] | null
          updated_at?: string
          via_stops?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "weekend_trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          contract_end: string | null
          contract_start: string | null
          country: string | null
          created_at: string
          email: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          is_certified: boolean | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          rating: number | null
          specializations: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          contract_end?: string | null
          contract_start?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          is_certified?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          specializations?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          contract_end?: string | null
          contract_start?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          is_certified?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          specializations?: string[] | null
          updated_at?: string
        }
        Relationships: []
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
      complete_passenger_token: { Args: { p_token: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_complaint_number: { Args: never; Returns: string }
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
      get_passenger_token: {
        Args: { p_token: string }
        Returns: {
          booking_id: string
          completed_at: string
          created_at: string
          expires_at: string
          id: string
          token: string
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
      get_user_email: { Args: { _user_id: string }; Returns: string }
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
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reserve_tour_seats: {
        Args: { p_seats: number; p_tour_date_id: string }
        Returns: boolean
      }
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
      app_role: "customer" | "agent" | "admin" | "office" | "driver"
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
      app_role: ["customer", "agent", "admin", "office", "driver"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      seat_status: ["available", "reserved", "booked"],
    },
  },
} as const
