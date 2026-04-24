import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { auth, requireUserId } from "./auth";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    joinType: v.union(v.literal("OPEN"), v.literal("MODERATED")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    if (args.name.trim().length < 3) {
      throw new ConvexError("League name must be at least 3 characters");
    }

    let inviteCode: string;
    let attempts = 0;
    do {
      inviteCode = generateInviteCode();
      const existing = await ctx.db
        .query("leagues")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
        .unique();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const leagueId = await ctx.db.insert("leagues", {
      name: args.name.trim(),
      description: args.description,
      ownerId: userId,
      joinType: args.joinType,
      inviteCode: inviteCode!,
      memberCount: 1,
    });

    await ctx.db.insert("leagueMembers", {
      leagueId,
      userId,
      totalPoints: 0,
      exactScores: 0,
      correctResults: 0,
      status: "ACTIVE",
      joinedAt: Date.now(),
    });

    return leagueId;
  },
});

export const join = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const league = await ctx.db
      .query("leagues")
      .withIndex("by_inviteCode", (q) =>
        q.eq("inviteCode", args.inviteCode.toUpperCase()),
      )
      .unique();
    if (!league) throw new ConvexError("League not found");

    if (league.memberCount >= 50) {
      throw new ConvexError("League is full (50 members max)");
    }

    const existing = await ctx.db
      .query("leagueMembers")
      .withIndex("by_league_user", (q) =>
        q.eq("leagueId", league._id).eq("userId", userId),
      )
      .unique();

    if (existing?.status === "ACTIVE") {
      throw new ConvexError("Already a member of this league");
    }

    if (league.joinType === "MODERATED") {
      const pendingRequest = await ctx.db
        .query("leagueJoinRequests")
        .withIndex("by_league_status", (q) =>
          q.eq("leagueId", league._id).eq("status", "PENDING"),
        )
        .filter((q) => q.eq(q.field("userId"), userId))
        .unique();

      if (pendingRequest) throw new ConvexError("Request already pending");

      await ctx.db.insert("leagueJoinRequests", {
        leagueId: league._id,
        userId,
        requestedAt: Date.now(),
        status: "PENDING",
      });

      return { status: "PENDING" as const, leagueId: league._id };
    }

    if (existing) {
      await ctx.db.patch(existing._id, { status: "ACTIVE", joinedAt: Date.now() });
    } else {
      await ctx.db.insert("leagueMembers", {
        leagueId: league._id,
        userId,
        totalPoints: 0,
        exactScores: 0,
        correctResults: 0,
        status: "ACTIVE",
        joinedAt: Date.now(),
      });
    }

    await ctx.db.patch(league._id, { memberCount: league.memberCount + 1 });

    return { status: "JOINED" as const, leagueId: league._id };
  },
});

export const approveRequest = mutation({
  args: { requestId: v.id("leagueJoinRequests") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "PENDING") {
      throw new ConvexError("Request not found");
    }

    const league = await ctx.db.get(request.leagueId);
    if (!league || league.ownerId !== userId) {
      throw new ConvexError("Not authorized");
    }

    if (league.memberCount >= 50) {
      throw new ConvexError("League is full");
    }

    await ctx.db.patch(args.requestId, { status: "APPROVED" });

    const existing = await ctx.db
      .query("leagueMembers")
      .withIndex("by_league_user", (q) =>
        q.eq("leagueId", request.leagueId).eq("userId", request.userId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { status: "ACTIVE", joinedAt: Date.now() });
    } else {
      await ctx.db.insert("leagueMembers", {
        leagueId: request.leagueId,
        userId: request.userId,
        totalPoints: 0,
        exactScores: 0,
        correctResults: 0,
        status: "ACTIVE",
        joinedAt: Date.now(),
      });
    }

    await ctx.db.patch(league._id, { memberCount: league.memberCount + 1 });
  },
});

export const rejectRequest = mutation({
  args: { requestId: v.id("leagueJoinRequests") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new ConvexError("Request not found");

    const league = await ctx.db.get(request.leagueId);
    if (!league || league.ownerId !== userId) {
      throw new ConvexError("Not authorized");
    }

    await ctx.db.patch(args.requestId, { status: "REJECTED" });
  },
});

export const removeMember = mutation({
  args: { leagueId: v.id("leagues"), targetUserId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const league = await ctx.db.get(args.leagueId);
    if (!league || league.ownerId !== userId) {
      throw new ConvexError("Not authorized");
    }

    if (args.targetUserId === userId) {
      throw new ConvexError("Owner cannot remove themselves");
    }

    const membership = await ctx.db
      .query("leagueMembers")
      .withIndex("by_league_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", args.targetUserId),
      )
      .unique();

    if (!membership || membership.status !== "ACTIVE") {
      throw new ConvexError("Member not found");
    }

    await ctx.db.patch(membership._id, { status: "REMOVED" });
    await ctx.db.patch(league._id, {
      memberCount: Math.max(0, league.memberCount - 1),
    });
  },
});

export const leave = mutation({
  args: { leagueId: v.id("leagues") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new ConvexError("League not found");

    if (league.ownerId === userId) {
      throw new ConvexError("Owner cannot leave the league");
    }

    const membership = await ctx.db
      .query("leagueMembers")
      .withIndex("by_league_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .unique();

    if (!membership || membership.status !== "ACTIVE") {
      throw new ConvexError("Not a member of this league");
    }

    await ctx.db.patch(membership._id, { status: "REMOVED" });
    await ctx.db.patch(league._id, {
      memberCount: Math.max(0, league.memberCount - 1),
    });
  },
});

export const update = mutation({
  args: {
    leagueId: v.id("leagues"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    joinType: v.optional(v.union(v.literal("OPEN"), v.literal("MODERATED"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const league = await ctx.db.get(args.leagueId);
    if (!league || league.ownerId !== userId) {
      throw new ConvexError("Not authorized");
    }

    const patch: Record<string, unknown> = {};
    if (args.name) patch.name = args.name.trim();
    if (args.description !== undefined) patch.description = args.description;
    if (args.joinType) patch.joinType = args.joinType;

    await ctx.db.patch(args.leagueId, patch);
  },
});

export const getById = query({
  args: { leagueId: v.id("leagues") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.leagueId);
  },
});

export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("leagues")
      .withIndex("by_inviteCode", (q) =>
        q.eq("inviteCode", args.inviteCode.toUpperCase()),
      )
      .unique();
  },
});

export const getRanking = query({
  args: { leagueId: v.id("leagues") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("leagueMembers")
      .withIndex("by_league_points", (q) => q.eq("leagueId", args.leagueId))
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .take(50);

    return members;
  },
});

export const getUserLeagues = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("leagueMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .take(50);

    const leagues = await Promise.all(
      memberships.map(async (m) => {
        const league = await ctx.db.get(m.leagueId);
        return league ? { ...league, myPoints: m.totalPoints } : null;
      }),
    );

    return leagues.filter(Boolean);
  },
});

export const getPendingRequests = query({
  args: { leagueId: v.id("leagues") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const league = await ctx.db.get(args.leagueId);
    if (!league || league.ownerId !== userId) return [];

    return ctx.db
      .query("leagueJoinRequests")
      .withIndex("by_league_status", (q) =>
        q.eq("leagueId", args.leagueId).eq("status", "PENDING"),
      )
      .take(50);
  },
});
