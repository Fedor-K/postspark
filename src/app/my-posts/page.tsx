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

function getPostStatus(post: Post): { emoji: string; label: string; color: string } {
  if (!post.published_at || !post.stats_updated_at) {
    return { emoji: "⚪", label: "No data", color: "text-gray-400" };
  }
  // We'd need history to know trend; use stats_updated_at freshness as proxy
  const updatedAt = new Date(post.stats_updated_at);
  const publishedAt = new Date(post.published_at);
  const daysSincePublish = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate < 1 && daysSincePublish < 7) {
    return { emoji: "🟢", label: "Active", color: "text-green-400" };
  } else if (daysSincePublish < 3) {
    return { emoji: "🟢", label: "Growing", color: "text-green-400" };
  } else if (daysSincePublish < 14) {
    return { emoji: "🟡", label: "Plateau", color: "text-yellow-400" };
  }
  return { emoji: "🔴", label: "Faded", color: "text-red-400" };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MiniChart({ history }: { history: StatsHistory[] }) {
  if (history.length < 2) {
    return (
      <p className="text-xs text-gray-500 mt-2">
        {history.length === 0 ? "No history yet" : "Update again tomorrow to see trend"}
      </p>
    );
  }

  const max = Math.max(...history.map((h) => h.views));

  return (
    <div className="mt-3">
      <p className="text-xs text-gray-500 mb-1">Views over time</p>
      <div className="flex items-end gap-1 h-10">
        {history.map((h, i) => {
          const height = max > 0 ? Math.max(4, Math.round((h.views / max) * 40)) : 4;
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
              <div
                className="w-full bg-indigo-500 rounded-sm"
                style={{ height: `${height}px` }}
                title={`${h.views.toLocaleString()} views — ${formatDate(h.recorded_at)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-0.5">
        <span>{formatDate(history[0].recorded_at)}</span>
        <span>{formatDate(history[history.length - 1].recorded_at)}</span>
      </div>
    </div>
  );
}

export default function MyPostsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Stats modal
  const [statsPost, setStatsPost] = useState<Post | null>(null);
  const [statsViews, setStatsViews] = useState("");
  const [statsLikes, setStatsLikes] = useState("");
  const [statsComments, setStatsComments] = useState("");
  const [savingStats, setSavingStats] = useState(false);

  // Add post modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addContent, setAddContent] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addDate, setAddDate] = useState(new Date().toISOString().slice(0, 10));
  const [addViews, setAddViews] = useState("");
  const [addLikes, setAddLikes] = useState("");
  const [addComments, setAddComments] = useState("");
  const [addingPost, setAddingPost] = useState(false);

  // History panel
  const [historyPost, setHistoryPost] = useState<Post | null>(null);
  const [history, setHistory] = useState<StatsHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchPosts = useCallback(async (userEmail: string) => {
    try {
      const res = await fetch(`/api/posts/list?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (res.ok) setPosts(data.posts || []);
      else setError(data.error || "Failed to load posts");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const result = await res.json();
        if (!res.ok || !result.user) {
          router.push("/login");
          return;
        }
        setEmail(result.user.email);
        fetchPosts(result.user.email);
      } catch {
        router.push("/login");
      }
    };
    checkSession();
  }, [router, fetchPosts]);

  const handleUpdateStats = async () => {
    if (!statsPost || !email) return;
    setSavingStats(true);
    try {
      const res = await fetch("/api/posts/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          post_id: statsPost.id,
          views: Number(statsViews),
          likes: Number(statsLikes || 0),
          comments: Number(statsComments || 0),
        }),
      });
      if (res.ok) {
        setStatsPost(null);
        fetchPosts(email);
      }
    } catch {
      // ignore
    } finally {
      setSavingStats(false);
    }
  };

  const handleAddPost = async () => {
    if (!email || !addContent.trim()) return;
    setAddingPost(true);
    try {
      const res = await fetch("/api/posts/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          post_content: addContent,
          idea_title: addTitle || null,
          linkedin_url: addUrl || null,
          published_at: addDate,
          views: Number(addViews || 0),
          likes: Number(addLikes || 0),
          comments: Number(addComments || 0),
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddContent("");
        setAddTitle("");
        setAddUrl("");
        setAddViews("");
        setAddLikes("");
        setAddComments("");
        fetchPosts(email);
      }
    } catch {
      // ignore
    } finally {
      setAddingPost(false);
    }
  };

  const loadHistory = async (post: Post) => {
    if (!email) return;
    setHistoryPost(post);
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/posts/stats?post_id=${post.id}&email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (res.ok) setHistory(data.history || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const publishedPosts = posts.filter((p) => p.published_at);
  const draftPosts = posts.filter((p) => !p.published_at);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold">My Posts</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          + Add Post
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Published Posts */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Published ({publishedPosts.length})
          </h2>

          {publishedPosts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
              <p className="text-gray-500 text-sm">No published posts yet.</p>
              <p className="text-gray-600 text-xs mt-1">
                Mark a post as published from Dashboard, or add one manually.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {publishedPosts.map((post) => {
                const status = getPostStatus(post);
                return (
                  <div
                    key={post.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${status.color}`}>
                            {status.emoji} {status.label}
                          </span>
                          <span className="text-gray-600 text-xs">·</span>
                          <span className="text-gray-500 text-xs">
                            {post.published_at ? formatDate(post.published_at) : ""}
                          </span>
                        </div>

                        {post.idea_title && (
                          <p className="text-white font-medium text-sm mb-1 truncate">
                            {post.idea_title}
                          </p>
                        )}
                        <p className="text-gray-400 text-sm line-clamp-2">{post.post_content}</p>

                        {post.linkedin_url && (
                          <a
                            href={post.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 text-xs hover:underline mt-1 inline-block"
                          >
                            View on LinkedIn ↗
                          </a>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-white font-semibold">
                              {post.views > 0 ? post.views.toLocaleString() : "—"}
                            </p>
                            <p className="text-gray-500 text-xs">views</p>
                          </div>
                          <div className="text-center">
                            <p className="text-white font-semibold">
                              {post.likes > 0 ? post.likes.toLocaleString() : "—"}
                            </p>
                            <p className="text-gray-500 text-xs">likes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-white font-semibold">
                              {post.comments > 0 ? post.comments.toLocaleString() : "—"}
                            </p>
                            <p className="text-gray-500 text-xs">comments</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadHistory(post)}
                            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition"
                          >
                            📈 History
                          </button>
                          <button
                            onClick={() => {
                              setStatsPost(post);
                              setStatsViews(String(post.views || ""));
                              setStatsLikes(String(post.likes || ""));
                              setStatsComments(String(post.comments || ""));
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800 hover:border-indigo-600 px-3 py-1.5 rounded-lg transition"
                          >
                            Update stats
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
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
              Saved drafts ({draftPosts.length})
            </h2>
            <div className="space-y-3">
              {draftPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    {post.idea_title && (
                      <p className="text-gray-300 text-sm font-medium truncate">{post.idea_title}</p>
                    )}
                    <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{post.post_content}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-xs text-gray-500 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition shrink-0"
                  >
                    Open in Dashboard
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Update Stats Modal */}
      {statsPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-1">Update Stats</h3>
            <p className="text-gray-400 text-sm mb-5 truncate">
              {statsPost.idea_title || statsPost.post_content.slice(0, 60)}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Views *</label>
                <input
                  type="number"
                  value={statsViews}
                  onChange={(e) => setStatsViews(e.target.value)}
                  placeholder="e.g. 1200"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Likes</label>
                  <input
                    type="number"
                    value={statsLikes}
                    onChange={(e) => setStatsLikes(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Comments</label>
                  <input
                    type="number"
                    value={statsComments}
                    onChange={(e) => setStatsComments(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setStatsPost(null)}
                className="flex-1 border border-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStats}
                disabled={savingStats || !statsViews}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                {savingStats ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Post Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-semibold mb-1">Add Published Post</h3>
            <p className="text-gray-400 text-sm mb-5">
              For posts written outside PostSpark
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Post title / topic (optional)</label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="e.g. How I got 10k followers"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Post text *</label>
                <textarea
                  value={addContent}
                  onChange={(e) => setAddContent(e.target.value)}
                  placeholder="Paste your post text here..."
                  rows={5}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">LinkedIn URL (optional)</label>
                <input
                  type="url"
                  value={addUrl}
                  onChange={(e) => setAddUrl(e.target.value)}
                  placeholder="https://linkedin.com/posts/..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Publication date</label>
                <input
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Current stats</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={addViews}
                    onChange={(e) => setAddViews(e.target.value)}
                    placeholder="Views"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    value={addLikes}
                    onChange={(e) => setAddLikes(e.target.value)}
                    placeholder="Likes"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    value={addComments}
                    onChange={(e) => setAddComments(e.target.value)}
                    placeholder="Comments"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 border border-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPost}
                disabled={addingPost || !addContent.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                {addingPost ? "Adding..." : "Add Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Panel */}
      {historyPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-1">Views History</h3>
            <p className="text-gray-400 text-sm mb-4 truncate">
              {historyPost.idea_title || historyPost.post_content.slice(0, 60)}
            </p>

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

            <button
              onClick={() => setHistoryPost(null)}
              className="mt-5 w-full border border-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
