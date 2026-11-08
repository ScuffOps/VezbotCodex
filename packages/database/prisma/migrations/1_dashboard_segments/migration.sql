-- CreateTable
CREATE TABLE "embed_templates" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color_hex" TEXT,
    "footer_text" TEXT,
    "channel_id" TEXT,
    "image_url" TEXT,
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embed_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options_json" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "channel_id" TEXT,
    "message_id" TEXT,
    "allow_multi" BOOLEAN NOT NULL DEFAULT false,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "creator_id" TEXT NOT NULL,
    "closes_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "embed_templates_guild_id_name_key" ON "embed_templates"("guild_id", "name");

-- CreateIndex
CREATE INDEX "embed_templates_guild_id_updated_at_idx" ON "embed_templates"("guild_id", "updated_at");

-- CreateIndex
CREATE INDEX "polls_guild_id_status_idx" ON "polls"("guild_id", "status");

-- CreateIndex
CREATE INDEX "polls_guild_id_created_at_idx" ON "polls"("guild_id", "created_at");

-- AddForeignKey
ALTER TABLE "embed_templates" ADD CONSTRAINT "embed_templates_guild_id_fkey"
FOREIGN KEY ("guild_id") REFERENCES "guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_guild_id_fkey"
FOREIGN KEY ("guild_id") REFERENCES "guild_configs"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;
