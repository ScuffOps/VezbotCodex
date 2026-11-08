ALTER TABLE "reminders"
  ADD COLUMN "claimed_at" TIMESTAMP(3),
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "last_error" TEXT;

CREATE TABLE "user_preferences" (
  "user_id" TEXT NOT NULL PRIMARY KEY,
  "timezone" TEXT NOT NULL DEFAULT 'UTC'
);
