import { Events, type ClientEvents } from "discord.js";
import { setReactionRole } from "../services/reaction-role.service";

export const name = Events.MessageReactionAdd;

export async function execute(...[reaction, user, details]: ClientEvents[typeof name]): Promise<void> {
  if (!details.burst) await setReactionRole("add", reaction, user);
}
