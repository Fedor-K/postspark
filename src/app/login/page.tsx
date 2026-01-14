"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  useEffect(() => {
    // Check if already logged in
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

  useEffect(() => {
    if (urlError === "expired") setError("Link expired. Please request a new one.");
    else if (urlError === "invalid") setError("Invalid link. Please request a new one.");
    else if (urlError === "nouser") setError("Account not found.");
    else if (urlError === "server") setError("Something went wrong. Please try again.");
  }, [urlError]);

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

      if (!res.ok) {
        throw new Error(data.error);
      }

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
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <span className="text-3xl font-bold text-white">PostSpark</span>
          </div>
          <p className="text-gray-400">LinkedIn Content for Solopreneurs & Coaches</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-white mb-2">Check your email!</h2>
              <p className="text-gray-300 mb-4">
                We sent a magic link to <span className="text-blue-400 font-medium">{email}</span>
              </p>
              <p className="text-gray-400 text-sm">
                Click the link in the email to sign in. The link expires in 15 minutes.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="mt-6 text-blue-400 hover:text-blue-300 text-sm"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Get Started</h2>
              <p className="text-gray-400 text-center mb-6">Enter your email to sign in or create an account</p>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Continue with Email"}
                </button>
              </form>

              <p className="mt-6 text-gray-500 text-xs text-center">
                We'll send you a magic link for secure, password-free login
              </p>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-gray-400">
            <div className="text-2xl mb-1">10</div>
            <div className="text-xs">Post Ideas</div>
          </div>
          <div className="text-gray-400">
            <div className="text-2xl mb-1">3</div>
            <div className="text-xs">Writing Styles</div>
          </div>
          <div className="text-gray-400">
            <div className="text-2xl mb-1">Free</div>
            <div className="text-xs">Forever</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
