const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// 1. Zod Schema Definition
const interviewReportSchema = z.object({
    isValid: z.boolean().describe("True if the jobDescription and candidate profile/resume are valid, readable, and meaningful text in any language. False if either is gibberish, spam, keyboard-mashing, or completely irrelevant."),
    errorMessage: z.string().describe("A helpful message explaining why the inputs are invalid. Should be empty if isValid is true."),
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestion: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestion: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `You are an expert technical recruiter and engineering manager. 
Analyze the candidate's Resume and Self Description against the provided Job Description.
Generate a highly detailed interview preparation report in strict JSON format.

CRITICAL QUALITY CHECK:
1. Evaluate if the provided "Job Description" and "Resume/Self Description" are valid, meaningful text in English or any other language.
2. If either input is gibberish, spam, keyboard mashing (e.g. "asdfasdf", "qwerty", "xyzxyz", "asdasd"), completely blank, or irrelevant random letters, you MUST set "isValid" to false and set a clear, polite explanation in "errorMessage" (e.g. "The job description you pasted contains invalid random letters. Please provide a valid job listing."). In this case, set "matchScore" to 0, "title" to "Invalid Input", and return empty arrays for "technicalQuestion", "behavioralQuestion", "skillGaps", and "preparationPlan".
3. If they are valid, set "isValid" to true, "errorMessage" to "", and proceed to generate the preparation report.

CRITICAL INSTRUCTION:
1. Provide a comprehensive 7-day daily preparation plan (days 1 through 7) under "preparationPlan".
2. YOUR OUTPUT MUST EXACTLY MATCH THIS JSON STRUCTURE AND KEYS:
{
  "isValid": true,
  "errorMessage": "",
  "matchScore": 85,
  "title": "Insert Job Title Here",
  "technicalQuestion": [
    { "question": "...", "intention": "...", "answer": "..." }
  ],
  "behavioralQuestion": [
    { "question": "...", "intention": "...", "answer": "..." }
  ],
  "skillGaps": [
    { "skill": "...", "severity": "low" } 
  ],
  "preparationPlan": [
    { "day": 1, "focus": "...", "tasks": ["...", "..."] }
  ]
}
RULES:
1. DO NOT stringify the inner objects inside the arrays. Return actual JSON objects.
2. DO NOT invent new keys. You MUST use the exact keys shown in the structure above.
3. The 'severity' in skillGaps MUST be exactly "low", "medium", or "high".
4. "preparationPlan" must contain exactly 7 objects (one for each day from 1 to 7).
Candidate Details:
---
Resume: ${resume}
---
Self Description: ${selfDescription}
---
Job Description: ${jobDescription}
`;

    // 3. Direct OpenAPI Schema Definition (Bypasses $ref mapping which Gemini doesn't support)
    const responseSchema = {
        type: "object",
        properties: {
            isValid: { type: "boolean" },
            errorMessage: { type: "string" },
            matchScore: { type: "number" },
            title: { type: "string" },
            technicalQuestion: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        question: { type: "string" },
                        intention: { type: "string" },
                        answer: { type: "string" }
                    },
                    required: ["question", "intention", "answer"]
                }
            },
            behavioralQuestion: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        question: { type: "string" },
                        intention: { type: "string" },
                        answer: { type: "string" }
                    },
                    required: ["question", "intention", "answer"]
                }
            },
            skillGaps: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        skill: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high"] }
                    },
                    required: ["skill", "severity"]
                }
            },
            preparationPlan: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        day: { type: "number" },
                        focus: { type: "string" },
                        tasks: {
                            type: "array",
                            items: { type: "string" }
                        }
                    },
                    required: ["day", "focus", "tasks"]
                }
            }
        },
        required: ["isValid", "errorMessage", "matchScore", "title", "technicalQuestion", "behavioralQuestion", "skillGaps", "preparationPlan"]
    };

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });
    console.log(response.text);

    // Parse the AI response
    let parsedData = JSON.parse(response.text);

    // 4. Data Sanitization Safety Net (Prevents Mongoose Crash)
    const sanitizeArray = (arr) => {
        if (!Array.isArray(arr)) return [];
        return arr.map(item => {
            if (typeof item === 'string') {
                try {
                    return JSON.parse(item); // Fixes stringified JSON objects
                } catch (e) {
                    return item;
                }
            }
            return item;
        });
    };

    // Clean up all arrays before returning
    if (parsedData.technicalQuestion) parsedData.technicalQuestion = sanitizeArray(parsedData.technicalQuestion);
    if (parsedData.behavioralQuestion) parsedData.behavioralQuestion = sanitizeArray(parsedData.behavioralQuestion);
    if (parsedData.skillGaps) parsedData.skillGaps = sanitizeArray(parsedData.skillGaps);
    if (parsedData.preparationPlan) parsedData.preparationPlan = sanitizeArray(parsedData.preparationPlan);

    return parsedData;
}


