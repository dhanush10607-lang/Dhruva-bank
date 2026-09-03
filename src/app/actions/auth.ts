"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

export async function registerUser(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const mobile = formData.get("mobile") as string;
  const mpin = formData.get("mpin") as string;

  if (!email || !password || !fullName || !mobile || !mpin) {
    return { error: "All fields are required" };
  }

  // Hash the MPIN before sending to Supabase metadata
  const mpinHash = await bcrypt.hash(mpin, 10);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        mobile: mobile,
        mpin_hash: mpinHash,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?message=Account created successfully. Awaiting admin verification.");
}

export async function loginUser(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check user status
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("status, role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !userProfile) {
    await supabase.auth.signOut();
    return { error: "Could not fetch user profile" };
  }

  if (userProfile.status === "PENDING") {
    await supabase.auth.signOut();
    return { error: "Your account application is awaiting admin verification." };
  }

  if (userProfile.status === "REJECTED") {
    await supabase.auth.signOut();
    return { error: "Your application was rejected. Please contact support." };
  }

  if (userProfile.status === "SUSPENDED") {
    await supabase.auth.signOut();
    return { error: "Your account has been temporarily suspended." };
  }

  // Log the session (Update if same device/IP exists)
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "Unknown Device";
  const ipAddress = headersList.get("x-forwarded-for") || "127.0.0.1";
  
  const { data: existingLogs } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("action", "LOGIN")
    .eq("user_agent", userAgent)
    .eq("ip_address", ipAddress)
    .limit(1);

  if (existingLogs && existingLogs.length > 0) {
    await supabase
      .from("audit_logs")
      .update({ created_at: new Date().toISOString() })
      .eq("id", existingLogs[0].id);
  } else {
    await supabase.from("audit_logs").insert({
      user_id: data.user.id,
      action: "LOGIN",
      entity_type: "SESSION",
      user_agent: userAgent,
      ip_address: ipAddress
    });
  }

  revalidatePath("/", "layout");
  
  if (userProfile.role === "ADMIN" || userProfile.role === "SUPER_ADMIN") {
    redirect("/admin");
  } else {
    redirect("/dashboard");
  }
}

export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function logoutOtherDevices() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) return { error: error.message };
  return { success: true, message: "Successfully signed out of all other devices" };
}
