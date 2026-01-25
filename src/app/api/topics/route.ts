import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import OpenAI from "openai";

const sql = neon(process.env.DATABASE_URL!);

const openai = new OpenAI({
  apiKey: process.env.ZAI_API_KEY,
  baseURL: "https://api.z.ai/api/paas/v4",
});

type TopicStatus = "new" | "saved" | "written" | "archived";
type TopicFormat = "story" | "lesson" | "rant" | "case" | "list";

// GET /api/topics?email=...&status=new
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const status = searchParams.get("status") as TopicStatus | null;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user[0].id;

    let topics;
    if (status) {
      topics = await sql`
        SELECT id, raw_input_ids, title, hook, angle, format, status, post_id, created_at
        FROM topics
        WHERE user_id = ${userId} AND status = ${status}
        ORDER BY created_at DESC
      `;
    } else {
      topics = await sql`
        SELECT id, raw_input_ids, title, hook, angle, format, status, post_id, created_at
        FROM topics
        WHERE user_id = ${userId} AND status != 'archived'
        ORDER BY created_at DESC
      `;
    }

    return NextResponse.json({ topics });
  } catch (error: unknown) {
    console.error("Get topics error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get topics";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/topics/generate — генерация тем из сырья
export async function POST(request: NextRequest) {
  try {
    const { email, count = 5 } = await request.json() as {
      email: string;
      count?: number;
    };

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Получаем пользователя с расширенным профилем
    const userResult = await sql`
      SELECT
        id, user_type, niche, target_audience,
        linkedin_name, linkedin_headline,
        audience_pains, topics as user_topics, voice_style, examples_good
      FROM users
      WHERE email = ${email}
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult[0];

    // Получаем неиспользованное сырьё
    const rawInputs = await sql`
      SELECT id, type, content
      FROM raw_inputs
      WHERE user_id = ${user.id} AND used = FALSE
      ORDER BY created_at DESC
    `;

    if (rawInputs.length === 0) {
      return NextResponse.json(
        { error: "No unused raw inputs. Add some thoughts first!" },
        { status: 400 }
      );
    }

    // Получаем существующие темы (чтобы не повторяться)
    const existingTopics = await sql`
      SELECT title
      FROM topics
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    // Форматируем сырьё для промпта
    const rawInputsFormatted = rawInputs.map((ri: { id: number; type: string; content: Record<string, string> }) => {
      const c = ri.content;
      let text = `[ID: ${ri.id}] [${ri.type.toUpperCase()}]\n`;

      if (ri.type === "insight") {
        text += `Мысль: ${c.thought || ""}`;
        if (c.source) text += `\nОткуда: ${c.source}`;
        if (c.why_important) text += `\nПочему важно: ${c.why_important}`;
      } else if (ri.type === "client_talk") {
        text += `Клиент: ${c.client_who || ""}`;
        text += `\nПроблема: ${c.problem || ""}`;
        text += `\nСовет: ${c.advice || ""}`;
        if (c.aha_moment) text += `\nОзарение: ${c.aha_moment}`;
      } else {
        text += c.text || "";
      }

      return text;
    }).join("\n---\n");

    // Формируем промпт
    const systemPrompt = `Ты — контент-стратег для экспертов. Превращаешь сырые мысли и заметки в темы для постов в социальных сетях.

Тема должна содержать:
- title: цепляющий заголовок (5-10 слов)
- hook: первая строка поста, которая останавливает скролл (1-2 предложения)
- format: один из форматов — story | lesson | rant | case | list
- angle: под каким углом раскрыть тему (1 предложение)
- raw_input_ids: массив ID записей которые использованы

Форматы:
- story — личная история или история клиента с выводом
- lesson — конкретный урок/принцип с объяснением почему
- rant — эмоциональное высказывание против чего-то в индустрии
- case — разбор кейса: было → сделали → стало
- list — список советов/ошибок/принципов

Правила:
- Темы должны быть разных форматов
- Hook должен вызывать желание читать дальше
- Не повторять темы которые уже были
- Использовать язык и боли целевой аудитории
- Каждая тема должна нести пользу или провоцировать думать
- raw_input_ids должен содержать ID записей из которых родилась тема`;

    const userPrompt = `## Профиль эксперта

Имя: ${user.linkedin_name || "Эксперт"}
Роль: ${user.user_type || ""}
Ниша: ${user.niche || ""}
Аудитория: ${user.target_audience || ""}
Боли аудитории: ${(user.audience_pains || []).join(", ") || "не указаны"}
Темы: ${(user.user_topics || []).join(", ") || "не указаны"}
Стиль: ${user.voice_style || "professional"}
Примеры фраз: ${(user.examples_good || []).join(" | ") || "не указаны"}

## Сырьё (мысли и заметки)

${rawInputsFormatted}

## Уже созданные темы (не повторять)

${existingTopics.map((t: { title: string }) => `- ${t.title}`).join("\n") || "пока нет"}

## Задача

Создай ${count} тем для постов на основе сырья выше.

Ответ ТОЛЬКО в JSON:
{
  "topics": [
    {
      "title": "...",
      "hook": "...",
      "format": "story|lesson|rant|case|list",
      "angle": "...",
      "raw_input_ids": [1, 2]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "glm-4.5-air",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Парсим JSON из ответа
    let parsed: { topics: Array<{
      title: string;
      hook: string;
      format: TopicFormat;
      angle: string;
      raw_input_ids: number[];
    }> };

    try {
      // Убираем markdown обёртку если есть
      const cleanJson = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Сохраняем темы в БД
    const savedTopics = [];
    const usedRawInputIds = new Set<number>();

    for (const topic of parsed.topics) {
      const result = await sql`
        INSERT INTO topics (user_id, raw_input_ids, title, hook, angle, format, status)
        VALUES (
          ${user.id},
          ${topic.raw_input_ids || []},
          ${topic.title},
          ${topic.hook},
          ${topic.angle},
          ${topic.format},
          'new'
        )
        RETURNING id, raw_input_ids, title, hook, angle, format, status, created_at
      `;
      savedTopics.push(result[0]);

      // Собираем использованные raw_input_ids
      (topic.raw_input_ids || []).forEach((id: number) => usedRawInputIds.add(id));
    }

    // Помечаем сырьё как использованное
    if (usedRawInputIds.size > 0) {
      await sql`
        UPDATE raw_inputs
        SET used = TRUE
        WHERE id = ANY(${Array.from(usedRawInputIds)})
      `;
    }

    return NextResponse.json({
      topics: savedTopics,
      usedRawInputIds: Array.from(usedRawInputIds),
    });
  } catch (error: unknown) {
    console.error("Generate topics error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate topics";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PATCH /api/topics — обновить статус темы
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, post_id } = await request.json() as {
      id: number;
      status?: TopicStatus;
      post_id?: number;
    };

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (status) {
      const validStatuses: TopicStatus[] = ["new", "saved", "written", "archived"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const topic = await sql`
      UPDATE topics
      SET
        status = COALESCE(${status || null}, status),
        post_id = COALESCE(${post_id || null}, post_id)
      WHERE id = ${id}
      RETURNING id, raw_input_ids, title, hook, angle, format, status, post_id, created_at
    `;

    if (topic.length === 0) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({ topic: topic[0] });
  } catch (error: unknown) {
    console.error("Update topic error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update topic";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/topics?id=...
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM topics
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete topic error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete topic";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
