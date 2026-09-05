import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

// Set Vercel execution timeout to the maximum allowed (requires Pro plan for 60s)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function POST(request: Request) {
  let poppedIds: string[] = [];
  let queueKey = '';
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const month = now.getMonth() + 1; 
    const year = now.getFullYear();
    queueKey = `eom:queue:${year}:${month}`;

    const CHUNK_SIZE = 500;
    
    // Pop up to CHUNK_SIZE items from the list
    const accountIds = await redis.lpop<string[] | string>(queueKey, CHUNK_SIZE);

    if (!accountIds || (Array.isArray(accountIds) && accountIds.length === 0)) {
      return NextResponse.json({ message: 'Queue is empty.', remaining: 0 });
    }

    // Ensure it's an array (Upstash might return a single string if only 1 item was popped)
    poppedIds = Array.isArray(accountIds) ? accountIds : [accountIds];

    // Call Supabase RPC for database optimization (bulk update)
    // We pass 0.5% interest rate and $5.00 maintenance fee as an example
    const { data: processedCount, error } = await supabaseAdmin.rpc('process_eom_batch', {
      p_account_ids: poppedIds,
      p_month: month,
      p_year: year,
      p_interest_rate: 0.5,
      p_monthly_fee: 5.0
    });

    if (error) {
      throw error;
    }

    // Check remaining size
    const remaining = await redis.llen(queueKey);

    return NextResponse.json({ 
      message: 'Batch processed successfully', 
      processed: processedCount,
      remaining_in_queue: remaining
    });

  } catch (error: any) {
    console.error('EOM Worker error:', error);
    // If failed, push them back to the queue for retry (simple dead letter / retry logic)
    if (poppedIds.length > 0 && queueKey) {
      try {
        await redis.rpush(queueKey, ...poppedIds);
        console.log(`Re-queued ${poppedIds.length} failed items.`);
      } catch (retryError) {
        console.error('Failed to re-queue items:', retryError);
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
