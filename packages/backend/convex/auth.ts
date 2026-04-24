import Resend from "@auth/core/providers/resend";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

import { query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [Resend, Password],
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
