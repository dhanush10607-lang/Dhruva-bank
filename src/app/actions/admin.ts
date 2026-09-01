"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Verify if the current user is an admin
export async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
    
  return profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN";
}

export async function getAllUsers() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getPendingUsers() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllCards() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*, accounts(account_number)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getDashboardStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();

  // Get total users
  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // Get active accounts
  const { count: activeAccounts } = await supabase
    .from("accounts")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  // Get Admin Treasury balance instead of sum of all credits
  const treasury = await getAdminTreasury();
  const totalDeposits = treasury ? Number(treasury.balance) : 0;

  // Get active cards
  const { count: activeCards } = await supabase
    .from("cards")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  return {
    totalUsers: totalUsers || 0,
    activeAccounts: activeAccounts || 0,
    totalDeposits,
    activeCards: activeCards || 0,
  };
}

// ==========================================
// LOANS & SUPPORT (ADMIN)
// ==========================================

export async function approveLoan(loanId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminUser || adminUser.role !== "ADMIN") return { error: "Forbidden" };

  // 1. Fetch loan details
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("user_id, amount, loan_type")
    .eq("id", loanId)
    .single();

  if (loanError || !loan) return { error: "Loan not found" };

  // 2. Fetch user's savings account
  const { data: userAccount, error: accError } = await supabase
    .from("accounts")
    .select("id, balance")
    .eq("user_id", loan.user_id)
    .eq("account_type", "SAVINGS")
    .limit(1)
    .single();

  if (accError || !userAccount) return { error: "User savings account not found for disbursement" };

  // 3. Get Admin Treasury
  const { data: adminTreasury } = await supabase
    .from("accounts")
    .select("id, balance")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!adminTreasury) return { error: "Admin Treasury account missing." };

  if (Number(adminTreasury.balance) < Number(loan.amount)) {
    return { error: `Insufficient Treasury Funds (Current Balance: ₹${adminTreasury.balance}). Please file an RBI claim to request more funds.` };
  }

  // 4. Update loan status to ACTIVE
  const { error } = await supabase
    .from("loans")
    .update({ status: "ACTIVE" })
    .eq("id", loanId);

  if (error) return { error: error.message };

  // 5. Update Balances
  const newUserBalance = Number(userAccount.balance) + Number(loan.amount);
  const newAdminBalance = Number(adminTreasury.balance) - Number(loan.amount);
  
  // Credit User Account
  await supabase
    .from("accounts")
    .update({ balance: newUserBalance })
    .eq("id", userAccount.id);

  // Debit Admin Treasury
  await supabase
    .from("accounts")
    .update({ balance: newAdminBalance })
    .eq("id", adminTreasury.id);

  // 6. Create transaction records
  // User Transaction (Credit)
  await supabase.from("transactions").insert({
    account_id: userAccount.id,
    type: "CREDIT",
    amount: loan.amount,
    balance_after: newUserBalance,
    description: `${loan.loan_type} Loan Disbursement`,
    reference_number: `LOAN-DISB-${Date.now()}`,
    sender_details: "Dhruva Bank Loan Department",
    receiver_details: "Your Savings Account"
  });

  // Admin Transaction (Debit)
  await supabase.from("transactions").insert({
    account_id: adminTreasury.id,
    type: "DEBIT",
    amount: loan.amount,
    balance_after: newAdminBalance,
    description: `Loan Disbursement to User for ${loan.loan_type} Loan`,
    reference_number: `TREAS-LOAN-${Date.now()}`,
    sender_details: "Dhruva Bank Treasury",
    receiver_details: "User Savings Account"
  });

  // 7. Send notification to user
  await supabase.from("notifications").insert({
    user_id: loan.user_id,
    title: "Loan Approved & Disbursed",
    message: `Your ${loan.loan_type} loan of ₹${loan.amount.toLocaleString()} has been approved and the funds have been credited to your savings account.`
  });

  // 8. Log admin action
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "LOAN_APPROVED_AND_DISBURSED",
    entity_type: "LOAN",
    entity_id: loanId,
    ip_address: "ADMIN_CONSOLE"
  });

  return { success: true };
}

