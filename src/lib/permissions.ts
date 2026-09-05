import { UserRole } from "@prisma/client";

export interface ViewerContext {
    role?: UserRole;
    companyBranchId?: string;
    termsSigned?: Boolean;
    applicationStatus?: string;
    driverLiabilityAck?: boolean;
    isDriverRequirement?: boolean;
}

export function maskCandidateForViewer<T extends { mobile?: string; email?: string }>(
    candidate: T,
    viewer: ViewerContext
): T {
    if (viewer.role === "ADMIN" || viewer.role === "EMPLOYEE") {
        return candidate;
    }
    if (viewer.role === "COMPANY_CONTACT") {
        const isInterviewOrLater = [
            "InterviewScheduled",
            "Offered",
            "Joined",
        ].includes(viewer.applicationStatus || "");
        const driverAckValid = !viewer.isDriverRequirement || Boolean(viewer.driverLiabilityAck);
        const canUnmask = isInterviewOrLater && Boolean(viewer.termsSigned) && driverAckValid;

        if (!canUnmask) {
            return {
                ...candidate,
                mobile: "•••••••••• (Masked until Interview Scheduled & Terms Signed)",
                email: "•••••••••• (Masked until Interview Scheduled & Terms Signed)",
            };
        }
    }
    return candidate;
}

export function maskCompanyForViewer<T extends { companyName?: string; brandName?: string }>(
    company: T,
    viewer: ViewerContext
): T {
    // Mask company brand for candidates and unauthenticated guest visitors to prevent disintermediation
    if (!viewer.role || viewer.role === "CANDIDATE") {
        return {
            ...company,
            companyName: "[Confidential Client]",
            brandName: "[Confidential Client]",
        };
    }
    return company;
}

export function sanitizeFinancials<T extends Record<string, any>>(
    data: T,
    viewerRole: UserRole
): T {
    if (viewerRole === "EMPLOYEE") {
        const sanitized = { ...data };
        delete sanitized.commissionRate;
        delete sanitized.commissionAmount;
        delete sanitized.defaultCommissionRate;
        delete sanitized.totalAmount;
        return sanitized;
    }
    return data;
}