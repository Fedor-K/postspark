"use client";
import { useState } from "react";

type RawInputType = "insight" | "client_talk" | "free";

interface RawInputFormProps {
  onSubmit: (type: RawInputType, content: Record<string, string>) => Promise<void>;
  onClose: () => void;
}

const INPUT_TYPES = [
  { id: "insight" as const, label: "Мысль / Инсайт", icon: "💡", description: "Идея, наблюдение, вывод" },
  { id: "client_talk" as const, label: "Разговор с клиентом", icon: "💬", description: "Диалог, вопрос, кейс" },
  { id: "free" as const, label: "Свободная запись", icon: "📝", description: "Любая мысль" },
];

export default function RawInputForm({ onSubmit, onClose }: RawInputFormProps) {
  const [step, setStep] = useState<"select" | "form">("select");
  const [type, setType] = useState<RawInputType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Insight fields
  const [thought, setThought] = useState("");
  const [source, setSource] = useState("");
  const [whyImportant, setWhyImportant] = useState("");

  // Client talk fields
  const [clientWho, setClientWho] = useState("");
  const [problem, setProblem] = useState("");
  const [advice, setAdvice] = useState("");
  const [ahaMoment, setAhaMoment] = useState("");

  // Free field
  const [freeText, setFreeText] = useState("");

  const selectType = (selectedType: RawInputType) => {
    setType(selectedType);
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!type) return;

    setSubmitting(true);

    let content: Record<string, string> = {};

    if (type === "insight") {
      content = { thought, source, why_important: whyImportant };
    } else if (type === "client_talk") {
      content = { client_who: clientWho, problem, advice, aha_moment: ahaMoment };
    } else {
      content = { text: freeText };
    }

    try {
      await onSubmit(type, content);
      onClose();
    } catch (err) {
      console.error("Failed to submit:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = () => {
    if (type === "insight") return thought.trim().length > 0;
    if (type === "client_talk") return problem.trim().length > 0 && advice.trim().length > 0;
    if (type === "free") return freeText.trim().length > 0;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {step === "select" ? "Добавить сырьё" : INPUT_TYPES.find(t => t.id === type)?.label}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              ×
            </button>
          </div>

          {/* Step 1: Select Type */}
          {step === "select" && (
            <div className="space-y-3">
              {INPUT_TYPES.map((inputType) => (
                <button
                  key={inputType.id}
                  onClick={() => selectType(inputType.id)}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{inputType.icon}</span>
                    <div>
                      <p className="text-white font-medium">{inputType.label}</p>
                      <p className="text-gray-500 text-sm">{inputType.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Form */}
          {step === "form" && type === "insight" && (
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Что за мысль? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  placeholder="Большинство экспертов боятся называть цену первыми..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Откуда взялась? <span className="text-gray-500">(необязательно)</span>
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Заметил паттерн у 3 клиентов подряд"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Почему это важно для аудитории? <span className="text-gray-500">(необязательно)</span>
                </label>
                <input
                  type="text"
                  value={whyImportant}
                  onChange={(e) => setWhyImportant(e.target.value)}
                  placeholder="Теряют сделки и выглядят неуверенно"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {step === "form" && type === "client_talk" && (
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Кто был клиент? <span className="text-gray-500">(кратко)</span>
                </label>
                <input
                  type="text"
                  value={clientWho}
                  onChange={(e) => setClientWho(e.target.value)}
                  placeholder="Фаундер EdTech стартапа"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Какая проблема? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Не может закрывать сделки, лиды сливаются после демо"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Что посоветовал? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  placeholder="Разобрали структуру демо, он продавал фичи а не результат"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Было ли озарение? <span className="text-gray-500">(необязательно)</span>
                </label>
                <input
                  type="text"
                  value={ahaMoment}
                  onChange={(e) => setAhaMoment(e.target.value)}
                  placeholder="Понял что надо спрашивать про боль в начале"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {step === "form" && type === "free" && (
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Запиши мысль как есть <span className="text-red-400">*</span>
              </label>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Любая мысль, наблюдение, идея для поста..."
                rows={6}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {/* Actions */}
          {step === "form" && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep("select")}
                className="px-4 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20"
              >
                ← Назад
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid() || submitting}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
