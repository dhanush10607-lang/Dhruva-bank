"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserAccount, getUserProfile } from "./user";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function processTransfer(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const profile = await getUserProfile();
  const account = await getUserAccount();
  
  if (!profile || !account) {
    return { error: "User or account not found" };
  }

  if (profile.is_locked) {
    return { error: "E-Secure Lock is active. All outgoing transfers are blocked." };
  }

  const receiverAccountNumber = formData.get("account_number") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const mpin = formData.get("mpin") as string;

  if (!receiverAccountNumber || !amount || !mpin) {
    return { error: "All required fields must be filled" };
  }

  if (amount <= 0) {
    return { error: "Amount must be greater than 0" };
  }

  if (amount > account.balance) {
    return { error: "Insufficient balance for this transfer" };
  }

  if (receiverAccountNumber === account.account_number) {
    return { error: "Cannot transfer to your own account" };
  }

  // Verify MPIN
  const isMpinValid = await bcrypt.compare(mpin, profile.mpin_hash);
  if (!isMpinValid) {
    return { error: "Invalid MPIN" };
  }

  // Find receiver account
  const { data: receiverAccount, error: receiverError } = await supabase
    .from("accounts")
    .select("id, balance")
    .eq("account_number", receiverAccountNumber)
    .single();

  if (receiverError || !receiverAccount) {
    return { error: "Beneficiary account not found in Dhruva Bank" };
  }

  // Generating a unique reference number
  const referenceNumber = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // In a real application, this MUST be done in a single database transaction (RPC).
  // For this demonstration, we'll perform them sequentially.

  // 1. Deduct from sender
  const newSenderBalance = account.balance - amount;
  await supabase
    .from("accounts")
    .update({ balance: newSenderBalance })
    .eq("id", account.id);

  // 2. Add to receiver
  const newReceiverBalance = receiverAccount.balance + amount;
  await supabase
    .from("accounts")
    .update({ balance: newReceiverBalance })
    .eq("id", receiverAccount.id);

  // 3. Create Sender Ledger Entry (DEBIT)
  await supabase.from("transactions").insert({
    account_id: account.id,
    reference_number: referenceNumber,
    type: "DEBIT",
    amount: amount,
    balance_after: newSenderBalance,
    description: description || `Transfer to ${receiverAccountNumber}`,
    sender_details: account.account_number,
    receiver_details: receiverAccountNumber,
  });

  // 4. Create Receiver Ledger Entry (CREDIT)
  await supabase.from("transactions").insert({
    account_id: receiverAccount.id,
    reference_number: referenceNumber,
    type: "CREDIT",
    amount: amount,
    balance_after: newReceiverBalance,
    description: `Transfer received from ${account.account_number}`,
    sender_details: account.account_number,
    receiver_details: receiverAccountNumber,
  });

  // 5. Notifications
  await supabase.from("notifications").insert([
    {
      user_id: profile.id,
      title: "Transfer Successful",
      message: `You successfully transferred ₹${amount} to account ending in ${receiverAccountNumber.slice(-4)}.`
    }
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/transfer");

  return { success: true, message: "Transfer completed successfully!", reference: referenceNumber };
}
