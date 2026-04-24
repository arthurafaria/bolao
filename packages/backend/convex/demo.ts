import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

const DEMO_TEAMS = [
  { apiId: -1001, name: "Brasil", shortName: "BRA", crest: "https://flagcdn.com/w80/br.png", nationality: "Brasil" },
  { apiId: -1002, name: "Argentina", shortName: "ARG", crest: "https://flagcdn.com/w80/ar.png", nationality: "Argentina" },
  { apiId: -1003, name: "França", shortName: "FRA", crest: "https://flagcdn.com/w80/fr.png", nationality: "França" },
  { apiId: -1004, name: "Alemanha", shortName: "GER", crest: "https://flagcdn.com/w80/de.png", nationality: "Alemanha" },
  { apiId: -1005, name: "Espanha", shortName: "ESP", crest: "https://flagcdn.com/w80/es.png", nationality: "Espanha" },
  { apiId: -1006, name: "Portugal", shortName: "POR", crest: "https://flagcdn.com/w80/pt.png", nationality: "Portugal" },
];

export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear stale demo matches to allow re-seeding with updated config
    const stale = await ctx.db
      .query("matches")
      .withIndex("by_tournament_stage", (q) => q.eq("tournament", "DEMO"))
      .collect();
    for (const m of stale) await ctx.db.delete(m._id);

    const teamIds: Record<number, Id<"teams">> = {};
    for (const t of DEMO_TEAMS) {
      const found = await ctx.db
        .query("teams")
        .withIndex("by_apiId", (q) => q.eq("apiId", t.apiId))
        .unique();
      if (found) {
        teamIds[t.apiId] = found._id;
      } else {
        teamIds[t.apiId] = await ctx.db.insert("teams", t);
      }
    }

    const at = (offsetDays: number, hour = 19) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      d.setUTCHours(hour, 0, 0, 0);
      return d.toISOString();
    };

    const bra = teamIds[-1001]!;
    const arg = teamIds[-1002]!;
    const fra = teamIds[-1003]!;
    const ger = teamIds[-1004]!;
    const esp = teamIds[-1005]!;
    const por = teamIds[-1006]!;

    await ctx.db.insert("matches", {
      apiId: -2001,
      homeTeamId: bra,
      awayTeamId: ger,
      utcDate: at(-3),
      status: "FINISHED",
      homeScore: 3,
      awayScore: 0,
      stage: "GROUP_STAGE",
      group: "GRUPO A",
      matchday: 1,
      tournament: "DEMO",
    });

    await ctx.db.insert("matches", {
      apiId: -2002,
      homeTeamId: arg,
      awayTeamId: fra,
      utcDate: at(-1),
      status: "FINISHED",
      homeScore: 1,
      awayScore: 2,
      stage: "GROUP_STAGE",
      group: "GRUPO A",
      matchday: 1,
      tournament: "DEMO",
    });

    await ctx.db.insert("matches", {
      apiId: -2003,
      homeTeamId: esp,
      awayTeamId: por,
      utcDate: at(2),
      status: "TIMED",
      stage: "GROUP_STAGE",
      group: "GRUPO A",
      matchday: 1,
      tournament: "DEMO",
    });

    await ctx.db.insert("matches", {
      apiId: -2004,
      homeTeamId: bra,
      awayTeamId: arg,
      utcDate: at(5),
      status: "TIMED",
      stage: "GROUP_STAGE",
      group: "GRUPO A",
      matchday: 2,
      tournament: "DEMO",
    });

    await ctx.db.insert("matches", {
      apiId: -2005,
      homeTeamId: fra,
      awayTeamId: esp,
      utcDate: at(8),
      status: "TIMED",
      stage: "GROUP_STAGE",
      group: "GRUPO A",
      matchday: 2,
      tournament: "DEMO",
    });

    await ctx.db.insert("matches", {
      apiId: -2006,
      homeTeamId: bra,
      awayTeamId: fra,
      utcDate: at(14),
      status: "TIMED",
      stage: "ROUND_OF_16",
      tournament: "DEMO",
    });

    return { seeded: 6 };
  },
});
