import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "admin@naturogroup.com.au";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: `Trackio <${FROM}>`,
      to,
      subject,
      html: wrapTemplate(subject, html),
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown email error";
    // Log but don't crash — email failures shouldn't break the main operation
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to send email:", msg);
    }
    return { success: false, error: msg };
  }
}

function wrapTemplate(title: string, body: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
        <tr><td align="center">
          <table width="100%" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <tr><td style="background:#0f1b3d;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Trackio</h1>
              <p style="margin:4px 0 0;color:#c9a84c;font-size:12px;letter-spacing:1px;">ASSET &amp; CONSUMABLE TRACKER</p>
            </td></tr>
            <tr><td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#0f1b3d;font-size:18px;">${title}</h2>
              ${body}
            </td></tr>
            <tr><td style="padding:16px 32px;background:#f8f9fa;text-align:center;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#868e96;font-size:12px;">&copy; Trackio Australia. All rights reserved.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

export function emailAssetAssigned(staffName: string, assetName: string, assetCode: string, type: string, returnDate?: string) {
  const returnInfo = returnDate
    ? `<p style="color:#495057;">Expected return date: <strong>${returnDate}</strong></p>`
    : `<p style="color:#495057;">Assignment type: <strong>Permanent</strong></p>`;
  return `
    <p style="color:#495057;">Hi ${staffName},</p>
    <p style="color:#495057;">The following asset has been assigned to you:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Asset</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${assetName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Code</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${assetCode}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Type</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${type}</td></tr>
    </table>
    ${returnInfo}
    <p style="color:#868e96;font-size:13px;">Please take care of this asset. Report any damage immediately through the portal.</p>
  `;
}

export function emailAssetReturned(staffName: string, assetName: string, assetCode: string) {
  return `
    <p style="color:#495057;">Hi ${staffName},</p>
    <p style="color:#495057;">The following asset has been checked in / returned:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Asset</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${assetName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Code</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${assetCode}</td></tr>
    </table>
    <p style="color:#495057;">Thank you for returning this item.</p>
  `;
}

export function emailConsumableRequested(managerName: string, staffName: string, itemName: string, qty: number) {
  return `
    <p style="color:#495057;">Hi ${managerName},</p>
    <p style="color:#495057;">A new consumable request has been submitted:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Requested by</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${staffName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Item</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${itemName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Quantity</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${qty}</td></tr>
    </table>
    <p style="color:#495057;">Please review this request in the portal.</p>
  `;
}

export function emailLowStock(itemName: string, currentQty: number, threshold: number, regionName: string) {
  return `
    <p style="color:#495057;">Low stock alert:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Item</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${itemName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Current qty</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#c0392b;font-weight:600;">${currentQty}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Threshold</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${threshold}</td></tr>
      <tr><td style="padding:8px 12px;background:#f8f9fa;border:1px solid #e9ecef;font-weight:600;color:#0f1b3d;">Region</td>
          <td style="padding:8px 12px;border:1px solid #e9ecef;color:#495057;">${regionName}</td></tr>
    </table>
    <p style="color:#c0392b;font-weight:600;">Please reorder soon.</p>
  `;
}
