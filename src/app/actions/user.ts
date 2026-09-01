"use server";

import { createClient } from "@/lib/supabase/server";

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
    
  return profile;
}

export async function getUserAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();
    
  return account;
}

export async function getUserTransactions() {
  const supabase = await createClient();
  const account = await getUserAccount();
  
  if (!account) return [];
  
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(50);
    
  return transactions || [];
}

export async function getUserCard() {
  const supabase = await createClient();
  const account = await getUserAccount();
  
  if (!account) return null;
  
  const { data: card } = await supabase
    .from("cards")
    .select("*")
    .eq("account_id", account.id)
    .single();
    
  return card;
}

export async function requestCard(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const account = await getUserAccount();
  const profile = await getUserProfile();
  
  if (!account || !profile) return { error: "Account not found" };
  if (profile.is_locked) return { error: "E-Secure Lock is active. You cannot request a card while your account is locked." };
  
  // Check if card already exists
  const existingCard = await getUserCard();
  if (existingCard) return { error: "You already have an active card" };

  // Generate mock card details
  const randomCardNumber = `4532${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}`;
  const expiry = "12/28";
  const cvv = Math.floor(100 + Math.random() * 900).toString();

  const { error } = await supabase
    .from("cards")
    .insert({
      account_id: account.id,
      card_number_masked: `•••• •••• •••• ${randomCardNumber.slice(-4)}`,
      cardholder_name: profile.full_name,
      expiry_date: expiry,
      cvv_hash: cvv, // Normally you'd encrypt this or not store it raw, but this is a demo
      type: "DEBIT",
      status: "ACTIVE"
    });

  if (error) return { error: error.message };

  return { success: true };
}

export async function getBeneficiaries() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("beneficiaries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function addBeneficiary(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const accountNumber = formData.get("accountNumber") as string;
  const bankName = formData.get("bankName") as string;
  const ifscCode = formData.get("ifscCode") as string;
  const nickname = formData.get("nickname") as string;

  if (!name || !accountNumber || !bankName || !ifscCode) {
    return { error: "All required fields must be filled" };
  }

  if (ifscCode !== 'DHRBNK0000001') {
    return { error: "Invalid IFSC Code. This demo only supports Dhruva Bank branches (DHRBNK0000001)." };
  }

  // Verify the account exists in Dhruva Bank
  const { data: targetAccount, error: targetError } = await supabase
    .from("accounts")
    .select("id")
    .eq("account_number", accountNumber)
    .single();

  if (targetError || !targetAccount) {
    return { error: "Account number not found in Dhruva Bank database." };
  }

  const { error } = await supabase
    .from("beneficiaries")
    .insert({
      user_id: user.id,
      name,
      account_number: accountNumber,
      bank_name: bankName,
      ifsc_code: ifscCode,
      nickname
    });

  if (error) {
    if (error.code === '23505') return { error: "This account is already in your beneficiary list." };
    return { error: error.message };
  }

  return { success: true, message: "Beneficiary added successfully!" };
}

