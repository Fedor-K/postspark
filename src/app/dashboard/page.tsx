"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CharacterCounter from "../../components/CharacterCounter";
import LinkedInPreview from "../../components/LinkedInPreview";
import HooksLibrary from "../../components/HooksLibrary";
import CTAsLibrary from "../../components/CTAsLibrary";
import TextFormatter from "../../components/TextFormatter";

interface SavedPost {
  id: number;
  idea_title: string;
  post_content: string;
  tone: string;
  created_at: string;
  published_at: string | null;
}

interface Idea {
  hook: string;
  title: string;
  description: string;
  format?: string;
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

interface PostVersions {
  professional: string;
  casual: string;
  storytelling: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  // Active view: 'ideas' or 'published'
  const [activeView, setActiveView] = useState<'ideas' | 'published'>('ideas');

  // Generate state
  const [generating, setGenerating] = useState(false);

  // Current ideas being worked on
  const [currentIdeas, setCurrentIdeas] = useState<Idea[]>([]);

  // Post writing state
  const [writingIndex, setWritingIndex] = useState<number | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<{[key: number]: PostVersions}>({});
  const [selectedTone, setSelectedTone] = useState<{[key: number]: string}>({});
  const [publishedPosts, setPublishedPosts] = useState<{[key: number]: boolean}>({});
  const [editedContent, setEditedContent] = useState<{[key: number]: string}>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showHooks, setShowHooks] = useState<number | null>(null);
  const [showCTAs, setShowCTAs] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState<number | null>(null);

