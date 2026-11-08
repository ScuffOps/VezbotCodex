-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "guild_configs" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "tickets_enabled" BOOLEAN NOT NULL DEFAULT false,
    "moderation_enabled" BOOLEAN NOT NULL DEFAULT true,
    "role_menus_enabled" BOOLEAN NOT NULL DEFAULT false,
    "logging_enabled" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_enabled" BOOLEAN NOT NULL DEFAULT false,
    "integrations_enabled" BOOLEAN NOT NULL DEFAULT false,
    "log_channel_id" TEXT,
    "mod_log_channel_id" TEXT,
    "ticket_category_id" TEXT,
    "ticket_log_channel_id" TEXT,
    "welcome_channel_id" TEXT,
    "mod_role_id" TEXT,
    "admin_role_id" TEXT,
    "mute_role_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "ticket_number" INTEGER NOT NULL,
    "channel_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "subject" TEXT,
    "closed_by" TEXT,
    "close_reason" TEXT,
    "claimed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "transcript" TEXT,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_cases" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "case_number" INTEGER NOT NULL,
    "target_id" TEXT NOT NULL,
    "moderator_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "duration" INTEGER,
    "evidence" TEXT,
    "log_message_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_menus" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "channel_id" TEXT NOT NULL,
    "message_id" TEXT,
    "max_selections" INTEGER NOT NULL DEFAULT 0,
    "exclusive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_menu_options" (
    "id" TEXT NOT NULL,
    "role_menu_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "role_menu_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "guild_id" TEXT,
    "message" TEXT NOT NULL,
    "channel_id" TEXT,
    "remind_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_events" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "creator_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "channel_id" TEXT,
    "discord_event_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT,
    "notify_channel_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guild_configs_guild_id_key" ON "guild_configs"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_channel_id_key" ON "tickets"("channel_id");

-- CreateIndex
CREATE INDEX "tickets_guild_id_status_idx" ON "tickets"("guild_id", "status");

-- CreateIndex
CREATE INDEX "tickets_creator_id_idx" ON "tickets"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_guild_id_ticket_number_key" ON "tickets"("guild_id", "ticket_number");

-- CreateIndex
CREATE INDEX "moderation_cases_guild_id_target_id_idx" ON "moderation_cases"("guild_id", "target_id");

-- CreateIndex
CREATE INDEX "moderation_cases_guild_id_moderator_id_idx" ON "moderation_cases"("guild_id", "moderator_id");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_cases_guild_id_case_number_key" ON "moderation_cases"("guild_id", "case_number");

-- CreateIndex
CREATE INDEX "role_menus_guild_id_idx" ON "role_menus"("guild_id");

-- CreateIndex
CREATE INDEX "role_menu_options_role_menu_id_idx" ON "role_menu_options"("role_menu_id");

-- CreateIndex
CREATE INDEX "reminders_sent_remind_at_idx" ON "reminders"("sent", "remind_at");

-- CreateIndex
CREATE INDEX "reminders_user_id_idx" ON "reminders"("user_id");

-- CreateIndex
CREATE INDEX "scheduled_events_guild_id_active_idx" ON "scheduled_events"("guild_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "integration_configs_guild_id_provider_key" ON "integration_configs"("guild_id", "provider");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_menus" ADD CONSTRAINT "role_menus_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_menu_options" ADD CONSTRAINT "role_menu_options_role_menu_id_fkey" FOREIGN KEY ("role_menu_id") REFERENCES "role_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_configs" ADD CONSTRAINT "integration_configs_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;
