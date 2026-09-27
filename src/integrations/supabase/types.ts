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
          product_code: string
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
          product_code?: string
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
          product_code?: string
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
      order_status: ["NOVO", "EM_ANALISE", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"],
      product_status: ["ATIVO", "INATIVO"],
    },
  },
};

export type OrderStatus = "NOVO" | "EM_ANALISE" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";

export interface ProductVariation {
  id: string;
  product_id: string;
  name: string;
  value: string;
  sku: string;
  stock: number;
  created_at: string;
}

export interface ProductImageRecord {
  id: string;
  product_id: string;
  storage_path: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface OrderCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  product_image: string | null;
  product_sku: string | null;
  quantity: number;
  selected_variation: string | null;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  created_at: string;
}

export interface PedidoRow {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_whatsapp: string;
  product_id: string;
  product_code: string;
  product_name: string;
  product_image: string | null;
  product_sku: string | null;
  quantity: number;
  selected_variation: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  nome: string;
  role: string;
}

export interface AdminProduct {
  id: string;
  product_code: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  sku: string;
  barcode: string;
  price: number;
  promotional_price: number | null;
  stock: number;
  minimum_stock: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_whatsapp: string;
  product_id: string;
  product_code: string;
  product_name: string;
  product_image: string | null;
  product_sku: string | null;
  quantity: number;
  selected_variation: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  orders_count: number;
  last_order_date: string | null;
  created_at: string;
}

export interface DashboardStats {
  novos_pedidos: number;
  em_analise: number;
  em_andamento: number;
  concluidos: number;
  cancelados: number;
  total_produtos: number;
  produtos_ativos: number;
  sem_estoque: number;
  ultimos_pedidos: AdminOrder[];
  ultimos_produtos: AdminProduct[];
  atividades: { acao: string; usuario: string; data: string; hora: string }[];
}
} as const
