import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Set Vercel execution timeout to the maximum allowed (requires Pro plan for 60s+, Hobby is 10s-15s)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // 1. Secure the endpoint using Vercel Cron Secret
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();
    let processedCount = 0;
    const CHUNK_SIZE = 500; // Optimal chunk size for Supabase API

    // 2. Fetch all ACTIVE scheduled transfers that are due for execution
    const { data: allTransfers, error: fetchError } = await supabaseAdmin
      .from('scheduled_transfers')
      .select('*')
      .eq('status', 'ACTIVE')
      .lte('next_run_date', now);

    if (fetchError) throw fetchError;
    if (!allTransfers || allTransfers.length === 0) {
      return NextResponse.json({ message: 'No scheduled transfers due for processing.', count: 0 });
    }

    // 3. Process in chunks to prevent memory bloat and handle scale
    for (let i = 0; i < allTransfers.length; i += CHUNK_SIZE) {
      const chunk = allTransfers.slice(i, i + CHUNK_SIZE);
      
      // Process the chunk concurrently
      await Promise.allSettled(chunk.map(async (transfer) => {
        try {
          // Fetch sender and receiver accounts
          const [{ data: sender }, { data: receiver }] = await Promise.all([
            supabaseAdmin.from('accounts').select('id, balance, account_number, users(full_name)').eq('id', transfer.from_account_id).single(),
            supabaseAdmin.from('accounts').select('id, balance, account_number, users(full_name)').eq('id', transfer.to_account_id).single()
          ]);

          if (!sender || !receiver) {
            await supabaseAdmin.from('scheduled_transfers').update({ status: 'FAILED' }).eq('id', transfer.id);
            return;
          }

          const amount = Number(transfer.amount);
          
          if (Number(sender.balance) < amount) {
            // Insufficient funds: pause the schedule and notify the user
            await supabaseAdmin.from('scheduled_transfers').update({ status: 'PAUSED' }).eq('id', transfer.id);
            await supabaseAdmin.from('notifications').insert({
              user_id: transfer.user_id,
              title: "Scheduled Transfer Failed",
              message: `Your scheduled transfer of ₹${amount} failed due to insufficient funds and has been paused.`
            });
            return;
          }

          const newSenderBalance = Number(sender.balance) - amount;
          const newReceiverBalance = Number(receiver.balance) + amount;
          const refPrefix = `SCHED-${Date.now()}`;

          // Execute Transfer
          const { error: debitErr } = await supabaseAdmin.from('accounts').update({ balance: newSenderBalance }).eq('id', sender.id);
          if (debitErr) throw debitErr;

          const { error: creditErr } = await supabaseAdmin.from('accounts').update({ balance: newReceiverBalance }).eq('id', receiver.id);
          if (creditErr) throw creditErr; // Requires manual reconciliation if credit fails in a production system

          // Log Transactions
          await supabaseAdmin.from('transactions').insert([
            {
              account_id: sender.id,
              reference_number: `${refPrefix}-D`,
              type: 'DEBIT',
              amount: amount,
              balance_after: newSenderBalance,
              description: `[Auto] ${transfer.description || 'Scheduled Transfer'}`,
              sender_details: sender.account_number,
              receiver_details: receiver.account_number
            },
            {
              account_id: receiver.id,
              reference_number: `${refPrefix}-C`,
              type: 'CREDIT',
              amount: amount,
              balance_after: newReceiverBalance,
              description: `[Auto] ${transfer.description || 'Scheduled Transfer'}`,
              sender_details: sender.account_number,
              receiver_details: receiver.account_number
            }
          ]);

          // Notify Sender
          await supabaseAdmin.from('notifications').insert({
            user_id: transfer.user_id,
            title: "Scheduled Transfer Successful",
            message: `Successfully automatically transferred ₹${amount} for "${transfer.description}".`
          });

          // Calculate Next Run Date
          const nextRun = new Date(transfer.next_run_date);
          if (transfer.frequency === 'DAILY') nextRun.setDate(nextRun.getDate() + 1);
          else if (transfer.frequency === 'WEEKLY') nextRun.setDate(nextRun.getDate() + 7);
          else if (transfer.frequency === 'MONTHLY') nextRun.setMonth(nextRun.getMonth() + 1);
          else if (transfer.frequency === 'YEARLY') nextRun.setFullYear(nextRun.getFullYear() + 1);

          // Update Schedule
          await supabaseAdmin.from('scheduled_transfers').update({ next_run_date: nextRun.toISOString() }).eq('id', transfer.id);
          
          processedCount++;
        } catch (err) {
          console.error(`Failed to process transfer ${transfer.id}:`, err);
        }
      }));
    }

    return NextResponse.json({ message: 'Success', processed: processedCount });

  } catch (error: any) {
    console.error('Cron batch job fatal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
