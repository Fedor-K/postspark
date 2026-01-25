import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Типы сырья
type RawInputType = "insight" | "client_talk" | "free";

interface RawInputContent {
  // insight
  thought?: string;
  source?: string;
  why_important?: string;

  // client_talk
  client_who?: string;
  problem?: string;
  advice?: string;
  aha_moment?: string;

  // free
  text?: string;
}

// GET /api/raw-inputs?email=...&unused=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const unusedOnly = searchParams.get("unused") === "true";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user[0].id;

    let rawInputs;
    if (unusedOnly) {
      rawInputs = await sql`
        SELECT id, type, content, used, created_at
        FROM raw_inputs
        WHERE user_id = ${userId} AND used = FALSE
        ORDER BY created_at DESC
      `;
    } else {
      rawInputs = await sql`
        SELECT id, type, content, used, created_at
        FROM raw_inputs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
    }

    return NextResponse.json({ rawInputs });
  } catch (error: unknown) {
    console.error("Get raw inputs error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get raw inputs";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/raw-inputs
export async function POST(request: NextRequest) {
  try {
    const { email, type, content } = await request.json() as {
      email: string;
      type: RawInputType;
      content: RawInputContent;
    };

    if (!email || !type || !content) {
      return NextResponse.json(
        { error: "Email, type, and content are required" },
        { status: 400 }
      );
    }

    // Валидация типа
    const validTypes: RawInputType[] = ["insight", "client_talk", "free"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const user = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rawInput = await sql`
      INSERT INTO raw_inputs (user_id, type, content)
      VALUES (${user[0].id}, ${type}, ${JSON.stringify(content)})
      RETURNING id, type, content, used, created_at
    `;

    return NextResponse.json({ rawInput: rawInput[0] });
  } catch (error: unknown) {
    console.error("Create raw input error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create raw input";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT /api/raw-inputs (update)
export async function PUT(request: NextRequest) {
  try {
    const { id, type, content } = await request.json() as {
      id: number;
      type?: RawInputType;
      content?: RawInputContent;
    };

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updates: string[] = [];
    const values: Record<string, unknown> = { id };

    if (type) {
      const validTypes: RawInputType[] = ["insight", "client_talk", "free"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const rawInput = await sql`
      UPDATE raw_inputs
      SET
        type = COALESCE(${type || null}, type),
        content = COALESCE(${content ? JSON.stringify(content) : null}, content)
      WHERE id = ${id}
      RETURNING id, type, content, used, created_at
    `;

    if (rawInput.length === 0) {
      return NextResponse.json({ error: "Raw input not found" }, { status: 404 });
    }

    return NextResponse.json({ rawInput: rawInput[0] });
  } catch (error: unknown) {
    console.error("Update raw input error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update raw input";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/raw-inputs?id=...
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM raw_inputs
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Raw input not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete raw input error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete raw input";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
