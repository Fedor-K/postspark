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

interface Idea {
  hook: string;
  title: string;
  description: string;
}

interface Generation {
  id: number;
  createdAt: string;
  ideasCount: number;
  ideas: Idea[];
}

interface User {
  id: number;
  email: string;
  userType: string;
  niche: string;
  targetAudience: string;
  linkedinUrl: string | null;
  linkedinName: string | null;
  linkedinHeadline: string | null;
  emailFrequency: string | null;
  emailDays: string | null;
  emailTime: string | null;
  timezone: string | null;
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

const DAYS_MAP: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

const TIMEZONE_LABELS: Record<string, string> = {
  "America/Los_Angeles": "Los Angeles (PT)", "America/New_York": "New York (ET)",
  "Europe/London": "London (GMT)", "Europe/Paris": "Paris/Berlin (CET)",
  "Europe/Moscow": "Moscow (MSK)", "Asia/Tokyo": "Tokyo (JST)",
};

const NICHES = [
  "Marketing", "Sales", "Tech/Software", "Finance", "HR/Recruiting",
  "Design", "Fitness/Health", "Real Estate", "E-commerce", "Education",
  "Legal", "Consulting", "Coaching", "Other"
];

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [expandedGen, setExpandedGen] = useState<number | null>(null);
  
  // Generate modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genNiche, setGenNiche] = useState("");
  const [genAudience, setGenAudience] = useState("");
  const [generating, setGenerating] = useState(false);
  const [newIdeas, setNewIdeas] = useState<Idea[] | null>(null);

