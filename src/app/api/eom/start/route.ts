import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    // 1. Secure the endpoint using an Authorization Secret
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    // EOM usually runs on the last day for the current month.
    const month = now.getMonth() + 1; 
    const year = now.getFullYear();

    // 2. Fetch all account IDs (only IDs to keep memory footprint very low)
    const { data: accounts, error } = await supabaseAdmin
      .from('accounts')
      .select('id');

    if (error) throw error;
    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'No accounts found to process.' });
    }

    const accountIds = accounts.map(a => a.id);
    const queueKey = `eom:queue:${year}:${month}`;

    // 3. Clear existing queue just in case of a retry or duplicate trigger
    await redis.del(queueKey);

    // 4. Push to Upstash Redis in chunks
    // Upstash allows max 1000 items per pipeline/command usually, chunking to 500 is safe
    const CHUNK_SIZE = 500;
    const pipeline = redis.pipeline();
    
    for (let i = 0; i < accountIds.length; i += CHUNK_SIZE) {
      const chunk = accountIds.slice(i, i + CHUNK_SIZE);
      pipeline.rpush(queueKey, ...chunk);
    }
    
    await pipeline.exec();

    return NextResponse.json({ 
      message: 'EOM processing started', 
      total_queued: accountIds.length,
      queue_key: queueKey,
      period: `${month}/${year}`
    });

  } catch (error: any) {
    console.error('EOM Start error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
