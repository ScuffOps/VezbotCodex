'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setError(params.get('error'));
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 max-w-md w-full text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-2xl font-bold text-white">VF</span>
        </div>

        <h1 className="text-2xl font-bold mb-2">Sign in to Vezbot_FIN</h1>
        <p className="text-muted-foreground mb-8">
          Use Discord to open the servers you can manage and continue into the dashboard.
        </p>

        {error === 'session_expired' ? (
          <div className="mb-5 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Session expired. Please sign in again.
          </div>
        ) : null}

        {error === 'OAuthCallback' || error === 'Callback' ? (
          <div className="mb-5 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            Discord sign-in failed. OAuth client settings may be mismatched in environment variables.
          </div>
        ) : null}

        <button
          onClick={() => signIn('discord', { callbackUrl: '/guilds' })}
          className="btn btn-primary w-full text-base"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Discord
        </button>

        <p className="mt-6 text-sm text-muted">
          Vezbot_FIN only requests the identity and guild scopes needed to verify dashboard access.
        </p>
      </div>
    </main>
  );
}
