import { extractText } from "unpdf";
import { CandidateEducation, CandidateProject, CandidateWorkExperience } from "./pdf";

export interface ParsedResumeData {
  fullName?: string;
  mobile?: string;
  email?: string;
  education: CandidateEducation[];
  projects: CandidateProject[];
  achievements: string[];
  skills: { [category: string]: string[] } | string[];
  experiences: CandidateWorkExperience[];
}

export async function parseResumePdf(buffer: Buffer): Promise<ParsedResumeData> {
  try {
    if (!buffer || buffer.length === 0) {
      return { education: [], projects: [], achievements: [], skills: {}, experiences: [] };
    }

    const header = buffer.toString("utf8", 0, 5);
    let rawText = "";

    if (header.startsWith("%PDF")) {
      const uint8Array = new Uint8Array(buffer);
      const result = await extractText(uint8Array);
      rawText = Array.isArray(result.text) ? result.text.join("\n") : String(result.text || "");
    } else {
      // Fallback for plain text or unstructured utf-8 document buffers
      rawText = buffer.toString("utf8");
    }

    return extractResumeSections(rawText);
  } catch (error) {
    console.warn("Resume Parser Graceful Fallback Notice:", error);
    return {
      education: [],
      projects: [],
      achievements: [],
      skills: {},
      experiences: [],
    };
  }
}

export function extractResumeSections(rawText: string): ParsedResumeData {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const education: CandidateEducation[] = [];
  const projects: CandidateProject[] = [];
  const achievements: string[] = [];
  const skillsMap: { [category: string]: string[] } = {};
  const experiences: CandidateWorkExperience[] = [];

  let currentSection = "";
  let currentProject: CandidateProject | null = null;
  let currentExperience: CandidateWorkExperience | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Identify Section Headers
    if (lower === "education" || lower.startsWith("education ")) {
      currentSection = "EDUCATION";
      continue;
    } else if (lower === "projects" || lower.startsWith("projects ")) {
      currentSection = "PROJECTS";
      continue;
    } else if (lower === "achievements" || lower.startsWith("achievements ")) {
      currentSection = "ACHIEVEMENTS";
      continue;
    } else if (
      lower === "technical skills" ||
      lower === "skills" ||
      lower.startsWith("technical skills")
    ) {
      currentSection = "SKILLS";
      continue;
    } else if (
      lower === "work experience" ||
      lower === "experience" ||
      lower.startsWith("work experience")
    ) {
      currentSection = "EXPERIENCE";
      continue;
    }

    // SECTION 1: EDUCATION
    if (currentSection === "EDUCATION") {
      if (
        line.includes("Institute") ||
        line.includes("University") ||
        line.includes("College") ||
        line.includes("School") ||
        line.includes("IIIT") ||
        line.includes("IIT") ||
        line.includes("NIT")
      ) {
        const dateMatch = line.match(
          /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}).*(\d{4}|Present)/i
        );
        const dates = dateMatch ? dateMatch[0] : "";
        const institution = dateMatch
          ? line.replace(dateMatch[0], "").trim()
          : line;

        let degree = "Degree / Higher Secondary";
        let score = "";
        let location = "";

        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (
            !nextLine.toLowerCase().includes("school") &&
            !nextLine.toLowerCase().includes("institute") &&
            !nextLine.toLowerCase().includes("education") &&
            !nextLine.toLowerCase().includes("projects") &&
            !nextLine.toLowerCase().includes("achievements")
          ) {
            degree = nextLine;
            i++;
          }
        }

        education.push({
          institution: institution || line,
          degree,
          dates,
          score,
          location,
        });
      }
    }

    // SECTION 2: PROJECTS
    else if (currentSection === "PROJECTS") {
      if (line.includes(" | ") || line.includes(" – ") || line.includes(" - ")) {
        if (currentProject) {
          projects.push(currentProject);
        }

        const parts = line.split(/[|–-]/).map((p) => p.trim());
        const title = parts[0] || line;
        const techStack = parts.slice(1).join(" | ");

        currentProject = {
          title,
          techStack,
          bullets: [],
        };
      } else if (line.startsWith("•") || line.startsWith("*") || line.startsWith("-")) {
        const bulletText = line.replace(/^[•*\-\s]+/, "").trim();
        if (currentProject) {
          currentProject.bullets.push(bulletText);
        }
      } else if (currentProject && currentProject.bullets.length > 0) {
        const lastIdx = currentProject.bullets.length - 1;
        currentProject.bullets[lastIdx] += " " + line;
      }
    }

    // SECTION 3: ACHIEVEMENTS
    else if (currentSection === "ACHIEVEMENTS") {
      if (line.startsWith("•") || line.startsWith("*") || line.startsWith("-")) {
        achievements.push(line.replace(/^[•*\-\s]+/, "").trim());
      } else if (achievements.length > 0) {
        achievements[achievements.length - 1] += " " + line;
      } else if (line.length > 5) {
        achievements.push(line);
      }
    }

    // SECTION 4: TECHNICAL SKILLS
    else if (currentSection === "SKILLS") {
      if (line.includes(":")) {
        const [cat, rawSkills] = line.split(":", 2);
        const cleanCat = cat.replace(/^[•*\-\s]+/, "").trim();
        const skillList = rawSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (cleanCat && skillList.length > 0) {
          skillsMap[cleanCat] = skillList;
        }
      } else if (line.includes(",")) {
        const skillList = line
          .replace(/^[•*\-\s]+/, "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        skillsMap["Core Skills"] = (skillsMap["Core Skills"] || []).concat(skillList);
      }
    }

    // SECTION 5: WORK EXPERIENCE
    else if (currentSection === "EXPERIENCE") {
      if (line.includes(" at ") || line.includes(" | ") || line.includes(" - ")) {
        if (currentExperience) {
          experiences.push(currentExperience);
        }
        const parts = line.split(/at|\||-/).map((p) => p.trim());
        currentExperience = {
          designation: parts[0] || "Software Engineer",
          companyName: parts[1] || "Tech Partner",
          bullets: [],
        };
      } else if (line.startsWith("•") || line.startsWith("*") || line.startsWith("-")) {
        if (currentExperience) {
          currentExperience.bullets?.push(line.replace(/^[•*\-\s]+/, "").trim());
        }
      }
    }
  }

  if (currentProject) projects.push(currentProject);
  if (currentExperience) experiences.push(currentExperience);

  return {
    education,
    projects,
    achievements,
    skills: Object.keys(skillsMap).length > 0 ? skillsMap : [],
    experiences,
  };
}