  // Edit post modal state
  const [editingPost, setEditingPost] = useState<SavedPost | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editTone, setEditTone] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      fetchDashboard(result.user.email);
    } catch {
      router.push("/login");
    }
  };

  const fetchDashboard = async (userEmail: string) => {
    try {
      const res = await fetch(`/api/dashboard?email=${encodeURIComponent(userEmail)}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setData(result);
      setGenNiche(result.user.niche || "");
      setGenAudience(result.user.targetAudience || "");
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
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const toggleGeneration = (id: number) => {
    setExpandedGen(expandedGen === id ? null : id);
  };

  const formatDays = (daysStr: string | null) => {
    if (!daysStr) return "Not set";
    return daysStr.split(",").map(d => DAYS_MAP[d.trim()] || d).join(", ");
  };

  const formatTime = (time: string | null) => {
    if (!time) return "Not set";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatTimezone = (tz: string | null) => {
    if (!tz) return "Not set";
    return TIMEZONE_LABELS[tz] || tz.split("/")[1]?.replace("_", " ") || tz;
  };

  const formatFrequency = (freq: string | null) => {
    if (!freq) return "Not set";
    if (freq === "daily") return "Daily";
    if (freq === "twice_weekly") return "2x per week";
    if (freq === "weekly") return "Weekly";
    return freq;
  };

  const openGenerateModal = () => {
    setNewIdeas(null);
    setShowGenerateModal(true);
  };

  const generateNewIdeas = async () => {
    if (!data) return;
    setGenerating(true);
    setNewIdeas(null);
    
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.user.email,
          userType: data.user.userType,
          niche: genNiche || data.user.niche,
          targetAudience: genAudience || data.user.targetAudience,
          linkedinUrl: data.user.linkedinUrl,
          emailFrequency: data.user.emailFrequency,
          emailDays: data.user.emailDays,
          emailTime: data.user.emailTime,
          timezone: data.user.timezone,
        }),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      setNewIdeas(result.topics);
      fetchDashboard(data.user.email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate ideas");
    } finally {
      setGenerating(false);
    }
  };

  const openEditModal = (post: SavedPost) => {
    setEditingPost(post);
    setEditContent(post.post_content);
    setEditTitle(post.idea_title || "");
    setEditTone(post.tone || "professional");
  };

  const closeEditModal = () => {
    setEditingPost(null);
    setEditContent("");
    setEditTitle("");
    setEditTone("");
  };

  const savePost = async () => {
    if (!editingPost || !data) return;
    setSaving(true);
    
    try {
      const res = await fetch("/api/posts/save", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPost.id,
          content: editContent,
          title: editTitle,
          tone: editTone,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      closeEditModal();
      fetchDashboard(data.user.email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async () => {
    if (!editingPost || !data) return;
    if (!confirm("Delete this post?")) return;
    
    setDeleting(true);
    
    try {
      const res = await fetch(`/api/posts/save?id=${editingPost.id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete");
      
      closeEditModal();
      fetchDashboard(data.user.email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setDeleting(false);
    }
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
          <Link href="/" className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg">
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
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold text-white">PostSpark</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={openGenerateModal} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90">
              + New Ideas
            </button>
            <button onClick={handleLogout} disabled={loggingOut} className="px-4 py-2 bg-white/10 text-gray-300 font-medium rounded-lg hover:bg-white/20 disabled:opacity-50">
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
                <h1 className="text-2xl font-bold text-white">{data.user.linkedinName || "Your Dashboard"}</h1>
                <p className="text-gray-400">{data.user.linkedinHeadline || `${data.user.userType} in ${data.user.niche}`}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">{data.user.niche}</span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">{data.user.userType}</span>
                </div>
              </div>
            </div>
          </div>
          {data.user.targetAudience && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-gray-500 text-xs uppercase mb-1">Target Audience</p>
              <p className="text-gray-300 text-sm">{data.user.targetAudience}</p>
            </div>
          )}
        </div>

        {/* Email Schedule Card */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><span>📧</span> Email Reminders</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-gray-500 text-xs uppercase mb-1">Frequency</p><p className="text-white font-medium">{formatFrequency(data.user.emailFrequency)}</p></div>
            <div><p className="text-gray-500 text-xs uppercase mb-1">Days</p><p className="text-white font-medium">{formatDays(data.user.emailDays)}</p></div>
            <div><p className="text-gray-500 text-xs uppercase mb-1">Time</p><p className="text-white font-medium">{formatTime(data.user.emailTime)}</p></div>
            <div><p className="text-gray-500 text-xs uppercase mb-1">Timezone</p><p className="text-white font-medium">{formatTimezone(data.user.timezone)}</p></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 rounded-xl p-5 border border-white/20 text-center">
            <div className="text-3xl font-bold text-white">{data.stats.generationCount}</div>
            <div className="text-gray-400 text-sm">Sessions</div>
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
            <div className="text-3xl font-bold text-orange-400">∞</div>
            <div className="text-gray-400 text-sm">Potential Reach</div>
          </div>
        </div>

        {/* Saved Posts */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Saved Posts ({data.savedPosts.length})</h2>
          {data.savedPosts.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
              <p className="text-gray-400 mb-4">No saved posts yet</p>
              <button onClick={openGenerateModal} className="text-orange-400 hover:text-orange-300">Generate ideas and save your favorite posts →</button>
            </div>
          ) : (
            <div className="space-y-4">
              {data.savedPosts.map((post) => (
                <div key={post.id} className="bg-white/10 rounded-xl p-5 border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">{post.tone}</span>
                      <span className="text-gray-500 text-xs">{formatDate(post.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(post)} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded hover:bg-blue-500/30">Edit</button>
                      <button onClick={() => copyPost(post.id, post.post_content)} className="px-3 py-1 bg-white/10 text-white text-sm rounded hover:bg-white/20">
                        {copied === post.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  {post.idea_title && <p className="text-orange-400 text-sm mb-2 font-medium">{post.idea_title}</p>}
                  <p className="text-gray-300 text-sm whitespace-pre-wrap line-clamp-4">{post.post_content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generation History */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Generation History</h2>
          {data.generations.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center"><p className="text-gray-400">No generations yet</p></div>
          ) : (
            <div className="space-y-3">
              {data.generations.map((gen) => (
                <div key={gen.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button onClick={() => toggleGeneration(gen.id)} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400">💡</div>
                      <div className="text-left">
                        <p className="text-white">{gen.ideasCount} ideas generated</p>
                        <p className="text-gray-500 text-sm">{formatDate(gen.createdAt)}</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-xl">{expandedGen === gen.id ? "−" : "+"}</span>
                  </button>
                  {expandedGen === gen.id && gen.ideas && gen.ideas.length > 0 && (
                    <div className="px-4 pb-4 space-y-3">
                      {gen.ideas.map((idea, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <p className="text-orange-400 font-medium mb-1">{idea.hook || idea.title}</p>
                          <p className="text-gray-400 text-sm">{idea.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Generate New Ideas</h2>
                <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>
              {!newIdeas ? (
                <>
                  <p className="text-gray-400 mb-6">Generate 10 new LinkedIn post ideas based on your profile.</p>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">Niche</label>
                      <select value={genNiche} onChange={(e) => setGenNiche(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                        {NICHES.map(n => <option key={n} value={n} className="bg-slate-800">{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">Target Audience</label>
                      <textarea value={genAudience} onChange={(e) => setGenAudience(e.target.value)} rows={3} placeholder="Who do you help?" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                    </div>
                  </div>
                  <button onClick={generateNewIdeas} disabled={generating} className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
                    {generating ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</span> : "Generate 10 Ideas"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-green-400 mb-4">✓ Generated {newIdeas.length} new ideas!</p>
                  <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                    {newIdeas.map((idea, idx) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-orange-400 font-medium mb-1">{idea.title}</p>
                        <p className="text-gray-400 text-sm">{idea.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setNewIdeas(null)} className="flex-1 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20">Generate More</button>
                    <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90">Done</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Edit Post</h2>
                <button onClick={closeEditModal} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Title (optional)</label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Post title or hook" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Tone</label>
                  <div className="flex gap-2">
                    {["professional", "casual", "storytelling"].map(tone => (
                      <button key={tone} onClick={() => setEditTone(tone)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${editTone === tone ? "bg-orange-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                        {tone === "professional" ? "Pro" : tone === "casual" ? "Casual" : "Story"}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Content</label>
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={12} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-mono text-sm" />
                  <p className="text-gray-500 text-xs mt-1">{editContent.length} characters</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={deletePost} disabled={deleting} className="px-4 py-3 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 disabled:opacity-50">
                  {deleting ? "..." : "Delete"}
                </button>
                <button onClick={closeEditModal} className="flex-1 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20">Cancel</button>
                <button onClick={savePost} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-white/10 py-6 text-center text-gray-500 text-sm">
        PostSpark - LinkedIn Content for Solopreneurs & Coaches
      </footer>
    </div>
  );
}
