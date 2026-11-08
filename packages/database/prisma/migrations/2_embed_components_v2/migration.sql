ALTER TABLE "embed_templates"
ADD COLUMN "content" TEXT,
ADD COLUMN "components_v2_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "components_json" TEXT;
