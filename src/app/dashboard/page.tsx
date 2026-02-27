"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CharacterCounter from "../../components/CharacterCounter";
import LinkedInPreview from "../../components/LinkedInPreview";
import TwitterPreview from "../../components/TwitterPreview";
import PlatformSelector from "../../components/PlatformSelector";
import HooksLibrary from "../../components/HooksLibrary";
import CTAsLibrary from "../../components/CTAsLibrary";
import TextFormatter from "../../components/TextFormatter";
import { Platform } from "@/types";
import { PLATFORM_CONFIGS, STORAGE_KEYS } from "@/lib/constants";

interface SavedPost {
  id: number;
  idea_title: string;
  post_content: string;
  tone: string;
  platform: Platform;
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
  platform?: string;
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
  twitterHandle: string | null;
  twitterAccountsToCopy: string | null;
  twitterPremium: boolean;
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

interface AnalyzedAccount {
  handle: string;
  name: string;
  bio: string;
  tweets: { text: string; likes: number; retweets: number }[];
  styleAnalysis: {
    avgLength: number;
    usesEmojis: boolean;
    usesHashtags: boolean;
    commonPatterns: string[];
    tone: string;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  // Platform state
  const [platform, setPlatform] = useState<Platform>('linkedin');

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

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTwitterAccounts, setSettingsTwitterAccounts] = useState("");
  const [settingsTwitterPremium, setSettingsTwitterPremium] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [analyzingAccounts, setAnalyzingAccounts] = useState(false);
  const [analyzedAccounts, setAnalyzedAccounts] = useState<AnalyzedAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [analyzeError, setAnalyzeError] = useState("");

  useEffect(() => {
    checkSession();
    // Load platform from localStorage
    const savedPlatform = localStorage.getItem(STORAGE_KEYS.PLATFORM) as Platform;
    if (savedPlatform && (savedPlatform === 'linkedin' || savedPlatform === 'twitter')) {
      setPlatform(savedPlatform);
    }
  }, []);

  // Save platform to localStorage when it changes
  const handlePlatformChange = (newPlatform: Platform) => {
    setPlatform(newPlatform);
    localStorage.setItem(STORAGE_KEYS.PLATFORM, newPlatform);
    // Clear generated posts when switching platforms
    setGeneratedPosts({});
    setSelectedTone({});
    setEditedContent({});
    // Load ideas for the new platform
    if (data?.generations && data.generations.length > 0) {
      const platformGen = data.generations.find((g: Generation) => g.platform === newPlatform)
        || data.generations[0];
      if (platformGen.ideas && platformGen.ideas.length > 0) {
        setCurrentIdeas(platformGen.ideas);
      } else {
        setCurrentIdeas([]);
      }
    }
  };

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

