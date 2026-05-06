import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";

export const ResendOTP = Resend({
	id: "resend-otp",
	apiKey: process.env.AUTH_RESEND_KEY,
	maxAge: 60 * 15,
	async generateVerificationToken() {
		const bytes = new Uint8Array(6);
		crypto.getRandomValues(bytes);
		return Array.from(bytes, (b) => (b % 10).toString()).join("");
	},
	async sendVerificationRequest({ identifier: email, provider, token }) {
		const apiKey = provider.apiKey;
		if (!apiKey) throw new Error("AUTH_RESEND_KEY não configurada");
		const resend = new ResendAPI(apiKey);
		const { error } = await resend.emails.send({
			from: "Bolão 2026 <onboarding@resend.dev>",
			to: [email],
			subject: `${token} é seu código do Bolão 2026`,
			text: `Seu código de verificação é ${token}.\n\nEle expira em 15 minutos.\n\nSe você não tentou criar conta no Bolão 2026, pode ignorar este email.`,
			html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0b0d10; color:#e6eaf0; margin:0; padding:32px;">
	<div style="max-width:480px; margin:0 auto; background:#14181d; border-radius:16px; padding:32px; border:1px solid #1f2933;">
		<h1 style="font-size:22px; margin:0 0 12px; color:#22c55e;">Bolão 2026</h1>
		<p style="font-size:15px; color:#9aa4b2; margin:0 0 24px;">Use o código abaixo pra confirmar seu email:</p>
		<div style="font-size:32px; letter-spacing:8px; font-weight:700; text-align:center; padding:18px; background:#0b0d10; border-radius:12px; color:#22c55e; font-family: 'SF Mono', Menlo, monospace;">${token}</div>
		<p style="font-size:13px; color:#6b7280; margin:24px 0 0;">O código expira em 15 minutos. Se você não pediu, pode ignorar este email.</p>
	</div>
</body>
</html>`,
		});
		if (error) throw new Error(JSON.stringify(error));
	},
});
