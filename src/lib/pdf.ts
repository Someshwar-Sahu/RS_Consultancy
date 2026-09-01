import { ViewerContext } from "./permissions";

export interface CandidateProject {
  title: string;
  techStack?: string;
  linkUrl?: string;
  bullets: string[];
}

export interface CandidateEducation {
  degree: string;
  specialization?: string | null;
  institution: string;
  score?: string | null;
  location?: string | null;
  dates?: string | null;
  passingYear?: number | null;
}

export interface CandidateWorkExperience {
  companyName: string;
  designation: string;
  dates?: string | null;
  location?: string | null;
  bullets?: string[];
}

export interface CandidateResumeData {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  currentLocation?: string | null;
  preferredJobLocation?: string | null;
  experienceLevel?: string | null;
  totalExperienceYears?: number | string | null;
  preferredCategory?: string | null;
  expectedSalary?: string | null;
  noticePeriod?: string | null;
  headline?: string | null;
  createdAt?: Date | string;

  skills?: string[] | { [category: string]: string[] };
  projects?: CandidateProject[];
  achievements?: string[];
  education?: CandidateEducation[];
  experiences?: CandidateWorkExperience[];

  licenseType?: string;
  vehicleTypes?: string[];
  badgeNumber?: string;
  policeVerificationAvailable?: boolean;
}

export function isContactUnmaskedForViewer(viewer: ViewerContext): boolean {
  if (viewer.role === "ADMIN" || viewer.role === "EMPLOYEE") {
    return true;
  }
  if (viewer.role === "COMPANY_CONTACT") {
    const isInterviewOrLater = [
      "InterviewScheduled",
      "Offered",
      "Joined",
    ].includes(viewer.applicationStatus || "");
    return isInterviewOrLater && Boolean(viewer.termsSigned);
  }
  return false;
}

function cleanAscii(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "*")
    .replace(/[\u2026]/g, "...")
    .replace(/[^\x20-\x7E]/g, "");
}

/**
 * Generates an unbroken encoded internal candidate tracking ID:
 * Format: RSB[YYMM][CATEGORY_CODE][NUMERIC_PIN]
 * Example: RSB2608IT8429
 */
export function generateCandidateRefCode(candidate: {
  id: string;
  preferredCategory?: string | null;
  createdAt?: Date | string;
}): string {
  const d = candidate.createdAt ? new Date(candidate.createdAt) : new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");

  let catCode = "IT";
  const cat = (candidate.preferredCategory || "").toLowerCase();
  if (cat.includes("driver")) catCode = "DR";
  else if (cat.includes("sales") || cat.includes("marketing")) catCode = "SM";
  else if (cat.includes("bpo")) catCode = "BP";
  else if (cat.includes("backoffice")) catCode = "BO";
  else if (cat.includes("bulk") || cat.includes("field")) catCode = "FL";

  let hash = 0;
  for (let i = 0; i < candidate.id.length; i++) {
    hash = (hash * 31 + candidate.id.charCodeAt(i)) % 9000;
  }
  const pin = String(1000 + Math.abs(hash));

  return `RSB${yy}${mm}${catCode}${pin}`;
}

interface PdfLinkAnnotation {
  rect: [number, number, number, number];
  url: string;
}

/**
 * Designer-Grade Executive Resume Engine
 * Features:
 * - Generous vertical breathing room and calibrated line heights
 * - Perfectly contained header box with internal padding for Ref ID
 * - Clear visual separation between section lines and item content
 * - Native PDF clickable hyperlink annotations
 */