      // Load latest generation ideas for current platform
      if (result.generations && result.generations.length > 0) {
        const savedPlatform = localStorage.getItem(STORAGE_KEYS.PLATFORM) as Platform || 'linkedin';
        const platformGen = result.generations.find((g: Generation) => g.platform === savedPlatform)
          || result.generations[0];
        if (platformGen.ideas && platformGen.ideas.length > 0) {
          setCurrentIdeas(platformGen.ideas);
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
    setEditedContent({});

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
          twitterHandle: data.user.twitterHandle,
          twitterPremium: data.user.twitterPremium,
          emailFrequency: data.user.emailFrequency,
          emailDays: data.user.emailDays,
          emailTime: data.user.emailTime,
          timezone: data.user.timezone,
          platform: platform,
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
          profile: {
            name: data.user.linkedinName,
            headline: data.user.linkedinHeadline,
            twitterHandle: data.user.twitterHandle,
          },
          userType: data.user.userType,
          niche: data.user.niche,
          targetAudience: data.user.targetAudience,
          platform: platform,
          twitterAccountsToCopy: data.user.twitterAccountsToCopy,
          twitterPremium: data.user.twitterPremium,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setGeneratedPosts(prev => ({ ...prev, [index]: result.posts }));
      // Set default tone based on platform
      const defaultTone = platform === 'twitter' ? 'punchy' : 'professional';
      setSelectedTone(prev => ({ ...prev, [index]: defaultTone }));
      setEditedContent(prev => ({ ...prev, [index]: result.posts[defaultTone] }));
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
        body: JSON.stringify({ email: data.user.email, content, tone, title, platform }),
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

  const openSettings = () => {
    setSettingsTwitterAccounts(data?.user.twitterAccountsToCopy || "");
    setSettingsTwitterPremium(data?.user.twitterPremium ?? false);
    setAnalyzedAccounts([]);
    setSelectedAccounts([]);
    setAnalyzeError("");
    setShowSettings(true);
  };

  const analyzeTwitterAccounts = async () => {
    if (!settingsTwitterAccounts.trim()) return;

    setAnalyzingAccounts(true);
    setAnalyzeError("");

    const handles = settingsTwitterAccounts
      .split(/[,\s]+/)
      .map(h => h.trim().replace('@', ''))
      .filter(Boolean)
      .slice(0, 5);

    try {
      const res = await fetch("/api/twitter/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to analyze");
      }

      setAnalyzedAccounts(result.accounts || []);
      // Select all by default
      setSelectedAccounts(result.accounts?.map((a: AnalyzedAccount) => a.handle) || []);

      if (result.errors?.length > 0) {
        setAnalyzeError(result.errors.join(", "));
      }
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : "Failed to analyze accounts");
    } finally {
      setAnalyzingAccounts(false);
    }
  };

  const toggleAccountSelection = (handle: string) => {
    setSelectedAccounts(prev =>
      prev.includes(handle)
        ? prev.filter(h => h !== handle)
        : [...prev, handle]
    );
  };

