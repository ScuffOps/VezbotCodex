/** Brand color palette — consistent across embeds, responses, dashboard */
export const Colors = {
  /** Discord blurple — primary actions, default embeds */
  Primary: 0x5865f2,
  /** Success green — confirmations, completions */
  Success: 0x57f287,
  /** Warning amber — caution states, pending actions */
  Warning: 0xfee75c,
  /** Error red — failures, destructive confirmations */
  Error: 0xed4245,
  /** Info blue — informational, neutral embeds */
  Info: 0x5865f2,
  /** Moderation — distinct from error, used for mod actions */
  Moderation: 0xe67e22,
  /** Ticket — ticket-specific embeds */
  Ticket: 0x3498db,
  /** Muted — secondary, low-emphasis */
  Muted: 0x99aab5,
} as const;

/** Bot identity */
export const Bot = {
  Name: "Vezbot_FIN",
  /** Footer text for embeds */
  Footer: "Vezbot_FIN • Community Platform",
  /** Invite permission integer — Administrator not included deliberately */
  InvitePermissions: "1512671469638",
} as const;

/** Feature flag keys — used for per-guild toggles */
export const FeatureFlags = {
  Tickets: "ticketsEnabled",
  Moderation: "moderationEnabled",
  RoleMenus: "roleMenusEnabled",
  Logging: "loggingEnabled",
  Onboarding: "onboardingEnabled",
  Integrations: "integrationsEnabled",
} as const;

/** Limits to prevent abuse */
export const Limits = {
  MaxTicketsPerUser: 3,
  MaxWarningsBeforeAction: 5,
  MaxRoleMenusPerGuild: 25,
  MaxRolesPerMenu: 25,
  TicketTranscriptMaxMessages: 500,
  EmbedDescriptionMax: 4096,
  EmbedFieldsMax: 25,
} as const;

/** Ticket status values */
export const TicketStatus = {
  Open: "OPEN",
  Closed: "CLOSED",
  Archived: "ARCHIVED",
} as const;

/** Moderation case types */
export const CaseType = {
  Warning: "WARNING",
  Timeout: "TIMEOUT",
  Kick: "KICK",
  Ban: "BAN",
  Unban: "UNBAN",
  Note: "NOTE",
} as const;
