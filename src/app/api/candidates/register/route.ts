import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import bcrypt from "bcryptjs";
import { ExperienceLevel, PreferredCategory, DlCategory, PoliceVerificationStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const fullName = formData.get("fullName") as string;
    const countryCode = (formData.get("countryCode") as string) || "+91";
    const rawMobile = (formData.get("mobile") as string) || "";
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const password = formData.get("password") as string;
    const currentLocation = formData.get("currentLocation") as string;
    const preferredJobLocation = (formData.get("preferredJobLocation") as string) || null;
    const categoryInput = formData.get("preferredCategory") as string;
    const expInput = formData.get("experienceLevel") as string;
    const expectedSalary = formData.get("expectedSalary") as string;
    const noticePeriod = formData.get("noticePeriod") as string;
    const rawSkills = formData.get("skills") as string; // JSON string array
    const resumeFile = formData.get("resume") as File | null;

    // Driver Specific Fields
    const drivingLicenseNumber = (formData.get("drivingLicenseNumber") as string) || null;
    const dlCategoryInput = formData.get("dlCategory") as string;
    const vehicleTypes = (formData.get("vehicleTypes") as string) || null;
    const policeVerificationStatusInput = formData.get("policeVerificationStatus") as string;

    if (!fullName || !rawMobile || !email || !categoryInput) {
      return NextResponse.json(
        { error: "Full Name, Mobile, Email, and Category are required." },
        { status: 400 }
      );
    }

    // Standardize 10-digit mobile number with country code
    const digitsOnly = rawMobile.replace(/\D/g, "").slice(-10);
    if (countryCode === "+91" && digitsOnly.length !== 10) {
      return NextResponse.json(
        { error: "Mobile number must be exactly 10 digits for India (+91)." },
        { status: 400 }
      );
    }
    const fullMobile = `${countryCode} ${digitsOnly}`;

    // 1. Create or Find User Login Account securely without unauthenticated password overwrite or mobile hijack
    let userId: string | null = null;
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in to update your profile or apply for jobs." },
        { status: 400 }
      );
    }

    const existingCandidateMobile = await db.candidate.findFirst({ where: { mobile: fullMobile } });
    if (existingCandidateMobile) {
      return NextResponse.json(
        { error: "A candidate profile with this mobile number already exists. Please log in to your account." },
        { status: 400 }
      );
    }

    const initialPassword = (password && password.length >= 6) ? password : rawMobile;
    const passwordHash = await bcrypt.hash(initialPassword, 10);
    const newUser = await db.user.create({
      data: {
        email,
        passwordHash,
        role: "CANDIDATE",
      },
    });
    userId = newUser.id;

    const preferredCategory = categoryInput as PreferredCategory;
    const experienceLevel = (expInput as ExperienceLevel) || ExperienceLevel.Fresher;
    const dlCategory = dlCategoryInput ? (dlCategoryInput as DlCategory) : null;
    const policeVerificationStatus = policeVerificationStatusInput
      ? (policeVerificationStatusInput as PoliceVerificationStatus)
      : PoliceVerificationStatus.NotSubmitted;

    // 2. Process local/cloud resume file upload
    let resumeUrl = "";
    if (resumeFile && resumeFile.size > 0) {
      const arrayBuffer = await resumeFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      resumeUrl = await uploadFile(buffer, resumeFile.name, resumeFile.type || "application/pdf");
    }

    // 3. Create new Candidate record
    const candidate = await db.candidate.create({
      data: {
        userId,
        fullName,
        mobile: fullMobile,
        email,
        currentLocation,
        preferredJobLocation,
        preferredCategory,
        experienceLevel,
        expectedSalary,
        noticePeriod,
        drivingLicenseNumber,
        dlCategory,
        vehicleTypes,
        policeVerificationStatus,
        resumeUrl: resumeUrl || null,
      },
    });

    // 4. Save Candidate Resume in `resumes` table
    if (resumeUrl) {
      await db.candidateResume.create({
        data: {
          candidateId: candidate.id,
          label: "Primary Resume",
          fileUrl: resumeUrl,
          isDefault: true,
        },
      });
    }

    // 5. Save Tagged Skills
    if (rawSkills) {
      try {
        const skillList: string[] = JSON.parse(rawSkills);
        for (const skillName of skillList) {
          const trimmed = skillName.trim();
          if (!trimmed) continue;

          // Upsert skill in master list
          const skill = await db.skill.upsert({
            where: { name: trimmed },
            create: { name: trimmed, category: categoryInput },
            update: {},
          });

          // Link to candidate
          await db.candidateSkill.upsert({
            where: {
              candidateId_skillId: {
                candidateId: candidate.id,
                skillId: skill.id,
              },
            },
            create: {
              candidateId: candidate.id,
              skillId: skill.id,
            },
            update: {},
          });
        }
      } catch (e) {
        console.error("Skill parsing error:", e);
      }
    }

    return NextResponse.json(
      {
        message: "Profile saved successfully!",
        candidateId: candidate.id,
        email,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Candidate Profile Save Error:", error);
    return NextResponse.json(
      { error: "Failed to save profile: " + (error.message || "") },
      { status: 500 }
    );
  }
}