  const saveSettings = async () => {
    if (!data) return;
    setSavingSettings(true);

    // Save only selected accounts
    const accountsToSave = selectedAccounts.length > 0
      ? selectedAccounts.map(h => `@${h}`).join(", ")
      : settingsTwitterAccounts;

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.user.email,
          twitterAccountsToCopy: accountsToSave,
          twitterPremium: settingsTwitterPremium,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setShowSettings(false);
      fetchDashboard(data.user.email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
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
          <div className="flex items-center gap-3">
            <PlatformSelector platform={platform} onChange={handlePlatformChange} />
            <button
              onClick={generateNewIdeas}
              disabled={generating}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {generating ? "..." : "+ Generate"}
            </button>
            <button
              onClick={openSettings}
              className="px-3 py-2 text-gray-400 hover:text-white"
            >
              ⚙️
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
                        {PLATFORM_CONFIGS[platform].tones.map((toneConfig) => (
                          <button
                            key={toneConfig.id}
                            onClick={() => {
                              setSelectedTone(prev => ({ ...prev, [index]: toneConfig.id }));
                              setEditedContent(prev => ({ ...prev, [index]: generatedPosts[index][toneConfig.id as keyof PostVersions] }));
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectedTone[index] === toneConfig.id ? "bg-blue-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                            title={toneConfig.description}
                          >
                            {toneConfig.label}
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
                      <CharacterCounter text={getCurrentContent(index)} platform={platform} />

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

                      {/* Platform Preview */}
                      {showPreview === index && (
                        <div className="p-4 bg-slate-800 rounded-lg">
                          {platform === 'twitter' ? (
                            <TwitterPreview
                              content={getCurrentContent(index)}
                              authorName={data?.user.linkedinName || "Your Name"}
                              authorHandle={data?.user.twitterHandle || undefined}
                            />
                          ) : (
                            <LinkedInPreview
                              content={getCurrentContent(index)}
                              authorName={data?.user.linkedinName || "Your Name"}
                              authorHeadline={data?.user.linkedinHeadline || undefined}
                            />
                          )}
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Style Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Input + Analyze */}
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Twitter accounts to copy style from
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settingsTwitterAccounts}
                      onChange={(e) => setSettingsTwitterAccounts(e.target.value)}
                      placeholder="@levelsio, @marc_louvion, @shl"
                      className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={analyzeTwitterAccounts}
                      disabled={analyzingAccounts || !settingsTwitterAccounts.trim()}
                      className="px-6 py-3 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {analyzingAccounts ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Analyzing...
                        </span>
                      ) : "🔍 Analyze"}
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Enter up to 5 accounts, separated by commas</p>
                </div>

                {/* Error */}
                {analyzeError && (
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-red-300 text-sm">{analyzeError}</p>
                  </div>
                )}

                {/* Analyzed Accounts */}
                {analyzedAccounts.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-white text-sm font-medium">Select accounts to use:</p>
                    {analyzedAccounts.map((account) => (
                      <div
                        key={account.handle}
                        onClick={() => toggleAccountSelection(account.handle)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAccounts.includes(account.handle)
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-1 ${
                            selectedAccounts.includes(account.handle)
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-500"
                          }`}>
                            {selectedAccounts.includes(account.handle) && (
                              <span className="text-white text-xs">✓</span>
                            )}
                          </div>

                          {/* Account Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-semibold">{account.name}</span>
                              <span className="text-gray-400 text-sm">@{account.handle}</span>
                            </div>

                            {/* Style Analysis */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                {account.styleAnalysis.tone}
                              </span>
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                ~{account.styleAnalysis.avgLength} chars
                              </span>
                              {account.styleAnalysis.usesEmojis && (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                                  Uses emojis
                                </span>
                              )}
                              {account.styleAnalysis.usesHashtags && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                                  Uses hashtags
                                </span>
                              )}
                            </div>

                            {/* Patterns */}
                            {account.styleAnalysis.commonPatterns.length > 0 && (
                              <div className="text-gray-400 text-xs mb-3">
                                Patterns: {account.styleAnalysis.commonPatterns.join(", ")}
                              </div>
                            )}

                            {/* Top Tweet Preview */}
                            {account.tweets.length > 0 && (
                              <div className="p-3 bg-black/30 rounded-lg">
                                <p className="text-gray-300 text-xs mb-1">Top tweet:</p>
                                <p className="text-white text-sm line-clamp-3">
                                  {account.tweets[0].text.slice(0, 200)}{account.tweets[0].text.length > 200 ? "..." : ""}
                                </p>
                                <div className="flex gap-3 mt-2 text-gray-500 text-xs">
                                  <span>❤️ {account.tweets[0].likes}</span>
                                  <span>🔄 {account.tweets[0].retweets}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tip when no accounts analyzed */}
                {analyzedAccounts.length === 0 && (
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-blue-300 text-sm">💡 Enter Twitter handles and click "Analyze" to see their writing style. Then select which styles to copy.</p>
                  </div>
                )}

                {/* Twitter Premium toggle */}
                <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                  <input
                    type="checkbox"
                    checked={settingsTwitterPremium}
                    onChange={(e) => setSettingsTwitterPremium(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-500 text-blue-500 focus:ring-blue-500 bg-white/10"
                  />
                  <div>
                    <span className="text-white text-sm font-medium">Twitter/X Premium</span>
                    <p className="text-gray-500 text-xs mt-0.5">Enable long-form posts (500-1500 chars) instead of 280-char limit</p>
                  </div>
                </label>

                <button
                  onClick={handleResetOnboarding}
                  disabled={resettingOnboarding}
                  className="w-full py-2 text-gray-400 text-sm hover:text-white transition-colors"
                >
                  {resettingOnboarding ? "Loading..." : "Edit full profile →"}
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowSettings(false)} className="flex-1 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20">
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  disabled={savingSettings || (analyzedAccounts.length > 0 && selectedAccounts.length === 0)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {savingSettings ? "Saving..." : selectedAccounts.length > 0 ? `Save ${selectedAccounts.length} account${selectedAccounts.length > 1 ? 's' : ''}` : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-white/10 py-6 text-center text-gray-500 text-sm">
        PostSpark - Content for Solopreneurs & Coaches
      </footer>
    </div>
  );
}
