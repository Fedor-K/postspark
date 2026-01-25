"use client";

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

interface TopicsListProps {
  topics: Topic[];
  onWrite: (topic: Topic) => void;
  onSave: (id: number) => void;
  onArchive: (id: number) => void;
  writingId: number | null;
}

const FORMAT_CONFIG = {
  story: { icon: "📖", label: "История", color: "purple" },
  lesson: { icon: "💡", label: "Урок", color: "blue" },
  rant: { icon: "😤", label: "Мнение", color: "red" },
  case: { icon: "📊", label: "Кейс", color: "green" },
  list: { icon: "📋", label: "Список", color: "cyan" },
};

export default function TopicsList({
  topics,
  onWrite,
  onSave,
  onArchive,
  writingId,
}: TopicsListProps) {
  const newTopics = topics.filter((t) => t.status === "new");
  const savedTopics = topics.filter((t) => t.status === "saved");

  if (topics.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">Пока нет тем</p>
        <p className="text-gray-600 text-sm">
          Добавьте сырьё и сгенерируйте темы
        </p>
      </div>
    );
  }

  const renderTopic = (topic: Topic) => {
    const config = FORMAT_CONFIG[topic.format] || FORMAT_CONFIG.lesson;
    const isWriting = writingId === topic.id;

    return (
      <div
        key={topic.id}
        className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-xl">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 text-xs rounded-full bg-${config.color}-500/20 text-${config.color}-300`}
                style={{
                  backgroundColor: `rgb(var(--color-${config.color}-500) / 0.2)`,
                }}
              >
                {config.label}
              </span>
              {topic.status === "saved" && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-300">
                  Сохранено
                </span>
              )}
            </div>
            <h3 className="text-white font-medium">{topic.title}</h3>
          </div>
        </div>

        {/* Hook preview */}
        {topic.hook && (
          <p className="text-gray-400 text-sm mb-3 pl-9 italic">
            "{topic.hook}"
          </p>
        )}

        {/* Angle */}
        {topic.angle && (
          <p className="text-gray-500 text-xs mb-3 pl-9">
            Угол: {topic.angle}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pl-9">
          <button
            onClick={() => onWrite(topic)}
            disabled={isWriting}
            className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {isWriting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Пишу...
              </span>
            ) : (
              "Написать"
            )}
          </button>

          {topic.status === "new" && (
            <button
              onClick={() => onSave(topic.id)}
              className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20"
              title="Сохранить на потом"
            >
              💾
            </button>
          )}

          <button
            onClick={() => onArchive(topic.id)}
            className="px-4 py-2 bg-white/10 text-gray-400 text-sm rounded-lg hover:bg-white/20 hover:text-white"
            title="Архивировать"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* New topics */}
      {newTopics.length > 0 && (
        <div>
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full" />
            Новые темы ({newTopics.length})
          </h3>
          <div className="space-y-3">
            {newTopics.map(renderTopic)}
          </div>
        </div>
      )}

      {/* Saved topics */}
      {savedTopics.length > 0 && (
        <div>
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full" />
            Сохранённые ({savedTopics.length})
          </h3>
          <div className="space-y-3">
            {savedTopics.map(renderTopic)}
          </div>
        </div>
      )}
    </div>
  );
}
