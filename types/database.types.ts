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
      application_events: {
        Row: {
          created_at: string
          id: string
          job_id: string
          reason: string | null
          reasons: Json
          type: string
          user_id: string
          voice_drift_level: string | null
          voice_integrity_passed: boolean | null
          voice_mode: string | null
          voice_override_reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          reason?: string | null
          reasons?: Json
          type: string
          user_id: string
          voice_drift_level?: string | null
          voice_integrity_passed?: boolean | null
          voice_mode?: string | null
          voice_override_reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          reason?: string | null
          reasons?: Json
          type?: string
          user_id?: string
          voice_drift_level?: string | null
          voice_integrity_passed?: boolean | null
          voice_mode?: string | null
          voice_override_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string | null
          id: string
          job_id: string
          method: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          id?: string
          job_id: string
          method?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          id?: string
          job_id?: string
          method?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          correlation_id: string | null
          created_at: string
          event_type: string
          id: string
          job_id: string | null
          metadata: Json | null
          outcome: string
          reason: string | null
          user_id: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          outcome: string
          reason?: string | null
          user_id: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          outcome?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      byred_activities: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          object_id: string
          object_type: string
          summary: string
          tenant_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          object_id: string
          object_type: string
          summary: string
          tenant_id: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          object_id?: string
          object_type?: string
          summary?: string
          tenant_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "byred_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "byred_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
        ]
      }
      byred_batch_ops: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          failed_rows: number
          id: string
          imported_rows: number
          source: string
          status: string
          total_rows: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_rows?: number
          id?: string
          imported_rows?: number
          source: string
          status?: string
          total_rows?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_rows?: number
          id?: string
          imported_rows?: number
          source?: string
          status?: string
          total_rows?: number
        }
        Relationships: []
      }
      byred_board_sync_cursors: {
        Row: {
          board_id: string
          cursor_updated_at: string | null
          last_delta_sync_at: string | null
          last_full_sync_at: string | null
          tenant_id: string
        }
        Insert: {
          board_id: string
          cursor_updated_at?: string | null
          last_delta_sync_at?: string | null
          last_full_sync_at?: string | null
          tenant_id: string
        }
        Update: {
          board_id?: string
          cursor_updated_at?: string | null
          last_delta_sync_at?: string | null
          last_full_sync_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "byred_board_sync_cursors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      byred_daily_briefs: {
        Row: {
          created_at: string | null
          date: string
          id: string
          summary: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          summary: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          summary?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "byred_daily_briefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
        ]
      }
      byred_leads: {
        Row: {
          assigned_user_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          email: string | null
          id: string
          last_contacted_at: string | null
          name: string
          next_follow_up_at: string | null
          notes: string | null
          phone: string | null
          revenue_potential: number | null
          source: string | null
          stage: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name: string
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          revenue_potential?: number | null
          source?: string | null
          stage?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name?: string
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          revenue_potential?: number | null
          source?: string | null
          stage?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "byred_leads_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "byred_leads_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "byred_leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      byred_rate_limits: {
        Row: {
          events_in_window: number
          key: string
          window_started_at: string
        }
        Insert: {
          events_in_window?: number
          key: string
          window_started_at?: string
        }
        Update: {
          events_in_window?: number
          key?: string
          window_started_at?: string
        }
        Relationships: []
      }
      byred_sync_locks: {
        Row: {
          acquired_at: string
          expires_at: string
          holder: string
          name: string
        }
        Insert: {
          acquired_at?: string
          expires_at: string
          holder: string
          name: string
        }
        Update: {
          acquired_at?: string
          expires_at?: string
          holder?: string
          name?: string
        }
        Relationships: []
      }
      byred_task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "byred_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "byred_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "byred_task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
        ]
      }
      byred_tasks: {
        Row: {
          acceptance_criteria: string | null
          ai_mode: string
          all_day: boolean | null
          archived_at: string | null
          blocked_by_task_id: string | null
          blocker_flag: boolean | null
          blocker_reason: string | null
          board_id: string | null
          calendar_color: string | null
          calendar_end_at: string | null
          calendar_label: string | null
          calendar_start_at: string | null
          completed_at: string | null
          created_at: string | null
          created_by_user_id: string | null
          definition_of_done: string | null
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          import_batch_id: string | null
          is_low_hanging_fruit: boolean | null
          is_ready_for_ai: boolean | null
          is_ready_for_human: boolean | null
          needs_decision: boolean | null
          order_index: number | null
          owner_user_id: string | null
          parent_task_id: string | null
          phase_id: string | null
          priority: string
          project_id: string | null
          recurrence_rule: string | null
          revenue_impact_score: number | null
          source_board_name: string | null
          source_group_name: string | null
          source_id: string | null
          source_row_hash: string | null
          source_system: string | null
          start_date: string | null
          status: string
          support_user_ids: string[]
          tenant_id: string
          title: string
          updated_at: string | null
          urgency_score: number | null
          waiting_on_external: boolean | null
        }
        Insert: {
          acceptance_criteria?: string | null
          ai_mode?: string
          all_day?: boolean | null
          archived_at?: string | null
          blocked_by_task_id?: string | null
          blocker_flag?: boolean | null
          blocker_reason?: string | null
          board_id?: string | null
          calendar_color?: string | null
          calendar_end_at?: string | null
          calendar_label?: string | null
          calendar_start_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          definition_of_done?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          import_batch_id?: string | null
          is_low_hanging_fruit?: boolean | null
          is_ready_for_ai?: boolean | null
          is_ready_for_human?: boolean | null
          needs_decision?: boolean | null
          order_index?: number | null
          owner_user_id?: string | null
          parent_task_id?: string | null
          phase_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_rule?: string | null
          revenue_impact_score?: number | null
          source_board_name?: string | null
          source_group_name?: string | null
          source_id?: string | null
          source_row_hash?: string | null
          source_system?: string | null
          start_date?: string | null
          status?: string
          support_user_ids?: string[]
          tenant_id: string
          title: string
          updated_at?: string | null
          urgency_score?: number | null
          waiting_on_external?: boolean | null
        }
        Update: {
          acceptance_criteria?: string | null
          ai_mode?: string
          all_day?: boolean | null
          archived_at?: string | null
          blocked_by_task_id?: string | null
          blocker_flag?: boolean | null
          blocker_reason?: string | null
          board_id?: string | null
          calendar_color?: string | null
          calendar_end_at?: string | null
          calendar_label?: string | null
          calendar_start_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          definition_of_done?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          import_batch_id?: string | null
          is_low_hanging_fruit?: boolean | null
          is_ready_for_ai?: boolean | null
          is_ready_for_human?: boolean | null
          needs_decision?: boolean | null
          order_index?: number | null
          owner_user_id?: string | null
          parent_task_id?: string | null
          phase_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_rule?: string | null
          revenue_impact_score?: number | null
          source_board_name?: string | null
          source_group_name?: string | null
          source_id?: string | null
          source_row_hash?: string | null
          source_system?: string | null
          start_date?: string | null
          status?: string
          support_user_ids?: string[]
          tenant_id?: string
          title?: string
          updated_at?: string | null
          urgency_score?: number | null
          waiting_on_external?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "byred_tasks_blocked_by_task_id_fkey"
            columns: ["blocked_by_task_id"]
            isOneToOne: false
            referencedRelation: "byred_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "byred_tasks_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "byred_tasks_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "byred_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "byred_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "byred_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_board_id"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "os_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_import_batch_id"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "os_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_phase_id"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "os_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "os_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      byred_tenants: {
        Row: {
          active: boolean | null
          color: string
          created_at: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          color: string
          created_at?: string | null
          id: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      byred_user_tenants: {
        Row: {
          created_at: string | null
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "byred_user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "byred_user_tenants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
        ]
      }
      byred_users: {
        Row: {
          active: boolean | null
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          monday_user_id: string | null
          name: string
          role: string
          source: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          monday_user_id?: string | null
          name: string
          role?: string
          source?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          monday_user_id?: string | null
          name?: string
          role?: string
          source?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      byred_webhook_events: {
        Row: {
          event_key: string
          id: string
          payload: Json
          received_at: string
          result: Json | null
          source: string
        }
        Insert: {
          event_key: string
          id?: string
          payload: Json
          received_at?: string
          result?: Json | null
          source: string
        }
        Update: {
          event_key?: string
          id?: string
          payload?: Json
          received_at?: string
          result?: Json | null
          source?: string
        }
        Relationships: []
      }
      coach_evidence_drafts: {
        Row: {
          confidence_level: string
          confirmed_row_id: string | null
          created_at: string
          id: string
          proof_snippet: string
          session_id: string
          skills: string[] | null
          source_title: string
          source_type: string
          status: string
          user_id: string
        }
        Insert: {
          confidence_level?: string
          confirmed_row_id?: string | null
          created_at?: string
          id?: string
          proof_snippet: string
          session_id: string
          skills?: string[] | null
          source_title: string
          source_type?: string
          status?: string
          user_id: string
        }
        Update: {
          confidence_level?: string
          confirmed_row_id?: string | null
          created_at?: string
          id?: string
          proof_snippet?: string
          session_id?: string
          skills?: string[] | null
          source_title?: string
          source_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_evidence_drafts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coach_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_memory: {
        Row: {
          content: string
          context_job_id: string | null
          context_session_id: string | null
          created_at: string | null
          id: string
          importance: string
          is_active: boolean | null
          memory_type: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          context_job_id?: string | null
          context_session_id?: string | null
          created_at?: string | null
          id?: string
          importance?: string
          is_active?: boolean | null
          memory_type: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          context_job_id?: string | null
          context_session_id?: string | null
          created_at?: string | null
          id?: string
          importance?: string
          is_active?: boolean | null
          memory_type?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_memory_context_job_id_fkey"
            columns: ["context_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coach_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_sessions: {
        Row: {
          created_at: string
          gap_requirement: string
          gap_requirement_id: string | null
          id: string
          job_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gap_requirement: string
          gap_requirement_id?: string | null
          id?: string
          job_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gap_requirement?: string
          gap_requirement_id?: string | null
          id?: string
          job_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          name: string
          normalized_name: string | null
          notes: string | null
          size: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          normalized_name?: string | null
          notes?: string | null
          size?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          normalized_name?: string | null
          notes?: string | null
          size?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      companion_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_logs: {
        Row: {
          contact_type: string
          created_at: string | null
          id: string
          lead_id: string | null
          notes: string | null
          outcome: string | null
          user_id: string | null
        }
        Insert: {
          contact_type: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          outcome?: string | null
          user_id?: string | null
        }
        Update: {
          contact_type?: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          outcome?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          cover_letter_url: string | null
          created_at: string
          generated_by: string
          id: string
          job_id: string
          resume_url: string | null
          user_id: string
          version: string
        }
        Insert: {
          cover_letter_url?: string | null
          created_at?: string
          generated_by: string
          id?: string
          job_id: string
          resume_url?: string | null
          user_id: string
          version: string
        }
        Update: {
          cover_letter_url?: string | null
          created_at?: string
          generated_by?: string
          id?: string
          job_id?: string
          resume_url?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_events: {
        Row: {
          affected_routes: string[]
          created_at: string
          event_id: string
          event_type: string
          id: number
          invalidates: string[]
          job_id: string | null
          metadata: Json
          payload: Json
          recomputes: string[]
          severity: string
          source: string
          user_id: string
        }
        Insert: {
          affected_routes?: string[]
          created_at?: string
          event_id: string
          event_type: string
          id?: number
          invalidates?: string[]
          job_id?: string | null
          metadata?: Json
          payload?: Json
          recomputes?: string[]
          severity?: string
          source: string
          user_id: string
        }
        Update: {
          affected_routes?: string[]
          created_at?: string
          event_id?: string
          event_type?: string
          id?: number
          invalidates?: string[]
          job_id?: string | null
          metadata?: Json
          payload?: Json
          recomputes?: string[]
          severity?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_library: {
        Row: {
          approved_achievement_bullets: string[] | null
          approved_keywords: string[] | null
          business_goal: string | null
          coach_tags: string[] | null
          coached_version: string | null
          company_name: string | null
          confidence_level: string | null
          confidence_score: number | null
          created_at: string | null
          credential_type: string | null
          date_range: string | null
          evidence_weight: string | null
          first_confirmed_job_id: string | null
          id: string
          industries: string[] | null
          is_active: boolean | null
          is_user_approved: boolean | null
          normalized_label: string | null
          outcomes: string[] | null
          priority_rank: number | null
          project_name: string | null
          provenance: string | null
          proof_snippet: string | null
          raw_resume_section: string | null
          responsibilities: string[] | null
          role_family_tags: string[] | null
          role_name: string | null
          source_resume_id: string | null
          source_title: string
          source_type: string
          source_url: string | null
          systems_used: string[] | null
          tools_used: string[] | null
          updated_at: string | null
          user_id: string | null
          user_problem: string | null
          visibility_status: string | null
          what_not_to_overstate: string | null
          what_shipped: string | null
          what_visible: string | null
          workflows_created: string[] | null
        }
        Insert: {
          approved_achievement_bullets?: string[] | null
          approved_keywords?: string[] | null
          business_goal?: string | null
          coach_tags?: string[] | null
          coached_version?: string | null
          company_name?: string | null
          confidence_level?: string | null
          confidence_score?: number | null
          created_at?: string | null
          credential_type?: string | null
          date_range?: string | null
          evidence_weight?: string | null
          first_confirmed_job_id?: string | null
          id?: string
          industries?: string[] | null
          is_active?: boolean | null
          is_user_approved?: boolean | null
          normalized_label?: string | null
          outcomes?: string[] | null
          priority_rank?: number | null
          project_name?: string | null
          provenance?: string | null
          proof_snippet?: string | null
          raw_resume_section?: string | null
          responsibilities?: string[] | null
          role_family_tags?: string[] | null
          role_name?: string | null
          source_resume_id?: string | null
          source_title: string
          source_type: string
          source_url?: string | null
          systems_used?: string[] | null
          tools_used?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          user_problem?: string | null
          visibility_status?: string | null
          what_not_to_overstate?: string | null
          what_shipped?: string | null
          what_visible?: string | null
          workflows_created?: string[] | null
        }
        Update: {
          approved_achievement_bullets?: string[] | null
          approved_keywords?: string[] | null
          business_goal?: string | null
          coach_tags?: string[] | null
          coached_version?: string | null
          company_name?: string | null
          confidence_level?: string | null
          confidence_score?: number | null
          created_at?: string | null
          credential_type?: string | null
          date_range?: string | null
          evidence_weight?: string | null
          first_confirmed_job_id?: string | null
          id?: string
          industries?: string[] | null
          is_active?: boolean | null
          is_user_approved?: boolean | null
          normalized_label?: string | null
          outcomes?: string[] | null
          priority_rank?: number | null
          project_name?: string | null
          provenance?: string | null
          proof_snippet?: string | null
          raw_resume_section?: string | null
          responsibilities?: string[] | null
          role_family_tags?: string[] | null
          role_name?: string | null
          source_resume_id?: string | null
          source_title?: string
          source_type?: string
          source_url?: string | null
          systems_used?: string[] | null
          tools_used?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          user_problem?: string | null
          visibility_status?: string | null
          what_not_to_overstate?: string | null
          what_shipped?: string | null
          what_visible?: string | null
          workflows_created?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_library_first_confirmed_job_id_fkey"
            columns: ["first_confirmed_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_library_source_resume_id_fkey"
            columns: ["source_resume_id"]
            isOneToOne: false
            referencedRelation: "source_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_complete: boolean | null
          lead_id: string | null
          outcome: string | null
          reminder_note: string | null
          scheduled_for: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          lead_id?: string | null
          outcome?: string | null
          reminder_note?: string | null
          scheduled_for: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          lead_id?: string | null
          outcome?: string | null
          reminder_note?: string | null
          scheduled_for?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_documents: {
        Row: {
          content: string
          created_at: string | null
          document_type: string
          generation_model: string | null
          generation_workflow_version: string | null
          id: string
          job_id: string | null
          profile_snapshot_id: string | null
          user_id: string | null
          version: number
        }
        Insert: {
          content: string
          created_at?: string | null
          document_type: string
          generation_model?: string | null
          generation_workflow_version?: string | null
          id?: string
          job_id?: string | null
          profile_snapshot_id?: string | null
          user_id?: string | null
          version?: number
        }
        Update: {
          content?: string
          created_at?: string | null
          document_type?: string
          generation_model?: string | null
          generation_workflow_version?: string | null
          id?: string
          job_id?: string | null
          profile_snapshot_id?: string | null
          user_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_profile_snapshot_id_fkey"
            columns: ["profile_snapshot_id"]
            isOneToOne: false
            referencedRelation: "profile_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_quality_checks: {
        Row: {
          ai_filler_found: string[] | null
          created_at: string | null
          document_type: string
          generic_buzzwords_found: string[] | null
          id: string
          invented_claims_found: string[] | null
          issues_count: number | null
          job_id: string
          passed: boolean
          regeneration_count: number | null
          repeated_structures_found: string[] | null
          unsupported_claims_found: string[] | null
          user_id: string | null
          vague_bullets_found: string[] | null
          weak_summaries_found: string[] | null
        }
        Insert: {
          ai_filler_found?: string[] | null
          created_at?: string | null
          document_type: string
          generic_buzzwords_found?: string[] | null
          id?: string
          invented_claims_found?: string[] | null
          issues_count?: number | null
          job_id: string
          passed: boolean
          regeneration_count?: number | null
          repeated_structures_found?: string[] | null
          unsupported_claims_found?: string[] | null
          user_id?: string | null
          vague_bullets_found?: string[] | null
          weak_summaries_found?: string[] | null
        }
        Update: {
          ai_filler_found?: string[] | null
          created_at?: string | null
          document_type?: string
          generic_buzzwords_found?: string[] | null
          id?: string
          invented_claims_found?: string[] | null
          issues_count?: number | null
          job_id?: string
          passed?: boolean
          regeneration_count?: number | null
          repeated_structures_found?: string[] | null
          unsupported_claims_found?: string[] | null
          user_id?: string | null
          vague_bullets_found?: string[] | null
          weak_summaries_found?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_quality_checks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_bank: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          is_favorite: boolean | null
          item_type: string
          source_evidence_id: string | null
          source_job_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          use_count: number | null
          user_id: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          item_type: string
          source_evidence_id?: string | null
          source_job_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          item_type?: string
          source_evidence_id?: string | null
          source_job_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_bank_source_evidence_id_fkey"
            columns: ["source_evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_bank_source_job_id_fkey"
            columns: ["source_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_prep: {
        Row: {
          behavioral_stories: Json | null
          best_angles: Json | null
          company_alignment: Json | null
          created_at: string | null
          evidence_coverage_percent: number | null
          fit_level: string | null
          gap_handling: Json | null
          generation_model: string | null
          generation_version: string | null
          id: string
          interview_snapshot: Json | null
          job_id: string
          likely_questions: Json | null
          objection_handling: Json | null
          questions_to_ask: Json | null
          quick_sheet: Json | null
          resume_defense: Json | null
          saved_to_bank_ids: string[] | null
          strategy: string | null
          tell_me_about_yourself: Json | null
          updated_at: string | null
          user_id: string | null
          user_marked_stories: Json | null
          why_this_role: Json | null
        }
        Insert: {
          behavioral_stories?: Json | null
          best_angles?: Json | null
          company_alignment?: Json | null
          created_at?: string | null
          evidence_coverage_percent?: number | null
          fit_level?: string | null
          gap_handling?: Json | null
          generation_model?: string | null
          generation_version?: string | null
          id?: string
          interview_snapshot?: Json | null
          job_id: string
          likely_questions?: Json | null
          objection_handling?: Json | null
          questions_to_ask?: Json | null
          quick_sheet?: Json | null
          resume_defense?: Json | null
          saved_to_bank_ids?: string[] | null
          strategy?: string | null
          tell_me_about_yourself?: Json | null
          updated_at?: string | null
          user_id?: string | null
          user_marked_stories?: Json | null
          why_this_role?: Json | null
        }
        Update: {
          behavioral_stories?: Json | null
          best_angles?: Json | null
          company_alignment?: Json | null
          created_at?: string | null
          evidence_coverage_percent?: number | null
          fit_level?: string | null
          gap_handling?: Json | null
          generation_model?: string | null
          generation_version?: string | null
          id?: string
          interview_snapshot?: Json | null
          job_id?: string
          likely_questions?: Json | null
          objection_handling?: Json | null
          questions_to_ask?: Json | null
          quick_sheet?: Json | null
          resume_defense?: Json | null
          saved_to_bank_ids?: string[] | null
          strategy?: string | null
          tell_me_about_yourself?: Json | null
          updated_at?: string | null
          user_id?: string | null
          user_marked_stories?: Json | null
          why_this_role?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_prep_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_analyses: {
        Row: {
          analysis_model: string | null
          analysis_version: string | null
          ats_match_score: number | null
          ats_phrases: string[] | null
          company: string | null
          created_at: string | null
          description_raw: string | null
          employment_type: string | null
          id: string
          job_id: string
          keywords: string[] | null
          known_gaps: string[] | null
          location: string | null
          matched_achievements: string[] | null
          matched_evidence_ids: string[] | null
          matched_industries: string[] | null
          matched_keywords: string[] | null
          matched_projects: string[] | null
          matched_skills: string[] | null
          matched_tools: string[] | null
          missing_keywords: string[] | null
          qualifications_preferred: string[] | null
          qualifications_required: string[] | null
          requirements_structured: Json | null
          responsibilities: string[] | null
          salary_text: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          analysis_model?: string | null
          analysis_version?: string | null
          ats_match_score?: number | null
          ats_phrases?: string[] | null
          company?: string | null
          created_at?: string | null
          description_raw?: string | null
          employment_type?: string | null
          id?: string
          job_id: string
          keywords?: string[] | null
          known_gaps?: string[] | null
          location?: string | null
          matched_achievements?: string[] | null
          matched_evidence_ids?: string[] | null
          matched_industries?: string[] | null
          matched_keywords?: string[] | null
          matched_projects?: string[] | null
          matched_skills?: string[] | null
          matched_tools?: string[] | null
          missing_keywords?: string[] | null
          qualifications_preferred?: string[] | null
          qualifications_required?: string[] | null
          requirements_structured?: Json | null
          responsibilities?: string[] | null
          salary_text?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          analysis_model?: string | null
          analysis_version?: string | null
          ats_match_score?: number | null
          ats_phrases?: string[] | null
          company?: string | null
          created_at?: string | null
          description_raw?: string | null
          employment_type?: string | null
          id?: string
          job_id?: string
          keywords?: string[] | null
          known_gaps?: string[] | null
          location?: string | null
          matched_achievements?: string[] | null
          matched_evidence_ids?: string[] | null
          matched_industries?: string[] | null
          matched_keywords?: string[] | null
          matched_projects?: string[] | null
          matched_skills?: string[] | null
          matched_tools?: string[] | null
          missing_keywords?: string[] | null
          qualifications_preferred?: string[] | null
          qualifications_required?: string[] | null
          requirements_structured?: Json | null
          responsibilities?: string[] | null
          salary_text?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_analyses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_resume_versions: {
        Row: {
          cover_letter_text: string | null
          created_at: string
          generation_model: string | null
          id: string
          job_id: string
          label: string | null
          quality_passed: boolean | null
          quality_score: number | null
          resume_font: string | null
          resume_format: string | null
          resume_text: string | null
          strategy: string | null
          user_id: string
          version_number: number
        }
        Insert: {
          cover_letter_text?: string | null
          created_at?: string
          generation_model?: string | null
          id?: string
          job_id: string
          label?: string | null
          quality_passed?: boolean | null
          quality_score?: number | null
          resume_font?: string | null
          resume_format?: string | null
          resume_text?: string | null
          strategy?: string | null
          user_id: string
          version_number?: number
        }
        Update: {
          cover_letter_text?: string | null
          created_at?: string
          generation_model?: string | null
          id?: string
          job_id?: string
          label?: string | null
          quality_passed?: boolean | null
          quality_score?: number | null
          resume_font?: string | null
          resume_format?: string | null
          resume_text?: string | null
          strategy?: string | null
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_resume_versions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_scores: {
        Row: {
          ats_keywords: number
          confidence_score: number
          created_at: string
          evidence_quality: number
          experience_relevance: number
          id: string
          job_id: string
          overall_score: number
          scoring_version: string
          seniority_alignment: number
          skills_match: number
        }
        Insert: {
          ats_keywords: number
          confidence_score: number
          created_at?: string
          evidence_quality: number
          experience_relevance: number
          id?: string
          job_id: string
          overall_score: number
          scoring_version: string
          seniority_alignment: number
          skills_match: number
        }
        Update: {
          ats_keywords?: number
          confidence_score?: number
          created_at?: string
          evidence_quality?: number
          experience_relevance?: number
          id?: string
          job_id?: string
          overall_score?: number
          scoring_version?: string
          seniority_alignment?: number
          skills_match?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_scores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applied_at: string | null
          company_id: string | null
          company_name: string | null
          cover_letter_strategy: string | null
          created_at: string
          deleted_at: string | null
          edited_cover_letter: string | null
          edited_resume: string | null
          evidence_map: Json | null
          evidence_map_version: string | null
          fit: string | null
          format_recommendation_reason: string | null
          gap_clarifications: Json | null
          gaps_addressed: string[] | null
          generated_cover_letter: string | null
          generated_resume: string | null
          generation_attempts: number | null
          generation_error: string | null
          generation_quality_issues: string[] | null
          generation_quality_score: number | null
          generation_status: string | null
          generation_timestamp: string | null
          id: string
          industry_guess: string | null
          job_description: string | null
          job_url: string
          last_edited_at: string | null
          last_generation_at: string | null
          quality_issues: string[] | null
          quality_passed: boolean | null
          resume_font: string | null
          resume_format: string | null
          resume_provenance: Json | null
          resume_strategy: string | null
          role_family: string | null
          role_title: string | null
          score: number | null
          score_gaps: string[] | null
          score_reasoning: Json | null
          score_strengths: string[] | null
          scored_at: string | null
          seniority_level: string | null
          source: string | null
          status: string
          updated_at: string | null
          user_id: string
          voice_drift_result: Json | null
          voice_integrity_passed: boolean | null
          voice_mode: string | null
          voice_profile_snapshot: Json | null
          voice_review_status: string | null
          voice_reviewed_at: string | null
        }
        Insert: {
          applied_at?: string | null
          company_id?: string | null
          company_name?: string | null
          cover_letter_strategy?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_cover_letter?: string | null
          edited_resume?: string | null
          evidence_map?: Json | null
          evidence_map_version?: string | null
          fit?: string | null
          format_recommendation_reason?: string | null
          gap_clarifications?: Json | null
          gaps_addressed?: string[] | null
          generated_cover_letter?: string | null
          generated_resume?: string | null
          generation_attempts?: number | null
          generation_error?: string | null
          generation_quality_issues?: string[] | null
          generation_quality_score?: number | null
          generation_status?: string | null
          generation_timestamp?: string | null
          id?: string
          industry_guess?: string | null
          job_description?: string | null
          job_url: string
          last_edited_at?: string | null
          last_generation_at?: string | null
          quality_issues?: string[] | null
          quality_passed?: boolean | null
          resume_font?: string | null
          resume_format?: string | null
          resume_provenance?: Json | null
          resume_strategy?: string | null
          role_family?: string | null
          role_title?: string | null
          score?: number | null
          score_gaps?: string[] | null
          score_reasoning?: Json | null
          score_strengths?: string[] | null
          scored_at?: string | null
          seniority_level?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          voice_drift_result?: Json | null
          voice_integrity_passed?: boolean | null
          voice_mode?: string | null
          voice_profile_snapshot?: Json | null
          voice_review_status?: string | null
          voice_reviewed_at?: string | null
        }
        Update: {
          applied_at?: string | null
          company_id?: string | null
          company_name?: string | null
          cover_letter_strategy?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_cover_letter?: string | null
          edited_resume?: string | null
          evidence_map?: Json | null
          evidence_map_version?: string | null
          fit?: string | null
          format_recommendation_reason?: string | null
          gap_clarifications?: Json | null
          gaps_addressed?: string[] | null
          generated_cover_letter?: string | null
          generated_resume?: string | null
          generation_attempts?: number | null
          generation_error?: string | null
          generation_quality_issues?: string[] | null
          generation_quality_score?: number | null
          generation_status?: string | null
          generation_timestamp?: string | null
          id?: string
          industry_guess?: string | null
          job_description?: string | null
          job_url?: string
          last_edited_at?: string | null
          last_generation_at?: string | null
          quality_issues?: string[] | null
          quality_passed?: boolean | null
          resume_font?: string | null
          resume_format?: string | null
          resume_provenance?: Json | null
          resume_strategy?: string | null
          role_family?: string | null
          role_title?: string | null
          score?: number | null
          score_gaps?: string[] | null
          score_reasoning?: Json | null
          score_strengths?: string[] | null
          scored_at?: string | null
          seniority_level?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          voice_drift_result?: Json | null
          voice_integrity_passed?: boolean | null
          voice_mode?: string | null
          voice_profile_snapshot?: Json | null
          voice_review_status?: string | null
          voice_reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_deprecated: {
        Row: {
          analyzed_at: string | null
          applied_at: string | null
          ats_job_id: string | null
          ats_keywords: string[] | null
          canonical_url: string | null
          company: string | null
          cover_letter_strategy: string | null
          created_at: string | null
          duplicate_of_job_id: string | null
          employment_type: string | null
          error_message: string | null
          error_step: string | null
          evidence_map: Json | null
          extracted_data: Json | null
          fingerprint_hash: string | null
          fit: string | null
          generated_cover_letter: string | null
          generated_resume: string | null
          generation_attempts: number | null
          generation_error: string | null
          generation_quality_issues: string[] | null
          generation_quality_score: number | null
          generation_status: string | null
          generation_timestamp: string | null
          id: string
          industry_guess: string | null
          keywords_extracted: Json | null
          last_generation_at: string | null
          location: string | null
          match_data: Json | null
          parse_missing_fields: string[] | null
          parse_quality: string | null
          parsed_at: string | null
          profile_snapshot_id: string | null
          qualifications_preferred: string[] | null
          qualifications_required: string[] | null
          quality_issues: string[] | null
          quality_passed: boolean | null
          raw_description: string | null
          reasoning: Json | null
          request_id: string | null
          responsibilities: string[] | null
          resume_strategy: string | null
          role_family: string | null
          salary_range: string | null
          score: number | null
          score_gaps: string[] | null
          score_reasoning: Json | null
          score_strengths: string[] | null
          scored_at: string | null
          seniority_level: string | null
          source: string | null
          source_url: string | null
          status: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          analyzed_at?: string | null
          applied_at?: string | null
          ats_job_id?: string | null
          ats_keywords?: string[] | null
          canonical_url?: string | null
          company?: string | null
          cover_letter_strategy?: string | null
          created_at?: string | null
          duplicate_of_job_id?: string | null
          employment_type?: string | null
          error_message?: string | null
          error_step?: string | null
          evidence_map?: Json | null
          extracted_data?: Json | null
          fingerprint_hash?: string | null
          fit?: string | null
          generated_cover_letter?: string | null
          generated_resume?: string | null
          generation_attempts?: number | null
          generation_error?: string | null
          generation_quality_issues?: string[] | null
          generation_quality_score?: number | null
          generation_status?: string | null
          generation_timestamp?: string | null
          id?: string
          industry_guess?: string | null
          keywords_extracted?: Json | null
          last_generation_at?: string | null
          location?: string | null
          match_data?: Json | null
          parse_missing_fields?: string[] | null
          parse_quality?: string | null
          parsed_at?: string | null
          profile_snapshot_id?: string | null
          qualifications_preferred?: string[] | null
          qualifications_required?: string[] | null
          quality_issues?: string[] | null
          quality_passed?: boolean | null
          raw_description?: string | null
          reasoning?: Json | null
          request_id?: string | null
          responsibilities?: string[] | null
          resume_strategy?: string | null
          role_family?: string | null
          salary_range?: string | null
          score?: number | null
          score_gaps?: string[] | null
          score_reasoning?: Json | null
          score_strengths?: string[] | null
          scored_at?: string | null
          seniority_level?: string | null
          source?: string | null
          source_url?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          analyzed_at?: string | null
          applied_at?: string | null
          ats_job_id?: string | null
          ats_keywords?: string[] | null
          canonical_url?: string | null
          company?: string | null
          cover_letter_strategy?: string | null
          created_at?: string | null
          duplicate_of_job_id?: string | null
          employment_type?: string | null
          error_message?: string | null
          error_step?: string | null
          evidence_map?: Json | null
          extracted_data?: Json | null
          fingerprint_hash?: string | null
          fit?: string | null
          generated_cover_letter?: string | null
          generated_resume?: string | null
          generation_attempts?: number | null
          generation_error?: string | null
          generation_quality_issues?: string[] | null
          generation_quality_score?: number | null
          generation_status?: string | null
          generation_timestamp?: string | null
          id?: string
          industry_guess?: string | null
          keywords_extracted?: Json | null
          last_generation_at?: string | null
          location?: string | null
          match_data?: Json | null
          parse_missing_fields?: string[] | null
          parse_quality?: string | null
          parsed_at?: string | null
          profile_snapshot_id?: string | null
          qualifications_preferred?: string[] | null
          qualifications_required?: string[] | null
          quality_issues?: string[] | null
          quality_passed?: boolean | null
          raw_description?: string | null
          reasoning?: Json | null
          request_id?: string | null
          responsibilities?: string[] | null
          resume_strategy?: string | null
          role_family?: string | null
          salary_range?: string | null
          score?: number | null
          score_gaps?: string[] | null
          score_reasoning?: Json | null
          score_strengths?: string[] | null
          scored_at?: string | null
          seniority_level?: string | null
          source?: string | null
          source_url?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_duplicate_of_job_id_fkey"
            columns: ["duplicate_of_job_id"]
            isOneToOne: false
            referencedRelation: "jobs_deprecated"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          access_notes: string | null
          address: string | null
          assigned_to: string | null
          call_script: string | null
          city: string | null
          created_at: string | null
          customer_name: string
          email: string | null
          email_template: string | null
          flexibility: string | null
          id: string
          job_description: string | null
          objection_handlers: Json | null
          phone: string | null
          preferred_date: string | null
          preferred_time: string | null
          priority: number | null
          property_type: string | null
          raw_lead_text: string | null
          service_type: string | null
          situation_summary: string | null
          sms_template: string | null
          source: string | null
          source_detail: string | null
          status: string | null
          updated_at: string | null
          urgency: string | null
          user_id: string | null
        }
        Insert: {
          access_notes?: string | null
          address?: string | null
          assigned_to?: string | null
          call_script?: string | null
          city?: string | null
          created_at?: string | null
          customer_name: string
          email?: string | null
          email_template?: string | null
          flexibility?: string | null
          id?: string
          job_description?: string | null
          objection_handlers?: Json | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          priority?: number | null
          property_type?: string | null
          raw_lead_text?: string | null
          service_type?: string | null
          situation_summary?: string | null
          sms_template?: string | null
          source?: string | null
          source_detail?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
          user_id?: string | null
        }
        Update: {
          access_notes?: string | null
          address?: string | null
          assigned_to?: string | null
          call_script?: string | null
          city?: string | null
          created_at?: string | null
          customer_name?: string
          email?: string | null
          email_template?: string | null
          flexibility?: string | null
          id?: string
          job_description?: string | null
          objection_handlers?: Json | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          priority?: number | null
          property_type?: string | null
          raw_lead_text?: string | null
          service_type?: string | null
          situation_summary?: string | null
          sms_template?: string | null
          source?: string | null
          source_detail?: string | null
          status?: string | null
          updated_at?: string | null
          urgency?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      os_ai_context_links: {
        Row: {
          context_id: string | null
          context_type: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      os_ai_threads: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      os_boards: {
        Row: {
          board_type: string
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          kpi_config: Json | null
          name: string
          project_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          board_type?: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          kpi_config?: Json | null
          name: string
          project_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          board_type?: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          kpi_config?: Json | null
          name?: string
          project_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_boards_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_boards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "os_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_boards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_calendar_event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          rsvp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          rsvp?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          rsvp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_calendar_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "os_calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_calendar_event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
        ]
      }
      os_calendar_events: {
        Row: {
          all_day: boolean
          archived_at: string | null
          board_id: string | null
          calendar_color: string | null
          calendar_label: string | null
          color: string | null
          created_at: string
          created_by_user_id: string | null
          description: string | null
          end_at: string | null
          ends_at: string
          event_type: string
          id: string
          location: string | null
          meeting_url: string | null
          monday_item_id: string | null
          owner_user_id: string | null
          project_id: string | null
          recurrence_rule: string | null
          start_at: string | null
          starts_at: string
          status: string
          task_id: string | null
          tenant_id: string
          timezone: string | null
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          all_day?: boolean
          archived_at?: string | null
          board_id?: string | null
          calendar_color?: string | null
          calendar_label?: string | null
          color?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          end_at?: string | null
          ends_at: string
          event_type?: string
          id?: string
          location?: string | null
          meeting_url?: string | null
          monday_item_id?: string | null
          owner_user_id?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          start_at?: string | null
          starts_at: string
          status?: string
          task_id?: string | null
          tenant_id: string
          timezone?: string | null
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          all_day?: boolean
          archived_at?: string | null
          board_id?: string | null
          calendar_color?: string | null
          calendar_label?: string | null
          color?: string | null
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          end_at?: string | null
          ends_at?: string
          event_type?: string
          id?: string
          location?: string | null
          meeting_url?: string | null
          monday_item_id?: string | null
          owner_user_id?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          start_at?: string | null
          starts_at?: string
          status?: string
          task_id?: string | null
          tenant_id?: string
          timezone?: string | null
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_calendar_events_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "os_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_calendar_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_channels: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_dm: boolean
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_dm?: boolean
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_dm?: boolean
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_comments: {
        Row: {
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
        ]
      }
      os_companies: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          industry: string | null
          metadata: Json | null
          name: string
          notes: string | null
          status: string
          tenant_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          industry?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          industry?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_contacts: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          status: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "os_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_docs: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          doc_type: string
          id: string
          linked_task_id: string | null
          metadata: Json | null
          status: string
          tenant_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          doc_type?: string
          id?: string
          linked_task_id?: string | null
          metadata?: Json | null
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          doc_type?: string
          id?: string
          linked_task_id?: string | null
          metadata?: Json | null
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_docs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_docs_linked_task_id_fkey"
            columns: ["linked_task_id"]
            isOneToOne: false
            referencedRelation: "byred_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_docs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_entity_links: {
        Row: {
          created_at: string | null
          from_entity_id: string
          from_entity_type: string
          id: string
          link_type: string
          metadata: Json | null
          to_entity_id: string
          to_entity_type: string
        }
        Insert: {
          created_at?: string | null
          from_entity_id: string
          from_entity_type: string
          id?: string
          link_type: string
          metadata?: Json | null
          to_entity_id: string
          to_entity_type: string
        }
        Update: {
          created_at?: string | null
          from_entity_id?: string
          from_entity_type?: string
          id?: string
          link_type?: string
          metadata?: Json | null
          to_entity_id?: string
          to_entity_type?: string
        }
        Relationships: []
      }
      os_files: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          external_url: string | null
          file_name: string
          file_type: string | null
          id: string
          mime_type: string | null
          storage_path: string | null
          storage_provider: string | null
          tenant_id: string
          updated_at: string | null
          uploaded_by_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          external_url?: string | null
          file_name: string
          file_type?: string | null
          id?: string
          mime_type?: string | null
          storage_path?: string | null
          storage_provider?: string | null
          tenant_id: string
          updated_at?: string | null
          uploaded_by_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          external_url?: string | null
          file_name?: string
          file_type?: string | null
          id?: string
          mime_type?: string | null
          storage_path?: string | null
          storage_provider?: string | null
          tenant_id?: string
          updated_at?: string | null
          uploaded_by_user_id?: string | null
        }
        Relationships: []
      }
      os_import_batches: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          id: string
          metadata: Json | null
          source_system: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id: string
          id?: string
          metadata?: Json | null
          source_system: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          id?: string
          metadata?: Json | null
          source_system?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      os_import_rows: {
        Row: {
          batch_id: string
          created_at: string | null
          data: Json
          error_message: string | null
          id: string
          source_row_hash: string
          status: string
          updated_at: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          data: Json
          error_message?: string | null
          id?: string
          source_row_hash: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          data?: Json
          error_message?: string | null
          id?: string
          source_row_hash?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_import_rows_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "os_import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      os_integrations: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      os_lantern_comms_log: {
        Row: {
          approved_by_user: boolean
          audience: string
          created_at: string
          created_by: string | null
          delivery_channel: string
          generated_body: string
          id: string
          intent: string
          length_mode: string
          message_type: string
          recipients: string[] | null
          related_project_id: string | null
          related_task_id: string | null
          sent_at: string | null
          subject: string | null
          tenant_id: string | null
          tone_mode: string
        }
        Insert: {
          approved_by_user?: boolean
          audience: string
          created_at?: string
          created_by?: string | null
          delivery_channel: string
          generated_body: string
          id?: string
          intent: string
          length_mode: string
          message_type: string
          recipients?: string[] | null
          related_project_id?: string | null
          related_task_id?: string | null
          sent_at?: string | null
          subject?: string | null
          tenant_id?: string | null
          tone_mode: string
        }
        Update: {
          approved_by_user?: boolean
          audience?: string
          created_at?: string
          created_by?: string | null
          delivery_channel?: string
          generated_body?: string
          id?: string
          intent?: string
          length_mode?: string
          message_type?: string
          recipients?: string[] | null
          related_project_id?: string | null
          related_task_id?: string | null
          sent_at?: string | null
          subject?: string | null
          tenant_id?: string | null
          tone_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_lantern_comms_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_lantern_comms_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_messages: {
        Row: {
          body: string
          channel_id: string
          created_at: string | null
          id: string
          reply_to_id: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          channel_id: string
          created_at?: string | null
          id?: string
          reply_to_id?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          channel_id?: string
          created_at?: string | null
          id?: string
          reply_to_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "os_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "os_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
        ]
      }
      os_notifications: {
        Row: {
          actor_id: string | null
          body: string
          context_url: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          read: boolean
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          body?: string
          context_url?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          body?: string
          context_url?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
        ]
      }
      os_phases: {
        Row: {
          board_id: string
          color: string | null
          created_at: string
          id: string
          name: string
          order_index: number
        }
        Insert: {
          board_id: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          board_id?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "os_phases_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "os_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      os_projects: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          order_index: number | null
          owner_user_id: string | null
          priority: string
          start_date: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          order_index?: number | null
          owner_user_id?: string | null
          priority?: string
          start_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          order_index?: number | null
          owner_user_id?: string | null
          priority?: string
          start_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_projects_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_projects_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_search_index: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      os_task_dependencies: {
        Row: {
          created_at: string
          depends_on_task_id: string
          id: string
          task_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          depends_on_task_id: string
          id?: string
          task_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "byred_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "byred_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      os_tasks: {
        Row: {
          blocker_flag: boolean
          blocker_reason: string | null
          board_id: string | null
          created_at: string
          created_by_user_id: string | null
          definition_of_done: string | null
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          monday_item_id: string | null
          order_index: number
          owner_user_id: string | null
          phase_id: string | null
          priority: string
          project_id: string | null
          start_date: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          blocker_flag?: boolean
          blocker_reason?: string | null
          board_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          definition_of_done?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          monday_item_id?: string | null
          order_index?: number
          owner_user_id?: string | null
          phase_id?: string | null
          priority?: string
          project_id?: string | null
          start_date?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          blocker_flag?: boolean
          blocker_reason?: string | null
          board_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          definition_of_done?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          monday_item_id?: string | null
          order_index?: number
          owner_user_id?: string | null
          phase_id?: string | null
          priority?: string
          project_id?: string | null
          start_date?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_tasks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "os_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_tasks_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_tasks_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "byred_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "os_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "os_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "byred_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_triggers: {
        Row: {
          alert_channels: string[] | null
          alert_user_ids: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string | null
          watch_condition: Json
          watch_entity: string
        }
        Insert: {
          alert_channels?: string[] | null
          alert_user_ids?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string | null
          watch_condition: Json
          watch_entity: string
        }
        Update: {
          alert_channels?: string[] | null
          alert_user_ids?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
          watch_condition?: Json
          watch_entity?: string
        }
        Relationships: []
      }
      os_workflows: {
        Row: {
          action: Json
          condition: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          action: Json
          condition?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          action?: Json
          condition?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pending_profile_changes: {
        Row: {
          applied_at: string | null
          created_at: string | null
          id: string
          proposed_changes: Json
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          status: string
          summary: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          id?: string
          proposed_changes: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          summary: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          id?: string
          proposed_changes?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      processing_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          job_id: string | null
          message: string | null
          metadata: Json | null
          request_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          job_id?: string | null
          message?: string | null
          metadata?: Json | null
          request_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          job_id?: string | null
          message?: string | null
          metadata?: Json | null
          request_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_change_audit: {
        Row: {
          applied_at: string | null
          change_id: string
          changes_applied: Json
          id: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          change_id: string
          changes_applied: Json
          id?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          change_id?: string
          changes_applied?: Json
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_change_audit_change_id_fkey"
            columns: ["change_id"]
            isOneToOne: false
            referencedRelation: "pending_profile_changes"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_links: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          label: string | null
          link_type: string
          metadata: Json | null
          parse_status: string | null
          source: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          link_type: string
          metadata?: Json | null
          parse_status?: string | null
          source?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          link_type?: string
          metadata?: Json | null
          parse_status?: string | null
          source?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_snapshots: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string | null
          snapshot_payload: Json
          snapshot_version: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          snapshot_payload: Json
          snapshot_version?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          snapshot_payload?: Json
          snapshot_version?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_snapshots_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          education: Json | null
          full_name: string | null
          headline: string | null
          id: string
          linkedin_url: string | null
          portfolio_links: Json | null
          skills: Json | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          education?: Json | null
          full_name?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          portfolio_links?: Json | null
          skills?: Json | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          education?: Json | null
          full_name?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          portfolio_links?: Json | null
          skills?: Json | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      profiles_deprecated: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          birth_day_number: number | null
          birth_latitude: number | null
          birth_location: string | null
          birth_longitude: number | null
          birth_time: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          expression_number: number | null
          hd_authority: string | null
          hd_centers: Json | null
          hd_channels: Json | null
          hd_defined_centers: string[] | null
          hd_definition: string | null
          hd_gates: Json | null
          hd_incarnation_cross: string | null
          hd_not_self_theme: string | null
          hd_profile: string | null
          hd_signature: string | null
          hd_strategy: string | null
          hd_type: string | null
          id: string
          is_premium: boolean | null
          life_path_number: number | null
          mars_sign: string | null
          mercury_sign: string | null
          moon_sign: string | null
          natal_chart: Json | null
          notification_preferences: Json | null
          onboarding_complete: boolean | null
          onboarding_step: number | null
          personality_number: number | null
          premium_since: string | null
          rising_sign: string | null
          soul_urge_number: number | null
          spiritual_orientation: string | null
          sun_sign: string | null
          updated_at: string | null
          venus_sign: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          birth_day_number?: number | null
          birth_latitude?: number | null
          birth_location?: string | null
          birth_longitude?: number | null
          birth_time?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          expression_number?: number | null
          hd_authority?: string | null
          hd_centers?: Json | null
          hd_channels?: Json | null
          hd_defined_centers?: string[] | null
          hd_definition?: string | null
          hd_gates?: Json | null
          hd_incarnation_cross?: string | null
          hd_not_self_theme?: string | null
          hd_profile?: string | null
          hd_signature?: string | null
          hd_strategy?: string | null
          hd_type?: string | null
          id: string
          is_premium?: boolean | null
          life_path_number?: number | null
          mars_sign?: string | null
          mercury_sign?: string | null
          moon_sign?: string | null
          natal_chart?: Json | null
          notification_preferences?: Json | null
          onboarding_complete?: boolean | null
          onboarding_step?: number | null
          personality_number?: number | null
          premium_since?: string | null
          rising_sign?: string | null
          soul_urge_number?: number | null
          spiritual_orientation?: string | null
          sun_sign?: string | null
          updated_at?: string | null
          venus_sign?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          birth_day_number?: number | null
          birth_latitude?: number | null
          birth_location?: string | null
          birth_longitude?: number | null
          birth_time?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          expression_number?: number | null
          hd_authority?: string | null
          hd_centers?: Json | null
          hd_channels?: Json | null
          hd_defined_centers?: string[] | null
          hd_definition?: string | null
          hd_gates?: Json | null
          hd_incarnation_cross?: string | null
          hd_not_self_theme?: string | null
          hd_profile?: string | null
          hd_signature?: string | null
          hd_strategy?: string | null
          hd_type?: string | null
          id?: string
          is_premium?: boolean | null
          life_path_number?: number | null
          mars_sign?: string | null
          mercury_sign?: string | null
          moon_sign?: string | null
          natal_chart?: Json | null
          notification_preferences?: Json | null
          onboarding_complete?: boolean | null
          onboarding_step?: number | null
          personality_number?: number | null
          premium_since?: string | null
          rising_sign?: string | null
          soul_urge_number?: number | null
          spiritual_orientation?: string | null
          sun_sign?: string | null
          updated_at?: string | null
          venus_sign?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          job_id: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      rituals: {
        Row: {
          audio_url: string | null
          category: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          hd_types: string[] | null
          id: string
          is_active: boolean | null
          premium_only: boolean | null
          slug: string
          steps: Json | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          hd_types?: string[] | null
          id?: string
          is_active?: boolean | null
          premium_only?: boolean | null
          slug: string
          steps?: Json | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          hd_types?: string[] | null
          id?: string
          is_active?: boolean | null
          premium_only?: boolean | null
          slug?: string
          steps?: Json | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      run_ledger: {
        Row: {
          created_at: string
          error_details: string | null
          id: string
          job_id: string
          metadata: Json | null
          status: string
          step_name: string
          summary_result: Json | null
          timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_details?: string | null
          id?: string
          job_id: string
          metadata?: Json | null
          status: string
          step_name: string
          summary_result?: Json | null
          timestamp: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_details?: string | null
          id?: string
          job_id?: string
          metadata?: Json | null
          status?: string
          step_name?: string
          summary_result?: Json | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      safety_audit_logs: {
        Row: {
          attack_vectors: Json | null
          blocked: boolean | null
          created_at: string | null
          id: string
          input_hash: string | null
          response_type: string | null
          risk_score: number | null
          session_id: string | null
          timestamp: string | null
          user_id: string | null
          violations: Json | null
        }
        Insert: {
          attack_vectors?: Json | null
          blocked?: boolean | null
          created_at?: string | null
          id?: string
          input_hash?: string | null
          response_type?: string | null
          risk_score?: number | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
          violations?: Json | null
        }
        Update: {
          attack_vectors?: Json | null
          blocked?: boolean | null
          created_at?: string | null
          id?: string
          input_hash?: string | null
          response_type?: string | null
          risk_score?: number | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
          violations?: Json | null
        }
        Relationships: []
      }
      source_resumes: {
        Row: {
          created_at: string | null
          file_name: string
          file_pathname: string | null
          file_size: number | null
          file_type: string
          file_url: string | null
          id: string
          is_primary: boolean | null
          label: string | null
          parse_error: string | null
          parse_status: string | null
          parsed_at: string | null
          parsed_data: Json | null
          parsed_text: string | null
          updated_at: string | null
          user_id: string
          voice_extracted_at: string | null
          voice_profile: Json | null
          voice_source_confidence: number | null
          voice_source_quality: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_pathname?: string | null
          file_size?: number | null
          file_type: string
          file_url?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          parse_error?: string | null
          parse_status?: string | null
          parsed_at?: string | null
          parsed_data?: Json | null
          parsed_text?: string | null
          updated_at?: string | null
          user_id: string
          voice_extracted_at?: string | null
          voice_profile?: Json | null
          voice_source_confidence?: number | null
          voice_source_quality?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_pathname?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          parse_error?: string | null
          parse_status?: string | null
          parsed_at?: string | null
          parsed_data?: Json | null
          parsed_text?: string | null
          updated_at?: string | null
          user_id?: string
          voice_extracted_at?: string | null
          voice_profile?: Json | null
          voice_source_confidence?: number | null
          voice_source_quality?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          current_period_end: string | null
          id: string
          plan_type: string
          status: string
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          current_period_end?: string | null
          id?: string
          plan_type: string
          status: string
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          current_period_end?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_career_patterns: {
        Row: {
          avg_score: number | null
          coach_recommendation: string | null
          created_at: string | null
          fit_signal: string
          id: string
          job_count: number
          role_family: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_score?: number | null
          coach_recommendation?: string | null
          created_at?: string | null
          fit_signal?: string
          id?: string
          job_count?: number
          role_family: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_score?: number | null
          coach_recommendation?: string | null
          created_at?: string | null
          fit_signal?: string
          id?: string
          job_count?: number
          role_family?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_education_records: {
        Row: {
          created_at: string
          degree_name: string | null
          education_type: string
          end_date: string | null
          equivalency_basis: Json | null
          evidence_text: string | null
          field_of_study: string | null
          id: string
          institution: string | null
          is_equivalent: boolean
          is_user_approved: boolean
          payload: Json | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          degree_name?: string | null
          education_type: string
          end_date?: string | null
          equivalency_basis?: Json | null
          evidence_text?: string | null
          field_of_study?: string | null
          id?: string
          institution?: string | null
          is_equivalent?: boolean
          is_user_approved?: boolean
          payload?: Json | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          degree_name?: string | null
          education_type?: string
          end_date?: string | null
          equivalency_basis?: Json | null
          evidence_text?: string | null
          field_of_study?: string | null
          id?: string
          institution?: string | null
          is_equivalent?: boolean
          is_user_approved?: boolean
          payload?: Json | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_intelligence: {
        Row: {
          avg_fit_score: number | null
          career_trajectory: string | null
          core_strengths: string[] | null
          created_at: string | null
          differentiators: string[] | null
          highest_scoring_role: string | null
          id: string
          inferred_industries: string[] | null
          inferred_seniority: string | null
          inferred_target_roles: string[] | null
          intelligence_summary: string | null
          jobs_above_70: number
          jobs_below_70: number
          last_recomputed_at: string | null
          momentum_signal: string | null
          persistent_gaps: Json | null
          recompute_trigger: string | null
          skills_to_build: string[] | null
          total_jobs_analyzed: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_fit_score?: number | null
          career_trajectory?: string | null
          core_strengths?: string[] | null
          created_at?: string | null
          differentiators?: string[] | null
          highest_scoring_role?: string | null
          id?: string
          inferred_industries?: string[] | null
          inferred_seniority?: string | null
          inferred_target_roles?: string[] | null
          intelligence_summary?: string | null
          jobs_above_70?: number
          jobs_below_70?: number
          last_recomputed_at?: string | null
          momentum_signal?: string | null
          persistent_gaps?: Json | null
          recompute_trigger?: string | null
          skills_to_build?: string[] | null
          total_jobs_analyzed?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_fit_score?: number | null
          career_trajectory?: string | null
          core_strengths?: string[] | null
          created_at?: string | null
          differentiators?: string[] | null
          highest_scoring_role?: string | null
          id?: string
          inferred_industries?: string[] | null
          inferred_seniority?: string | null
          inferred_target_roles?: string[] | null
          intelligence_summary?: string | null
          jobs_above_70?: number
          jobs_below_70?: number
          last_recomputed_at?: string | null
          momentum_signal?: string | null
          persistent_gaps?: Json | null
          recompute_trigger?: string | null
          skills_to_build?: string[] | null
          total_jobs_analyzed?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          active_voice_profile: Json | null
          avatar_url: string | null
          certifications: string[] | null
          created_at: string | null
          default_voice_mode: string | null
          education: Json | null
          email: string | null
          experience: Json | null
          full_name: string | null
          github_url: string | null
          headline: string | null
          id: string
          linkedin_raw_text: string | null
          links: Json | null
          location: string | null
          onboarding_complete: boolean | null
          phone: string | null
          skills: string[] | null
          source_resume_id: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          voice_locked: boolean | null
          website_url: string | null
        }
        Insert: {
          active_voice_profile?: Json | null
          avatar_url?: string | null
          certifications?: string[] | null
          created_at?: string | null
          default_voice_mode?: string | null
          education?: Json | null
          email?: string | null
          experience?: Json | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          linkedin_raw_text?: string | null
          links?: Json | null
          location?: string | null
          onboarding_complete?: boolean | null
          phone?: string | null
          skills?: string[] | null
          source_resume_id?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          voice_locked?: boolean | null
          website_url?: string | null
        }
        Update: {
          active_voice_profile?: Json | null
          avatar_url?: string | null
          certifications?: string[] | null
          created_at?: string | null
          default_voice_mode?: string | null
          education?: Json | null
          email?: string | null
          experience?: Json | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          linkedin_raw_text?: string | null
          links?: Json | null
          location?: string | null
          onboarding_complete?: boolean | null
          phone?: string | null
          skills?: string[] | null
          source_resume_id?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          voice_locked?: boolean | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_source_resume_id_fkey"
            columns: ["source_resume_id"]
            isOneToOne: false
            referencedRelation: "source_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile_links: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          is_user_approved: boolean
          label: string | null
          last_parsed_at: string | null
          link_type: string
          metadata: Json | null
          parse_error: string | null
          parse_status: string
          source: string | null
          source_metadata: Json | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          is_user_approved?: boolean
          label?: string | null
          last_parsed_at?: string | null
          link_type: string
          metadata?: Json | null
          parse_error?: string | null
          parse_status?: string
          source?: string | null
          source_metadata?: Json | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          is_user_approved?: boolean
          label?: string | null
          last_parsed_at?: string | null
          link_type?: string
          metadata?: Json | null
          parse_error?: string | null
          parse_status?: string
          source?: string | null
          source_metadata?: Json | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          current_period_end: string | null
          email: string | null
          generations_this_month: number | null
          id: string
          jobs_this_month: number | null
          onboarding_complete: boolean
          plan_type: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          updated_at: string
          usage_reset_at: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          email?: string | null
          generations_this_month?: number | null
          id: string
          jobs_this_month?: number | null
          onboarding_complete?: boolean
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
          usage_reset_at?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          email?: string | null
          generations_this_month?: number | null
          id?: string
          jobs_this_month?: number | null
          onboarding_complete?: boolean
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
          usage_reset_at?: string | null
        }
        Relationships: []
      }
      videojobs: {
        Row: {
          created_at: string | null
          current_step: string | null
          error: string | null
          id: string
          input_path: string | null
          logs: Json | null
          output_filename: string | null
          output_path: string | null
          plan_raw: Json | null
          plan_validated: Json | null
          progress: number | null
          prompt: string | null
          status: string
          steps: Json | null
          updated_at: string | null
          video_name: string | null
        }
        Insert: {
          created_at?: string | null
          current_step?: string | null
          error?: string | null
          id: string
          input_path?: string | null
          logs?: Json | null
          output_filename?: string | null
          output_path?: string | null
          plan_raw?: Json | null
          plan_validated?: Json | null
          progress?: number | null
          prompt?: string | null
          status?: string
          steps?: Json | null
          updated_at?: string | null
          video_name?: string | null
        }
        Update: {
          created_at?: string | null
          current_step?: string | null
          error?: string | null
          id?: string
          input_path?: string | null
          logs?: Json | null
          output_filename?: string | null
          output_path?: string | null
          plan_raw?: Json | null
          plan_validated?: Json | null
          progress?: number | null
          prompt?: string | null
          status?: string
          steps?: Json | null
          updated_at?: string | null
          video_name?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          converted_at: string | null
          created_at: string | null
          email: string
          id: string
          referrer: string | null
          source: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          referrer?: string | null
          source?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          referrer?: string | null
          source?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      byred_current_user_id: { Args: never; Returns: string }
      byred_is_admin: { Args: never; Returns: boolean }
      byred_is_admin_for_tenant: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      byred_is_member_of_tenant: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      byred_jwt_active_tenant_id: { Args: never; Returns: string }
      byred_rate_limit_try: {
        Args: { p_key: string; p_max_events: number; p_window_seconds: number }
        Returns: {
          allowed: boolean
          remaining: number
          retry_after_s: number
        }[]
      }
      byred_release_sync_lock: {
        Args: { p_holder: string; p_name: string }
        Returns: boolean
      }
      byred_resolve_audit_tenant_id: { Args: never; Returns: string }
      byred_safe_text_to_uuid: { Args: { p: string }; Returns: string }
      byred_try_sync_lock: {
        Args: { p_holder: string; p_name: string; p_ttl_seconds: number }
        Returns: boolean
      }
      debug_auth: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Database
type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
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