  // Edit modal
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
      if (!result.user.userType || result.user.userType === '') {
        router.push("/onboarding");
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

      // Load latest generation ideas
      if (result.generations && result.generations.length > 0) {
        const latest = result.generations[0];
        if (latest.ideas && latest.ideas.length > 0) {
          setCurrentIdeas(latest.ideas);
        }
      }
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

  const handleResetOnboarding = async () => {
    if (!confirm("Update your profile? Your saved posts and generation history will be kept.")) return;

    setResettingOnboarding(true);
    try {
      const res = await fetch("/api/users/reset-onboarding", { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset");
      router.push("/onboarding");
    } catch {
      setResettingOnboarding(false);
      setError("Failed to reset onboarding");
    }
  };

  const generateNewIdeas = async () => {
    if (!data) return;
    setGenerating(true);
    setGeneratedPosts({});
    setPublishedPosts({});
    setSelectedTone({});

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.user.email,
          userType: data.user.userType,
          niche: data.user.niche,
          targetAudience: data.user.targetAudience,
          linkedinUrl: data.user.linkedinUrl,
          emailFrequency: data.user.emailFrequency,
          emailDays: data.user.emailDays,
          emailTime: data.user.emailTime,
          timezone: data.user.timezone,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setCurrentIdeas(result.topics || []);
      fetchDashboard(data.user.email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate ideas");
    } finally {
      setGenerating(false);
    }
  };

  const writePost = async (index: number, idea: Idea) => {
    if (!data) return;
    setWritingIndex(index);

    try {
      const res = await fetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...idea,
          profile: { name: data.user.linkedinName, headline: data.user.linkedinHeadline },
          userType: data.user.userType,
          niche: data.user.niche,
          targetAudience: data.user.targetAudience,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setGeneratedPosts(prev => ({ ...prev, [index]: result.posts }));
      setSelectedTone(prev => ({ ...prev, [index]: "professional" }));
      setEditedContent(prev => ({ ...prev, [index]: result.posts.professional }));
      setEditingIndex(index);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to write post");
    } finally {
      setWritingIndex(null);
    }
  };

  const copyPost = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const getCurrentContent = (index: number) => {
    return editedContent[index] || generatedPosts[index]?.[selectedTone[index] as keyof PostVersions] || "";
  };

  const handleHookSelect = (index: number, hook: string) => {
    const content = getCurrentContent(index);
    const parts = content.split("\n\n");
    parts[0] = hook;
    setEditedContent(prev => ({ ...prev, [index]: parts.join("\n\n") }));
    setShowHooks(null);
  };

  const handleCTASelect = (index: number, cta: string) => {
    const content = getCurrentContent(index);
    const parts = content.split("\n\n");
    parts[parts.length - 1] = cta;
    setEditedContent(prev => ({ ...prev, [index]: parts.join("\n\n") }));
    setShowCTAs(null);
  };

  const handleFormatText = (index: number, formattedText: string) => {
    setEditedContent(prev => ({ ...prev, [index]: formattedText }));
  };

  const markAsPublished = async (postId: number) => {
    if (!data) return;
    try {
      const res = await fetch("/api/posts/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId }),
      });
      if (!res.ok) throw new Error("Failed to mark as published");
      fetchDashboard(data.user.email);
    } catch (err) {
      console.error("Failed to publish", err);
    }
  };

  const saveAndPublish = async (index: number, content: string, tone: string, title: string) => {
    if (!data) return;
    try {
      // Save the post first
      const saveRes = await fetch("/api/posts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.user.email, content, tone, title }),
      });
      const saveData = await saveRes.json();

      if (!saveRes.ok || !saveData.post?.id) {
        throw new Error("Failed to save post");
      }

      // Mark as published immediately
      const publishRes = await fetch("/api/posts/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: saveData.post.id }),
      });

      if (!publishRes.ok) {
        throw new Error("Failed to mark as published");
      }

      setPublishedPosts(prev => ({ ...prev, [index]: true }));
      fetchDashboard(data.user.email);
    } catch (err) {
      console.error("Failed to save and publish", err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
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

  const updatePost = async () => {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4 text-4xl">!</div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard Not Found</h1>
          <p className="text-gray-400 mb-6">{error || "Unable to load dashboard"}</p>
          <Link href="/" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-lg">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold text-white">PostSpark</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={generateNewIdeas}
              disabled={generating}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {generating ? "..." : "+ Generate"}
            </button>
            <button
              onClick={handleResetOnboarding}
              disabled={resettingOnboarding}
              className="px-3 py-2 text-gray-400 hover:text-white"
            >
              {resettingOnboarding ? "..." : "Edit"}
            </button>
            <button onClick={handleLogout} disabled={loggingOut} className="px-3 py-2 text-gray-400 hover:text-white">
              {loggingOut ? "..." : "Logout"}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveView('ideas')}
            className={`pb-3 font-medium transition-all ${activeView === 'ideas' ? 'text-white border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Ideas
          </button>
          <button
            onClick={() => setActiveView('published')}
            className={`pb-3 font-medium transition-all ${activeView === 'published' ? 'text-white border-b-2 border-green-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Posted
          </button>
        </div>

        {/* Ideas View */}
        {activeView === 'ideas' && (
          <div className="space-y-3">
            {/* Generating indicator */}
            {generating && (
              <div className="flex items-center gap-2 text-gray-400 py-2">
                <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Generating new ideas...
              </div>
            )}

            {/* Ideas List */}
            {currentIdeas.filter((_, i) => !publishedPosts[i]).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{currentIdeas.length === 0 ? "No ideas yet. Click + Generate to start." : "All ideas posted! Generate more."}</p>
              </div>
            ) : (
              currentIdeas.map((idea, index) => !publishedPosts[index] && (
                <div key={index} className="border-b border-white/10 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-white font-medium">{idea.title}</p>
                      <p className="text-gray-500 text-sm mt-1">{idea.description}</p>
                    </div>
                    {!generatedPosts[index] && (
                      <button
                        onClick={() => writePost(index, idea)}
                        disabled={writingIndex === index}
                        className="px-4 py-2 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 shrink-0"
                      >
                        {writingIndex === index ? (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-delay:0.4s]" />
                          </span>
                        ) : "Write"}
                      </button>
                    )}
                  </div>
                  {generatedPosts[index] && (
                    <div className="mt-4 space-y-4">
                      {/* Tone Selector */}
                      <div className="flex gap-2">
                        {(["professional", "casual", "storytelling"] as const).map((tone) => (
                          <button
                            key={tone}
                            onClick={() => {
                              setSelectedTone(prev => ({ ...prev, [index]: tone }));
                              setEditedContent(prev => ({ ...prev, [index]: generatedPosts[index][tone] }));
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectedTone[index] === tone ? "bg-blue-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                          >
                            {tone === "professional" ? "Professional" : tone === "casual" ? "Casual" : "Storytelling"}
                          </button>
                        ))}
                      </div>

                      {/* Text Formatter */}
                      <TextFormatter
                        text={getCurrentContent(index)}
                        onFormat={(formatted) => handleFormatText(index, formatted)}
                      />

                      {/* Post Editor */}
                      <textarea
                        value={getCurrentContent(index)}
                        onChange={(e) => setEditedContent(prev => ({ ...prev, [index]: e.target.value }))}
                        rows={12}
                        className="w-full p-4 bg-white/5 rounded-lg border border-white/20 text-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      {/* Character Counter */}
                      <CharacterCounter text={getCurrentContent(index)} />

                      {/* Tool Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowHooks(showHooks === index ? null : index); setShowCTAs(null); setShowPreview(null); }}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showHooks === index ? "bg-blue-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                        >
                          🪝 Hooks
                        </button>
                        <button
                          onClick={() => { setShowCTAs(showCTAs === index ? null : index); setShowHooks(null); setShowPreview(null); }}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showCTAs === index ? "bg-cyan-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                        >
                          🎯 CTAs
                        </button>
                        <button
                          onClick={() => { setShowPreview(showPreview === index ? null : index); setShowHooks(null); setShowCTAs(null); }}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showPreview === index ? "bg-purple-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                        >
                          👁️ Preview
                        </button>
                      </div>

                      {/* Hooks Library */}
                      {showHooks === index && (
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <HooksLibrary onSelect={(hook) => handleHookSelect(index, hook)} userNiche={data?.user.userType || ""} />
                        </div>
                      )}

                      {/* CTAs Library */}
                      {showCTAs === index && (
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <CTAsLibrary onSelect={(cta) => handleCTASelect(index, cta)} />
                        </div>
                      )}

                      {/* LinkedIn Preview */}
                      {showPreview === index && (
                        <div className="p-4 bg-slate-800 rounded-lg">
                          <LinkedInPreview
                            content={getCurrentContent(index)}
                            authorName={data?.user.linkedinName || "Your Name"}
                            authorHeadline={data?.user.linkedinHeadline || undefined}
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyPost(`idea-${index}`, getCurrentContent(index))}
                          className="flex-1 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20"
                        >
                          {copied === `idea-${index}` ? "Copied!" : "Copy"}
                        </button>
                        <button
                          onClick={() => saveAndPublish(index, getCurrentContent(index), selectedTone[index], idea.title)}
                          disabled={publishedPosts[index]}
                          className="flex-1 py-2.5 bg-green-500/20 text-green-300 font-medium rounded-lg hover:bg-green-500/30 disabled:opacity-50"
                        >
                          {publishedPosts[index] ? "Posted!" : "Posted"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Published Posts View */}
        {activeView === 'published' && (
          <div className="space-y-3">
            {data.savedPosts.filter(p => p.published_at).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No published posts yet</p>
              </div>
            ) : (
              data.savedPosts.filter(p => p.published_at).map((post) => (
                <div key={post.id} className="border-b border-white/10 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">{formatDate(post.published_at!)}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyPost(`published-${post.id}`, post.post_content)} className="px-3 py-1 bg-white/10 text-white text-sm rounded hover:bg-white/20">
                        {copied === `published-${post.id}` ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  {post.idea_title && <p className="text-white font-medium mb-1">{post.idea_title}</p>}
                  <p className="text-gray-500 text-sm line-clamp-2">{post.post_content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Edit Post</h2>
                <button onClick={closeEditModal} className="text-gray-400 hover:text-white text-2xl">x</button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Title (optional)</label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Post title or hook" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Tone</label>
                  <div className="flex gap-2">
                    {["professional", "casual", "storytelling"].map(tone => (
                      <button key={tone} onClick={() => setEditTone(tone)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${editTone === tone ? "bg-blue-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                        {tone === "professional" ? "Pro" : tone === "casual" ? "Casual" : "Story"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Content</label>
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={12} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm" />
                  <p className="text-gray-500 text-xs mt-1">{editContent.length} characters</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={deletePost} disabled={deleting} className="px-4 py-3 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 disabled:opacity-50">
                  {deleting ? "..." : "Delete"}
                </button>
                <button onClick={closeEditModal} className="flex-1 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20">Cancel</button>
                <button onClick={updatePost} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
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
