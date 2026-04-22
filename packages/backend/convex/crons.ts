import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "sync today matches",
  "0 * * * *",
  internal.footballData.syncToday,
  {},
);

export default crons;
