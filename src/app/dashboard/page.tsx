"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RawInputForm from "../../components/RawInputForm";
import RawInputsList from "../../components/RawInputsList";
import TopicsList from "../../components/TopicsList";
import ProfileEditor from "../../components/ProfileEditor";
import LinkedInPreview from "../../components/LinkedInPreview";
import CharacterCounter from "../../components/CharacterCounter";
import { PLATFORM_CONFIGS } from "@/lib/constants";

// Types
interface RawInput {
  id: number;
  type: "insight" | "client_talk" | "free";
  content: Record<string, string>;
  used: boolean;
  created_at: string;
}

interface Topic {
  id: number;
  title: string;
  hook: string;
  angle: string;
  format: "story" | "lesson" | "rant" | "case" | "list";
  status: "new" | "saved" | "written" | "archived";
  raw_input_ids: number[];
  created_at: string;
}

interface Profile {
  id: number;
  email: string;
  name: string;
  role: string;
  niche: string;
  audience_who: string;
  audience_pains: string[];
  topics: string[];
  voice_style: "professional" | "casual" | "provocative";
  examples_good: string[];
  completion: {
    percent: number;
    missing: string[];
  };
}

interface User {
  id: number;
  email: string;
  userType: string;
  linkedinName: string | null;
  linkedinHeadline: string | null;
}

type TabType = "raw" | "topics" | "written";

