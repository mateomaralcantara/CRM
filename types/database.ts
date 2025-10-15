// types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          status: string;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["projects"]["Row"], "created_at" | "id">>;
        Relationships: [];
      };

      objectives: {
        Row: {
          id: string;
          area: string;
          title: string;
          start_date: string;
          end_date: string;
          progress: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          area: string;
          title: string;
          start_date: string;
          end_date: string;
          progress?: number | null;
          status?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["objectives"]["Row"], "created_at" | "id">>;
        Relationships: [];
      };

      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          priority: number;
          due: string | null;
          status: "Pendiente" | "Hoy" | "En curso" | "Bloqueada" | "Hecha";
          project_id: string | null;
          objective_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          priority?: number;
          due?: string | null;
          status?: Database["public"]["Tables"]["tasks"]["Row"]["status"];
          project_id?: string | null;
          objective_id?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["tasks"]["Row"], "created_at" | "id">>;
        Relationships: [
          { foreignKeyName: "tasks_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] }?,
          { foreignKeyName: "tasks_objective_id_fkey"; columns: ["objective_id"]; referencedRelation: "objectives"; referencedColumns: ["id"] }?
        ];
      };

      accounts: {
        Row: {
          id: string;
          name: string;
          type: string;
          starting_bal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          starting_bal?: number;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["accounts"]["Row"], "created_at" | "id">>;
        Relationships: [];
      };

      transactions: {
        Row: {
          id: string;
          date: string;
          kind: "Ingreso" | "Egreso" | "Transferencia";
          account_id: string;
          category: string;
          amount: number;
          note: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          kind: Database["public"]["Tables"]["transactions"]["Row"]["kind"];
          account_id: string;
          category: string;
          amount: number;
          note?: string | null;
          tags?: string[];
        };
        Update: Partial<Omit<Database["public"]["Tables"]["transactions"]["Row"], "created_at" | "id">>;
        Relationships: [
          { foreignKeyName: "transactions_account_id_fkey"; columns: ["account_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] }
        ];
      };

      contacts: {
        Row: {
          id: string;
          name: string;
          company: string | null;
          phone: string | null;
          email: string | null;
          last_touch: string | null;
          next_action: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          company?: string | null;
          phone?: string | null;
          email?: string | null;
          last_touch?: string | null;
          next_action?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["contacts"]["Row"], "created_at" | "id">>;
        Relationships: [];
      };

      opportunities: {
        Row: {
          id: string;
          contact_id: string;
          stage: string;
          est_value: number;
          est_close_date: string | null;
          probability: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          stage?: string;
          est_value?: number;
          est_close_date?: string | null;
          probability?: number;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["opportunities"]["Row"], "created_at" | "id">>;
        Relationships: [
          { foreignKeyName: "opportunities_contact_id_fkey"; columns: ["contact_id"]; referencedRelation: "contacts"; referencedColumns: ["id"] }
        ];
      };

      events: {
        Row: {
          id: string;
          title: string;
          start: string;
          end: string;
          location: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          start: string;
          end: string;
          location?: string | null;
          note?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["events"]["Row"], "created_at" | "id">>;
        Relationships: [];
      };

      debts: {
        Row: {
          id: string;
          creditor: string;
          concept: string | null;
          amount: number;
          balance: number;
          status: "Activa" | "Cerrada";
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creditor: string;
          concept?: string | null;
          amount: number;
          balance?: number;
          status?: "Activa" | "Cerrada";
          due_date?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["debts"]["Row"], "created_at" | "id">>;
        Relationships: [];
      };

      debt_payments: {
        Row: {
          id: string;
          debt_id: string;
          amount: number;
          paid_at: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          debt_id: string;
          amount: number;
          paid_at?: string;
          note?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["debt_payments"]["Row"], "created_at" | "id">>;
        Relationships: [
          { foreignKeyName: "debt_payments_debt_id_fkey"; columns: ["debt_id"]; referencedRelation: "debts"; referencedColumns: ["id"] }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in string]: never;
    };
    Enums: {
      [_ in string]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
