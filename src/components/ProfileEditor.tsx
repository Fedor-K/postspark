"use client";
import { useState } from "react";

type VoiceStyle = "professional" | "casual" | "provocative";

interface Profile {
  audience_pains: string[];
  topics: string[];
  voice_style: VoiceStyle;
  examples_good: string[];
}

interface ProfileEditorProps {
  profile: Profile;
  onSave: (profile: Profile) => Promise<void>;
  onClose: () => void;
}

const VOICE_STYLES = [
  {
    id: "professional" as const,
    label: "Профессиональный",
    description: "Экспертный, структурированный, с данными",
  },
  {
    id: "casual" as const,
    label: "Разговорный",
    description: "Дружелюбный, простой, как с другом",
  },
  {
    id: "provocative" as const,
    label: "Провокационный",
    description: "Резкий, с мнением, вызывающий дискуссию",
  },
];

export default function ProfileEditor({ profile, onSave, onClose }: ProfileEditorProps) {
  const [audiencePains, setAudiencePains] = useState<string[]>(
    profile.audience_pains.length > 0 ? profile.audience_pains : [""]
  );
  const [topics, setTopics] = useState<string[]>(
    profile.topics.length > 0 ? profile.topics : [""]
  );
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>(profile.voice_style);
  const [examplesGood, setExamplesGood] = useState<string[]>(
    profile.examples_good.length > 0 ? profile.examples_good : [""]
  );
  const [saving, setSaving] = useState(false);

  const handleArrayChange = (
    arr: string[],
    setArr: (arr: string[]) => void,
    index: number,
    value: string
  ) => {
    const newArr = [...arr];
    newArr[index] = value;
    setArr(newArr);
  };

  const addItem = (arr: string[], setArr: (arr: string[]) => void) => {
    if (arr.length < 5) {
      setArr([...arr, ""]);
    }
  };

  const removeItem = (arr: string[], setArr: (arr: string[]) => void, index: number) => {
    if (arr.length > 1) {
      setArr(arr.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave({
        audience_pains: audiencePains.filter((p) => p.trim()),
        topics: topics.filter((t) => t.trim()),
        voice_style: voiceStyle,
        examples_good: examplesGood.filter((e) => e.trim()),
      });
      onClose();
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Профиль эксперта</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Audience Pains */}
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Боли вашей аудитории
              </label>
              <p className="text-gray-500 text-xs mb-3">
                С какими проблемами сталкиваются ваши клиенты?
              </p>
              <div className="space-y-2">
                {audiencePains.map((pain, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={pain}
                      onChange={(e) =>
                        handleArrayChange(audiencePains, setAudiencePains, index, e.target.value)
                      }
                      placeholder="Например: нет системы продаж"
                      className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {audiencePains.length > 1 && (
                      <button
                        onClick={() => removeItem(audiencePains, setAudiencePains, index)}
                        className="px-3 text-gray-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {audiencePains.length < 5 && (
                  <button
                    onClick={() => addItem(audiencePains, setAudiencePains)}
                    className="text-blue-400 text-sm hover:text-blue-300"
                  >
                    + Добавить боль
                  </button>
                )}
              </div>
            </div>

            {/* Topics */}
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                О чём вы пишете
              </label>
              <p className="text-gray-500 text-xs mb-3">
                Основные темы вашего контента
              </p>
              <div className="space-y-2">
                {topics.map((topic, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) =>
                        handleArrayChange(topics, setTopics, index, e.target.value)
                      }
                      placeholder="Например: discovery-звонки"
                      className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {topics.length > 1 && (
                      <button
                        onClick={() => removeItem(topics, setTopics, index)}
                        className="px-3 text-gray-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {topics.length < 5 && (
                  <button
                    onClick={() => addItem(topics, setTopics)}
                    className="text-blue-400 text-sm hover:text-blue-300"
                  >
                    + Добавить тему
                  </button>
                )}
              </div>
            </div>

            {/* Voice Style */}
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Стиль голоса
              </label>
              <p className="text-gray-500 text-xs mb-3">
                Как вы обычно пишете и говорите
              </p>
              <div className="space-y-2">
                {VOICE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setVoiceStyle(style.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      voiceStyle === style.id
                        ? "bg-blue-500/20 border-blue-500"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <p className="text-white font-medium text-sm">{style.label}</p>
                    <p className="text-gray-500 text-xs">{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Examples */}
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Примеры фраз "как я говорю"
              </label>
              <p className="text-gray-500 text-xs mb-3">
                Характерные выражения, которые вы используете
              </p>
              <div className="space-y-2">
                {examplesGood.map((example, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={example}
                      onChange={(e) =>
                        handleArrayChange(examplesGood, setExamplesGood, index, e.target.value)
                      }
                      placeholder="Например: Продажи — это не впаривание"
                      className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {examplesGood.length > 1 && (
                      <button
                        onClick={() => removeItem(examplesGood, setExamplesGood, index)}
                        className="px-3 text-gray-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {examplesGood.length < 5 && (
                  <button
                    onClick={() => addItem(examplesGood, setExamplesGood)}
                    className="text-blue-400 text-sm hover:text-blue-300"
                  >
                    + Добавить пример
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
