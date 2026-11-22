import { Events, type ClientEvents } from "discord.js";
import { setReactionRole } from "../services/reaction-role.service";

export const name = Events.MessageReactionRemove;

export async function execute(...[reaction, user, details]: ClientEvents[typeof name]): Promise<void> {
  if (!details.burst) await setReactionRole("remove", reaction, user);
}
