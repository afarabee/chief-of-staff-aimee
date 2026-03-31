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
      ai_enrichments: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_title: string
          item_type: string
          suggestions: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_title: string
          item_type: string
          suggestions?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_title?: string
          item_type?: string
          suggestions?: Json | null
        }
        Relationships: []
      }
      ai_executions: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_title: string
          item_type: string
          result: string
          suggestion: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_title: string
          item_type: string
          result: string
          suggestion: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_title?: string
          item_type?: string
          result?: string
          suggestion?: string
        }
        Relationships: []
      }
      asset_attachments: {
        Row: {
          asset_id: string
          created_at: string | null
          display_name: string
          file_url: string
          id: string
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          display_name?: string
          file_url: string
          id?: string
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          display_name?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_attachments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_providers: {
        Row: {
          asset_id: string
          created_at: string | null
          id: string
          provider_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          id?: string
          provider_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_providers_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_providers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          attachment_url: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          notes: string | null
          purchase_date: string | null
          show_on_kanban: boolean | null
          updated_at: string | null
        }
        Insert: {
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          purchase_date?: string | null
          show_on_kanban?: boolean | null
          updated_at?: string | null
        }
        Update: {
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          purchase_date?: string | null
          show_on_kanban?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      cfo_accounts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          owner: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          owner: string
          type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          owner?: string
          type?: string
        }
        Relationships: []
      }
      cfo_annual_payments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          description: string
          id: string
          notes: string | null
          typical_day: number | null
          typical_month: number
        }
        Insert: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          typical_day?: number | null
          typical_month: number
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          typical_day?: number | null
          typical_month?: number
        }
        Relationships: [
          {
            foreignKeyName: "cfo_annual_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cfo_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cfo_bill_matches: {
        Row: {
          bill_id: string
          created_at: string | null
          id: string
          month_key: string
          transaction_id: string
        }
        Insert: {
          bill_id: string
          created_at?: string | null
          id?: string
          month_key: string
          transaction_id: string
        }
        Update: {
          bill_id?: string
          created_at?: string | null
          id?: string
          month_key?: string
          transaction_id?: string
        }
        Relationships: []
      }
      cfo_bills: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          is_autopay: boolean | null
          is_recurring: boolean | null
          month_key: string
          notes: string | null
          paid_date: string | null
          pay_period_id: string | null
          sort_order: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          is_autopay?: boolean | null
          is_recurring?: boolean | null
          month_key: string
          notes?: string | null
          paid_date?: string | null
          pay_period_id?: string | null
          sort_order?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          is_autopay?: boolean | null
          is_recurring?: boolean | null
          month_key?: string
          notes?: string | null
          paid_date?: string | null
          pay_period_id?: string | null
          sort_order?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cfo_bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cfo_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfo_bills_pay_period_id_fkey"
            columns: ["pay_period_id"]
            isOneToOne: false
            referencedRelation: "cfo_pay_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      cfo_budget_targets: {
        Row: {
          category: string
          created_at: string | null
          id: string
          monthly_target: number
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          monthly_target: number
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          monthly_target?: number
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cfo_custom_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      cfo_investment_snapshots: {
        Row: {
          account_id: string | null
          avg_cost_basis: number | null
          cost_basis_total: number | null
          created_at: string | null
          current_value: number
          description: string
          id: string
          last_price: number | null
          pct_of_account: number | null
          position_type: string | null
          quantity: number | null
          snapshot_date: string
          symbol: string
          total_gain_loss: number | null
          total_gain_loss_pct: number | null
          upload_batch: string
        }
        Insert: {
          account_id?: string | null
          avg_cost_basis?: number | null
          cost_basis_total?: number | null
          created_at?: string | null
          current_value: number
          description: string
          id?: string
          last_price?: number | null
          pct_of_account?: number | null
          position_type?: string | null
          quantity?: number | null
          snapshot_date: string
          symbol: string
          total_gain_loss?: number | null
          total_gain_loss_pct?: number | null
          upload_batch: string
        }
        Update: {
          account_id?: string | null
          avg_cost_basis?: number | null
          cost_basis_total?: number | null
          created_at?: string | null
          current_value?: number
          description?: string
          id?: string
          last_price?: number | null
          pct_of_account?: number | null
          position_type?: string | null
          quantity?: number | null
          snapshot_date?: string
          symbol?: string
          total_gain_loss?: number | null
          total_gain_loss_pct?: number | null
          upload_batch?: string
        }
        Relationships: [
          {
            foreignKeyName: "cfo_investment_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cfo_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cfo_merchant_notes: {
        Row: {
          created_at: string | null
          id: string
          merchant_name: string
          notes: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          merchant_name: string
          notes?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          merchant_name?: string
          notes?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cfo_pay_periods: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          id: string
          label: string | null
          month_key: string
          pay_date: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          label?: string | null
          month_key: string
          pay_date: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          label?: string | null
          month_key?: string
          pay_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "cfo_pay_periods_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cfo_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cfo_recurring_templates: {
        Row: {
          account_id: string | null
          created_at: string | null
          default_amount: number
          description: string
          due_day: number | null
          frequency: string
          id: string
          is_active: boolean | null
          is_autopay: boolean | null
          notes: string | null
          sort_order: number | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          default_amount?: number
          description: string
          due_day?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          is_autopay?: boolean | null
          notes?: string | null
          sort_order?: number | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          default_amount?: number
          description?: string
          due_day?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          is_autopay?: boolean | null
          notes?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cfo_recurring_templates_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cfo_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cfo_savings_config: {
        Row: {
          created_at: string | null
          goal_name: string
          goal_target: number
          id: string
          start_date: string
          starting_balance: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          goal_name?: string
          goal_target?: number
          id?: string
          start_date?: string
          starting_balance?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          goal_name?: string
          goal_target?: number
          id?: string
          start_date?: string
          starting_balance?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      cfo_tax_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          id: string
          notes: string | null
          received: boolean | null
          received_date: string | null
          source: string
          tax_year: number
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          id?: string
          notes?: string | null
          received?: boolean | null
          received_date?: string | null
          source: string
          tax_year: number
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          id?: string
          notes?: string | null
          received?: boolean | null
          received_date?: string | null
          source?: string
          tax_year?: number
        }
        Relationships: []
      }
      cfo_tax_tags: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          tax_category: string
          tax_year: number
          transaction_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          tax_category: string
          tax_year: number
          transaction_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          tax_category?: string
          tax_year?: number
          transaction_id?: string
        }
        Relationships: []
      }
      cfo_tax_withholdings: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          period: string
          source: string
          tax_year: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          period: string
          source: string
          tax_year: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          period?: string
          source?: string
          tax_year?: number
        }
        Relationships: []
      }
      cfo_transactions: {
        Row: {
          account_id: string | null
          account_name: string
          amount: number
          category: string
          created_at: string | null
          description: string
          id: string
          notes: string | null
          transaction_date: string
          upload_batch: string
        }
        Insert: {
          account_id?: string | null
          account_name: string
          amount: number
          category?: string
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          transaction_date: string
          upload_batch: string
        }
        Update: {
          account_id?: string | null
          account_name?: string
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          transaction_date?: string
          upload_batch?: string
        }
        Relationships: [
          {
            foreignKeyName: "cfo_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cfo_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cfo_watchout_acks: {
        Row: {
          created_at: string | null
          id: string
          month_key: string
          status: string
          watchout_key: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          month_key: string
          status?: string
          watchout_key: string
        }
        Update: {
          created_at?: string | null
          id?: string
          month_key?: string
          status?: string
          watchout_key?: string
        }
        Relationships: []
      }
      command_center_config: {
        Row: {
          created_at: string
          hidden_widgets: string[]
          id: string
          updated_at: string
          widget_order: string[]
        }
        Insert: {
          created_at?: string
          hidden_widgets?: string[]
          id?: string
          updated_at?: string
          widget_order?: string[]
        }
        Update: {
          created_at?: string
          hidden_widgets?: string[]
          id?: string
          updated_at?: string
          widget_order?: string[]
        }
        Relationships: []
      }
      cos_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      cos_ideas: {
        Row: {
          ai_suggestions: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_suggestions?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_suggestions?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cos_ideas_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cos_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cos_tasks: {
        Row: {
          ai_suggestions: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          image_url: string | null
          parent_task_id: string | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_suggestions?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          parent_task_id?: string | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_suggestions?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          parent_task_id?: string | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cos_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cos_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cos_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "cos_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          low_stock_threshold: number | null
          name: string
          quantity: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          low_stock_threshold?: number | null
          name: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          low_stock_threshold?: number | null
          name?: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_feeds: {
        Row: {
          created_at: string
          id: string
          name: string
          rss_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          rss_url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          rss_url?: string
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          address: string | null
          category_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list: {
        Row: {
          checked: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          checked?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          checked?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          ai_suggestions: string | null
          asset_id: string | null
          attachment_url: string | null
          cost: number | null
          created_at: string | null
          date_completed: string | null
          id: string
          name: string
          next_due_date: string | null
          notes: string | null
          provider_id: string | null
          recurrence_rule: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_suggestions?: string | null
          asset_id?: string | null
          attachment_url?: string | null
          cost?: number | null
          created_at?: string | null
          date_completed?: string | null
          id?: string
          name: string
          next_due_date?: string | null
          notes?: string | null
          provider_id?: string | null
          recurrence_rule?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_suggestions?: string | null
          asset_id?: string | null
          attachment_url?: string | null
          cost?: number | null
          created_at?: string | null
          date_completed?: string | null
          id?: string
          name?: string
          next_due_date?: string | null
          notes?: string | null
          provider_id?: string | null
          recurrence_rule?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
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
