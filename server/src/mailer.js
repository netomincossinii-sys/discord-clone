import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
export const CLIENT_URL = process.env.CLIENT_URL || (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",")[0].trim();

let transporter = null;
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
}

function resetPasswordHtml({ username, resetUrl }) {
  return `
  <div style="background:#15151a;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#1e1f23;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:#f37108;padding:28px 32px;text-align:center;">
          <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">Callfy</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;color:#e7e7ea;">
          <p style="margin:0 0 16px;font-size:16px;">Oi, <strong>${username}</strong>!</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#b7b8bd;">
            Recebemos um pedido para redefinir a senha da sua conta no Callfy. Clique no botão abaixo para
            escolher uma nova senha. Esse link é válido por 1 hora.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr>
              <td style="border-radius:8px;background:#f37108;">
                <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                  Redefinir senha
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:#85868c;">
            Se o botão não funcionar, copie e cole este link no navegador:
          </p>
          <p style="margin:0 0 24px;font-size:12px;word-break:break-all;color:#f37108;">
            ${resetUrl}
          </p>
          <p style="margin:0;font-size:12px;color:#85868c;">
            Se você não pediu essa redefinição, pode ignorar este e-mail — sua senha continua a mesma.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px;background:#19191d;text-align:center;">
          <span style="font-size:11px;color:#5d5e63;">© Callfy</span>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendPasswordResetEmail({ to, username, resetUrl }) {
  if (!transporter) {
    console.warn("[mailer] GMAIL_USER/GMAIL_APP_PASSWORD not configured; skipping email send. Reset URL:", resetUrl);
    return;
  }
  await transporter.sendMail({
    from: `"Callfy" <${GMAIL_USER}>`,
    to,
    subject: "Redefinir sua senha do Callfy",
    html: resetPasswordHtml({ username, resetUrl }),
  });
}
