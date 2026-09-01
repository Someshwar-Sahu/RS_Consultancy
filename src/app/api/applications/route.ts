import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { assignApplicationRoundRobin } from "@/lib/assignment";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = session.user.id;

    if (userRole === "CANDIDATE") {
      const candidate = await db.candidate.findUnique({
        where: { userId },
      });
      if (!candidate) {
        return NextResponse.json({ error: "Candidate profile not found." }, { status: 404 });
      }

      const applications = await db.application.findMany({
        where: { candidateId: candidate.id },
        include: {
          requirement: {
            include: {
              branch: {
                include: { company: true },
              },
            },
          },
          resume: true,
          history: {
            orderBy: { changedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ applications });
    }

    if (userRole === "COMPANY_CONTACT") {
      const contact = await db.companyContact.findFirst({
        where: { userId },
      });
      if (!contact) {
        return NextResponse.json({ error: "No company contact profile found." }, { status: 403 });
      }

      // CRITICAL RECRUITMENT GATE:
      // The client company only sees candidates who have been verified and Shortlisted by an Employee/Admin!
      // Raw unscreened 'Applied' candidates remain in the internal RS Bridge recruiter queue until verified.
      const applications = await db.application.findMany({
        where: {
          requirement: {
            companyBranchId: contact.companyBranchId,
          },
          status: {
            in: ["Shortlisted", "InterviewScheduled", "Offered", "Joined", "Rejected", "Withdrawn"],
          },
        },
        include: {
          candidate: {
            include: {
              skills: { include: { skill: true } },
              education: true,
              experiences: true,
            },
          },
          requirement: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ applications });
    }

    // ADMIN or EMPLOYEE
    const applications = await db.application.findMany({
      include: {
        candidate: {
          include: {
            skills: { include: { skill: true } },
            education: true,
            experiences: true,
          },
        },
        requirement: {
          include: {
            branch: { include: { company: true } },
          },
        },
        resume: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error: any) {
    console.error("Fetch Applications Error:", error);
    return NextResponse.json({ error: "Failed to fetch applications." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const requestedWith = req.headers.get("x-requested-with");
    const origin = req.headers.get("origin");
    if (!requestedWith && !origin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Forbidden: Missing anti-CSRF request origin header." }, { status: 403 });
    }

    const userId = session.user.id;
    const candidate = await db.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Only registered candidates can apply." }, { status: 403 });
    }

    if (candidate.isBlacklisted) {
      return NextResponse.json(
        { error: "Application rejected: Your candidate profile has been flagged as restricted by agency administration." },
        { status: 403 }
      );
    }

    const { jobRequirementId, resumeId } = await req.json();
    if (!jobRequirementId) {
      return NextResponse.json({ error: "Job requirement ID is required." }, { status: 400 });
    }

    // Global Candidate Availability Check: Block applications if candidate has an active placement
    const activePlacement = await db.placement.findFirst({
      where: {
        application: { candidateId: candidate.id },
        isActive: true,
      },
    });

    if (activePlacement) {
      return NextResponse.json(
        { error: "Active Placement Lock: Candidates currently placed in active client roles cannot apply to new mandates until employment status changes." },
        { status: 409 }
      );
    }

    // Check if requirement exists and is Open
    const requirement = await db.jobRequirement.findUnique({
      where: { id: jobRequirementId },
    });

    if (!requirement || requirement.status !== "Open") {
      return NextResponse.json({ error: "This position is no longer accepting applications." }, { status: 400 });
    }

    // Check for duplicate application
    const existingApp = await db.application.findUnique({
      where: {
        candidateId_jobRequirementId: {
          candidateId: candidate.id,
          jobRequirementId,
        },
      },
    });

    if (existingApp) {
      if (existingApp.status === "Rejected") {
        const coolOffDays = 90;
        const coolOffExpiry = new Date(existingApp.updatedAt);
        coolOffExpiry.setDate(coolOffExpiry.getDate() + coolOffDays);
        if (new Date() < coolOffExpiry) {
          return NextResponse.json(
            { error: `Cool-off Period Active: Candidates rejected for a mandate must wait 90 days before re-applying.` },
            { status: 429 }
          );
        }
      }
      return NextResponse.json(
        { error: "You have already applied for this position.", applicationId: existingApp.id },
        { status: 409 }
      );
    }

    // Auto-assign to employee via round-robin
    const assignedUserId = await assignApplicationRoundRobin();

    const application = await db.application.create({
      data: {
        candidateId: candidate.id,
        jobRequirementId,
        resumeId: resumeId || null,
        assignedUserId,
        status: "Applied",
        history: {
          create: {
            fromStatus: "Applied",
            toStatus: "Applied",
            changedByUserId: session.user.id || "SYSTEM",
            notes: "Candidate applied online.",
          },
        },
      },
      include: {
        requirement: true,
      },
    });

    // If assigned to an employee, send in-app notification
    if (assignedUserId) {
      await db.inAppNotification.create({
        data: {
          userId: assignedUserId,
          type: "APPLICATION_ASSIGNED",
          title: "New Application Assigned",
          message: `${candidate.fullName} applied for ${requirement.title}.`,
          linkUrl: `/employee/candidates/${candidate.id}`,
        },
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error: any) {
    console.error("Application Submit Error:", error);
    return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = session.user.id;
    const {
      applicationId,
      status,
      notes,
      interviewDate,
      interviewTime,
      interviewMode,
      meetingLinkOrVenue,
      roundName,
      offeredCtc,
      agreedCtc,
      joiningDate,
      assessmentLink,
    } = await req.json();

    if (!applicationId || !status) {
      return NextResponse.json({ error: "Application ID and new status are required." }, { status: 400 });
    }

    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        requirement: { include: { branch: { include: { company: true } } } },
        candidate: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    // Permission checks by role
    if (userRole === "CANDIDATE") {
      if (application.candidate.userId !== userId) {
        return NextResponse.json({ error: "Forbidden: Not your application." }, { status: 403 });
      }
      // Candidates can only withdraw or confirm attendance
      if (status !== "Withdrawn" && status !== application.status) {
        return NextResponse.json(
          { error: "Candidates can only withdraw or respond to active interview/offer stages." },
          { status: 403 }
        );
      }
    } else if (userRole === "COMPANY_CONTACT") {
      const contact = await db.companyContact.findFirst({
        where: { userId },
      });
      if (!contact || contact.companyBranchId !== application.requirement.companyBranchId) {
        return NextResponse.json({ error: "Forbidden: Not authorized for this requirement." }, { status: 403 });
      }
    }

    const previousStatus = application.status;

    // Compose rich audit note based on status
    let auditNote = notes || `Status updated to ${status} by ${userRole}.`;
    let notifTitle = `Application Update: ${status}`;
    let notifMessage = `Your application for ${application.requirement.title} has been moved to ${status}.`;

    if (status === "InterviewScheduled") {
      const formattedDate = interviewDate || "Soon";
      const formattedTime = interviewTime || "";
      const modeText = interviewMode === "offline" ? "In-Person Office Interview" : "Online Video Interview";
      const venueText = meetingLinkOrVenue ? ` (${meetingLinkOrVenue})` : "";
      const roundText = roundName ? ` [${roundName}]` : "";

      auditNote = `🗓️ Interview Scheduled: ${modeText} on ${formattedDate} at ${formattedTime}${venueText}.${roundText}${notes ? ` Notes: ${notes}` : ""}`;
      notifTitle = `🗓️ Interview Invitation: ${application.requirement.title}`;
      notifMessage = `You are invited to an interview for ${application.requirement.title} on ${formattedDate} at ${formattedTime} via ${modeText}. Link/Venue: ${meetingLinkOrVenue || "To be shared"}.`;
    } else if (status === "Offered") {
      const ctcText = offeredCtc ? ` ₹${Number(offeredCtc).toLocaleString("en-IN")}` : "";
      const dateText = joiningDate ? ` (Expected Joining: ${joiningDate})` : "";
      auditNote = `🎉 Job Offer Extended:${ctcText} annual CTC${dateText}.${notes ? ` Notes: ${notes}` : ""}`;
      notifTitle = `🎉 Job Offer Extended: ${application.requirement.title}!`;
      notifMessage = `Congratulations! ${application.requirement.branch.company.name} has extended you a job offer for ${application.requirement.title}${ctcText}!`;
    } else if (status === "Joined") {
      const ctcText = agreedCtc ? ` ₹${Number(agreedCtc).toLocaleString("en-IN")}` : "";
      auditNote = `✅ Candidate Confirmed Joined: Final CTC${ctcText} on ${joiningDate || new Date().toLocaleDateString()}. Placement finalized!`;
      notifTitle = `🏆 Placement Confirmed: Welcome Aboard!`;
      notifMessage = `Congratulations! Your placement at ${application.requirement.branch.company.name} as ${application.requirement.title} is confirmed.`;
    }

    // Update status and record history
    const [updated] = await db.$transaction([
      db.application.update({
        where: { id: applicationId },
        data: { status },
      }),
      db.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: previousStatus,
          toStatus: status,
          changedByUserId: userId || "SYSTEM",
          notes: auditNote,
        },
      }),
    ]);

    // FLOW 3: If status is Joined, automatically create Placement and Draft Invoice
    if (status === "Joined") {
      const ctcValue = agreedCtc
        ? Number(agreedCtc)
        : Number(application.requirement.maxSalaryLpa || 5) * 100000;
      const commissionRate = Number(
        application.requirement.commissionRateOverride ||
          application.requirement.branch.defaultCommissionRate ||
          8.33
      );
      const commissionAmount = (ctcValue * commissionRate) / 100;
      const replacementWindowDays =
        application.requirement.replacementWindowDaysOverride ||
        application.requirement.branch.defaultReplacementWindowDays ||
        60;
      const paymentTermsDays =
        application.requirement.paymentTermsDaysOverride ||
        application.requirement.branch.paymentTermsDays ||
        30;

      const placementDate = joiningDate ? new Date(joiningDate) : new Date();

      const existingPlacement = await db.placement.findUnique({
        where: { applicationId },
      });

      if (!existingPlacement) {
        const placement = await db.placement.create({
          data: {
            applicationId,
            joiningDate: placementDate,
            agreedCtc: ctcValue,
            commissionRateApplied: commissionRate,
            commissionAmount,
            replacementWindowDaysApplied: replacementWindowDays,
            isActive: true,
            replacementStatus: "None",
          },
        });

        if (!application.requirement.isReplacement) {
          const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
          const dueDate = new Date(placementDate);
          dueDate.setDate(dueDate.getDate() + paymentTermsDays);

          await db.invoice.create({
            data: {
              placementId: placement.id,
              invoiceNumber,
              subtotalAmount: commissionAmount,
              taxAmount: 0,
              totalAmount: commissionAmount,
              paymentTermsDaysApplied: paymentTermsDays,
              dueDate,
              status: "Draft",
            },
          }).catch(console.error);
        }

        // Atomically increment vacanciesFilled
        await db.jobRequirement.update({
          where: { id: application.jobRequirementId },
          data: { vacanciesFilled: { increment: 1 } },
        }).catch(console.error);
      }
    }

    // Send in-app notification to candidate
    if (application.candidate?.userId) {
      await db.inAppNotification.create({
        data: {
          userId: application.candidate.userId,
          type: status === "InterviewScheduled" ? "INTERVIEW_SCHEDULED" : "APPLICATION_STATUS_UPDATE",
          title: notifTitle,
          message: notifMessage,
          linkUrl: "/candidate/applications",
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, application: updated, note: auditNote });
  } catch (error: any) {
    console.error("Application Status Update Error:", error);
    return NextResponse.json({ error: "Failed to update application status." }, { status: 500 });
  }
}

