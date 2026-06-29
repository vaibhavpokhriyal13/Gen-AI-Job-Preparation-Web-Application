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
        model: "gemini-3.5-flash",
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
            // Block external font/image requests - keep only inline styles & local resources
            if (["image", "media"].includes(resourceType)) {
                req.abort()
            } else if (resourceType === "font" && url.startsWith("http")) {
                req.abort()
            } else {
                req.continue()
            }
        })

        // Use domcontentloaded instead of networkidle0 - doesn't wait for external requests
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

    const prompt = `You are a Senior Technical Resume Writer who has helped thousands of engineers land roles at top-tier tech companies. You write resumes that score 85-95+ on ATS analyzers while reading like they were crafted by a real human who deeply understands the candidate's background.

Your task: Transform the candidate data below into a PREMIUM, PERSONALIZED, QUANTIFIED, ATS-optimized resume in self-contained HTML format.

==================================================
CANDIDATE INPUT DATA
==================================================
CANDIDATE RESUME (parse every single detail - name, contact info, skills, projects, experience, education, certifications, achievements - extract everything):
${resume}

CANDIDATE SELF DESCRIPTION (extract additional skills, goals, personality traits, extra projects, and any context not captured in the resume):
${selfDescription}

TARGET JOB DESCRIPTION (extract: role title, required tech stack, key responsibilities, preferred qualifications, and domain-specific keywords):
${jobDescription}

==================================================
OUTPUT FORMAT
==================================================
- Return ONLY a valid JSON object: {"html": "<complete standalone HTML document>"}
- No markdown, no code fences, no preamble - raw JSON only.
- Embed ALL CSS inside a single <style> tag within the <head>. No external stylesheets or CDN links whatsoever.
- The HTML must be a complete self-contained document starting with <!DOCTYPE html>.

==================================================
VISUAL DESIGN SYSTEM
==================================================
Layout and Structure:
- Full single-column layout. NO multi-column flexbox, NO CSS grid columns, NO HTML table layouts.
- Page width: 210mm (A4). Padding: 18mm top/bottom, 16mm left/right.
- Include "page-break-inside: avoid" on every section div and every entry block div.

Typography:
- Font stack: Arial, Helvetica Neue, sans-serif. NO Google Fonts (they require network and will fail in Puppeteer).
- Candidate Name: 22pt, font-weight 900, color #0d0d0d, letter-spacing 1.5px, margin-bottom 2px.
- Target Job Title (line below name): 11pt, color #0055CC, font-weight 600, margin-bottom 6px.
- Section Headers: 10.5pt, font-weight 700, text-transform uppercase, color #0d0d0d, border-bottom 2.5px solid #0d0d0d, padding-bottom 3px, margin 14px 0 8px 0.
- Company / Institution / Project names: font-weight 700, color #0055CC.
- Job Titles within entries: font-weight 700, color #0d0d0d.
- Body text: 10pt, color #1a1a1a, line-height 1.55.
- Contact line: 9.5pt, color #333, margin-bottom 8px.

Accent color #0055CC used ONLY for: target job title, employer names, university names, project names, skill category labels, hyperlinks.

Bullet styling: Use <ul style="margin:4px 0 6px 18px; padding:0;"> with <li style="margin-bottom:4px;">. Use solid disc bullets.

Dates and Locations: float right; font-style italic; color #555; font-size 9.5pt. Always use clearfix after each entry header line.

Skill category label format: <span style="color:#0055CC; font-weight:700;">Category Name:</span> Skill1 - Skill2 - Skill3

==================================================
SECTION 1: HEADER
==================================================
- Full candidate name: Largest, boldest element on the entire page.
- Target job title on the next line: Derived from the JD role title matched to the candidate strongest skills. Always render in color #0055CC.
- Contact row (all on ONE line with " | " separators): Phone | Email as clickable mailto link | LinkedIn as clickable URL | GitHub as clickable URL | Portfolio if present as clickable URL | City, Country.
- Parse ALL contact information from anywhere in the resume or self-description. Include every link found.

==================================================
SECTION 2: PROFESSIONAL SUMMARY  [MOST CRITICAL SECTION]
==================================================
GOAL: A recruiter reading this should immediately know WHO this specific candidate is, not a generic developer template.

Write EXACTLY 4 sentences using this mandatory formula:

SENTENCE 1 - Identity Statement. Name the candidate ACTUAL primary programming languages and frameworks from the resume. State the number of years or months of hands-on experience. Map directly to the JD role title.
  CORRECT: "Full-Stack Developer with 2+ years of hands-on experience building production-grade web applications using React.js, Node.js, Express.js, and MongoDB."
  WRONG (never write this): "Highly analytical software developer committed to continuous technical evolution."

SENTENCE 2 - Differentiator. Name the candidate ACTUAL notable projects or domain from the resume. Mention the candidate actual specialization area.
  CORRECT: "Author of an AI-driven job preparation platform integrating Google Gemini API for real-time interview coaching, personalized resume generation, and adaptive skill-gap analysis, serving active users in production."
  WRONG (never write this): "Committed to delivering high-quality solutions for forward-thinking engineering teams."

SENTENCE 3 - Quantified Impact. Include a real or conservatively estimated metric from the resume such as percentage improvement, number of APIs built, users served, or projects shipped.
  CORRECT: "Delivered 5+ full-stack projects from concept to cloud deployment, consistently achieving sub-200ms API response times and 90+ Lighthouse performance scores across all production builds."
  WRONG (never write this): "Proven ability to enhance workflow efficiency and data accuracy."

SENTENCE 4 - Career Objective. State the exact target role from the JD and what the candidate brings to it.
  CORRECT: "Seeking a Software Engineer role to apply deep expertise in RESTful API design, React front-end architecture, and AI service integration within a fast-moving product engineering team."
  WRONG (never write this): "Seeking to join a dynamic team where I can grow professionally."

ATS Keyword Rule: Weave 6-8 exact keywords from the JD naturally into these 4 sentences. Do not list them separately; integrate them into the prose.

==================================================
SECTION 3: TECHNICAL SKILLS
==================================================
- Extract EVERY technology, tool, language, framework, library, platform, and methodology from anywhere in the resume AND self-description.
- Infer implied skills: if React is listed, also add "React Hooks" and "Component Architecture" and "State Management". If Node.js, add "REST API Design" and "Middleware Architecture". If MongoDB, add "Mongoose ODM" and "Schema Design". If JWT, add "Token-Based Authentication" and "HTTP-only Cookies".
- Group into categories based on actual candidate data. Use only categories that fit:
  Programming Languages | Front-End Development | Back-End and APIs | Databases | Cloud and DevOps | AI and ML | Mobile | Testing | Tools and IDEs | Version Control | Soft Skills | Spoken Languages
- Render each category label in bold #0055CC text followed by a colon.
- List skills inline separated by " - " (not bullet points).
- Never truncate or omit any skill. Include ALL of them.

==================================================
SECTION 4: WORK EXPERIENCE AND INTERNSHIPS
==================================================
Include EVERY role: full-time, internship, part-time, contract, and freelance.

For EACH role, write EXACTLY 5-6 bullet points using the CAR formula:
  C = Context and Action: What exactly did they build or do? Name the ACTUAL technology.
  A = Approach: Briefly state the technical method or design decision.
  R = Result: State the measurable outcome with a number. Use "approx." for estimates.

QUANTIFICATION RULES - mandatory on every single bullet:
  - If a metric exists in the resume, use it exactly as stated.
  - If a metric can be reasonably inferred (e.g., "managed students" becomes "approx. 500 student records"), include it with "approx." prefix.
  - If no metric is available, state qualitative business impact such as eliminating a class of production bugs, reducing manual deployment steps from 8 to 2, or enabling 3x faster feature iteration.
  - Acceptable metric types: response time in ms, number of endpoints or APIs built, users served, percentage improvement, hours saved per week, records processed, test coverage percentage, deployment frequency.

VERB DIVERSITY RULE - strictly enforced: No two consecutive bullets in the same role may start with the same verb. Rotate from this approved list:
  Engineered, Developed, Designed, Implemented, Optimized, Automated, Integrated, Deployed, Architected, Enhanced, Constructed, Delivered, Reduced, Increased, Built, Established, Configured, Refactored, Authored, Streamlined, Debugged, Migrated, Maintained, Resolved, Collaborated

BAD BULLET (never write this): "Worked on the backend of the application." (vague, no technology named, no result)
GOOD BULLET: "Engineered 8 RESTful API endpoints using Express.js and MongoDB with JWT-based authentication and role-based access control, reducing unauthorized access incidents to zero across 300+ QA test cycles."

==================================================
SECTION 5: PROJECTS  [SECOND MOST CRITICAL SECTION]
==================================================
Include EVERY project from the resume and self-description. Omitting any project is a failure.

For EACH project write:

HEADER LINE:
- Project name: bold, color #0055CC, 10.5pt.
- Tech stack: float right, italic, 9pt, color #555. List actual technologies used in the project.
- If a GitHub URL or live demo URL is present, render it as a small clickable accent-blue hyperlink directly below the title.

DESCRIPTION LINE:
- One crisp sentence stating WHAT the project does and WHO benefits from it.

BULLET POINTS - write EXACTLY 5-6 bullets per project covering all of the following angles:

Bullet 1 - PROBLEM AND MOTIVATION: Why was this project built? What real-world gap does it address?
  GOOD: "Identified the absence of an AI-integrated interview prep tool and built a platform that reduces average job application preparation time by an estimated 60% by consolidating resume building, mock interviews, and gap analysis into a single workflow."

Bullet 2 - ARCHITECTURE AND SYSTEM DESIGN: How is the system structured? What architectural patterns were applied?
  GOOD: "Architected a decoupled MVC back-end using Node.js and Express with a React.js SPA front-end communicating over a REST API secured with JWT stored in HTTP-only cookies to prevent XSS-based token theft."

Bullet 3 - KEY FEATURES IMPLEMENTED: List the actual specific features built. Be concrete - name real feature names.
  GOOD: "Implemented AI-driven interview report generation producing a match score, 10 technical Q&A pairs, 5 behavioral Q&A pairs, skill gaps with severity ratings, and a personalized 7-day study plan, alongside PDF resume synthesis via Puppeteer and a session-persistent multi-step wizard."

Bullet 4 - TECHNICAL CHALLENGE AND SOLUTION: What was the hardest engineering problem solved and how?
  GOOD: "Resolved cross-environment Puppeteer execution failures on Render by configuring platform-specific Chromium executable paths, enabling request interception to block CDN-dependent font requests, and switching the page wait strategy from networkidle0 to domcontentloaded, reducing PDF generation timeout rate from approx. 40% to 0%."

Bullet 5 - PERFORMANCE AND OUTCOME: What measurable results were achieved? Deployment details, performance metrics, user adoption.
  GOOD: "Achieved sub-300ms average API response time across all endpoints; deployed back-end on Render and front-end on Vercel with a zero-downtime GitHub-integrated CI/CD pipeline; attracted 50+ active beta users within the first week of launch."

Bullet 6 - AI INTEGRATION OR COLLABORATION (include if data supports it):
  GOOD: "Integrated Google Gemini 2.0 Flash API with Zod-enforced structured JSON schema validation and a custom sanitization pipeline, guaranteeing 100% valid AI response parsing and eliminating runtime crashes from malformed model output."

Personalization check: Every single bullet must mention at least one real technology from the candidate actual tech stack. No bullet should be generic enough to describe a different project.

==================================================
SECTION 6: EDUCATION
==================================================
For EACH degree or program:
- Degree and Major: bold text.
- Institution name: bold, color #0055CC. City and Country: float right.
- Dates: float right, italic.
- GPA or CGPA if stated in the resume (e.g., "CGPA: 8.6 / 10.0").
- Relevant Coursework in bold label followed by inline comma-separated list: Extract from resume or infer appropriate courses from the major and tech stack. For Computer Science typically includes: Data Structures and Algorithms, Operating Systems, Database Management Systems, Computer Networks, Software Engineering, Machine Learning, Object-Oriented Programming.
- Academic honors or Dean's List if mentioned anywhere in the input.

==================================================
SECTION 7: CERTIFICATIONS
==================================================
For EACH certification found anywhere in the resume or self-description:
- Certification name: bold.
- Issuing organization: color #0055CC. Year: float right.
- One sentence describing what this certification validates and how it applies to the target JD role.
  GOOD: "Validates proficiency in building and deploying cloud-native applications on AWS, directly applicable to the role requirement for scalable infrastructure management using EC2, S3, and Lambda."

==================================================
SECTION 8: ACHIEVEMENTS AND AWARDS
==================================================
Include: hackathon wins, scholarships, academic ranks, coding competition placements, publications, open-source recognition, Dean's List, college honors.
For each entry: bold title | awarding body | year as float right | one sentence on what was accomplished and why it matters to employers.

==================================================
SECTION 9: EXTRACURRICULAR, LEADERSHIP, AND OPEN SOURCE
==================================================
Include if any data exists: club leadership, open-source contributions, volunteer work, mentoring, organizing events.
Format same as Work Experience: role name, organization, dates, 2-3 impact-focused bullets.

==================================================
SECTION 10: LANGUAGES SPOKEN
==================================================
List each language with proficiency level: Native | Professional | Intermediate | Basic

==================================================
GLOBAL QUALITY ENFORCEMENT - apply to every single sentence written
==================================================

RULE 1 - ZERO GENERIC LANGUAGE:
Every sentence must contain at least one specific detail unique to this candidate (a named tool, a metric, a project name, a specific technology). If the resume input is sparse, expand intelligently using the tech stack as context.

Inference examples for sparse resumes:
- "Used React" means write about: custom hooks, code splitting with React.lazy, React Router v6 navigation, Context API vs Redux state management, component lifecycle with useEffect.
- "Used MongoDB" means write about: Mongoose schema design with validation, compound indexes for query performance, aggregation pipelines for analytics, connection pooling.
- "Used Node.js" means write about: event-driven non-blocking I/O architecture, async/await error handling with try-catch, Express middleware pipeline, input validation with Joi or Zod.
- "Used JWT" means write about: HS256 token signing, access and refresh token rotation strategy, HTTP-only cookie storage to prevent XSS, protected route middleware.

RULE 2 - BANNED PHRASES (never use any of these under any circumstances):
"Highly analytical", "Committed to continuous", "Forward-thinking", "Passionate about", "Dynamic team", "Hard-working", "Team player", "Detail-oriented", "Proven track record", "Results-driven", "Synergy", "Leveraged", "Utilized", "Spearheaded", "Navigated", "Fostered", "Delve", "Testament", "Experienced professional", "Self-motivated", "Go-getter"

RULE 3 - MANDATORY QUANTIFICATION:
Every work experience bullet and every project outcome bullet MUST contain at least one number, percentage, count, or time-based metric. Use "approx." for estimates. No exceptions.

RULE 4 - BULLET LENGTH:
Each bullet point must be a complete sentence of 20-35 words. No fragments. No run-on sentences exceeding 2 lines.

RULE 5 - ATS KEYWORD DENSITY:
Each of the top 10 keywords from the JD must appear at least twice across the full resume: once in Summary or Skills, and once in Experience or Projects.

RULE 6 - NO PLACEHOLDER TEXT:
Never write "[Name]", "[Company]", "[Project]", "[Technology]", or any bracket placeholder. Use only actual data extracted from the candidate input.

RULE 7 - SECTION ORDER:
Header, Summary, Skills, Experience, Projects, Education, Certifications, Achievements, Extracurricular, Languages. Omit any section that has zero data to fill it.

RULE 8 - COMPLETENESS:
Including every project and every skill is mandatory. Missing even one project from the resume input is a critical failure.`;

    const responseSchema = {
        type: "object",
        properties: {
            html: { type: "string", description: "The HTML content of the resume which can be converted to PDF using a headless browser like puppeteer" }
        },
        required: ["html"]
    };

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
