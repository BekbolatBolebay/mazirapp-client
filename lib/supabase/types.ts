export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          preferred_language: string
          theme: string
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          preferred_language?: string
          theme?: string
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          preferred_language?: string
          theme?: string
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name_kk: string
          name_ru: string
          name_en: string
          description_kk: string | null
          description_ru: string | null
          description_en: string | null
          image_url: string | null
          banner_url: string | null
          address: string
          phone: string | null
          rating: number
          delivery_time_min: number
          delivery_time_max: number
          delivery_fee: number
          minimum_order: number
          is_open: boolean
          cuisine_types: string[]
          opening_hours: Json | null
          is_new: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_kk: string
          name_ru: string
          name_en: string
          description_kk?: string | null
          description_ru?: string | null
          description_en?: string | null
          image_url?: string | null
          banner_url?: string | null
          address: string
          phone?: string | null
          rating?: number
          delivery_time_min?: number
          delivery_time_max?: number
          delivery_fee?: number
          minimum_order?: number
          is_open?: boolean
          cuisine_types?: string[]
          opening_hours?: Json | null
          is_new?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_kk?: string
          name_ru?: string
          name_en?: string
          description_kk?: string | null
          description_ru?: string | null
          description_en?: string | null
          image_url?: string | null
          banner_url?: string | null
          address?: string
          phone?: string | null
          rating?: number
          delivery_time_min?: number
          delivery_time_max?: number
          delivery_fee?: number
          minimum_order?: number
          is_open?: boolean
          cuisine_types?: string[]
          opening_hours?: Json | null
          is_new?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          category_id: string | null
          name_kk: string
          name_ru: string
          name_en: string
          description_kk: string | null
          description_ru: string | null
          description_en: string | null
          image_url: string | null
          price: number
          is_available: boolean
          is_popular: boolean
          is_stop_list: boolean
          preparation_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          category_id?: string | null
          name_kk: string
          name_ru: string
          name_en: string
          description_kk?: string | null
          description_ru?: string | null
          description_en?: string | null
          image_url?: string | null
          price: number
          is_available?: boolean
          is_popular?: boolean
          is_stop_list?: boolean
          preparation_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          category_id?: string | null
          name_kk?: string
          name_ru?: string
          name_en?: string
          description_kk?: string | null
          description_ru?: string | null
          description_en?: string | null
          image_url?: string | null
          price?: number
          is_available?: boolean
          is_popular?: boolean
          is_stop_list?: boolean
          preparation_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          restaurant_id: string
          status: string
          total_amount: number
          delivery_fee: number
          delivery_address: string
          delivery_notes: string | null
          payment_method: string
          payment_status: string
          payment_url: string | null
          courier_id: string | null
          one_time_courier_name: string | null
          one_time_courier_phone: string | null
          courier_tracking_token: string | null
          phone: string
          estimated_delivery_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id: string
          restaurant_id: string
          status?: string
          total_amount: number
          delivery_fee?: number
          delivery_address: string
          delivery_notes?: string | null
          payment_method?: string
          phone: string
          estimated_delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          restaurant_id?: string
          status?: string
          total_amount?: number
          delivery_fee?: number
          delivery_address?: string
          delivery_notes?: string | null
          payment_method?: string
          phone?: string
          estimated_delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          price?: number
          notes?: string | null
          created_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          menu_item_id: string
          restaurant_id: string
          quantity: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          menu_item_id: string
          restaurant_id: string
          quantity?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          menu_item_id?: string
          restaurant_id?: string
          quantity?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          restaurant_id?: string
          created_at?: string
        }
      }
      promotions: {
        Row: {
          id: string
          title: string
          title_ru: string | null
          description: string | null
          description_ru: string | null
          image_url: string | null
          discount_percent: number | null
          discount_amount: number | null
          code: string | null
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          title_ru?: string | null
          description?: string | null
          description_ru?: string | null
          image_url?: string | null
          discount_percent?: number | null
          discount_amount?: number | null
          code?: string | null
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          title_ru?: string | null
          description?: string | null
          description_ru?: string | null
          image_url?: string | null
          discount_percent?: number | null
          discount_amount?: number | null
          code?: string | null
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
