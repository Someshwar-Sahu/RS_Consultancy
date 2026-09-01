import fs from "fs";
import path from "path";
import { generateCandidateResumePdf, CandidateResumeData } from "../src/lib/pdf";
import { ViewerContext } from "../src/lib/permissions";

async function runSimulation() {
  console.log("\n================================================================================");
  console.log("    RS BRIDGE CONSULTANCY — HIGH-FIDELITY PDF SIMULATION RUNNER");
  console.log("================================================================================\n");

  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Exact data from Someshwar Sahu's resume
  const someshwarResume: CandidateResumeData = {
    id: "cand-someshwar-01",
    fullName: "Someshwar Sahu",
    mobile: "+91 98765 43210",
    email: "someshwar.sahu@iiitv.ac.in",
    currentLocation: "Gandhinagar, Gujarat",
    preferredJobLocation: "NCR / Bengaluru / Remote",
    experienceLevel: "Intermediate",
    totalExperienceYears: 2,
    preferredCategory: "IT",
    expectedSalary: "18 LPA",
    noticePeriod: "Immediate",
    createdAt: new Date("2026-08-01"),
    headline: "B.Tech Computer Science and Engineering @ IIIT Vadodara | Full-Stack & Systems Developer",
    education: [
      {
        institution: "Indian Institute of Information Technology Vadodara",
        degree: "B.Tech in Computer Science and Engineering",
        score: "CPI: 7.21/10.0",
        location: "Gandhinagar, Gujarat, India",
        dates: "Aug 2024 - May 2028",
      },
      {
        institution: "Suryabali Singh Public School",
        degree: "Class XII (Higher Secondary) - CBSE",
        score: "Percentage: 88.80%",
        location: "Jaunpur, Uttar Pradesh",
        dates: "Apr 2023 - Mar 2024",
      },
      {
        institution: "St. Patrick's Sr. Sec. School",
        degree: "Class X (Secondary) - CBSE",
        score: "Percentage: 87.00%",
        location: "Jaunpur, Uttar Pradesh",
        dates: "Apr 2021 - Mar 2022",
      },
    ],
    projects: [
      {
        title: "StreamFlix - Full-Stack Streaming Platform",
        techStack: "React, React Native, Electron, FastAPI, PostgreSQL | GitHub",
        linkUrl: "https://github.com/someshwarsahu/streamflix",
        bullets: [
          "Solo-built a Netflix-style streaming platform spanning Web (React/Vite), Mobile (React Native), and Desktop (Electron) apps on a single FastAPI backend, exploring end-to-end video streaming architecture.",
          "Implemented adaptive multi-resolution HLS playback (1080p/720p/480p) with automatic and manual quality switching, powered by asynchronous transcoding via Celery workers, Redis queues, and FFmpeg.",
          "Designed multi-profile user accounts with a two-step auth flow (account token + profile token), cross-device watch-progress sync, watchlists, and an admin dashboard for content, user, and storage management.",
          "Established a shared monorepo (pnpm workspaces) with a common API client and TypeScript type package across all three clients, maintained via versioned architecture and phase-tracking documentation.",
        ],
      },
      {
        title: "Jewellery Billing App - GST Billing & Business Management",
        techStack: "Python, FastAPI, SQLModel, PostgreSQL | GitHub",
        linkUrl: "https://github.com/someshwarsahu/jewellery-billing",
        bullets: [
          "Engineered a GST-compliant billing system deployed live at a jewellery shop for 30+ days, handling sale/purchase invoicing with automatic CGST/SGST/IGST calculation across 5 payment modes.",
          "Architected a double-sided party ledger unifying invoices, credit/debit notes, advances, and opening balances into a single live net balance per party, with oldest-due-first partial settlement.",
          "Integrated Google Gemini Vision to extract fields from photographed handwritten bills, and generated GSTR-1/GSTR-3B tax reports with month-level locking and formatted .xlsx exports.",
          "Tested by multiple jewellery shop owners in a live GST billing context, surfacing and fixing 20+ bugs across invoicing, ledger, and tax calculation flows.",
        ],
      },
    ],
    achievements: [
      "Solved 300+ problems across LeetCode, CodeChef, and Codeforces, with a peak contest rating of 1521 on LeetCode.",
      "Actively competes on CodeChef and Codeforces with regular contest participation, reflecting sustained algorithmic problem-solving practice across multiple platforms.",
    ],
    skills: {
      "Languages": ["C", "C++", "Python", "C#", "SQL", "HTML", "CSS", "JavaScript", "TypeScript"],
      "Core CS": ["Data Structures & Algorithms", "Object-Oriented Programming", "DBMS", "Operating Systems"],
      "Frameworks & Libraries": ["React.js", "React Native", "Electron", "Flask", "FastAPI", "Tailwind CSS", "Node.js"],
      "Tools & Technologies": ["PostgreSQL", "SQLite", "Firebase", "Supabase", "Celery", "Redis", "FFmpeg", "Docker", "Git", "GitHub", "VS Code"],
    },
  };

  // Driver Candidate Data
  const driverResume: CandidateResumeData = {
    id: "cand-ramesh-driver",
    fullName: "Ramesh Singh",
    mobile: "+91 98112 23344",
    email: "ramesh.driver@email.com",
    currentLocation: "Noida Sector 18, UP",
    preferredJobLocation: "Delhi / NCR",
    experienceLevel: "Expert",
    totalExperienceYears: 8.5,
    preferredCategory: "Driver",
    expectedSalary: "Rs 35,000 / month",
    noticePeriod: "Immediate",
    createdAt: new Date("2026-08-01"),
    headline: "Commercial Fleet Heavy Vehicle Driver | Valid Pan-India Commercial Badge",
    licenseType: "Commercial HMV & LMV (Pan-India)",
    vehicleTypes: ["Heavy Commercial Truck", "Delivery Container", "Commercial Fleet Van"],
    policeVerificationAvailable: true,
  };

  console.log("[1/2] Generating Refined Masked & Unmasked Resumes for Someshwar Sahu...");

  const someshwarMaskedViewer: ViewerContext = {
    role: "COMPANY_CONTACT",
    companyBranchId: "branch-blr-01",
    termsSigned: false,
    applicationStatus: "Applied",
  };
  const maskedRes = generateCandidateResumePdf(someshwarResume, someshwarMaskedViewer);
  const maskedPath = path.join(outputDir, "employee_resume_masked.pdf");
  fs.writeFileSync(maskedPath, maskedRes.buffer);
  console.log(`  -> Generated MASKED PDF: ${path.relative(process.cwd(), maskedPath)} (${maskedRes.buffer.length} bytes)`);

  const someshwarUnmaskedViewer: ViewerContext = {
    role: "COMPANY_CONTACT",
    companyBranchId: "branch-blr-01",
    termsSigned: true,
    applicationStatus: "InterviewScheduled",
  };
  const unmaskedRes = generateCandidateResumePdf(someshwarResume, someshwarUnmaskedViewer);
  const unmaskedPath = path.join(outputDir, "employee_resume_unmasked.pdf");
  fs.writeFileSync(unmaskedPath, unmaskedRes.buffer);
  console.log(`  -> Generated UNMASKED PDF: ${path.relative(process.cwd(), unmaskedPath)} (${unmaskedRes.buffer.length} bytes)`);

  console.log("\n[2/2] Generating Refined Driver Resumes...");
  const driverMaskedViewer: ViewerContext = {
    role: "COMPANY_CONTACT",
    companyBranchId: "branch-noida-01",
    termsSigned: true,
    applicationStatus: "Applied",
  };
  const driverMaskedRes = generateCandidateResumePdf(driverResume, driverMaskedViewer);
  const driverMaskedPath = path.join(outputDir, "driver_resume_masked.pdf");
  fs.writeFileSync(driverMaskedPath, driverMaskedRes.buffer);
  console.log(`  -> Generated Driver MASKED PDF: ${path.relative(process.cwd(), driverMaskedPath)}`);

  const driverUnmaskedViewer: ViewerContext = {
    role: "COMPANY_CONTACT",
    companyBranchId: "branch-noida-01",
    termsSigned: true,
    applicationStatus: "InterviewScheduled",
  };
  const driverUnmaskedRes = generateCandidateResumePdf(driverResume, driverUnmaskedViewer);
  const driverUnmaskedPath = path.join(outputDir, "driver_resume_unmasked.pdf");
  fs.writeFileSync(driverUnmaskedPath, driverUnmaskedRes.buffer);
  console.log(`  -> Generated Driver UNMASKED PDF: ${path.relative(process.cwd(), driverUnmaskedPath)}`);

  console.log("\n>> All refined PDFs successfully saved in 'tests/output/'.\n");
}

runSimulation().catch(console.error);
