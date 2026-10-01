// Hand-rolled Database schema used by the typed Supabase client. Kept in
// sync with the SQL migrations in `supabase/migrations/`. We don't generate
// it because the project is tiny and the migrations are the source of truth.

interface ExerciseRow {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
  updated_at: string;
}

interface ExerciseInsert {
  id?: string;
  user_id: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

interface ExerciseUpdate {
  id?: string;
  user_id?: string;
  date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      plank_results: {
        Row: ExerciseRow & { duration_seconds: number };
        Insert: ExerciseInsert & { duration_seconds: number };
        Update: ExerciseUpdate & { duration_seconds?: number };
        Relationships: [];
      };
      pushups: {
        Row: ExerciseRow & { reps: number };
        Insert: ExerciseInsert & { reps: number };
        Update: ExerciseUpdate & { reps?: number };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
