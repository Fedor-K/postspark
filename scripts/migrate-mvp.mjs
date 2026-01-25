import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  try {
    console.log('Starting MVP migration...\n');

    // ============================================
    // 1. Расширяем таблицу users
    // ============================================

    // Боли целевой аудитории (массив строк)
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS audience_pains TEXT[]
    `;
    console.log('✓ users.audience_pains');

    // О чём пишет эксперт (массив тем)
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS topics TEXT[]
    `;
    console.log('✓ users.topics');

    // Стиль голоса: professional | casual | provocative
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS voice_style VARCHAR(50) DEFAULT 'professional'
    `;
    console.log('✓ users.voice_style');

    // Примеры фраз "как я говорю"
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS examples_good TEXT[]
    `;
    console.log('✓ users.examples_good');

    // ============================================
    // 2. Таблица raw_inputs (сырьё)
    // ============================================
    await sql`
      CREATE TABLE IF NOT EXISTS raw_inputs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Тип сырья: insight | client_talk | free
        type VARCHAR(50) NOT NULL,

        -- Содержимое (JSON с ответами на вопросы)
        content JSONB NOT NULL,

        -- Использовано ли для генерации тем
        used BOOLEAN DEFAULT FALSE,

        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ raw_inputs table');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_raw_inputs_user
      ON raw_inputs(user_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_raw_inputs_unused
      ON raw_inputs(user_id, used)
      WHERE used = FALSE
    `;
    console.log('✓ raw_inputs indexes');

    // ============================================
    // 3. Таблица topics (темы для постов)
    // ============================================
    await sql`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Из какого сырья родилась тема
        raw_input_ids INTEGER[],

        -- Заголовок/hook
        title TEXT NOT NULL,

        -- Первая строка поста
        hook TEXT,

        -- Под каким углом раскрыть
        angle TEXT,

        -- Формат: story | lesson | rant | case | list
        format VARCHAR(50),

        -- Статус: new | saved | written | archived
        status VARCHAR(20) DEFAULT 'new',

        -- Связь с постом (если написан)
        post_id INTEGER REFERENCES saved_posts(id) ON DELETE SET NULL,

        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ topics table');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_topics_user
      ON topics(user_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_topics_status
      ON topics(user_id, status)
    `;
    console.log('✓ topics indexes');

    // ============================================
    // 4. Добавляем topic_id в saved_posts
    // ============================================
    await sql`
      ALTER TABLE saved_posts
      ADD COLUMN IF NOT EXISTS topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL
    `;
    console.log('✓ saved_posts.topic_id');

    console.log('\n✅ MVP migration completed!');

  } catch (e) {
    console.error('Migration error:', e);
    process.exit(1);
  }
}

migrate();
