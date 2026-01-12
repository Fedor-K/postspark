"use client";
import { useState } from "react";

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

  const effectiveNiche = niche === "Other" ? customNiche : niche;

  const canProceedStep1 = userType !== "";
  const canProceedStep2 = effectiveNiche !== "";
  const canProceedStep3 = targetAudience.length >= 10;
  const canProceedStep4 = email.includes("@") && email.includes(".");

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
          email
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data);
      setStep(6); // Results step
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
  };

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
          
          {step < 6 && (
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
        {step < 6 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
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
                style={{ width: `${((step - 1) / 4) * 100}%` }}
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
            <h2 className="text-2xl font-bold text-white text-center">What\'s your niche?</h2>
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
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
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
              <button
                onClick={() => setStep(2)}
                className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!canProceedStep3}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Email */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Where should we send your ideas?</h2>
            <p className="text-gray-400 text-center">We\'ll save your results and send weekly content ideas</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20"
              >
                Back
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={!canProceedStep4}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 5: LinkedIn URL (Optional) */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Your LinkedIn profile (optional)</h2>
            <p className="text-gray-400 text-center">We\'ll analyze your profile for even more personalized ideas</p>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="linkedin.com/in/yourprofile"
              className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(4)}
                className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20"
              >
                Back
              </button>
              <button
                onClick={analyze}
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
              >
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
        {step === 6 && results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Post Ideas</h2>
                <p className="text-gray-400">Click any idea to generate the full post</p>
              </div>
              <button
                onClick={startOver}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm"
              >
                Start Over
              </button>
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
                            onClick={() => setSelectedTone(prev => ({ ...prev, [i]: tone }))}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              selectedTone[i] === tone
                                ? "bg-orange-500 text-white"
                                : "bg-white/10 text-gray-300 hover:bg-white/20"
                            }`}
                          >
                            {tone === "professional" ? "Professional" : 
                             tone === "casual" ? "Casual" : "Story"}
                          </button>
                        ))}
                      </div>
                      
                      {/* Post Content */}
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-200 whitespace-pre-wrap text-sm">
                          {generatedPosts[i][selectedTone[i] as keyof PostVersions]}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyPost(i, generatedPosts[i][selectedTone[i] as keyof PostVersions])}
                          className="flex-1 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20"
                        >
                          {copied === i ? "Copied!" : "Copy Post"}
                        </button>
                        <button
                          onClick={() => savePost(i, generatedPosts[i][selectedTone[i] as keyof PostVersions], selectedTone[i], topic.title)}
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
              <h3 className="text-white font-semibold mb-2">Want more ideas every week?</h3>
              <p className="text-gray-300 text-sm mb-4">We\'ll send 5 fresh ideas to {email} every Monday</p>
              <a
                href={`/dashboard?email=${encodeURIComponent(email)}`}
                className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90"
              >
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
              <h3 className="font-semibold text-white mb-1">Get 10 Ideas</h3>
              <p className="text-gray-400 text-sm">Personalized for your business</p>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-center">
              <div className="text-2xl mb-2">3</div>
              <h3 className="font-semibold text-white mb-1">Choose Your Tone</h3>
              <p className="text-gray-400 text-sm">3 versions of each post</p>
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
