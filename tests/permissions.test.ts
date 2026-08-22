import { describe, it, expect } from "vitest";
import {
    maskCandidateForViewer,
    maskCompanyForViewer,
    sanitizeFinancials,
} from "../src/lib/permissions";

describe("Security & Field Masking (Anti-Disintermediation)", () => {
    // --- CANDIDATE MASKING TESTS ---
    describe("Candidate Masking Rules", () => {
        const rawCandidate = {
            fullName: "Rahul Sharma",
            mobile: "9876543210",
            email: "rahul@example.com",
        };

        it("POSITIVE: Allows ADMIN to see unmasked candidate contact info", () => {
            const result = maskCandidateForViewer(rawCandidate, { role: "ADMIN" });
            expect(result.mobile).toBe("9876543210");
            expect(result.email).toBe("rahul@example.com");
        });

        it("POSITIVE: Allows EMPLOYEE to see unmasked candidate contact info", () => {
            const result = maskCandidateForViewer(rawCandidate, { role: "EMPLOYEE" });
            expect(result.mobile).toBe("9876543210");
            expect(result.email).toBe("rahul@example.com");
        });

        it("POSITIVE: Allows COMPANY_CONTACT to see contact info IF status is InterviewScheduled AND terms are signed", () => {
            const result = maskCandidateForViewer(rawCandidate, {
                role: "COMPANY_CONTACT",
                applicationStatus: "InterviewScheduled",
                termsSigned: true,
            });
            expect(result.mobile).toBe("9876543210");
            expect(result.email).toBe("rahul@example.com");
        });

        it("NEGATIVE: MASKS candidate contact info from COMPANY_CONTACT if status is Applied (even if terms signed)", () => {
            const result = maskCandidateForViewer(rawCandidate, {
                role: "COMPANY_CONTACT",
                applicationStatus: "Applied",
                termsSigned: true,
            });
            expect(result.mobile).toContain("Masked");
            expect(result.email).toContain("Masked");
        });

        it("NEGATIVE: MASKS candidate contact info from COMPANY_CONTACT if terms are NOT signed (even at InterviewScheduled)", () => {
            const result = maskCandidateForViewer(rawCandidate, {
                role: "COMPANY_CONTACT",
                applicationStatus: "InterviewScheduled",
                termsSigned: false,
            });
            expect(result.mobile).toContain("Masked");
            expect(result.email).toContain("Masked");
        });
    });

    // --- COMPANY MASKING TESTS ---
    describe("Company Identity Masking Rules", () => {
        const rawCompany = {
            companyName: "Acme Tech Corp",
            brandName: "Acme Inc",
        };

        it("NEGATIVE: MASKS company identity from CANDIDATE", () => {
            const result = maskCompanyForViewer(rawCompany, { role: "CANDIDATE" });
            expect(result.companyName).toBe("[Confidential Client]");
        });

        it("POSITIVE: Shows company identity to EMPLOYEE", () => {
            const result = maskCompanyForViewer(rawCompany, { role: "EMPLOYEE" });
            expect(result.companyName).toBe("Acme Tech Corp");
        });
    });

    // --- FINANCIAL MASKING TESTS ---
    describe("Financial Sanitization Rules", () => {
        const rawFinancials = {
            placementId: "123",
            candidateName: "Rahul Sharma",
            commissionRate: 15.0,
            commissionAmount: 150000,
            totalAmount: 177000,
        };

        it("NEGATIVE: Strips all financial fields when viewed by EMPLOYEE role", () => {
            const result = sanitizeFinancials(rawFinancials, "EMPLOYEE");
            expect(result.commissionRate).toBeUndefined();
            expect(result.commissionAmount).toBeUndefined();
            expect(result.totalAmount).toBeUndefined();
            expect(result.candidateName).toBe("Rahul Sharma");
        });

        it("POSITIVE: Retains financial fields when viewed by ADMIN role", () => {
            const result = sanitizeFinancials(rawFinancials, "ADMIN");
            expect(result.commissionRate).toBe(15.0);
            expect(result.commissionAmount).toBe(150000);
            expect(result.totalAmount).toBe(177000);
        });
    });
});