export default function DashboardMVP() {
  const router = useRouter();

  // Auth & user
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data
  const [rawInputs, setRawInputs] = useState<RawInput[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>("raw");
  const [showRawInputForm, setShowRawInputForm] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [writingTopicId, setWritingTopicId] = useState<number | null>(null);

  // Post writing
  const [currentPost, setCurrentPost] = useState<{
    topic: Topic;
    content: string;
    tone: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Initial load
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

      if (!result.user.userType || result.user.userType === "") {
        router.push("/onboarding");
        return;
      }

      setUser(result.user);
      await Promise.all([
        fetchRawInputs(result.user.email),
        fetchTopics(result.user.email),
        fetchProfile(result.user.email),
      ]);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  // Fetch functions
  const fetchRawInputs = async (email: string) => {
    try {
      const res = await fetch(`/api/raw-inputs?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok) setRawInputs(data.rawInputs || []);
    } catch (err) {
      console.error("Failed to fetch raw inputs:", err);
    }
  };

  const fetchTopics = async (email: string) => {
    try {
      const res = await fetch(`/api/topics?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok) setTopics(data.topics || []);
    } catch (err) {
      console.error("Failed to fetch topics:", err);
    }
  };

  const fetchProfile = async (email: string) => {
    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok) setProfile(data.profile);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  // Actions
  const handleAddRawInput = async (
    type: "insight" | "client_talk" | "free",
    content: Record<string, string>
  ) => {
    if (!user) return;

    const res = await fetch("/api/raw-inputs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, type, content }),
    });

    if (res.ok) {
      await fetchRawInputs(user.email);
    } else {
      throw new Error("Failed to add raw input");
    }
  };

  const handleDeleteRawInput = async (id: number) => {
    if (!user) return;

    const res = await fetch(`/api/raw-inputs?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setRawInputs((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleGenerateTopics = async () => {
    if (!user) return;

    setGeneratingTopics(true);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, count: 5 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate topics");
        return;
      }

      await Promise.all([fetchRawInputs(user.email), fetchTopics(user.email)]);
      setActiveTab("topics");
    } catch (err) {
      setError("Failed to generate topics");
      console.error(err);
    } finally {
      setGeneratingTopics(false);
    }
  };

  const handleWriteTopic = async (topic: Topic) => {
    if (!user || !profile) return;

    setWritingTopicId(topic.id);

    try {
      const res = await fetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topic.title,
          description: topic.angle,
          format: topic.format,
          profile: {
            name: user.linkedinName || profile.name,
            headline: user.linkedinHeadline,
          },
          userType: profile.role,
          niche: profile.niche,
          targetAudience: profile.audience_who,
          platform: "linkedin",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to write post");
        return;
      }

      setCurrentPost({
        topic,
        content: data.posts.professional,
        tone: "professional",
      });
    } catch (err) {
      setError("Failed to write post");
      console.error(err);
    } finally {
      setWritingTopicId(null);
    }
  };

  const handleSaveTopic = async (id: number) => {
    const res = await fetch("/api/topics", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "saved" }),
    });

    if (res.ok) {
      setTopics((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "saved" as const } : t))
      );
    }
  };

  const handleArchiveTopic = async (id: number) => {
    const res = await fetch("/api/topics", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "archived" }),
    });

    if (res.ok) {
      setTopics((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleSaveProfile = async (newProfile: {
    audience_pains: string[];
    topics: string[];
    voice_style: "professional" | "casual" | "provocative";
    examples_good: string[];
  }) => {
    if (!user) return;

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, ...newProfile }),
    });

    if (res.ok) {
      await fetchProfile(user.email);
    } else {
      throw new Error("Failed to save profile");
    }
  };

  const handleCopyPost = () => {
    if (!currentPost) return;
    navigator.clipboard.writeText(currentPost.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkAsPosted = async () => {
    if (!user || !currentPost) return;

    // Save post
    const saveRes = await fetch("/api/posts/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        content: currentPost.content,
        tone: currentPost.tone,
        title: currentPost.topic.title,
        platform: "linkedin",
      }),
    });

    const saveData = await saveRes.json();

    if (saveRes.ok && saveData.post?.id) {
      // Mark as published
      await fetch("/api/posts/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: saveData.post.id }),
      });

      // Update topic status
      await fetch("/api/topics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentPost.topic.id,
          status: "written",
          post_id: saveData.post.id,
        }),
      });

      setTopics((prev) => prev.filter((t) => t.id !== currentPost.topic.id));
      setCurrentPost(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // Counts
  const unusedRawCount = rawInputs.filter((r) => !r.used).length;
  const newTopicsCount = topics.filter((t) => t.status === "new").length;

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold text-white">PostSpark</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Profile completion */}
            {profile && profile.completion.percent < 100 && (
              <button
                onClick={() => setShowProfileEditor(true)}
                className="px-3 py-1.5 bg-yellow-500/20 text-yellow-300 text-sm rounded-lg hover:bg-yellow-500/30"
              >
                Профиль {profile.completion.percent}%
              </button>
            )}

            <button
              onClick={() => setShowProfileEditor(true)}
              className="p-2 text-gray-400 hover:text-white"
              title="Настройки профиля"
            >
              ⚙️
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 text-gray-400 hover:text-white text-sm"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-300">{error}</p>
            <button onClick={() => setError("")} className="text-red-400 text-sm mt-1">
              Закрыть
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("raw")}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === "raw"
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Сырьё {unusedRawCount > 0 && `(${unusedRawCount})`}
          </button>
          <button
            onClick={() => setActiveTab("topics")}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === "topics"
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Темы {newTopicsCount > 0 && `(${newTopicsCount})`}
          </button>
        </div>

        {/* Content */}
        {activeTab === "raw" && (
          <div>
            {/* Add button */}
            <button
              onClick={() => setShowRawInputForm(true)}
              className="w-full mb-4 py-3 bg-white/5 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 transition-all"
            >
              + Добавить мысль
            </button>

            <RawInputsList
              rawInputs={rawInputs}
              onDelete={handleDeleteRawInput}
              onGenerateTopics={handleGenerateTopics}
              generating={generatingTopics}
            />
          </div>
        )}

        {activeTab === "topics" && (
          <TopicsList
            topics={topics}
            onWrite={handleWriteTopic}
            onSave={handleSaveTopic}
            onArchive={handleArchiveTopic}
            writingId={writingTopicId}
          />
        )}
      </div>

      {/* Raw Input Form Modal */}
      {showRawInputForm && (
        <RawInputForm
          onSubmit={handleAddRawInput}
          onClose={() => setShowRawInputForm(false)}
        />
      )}

      {/* Profile Editor Modal */}
      {showProfileEditor && profile && (
        <ProfileEditor
          profile={{
            audience_pains: profile.audience_pains,
            topics: profile.topics,
            voice_style: profile.voice_style,
            examples_good: profile.examples_good,
          }}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileEditor(false)}
        />
      )}

      {/* Post Writing Modal */}
      {currentPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full my-8">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">{currentPost.topic.title}</h2>
                <button
                  onClick={() => setCurrentPost(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Tone selector */}
              <div className="flex gap-2 mb-4">
                {PLATFORM_CONFIGS.linkedin.tones.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() =>
                      setCurrentPost((prev) =>
                        prev ? { ...prev, tone: tone.id } : null
                      )
                    }
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      currentPost.tone === tone.id
                        ? "bg-blue-500 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>

              {/* Editor */}
              <textarea
                value={currentPost.content}
                onChange={(e) =>
                  setCurrentPost((prev) =>
                    prev ? { ...prev, content: e.target.value } : null
                  )
                }
                rows={14}
                className="w-full p-4 bg-white/5 rounded-lg border border-white/20 text-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />

              <CharacterCounter text={currentPost.content} platform="linkedin" />

              {/* Preview */}
              <div className="mt-4 p-4 bg-slate-700 rounded-lg">
                <p className="text-gray-400 text-xs mb-2">Превью</p>
                <LinkedInPreview
                  content={currentPost.content}
                  authorName={user?.linkedinName || "Ваше имя"}
                  authorHeadline={user?.linkedinHeadline || undefined}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCopyPost}
                  className="flex-1 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20"
                >
                  {copied ? "Скопировано!" : "Копировать"}
                </button>
                <button
                  onClick={handleMarkAsPosted}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-medium rounded-lg hover:opacity-90"
                >
                  Опубликовано
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
