"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Post {
  id: number;
  idea_title: string | null;
  post_content: string;
  tone: string;
  platform: string;
  published_at: string | null;
  linkedin_url: string | null;
  views: number;
  likes: number;
  comments: number;
  stats_updated_at: string | null;
  created_at: string;
}

interface StatsHistory {
  views: number;
  recorded_at: string;
}

function getPostStatus(post: Post): { label: string; color: string } {
  if (!post.published_at || !post.stats_updated_at) {
    return { label: "No data", color: "text-gray-500" };
  }
  const publishedAt = new Date(post.published_at);
  const daysSincePublish = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublish < 3) return { label: "🟢 Growing", color: "text-green-400" };
  if (daysSincePublish < 14) return { label: "🟡 Plateau", color: "text-yellow-400" };
  return { label: "🔴 Faded", color: "text-red-400" };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function MiniChart({ history }: { history: StatsHistory[] }) {
  if (history.length < 2) {
    return <p className="text-xs text-gray-500 mt-2">{history.length === 0 ? "No history yet" : "Update again tomorrow to see trend"}</p>;
  }
  const max = Math.max(...history.map((h) => h.views));
  return (
    <div className="mt-3">
      <p className="text-xs text-gray-400 mb-1">Views over time</p>
      <div className="flex items-end gap-1 h-10">
        {history.map((h, i) => {
          const height = max > 0 ? Math.max(4, Math.round((h.views / max) * 40)) : 4;
          return (
            <div key={i} className="flex-1" title={`${h.views.toLocaleString()} — ${formatDate(h.recorded_at)}`}>
              <div className="w-full bg-blue-500 rounded-sm" style={{ height: `${height}px` }} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{formatDate(history[0].recorded_at)}</span>
        <span>{formatDate(history[history.length - 1].recorded_at)}</span>
      </div>
    </div>
  );
}

const inputCls = "w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-400";
const btnSecondary = "border border-white/20 text-gray-300 hover:text-white hover:border-white/40 px-4 py-2 rounded-lg text-sm transition";
const btnPrimary = "bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition";

export default function MyPostsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statsPost, setStatsPost] = useState<Post | null>(null);
  const [statsViews, setStatsViews] = useState("");
  const [statsLikes, setStatsLikes] = useState("");
  const [statsComments, setStatsComments] = useState("");
  const [savingStats, setSavingStats] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addContent, setAddContent] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addDate, setAddDate] = useState(new Date().toISOString().slice(0, 10));
  const [addViews, setAddViews] = useState("");
  const [addLikes, setAddLikes] = useState("");
  const [addComments, setAddComments] = useState("");
  const [addingPost, setAddingPost] = useState(false);

  const [historyPost, setHistoryPost] = useState<Post | null>(null);
  const [history, setHistory] = useState<StatsHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchPosts = useCallback(async (userEmail: string) => {
    try {
      const res = await fetch(`/api/posts/list?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (res.ok) setPosts(data.posts || []);
      else setError(data.error || "Failed to load posts");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const result = await res.json();
        if (!res.ok || !result.user) { router.push("/login"); return; }
        setEmail(result.user.email);
        fetchPosts(result.user.email);
      } catch { router.push("/login"); }
    };
    checkSession();
  }, [router, fetchPosts]);

  const handleUpdateStats = async () => {
    if (!statsPost || !email) return;
    setSavingStats(true);
    try {
      const res = await fetch("/api/posts/stats", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, post_id: statsPost.id, views: Number(statsViews), likes: Number(statsLikes || 0), comments: Number(statsComments || 0) }),
      });
      if (res.ok) { setStatsPost(null); fetchPosts(email); }
    } finally { setSavingStats(false); }
  };

  const handleAddPost = async () => {
    if (!email || !addContent.trim()) return;
    setAddingPost(true);
    try {
      const res = await fetch("/api/posts/add", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, post_content: addContent, idea_title: addTitle || null, linkedin_url: addUrl || null, published_at: addDate, views: Number(addViews || 0), likes: Number(addLikes || 0), comments: Number(addComments || 0) }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddContent(""); setAddTitle(""); setAddUrl(""); setAddViews(""); setAddLikes(""); setAddComments("");
        fetchPosts(email);
      }
    } finally { setAddingPost(false); }
  };

  const loadHistory = async (post: Post) => {
    if (!email) return;
    setHistoryPost(post); setLoadingHistory(true);
    try {
      const res = await fetch(`/api/posts/stats?post_id=${post.id}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok) setHistory(data.history || []);
    } catch { setHistory([]); }
    finally { setLoadingHistory(false); }
  };

  const publishedPosts = posts.filter((p) => p.published_at);
  const draftPosts = posts.filter((p) => !p.published_at);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header — same as Dashboard */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6 gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">P</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">PostSpark</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 sm:px-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90 text-sm sm:text-base whitespace-nowrap"
            >
              + Add Post
            </button>
            <Link
              href="/dashboard"
              className="p-2 text-gray-400 hover:text-white"
              title="Back to Dashboard"
            >
              ↪
            </Link>
          </div>
        </div>

        {/* Tab Navigation — same as Dashboard */}
        <div className="flex gap-4 sm:gap-6 mb-6 border-b border-white/10 overflow-x-auto scrollbar-none">
          <Link
            href="/dashboard"
            className="pb-3 font-medium text-gray-500 hover:text-gray-300 transition-all whitespace-nowrap text-sm sm:text-base"
          >
            Ideas
          </Link>
          <Link
            href="/dashboard"
            className="pb-3 font-medium text-gray-500 hover:text-gray-300 transition-all whitespace-nowrap text-sm sm:text-base"
          >
            Posted
          </Link>
          <span className="pb-3 font-medium text-white border-b-2 border-blue-400 whitespace-nowrap text-sm sm:text-base">
            📈 My Posts
          </span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        {/* Published Posts */}
        <section className="mb-10">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
            Published ({publishedPosts.length})
          </p>

          {publishedPosts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
              <p className="text-gray-500 text-sm">No published posts yet.</p>
              <p className="text-gray-600 text-xs mt-1">Mark posts as published from Dashboard, or add manually.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {publishedPosts.map((post) => {
                const status = getPostStatus(post);
                return (
                  <div key={post.id} className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 hover:bg-white/8 hover:border-white/20 transition">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                          <span className="text-gray-600 text-xs hidden sm:inline">·</span>
                          <span className="text-gray-500 text-xs">{post.published_at ? formatDate(post.published_at) : ""}</span>
                        </div>
                        {post.idea_title && <p className="text-white font-medium text-sm mb-1 line-clamp-1">{post.idea_title}</p>}
                        <p className="text-gray-400 text-sm line-clamp-2">{post.post_content}</p>
                        {post.linkedin_url && (
                          <a href={post.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline mt-1 inline-block">
                            View on LinkedIn ↗
                          </a>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex gap-3 sm:gap-4 text-sm">
                          {[
                            { val: post.views, label: "views" },
                            { val: post.likes, label: "likes" },
                            { val: post.comments, label: "cmts" },
                          ].map(({ val, label }) => (
                            <div key={label} className="text-center">
                              <p className="text-white font-semibold leading-none">{val > 0 ? val.toLocaleString() : "—"}</p>
                              <p className="text-gray-500 text-xs mt-0.5">{label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1.5 sm:gap-2">
                          <button
                            onClick={() => loadHistory(post)}
                            className="text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-2 sm:px-3 py-1.5 rounded-lg transition"
                          >
                            📈
                          </button>
                          <button
                            onClick={() => { setStatsPost(post); setStatsViews(String(post.views || "")); setStatsLikes(String(post.likes || "")); setStatsComments(String(post.comments || "")); }}
                            className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 px-2 sm:px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Drafts */}
        {draftPosts.length > 0 && (
          <section>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Drafts ({draftPosts.length})</p>
            <div className="space-y-2">
              {draftPosts.map((post) => (
                <div key={post.id} className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {post.idea_title && <p className="text-gray-300 text-sm font-medium truncate">{post.idea_title}</p>}
                    <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{post.post_content}</p>
                  </div>
                  <Link href="/dashboard" className="text-xs text-gray-500 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition shrink-0">
                    Open →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Update Stats Modal */}
      {statsPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-1">Update Stats</h3>
            <p className="text-gray-400 text-sm mb-5 line-clamp-1">{statsPost.idea_title || statsPost.post_content.slice(0, 60)}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Views *</label>
                <input type="number" value={statsViews} onChange={(e) => setStatsViews(e.target.value)} placeholder="e.g. 1200" className={inputCls} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Likes</label>
                  <input type="number" value={statsLikes} onChange={(e) => setStatsLikes(e.target.value)} placeholder="0" className={inputCls} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Comments</label>
                  <input type="number" value={statsComments} onChange={(e) => setStatsComments(e.target.value)} placeholder="0" className={inputCls} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setStatsPost(null)} className={`flex-1 ${btnSecondary}`}>Cancel</button>
              <button onClick={handleUpdateStats} disabled={savingStats || !statsViews} className={`flex-1 ${btnPrimary}`}>
                {savingStats ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Post Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-semibold mb-1">Add Published Post</h3>
            <p className="text-gray-400 text-sm mb-5">For posts written outside PostSpark</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Title / topic (optional)</label>
                <input type="text" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} placeholder="e.g. How I got 10k followers" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Post text *</label>
                <textarea value={addContent} onChange={(e) => setAddContent(e.target.value)} placeholder="Paste your post text here..." rows={4} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">LinkedIn URL (optional)</label>
                <input type="url" value={addUrl} onChange={(e) => setAddUrl(e.target.value)} placeholder="https://linkedin.com/posts/..." className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Publication date</label>
                <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Current stats</label>
                <div className="flex gap-2">
                  <input type="number" value={addViews} onChange={(e) => setAddViews(e.target.value)} placeholder="Views" className={inputCls} />
                  <input type="number" value={addLikes} onChange={(e) => setAddLikes(e.target.value)} placeholder="Likes" className={inputCls} />
                  <input type="number" value={addComments} onChange={(e) => setAddComments(e.target.value)} placeholder="Cmts" className={inputCls} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className={`flex-1 ${btnSecondary}`}>Cancel</button>
              <button onClick={handleAddPost} disabled={addingPost || !addContent.trim()} className={`flex-1 ${btnPrimary}`}>
                {addingPost ? "Adding..." : "Add Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-1">Views History</h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-1">{historyPost.idea_title || historyPost.post_content.slice(0, 60)}</p>
            {loadingHistory ? (
              <p className="text-gray-500 text-sm text-center py-4">Loading...</p>
            ) : (
              <MiniChart history={history} />
            )}
            {history.length > 0 && (
              <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
                {[...history].reverse().map((h, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-400">
                    <span>{formatDate(h.recorded_at)}</span>
                    <span className="text-white">{h.views.toLocaleString()} views</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setHistoryPost(null)} className={`mt-5 w-full ${btnSecondary}`}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
