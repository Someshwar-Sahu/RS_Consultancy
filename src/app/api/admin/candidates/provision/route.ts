import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { ExperienceLevel, PreferredCategory, DlCategory, PoliceVerificationStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session?.user || !["ADMIN", "EMPLOYEE"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized. Staff access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      fullName,
      countryCode = "+91",
      mobile,
      email,
      currentLocation,
      preferredJobLocation = "Open to Relocate Pan-India",
      preferredCategory,
      experienceLevel = "Fresher",
      expectedSalary,
      noticePeriod = "Immediate",
      skills = [],
      // Driver Fields
      drivingLicenseNumber,
      dlCategory,
      vehicleTypes,
      policeVerificationStatus = "Verified",
      customPassword,
    } = body;

    if (!fullName || !mobile || !preferredCategory) {
      return NextResponse.json({ error: "Full Name, Mobile Number, and Category are required." }, { status: 400 });
    }

    // Format & Validate 10-digit mobile
    const digitsOnly = String(mobile).replace(/\D/g, "");
    if (countryCode === "+91" && digitsOnly.length !== 10) {
      return NextResponse.json({ error: "Mobile number must be exactly 10 digits for India (+91)." }, { status: 400 });
    }
    const fullMobile = `${countryCode} ${digitsOnly}`;

    // 1. Anti-Duplicate Hard Checks
    const existingByMobile = await db.candidate.findUnique({
      where: { mobile: fullMobile },
      select: { id: true, fullName: true, createdAt: true, createdByUserId: true },
    });
    if (existingByMobile) {
      return NextResponse.json(
        {
          error: `A candidate/driver with mobile number ${fullMobile} already exists in the system (Created: ${new Date(existingByMobile.createdAt).toLocaleDateString()}).`,
        },
        { status: 409 }
      );
    }

    // 2. Anti-Duplicate Driving License Check
    if (drivingLicenseNumber) {
      const existingByDL = await db.candidate.findFirst({
        where: { drivingLicenseNumber: drivingLicenseNumber.trim() },
        select: { id: true, fullName: true, mobile: true },
      });
      if (existingByDL) {
        return NextResponse.json(
          {
            error: `Driver with Driving License Number "${drivingLicenseNumber}" is already registered under ${existingByDL.fullName} (${existingByDL.mobile}).`,
          },
          { status: 409 }
        );
      }
    }

    // 3. Resolve Email (Optional for Drivers / Blue-collar)
    let finalEmail = email ? String(email).toLowerCase().trim() : "";
    if (!finalEmail) {
      finalEmail = `staff.driver.${digitsOnly}@rsbridge.internal`;
    }

    // 4. Generate Initial Login Password
    const plainPassword = customPassword || `RS@${digitsOnly.slice(-4)}!`;
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // 5. Create User Login Account
    const user = await db.user.upsert({
      where: { email: finalEmail },
      update: { passwordHash, role: "CANDIDATE" },
      create: {
        email: finalEmail,
        passwordHash,
        role: "CANDIDATE",
      },
    });

    // 6. Create Candidate / Driver Profile with Attribution
    const candidate = await db.candidate.create({
      data: {
        userId: user.id,
        fullName: fullName.trim(),
        mobile: fullMobile,
        email: finalEmail,
        currentLocation: currentLocation || "Noida, Uttar Pradesh",
        preferredJobLocation,
        preferredCategory: preferredCategory as PreferredCategory,
        experienceLevel: experienceLevel as ExperienceLevel,
        expectedSalary: expectedSalary || null,
        noticePeriod: noticePeriod || "Immediate",
        drivingLicenseNumber: drivingLicenseNumber ? drivingLicenseNumber.trim() : null,
        dlCategory: dlCategory ? (dlCategory as DlCategory) : null,
        vehicleTypes: vehicleTypes ? (Array.isArray(vehicleTypes) ? JSON.stringify(vehicleTypes) : vehicleTypes) : null,
        policeVerificationStatus: policeVerificationStatus ? (policeVerificationStatus as PoliceVerificationStatus) : PoliceVerificationStatus.NotSubmitted,
        createdByUserId: session.user.id,
        source: userRole === "ADMIN" ? "ADMIN_PROVISIONED" : "RECRUITER_PROVISIONED",
      },
    });

    // 7. Attach and upsert skills
    if (Array.isArray(skills) && skills.length > 0) {
      for (const skillName of skills) {
        const trimmed = String(skillName).trim();
        if (!trimmed) continue;

        const skill = await db.skill.upsert({
          where: { name: trimmed },
          create: { name: trimmed, category: preferredCategory },
          update: {},
        });

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
    }

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
      candidate: {
        fullName: candidate.fullName,
        mobile: candidate.mobile,
        email: candidate.email,
        category: candidate.preferredCategory,
      },
      credentials: {
        loginIdentifier: fullMobile,
        loginEmail: finalEmail,
        temporaryPassword: plainPassword,
      },
    });
  } catch (error: any) {
    console.error("Provision Candidate Error:", error);
    return NextResponse.json(
      { error: "Failed to provision candidate/driver: " + (error.message || "") },
      { status: 500 }
    );
  }
}