async function generatePdfFromHtml(htmlContent) {

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process"
        ]
    });

    const page = await browser.newPage()

    try {
        // Block external resources (fonts, images from CDNs) that cause networkidle0 to hang on Render
        await page.setRequestInterception(true)
        page.on("request", (req) => {
            const resourceType = req.resourceType()
            const url = req.url()
            // Block external font/image requests — keep only inline styles & local resources
            if (["image", "media"].includes(resourceType)) {
                req.abort()
            } else if (resourceType === "font" && url.startsWith("http")) {
                req.abort()
            } else {
                req.continue()
            }
        })

        // Use domcontentloaded instead of networkidle0 — doesn't wait for external requests
        await page.setContent(htmlContent, {
            waitUntil: "domcontentloaded",
            timeout: 60000
        })

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "15mm",
                right: "5mm",
                bottom: "15mm",
                left: "5mm"
            }
        })

        return pdfBuffer
    } finally {
        await browser.close()
    }
}



async function generateResumePDF({ resume, selfDescription, jobDescription }) {

    const prompt = `You are a world-class Executive Resume Writer with 20+ years of experience crafting ATS-optimized resumes for Fortune 500 executives. Your task is to produce a comprehensive, richly detailed, and human-sounding resume that makes the candidate shine by surfacing EVERY valuable piece of information from the provided data.

CANDIDATE RESUME (extract ALL data — do not discard anything valuable):
${resume}

SELF DESCRIPTION (extract skills, traits, context, and any additional details):
${selfDescription}

JOB DESCRIPTION (use to tailor language and ordering, not to exclude content):
${jobDescription}

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════
- Return ONLY a valid JSON object: {"html": "<complete standalone HTML document>"}
- No markdown, no code fences, no preamble — raw JSON only.
- Embed ALL CSS inside a single <style> tag within the <head>. No external stylesheets.
- The HTML must be a complete, self-contained document (<!DOCTYPE html> ... </html>).

═══════════════════════════════════════════
VISUAL DESIGN SYSTEM
═══════════════════════════════════════════
Layout & Structure:
- Full single-column layout. NO flexbox columns, NO CSS grid columns, NO table-based layouts.
- Page width: A4 (210mm). Padding: 18mm top/bottom, 16mm left/right.
- Include page-break-inside: avoid on every major section and entry block.

Typography:
- Font stack: 'Arial', 'Helvetica Neue', sans-serif.
- Candidate Name: 22pt, bold, black (#0d0d0d), letter-spacing: 1px.
- Section Headers: 10.5pt, ALL CAPS, bold, black (#0d0d0d), border-bottom: 2.5px solid #0d0d0d, margin-bottom: 6px, padding-bottom: 3px.
- Body text: 10pt, color #1a1a1a, line-height: 1.5.
- Contact line: 9.5pt, color #333.

Accent Color — use #0055CC (professional blue) ONLY for:
  - The candidate's target job title under the name.
  - Employer names and university names.
  - Skill category labels.
  - Hyperlinks (email, LinkedIn, GitHub).

Bullet points: Use standard HTML <ul> with list-style: disc. Margin-left: 18px. Each <li> has margin-bottom: 3px.

Dates/Locations: Right-aligned on the same line as the job title or institution using float: right; font-style: italic; color: #444; font-size: 9.5pt.

═══════════════════════════════════════════
MANDATORY RESUME SECTIONS (include ALL that apply based on available data)
═══════════════════════════════════════════

SECTION 1 — HEADER
- Full Name (largest element on page)
- Target Job Title (in accent blue, aligned under name)
- Contact block: Phone | Email (linked) | LinkedIn URL (linked) | GitHub URL (linked) | Portfolio URL (linked) | City, Country
- Extract ALL contact info present in the resume or self-description.

SECTION 2 — PROFESSIONAL SUMMARY
- Write 3–4 rich, impact-focused sentences (NOT a generic objective statement).
- Sentence 1: Years of experience + core technical strength mapped to the JD.
- Sentence 2: Key domain expertise and what differentiates the candidate.
- Sentence 3: Quantifiable business/technical impact delivered.
- Sentence 4: Cultural fit or soft strength that supports the role.
- Naturally weave in 4–6 high-value keywords extracted from the JD for ATS optimization.

SECTION 3 — TECHNICAL SKILLS (always include)
- Group ALL skills from the resume and self-description into clearly labeled categories.
- Example categories (adapt based on actual data): Programming Languages | Frameworks & Libraries | Databases | Cloud & DevOps | Tools & IDEs | AI/ML | Soft Skills | Languages
- Use the accent blue color for category labels.
- List all individual skills inline, separated by " · " (middot). Do NOT truncate the skills list.
- Include every skill mentioned anywhere in the resume or self-description, even if not directly in the JD.

SECTION 4 — WORK EXPERIENCE (always include if data exists)
For EACH position, include:
- Job Title (bold)
- Company Name (accent blue, bold) | Location (right-aligned float)
- Employment dates (right-aligned float, italic)
- 4–6 bullet points per role using the XYZ Achievement Framework:
  * Start with a strong, varied action verb (Engineered, Architected, Designed, Built, Delivered, Reduced, Increased, Automated, Deployed, Optimized, Developed, Managed, Led, etc.)
  * Describe the specific task, technology used, and scope.
  * State the measurable result or impact (%, time saved, users served, cost reduced, etc.).
  * If no metric is given, infer a plausible, conservative metric or describe the qualitative impact.
  * Each bullet must be 1–2 full sentences — NOT short fragments.
  * Example: "Architected and deployed a RESTful API serving 10,000+ daily active users, reducing average response latency by 35% through Redis caching and query optimization."

SECTION 5 — PROJECTS (always include; this is CRITICAL — do NOT omit)
For EACH project mentioned in the resume or self-description:
- Project Title (bold) | Tech Stack used (right-aligned, italic, smaller font)
- 1-line description of what the project does.
- 3–4 bullet points covering:
  * Problem solved and why it matters.
  * Technical architecture, key design decisions, and technologies used.
  * Key features built (be specific — list actual features like authentication, real-time chat, AI integration, etc.).
  * Outcome: users, performance metrics, lessons learned, or GitHub stars if mentioned.
- If a GitHub or live URL is mentioned, render it as a clickable link in accent blue.
- DO NOT write "Project 1" or generic titles — use the actual project name.

SECTION 6 — EDUCATION (always include)
For EACH degree/program:
- Degree Name and Major (bold)
- Institution Name (accent blue) | Location (right-aligned)
- Graduation Year or Expected Graduation (right-aligned, italic)
- CGPA / GPA if mentioned (e.g., "CGPA: 8.5/10")
- Relevant coursework (list 5–8 courses as comma-separated inline text if available)
- Academic honors or awards if mentioned

SECTION 7 — CERTIFICATIONS (include if any data exists)
For EACH certification:
- Certification Name (bold)
- Issuing Organization (accent blue) | Year issued
- Write 1 sentence describing what the certification validates and how it applies to the target role.
- Do NOT just list the name — add context.

SECTION 8 — ACHIEVEMENTS & AWARDS (include if any data exists)
- List academic honors, hackathon wins, scholarships, coding competition rankings, publications, or any recognition.
- For each achievement: bold title, issuing body, year, and a 1-sentence description of its significance.

SECTION 9 — OPEN SOURCE / EXTRACURRICULAR / LEADERSHIP (include if any data exists)
- Community contributions, open source PRs, club leadership, volunteer work, mentoring.
- Format same as experience: title, organization, date, 2–3 bullet points with impact.

SECTION 10 — LANGUAGES (include if mentioned)
- List spoken/written languages and proficiency level (Native, Fluent, Intermediate, Basic).

═══════════════════════════════════════════
CONTENT GENERATION RULES
═══════════════════════════════════════════
1. COMPLETENESS IS MANDATORY: Include ALL data from the resume and self-description. Do NOT omit any project, skill, certification, achievement, or experience — even if it seems tangential. More detail = better resume.
2. Banned filler words: Never use "Spearheaded", "Synergy", "Navigated", "Fostered", "Testament", "Dynamic", "Delve", "Leveraged", "Utilized", "Passionate", "Experienced", or "Hardworking". Use precise, specific, executive-level language.
3. ATS Optimization: Naturally integrate exact keywords from the JD throughout the Summary, Experience, and Skills sections. Do NOT keyword-stuff — integrate naturally.
4. Bullet Length: Every bullet point must be a complete, detailed sentence of at least 15 words. No one-liner fragments.
5. Infer & Expand: If the resume is sparse on details for a project or role, intelligently infer plausible technical details based on the tech stack mentioned (e.g., if React is listed, mention component architecture, state management, hooks, etc.).
6. No placeholder text: Never write "[Your Name]", "[Company]", or any bracket placeholders. Use actual data from the input.
7. Consistent formatting: Every section must follow the exact same visual template defined above.
8. Page efficiency: Use compact but readable spacing so the resume is dense with value. Avoid large empty white spaces.`

    const responseSchema = {
        type: "object",
        properties: {
            html: { type: "string", description: "The HTML content of the resume which can be converted to PDF using a headless browser like puppeteer" }
        },
        required: ["html"]
    };

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });
    const jsonContent = JSON.parse(response.text);

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer



}


module.exports = {
    generateInterviewReport,
    generateResumePDF
};
