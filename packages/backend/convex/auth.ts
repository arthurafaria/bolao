import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
		Password({
			profile(params) {
				const name = params.name as string | undefined;
				return {
					email: params.email as string,
					...(name ? { name } : {}),
				};
			},
		}),
	],
});

type AuthCtx = Parameters<typeof auth.getUserId>[0];

export async function requireUserId(ctx: AuthCtx) {
	const userId = await auth.getUserId(ctx);
	if (!userId) throw new ConvexError("Not authenticated");
	return userId;
}

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const userId = await auth.getUserId(ctx);
		return userId ? await ctx.db.get(userId) : null;
	},
});

export const setCurrentUserName = mutation({
	args: { name: v.string() },
	handler: async (ctx, { name }) => {
		const userId = await requireUserId(ctx);
		await ctx.db.patch(userId, { name });
	},
});
