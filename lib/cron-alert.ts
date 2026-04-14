import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type CronAlertPayload = {
  type: string;
  status: string;
  message: string;
  slug?: string;
};

export async function sendCronAlert({
  type,
  status,
  message,
  slug
}: CronAlertPayload) {
  const alertEmail = process.env.ALERT_EMAIL?.trim();
  if (!alertEmail) {
    console.warn("[Cron Alert] ALERT_EMAIL is not configured; skipping alert.");
    return;
  }

  try {
    await resend.emails.send({
      from: "Shalean <alerts@yourdomain.com>",
      to: alertEmail,
      subject: `[CRON] ${status.toUpperCase()} - ${type}`,
      html: `
        <h2>Cron Job Alert</h2>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Message:</strong> ${message}</p>
        ${slug ? `<p><strong>Slug:</strong> ${slug}</p>` : ""}
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    });
  } catch (err) {
    console.error("Failed to send cron alert", err);
  }
}
