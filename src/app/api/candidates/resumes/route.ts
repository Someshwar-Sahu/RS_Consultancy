import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

async function getCandidateFromSession(session: any) {
  if (!session?.user?.email) return null;
  const email = session.user.email.toLowerCase().trim();
  const userId = session.user.id;

  // 1. Find by userId
  let candidate = null;
  if (userId) {
    candidate = await db.candidate.findUnique({
      where: { userId },
    });
  }

  // 2. Fallback to email
  if (!candidate) {
    candidate = await db.candidate.findFirst({
      where: { email },
    });

    if (candidate && !candidate.userId && userId) {
      try {
        candidate = await db.candidate.update({
          where: { id: candidate.id },
          data: { userId },
        });
      } catch (e) {
        // Continue if unique constraint is held
      }
    }
  }

  return candidate;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const candidate = await getCandidateFromSession(session);
    if (!candidate) {
      return NextResponse.json({ resumes: [] });
    }

    const resumes = await db.candidateResume.findMany({
      where: { candidateId: candidate.id },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ resumes });
  } catch (error: any) {
    console.error("Fetch Resumes Error:", error);
    return NextResponse.json({ error: "Failed to fetch resumes." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const candidate = await getCandidateFromSession(session);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found. Please complete profile setup first." }, { status: 404 });
    }

    const formData = await req.formData();
    const label = (formData.get("label") as string) || "General CV";
    const isDefault = formData.get("isDefault") === "true";
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Resume file size exceeds the 10MB maximum limit." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileUrl = await uploadFile(buffer, file.name, file.type || "application/pdf");

    const resume = await db.$transaction(async (tx) => {
      if (isDefault) {
        // Unset previous defaults
        await tx.candidateResume.updateMany({
          where: { candidateId: candidate.id },
          data: { isDefault: false },
        });
      }

      const newResume = await tx.candidateResume.create({
        data: {
          candidateId: candidate.id,
          label,
          fileUrl,
          isDefault,
        },
      });

      // Also update main resumeUrl if it was set to default or is first resume
      if (isDefault || !candidate.resumeUrl) {
        await tx.candidate.update({
          where: { id: candidate.id },
          data: { resumeUrl: fileUrl },
        });
      }

      return newResume;
    });

    // Extract structured data from uploaded resume
    try {
      const { parseResumePdf } = await import("@/lib/resumeParser");
      const parsed = await parseResumePdf(buffer);

      // Populate Education if candidate has none
      if (parsed.education && parsed.education.length > 0) {
        const existingEdu = await db.education.count({
          where: { candidateId: candidate.id },
        });
        if (existingEdu === 0) {
          for (const edu of parsed.education) {
            await db.education.create({
              data: {
                candidateId: candidate.id,
                institution: edu.institution,
                degree: edu.degree,
                passingYear: edu.dates ? parseInt(edu.dates.match(/\d{4}/)?.[0] || "2024") : null,
              },
            }).catch(() => {});
          }
        }
      }

      // Populate Skills if candidate has none
      const extractedSkillNames: string[] = Array.isArray(parsed.skills)
        ? parsed.skills
        : Object.values(parsed.skills).flat();

      if (extractedSkillNames.length > 0) {
        for (const skillName of extractedSkillNames.slice(0, 15)) {
          const trimmed = skillName.trim();
          if (trimmed.length > 1 && trimmed.length < 50) {
            let skill = await db.skill.findUnique({
              where: { name: trimmed },
            });
            if (!skill) {
              skill = await db.skill.create({
                data: { name: trimmed, category: candidate.preferredCategory || "IT" },
              }).catch(() => null);
            }
            if (skill) {
              await db.candidateSkill.upsert({
                where: {
                  candidateId_skillId: {
                    candidateId: candidate.id,
                    skillId: skill.id,
                  },
                },
                update: {},
                create: {
                  candidateId: candidate.id,
                  skillId: skill.id,
                },
              }).catch(() => {});
            }
          }
        }
      }
    } catch (parseErr) {
      console.error("Resume Extraction Background Error:", parseErr);
    }

    return NextResponse.json({ success: true, resume }, { status: 201 });
  } catch (error: any) {
    console.error("Upload Resume Error:", error);
    return NextResponse.json({ error: "Failed to upload resume." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { resumeId, isDefault, label } = await req.json();
    const candidate = await getCandidateFromSession(session);

    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found." }, { status: 404 });
    }

    const updated = await db.$transaction(async (tx) => {
      if (isDefault) {
        await tx.candidateResume.updateMany({
          where: { candidateId: candidate.id },
          data: { isDefault: false },
        });
      }

      const res = await tx.candidateResume.update({
        where: { id: resumeId, candidateId: candidate.id },
        data: {
          ...(isDefault !== undefined ? { isDefault } : {}),
          ...(label ? { label } : {}),
        },
      });

      if (isDefault) {
        await tx.candidate.update({
          where: { id: candidate.id },
          data: { resumeUrl: res.fileUrl },
        });
      }

      return res;
    });

    return NextResponse.json({ success: true, resume: updated });
  } catch (error: any) {
    console.error("Update Resume Error:", error);
    return NextResponse.json({ error: "Failed to update resume." }, { status: 500 });
  }
}
