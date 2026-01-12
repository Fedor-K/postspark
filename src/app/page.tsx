"use client";
import { useState, useEffect } from "react";
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
  { id: "monday", label: "Mon", best: true },
  { id: "tuesday", label: "Tue", best: true },
  { id: "wednesday", label: "Wed", best: true },
  { id: "thursday", label: "Thu", best: true },
  { id: "friday", label: "Fri", best: false },
  { id: "saturday", label: "Sat", best: false },
  { id: "sunday", label: "Sun", best: false },
];

const TIME_SLOTS = [
  { time: "07:00", label: "7:00 AM", best: true },
  { time: "08:00", label: "8:00 AM", best: true },
  { time: "09:00", label: "9:00 AM", best: true },
  { time: "10:00", label: "10:00 AM", best: false },
  { time: "11:00", label: "11:00 AM", best: false },
  { time: "12:00", label: "12:00 PM", best: true },
  { time: "13:00", label: "1:00 PM", best: false },
  { time: "14:00", label: "2:00 PM", best: false },
  { time: "15:00", label: "3:00 PM", best: false },
  { time: "16:00", label: "4:00 PM", best: false },
  { time: "17:00", label: "5:00 PM", best: true },
  { time: "18:00", label: "6:00 PM", best: true },
  { time: "19:00", label: "7:00 PM", best: false },
  { time: "20:00", label: "8:00 PM", best: false },
];

interface Topic { hook: string; title: string; description: string; format: string; }
interface Profile { name: string; headline: string; }
interface Results { profile: Profile; niche: string; topics: Topic[]; }
interface PostVersions { professional: string; casual: string; storytelling: string; }