export async function rejectLoan(loanId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminUser || adminUser.role !== "ADMIN") return { error: "Forbidden" };

  const { error } = await supabase
    .from("loans")
    .update({ status: "REJECTED" })
    .eq("id", loanId);

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "LOAN_REJECTED",
    entity_type: "LOAN",
    entity_id: loanId,
    ip_address: "ADMIN_CONSOLE"
  });

  return { success: true };
}

export async function updateTicketStatus(ticketId: string, status: string, reply: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminUser || adminUser.role !== "ADMIN") return { error: "Forbidden" };

  const { error } = await supabase
    .from("support_tickets")
    .update({ 
      status, 
      admin_reply: reply,
      updated_at: new Date().toISOString()
    })
    .eq("id", ticketId);

  if (error) return { error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: `TICKET_${status}`,
    entity_type: "TICKET",
    entity_id: ticketId,
    ip_address: "ADMIN_CONSOLE"
  });

  return { success: true };
}

// ==========================================
// SYSTEM SETTINGS (ADMIN)
// ==========================================

export async function simulateEndOfMonth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminUser || adminUser.role !== "ADMIN") return { error: "Forbidden" };

  // 1. Fetch all accounts
  const { data: accounts, error: fetchError } = await supabase
    .from("accounts")
    .select("id, balance, account_type");

  if (fetchError || !accounts) return { error: fetchError?.message || "Failed to fetch accounts" };

  const INTEREST_RATE = 0.04; // 4% p.a. -> per month = 4% / 12
  const MAINTENANCE_CHARGE = 50.00;

  let totalInterestPaid = 0;
  let totalChargesCollected = 0;

  for (const account of accounts) {
    let currentBalance = account.balance;

    // Calculate Interest (Savings only, for demo purposes we assume 1 month passed)
    if (account.account_type === 'SAVINGS' && currentBalance > 0) {
      const monthlyInterest = (currentBalance * INTEREST_RATE) / 12;
      currentBalance += monthlyInterest;
      totalInterestPaid += monthlyInterest;

      // Add Interest Transaction
      await supabase.from("transactions").insert({
        account_id: account.id,
        type: "CREDIT",
        amount: monthlyInterest,
        balance_after: currentBalance,
        description: "Monthly Interest Credit (4% p.a.)",
        reference_number: "INT" + Date.now().toString() + Math.floor(Math.random() * 1000),
        sender_details: "Dhruva Bank Automated System",
        receiver_details: "Your Savings Account"
      });
    }

    // Apply Maintenance Charge
    currentBalance -= MAINTENANCE_CHARGE;
    totalChargesCollected += MAINTENANCE_CHARGE;

    // Add Charge Transaction
    await supabase.from("transactions").insert({
      account_id: account.id,
      type: "DEBIT",
      amount: MAINTENANCE_CHARGE,
      balance_after: currentBalance,
      description: "Monthly Account Maintenance Charge",
      reference_number: "CHG" + Date.now().toString() + Math.floor(Math.random() * 1000),
      sender_details: "Your Account",
      receiver_details: "Dhruva Bank Automated System"
    });

    // Update Balance
    await supabase.from("accounts").update({ balance: currentBalance }).eq("id", account.id);
  }

  // 2. Process ACTIVE Loans (EMI Deductions)
  let totalEMIsCollected = 0;
  
  const { data: activeLoans } = await supabase
    .from("loans")
    .select("*")
    .eq("status", "ACTIVE");

  if (activeLoans && activeLoans.length > 0) {
    for (const loan of activeLoans) {
      if (loan.total_payable <= 0) continue;

      // Find user's savings account
      const { data: userAccount } = await supabase
        .from("accounts")
        .select("id, balance")
        .eq("user_id", loan.user_id)
        .eq("account_type", "SAVINGS")
        .limit(1)
        .single();

      if (userAccount) {
        // Check if the user has already made a manual payment this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: manualPayments } = await supabase
          .from("transactions")
          .select("id")
          .eq("account_id", userAccount.id)
          .like("reference_number", "REP-%")
          .like("description", `%${loan.loan_type}%`)
          .gte("created_at", startOfMonth.toISOString());

        if (manualPayments && manualPayments.length > 0) {
          continue; // Skip this loan because they already paid manually this month
        }

        // Calculate the EMI to deduct (either full EMI or the remaining balance if less than EMI)
        const emiToDeduct = Math.min(loan.emi_amount, loan.total_payable);
        
        const newBalance = Number(userAccount.balance) - emiToDeduct;
        
        // Deduct from account
        await supabase.from("accounts").update({ balance: newBalance }).eq("id", userAccount.id);
        
        // Create Transaction
        await supabase.from("transactions").insert({
          account_id: userAccount.id,
          type: "DEBIT",
          amount: emiToDeduct,
          balance_after: newBalance,
          description: `${loan.loan_type} Loan Auto-EMI Deduction`,
          reference_number: `EMI-${Date.now()}-${loan.id.split('-')[0]}`,
          sender_details: "Your Savings Account",
          receiver_details: "Dhruva Bank Loan Dept"
        });

        // Update Loan Total Payable
        const newTotalPayable = loan.total_payable - emiToDeduct;
        totalEMIsCollected += emiToDeduct;

        await supabase.from("loans").update({ 
          total_payable: newTotalPayable,
          status: newTotalPayable <= 0 ? "CLOSED" : "ACTIVE"
        }).eq("id", loan.id);
      }
    }
  }

  // 3. Update Admin Treasury
  const { data: adminTreasury } = await supabase
    .from("accounts")
    .select("id, balance")
    .eq("user_id", user.id) // Admin's own account acts as treasury
    .limit(1)
    .single();

  if (adminTreasury) {
    const netTreasuryGain = totalChargesCollected - totalInterestPaid + totalEMIsCollected;
    await supabase
      .from("accounts")
      .update({ balance: Number(adminTreasury.balance) + netTreasuryGain })
      .eq("id", adminTreasury.id);
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "SIMULATED_EOM",
    ip_address: "ADMIN_CONSOLE"
  });

  return { 
    success: true, 
    message: `EOM Simulation Complete. Interest Paid: ₹${totalInterestPaid.toFixed(2)} | Charges: ₹${totalChargesCollected.toFixed(2)} | EMIs: ₹${totalEMIsCollected.toFixed(2)}` 
  };
}

