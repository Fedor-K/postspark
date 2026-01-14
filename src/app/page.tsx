"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (res.ok && data.user) {
          if (data.user.userType && data.user.userType !== '') {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
          return;
        }
      } catch {}
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold text-white">PostSpark</span>
          </div>
          <a href="/login" className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
            Sign In
          </a>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 pt-12 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            LinkedIn Posts That
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> Get You Clients</span>
          </h1>

          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Get 10 personalized post ideas + ready-to-publish content for solopreneurs, coaches & consultants. Free forever.
          </p>

          {/* CTA Form */}
          <div className="max-w-md mx-auto">
            {sent ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
                <div className="text-5xl mb-4">📧</div>
                <h2 className="text-2xl font-bold text-white mb-2">Check your email!</h2>
                <p className="text-gray-300 mb-4">
                  We sent a magic link to <span className="text-blue-400 font-medium">{email}</span>
                </p>
                <p className="text-gray-400 text-sm">Click the link to get started. Expires in 15 minutes.</p>
                <button onClick={() => { setSent(false); setEmail(""); }} className="mt-4 text-blue-400 hover:text-blue-300 text-sm">
                  Use different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {loading ? "..." : "Get Started"}
                  </button>
                </div>
                <p className="text-gray-500 text-sm">No password needed. We'll send you a magic link.</p>
              </form>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💡</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">10 Post Ideas</h3>
            <p className="text-gray-400">Personalized content ideas based on your niche and target audience</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✍️</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">3 Writing Styles</h3>
            <p className="text-gray-400">Professional, casual, or storytelling - pick what fits your voice</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📧</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Weekly Reminders</h3>
            <p className="text-gray-400">Fresh ideas delivered to your inbox on your schedule</p>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Enter Email", desc: "Get a magic link" },
              { step: "2", title: "Tell Us About You", desc: "Niche & audience" },
              { step: "3", title: "Get Ideas", desc: "10 personalized topics" },
              { step: "4", title: "Write & Post", desc: "Ready in seconds" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="max-w-2xl mx-auto mt-24 text-center">
          <div className="flex items-center justify-center gap-8 text-gray-400">
            <div>
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm">Users</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <div className="text-3xl font-bold text-white">5,000+</div>
              <div className="text-sm">Ideas Generated</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <div className="text-3xl font-bold text-white">Free</div>
              <div className="text-sm">Forever</div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-xl mx-auto mt-24 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to grow on LinkedIn?</h2>
          <p className="text-gray-400 mb-6">Join 500+ solopreneurs and coaches who post with confidence.</p>
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90">
            Get Your Post Ideas
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          PostSpark - LinkedIn Content for Solopreneurs & Coaches
        </div>
      </footer>
    </div>
  );
}
