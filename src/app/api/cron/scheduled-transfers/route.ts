import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the service role key to bypass RLS for background jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // 1. Fetch all ACTIVE scheduled transfers where next_run_date is in the past or now
    const now = new Date().toISOString();
    
    const { data: transfers, error: fetchError } = await supabase
      .from('scheduled_transfers')
      .select('*')
      .eq('status', 'ACTIVE')
      .lte('next_run_date', now);

    if (fetchError) throw fetchError;

    if (!transfers || transfers.length === 0) {
      return NextResponse.json({ message: 'No scheduled transfers to process.', count: 0 });
    }

    let processedCount = 0;

    // 2. Process each transfer
    for (const transfer of transfers) {
      // Create the transaction records (Debit sender, Credit receiver)
      // This mimics the transfer logic, simplified for the cron job
      
      const { data: senderAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', transfer.from_account_id)
        .single();
        
      if (!senderAccount || Number(senderAccount.balance) < Number(transfer.amount)) {
        // Insufficient funds, pause the schedule
        await supabase.from('scheduled_transfers').update({ status: 'PAUSED' }).eq('id', transfer.id);
        continue;
      }

      // Execute Transfer using RPC if available, or manual updates (Simplified here)
      // In a real app, this should be an ACID transaction in Postgres
      await supabase.from('accounts').update({ balance: Number(senderAccount.balance) - Number(transfer.amount) }).eq('id', transfer.from_account_id);
      
      // Calculate next run date
      const nextRun = new Date(transfer.next_run_date);
      if (transfer.frequency === 'DAILY') nextRun.setDate(nextRun.getDate() + 1);
      if (transfer.frequency === 'WEEKLY') nextRun.setDate(nextRun.getDate() + 7);
      if (transfer.frequency === 'MONTHLY') nextRun.setMonth(nextRun.getMonth() + 1);
      if (transfer.frequency === 'YEARLY') nextRun.setFullYear(nextRun.getFullYear() + 1);

      // Update schedule
      await supabase.from('scheduled_transfers').update({ next_run_date: nextRun.toISOString() }).eq('id', transfer.id);
      
      processedCount++;
    }

    return NextResponse.json({ message: 'Success', count: processedCount });

  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