export async function deleteBeneficiary(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("beneficiaries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function transferMoney(prevState: any, formData: FormData) {
  const supabase = await createClient();
  
  const profile = await getUserProfile();
  const senderAccount = await getUserAccount();
  
  if (!profile || !senderAccount) return { error: "Account not found" };

  const amount = Number(formData.get("amount"));
  const mpin = formData.get("mpin") as string;
  const receiverAccountNumber = formData.get("receiverAccount") as string;
  const description = formData.get("description") as string || "Money Transfer";

  if (profile.is_locked) return { error: "E-Secure Lock is active. All outgoing transfers are blocked." };
  if (!amount || amount <= 0) return { error: "Invalid amount" };
  if (!mpin) return { error: "MPIN required" };
  if (!receiverAccountNumber) return { error: "Receiver account required" };

  // Validate MPIN (in a real app, hash and compare)
  if (profile.mpin_hash !== mpin) {
    return { error: "Incorrect MPIN" };
  }

  // Check sender balance
  if (Number(senderAccount.balance) < amount) {
    return { error: `Insufficient funds. Your balance is ₹${senderAccount.balance}` };
  }

  // Check if receiver is self
  if (senderAccount.account_number === receiverAccountNumber) {
    return { error: "You cannot transfer money to your own account." };
  }

  // Get receiver account (only internal transfers for demo)
  const { data: receiverAccount } = await supabase
    .from("accounts")
    .select("id, balance, account_number, users(full_name)")
    .eq("account_number", receiverAccountNumber)
    .single();

  if (!receiverAccount) {
    return { error: "Receiver account not found in Dhruva Bank. (External transfers are not supported in this demo)." };
  }

  // Perform Transfer (Debit Sender)
  const newSenderBalance = Number(senderAccount.balance) - amount;
  const { error: debitError } = await supabase
    .from("accounts")
    .update({ balance: newSenderBalance })
    .eq("id", senderAccount.id);

  if (debitError) return { error: "Transfer failed during debit." };

  // Perform Transfer (Credit Receiver)
  const newReceiverBalance = Number(receiverAccount.balance) + amount;
  const { error: creditError } = await supabase
    .from("accounts")
    .update({ balance: newReceiverBalance })
    .eq("id", receiverAccount.id);

  if (creditError) {
    // Rollback is required in a real app, handled by stored procedure ideally
    return { error: "Transfer failed during credit. Please contact support." };
  }

  const refNumber = `TXN-${Date.now()}`;

  // Log Sender Transaction
  await supabase.from("transactions").insert({
    account_id: senderAccount.id,
    reference_number: refNumber,
    type: "DEBIT",
    amount: amount,
    balance_after: newSenderBalance,
    description: description,
    sender_details: `${profile.full_name} (${senderAccount.account_number})`,
    receiver_details: `${(receiverAccount as any).users?.full_name} (${receiverAccount.account_number})`
  });

  // Log Receiver Transaction
  await supabase.from("transactions").insert({
    account_id: receiverAccount.id,
    reference_number: `RCV-${Date.now()}`,
    type: "CREDIT",
    amount: amount,
    balance_after: newReceiverBalance,
    description: `Transfer from ${profile.full_name}: ${description}`,
    sender_details: `${profile.full_name} (${senderAccount.account_number})`,
    receiver_details: `${(receiverAccount as any).users?.full_name} (${receiverAccount.account_number})`
  });

  // Notifications
  await supabase.from("notifications").insert([
    {
      user_id: profile.id,
      title: "Transfer Successful",
      message: `You have successfully transferred ₹${amount} to ${(receiverAccount as any).users?.full_name}.`
    }
  ]);

  return { success: true, message: `Successfully transferred ₹${amount} to ${(receiverAccount as any).users?.full_name}` };
}

export async function toggleSecureLock(currentState: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("users")
    .update({ is_locked: !currentState })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Log action
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: !currentState ? "ACCOUNT_LOCKED" : "ACCOUNT_UNLOCKED",
    ip_address: "USER_DASHBOARD"
  });

  return { success: true };
}