export function generateCandidateResumePdf(
  candidate: CandidateResumeData,
  viewer: ViewerContext
): { buffer: Buffer; isMasked: boolean; filename: string } {
  const unmask = isContactUnmaskedForViewer(viewer);
  const isDriver = candidate.preferredCategory === "Driver";

  const displayMobile = unmask
    ? cleanAscii(candidate.mobile)
    : "********** (Contact via RS Bridge Consultancy)";
  const displayEmail = unmask
    ? cleanAscii(candidate.email)
    : "********** (Masked until Interview Scheduled & Terms Signed)";
  const streamChunks: string[] = [];
  const linkAnnotations: PdfLinkAnnotation[] = [];

  const LEFT_MARGIN = 36;
  const RIGHT_MARGIN = 559;
  const CONTENT_WIDTH = RIGHT_MARGIN - LEFT_MARGIN; // 523pt

  // Canvas height: 842 pt
  let curY = 806;

  // Multi-Page Canvas Support
  const pages: string[][] = [streamChunks];
  let currentPageChunks = streamChunks;

  function checkPageOverflow(neededSpace: number = 15) {
    if (curY - neededSpace < 50) {
      const newPageChunks: string[] = [];
      pages.push(newPageChunks);
      currentPageChunks = newPageChunks;
      curY = 806;
      
      // Draw Page Header & Watermark on subsequent pages
      drawWatermark();
      drawText("[ RS BRIDGE CONSULTANCY - CONTINUED ]", LEFT_MARGIN, curY - 10, "/F1", 8, 0.4, 0.45, 0.55);
      drawLine(LEFT_MARGIN, curY - 14, RIGHT_MARGIN, curY - 14, 0.85, 0.88, 0.92, 0.75);
      curY -= 28;
    }
  }

  function drawWatermark() {
    currentPageChunks.push("0.94 0.96 0.98 rg");
    drawText("RS BRIDGE VERIFIED PROFILE", LEFT_MARGIN + 80, 420, "/F1", 26, 0.90, 0.92, 0.95);
  }

  function drawRect(x: number, y: number, w: number, h: number, r: number, g: number, b: number, fill = true, stroke = false, strokeR = 0.8, strokeG = 0.8, strokeB = 0.8, strokeW = 0.75) {
    if (fill) {
      currentPageChunks.push(`${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} rg`);
      currentPageChunks.push(`${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`);
    }
    if (stroke) {
      currentPageChunks.push(`${strokeR.toFixed(2)} ${strokeG.toFixed(2)} ${strokeB.toFixed(2)} RG`);
      currentPageChunks.push(`${strokeW} w ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re S`);
    }
  }

  function drawLine(x1: number, y1: number, x2: number, y2: number, r = 0.8, g = 0.8, b = 0.8, lineWidth = 0.75) {
    currentPageChunks.push(`${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} RG`);
    currentPageChunks.push(`${lineWidth} w ${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S`);
  }

  function drawText(text: string, x: number, y: number, font: "/F1" | "/F2" | "/F3", size: number, r = 0.1, g = 0.1, b = 0.1) {
    const cleaned = cleanAscii(text);
    const escaped = cleaned.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    currentPageChunks.push(`BT ${font} ${size} Tf ${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} rg ${x.toFixed(1)} ${y.toFixed(1)} Td (${escaped}) Tj ET`);
  }

  function drawTextRight(text: string, rightX: number, y: number, font: "/F1" | "/F2" | "/F3", size: number, r = 0.3, g = 0.3, b = 0.3, charWidthRatio = 0.48): number {
    const cleaned = cleanAscii(text);
    const approxWidth = cleaned.length * size * charWidthRatio;
    const startX = Math.max(LEFT_MARGIN, rightX - approxWidth);
    drawText(cleaned, startX, y, font, size, r, g, b);
    return startX;
  }

  // Draw initial page background watermark
  drawWatermark();

  // =========================================================================
  // 1. TOP BRANDING RIBBON
  // =========================================================================
  const HEADER_HEIGHT = 48;
  const boxBottom = curY - HEADER_HEIGHT;

  drawRect(LEFT_MARGIN, boxBottom, CONTENT_WIDTH, HEADER_HEIGHT, 0.95, 0.97, 0.99, true, true, 0.85, 0.88, 0.93, 0.75);
  drawRect(LEFT_MARGIN, boxBottom, 4, HEADER_HEIGHT, 0.08, 0.28, 0.65, true, false);

  drawRect(LEFT_MARGIN + 10, boxBottom + 8, 86, 32, 1, 1, 1, true, true, 0.82, 0.85, 0.90, 0.75);
  drawText("[ RS BRIDGE ]", LEFT_MARGIN + 16, boxBottom + 23, "/F1", 8.5, 0.08, 0.28, 0.65);
  drawText("CONSULTANCY", LEFT_MARGIN + 18, boxBottom + 12, "/F1", 6.5, 0.38, 0.44, 0.52);

  drawText("RS BRIDGE CONSULTANCY", LEFT_MARGIN + 106, boxBottom + 26, "/F1", 11, 0.08, 0.18, 0.36);
  drawText("Executive Search & Strategic Staffing | Reg. NCR Sourcing Partner", LEFT_MARGIN + 106, boxBottom + 13, "/F2", 7.8, 0.35, 0.40, 0.48);

  const refCode = generateCandidateRefCode(candidate);
  const categoryLabel = isDriver ? "Driver & Fleet" : (candidate.preferredCategory || "Corporate IT");
  drawTextRight(`Ref ID: ${refCode}`, RIGHT_MARGIN - 12, boxBottom + 26, "/F1", 8, 0.15, 0.25, 0.45, 0.48);
  drawTextRight(`Category: ${categoryLabel}`, RIGHT_MARGIN - 12, boxBottom + 13, "/F3", 7.5, 0.42, 0.48, 0.56, 0.46);

  curY = boxBottom - 18;

  // =========================================================================
  // 2. CANDIDATE PROFILE HEADER
  // =========================================================================
  drawText(candidate.fullName, LEFT_MARGIN, curY, "/F1", 17, 0.06, 0.12, 0.24);
  curY -= 14;

  if (candidate.headline) {
    drawText(candidate.headline, LEFT_MARGIN, curY, "/F2", 8.8, 0.25, 0.30, 0.38);
    curY -= 12;
  }
  curY -= 4;

  // =========================================================================
  // 3. SECURITY ACCESS / MASKED CONTACT CARD
  // =========================================================================
  const BANNER_HEIGHT = 26;
  const badgeBgR = unmask ? 0.93 : 0.98;
  const badgeBgG = unmask ? 0.98 : 0.95;
  const badgeBgB = unmask ? 0.94 : 0.90;
  const badgeStrokeR = unmask ? 0.25 : 0.85;
  const badgeStrokeG = unmask ? 0.65 : 0.45;
  const badgeStrokeB = unmask ? 0.35 : 0.15;

  drawRect(LEFT_MARGIN, curY - BANNER_HEIGHT, CONTENT_WIDTH, BANNER_HEIGHT, badgeBgR, badgeBgG, badgeBgB, true, true, badgeStrokeR, badgeStrokeG, badgeStrokeB, 0.75);

  const statusLabel = unmask
    ? "[VERIFIED UNMASKED ACCESS - TERMS ACCEPTED]"
    : "[PROTECTED - CONTACT VIA RS BRIDGE CONSULTANCY]";

  drawText(statusLabel, LEFT_MARGIN + 8, curY - 10, "/F1", 7.8, badgeStrokeR, badgeStrokeG, badgeStrokeB);
  drawText(`Mobile: ${displayMobile}     Email: ${displayEmail}`, LEFT_MARGIN + 8, curY - 20, "/F2", 7.8, 0.15, 0.20, 0.28);

  curY -= (BANNER_HEIGHT + 14);

  // Helper for Section Titles with clean spacing & overflow safety
  function drawSectionTitle(title: string) {
    checkPageOverflow(30);
    curY -= 2;
    drawText(title.toUpperCase(), LEFT_MARGIN, curY, "/F1", 9.5, 0.08, 0.28, 0.65);
    drawLine(LEFT_MARGIN, curY - 3, RIGHT_MARGIN, curY - 3, 0.08, 0.28, 0.65, 0.85);
    curY -= 14;
  }

  // =========================================================================
  // 4. MAIN BODY SECTIONS
  // =========================================================================
  if (isDriver) {
    drawSectionTitle("Driving & Commercial Fleet Qualifications");
    checkPageOverflow(15);
    drawText("Profile Type     : DRIVER / COMMERCIAL STAFF", LEFT_MARGIN + 6, curY, "/F1", 8.8, 0.1, 0.15, 0.25);
    curY -= 12;
    checkPageOverflow(15);
    drawText(`License Category : ${candidate.licenseType || "Commercial HMV & LMV"}`, LEFT_MARGIN + 6, curY, "/F1", 8.8, 0.1, 0.15, 0.25);
    curY -= 12;
    checkPageOverflow(15);
    drawText(`Vehicle Types    : ${(candidate.vehicleTypes || ["Heavy Commercial Truck", "Delivery Van"]).join(", ")}`, LEFT_MARGIN + 6, curY, "/F2", 8.2, 0.2, 0.25, 0.3);
    curY -= 12;
    checkPageOverflow(15);
    drawText(`Police Verif.    : ${candidate.policeVerificationAvailable ? "Verified Certificate Available" : "Available Post-Hire"}`, LEFT_MARGIN + 6, curY, "/F2", 8.2, 0.2, 0.25, 0.3);
    curY -= 12;
    checkPageOverflow(15);
    drawText(`Total Experience : ${candidate.totalExperienceYears || "5+"} Years (${candidate.experienceLevel || "Expert"}) | Notice: ${candidate.noticePeriod || "Immediate"}`, LEFT_MARGIN + 6, curY, "/F2", 8.2, 0.2, 0.25, 0.3);
    curY -= 16;

    drawSectionTitle("Zero-Liability Recruitment Disclaimer");
    checkPageOverflow(45);
    drawRect(LEFT_MARGIN, curY - 40, CONTENT_WIDTH, 40, 0.98, 0.98, 0.98, true, true, 0.88, 0.88, 0.88, 0.6);
    drawText("DISCLAIMER & LIABILITY NOTICE:", LEFT_MARGIN + 8, curY - 10, "/F1", 7.5, 0.7, 0.2, 0.2);
    drawText("RS Bridge Consultancy acts solely as a recruitment and sourcing intermediary. The hiring company", LEFT_MARGIN + 8, curY - 20, "/F2", 7.5, 0.3, 0.3, 0.3);
    drawText("is solely responsible for conducting driving tests, vehicle insurance verification, and final", LEFT_MARGIN + 8, curY - 29, "/F2", 7.5, 0.3, 0.3, 0.3);
    drawText("background checks prior to deploying candidates onto commercial routes.", LEFT_MARGIN + 8, curY - 38, "/F2", 7.5, 0.3, 0.3, 0.3);
    curY -= 48;

  } else {
    // ---------------- EDUCATION ----------------
    if (candidate.education && candidate.education.length > 0) {
      drawSectionTitle("Education");
      for (const edu of candidate.education) {
        checkPageOverflow(25);
        drawText(edu.institution, LEFT_MARGIN, curY, "/F1", 8.8, 0.08, 0.14, 0.24);
        if (edu.dates) {
          drawTextRight(edu.dates, RIGHT_MARGIN, curY, "/F1", 7.8, 0.15, 0.20, 0.25, 0.48);
        }
        curY -= 11;

        const specText = edu.specialization ? ` in ${edu.specialization}` : "";
        const scoreText = edu.score ? `   ${edu.score}` : "";
        drawText(`${edu.degree}${specText}${scoreText}`, LEFT_MARGIN, curY, "/F2", 8.0, 0.22, 0.26, 0.32);
        if (edu.location) {
          drawTextRight(edu.location, RIGHT_MARGIN, curY, "/F3", 7.5, 0.38, 0.42, 0.48, 0.46);
        }
        curY -= 12;
      }
      curY -= 4;
    }

    // ---------------- PROJECTS ----------------
    if (candidate.projects && candidate.projects.length > 0) {
      drawSectionTitle("Projects");
      for (const proj of candidate.projects) {
        checkPageOverflow(25);
        drawText(proj.title, LEFT_MARGIN, curY, "/F1", 8.8, 0.08, 0.14, 0.24);

        if (proj.techStack) {
          const startX = drawTextRight(proj.techStack, RIGHT_MARGIN, curY, "/F3", 7.5, 0.32, 0.38, 0.46, 0.46);
          if (proj.linkUrl) {
            linkAnnotations.push({
              rect: [startX, curY - 2, RIGHT_MARGIN, curY + 8],
              url: proj.linkUrl,
            });
          }
        }
        curY -= 11;

        for (const bullet of proj.bullets) {
          const wrapped = wrapSimple(cleanAscii(bullet), 118);
          for (let bIdx = 0; bIdx < wrapped.length; bIdx++) {
            checkPageOverflow(12);
            if (bIdx === 0) {
              drawText("*", LEFT_MARGIN + 6, curY, "/F1", 7.5, 0.2, 0.35, 0.65);
            }
            drawText(wrapped[bIdx], LEFT_MARGIN + 14, curY, "/F2", 7.5, 0.15, 0.18, 0.24);
            curY -= 9.4;
          }
        }
        curY -= 3;
      }
      curY -= 3;
    }

    // ---------------- ACHIEVEMENTS ----------------
    if (candidate.achievements && candidate.achievements.length > 0) {
      drawSectionTitle("Achievements");
      for (const ach of candidate.achievements) {
        const wrapped = wrapSimple(cleanAscii(ach), 118);
        for (let aIdx = 0; aIdx < wrapped.length; aIdx++) {
          checkPageOverflow(12);
          if (aIdx === 0) {
            drawText("*", LEFT_MARGIN + 6, curY, "/F1", 7.5, 0.2, 0.35, 0.65);
          }
          drawText(wrapped[aIdx], LEFT_MARGIN + 14, curY, "/F2", 7.5, 0.15, 0.18, 0.24);
          curY -= 9.4;
        }
      }
      curY -= 5;
    }

    // ---------------- TECHNICAL SKILLS ----------------
    if (candidate.skills) {
      drawSectionTitle("Technical Skills");
      checkPageOverflow(15);
      if (Array.isArray(candidate.skills)) {
        drawText(`* Core Skills: ${candidate.skills.join(", ")}`, LEFT_MARGIN + 6, curY, "/F2", 7.8, 0.15, 0.18, 0.24);
        curY -= 11;
      } else {
        for (const [category, skillList] of Object.entries(candidate.skills)) {
          checkPageOverflow(15);
          drawText(`* ${category}:`, LEFT_MARGIN + 6, curY, "/F1", 7.8, 0.08, 0.14, 0.24);
          const catWidth = (cleanAscii(category).length + 3) * 4.4;
          drawText(skillList.join(", "), LEFT_MARGIN + 6 + catWidth, curY, "/F2", 7.5, 0.20, 0.24, 0.30);
          curY -= 10.5;
        }
      }
      curY -= 4;
    }

    // ---------------- WORK EXPERIENCE ----------------
    if (candidate.experiences && candidate.experiences.length > 0) {
      drawSectionTitle("Work Experience");
      for (const exp of candidate.experiences) {
        checkPageOverflow(25);
        drawText(`${exp.designation} at ${exp.companyName}`, LEFT_MARGIN, curY, "/F1", 8.5, 0.08, 0.14, 0.24);
        if (exp.dates) {
          drawTextRight(exp.dates, RIGHT_MARGIN, curY, "/F2", 7.8, 0.3, 0.3, 0.3, 0.46);
        }
        curY -= 11;
        if (exp.bullets) {
          for (const b of exp.bullets) {
            const wrapped = wrapSimple(cleanAscii(b), 118);
            for (const line of wrapped) {
              checkPageOverflow(12);
              drawText(`- ${line}`, LEFT_MARGIN + 12, curY, "/F2", 7.5, 0.2, 0.24, 0.3);
              curY -= 9.4;
            }
          }
        }
      }
      curY -= 4;
    }
  }

  // =========================================================================
  // 5. FOOTER & AUTHENTICITY STAMP
  // =========================================================================
  checkPageOverflow(25);
  drawLine(LEFT_MARGIN, 30, RIGHT_MARGIN, 30, 0.85, 0.88, 0.92, 0.75);
  drawText("RS Bridge Consultancy | Confidential Verified Profile | Direct candidate bypass strictly prohibited by Terms of Business", LEFT_MARGIN, 20, "/F3", 7.0, 0.45, 0.50, 0.56);

  // Compile PDF 1.4 Multi-Page Binary
  const objects: string[] = [];

  // Catalog & Info Dictionary
  const nowPdfDate = `D:${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}Z`;
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push(`2 0 obj\n<< /Title (RS Bridge Candidate Executive Resume) /Author (RS Bridge Consultancy) /Subject (Verified Profile) /Producer (RS Bridge Custom PDF Engine 2.0) /CreationDate (${nowPdfDate}) /ModDate (${nowPdfDate}) >>\nendobj\n`);

  // Page IDs array
  const totalPagesCount = pages.length;
  const pageObjIds: number[] = [];
  let currentObjId = 3;

  const pagesParentObjId = currentObjId;
  currentObjId++; // Reserve for /Pages object

  const pageStreamObjPairs: { pageId: number; streamId: number; streamLen: number; content: string }[] = [];

  for (let p = 0; p < totalPagesCount; p++) {
    const pageNumText = `Page ${p + 1} of ${totalPagesCount}`;
    pages[p].push(`BT /F2 7.0 Tf 0.45 0.50 0.56 rg 520.0 20.0 Td (${pageNumText}) Tj ET`);

    const pageId = currentObjId++;
    const streamId = currentObjId++;
    const contentStream = pages[p].join("\n");
    const streamLen = Buffer.byteLength(contentStream, "utf-8");

    pageObjIds.push(pageId);
    pageStreamObjPairs.push({ pageId, streamId, streamLen, content: contentStream });
  }

  // Font object IDs
  const f1ObjId = currentObjId++;
  const f2ObjId = currentObjId++;
  const f3ObjId = currentObjId++;

  // Build /Pages parent object
  objects.push(`${pagesParentObjId} 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${totalPagesCount} >>\nendobj\n`);

  // Build Page & Stream objects
  let annotsStr = "";
  if (linkAnnotations.length > 0) {
    const annotObjs = linkAnnotations.map(
      (a: PdfLinkAnnotation) =>
        `<< /Type /Annot /Subtype /Link /Rect [${a.rect[0].toFixed(1)} ${a.rect[1].toFixed(1)} ${a.rect[2].toFixed(1)} ${a.rect[3].toFixed(1)}] /Border [0 0 0] /A << /S /URI /URI (${cleanAscii(a.url)}) >> >>`
    );
    annotsStr = ` /Annots [${annotObjs.join(" ")}]`;
  }

  for (let p = 0; p < totalPagesCount; p++) {
    const pair = pageStreamObjPairs[p];
    const pageAnnots = p === 0 ? annotsStr : "";
    objects.push(`${pair.pageId} 0 obj\n<< /Type /Page /Parent ${pagesParentObjId} 0 R /MediaBox [0 0 595 842] /Contents ${pair.streamId} 0 R${pageAnnots} /Resources << /Font << /F1 ${f1ObjId} 0 R /F2 ${f2ObjId} 0 R /F3 ${f3ObjId} 0 R >> >> >>\nendobj\n`);
    objects.push(`${pair.streamId} 0 obj\n<< /Length ${pair.streamLen} /Filter /FlateDecode >>\nstream\n${pair.content}\nendstream\nendobj\n`);
  }

  objects.push(`${f1ObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`);
  objects.push(`${f2ObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  objects.push(`${f3ObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n`);

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const xrefOffsets: number[] = [0];

  for (const obj of objects) {
    xrefOffsets.push(Buffer.byteLength(pdf, "utf-8"));
    pdf += obj;
  }

  const startXref = Buffer.byteLength(pdf, "utf-8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = xrefOffsets[i].toString().padStart(10, "0");
    pdf += `${offsetStr} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const sanitizedName = candidate.fullName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const filename = `${sanitizedName}_${unmask ? "unmasked" : "masked"}_resume.pdf`;

  return {
    buffer: Buffer.from(pdf, "utf-8"),
    isMasked: !unmask,
    filename,
  };
}

function wrapSimple(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + (cur ? " " : "") + w).length <= maxChars) {
      cur += (cur ? " " : "") + w;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
