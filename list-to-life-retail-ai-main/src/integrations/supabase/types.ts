export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      carts: {
        Row: {
          cart_id: string
          created_at: string | null
          product_id: string | null
          quantity: number | null
          user_id: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string | null
          product_id?: string | null
          quantity?: number | null
          user_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string | null
          product_id?: string | null
          quantity?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      inventory: {
        Row: {
          current_stock: number | null
          daily_sales_rate: number | null
          last_updated: string | null
          product_id: string
          store_id: string
        }
        Insert: {
          current_stock?: number | null
          daily_sales_rate?: number | null
          last_updated?: string | null
          product_id: string
          store_id: string
        }
        Update: {
          current_stock?: number | null
          daily_sales_rate?: number | null
          last_updated?: string | null
          product_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      order_items: {
        Row: {
          order_id: string | null
          order_item_id: string
          price: number | null
          product_id: string | null
          quantity: number | null
        }
        Insert: {
          order_id?: string | null
          order_item_id: string
          price?: number | null
          product_id?: string | null
          quantity?: number | null
        }
        Update: {
          order_id?: string | null
          order_item_id?: string
          price?: number | null
          product_id?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          order_id: string
          status: string | null
          total_amount: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          order_id: string
          status?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          order_id?: string
          status?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          attributes: Json | null
          brand: string | null
          category: string | null
          description: string | null
          image_url: string | null
          price: number | null
          product_id: string
          product_name: string | null
          subcategory: string | null
        }
        Insert: {
          attributes?: Json | null
          brand?: string | null
          category?: string | null
          description?: string | null
          image_url?: string | null
          price?: number | null
          product_id: string
          product_name?: string | null
          subcategory?: string | null
        }
        Update: {
          attributes?: Json | null
          brand?: string | null
          category?: string | null
          description?: string | null
          image_url?: string | null
          price?: number | null
          product_id?: string
          product_name?: string | null
          subcategory?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          loyalty_points: number | null
          preferences: Json | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          loyalty_points?: number | null
          preferences?: Json | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          loyalty_points?: number | null
          preferences?: Json | null
          role?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          product_id: string | null
          rating: number | null
          review_id: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          product_id?: string | null
          rating?: number | null
          review_id: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          product_id?: string | null
          rating?: number | null
          review_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      substitutions: {
        Row: {
          original_product_id: string
          reason: string | null
          substitute_product_id: string
          substitution_score: number | null
          type: string | null
        }
        Insert: {
          original_product_id: string
          reason?: string | null
          substitute_product_id: string
          substitution_score?: number | null
          type?: string | null
        }
        Update: {
          original_product_id?: string
          reason?: string | null
          substitute_product_id?: string
          substitution_score?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "substitutions_original_product_id_fkey"
            columns: ["original_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "substitutions_substitute_product_id_fkey"
            columns: ["substitute_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string | null
          product_id: string | null
          user_id: string | null
          wishlist_id: string
        }
        Insert: {
          created_at?: string | null
          product_id?: string | null
          user_id?: string | null
          wishlist_id: string
        }
        Update: {
          created_at?: string | null
          product_id?: string | null
          user_id?: string | null
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
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
    Enums: {},
  },
} as const
