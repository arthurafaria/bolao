import { v } from "convex/values";
import { Resend } from "resend";
import { api, internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { ACTIVE_TOURNAMENT } from "./lib/tournaments";

const BRT_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3 fixo (sem DST no Brasil em jun/jul)

function formatBRT(isoUtc: string): string {
	const brt = new Date(new Date(isoUtc).getTime() - BRT_OFFSET_MS);
	const h = String(brt.getUTCHours()).padStart(2, "0");
	const m = String(brt.getUTCMinutes()).padStart(2, "0");
	return `${h}:${m} (horário de Brasília)`;
}

export const scheduleDailyReminder = internalAction({
	args: {},
	handler: async (ctx) => {
		// Cron dispara às 03:00 UTC = 00:00 BRT.
		// O "dia de Brasília" vai de 03:00 UTC hoje até 03:00 UTC amanhã.
		const now = new Date();
		const todayStart = new Date(now);
		todayStart.setUTCHours(3, 0, 0, 0);
		if (now.getUTCHours() < 3) {
			todayStart.setUTCDate(todayStart.getUTCDate() - 1);
		}
		const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

		const match = await ctx.runQuery(internal.matches.getFirstMatchOfDay, {
			tournament: ACTIVE_TOURNAMENT,
			dayStartUtc: todayStart.toISOString(),
			dayEndUtc: todayEnd.toISOString(),
		});

		if (!match) {
			console.log("[scheduleDailyReminder] Nenhum jogo hoje");
			return;
		}

		if (match.reminderScheduledAt) {
			console.log(
				`[scheduleDailyReminder] Lembrete já agendado para ${match._id}`,
			);
			return;
		}

		const kickoff = new Date(match.utcDate).getTime();
		const reminderTime = kickoff - 2 * 60 * 60 * 1000; // 1h antes do lock (que fecha 1h antes do jogo)

		await ctx.scheduler.runAt(
			reminderTime,
			internal.notifications.sendFirstMatchReminder,
			{ matchId: match._id },
		);
		await ctx.runMutation(internal.matches.markReminderScheduled, {
			matchId: match._id,
		});

		console.log(
			`[scheduleDailyReminder] Lembrete agendado para ${match._id} em ${new Date(reminderTime).toISOString()}`,
		);
	},
});

// Alerta o admin quando um jogo terminou e nenhuma fonte automática
// (football-data + ESPN) tem o placar. Disparado no máximo 1x por jogo.
export const sendScoreMissingAlert = internalAction({
	args: { matchId: v.id("matches") },
	handler: async (ctx, args) => {
		const apiKey = process.env.AUTH_RESEND_KEY;
		if (!apiKey) {
			console.error("[sendScoreMissingAlert] AUTH_RESEND_KEY não configurada");
			return;
		}
		const siteUrl = process.env.SITE_URL ?? "";
		const adminEmail = "arthurdearaujofaria@gmail.com";

		const match = await ctx.runQuery(api.matches.getById, {
			matchId: args.matchId,
		});
		if (!match) return;

		const homeName = match.homeTeam?.shortName ?? "Time A";
		const awayName = match.awayTeam?.shortName ?? "Time B";

		const resend = new Resend(apiKey);
		await resend.emails.send({
			from: "Bolão 2026 <onboarding@resend.dev>",
			to: [adminEmail],
			subject: `⚠️ Placar pendente — ${homeName} x ${awayName} — Bolão 2026`,
			text: `O jogo ${homeName} x ${awayName} (${formatBRT(match.utcDate)}) terminou, mas nem a football-data.org nem a ESPN publicaram o placar ainda.\n\nOs pontos serão computados automaticamente assim que alguma fonte publicar. Se quiser adiantar, lance o placar manualmente em ${siteUrl}/admin.`,
		});
		console.log(
			`[sendScoreMissingAlert] Alerta enviado para ${adminEmail}: ${homeName} x ${awayName}`,
		);
	},
});

export const sendFirstMatchReminder = internalAction({
	args: { matchId: v.id("matches") },
	handler: async (ctx, args) => {
		const apiKey = process.env.AUTH_RESEND_KEY;
		if (!apiKey) throw new Error("AUTH_RESEND_KEY não configurada");
		const siteUrl = process.env.SITE_URL ?? "";

		const match = await ctx.runQuery(api.matches.getById, {
			matchId: args.matchId,
		});
		if (!match) {
			console.error(
				`[sendFirstMatchReminder] Match ${args.matchId} não encontrado`,
			);
			return;
		}
		if (match.status === "CANCELLED" || match.status === "POSTPONED") {
			console.log(
				`[sendFirstMatchReminder] Match ${args.matchId} está ${match.status}, abortando`,
			);
			return;
		}

		const homeName = match.homeTeam?.shortName ?? "Time A";
		const awayName = match.awayTeam?.shortName ?? "Time B";
		const timeStr = formatBRT(match.utcDate);

		const users = await ctx.runQuery(internal.users.listEmails, {});
		const resend = new Resend(apiKey);

		const results = await Promise.allSettled(
			users.map((user) =>
				resend.emails.send({
					from: "Bolão 2026 <onboarding@resend.dev>",
					to: [user.email],
					subject: `⚽ Palpites fecham em 1h — ${homeName} x ${awayName} — Bolão 2026`,
					text: `Falta 1 hora para fechar os palpites!\n\n${homeName} x ${awayName} — ${timeStr}\n\nDepois disso você não poderá mais apostar.\n${siteUrl}`,
					html: buildEmailHtml({ homeName, awayName, timeStr, siteUrl }),
				}),
			),
		);

		const failed = results.filter((r) => r.status === "rejected").length;
		console.log(
			`[sendFirstMatchReminder] ${users.length - failed}/${users.length} emails enviados para ${homeName} x ${awayName}`,
		);
		if (failed > 0) {
			console.error(`[sendFirstMatchReminder] ${failed} emails falharam`);
		}
	},
});

function buildEmailHtml({
	homeName,
	awayName,
	timeStr,
	siteUrl,
}: {
	homeName: string;
	awayName: string;
	timeStr: string;
	siteUrl: string;
}) {
	return `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0b0d10;color:#e6eaf0;margin:0;padding:32px;">
  <div style="max-width:480px;margin:0 auto;background:#14181d;border-radius:16px;padding:32px;border:1px solid #1f2933;">
    <h1 style="font-size:22px;margin:0 0 8px;color:#22c55e;">Bolão 2026</h1>
    <p style="font-size:13px;color:#6b7280;margin:0 0 24px;">Falta 1 hora para fechar os palpites do dia!</p>
    <div style="text-align:center;padding:24px;background:#0b0d10;border-radius:12px;margin-bottom:24px;">
      <div style="font-size:28px;font-weight:700;color:#f1f5f9;">${homeName} <span style="color:#22c55e;">x</span> ${awayName}</div>
      <div style="font-size:14px;color:#9aa4b2;margin-top:8px;">${timeStr}</div>
    </div>
    <a href="${siteUrl}" style="display:block;text-align:center;background:#22c55e;color:#0b0d10;font-weight:700;font-size:15px;padding:14px 24px;border-radius:10px;text-decoration:none;">Fazer meu palpite agora</a>
    <p style="font-size:12px;color:#6b7280;margin:20px 0 0;text-align:center;">Palpites fecham 1h antes do jogo. Depois disso não dá mais!</p>
  </div>
</body>
</html>`;
}