export async function updateProfile(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const pin_code = formData.get("pin_code") as string;
  const occupation = formData.get("occupation") as string;

  const { error } = await supabase
    .from("users")
    .update({
      address,
      city,
      state,
      pin_code,
      occupation
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  return { success: true, message: "Profile updated successfully!" };
}

// ==========================================
// LOANS
// ==========================================

export async function getLoans() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("loans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function applyForLoan(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const loanType = formData.get("loan_type") as string;
  const amount = Number(formData.get("amount"));
  const tenureMonths = Number(formData.get("tenure_months"));

  if (!loanType || !amount || !tenureMonths) {
    return { error: "Please fill all fields" };
  }

  if (amount < 10000 || amount > 5000000) {
    return { error: "Amount must be between ₹10,000 and ₹50,00,000" };
  }

  // Set simulated interest rates
  const rates: Record<string, number> = {
    'PERSONAL': 12.5,
    'HOME': 8.5,
    'VEHICLE': 9.5,
    'EDUCATION': 7.5
  };

  const interestRate = rates[loanType] || 10.0;
  
  // Calculate EMI (Principal * Rate * (1+Rate)^Tenure) / ((1+Rate)^Tenure - 1)
  const monthlyRate = interestRate / (12 * 100);
  const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  const totalPayable = emi * tenureMonths;

  const { error } = await supabase
    .from("loans")
    .insert({
      user_id: user.id,
      loan_type: loanType,
      amount: amount,
      interest_rate: interestRate,
      tenure_months: tenureMonths,
      emi_amount: emi,
      total_payable: totalPayable,
      status: "PENDING"
    });

  if (error) return { error: error.message };

  return { success: true, message: "Loan application submitted successfully! It is pending admin review." };
}

export async function payLoanEMI(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const loanId = formData.get("loanId") as string;
  const amount = Number(formData.get("amount"));

  if (!loanId || !amount || amount <= 0) return { error: "Invalid payment amount" };

  // Fetch the loan
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("*")
    .eq("id", loanId)
    .eq("user_id", user.id)
    .single();

  if (loanError || !loan) return { error: "Loan not found" };
  if (loan.status !== "ACTIVE") return { error: "You can only pay active loans." };
  if (amount > loan.total_payable) return { error: `Amount cannot exceed remaining balance (₹${loan.total_payable})` };

  // Fetch the user's savings account
  const { data: userAccount } = await supabase
    .from("accounts")
    .select("id, balance")
    .eq("user_id", user.id)
    .eq("account_type", "SAVINGS")
    .single();

  if (!userAccount) return { error: "Savings account not found" };
  if (Number(userAccount.balance) < amount) return { error: "Insufficient funds in savings account." };

  // Update user balance
  const newUserBalance = Number(userAccount.balance) - amount;
  await supabase.from("accounts").update({ balance: newUserBalance }).eq("id", userAccount.id);

  // Update Loan
  const newTotalPayable = Number(loan.total_payable) - amount;
  await supabase.from("loans").update({ 
    total_payable: newTotalPayable,
    status: newTotalPayable <= 0 ? "CLOSED" : "ACTIVE"
  }).eq("id", loanId);

  // Fetch Admin Treasury to credit the payment
  const { data: adminTreasury } = await supabase
    .from("accounts")
    .select("id, balance")
    .eq("account_number", "RBI-TREASURY")
    .limit(1)
    .single();

  if (adminTreasury) {
    const newTreasuryBalance = Number(adminTreasury.balance) + amount;
    await supabase.from("accounts").update({ balance: newTreasuryBalance }).eq("id", adminTreasury.id);
    
    // Admin Credit Transaction
    await supabase.from("transactions").insert({
      account_id: adminTreasury.id,
      type: "CREDIT",
      amount: amount,
      balance_after: newTreasuryBalance,
      description: `Manual EMI Payment received from User for ${loan.loan_type} Loan`,
      reference_number: `TREAS-REP-${Date.now()}`,
      sender_details: "User Savings Account",
      receiver_details: "Dhruva Bank Treasury"
    });
  }

  // User Debit Transaction
  await supabase.from("transactions").insert({
    account_id: userAccount.id,
    type: "DEBIT",
    amount: amount,
    balance_after: newUserBalance,
    description: `Manual Repayment for ${loan.loan_type} Loan`,
    reference_number: `REP-${Date.now()}`,
    sender_details: "Your Savings Account",
    receiver_details: "Dhruva Bank Loan Dept"
  });

  return { success: true, message: `Successfully paid ₹${amount}.` };
}

// ==========================================
// SUPPORT TICKETS
// ==========================================

export async function getTickets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function createTicket(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const category = formData.get("category") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!category || !subject || !message) {
    return { error: "All fields are required" };
  }

  const { error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      category,
      subject,
      message,
      status: "OPEN"
    });

  if (error) return { error: error.message };

  return { success: true, message: "Support ticket submitted successfully!" };
}

// ==========================================
// FIXED DEPOSITS
// ==========================================