export async function approveUser(userId: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();

  // 1. Generate unique customer ID and Account Number
  const customerId = `CUST${Math.floor(100000 + Math.random() * 900000)}`;
  const accountNumber = `DHRU${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  // 2. Update user status
  const { error: userError } = await supabase
    .from("users")
    .update({ 
      status: "APPROVED",
      customer_id: customerId,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (userError) throw new Error(userError.message);

  // 3. Create bank account
  const { error: accountError } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      account_number: accountNumber,
      account_type: "SAVINGS",
      balance: 0.00,
    });

  if (accountError) throw new Error(accountError.message);

  // 4. Send Notification
  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Account Approved",
    message: `Welcome to Dhruva Bank! Your account has been approved. Your Account Number is ${accountNumber}.`
  });

  revalidatePath("/admin/users/pending");
  return { success: true };
}

export async function rejectUser(userId: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({ 
      status: "REJECTED",
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/users/pending");
  return { success: true };
}

export async function getAdminTreasury() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if admin has a treasury account
  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (account) return account;

  // If not, create the Treasury account
  const { data: newAccount, error } = await supabase
    .from("accounts")
    .insert({
      user_id: user.id,
      account_number: "RBI-TREASURY",
      account_type: "CURRENT",
      balance: 0.00,
      status: "ACTIVE"
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return newAccount;
}

export async function getAdminInjectedTransactions() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*, accounts(account_number)")
    .eq("sender_details", "Dhruva Bank Admin Treasury")
    .eq("type", "CREDIT")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Find all reversal transactions
  const { data: reversals } = await supabase
    .from("transactions")
    .select("description")
    .like("description", "Reversal of %");

  const reversalRefs = new Set(reversals?.map(r => r.description.replace("Reversal of ", "")) || []);

  const dataWithRefundStatus = data.map(tx => ({
    ...tx,
    is_refunded: reversalRefs.has(tx.reference_number)
  }));

  return dataWithRefundStatus;
}

export async function getAllAccountsForDropdown() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("account_number, users(full_name, customer_id)")
    .neq("account_number", "RBI-TREASURY");
    
  return data || [];
}

export async function submitRBIClaim(prevState: any, formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const amount = Number(formData.get("amount"));
  if (!amount || amount <= 0) return { error: "Invalid claim amount." };

  const supabase = await createClient();
  const treasury = await getAdminTreasury();
  if (!treasury) return { error: "Treasury account not found." };

  // Simulate 12 seconds delay for RBI processing
  await new Promise((resolve) => setTimeout(resolve, 12000));

  const newBalance = Number(treasury.balance) + amount;

  // Credit the treasury account
  const { error: updateError } = await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("id", treasury.id);

  if (updateError) return { error: updateError.message };

  // Log transaction
  await supabase.from("transactions").insert({
    account_id: treasury.id,
    reference_number: `RBI-CLAIM-${Date.now()}`,
    type: "CREDIT",
    amount: amount,
    balance_after: newBalance,
    description: "RBI Ombudsman Claim Settlement",
    sender_details: "Reserve Bank of India",
    receiver_details: "Dhruva Bank Treasury"
  });

  return { success: true, amount };
}

export async function creditAccount(prevState: any, formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized. Admin access required." };

  const accountNumber = formData.get("accountNumber") as string;
  const amount = Number(formData.get("amount"));
  const description = formData.get("description") as string;

  if (!accountNumber) return { error: "Please enter an account number." };
  if (!amount || amount <= 0) return { error: "Invalid amount." };

  const supabase = await createClient();

  // Get Admin Treasury
  const treasury = await getAdminTreasury();
  if (!treasury) return { error: "Treasury account missing." };
  
  if (Number(treasury.balance) < amount) {
    return { error: `Insufficient Treasury Funds (Current Balance: ₹${treasury.balance}). Please file an RBI claim to request more funds.` };
  }

  // Get User Account by Account Number
  const { data: userAccount, error: accError } = await supabase
    .from("accounts")
    .select("balance, id, user_id")
    .eq("account_number", accountNumber)
    .single();

  if (accError) return { error: "Account not found." };

  const newAdminBalance = Number(treasury.balance) - amount;
  const newUserBalance = Number(userAccount.balance) + amount;

  // Deduct from Admin Treasury
  const { error: adminUpdateError } = await supabase
    .from("accounts")
    .update({ balance: newAdminBalance })
    .eq("id", treasury.id);
    
  if (adminUpdateError) return { error: adminUpdateError.message };

  // Credit User Account
  const { error: updateError } = await supabase
    .from("accounts")
    .update({ balance: newUserBalance })
    .eq("id", userAccount.id);

  if (updateError) return { error: updateError.message };

  const refNumber = `CREDIT-${Date.now()}`;

  // Log User Transaction
  const { error: txnError } = await supabase
    .from("transactions")
    .insert({
      account_id: userAccount.id,
      reference_number: refNumber,
      type: "CREDIT",
      amount: amount,
      balance_after: newUserBalance,
      description: description || "Demo Funds Credited by Admin",
      sender_details: "Dhruva Bank Admin Treasury",
      receiver_details: "User Account"
    });

  // Log Admin Transaction
  await supabase
    .from("transactions")
    .insert({
      account_id: treasury.id,
      reference_number: `DEBIT-${Date.now()}`,
      type: "DEBIT",
      amount: amount,
      balance_after: newAdminBalance,
      description: "Credit sent to User: " + description,
      sender_details: "Dhruva Bank Admin Treasury",
      receiver_details: "User Account"
    });

  // Notification
  await supabase.from("notifications").insert({
    user_id: userAccount.user_id,
    title: "Funds Credited",
    message: `₹${amount} has been credited to your account by the system administrator.`
  });

  // Audit Log
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "CREDIT_ACCOUNT",
      entity_type: "ACCOUNT",
      entity_id: userAccount.id,
      new_state: { balance: newUserBalance, amount_credited: amount },
      ip_address: "ADMIN_CONSOLE"
    });
  }

  return { success: true, message: `Successfully credited ₹${amount} to account ${accountNumber}` };
}

export async function debitAccount(prevState: any, formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized. Admin access required." };

  const accountNumber = formData.get("accountNumber") as string;
  const amount = Number(formData.get("amount"));
  const description = formData.get("description") as string;

  if (!accountNumber) return { error: "Please enter an account number." };
  if (!amount || amount <= 0) return { error: "Invalid amount." };

  const supabase = await createClient();

  // Check if this is a reversal and if it's already been reversed
  const originalRef = description.replace("Reversal of ", "");
  if (originalRef && originalRef !== description) {
    const { data: existingReversal } = await supabase
      .from("transactions")
      .select("id")
      .eq("description", description)
      .maybeSingle();
      
    if (existingReversal) {
      return { error: "This transaction has already been refunded." };
    }
  }

  // Get Admin Treasury
  const treasury = await getAdminTreasury();
  if (!treasury) return { error: "Treasury account missing." };

  // Get User Account by Account Number
  const { data: userAccount, error: accError } = await supabase
    .from("accounts")
    .select("balance, id, user_id")
    .eq("account_number", accountNumber)
    .single();

  if (accError) return { error: "Account not found." };
  
  if (Number(userAccount.balance) < amount) {
    return { error: `User does not have enough funds. (Current Balance: ₹${userAccount.balance})` };
  }

  const newAdminBalance = Number(treasury.balance) + amount;
  const newUserBalance = Number(userAccount.balance) - amount;

  // Credit Admin Treasury (Refund)
  const { error: adminUpdateError } = await supabase
    .from("accounts")
    .update({ balance: newAdminBalance })
    .eq("id", treasury.id);
    
  if (adminUpdateError) return { error: adminUpdateError.message };

  // Deduct from User Account
  const { error: updateError } = await supabase
    .from("accounts")
    .update({ balance: newUserBalance })
    .eq("id", userAccount.id);

  if (updateError) return { error: updateError.message };

  const refNumber = `DEBIT-${Date.now()}`;

  // Log User Transaction
  await supabase.from("transactions").insert({
    account_id: userAccount.id,
    reference_number: refNumber,
    type: "DEBIT",
    amount: amount,
    balance_after: newUserBalance,
    description: description || "Funds Reversed by Admin",
    sender_details: "User Account",
    receiver_details: "Dhruva Bank Admin Treasury"
  });

  // Log Admin Transaction
  await supabase.from("transactions").insert({
    account_id: treasury.id,
    reference_number: `CREDIT-${Date.now()}`,
    type: "CREDIT",
    amount: amount,
    balance_after: newAdminBalance,
    description: "Refund / Debit from User: " + description,
    sender_details: "User Account",
    receiver_details: "Dhruva Bank Admin Treasury"
  });

  // Notification
  await supabase.from("notifications").insert({
    user_id: userAccount.user_id,
    title: "Funds Reversed",
    message: `₹${amount} has been debited from your account by the system administrator.`
  });

  // Audit Log
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "DEBIT_ACCOUNT",
      entity_type: "ACCOUNT",
      entity_id: userAccount.id,
      new_state: { balance: newUserBalance, amount_debited: amount },
      ip_address: "ADMIN_CONSOLE"
    });
  }

  return { success: true, message: `Successfully debited ₹${amount} from account ${accountNumber}` };
}
