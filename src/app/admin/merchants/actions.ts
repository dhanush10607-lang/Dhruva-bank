import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleMerchantStatus(merchantId: string, currentStatus: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabaseAdmin = createAdminClient();
  const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  const { error } = await supabaseAdmin
    .from("merchants")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", merchantId);

  if (error) throw new Error(error.message);

  await supabaseAdmin.from("merchant_audit_logs").insert({
    merchant_id: merchantId,
    actor_id: user.id,
    actor_type: "ADMIN",
    action: newStatus === "ACTIVE" ? "MERCHANT_ACTIVATED" : "MERCHANT_SUSPENDED",
    details: { previous_status: currentStatus, new_status: newStatus },
  });

  revalidatePath("/admin/merchants");
  revalidatePath(`/admin/merchants/${merchantId}`);
}

export async function rotateCredentialsAction(merchantId: string): Promise<void> {
  const { rotateMerchantCredentials } = await import("@/lib/merchant/provision");
  await rotateMerchantCredentials(merchantId);
  revalidatePath("/admin/merchants");
  revalidatePath(`/admin/merchants/${merchantId}`);
}

export async function resendWebhookAction(webhookEventId: string): Promise<void> {
  const supabaseAdmin = createAdminClient();
  const { data: event } = await supabaseAdmin
    .from("merchant_webhook_events")
    .select("*, merchants(*)")
    .eq("id", webhookEventId)
    .single();

  if (!event || !event.merchants?.webhook_url) {
    throw new Error("Webhook event or target url not found");
  }

  const { deliverWebhookAttempt } = await import("@/lib/merchant/webhooks");
  await deliverWebhookAttempt(
    event.id,
    event.merchants.webhook_url,
    event.merchants.webhook_secret || "",
    event.payload
  );

  revalidatePath("/admin/merchants");
  revalidatePath(`/admin/merchants/${event.merchant_id}`);
}