export async function getFixedDeposits() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("fixed_deposits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function openFixedDeposit(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const amount = Number(formData.get("amount"));
  const tenureMonths = Number(formData.get("tenure_months"));

  if (!amount || amount < 5000) return { error: "Minimum FD amount is ₹5,000" };
  if (!tenureMonths || tenureMonths < 6) return { error: "Minimum tenure is 6 months" };

  const interestRate = tenureMonths >= 36 ? 7.5 : tenureMonths >= 12 ? 7.0 : 6.5;

  const account = await getUserAccount();
  if (!account) return { error: "Savings account not found" };

  if (Number(account.balance) < amount) {
    return { error: `Insufficient funds. Your savings balance is ₹${account.balance}` };
  }

  // Calculate Maturity Amount (Simple Interest for demo, though compound is realistic)
  // A = P(1 + (r/100) * (t/12))
  const maturityAmount = amount * (1 + (interestRate / 100) * (tenureMonths / 12));
  
  // Calculate Maturity Date
  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + tenureMonths);

  // Deduct from savings account
  const newBalance = Number(account.balance) - amount;
  await supabase.from("accounts").update({ balance: newBalance }).eq("id", account.id);

  // Create Transaction
  await supabase.from("transactions").insert({
    account_id: account.id,
    type: "DEBIT",
    amount: amount,
    balance_after: newBalance,
    description: `Opening Fixed Deposit (${tenureMonths} Months)`,
    reference_number: `FD-OPEN-${Date.now()}`,
    sender_details: "Your Savings Account",
    receiver_details: "Dhruva Bank FD Dept"
  });

  // Create FD Record
  const { error } = await supabase
    .from("fixed_deposits")
    .insert({
      user_id: user.id,
      account_id: account.id,
      amount: amount,
      interest_rate: interestRate,
      tenure_months: tenureMonths,
      maturity_date: maturityDate.toISOString(),
      maturity_amount: maturityAmount,
      status: "ACTIVE"
    });

  if (error) {
    // Ideally rollback account balance here, but skipping for demo simplicity
    return { error: error.message };
  }

  return { success: true, message: `Successfully opened Fixed Deposit of ₹${amount.toLocaleString()}` };
}

export async function breakFixedDeposit(fdId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Fetch FD
  const { data: fd, error: fdError } = await supabase
    .from("fixed_deposits")
    .select("*")
    .eq("id", fdId)
    .eq("user_id", user.id)
    .single();

  if (fdError || !fd) return { error: "Fixed Deposit not found" };
  if (fd.status !== "ACTIVE") return { error: "Only active Fixed Deposits can be broken." };

  const account = await getUserAccount();
  if (!account) return { error: "Savings account not found" };

  // Penalty calculation: 1% penalty on principal for breaking early
  const penalty = fd.amount * 0.01;
  const refundAmount = fd.amount - penalty;

  // Update Savings Account Balance
  const newBalance = Number(account.balance) + refundAmount;
  await supabase.from("accounts").update({ balance: newBalance }).eq("id", account.id);

  // Create Transaction
  await supabase.from("transactions").insert({
    account_id: account.id,
    type: "CREDIT",
    amount: refundAmount,
    balance_after: newBalance,
    description: `Early Closure of FD (1% Penalty Applied)`,
    reference_number: `FD-CLOSE-${Date.now()}`,
    sender_details: "Dhruva Bank FD Dept",
    receiver_details: "Your Savings Account"
  });

  // Mark FD as broken
  const { error } = await supabase
    .from("fixed_deposits")
    .update({ status: "BROKEN", updated_at: new Date().toISOString() })
    .eq("id", fdId);

  if (error) return { error: error.message };

  return { success: true, message: `FD broken successfully. ₹${refundAmount.toLocaleString()} credited to your account.` };
}

export async function toggleCardFreeze(cardId: string, currentStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const newStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';

  const { error } = await supabase
    .from("cards")
    .update({ status: newStatus })
    .eq("id", cardId);

  if (error) return { error: error.message };
  return { success: true, newStatus };
}

export async function toggleCardInternational(cardId: string, currentEnabled: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("cards")
    .update({ international_enabled: !currentEnabled })
    .eq("id", cardId);

  if (error) return { error: error.message };
  return { success: true, newEnabled: !currentEnabled };
}
