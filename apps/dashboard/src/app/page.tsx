import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowRight, Bot, Orbit, Shield } from "lucide-react";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/guilds");
  }

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden px-4 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-3xl font-bold text-white">VF</span>
          </div>

          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Vezbot_FIN
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Operate Discord servers through a live bot and a staged web control plane built for
            tickets, moderation, role menus, reminders, and integrations.
          </p>

          <Link href="/login" className="btn btn-primary text-lg px-8 py-4">
            Open Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Bot className="w-6 h-6" />}
            title="Bot First"
            description="Keep the operational center in Discord while the dashboard handles configuration cleanly."
          />
          <FeatureCard
            icon={<Orbit className="w-6 h-6" />}
            title="Control Plane"
            description="Phase features in intentionally instead of shipping fake admin flows that do nothing."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Guild Scoped"
            description="Only servers you can actually manage are exposed to the dashboard surface."
          />
        </div>
      </section>

      <footer className="py-8 px-4 text-center text-muted">
        <p>© 2026 Vezbot_FIN</p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-panel p-6">
      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
