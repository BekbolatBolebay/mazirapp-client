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
          created_at?: string
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          name_ru: string | null
          description: string | null
          description_ru: string | null
          image_url: string | null
          cover_image_url: string | null
          rating: number
          delivery_time_min: number
          delivery_time_max: number
          delivery_fee: number
          min_order: number
          is_open: boolean
          categories: string[]
          address: string | null
          address_ru: string | null
          phone: string | null
          working_hours: string | null
          working_hours_ru: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_ru?: string | null
          description?: string | null
          description_ru?: string | null
          image_url?: string | null
          cover_image_url?: string | null
          rating?: number
          delivery_time_min?: number
          delivery_time_max?: number
          delivery_fee?: number
          min_order?: number
          is_open?: boolean
          categories?: string[]
          address?: string | null
          address_ru?: string | null
          phone?: string | null
          working_hours?: string | null
          working_hours_ru?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_ru?: string | null
          description?: string | null
          description_ru?: string | null
          image_url?: string | null
          cover_image_url?: string | null
          rating?: number
          delivery_time_min?: number
          delivery_time_max?: number
          delivery_fee?: number
          min_order?: number
          is_open?: boolean
          categories?: string[]
          address?: string | null
          address_ru?: string | null
          phone?: string | null
          working_hours?: string | null
          working_hours_ru?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          name_ru: string | null
          description: string | null
          description_ru: string | null
          price: number
          image_url: string | null
          category: string
          category_ru: string | null
          is_available: boolean
          ingredients: string | null
          ingredients_ru: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          name_ru?: string | null
          description?: string | null
          description_ru?: string | null
          price: number
          image_url?: string | null
          category: string
          category_ru?: string | null
          is_available?: boolean
          ingredients?: string | null
          ingredients_ru?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          name_ru?: string | null
          description?: string | null
          description_ru?: string | null
          price?: number
          image_url?: string | null
          category?: string
          category_ru?: string | null
          is_available?: boolean
          ingredients?: string | null
          ingredients_ru?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          status: string
          total_amount: number
          delivery_fee: number
          delivery_address: string | null
          delivery_instructions: string | null
          phone: string | null
          estimated_delivery_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          status?: string
          total_amount: number
          delivery_fee?: number
          delivery_address?: string | null
          delivery_instructions?: string | null
          phone?: string | null
          estimated_delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          restaurant_id?: string
          status?: string
          total_amount?: number
          delivery_fee?: number
          delivery_address?: string | null
          delivery_instructions?: string | null
          phone?: string | null
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
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          menu_item_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          menu_item_id: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          menu_item_id?: string
          quantity?: number
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
