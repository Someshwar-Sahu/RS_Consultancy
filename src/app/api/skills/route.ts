import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const skills = await db.skill.findMany({
      where: category ? { category } : undefined,
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    });

    return NextResponse.json({ skills });
  } catch (error: any) {
    console.error("Get Skills Error:", error);
    return NextResponse.json({ error: "Failed to fetch skills." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category are required." }, { status: 400 });
    }

    const trimmed = name.trim();
    const skill = await db.skill.upsert({
      where: { name: trimmed },
      update: { category },
      create: { name: trimmed, category },
    });

    return NextResponse.json({ success: true, skill });
  } catch (error: any) {
    console.error("Create Skill Error:", error);
    return NextResponse.json({ error: "Failed to create skill." }, { status: 500 });
  }
}
