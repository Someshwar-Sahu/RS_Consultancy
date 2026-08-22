import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { ExperienceLevel, PreferredCategory } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const fullName = formData.get("fullName") as string;
    const mobile = formData.get("mobile") as string;
    const email = formData.get("email") as string;
    const currentLocation = formData.get("currentLocation") as string;
    const categoryInput = formData.get("preferredCategory") as string;
    const expInput = formData.get("experienceLevel") as string;
    const expectedSalary = formData.get("expectedSalary") as string;
    const noticePeriod = formData.get("noticePeriod") as string;
    const resumeFile = formData.get("resume") as File | null;

    if (!fullName || !mobile || !email || !categoryInput) {
      return NextResponse.json(
        { error: "Full Name, Mobile, Email, and Category are required." },
        { status: 400 }
      );
    }

    // Cast string inputs to strict Prisma Enums
    const preferredCategory = categoryInput as PreferredCategory;
    const experienceLevel = (expInput as ExperienceLevel) || ExperienceLevel.Fresher;

    // Process local file upload using src/lib/storage.ts
    let resumeUrl = "";
    if (resumeFile && resumeFile.size > 0) {
      resumeUrl = await uploadFile(resumeFile);
    }

    // Create or update candidate record (Deduplication key: mobile)
    const candidate = await db.candidate.upsert({
      where: { mobile },
      update: {
        fullName,
        email,
        currentLocation,
        preferredCategory,
        experienceLevel,
        expectedSalary,
        noticePeriod,
        ...(resumeUrl ? { resumeUrl } : {}),
      },
      create: {
        fullName,
        mobile,
        email,
        currentLocation,
        preferredCategory,
        experienceLevel,
        expectedSalary,
        noticePeriod,
        resumeUrl: resumeUrl || null,
      },
    });

    return NextResponse.json(
      { message: "Registration successful!", candidateId: candidate.id, resumeUrl },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Candidate Registration Error:", error);
    return NextResponse.json(
      { error: "Failed to submit candidate registration." },
      { status: 500 }
    );
  }
}
