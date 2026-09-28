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
      produtos: {
        Row: {
          atualizado_em: string
          avaliacao: number
          avaliacoes: number
          categoria: string
          criado_em: string
          descricao: string
          destaque: boolean
          em_estoque: boolean
          id: string
          imagem_url: string | null
          marca: string
          ordem: number
          preco: number | null
          preco_antigo: number | null
          publicado: boolean
          slug: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          avaliacao?: number
          avaliacoes?: number
          categoria: string
          criado_em?: string
          descricao?: string
          destaque?: boolean
          em_estoque?: boolean
          id?: string
          imagem_url?: string | null
          marca: string
          ordem?: number
          preco?: number | null
          preco_antigo?: number | null
          publicado?: boolean
          slug: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          avaliacao?: number
          avaliacoes?: number
          categoria?: string
          criado_em?: string
          descricao?: string
          destaque?: boolean
          em_estoque?: boolean
          id?: string
          imagem_url?: string | null
          marca?: string
          ordem?: number
          preco?: number | null
          preco_antigo?: number | null
          publicado?: boolean
          slug?: string
          titulo?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { id?: string; name?: string; created_at?: string }
        Relationships: []
      }
      products: {
        Row: {
          id: string; product_code: string; name: string; description: string | null; category_id: string | null;
          brand_id: string | null; price: number; promotional_price: number | null; stock: number;
          minimum_stock: number; sku: string | null; barcode: string | null; notes: string | null;
          status: "active" | "inactive"; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; product_code?: string; name: string; description?: string | null; category_id?: string | null;
          brand_id?: string | null; price: number; promotional_price?: number | null; stock?: number;
          minimum_stock?: number; sku?: string | null; barcode?: string | null; notes?: string | null;
          status?: "active" | "inactive"; created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; product_code?: string; name?: string; description?: string | null; category_id?: string | null;
          brand_id?: string | null; price?: number; promotional_price?: number | null; stock?: number;
          minimum_stock?: number; sku?: string | null; barcode?: string | null; notes?: string | null;
          status?: "active" | "inactive"; created_at?: string; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "products_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "product_categories"; referencedColumns: ["id"] },
          { foreignKeyName: "products_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: false; referencedRelation: "marcas"; referencedColumns: ["id"] }
        ]
      }
      product_images: {
        Row: { id: string; product_id: string; storage_path: string; image_url: string; is_primary: boolean; display_order: number; created_at: string }
        Insert: { id?: string; product_id: string; storage_path: string; image_url: string; is_primary?: boolean; display_order?: number; created_at?: string }
        Update: { id?: string; product_id?: string; storage_path?: string; image_url?: string; is_primary?: boolean; display_order?: number; created_at?: string }
        Relationships: [
          { foreignKeyName: "product_images_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
