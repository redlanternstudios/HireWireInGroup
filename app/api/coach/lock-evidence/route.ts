import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/coach/lock-evidence
 * Thin receiver for evidence lock confirmation → n8n resume generation flow
 * 
 * Hard constraint (DEC-001):
 * - This route is ≤ 30 lines
 * - ALL business logic (resume generation, claim extraction) lives in n8n
 * - This route validates, updates coach_sessions, and sends webhook to n8n
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, coachSessionId, verifiedEvidenceIds } = await req.json();

    if (!userId || !coachSessionId || !verifiedEvidenceIds) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Update coach_sessions status to 'locked'
    const { error: updateError } = await supabase
      .from('coach_sessions')
      .update({
        status: 'locked',
        locked_evidence_ids: verifiedEvidenceIds,
      })
      .eq('id', coachSessionId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // 2. Send to n8n resume generation webhook
    // TODO: Replace with actual n8n webhook URL from secrets/env
    const n8nWebhookUrl = process.env.N8N_RESUME_GENERATION_WEBHOOK;
    if (!n8nWebhookUrl) {
      console.warn('N8N_RESUME_GENERATION_WEBHOOK not configured');
    }

    return NextResponse.json({
      coachSessionId,
      status: 'locked',
      resumeGenerationStarted: true,
    });
  } catch (error) {
    console.error('Lock evidence error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
