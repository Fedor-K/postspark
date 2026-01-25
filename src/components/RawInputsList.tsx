"use client";

interface RawInput {
  id: number;
  type: "insight" | "client_talk" | "free";
  content: Record<string, string>;
  used: boolean;
  created_at: string;
}

interface RawInputsListProps {
  rawInputs: RawInput[];
  onDelete: (id: number) => void;
  onGenerateTopics: () => void;
  generating: boolean;
}

const TYPE_CONFIG = {
  insight: { icon: "💡", label: "Инсайт" },
  client_talk: { icon: "💬", label: "Разговор" },
  free: { icon: "📝", label: "Запись" },
};

export default function RawInputsList({
  rawInputs,
  onDelete,
  onGenerateTopics,
  generating,
}: RawInputsListProps) {
  const unusedCount = rawInputs.filter((r) => !r.used).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "только что";
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const getContentPreview = (input: RawInput): string => {
    const c = input.content;
    if (input.type === "insight") {
      return c.thought || "";
    } else if (input.type === "client_talk") {
      return c.problem ? `Проблема: ${c.problem}` : "";
    } else {
      return c.text || "";
    }
  };

  if (rawInputs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">Пока нет записей</p>
        <p className="text-gray-600 text-sm">
          Добавьте мысли, разговоры с клиентами или идеи
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Generate button */}
      {unusedCount > 0 && (
        <div className="mb-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">
                {unusedCount} {unusedCount === 1 ? "новая запись" : "новых записей"}
              </p>
              <p className="text-gray-400 text-sm">
                Сгенерируйте темы для постов
              </p>
            </div>
            <button
              onClick={onGenerateTopics}
              disabled={generating}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Генерация...
                </span>
              ) : (
                "Сгенерировать темы"
              )}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {rawInputs.map((input) => {
          const config = TYPE_CONFIG[input.type];
          const preview = getContentPreview(input);

          return (
            <div
              key={input.id}
              className={`p-4 rounded-xl border transition-all ${
                input.used
                  ? "bg-white/5 border-white/5 opacity-60"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <span className="text-xl mt-0.5">{config.icon}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-400 text-xs">{config.label}</span>
                    <span className="text-gray-600 text-xs">•</span>
                    <span className="text-gray-500 text-xs">
                      {formatDate(input.created_at)}
                    </span>
                    {input.used && (
                      <>
                        <span className="text-gray-600 text-xs">•</span>
                        <span className="text-green-500/70 text-xs">использовано</span>
                      </>
                    )}
                  </div>
                  <p className="text-white text-sm line-clamp-2">{preview}</p>
                </div>

                {/* Delete button */}
                {!input.used && (
                  <button
                    onClick={() => onDelete(input.id)}
                    className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                    title="Удалить"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
