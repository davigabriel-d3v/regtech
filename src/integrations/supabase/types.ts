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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_permissions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          module: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          module: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      atividades: {
        Row: {
          criado_em: string
          descricao: string
          id: string
          tipo: string
        }
        Insert: {
          criado_em?: string
          descricao: string
          id?: string
          tipo: string
        }
        Update: {
          criado_em?: string
          descricao?: string
          id?: string
          tipo?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          email_normalized: string | null
          id: string
          name: string
          phone: string
          phone_normalized: string
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_normalized?: string | null
          id?: string
          name: string
          phone: string
          phone_normalized: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          email_normalized?: string | null
          id?: string
          name?: string
          phone?: string
          phone_normalized?: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      marcas: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          logo_url: string | null
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          logo_url?: string | null
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          logo_url?: string | null
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      newsletter: {
        Row: {
          criado_em: string
          email: string
          id: string
        }
        Insert: {
          criado_em?: string
          email: string
          id?: string
        }
        Update: {
          criado_em?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_code: string
          product_id: string
          product_image: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          selected_variation: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_code: string
          product_id: string
          product_image?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          selected_variation?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_code?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          selected_variation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          order_number: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          order_number?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          order_number?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          atualizado_em: string
          cliente_id: string | null
          cliente_nome: string
          criado_em: string
          id: string
          numero: number
          produto_id: string | null
          produto_titulo: string
          status: string
        }
        Insert: {
          atualizado_em?: string
          cliente_id?: string | null
          cliente_nome?: string
          criado_em?: string
          id?: string
          numero?: number
          produto_id?: string | null
          produto_titulo?: string
          status?: string
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string | null
          cliente_nome?: string
          criado_em?: string
          id?: string
          numero?: number
          produto_id?: string | null
          produto_titulo?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_code_registry: {
        Row: {
          product_code: string
          reserved_at: string
        }
        Insert: {
          product_code: string
          reserved_at?: string
        }
        Update: {
          product_code?: string
          reserved_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_primary: boolean
          product_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean
          product_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean
          product_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          minimum_stock: number
          name: string
          notes: string | null
          price: number
          product_code: string
          promotional_price: number | null
          sku: string | null
          status: string
          stock: number
          updated_at: string
          variations: Json
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          minimum_stock?: number
          name: string
          notes?: string | null
          price: number
          product_code?: string
          promotional_price?: number | null
          sku?: string | null
          status?: string
          stock?: number
          updated_at?: string
          variations?: Json
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          minimum_stock?: number
          name?: string
          notes?: string | null
          price?: number
          product_code?: string
          promotional_price?: number | null
          sku?: string | null
          status?: string
          stock?: number
          updated_at?: string
          variations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_codigos_usados: {
        Row: {
          code: string
          criado_em: string
        }
        Insert: {
          code: string
          criado_em?: string
        }
        Update: {
          code?: string
          criado_em?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          atualizado_em: string
          avaliacao: number
          avaliacoes: number
          barcode: string | null
          categoria: string
          criado_em: string
          descricao: string
          destaque: boolean
          em_estoque: boolean
          id: string
          imagem_url: string | null
          marca: string
          minimum_stock: number
          notes: string
          ordem: number
          preco: number | null
          preco_antigo: number | null
          product_code: string | null
          promotional_price: number | null
          publicado: boolean
          sku: string | null
          slug: string
          status: string
          stock: number
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          avaliacao?: number
          avaliacoes?: number
          barcode?: string | null
          categoria: string
          criado_em?: string
          descricao?: string
          destaque?: boolean
          em_estoque?: boolean
          id?: string
          imagem_url?: string | null
          marca: string
          minimum_stock?: number
          notes?: string
          ordem?: number
          preco?: number | null
          preco_antigo?: number | null
          product_code?: string | null
          promotional_price?: number | null
          publicado?: boolean
          sku?: string | null
          slug: string
          status?: string
          stock?: number
          titulo: string
        }
        Update: {
          atualizado_em?: string
          avaliacao?: number
          avaliacoes?: number
          barcode?: string | null
          categoria?: string
          criado_em?: string
          descricao?: string
          destaque?: boolean
          em_estoque?: boolean
          id?: string
          imagem_url?: string | null
          marca?: string
          minimum_stock?: number
          notes?: string
          ordem?: number
          preco?: number | null
          preco_antigo?: number | null
          product_code?: string | null
          promotional_price?: number | null
          publicado?: boolean
          sku?: string | null
          slug?: string
          status?: string
          stock?: number
          titulo?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          criado_em: string
          id: string
          nome: string
          whatsapp: string
        }
        Insert: {
          criado_em?: string
          id: string
          nome?: string
          whatsapp?: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          whatsapp?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      create_public_order: {
        Args: {
          p_customer: Json
          p_notes?: string
          p_product_id: string
          p_quantity: number
          p_selected_variation?: Json
        }
        Returns: {
          order_id: string
          order_number: number
          order_number_display: string
        }[]
      }
      generate_product_code: { Args: never; Returns: string }
      gerar_product_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "operator"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user", "operator"],
    },
  },
} as const
