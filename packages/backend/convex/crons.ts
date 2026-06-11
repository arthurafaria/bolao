import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
	"sync WC today",
	"*/10 * * * *",
	internal.footballData.syncToday,
	{},
);

crons.cron(
	"sync BSA today",
	"*/10 * * * *",
	internal.footballData.syncTodayBSA,
	{},
);

crons.cron(
	"schedule first match reminder",
	"0 3 * * *",
	internal.notifications.scheduleDailyReminder,
	{},
);

export default crons;
