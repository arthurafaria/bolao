import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron("sync WC today", "0 * * * *", internal.footballData.syncToday, {});

crons.cron(
	"sync BSA today",
	"*/30 * * * *",
	internal.footballData.syncTodayBSA,
	{},
);

export default crons;