export default function Home() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("");
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
  const [emailFrequency, setEmailFrequency] = useState("twice_weekly");
  const [emailDays, setEmailDays] = useState<string[]>(["tuesday", "thursday"]);
  const [emailTime, setEmailTime] = useState("08:00");
  const [timezone, setTimezone] = useState("UTC");
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");
  
  const [writingIndex, setWritingIndex] = useState<number | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<{[key: number]: PostVersions}>({});
  const [selectedTone, setSelectedTone] = useState<{[key: number]: string}>({});
  const [copied, setCopied] = useState<number | null>(null);
  const [savedPosts, setSavedPosts] = useState<{[key: number]: boolean}>({});
  
  const [editingPost, setEditingPost] = useState<{index: number, content: string} | null>(null);
  const [showPreview, setShowPreview] = useState<number | null>(null);
  const [showHooks, setShowHooks] = useState(false);
  const [showCTAs, setShowCTAs] = useState(false);

  // Auto-detect timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz);
    } catch {
      setTimezone("UTC");
    }
  }, []);

  const effectiveNiche = niche === "Other" ? customNiche : niche;
  const canProceedStep1 = userType !== "";
  const canProceedStep2 = effectiveNiche !== "";
  const canProceedStep3 = targetAudience.length >= 10;
  const canProceedStep4 = email.includes("@") && email.includes(".");
  const canProceedStep5 = emailDays.length > 0;

  const toggleDay = (day: string) => {
    setEmailDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const applyRecommended = () => {
    setEmailFrequency("twice_weekly");
    setEmailDays(["tuesday", "thursday"]);
    setEmailTime("08:00");
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
          linkedinUrl: linkedinUrl || null, userType, niche: effectiveNiche, targetAudience, email,
          emailFrequency, emailDays: emailDays.join(","), emailTime, timezone
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data);
      setStep(7);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        body: JSON.stringify({ ...topic, profile: results?.profile, userType, niche: effectiveNiche, targetAudience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedPosts(prev => ({ ...prev, [index]: data.posts }));
      setSelectedTone(prev => ({ ...prev, [index]: "professional" }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
    } catch (err) { console.error("Failed to save post", err); }
  };

  const startOver = () => {
    setStep(1); setResults(null); setGeneratedPosts({}); setSavedPosts({});
    setSelectedTone({}); setEditingPost(null); setShowPreview(null);
  };

  const getCurrentPostContent = (index: number): string => {
    if (editingPost?.index === index) return editingPost.content;
    return generatedPosts[index]?.[selectedTone[index] as keyof PostVersions] || "";
  };

  const handleEditPost = (index: number, content: string) => setEditingPost({ index, content });
  const handleHookSelect = (hook: string) => { if (editingPost) setEditingPost({ ...editingPost, content: hook + "\n\n" + editingPost.content }); setShowHooks(false); };
  const handleCTASelect = (cta: string) => { if (editingPost) setEditingPost({ ...editingPost, content: editingPost.content + "\n\n" + cta }); setShowCTAs(false); };
  const handleFormatText = (formattedText: string) => { if (editingPost) setEditingPost({ ...editingPost, content: formattedText }); };

  const getLocalTimeLabel = (time: string) => {
    const slot = TIME_SLOTS.find(t => t.time === time);
    return slot?.label || time;
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
          {step < 7 && (
            <>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
                LinkedIn Posts <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">That Get Clients</span>
              </h1>
              <p className="text-lg text-gray-300 max-w-xl mx-auto">Personalized content ideas for solopreneurs, coaches & consultants</p>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {step < 7 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${s < step ? "bg-green-500 text-white" : s === step ? "bg-orange-500 text-white" : "bg-white/10 text-gray-400"}`}>
                  {s < step ? "✓" : s}
                </div>
              ))}
            </div>
            <div className="h-2 bg-white/10 rounded-full">
              <div className="h-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all" style={{ width: `${((step - 1) / 5) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Step 1-4 remain the same */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Who are you?</h2>
            <div className="grid grid-cols-2 gap-4">
              {USER_TYPES.map((type) => (
                <button key={type.id} onClick={() => setUserType(type.id)} className={`p-6 rounded-xl border-2 transition-all text-left ${userType === type.id ? "border-orange-500 bg-orange-500/20" : "border-white/20 bg-white/5 hover:border-white/40"}`}>
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-white font-semibold">{type.label}</div>
                  <div className="text-gray-400 text-sm">{type.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} disabled={!canProceedStep1} className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">What's your niche?</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {NICHES.map((n) => (<button key={n} onClick={() => setNiche(n)} className={`p-3 rounded-lg text-sm transition-all ${niche === n ? "bg-orange-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>{n}</button>))}
            </div>
            {niche === "Other" && <input type="text" value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} placeholder="Enter your niche..." className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={() => setStep(3)} disabled={!canProceedStep2} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Who do you help?</h2>
            <p className="text-gray-400 text-center">Describe your ideal client or audience</p>
            <textarea value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Example: I help startup founders who struggle to get their first 100 customers" rows={4} className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={() => setStep(4)} disabled={!canProceedStep3} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Where should we send your ideas?</h2>
            <p className="text-gray-400 text-center">We'll save your results and send content reminders</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={() => setStep(5)} disabled={!canProceedStep4} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
            </div>
          </div>
        )}

        {/* Step 5: Email Schedule with Recommendations */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">When should we remind you to post?</h2>
            
            {/* Recommendation Banner */}
            <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <p className="text-green-400 font-semibold mb-1">Best times to post on LinkedIn:</p>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• <span className="text-white">Tuesday - Thursday</span> get highest engagement</li>
                    <li>• <span className="text-white">7-8 AM</span> catches morning scrollers</li>
                    <li>• <span className="text-white">12 PM</span> lunch break traffic</li>
                    <li>• <span className="text-white">5-6 PM</span> end of workday wind-down</li>
                  </ul>
                  <button onClick={applyRecommended} className="mt-3 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600">
                    ✨ Apply Recommended (Tue & Thu, 8 AM)
                  </button>
                </div>
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-3">
              <label className="text-white font-medium">How often?</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "daily", label: "Daily", desc: "For rapid growth" },
                  { id: "twice_weekly", label: "2x Week", desc: "Recommended" },
                  { id: "weekly", label: "Weekly", desc: "Minimum viable" },
                ].map((freq) => (
                  <button key={freq.id} onClick={() => setEmailFrequency(freq.id)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${emailFrequency === freq.id ? "bg-orange-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                    <div>{freq.label}</div>
                    <div className="text-xs opacity-70">{freq.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Days */}
            <div className="space-y-3">
              <label className="text-white font-medium">Which days?</label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button key={day.id} onClick={() => toggleDay(day.id)}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all relative ${emailDays.includes(day.id) ? "bg-orange-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                    {day.label}
                    {day.best && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></span>}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">Green dots = highest engagement days</p>
            </div>

            {/* Time */}
            <div className="space-y-3">
              <label className="text-white font-medium">What time? <span className="text-gray-400 font-normal">({timezone})</span></label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button key={slot.time} onClick={() => setEmailTime(slot.time)}
                    className={`py-2 px-1 rounded-lg text-xs font-medium transition-all relative ${emailTime === slot.time ? "bg-orange-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                    {slot.label}
                    {slot.best && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></span>}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">Green dots = peak engagement times</p>
            </div>

            {/* Summary */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-gray-300 text-sm">
                📧 You'll receive post ideas on <span className="text-orange-400 font-medium">{emailDays.sort((a,b) => DAYS_OF_WEEK.findIndex(d=>d.id===a) - DAYS_OF_WEEK.findIndex(d=>d.id===b)).map(d => DAYS_OF_WEEK.find(day=>day.id===d)?.label).join(", ")}</span> at <span className="text-orange-400 font-medium">{getLocalTimeLabel(emailTime)}</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={() => setStep(6)} disabled={!canProceedStep5} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
            </div>
          </div>
        )}

        {/* Step 6: LinkedIn URL */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Your LinkedIn profile (optional)</h2>
            <p className="text-gray-400 text-center">We'll analyze your profile for even more personalized ideas</p>
            <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/yourprofile" className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <div className="flex gap-3">
              <button onClick={() => setStep(5)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={analyze} disabled={loading} className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
                {loading ? "Generating ideas..." : "Generate My Ideas"}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center p-8 bg-white/5 rounded-xl border border-white/10">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-orange-400 font-medium">Creating personalized ideas for you...</p>
            <p className="text-gray-400 text-sm mt-2">This may take 30-60 seconds</p>
          </div>
        )}

        {error && <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 mb-8">{error}</div>}

        {/* Results - Step 7 */}
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
                    <button onClick={() => writePost(i, topic)} disabled={writingIndex === i} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                      {writingIndex === i ? "Writing 3 versions..." : "Write This Post"}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {(["professional", "casual", "storytelling"] as const).map((tone) => (
                          <button key={tone} onClick={() => { setSelectedTone(prev => ({ ...prev, [i]: tone })); setEditingPost(null); }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectedTone[i] === tone ? "bg-orange-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                            {tone === "professional" ? "Professional" : tone === "casual" ? "Casual" : "Story"}
                          </button>
                        ))}
                      </div>
                      
                      {editingPost?.index === i && <TextFormatter text={editingPost.content} onFormat={handleFormatText} />}
                      
                      {editingPost?.index === i ? (
                        <textarea value={editingPost.content} onChange={(e) => setEditingPost({ index: i, content: e.target.value })}
                          className="w-full p-4 bg-white/5 rounded-lg border border-white/10 text-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500" rows={10} />
                      ) : (
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:border-white/20" onClick={() => handleEditPost(i, getCurrentPostContent(i))}>
                          <p className="text-gray-200 whitespace-pre-wrap text-sm">{getCurrentPostContent(i)}</p>
                          <p className="text-gray-500 text-xs mt-2">Click to edit</p>
                        </div>
                      )}
                      
                      <CharacterCounter text={getCurrentPostContent(i)} />
                      
                      <div className="flex gap-2">
                        <button onClick={() => { if (!editingPost || editingPost.index !== i) handleEditPost(i, getCurrentPostContent(i)); setShowHooks(!showHooks); setShowCTAs(false); }}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showHooks ? "bg-orange-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>🪝 Add Hook</button>
                        <button onClick={() => { if (!editingPost || editingPost.index !== i) handleEditPost(i, getCurrentPostContent(i)); setShowCTAs(!showCTAs); setShowHooks(false); }}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showCTAs ? "bg-pink-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>🎯 Add CTA</button>
                        <button onClick={() => setShowPreview(showPreview === i ? null : i)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showPreview === i ? "bg-blue-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>👁️ Preview</button>
                      </div>
                      
                      {showHooks && editingPost?.index === i && <div className="p-4 bg-white/5 rounded-lg border border-white/10"><HooksLibrary onSelect={handleHookSelect} userNiche={userType} /></div>}
                      {showCTAs && editingPost?.index === i && <div className="p-4 bg-white/5 rounded-lg border border-white/10"><CTAsLibrary onSelect={handleCTASelect} /></div>}
                      {showPreview === i && <div className="p-4 bg-slate-800 rounded-lg"><LinkedInPreview content={getCurrentPostContent(i)} authorName={results.profile?.name || "Your Name"} authorHeadline={results.profile?.headline} /></div>}
                      
                      <div className="flex gap-2">
                        <button onClick={() => copyPost(i, getCurrentPostContent(i))} className="flex-1 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20">{copied === i ? "Copied!" : "Copy Post"}</button>
                        <button onClick={() => savePost(i, getCurrentPostContent(i), selectedTone[i], topic.title)} disabled={savedPosts[i]} className="flex-1 py-2.5 bg-purple-500/20 text-purple-300 font-medium rounded-lg hover:bg-purple-500/30 disabled:opacity-50">{savedPosts[i] ? "Saved!" : "Save Post"}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-xl p-6 border border-orange-500/30 text-center">
              <h3 className="text-white font-semibold mb-2">Your reminders are set! 📧</h3>
              <p className="text-gray-300 text-sm mb-4">We'll send fresh ideas on {emailDays.sort((a,b) => DAYS_OF_WEEK.findIndex(d=>d.id===a) - DAYS_OF_WEEK.findIndex(d=>d.id===b)).map(d => DAYS_OF_WEEK.find(day=>day.id===d)?.label).join(", ")} at {getLocalTimeLabel(emailTime)}</p>
              <a href={`/dashboard?email=${encodeURIComponent(email)}`} className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90">View My Dashboard</a>
            </div>
          </div>
        )}

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
      <footer className="border-t border-white/10 py-6 text-center text-gray-500 text-sm">PostSpark - LinkedIn Content for Solopreneurs & Coaches</footer>
    </div>
  );
}
