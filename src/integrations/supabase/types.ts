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
      agendamentos: {
        Row: {
          id: string
          unidade_id: string
          cliente_id: string
          servico_id: string
          data: string
          horario: string
          status: string
          valor: number | null
          obs: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          unidade_id: string
          cliente_id: string
          servico_id: string
          data: string
          horario: string
          status?: string
          valor?: number | null
          obs?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          unidade_id?: string
          cliente_id?: string
          servico_id?: string
          data?: string
          horario?: string
          status?: string
          valor?: number | null
          obs?: string | null
          criado_em?: string
        }
        Relationships: []
      }
      appointment_pets: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          pet_breed: string | null
          pet_id: string
          pet_name: string
          pet_size: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          pet_breed?: string | null
          pet_id: string
          pet_name: string
          pet_size?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          pet_breed?: string | null
          pet_id?: string
          pet_name?: string
          pet_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_pets_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancel_reason: string | null
          completed_at: string | null
          created_at: string
          customer_id: string
          date: string
          id: string
          notes: string | null
          origin: string | null
          payment_amount: number | null
          payment_method: string | null
          payment_status: string | null
          petshop_id: string
          price: number | null
          service_id: string | null
          service_name: string
          status: string
          time: string
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          date: string
          id?: string
          notes?: string | null
          origin?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          petshop_id: string
          price?: number | null
          service_id?: string | null
          service_name: string
          status?: string
          time: string
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          notes?: string | null
          origin?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          petshop_id?: string
          price?: number | null
          service_id?: string | null
          service_name?: string
          status?: string
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json | null
          entity: string | null
          field: string | null
          id: string
          new_value: string | null
          old_value: string | null
          target_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json | null
          entity?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json | null
          entity?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          target_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          id: string
          nome: string
          telefone: string | null
          email: string | null
          endereco: string | null
          tags: string[] | null
          data_cadastro: string
          session_version: number
        }
        Insert: {
          id?: string
          nome: string
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          tags?: string[] | null
          data_cadastro?: string
          session_version?: number
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          tags?: string[] | null
          data_cadastro?: string
          session_version?: number
        }
        Relationships: []
      }
      configuracoes_agente: {
        Row: {
          id: string
          chave: string
          valor: string
          descricao: string | null
        }
        Insert: {
          id?: string
          chave: string
          valor: string
          descricao?: string | null
        }
        Update: {
          id?: string
          chave?: string
          valor?: string
          descricao?: string | null
        }
        Relationships: []
      }
      customer_packages: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          observation: string | null
          package_id: string | null
          pet_id: string | null
          petshop_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          observation?: string | null
          package_id?: string | null
          pet_id?: string | null
          petshop_id: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          observation?: string | null
          package_id?: string | null
          pet_id?: string | null
          petshop_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_packages_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_packages_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_preferences: {
        Row: {
          created_at: string
          id: string
          modules: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          modules?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          modules?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          petshop_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description: string
          id?: string
          petshop_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          petshop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          key: string
          petshop_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          key: string
          petshop_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          key?: string
          petshop_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          max_photos: number
          name: string
          petshop_id: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          max_photos?: number
          name: string
          petshop_id: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          max_photos?: number
          name?: string
          petshop_id?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_categories_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          photo_id: string
          user_avatar_url: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          photo_id: string
          user_avatar_url?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          photo_id?: string
          user_avatar_url?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "gallery_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_likes: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "gallery_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          alt: string | null
          caption: string | null
          category: string | null
          created_at: string
          id: string
          moderation_status: string
          owner_name: string | null
          pet_name: string | null
          petshop_id: string
          source: string | null
          submitted_by_name: string | null
          submitted_by_user_id: string | null
          url: string
        }
        Insert: {
          alt?: string | null
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          moderation_status?: string
          owner_name?: string | null
          pet_name?: string | null
          petshop_id: string
          source?: string | null
          submitted_by_name?: string | null
          submitted_by_user_id?: string | null
          url: string
        }
        Update: {
          alt?: string | null
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          moderation_status?: string
          owner_name?: string | null
          pet_name?: string | null
          petshop_id?: string
          source?: string | null
          submitted_by_name?: string | null
          submitted_by_user_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          category: string
          created_at: string
          id: string
          min_quantity: number
          name: string
          petshop_id: string
          purchase_price: number
          quantity: number
          sale_price: number
          supplier: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          min_quantity?: number
          name: string
          petshop_id: string
          purchase_price?: number
          quantity?: number
          sale_price?: number
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          min_quantity?: number
          name?: string
          petshop_id?: string
          purchase_price?: number
          quantity?: number
          sale_price?: number
          supplier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          link: string | null
          read_at: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          status?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          interval_days: number
          name: string
          petshop_id: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          interval_days: number
          name: string
          petshop_id: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          interval_days?: number
          name?: string
          petshop_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
        ]
      }
      page_access_matrix: {
        Row: {
          allowed: boolean
          id: string
          page_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          id?: string
          page_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          id?: string
          page_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      pet_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string
          pet_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
          pet_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          pet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_notes_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age: string | null
          allergies: string | null
          behavior: string | null
          breed: string | null
          coat_type: string | null
          created_at: string
          id: string
          name: string
          observations: string | null
          owner_id: string
          petshop_id: string | null
          photo_url: string | null
          size: string
          updated_at: string
          weight: string | null
        }
        Insert: {
          age?: string | null
          allergies?: string | null
          behavior?: string | null
          breed?: string | null
          coat_type?: string | null
          created_at?: string
          id?: string
          name: string
          observations?: string | null
          owner_id: string
          petshop_id?: string | null
          photo_url?: string | null
          size: string
          updated_at?: string
          weight?: string | null
        }
        Update: {
          age?: string | null
          allergies?: string | null
          behavior?: string | null
          breed?: string | null
          coat_type?: string | null
          created_at?: string
          id?: string
          name?: string
          observations?: string | null
          owner_id?: string
          petshop_id?: string | null
          photo_url?: string | null
          size?: string
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
        ]
      }
      petshops: {
        Row: {
          address: string | null
          created_at: string
          hours: string | null
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string | null
          settings: Json | null
          slug: string
          theme: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          hours?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          settings?: Json | null
          slug: string
          theme?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          hours?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          settings?: Json | null
          slug?: string
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          id: string
          lgpd_accepted: boolean
          lgpd_accepted_at: string | null
          must_change_password: boolean
          name: string
          notifications_enabled: boolean
          petshop_id: string | null
          phone: string | null
          profile_completed: boolean
          temp_password_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          lgpd_accepted?: boolean
          lgpd_accepted_at?: string | null
          must_change_password?: boolean
          name: string
          notifications_enabled?: boolean
          petshop_id?: string | null
          phone?: string | null
          profile_completed?: boolean
          temp_password_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          lgpd_accepted?: boolean
          lgpd_accepted_at?: string | null
          must_change_password?: boolean
          name?: string
          notifications_enabled?: boolean
          petshop_id?: string | null
          phone?: string | null
          profile_completed?: boolean
          temp_password_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
        ]
      }
      review_photos: {
        Row: {
          created_at: string
          id: string
          review_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_precos: {
        Row: {
          id: string
          unidade_id: string
          servico: string
          descricao: string | null
          preco_pequeno: number | null
          preco_medio: number | null
          preco_grande: number | null
          criado_em: string
        }
        Insert: {
          id?: string
          unidade_id: string
          servico: string
          descricao?: string | null
          preco_pequeno?: number | null
          preco_medio?: number | null
          preco_grande?: number | null
          criado_em?: string
        }
        Update: {
          id?: string
          unidade_id?: string
          servico?: string
          descricao?: string | null
          preco_pequeno?: number | null
          preco_medio?: number | null
          preco_grande?: number | null
          criado_em?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          moderation_status: string
          name: string
          pet_name: string | null
          petshop_id: string
          rating: number
          shop_response: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          moderation_status?: string
          name: string
          pet_name?: string | null
          petshop_id: string
          rating: number
          shop_response?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          moderation_status?: string
          name?: string
          pet_name?: string | null
          petshop_id?: string
          rating?: number
          shop_response?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          category: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          icon: string | null
          id: string
          name: string
          petshop_id: string
          price_grande: number | null
          price_medio: number | null
          price_pequeno: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          name: string
          petshop_id: string
          price_grande?: number | null
          price_medio?: number | null
          price_pequeno?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          name?: string
          petshop_id?: string
          price_grande?: number | null
          price_medio?: number | null
          price_pequeno?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_petshop_id_fkey"
            columns: ["petshop_id"]
            isOneToOne: false
            referencedRelation: "petshops"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades_petshop: {
        Row: {
          id: string
          slug: string
          nome: string
          telefone: string | null
          endereco: string | null
          horarios: string | null
          logomarca_url: string | null
          cor_primaria: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          slug: string
          nome: string
          telefone?: string | null
          endereco?: string | null
          horarios?: string | null
          logomarca_url?: string | null
          cor_primaria?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          slug?: string
          nome?: string
          telefone?: string | null
          endereco?: string | null
          horarios?: string | null
          logomarca_url?: string | null
          cor_primaria?: string | null
          criado_em?: string
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          auth_provider: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone_e164: string | null
          updated_at: string
        }
        Insert: {
          auth_provider?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone_e164?: string | null
          updated_at?: string
        }
        Update: {
          auth_provider?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone_e164?: string | null
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_pro: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pro?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pro?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_account_by_email: {
        Args: { email_input: string }
        Returns: {
          auth_provider: string
          has_password: boolean
        }[]
      }
      lookup_account_by_phone: {
        Args: { phone_input: string }
        Returns: {
          auth_provider: string
          has_password: boolean
        }[]
      }
      to_br_e164: { Args: { raw: string }; Returns: string }
    }
    Enums: {
      app_role: "dev" | "admin" | "midia" | "cliente"
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
      app_role: ["dev", "admin", "midia", "cliente"],
    },
  },
} as const
