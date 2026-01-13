"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SavedPost {
  id: number;
  idea_title: string;
  post_content: string;
  tone: string;
  created_at: string;
}

interface Generation {
  id: number;
  createdAt: string;
  ideasCount: number;
}

interface User {
  id: number;
  email: string;
  userType: string;
  niche: string;
  targetAudience: string;
  linkedinName: string | null;
  linkedinHeadline: string | null;
  createdAt: string;
}

interface Stats {
  savedCount: number;
  generationCount: number;
}

interface DashboardData {
  user: User;
  savedPosts: SavedPost[];
  generations: Generation[];
  stats: Stats;
}

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const result = await res.json();
      
      if (!res.ok || !result.user) {
        router.push("/login");
        return;
      }
      
      setEmail(result.user.email);
      fetchDashboard(result.user.email);
    } catch {
      router.push("/login");
    }
  };

  const fetchDashboard = async (userEmail: string) => {
    try {
      const res = await fetch(`/api/dashboard?email=${encodeURIComponent(userEmail)}`);
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error);
      }
      
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  };

  const copyPost = (id: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4 text-4xl">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard Not Found</h1>
          <p className="text-gray-400 mb-6">{error || "Unable to load dashboard"}</p>
          <Link 
            href="/" 
            className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg"
          >
            Generate New Ideas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold text-white">PostSpark</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90"
            >
              + New Ideas
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 bg-white/10 text-gray-300 font-medium rounded-lg hover:bg-white/20 disabled:opacity-50"
            >
              {loggingOut ? "..." : "Logout"}
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {data.user.linkedinName?.[0] || data.user.email[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {data.user.linkedinName || "Your Dashboard"}
                </h1>
                <p className="text-gray-400">
                  {data.user.linkedinHeadline || `${data.user.userType} in ${data.user.niche}`}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                    {data.user.niche}
                  </span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                    {data.user.userType}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 rounded-xl p-5 border border-white/20 text-center">
            <div className="text-3xl font-bold text-white">{data.stats.generationCount}</div>
            <div className="text-gray-400 text-sm">Ideas Generated</div>
          </div>
          <div className="bg-white/10 rounded-xl p-5 border border-white/20 text-center">
            <div className="text-3xl font-bold text-white">{data.stats.savedCount}</div>
            <div className="text-gray-400 text-sm">Posts Saved</div>
          </div>
          <div className="bg-white/10 rounded-xl p-5 border border-white/20 text-center">
            <div className="text-3xl font-bold text-white">{data.stats.generationCount * 10}</div>
            <div className="text-gray-400 text-sm">Total Ideas</div>
          </div>
          <div className="bg-white/10 rounded-xl p-5 border border-white/20 text-center">
            <div className="text-3xl font-bold text-white">∞</div>
            <div className="text-gray-400 text-sm">Potential Reach</div>
          </div>
        </div>

        {/* Saved Posts */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Saved Posts ({data.savedPosts.length})</h2>
          
          {data.savedPosts.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
              <p className="text-gray-400 mb-4">No saved posts yet</p>
              <Link 
                href="/"
                className="text-orange-400 hover:text-orange-300"
              >
                Generate ideas and save your favorite posts →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {data.savedPosts.map((post) => (
                <div key={post.id} className="bg-white/10 rounded-xl p-5 border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                        {post.tone}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                    <button
                      onClick={() => copyPost(post.id, post.post_content)}
                      className="px-3 py-1 bg-white/10 text-white text-sm rounded hover:bg-white/20"
                    >
                      {copied === post.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  {post.idea_title && (
                    <p className="text-orange-400 text-sm mb-2 font-medium">{post.idea_title}</p>
                  )}
                  <p className="text-gray-300 text-sm whitespace-pre-wrap line-clamp-4">
                    {post.post_content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generation History */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Generation History</h2>
          
          {data.generations.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
              <p className="text-gray-400">No generations yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.generations.map((gen) => (
                <div key={gen.id} className="bg-white/5 rounded-lg p-4 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400">
                      💡
                    </div>
                    <div>
                      <p className="text-white">{gen.ideasCount} ideas generated</p>
                      <p className="text-gray-500 text-sm">{formatDate(gen.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Email Note */}
        <div className="mt-8 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-xl p-6 border border-orange-500/30 text-center">
          <h3 className="text-white font-semibold mb-2">📬 Weekly Ideas</h3>
          <p className="text-gray-300 text-sm">
            We send fresh post ideas to <strong>{data.user.email}</strong> every Monday
          </p>
        </div>
      </div>

      <footer className="border-t border-white/10 py-6 text-center text-gray-500 text-sm">
        PostSpark - LinkedIn Content for Solopreneurs & Coaches
      </footer>
    </div>
  );
}
