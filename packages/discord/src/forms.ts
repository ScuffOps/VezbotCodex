import {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalSubmitInteraction,
} from "discord.js";
import { z } from "zod";

/**
 * Declarative form field definition.
 * Define your modal fields, and the engine handles building,
 * collecting, and validating the submission.
 */
export interface FormField {
  /** Unique field ID — used as the TextInput customId */
  id: string;
  /** Label shown in the modal */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Short (single line) or paragraph (multi-line) */
  style?: "short" | "paragraph";
  /** Min length */
  minLength?: number;
  /** Max length */
  maxLength?: number;
  /** Pre-filled value */
  defaultValue?: string;
}

export interface FormDefinition {
  /** Unique form ID — used as the Modal customId prefix */
  id: string;
  /** Modal title */
  title: string;
  /** Up to 5 form fields (Discord modal limit) */
  fields: FormField[];
}

/**
 * Build a Discord Modal from a declarative form definition.
 * The modal customId is formatted as `form:{formId}:{contextId}`
 * so the handler can identify which form + context this is for.
 */
export function buildModal(
  form: FormDefinition,
  contextId: string
): ModalBuilder {
  if (form.fields.length > 5) {
    throw new Error(`Form "${form.id}" has ${form.fields.length} fields. Discord modals support max 5.`);
  }

  const modal = new ModalBuilder()
    .setCustomId(`form:${form.id}:${contextId}`)
    .setTitle(form.title);

  for (const field of form.fields) {
    const input = new TextInputBuilder()
      .setCustomId(field.id)
      .setLabel(field.label)
      .setStyle(
        field.style === "paragraph"
          ? TextInputStyle.Paragraph
          : TextInputStyle.Short
      )
      .setRequired(field.required ?? false);

    if (field.placeholder) input.setPlaceholder(field.placeholder);
    if (field.minLength !== undefined) input.setMinLength(field.minLength);
    if (field.maxLength !== undefined) input.setMaxLength(field.maxLength);
    if (field.defaultValue) input.setValue(field.defaultValue);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
    modal.addComponents(row);
  }

  return modal;
}

/**
 * Extract typed field values from a modal submission.
 * Returns a Record of fieldId → value.
 */
export function extractFormValues(
  interaction: ModalSubmitInteraction,
  fields: FormField[]
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field.id] = interaction.fields.getTextInputValue(field.id);
  }
  return values;
}

/**
 * Parse the modal customId to extract form ID and context.
 * Format: `form:{formId}:{contextId}`
 */
export function parseFormCustomId(customId: string): {
  formId: string;
  contextId: string;
} | null {
  const parts = customId.split(":");
  if (parts[0] !== "form" || parts.length < 3) return null;
  return {
    formId: parts[1]!,
    contextId: parts.slice(2).join(":"),
  };
}

// ── Pre-built Form Definitions ─────────────────────────

export const TicketCreateForm: FormDefinition = {
  id: "ticket-create",
  title: "Create a Ticket",
  fields: [
    {
      id: "subject",
      label: "Subject",
      placeholder: "Brief description of your issue",
      required: true,
      style: "short",
      maxLength: 100,
    },
    {
      id: "description",
      label: "Description",
      placeholder: "Provide details so staff can help you effectively",
      required: true,
      style: "paragraph",
      maxLength: 1000,
    },
  ],
};

export const TicketCloseForm: FormDefinition = {
  id: "ticket-close",
  title: "Close Ticket",
  fields: [
    {
      id: "reason",
      label: "Reason for closing",
      placeholder: "Resolved / Duplicate / No response / etc.",
      required: false,
      style: "short",
      maxLength: 200,
    },
  ],
};

export const ReportForm: FormDefinition = {
  id: "report",
  title: "Report a User or Issue",
  fields: [
    {
      id: "reported_user",
      label: "Who are you reporting?",
      placeholder: "Username or user ID",
      required: true,
      style: "short",
      maxLength: 100,
    },
    {
      id: "reason",
      label: "What happened?",
      placeholder: "Describe the issue clearly",
      required: true,
      style: "paragraph",
      maxLength: 1000,
    },
    {
      id: "evidence",
      label: "Evidence (links, screenshots, etc.)",
      placeholder: "Paste any relevant links or context",
      required: false,
      style: "paragraph",
      maxLength: 500,
    },
  ],
};

export const ModApplicationForm: FormDefinition = {
  id: "mod-application",
  title: "Moderator Application",
  fields: [
    {
      id: "experience",
      label: "Moderation Experience",
      placeholder: "Describe your experience moderating Discord servers",
      required: true,
      style: "paragraph",
      maxLength: 1000,
    },
    {
      id: "availability",
      label: "Availability",
      placeholder: "What timezone and hours are you available?",
      required: true,
      style: "short",
      maxLength: 200,
    },
    {
      id: "motivation",
      label: "Why do you want to moderate?",
      placeholder: "What motivates you to help this community?",
      required: true,
      style: "paragraph",
      maxLength: 1000,
    },
  ],
};

/** Zod schema for validating ticket creation input */
export const ticketCreateSchema = z.object({
  subject: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
});

/** Zod schema for validating report input */
export const reportSchema = z.object({
  reported_user: z.string().min(1).max(100),
  reason: z.string().min(1).max(1000),
  evidence: z.string().max(500).optional(),
});
