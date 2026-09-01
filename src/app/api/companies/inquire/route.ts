import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyName, city, contactName, email, mobile, password, designation, gstin } = body;

    if (!companyName || !city || !contactName || !email || !mobile || !password) {
      return NextResponse.json(
        { error: "All required fields must be filled." },
        { status: 400 }
      );
    }

    if (gstin && gstin.trim()) {
      const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
      if (!gstinRegex.test(gstin.trim())) {
        return NextResponse.json(
          { error: "Invalid GSTIN format. Must be a valid 15-character GST Identification Number (e.g. 07AAAAA0000A1Z5)." },
          { status: 400 }
        );
      }
    }

    // 1. Create or find Company Brand Record
    const company = await db.company.upsert({
      where: { name: companyName },
      update: {},
      create: {
        name: companyName,
      },
    });

    // 2. Create Branch for specified city
    const branch = await db.companyBranch.create({
      data: {
        companyId: company.id,
        branchName: `${city} Branch`,
        city,
        status: "Lead",
        termsAgreementSigned: false,
      },
    });

    // 3. Create User Account for Company Contact
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        role: "COMPANY_CONTACT",
        isActive: true,
      },
    });

    // 4. Create CompanyContact record (isApproved starts false for fraud prevention gate)
    const companyContact = await db.companyContact.create({
      data: {
        userId: user.id,
        companyBranchId: branch.id,
        fullName: contactName,
        email,
        mobile,
        designation,
        isApproved: false, // Rule 7: Admin verification required before login
      },
    });

    return NextResponse.json(
      {
        message: "Inquiry submitted successfully! Your account is pending Admin approval.",
        contactId: companyContact.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Company Inquiry Error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to submit company inquiry." },
      { status: 500 }
    );
  }
}
