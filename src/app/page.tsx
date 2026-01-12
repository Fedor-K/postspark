"use client";
import { useState } from "react";
import LinkedInPreview from "../components/LinkedInPreview";
import CharacterCounter from "../components/CharacterCounter";
import TextFormatter from "../components/TextFormatter";
import HooksLibrary from "../components/HooksLibrary";
import CTAsLibrary from "../components/CTAsLibrary";

const USER_TYPES = [
  { id: "solopreneur", label: "Solopreneur", icon: "🚀", desc: "Building my own business" },
  { id: "coach", label: "Coach", icon: "🎯", desc: "Helping others transform" },
  { id: "consultant", label: "Consultant", icon: "💼", desc: "Solving business problems" },
  { id: "freelancer", label: "Freelancer", icon: "💻", desc: "Offering my skills" },
];

const NICHES = [
  "Marketing", "Sales", "Tech/Software", "Finance", "HR/Recruiting",
  "Design", "Fitness/Health", "Real Estate", "E-commerce", "Education",
  "Legal", "Consulting", "Coaching", "Other"
];

const DAYS_OF_WEEK = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
];

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

interface Topic {
  hook: string;
  title: string;
  description: string;
  format: string;
}

interface Profile {
  name: string;
  headline: string;
}

interface Results {
  profile: Profile;
  niche: string;
  topics: Topic[];
}

interface PostVersions {
  professional: string;
  casual: string;
  storytelling: string;
}

