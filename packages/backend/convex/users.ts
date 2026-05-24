import { internalQuery } from "./_generated/server";

export const listEmails = internalQuery({
	args: {},
	handler: async (ctx) => {
		const users = await ctx.db.query("users").collect();
		return users
			.filter((u) => u.email != null)
			.map((u) => ({
				userId: u._id,
				email: u.email as string,
				name: u.name ?? null,
			}));
	},
});
