"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

const TIMEZONES = [
  { id: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { id: "America/Denver", label: "Denver (MT)" },
  { id: "America/Chicago", label: "Chicago (CT)" },
  { id: "America/New_York", label: "New York (ET)" },
  { id: "Europe/London", label: "London (GMT)" },
  { id: "Europe/Paris", label: "Paris/Berlin (CET)" },
  { id: "Europe/Moscow", label: "Moscow (MSK)" },
  { id: "Asia/Dubai", label: "Dubai (GST)" },
  { id: "Asia/Singapore", label: "Singapore (SGT)" },
  { id: "Asia/Tokyo", label: "Tokyo (JST)" },
  { id: "Australia/Sydney", label: "Sydney (AEST)" },
];

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("");
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [twitterAccountsToCopy, setTwitterAccountsToCopy] = useState("");

  const [emailFrequency, setEmailFrequency] = useState("twice_weekly");
  const [emailDays, setEmailDays] = useState<string[]>(["tuesday", "thursday"]);
  const [emailTime, setEmailTime] = useState("08:00");
  const [timezone, setTimezone] = useState("America/New_York");

  const [submitting, setSubmitting] = useState(false);
  const [submittingSeconds, setSubmittingSeconds] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  // Timer for submitting progress
  useEffect(() => {
    if (submitting) {
      setSubmittingSeconds(0);
      const interval = setInterval(() => {
        setSubmittingSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [submitting]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (!res.ok || !data.user) {
        router.push("/login");
        return;
      }
      // If user already completed onboarding, go to dashboard
      if (data.user.userType && data.user.userType !== '') {
        router.push("/dashboard");
        return;
      }
      setUserEmail(data.user.email);
      setLoading(false);
    } catch {
      router.push("/login");
    }
  };

  const effectiveNiche = niche === "Other" ? customNiche : niche;
  const canProceedStep1 = userType !== "";
  const canProceedStep2 = effectiveNiche !== "";
  const canProceedStep3 = targetAudience.length >= 10;
  const canProceedStep4 = emailDays.length > 0;

  const setFrequencyWithDays = (freq: string) => {
    setEmailFrequency(freq);
    if (freq === "daily") setEmailDays(["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]);
    else if (freq === "twice_weekly") setEmailDays(["tuesday","thursday"]);
    else if (freq === "weekly") setEmailDays(["tuesday"]);
  };

  const toggleDay = (day: string) => {
    setEmailDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          userType,
          niche: effectiveNiche,
          targetAudience,
          linkedinUrl: linkedinUrl || null,
          twitterHandle: twitterHandle || null,
          twitterAccountsToCopy: twitterAccountsToCopy || null,
          emailFrequency,
          emailDays: emailDays.join(","),
          emailTime,
          timezone
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold text-white">PostSpark</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">Tell us about yourself to get personalized content ideas</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${s < step ? "bg-green-500 text-white" : s === step ? "bg-blue-500 text-white" : "bg-white/10 text-gray-400"}`}>
                {s < step ? "✓" : s}
              </div>
            ))}
          </div>
          <div className="h-2 bg-white/10 rounded-full">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all" style={{ width: `${((step - 1) / 4) * 100}%` }} />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 mb-6">{error}</div>
        )}

        {/* Step 1: User Type */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Who are you?</h2>
            <div className="grid grid-cols-2 gap-4">
              {USER_TYPES.map((type) => (
                <button key={type.id} onClick={() => setUserType(type.id)} className={`p-6 rounded-xl border-2 transition-all text-left ${userType === type.id ? "border-blue-500 bg-blue-500/20" : "border-white/20 bg-white/5 hover:border-white/40"}`}>
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-white font-semibold">{type.label}</div>
                  <div className="text-gray-400 text-sm">{type.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} disabled={!canProceedStep1} className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Niche */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">What's your niche?</h2>
            <div className="grid grid-cols-3 gap-3">
              {NICHES.map((n) => (
                <button key={n} onClick={() => setNiche(n)} className={`p-3 rounded-lg text-sm transition-all ${niche === n ? "bg-blue-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                  {n}
                </button>
              ))}
            </div>
            {niche === "Other" && (
              <input type="text" value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} placeholder="Enter your niche..." className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={() => setStep(3)} disabled={!canProceedStep2} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">Continue</button>
            </div>
          </div>
        )}

        {/* Step 3: Target Audience */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Who do you help?</h2>
            <p className="text-gray-400 text-center">Describe your ideal client or audience</p>
            <textarea value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Example: I help startup founders who struggle to get their first 100 customers" rows={4} className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={() => setStep(4)} disabled={!canProceedStep3} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">Continue</button>
            </div>
          </div>
        )}

        {/* Step 4: Schedule */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Email Reminders</h2>

            {/* Timezone */}
            <div className="space-y-3">
              <label className="text-white font-medium">Your timezone:</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TIMEZONES.map((tz) => (
                  <option key={tz.id} value={tz.id} className="bg-slate-800">{tz.label}</option>
                ))}
              </select>
            </div>

            {/* Frequency */}
            <div className="space-y-3">
              <label className="text-white font-medium">How often?</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "daily", label: "Daily" },
                  { id: "twice_weekly", label: "2x Week" },
                  { id: "weekly", label: "Weekly" },
                ].map((freq) => (
                  <button key={freq.id} onClick={() => setFrequencyWithDays(freq.id)} className={`p-3 rounded-lg text-sm font-medium transition-all ${emailFrequency === freq.id ? "bg-blue-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Days */}
            <div className="space-y-3">
              <label className="text-white font-medium">Which days?</label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button key={day.id} onClick={() => toggleDay(day.id)} className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${emailDays.includes(day.id) ? "bg-blue-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="space-y-3">
              <label className="text-white font-medium">What time?</label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.slice(0, 8).map((slot) => (
                  <button key={slot.time} onClick={() => setEmailTime(slot.time)} className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${emailTime === slot.time ? "bg-blue-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={() => setStep(5)} disabled={!canProceedStep4} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">Continue</button>
            </div>
          </div>
        )}

        {/* Step 5: Social Profiles (Optional) + Submit */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Social Profiles (Optional)</h2>
            <p className="text-gray-400 text-center">Add your profiles for more personalized ideas</p>

            {/* LinkedIn */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium flex items-center gap-2">
                <span className="text-lg">💼</span> LinkedIn Profile
              </label>
              <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/yourprofile" className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Twitter */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium flex items-center gap-2">
                <span className="text-lg">𝕏</span> Your Twitter/X Handle
              </label>
              <input type="text" value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value.replace('@', ''))} placeholder="yourhandle (without @)" className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Twitter accounts to copy */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium flex items-center gap-2">
                <span className="text-lg">✨</span> Twitter accounts to copy style from
              </label>
              <input
                type="text"
                value={twitterAccountsToCopy}
                onChange={(e) => setTwitterAccountsToCopy(e.target.value)}
                placeholder="@naval, @sahaborgs, @levelsio (up to 3)"
                className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-500 text-xs">We'll analyze their tweets and generate content in a similar style</p>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <p className="text-blue-300 text-sm">We'll generate 10 personalized post ideas. You can switch between LinkedIn and Twitter in the dashboard.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20">Back</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating your content... {submittingSeconds}s
                  </span>
                ) : "Complete Setup"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