export default function Home() {
  // Onboarding state
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("");
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
  // Email schedule state
  const [emailFrequency, setEmailFrequency] = useState("weekly");
  const [emailDays, setEmailDays] = useState<string[]>(["monday", "thursday"]);
  const [emailTime, setEmailTime] = useState("09:00");
  
  // Results state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");
  
  // Post generation state
  const [writingIndex, setWritingIndex] = useState<number | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<{[key: number]: PostVersions}>({});
  const [selectedTone, setSelectedTone] = useState<{[key: number]: string}>({});
  const [copied, setCopied] = useState<number | null>(null);
  const [savedPosts, setSavedPosts] = useState<{[key: number]: boolean}>({});
  
  // Editor state
  const [editingPost, setEditingPost] = useState<{index: number, content: string} | null>(null);
  const [showPreview, setShowPreview] = useState<number | null>(null);
  const [showHooks, setShowHooks] = useState(false);
  const [showCTAs, setShowCTAs] = useState(false);

  const effectiveNiche = niche === "Other" ? customNiche : niche;

  const canProceedStep1 = userType !== "";
  const canProceedStep2 = effectiveNiche !== "";
  const canProceedStep3 = targetAudience.length >= 10;
  const canProceedStep4 = email.includes("@") && email.includes(".");
  const canProceedStep5 = emailDays.length > 0;

  const toggleDay = (day: string) => {
    setEmailDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const analyze = async () => {
    setLoading(true);
    setError("");
    setResults(null);
    setGeneratedPosts({});
    setSavedPosts({});

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          linkedinUrl: linkedinUrl || null,
          userType,
          niche: effectiveNiche,
          targetAudience,
          email,
          emailFrequency,
          emailDays: emailDays.join(","),
          emailTime
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data);
      setStep(7);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const writePost = async (index: number, topic: Topic) => {
    setWritingIndex(index);
    try {
      const res = await fetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...topic, 
          profile: results?.profile,
          userType,
          niche: effectiveNiche,
          targetAudience
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedPosts(prev => ({ ...prev, [index]: data.posts }));
      setSelectedTone(prev => ({ ...prev, [index]: "professional" }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
    } finally {
      setWritingIndex(null);
    }
  };

  const copyPost = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const savePost = async (index: number, content: string, tone: string, title: string) => {
    try {
      await fetch("/api/posts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, content, tone, title }),
      });
      setSavedPosts(prev => ({ ...prev, [index]: true }));
    } catch (err) {
      console.error("Failed to save post", err);
    }
  };

  const startOver = () => {
    setStep(1);
    setResults(null);
    setGeneratedPosts({});
    setSavedPosts({});
    setSelectedTone({});
    setEditingPost(null);
    setShowPreview(null);
  };

  const getCurrentPostContent = (index: number): string => {
    if (editingPost?.index === index) return editingPost.content;
    return generatedPosts[index]?.[selectedTone[index] as keyof PostVersions] || "";
  };

  const handleEditPost = (index: number, content: string) => {
    setEditingPost({ index, content });
  };

  const handleHookSelect = (hook: string) => {
    if (editingPost) {
      setEditingPost({ ...editingPost, content: hook + "\n\n" + editingPost.content });
    }
    setShowHooks(false);
  };

  const handleCTASelect = (cta: string) => {
    if (editingPost) {
      setEditingPost({ ...editingPost, content: editingPost.content + "\n\n" + cta });
    }
    setShowCTAs(false);
  };

  const handleFormatText = (formattedText: string) => {
    if (editingPost) {
      setEditingPost({ ...editingPost, content: formattedText });
    }
  };

  const totalSteps = 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold text-white">PostSpark</span>
          </div>
          
          {step < 7 && (
            <>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
                LinkedIn Posts <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">That Get Clients</span>
              </h1>
              <p className="text-lg text-gray-300 max-w-xl mx-auto">
                Personalized content ideas for solopreneurs, coaches & consultants
              </p>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {step < 7 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div 
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    s < step ? "bg-green-500 text-white" :
                    s === step ? "bg-orange-500 text-white" :
                    "bg-white/10 text-gray-400"
                  }`}
                >
                  {s < step ? "✓" : s}
                </div>
              ))}
            </div>
            <div className="h-2 bg-white/10 rounded-full">
              <div 
                className="h-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: User Type */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Who are you?</h2>
            <div className="grid grid-cols-2 gap-4">
              {USER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setUserType(type.id)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    userType === type.id 
                      ? "border-orange-500 bg-orange-500/20" 
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-white font-semibold">{type.label}</div>
                  <div className="text-gray-400 text-sm">{type.desc}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Niche */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">What's your niche?</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {NICHES.map((n) => (
                <button
                  key={n}
                  onClick={() => setNiche(n)}
                  className={`p-3 rounded-lg text-sm transition-all ${
                    niche === n 
                      ? "bg-orange-500 text-white" 
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {niche === "Other" && (
              <input
                type="text"
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                placeholder="Enter your niche..."
                className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={() => setStep(3)} disabled={!canProceedStep2} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
            </div>
          </div>
        )}

        {/* Step 3: Target Audience */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Who do you help?</h2>
            <p className="text-gray-400 text-center">Describe your ideal client or audience</p>
            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Example: I help startup founders who struggle to get their first 100 customers through content marketing"
              rows={4}
              className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={() => setStep(4)} disabled={!canProceedStep3} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
            </div>
          </div>
        )}

        {/* Step 4: Email */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Where should we send your ideas?</h2>
            <p className="text-gray-400 text-center">We'll save your results and send content reminders</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={() => setStep(5)} disabled={!canProceedStep4} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
            </div>
          </div>
        )}

        {/* Step 5: Email Schedule */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">When should we remind you to post?</h2>
            <p className="text-gray-400 text-center">We'll send fresh topic ideas on your schedule</p>
            
            {/* Frequency */}
            <div className="space-y-3">
              <label className="text-white font-medium">How often?</label>
              <div className="flex gap-3">
                {["daily", "weekly", "twice_weekly"].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setEmailFrequency(freq)}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                      emailFrequency === freq
                        ? "bg-orange-500 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {freq === "daily" ? "Daily" : freq === "weekly" ? "Weekly" : "2x Week"}
                  </button>
                ))}
              </div>
            </div>

            {/* Days */}
            <div className="space-y-3">
              <label className="text-white font-medium">Which days?</label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                      emailDays.includes(day.id)
                        ? "bg-orange-500 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="space-y-3">
              <label className="text-white font-medium">What time? (UTC)</label>
              <select
                value={emailTime}
                onChange={(e) => setEmailTime(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time} className="bg-slate-800">{time}</option>
                ))}
              </select>
            </div>

            {/* Summary */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-gray-300 text-sm">
                📧 You'll receive post ideas on <span className="text-orange-400 font-medium">{emailDays.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ")}</span> at <span className="text-orange-400 font-medium">{emailTime} UTC</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={() => setStep(6)} disabled={!canProceedStep5} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
            </div>
          </div>
        )}

        {/* Step 6: LinkedIn URL (Optional) */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Your LinkedIn profile (optional)</h2>
            <p className="text-gray-400 text-center">We'll analyze your profile for even more personalized ideas</p>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="linkedin.com/in/yourprofile"
              className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setStep(5)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={analyze} disabled={loading} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
                {loading ? "Generating ideas..." : "Generate My Ideas"}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center p-8 bg-white/5 rounded-xl border border-white/10">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-orange-400 font-medium">Creating personalized ideas for you...</p>
            <p className="text-gray-400 text-sm mt-2">This may take 30-60 seconds</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 mb-8">
            {error}
          </div>
        )}

        {/* Results */}
        {step === 7 && results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Post Ideas</h2>
                <p className="text-gray-400">Click any idea to generate the full post</p>
              </div>
              <button onClick={startOver} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm">Start Over</button>
            </div>

            <div className="bg-white/10 rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {results.profile?.name?.[0] || userType[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{results.profile?.name || "Your Profile"}</h3>
                  <p className="text-gray-400 text-sm">{results.profile?.headline || `${userType} in ${effectiveNiche}`}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">{effectiveNiche}</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">{userType}</span>
              </div>
            </div>

            <div className="space-y-4">
              {results.topics?.map((topic, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-5 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-400 font-mono text-sm">#{i + 1}</span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">{topic.format}</span>
                  </div>
                  <p className="text-white font-medium mb-1">{topic.title}</p>
                  <p className="text-gray-400 text-sm mb-4">{topic.description}</p>
                  
                  {!generatedPosts[i] ? (
                    <button
                      onClick={() => writePost(i, topic)}
                      disabled={writingIndex === i}
                      className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {writingIndex === i ? "Writing 3 versions..." : "Write This Post"}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      {/* Tone Selector */}
                      <div className="flex gap-2">
                        {(["professional", "casual", "storytelling"] as const).map((tone) => (
                          <button
                            key={tone}
                            onClick={() => {
                              setSelectedTone(prev => ({ ...prev, [i]: tone }));
                              setEditingPost(null);
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              selectedTone[i] === tone
                                ? "bg-orange-500 text-white"
                                : "bg-white/10 text-gray-300 hover:bg-white/20"
                            }`}
                          >
                            {tone === "professional" ? "Professional" : tone === "casual" ? "Casual" : "Story"}
                          </button>
                        ))}
                      </div>
                      
                      {/* Text Formatter */}
                      {editingPost?.index === i && (
                        <TextFormatter text={editingPost.content} onFormat={handleFormatText} />
                      )}
                      
                      {/* Post Content / Editor */}
                      {editingPost?.index === i ? (
                        <textarea
                          value={editingPost.content}
                          onChange={(e) => setEditingPost({ index: i, content: e.target.value })}
                          className="w-full p-4 bg-white/5 rounded-lg border border-white/10 text-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                          rows={10}
                        />
                      ) : (
                        <div 
                          className="p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:border-white/20"
                          onClick={() => handleEditPost(i, getCurrentPostContent(i))}
                        >
                          <p className="text-gray-200 whitespace-pre-wrap text-sm">{getCurrentPostContent(i)}</p>
                          <p className="text-gray-500 text-xs mt-2">Click to edit</p>
                        </div>
                      )}
                      
                      {/* Character Counter */}
                      <CharacterCounter text={getCurrentPostContent(i)} />
                      
                      {/* Hooks & CTAs buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!editingPost || editingPost.index !== i) handleEditPost(i, getCurrentPostContent(i));
                            setShowHooks(!showHooks);
                            setShowCTAs(false);
                          }}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showHooks ? "bg-orange-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                        >
                          🪝 Add Hook
                        </button>
                        <button
                          onClick={() => {
                            if (!editingPost || editingPost.index !== i) handleEditPost(i, getCurrentPostContent(i));
                            setShowCTAs(!showCTAs);
                            setShowHooks(false);
                          }}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showCTAs ? "bg-pink-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                        >
                          🎯 Add CTA
                        </button>
                        <button
                          onClick={() => setShowPreview(showPreview === i ? null : i)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showPreview === i ? "bg-blue-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                        >
                          👁️ Preview
                        </button>
                      </div>
                      
                      {/* Hooks Library */}
                      {showHooks && editingPost?.index === i && (
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <HooksLibrary onSelect={handleHookSelect} userNiche={userType} />
                        </div>
                      )}
                      
                      {/* CTAs Library */}
                      {showCTAs && editingPost?.index === i && (
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <CTAsLibrary onSelect={handleCTASelect} />
                        </div>
                      )}
                      
                      {/* LinkedIn Preview */}
                      {showPreview === i && (
                        <div className="p-4 bg-slate-800 rounded-lg">
                          <LinkedInPreview 
                            content={getCurrentPostContent(i)}
                            authorName={results.profile?.name || "Your Name"}
                            authorHeadline={results.profile?.headline}
                          />
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <button onClick={() => copyPost(i, getCurrentPostContent(i))} className="flex-1 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20">
                          {copied === i ? "Copied!" : "Copy Post"}
                        </button>
                        <button
                          onClick={() => savePost(i, getCurrentPostContent(i), selectedTone[i], topic.title)}
                          disabled={savedPosts[i]}
                          className="flex-1 py-2.5 bg-purple-500/20 text-purple-300 font-medium rounded-lg hover:bg-purple-500/30 disabled:opacity-50"
                        >
                          {savedPosts[i] ? "Saved!" : "Save Post"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Dashboard CTA */}
            <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-xl p-6 border border-orange-500/30 text-center">
              <h3 className="text-white font-semibold mb-2">Your reminders are set! 📧</h3>
              <p className="text-gray-300 text-sm mb-4">We'll send fresh ideas to {email} on {emailDays.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ")} at {emailTime}</p>
              <a href={`/dashboard?email=${encodeURIComponent(email)}`} className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90">
                View My Dashboard
              </a>
            </div>
          </div>
        )}

        {/* How it works - only on step 1 */}
        {step === 1 && (
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-center">
              <div className="text-2xl mb-2">1</div>
              <h3 className="font-semibold text-white mb-1">Tell Us About You</h3>
              <p className="text-gray-400 text-sm">Your niche & audience</p>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-center">
              <div className="text-2xl mb-2">2</div>
              <h3 className="font-semibold text-white mb-1">Set Your Schedule</h3>
              <p className="text-gray-400 text-sm">Get reminders to post</p>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-center">
              <div className="text-2xl mb-2">3</div>
              <h3 className="font-semibold text-white mb-1">Get Ideas + Posts</h3>
              <p className="text-gray-400 text-sm">Ready to copy & publish</p>
            </div>
          </div>
        )}
      </div>
      
      <footer className="border-t border-white/10 py-6 text-center text-gray-500 text-sm">
        PostSpark - LinkedIn Content for Solopreneurs & Coaches
      </footer>
    </div>
  );
}
