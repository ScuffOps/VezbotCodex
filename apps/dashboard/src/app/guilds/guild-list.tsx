'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import type { DiscordGuild } from '@/lib/discord';
import { getGuildIconUrl } from '@/lib/discord';

export function GuildList({ guilds }: { guilds: DiscordGuild[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {guilds.map((guild, index) => (
        <Link
          key={guild.id}
          href={`/dashboard/${guild.id}`}
          className="glass-panel p-4 flex items-center gap-4 group hover:border-primary/30 transition-all duration-200 animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center flex-shrink-0 overflow-hidden">
            {guild.icon ? (
              <Image
                src={getGuildIconUrl(guild)}
                alt={guild.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-muted-foreground">
                {guild.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {guild.name}
            </h3>
            <p className="text-sm text-muted">Click to manage</p>
          </div>

          {/* Arrow */}
          <Settings className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
        </Link>
      ))}
    </div>
  );
}
