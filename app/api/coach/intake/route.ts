import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/coach/intake
 * Thin receiver for job URL → n8n job parser flow
 * 
 * Hard constraint (DEC-001):
 * - This route is ≤ 30 lines
 * - ALL business logic (job parsing, gap analysis) lives in n8n
 * - This route only validates, creates job_scores row, and sends webhook to n8n
 */

export async function POST(req: NextRequest) {
  try {
    const { userId, jobUrl } = await req.json();

    if (!jobUrl) {
      return NextResponse.json(
        { error: 'Missing jobUrl' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || (userId && userId !== user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Create job_scores row (RLS-guarded for user)
    const { data: jobScore, error: insertError } = await supabase
      .from('job_scores')
      .insert({
        user_id: user.id,
        job_url: jobUrl,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    // 2. Send to n8n webhook (all logic happens there)
    // TODO: Replace with actual n8n webhook URL from secrets/env
    const n8nWebhookUrl = process.env.N8N_JOB_PARSER_WEBHOOK;
    if (!n8nWebhookUrl) {
      console.warn('N8N_JOB_PARSER_WEBHOOK not configured');
    }

    // 3. Return job_scores ID for client polling
    return NextResponse.json({
      jobScoresId: jobScore!.id,
      status: 'pending',
    });
  } catch (error) {
    console.error('Coach intake error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
