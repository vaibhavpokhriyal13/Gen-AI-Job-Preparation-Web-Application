const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// 1. Zod Schema Definition
const interviewReportSchema = z.object({
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
CRITICAL INSTRUCTION:
1. Provide a comprehensive 7-day daily preparation plan (days 1 through 7) under "preparationPlan".
2. YOUR OUTPUT MUST EXACTLY MATCH THIS JSON STRUCTURE AND KEYS:
{
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
        required: ["matchScore", "title", "technicalQuestion", "behavioralQuestion", "skillGaps", "preparationPlan"]
    };

    const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
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
            "--disable-dev-shm-usage"
        ]
    });
    const page = await browser.newPage()
    await page.setContent(htmlContent, {
        waitUntil: "networkidle0"
    })

    const pdfBuffer = await page.pdf({
        format: "A4", printBackground: true,
        margin: {
            top: "15mm",
            right: "5mm",
            bottom: "15mm",
            left: "5mm"
        }
    })
    await browser.close()
    return pdfBuffer

}


async function generateResumePDF({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using a headless browser like puppeteer")


    })

    const prompt = `You are an elite Executive Resume Writer for Fortune 500 companies. Your task is to generate a highly aggressive, ATS-optimized, and fiercely human-sounding resume by parsing the CANDIDATE RESUME against the JOB DESCRIPTION.

CANDIDATE RESUME:
${resume}

SELF DESCRIPTION:
${selfDescription}

JOB DESCRIPTION:
${jobDescription}

OUTPUT REQUIREMENTS:
- Return ONLY a JSON object: {"html": "<complete HTML here>"}
- No markdown, no code fences, no preamble — pure JSON only.
- Embed all CSS in a <style> tag within the HTML.

VISUAL & ATS ARCHITECTURE (Based on Reference: Screenshot 2026-06-28 142152.png):
- Layout: 100% single-column, standard block layout. NO flexbox, NO CSS grid, NO tables.
- Typography: Arial, Helvetica, or system-sans-serif. Base font 11pt, black (#1a1a1a).
- Accent Color: Use a striking bright blue (e.g., #007BFF) strictly for the Candidate's Target Job Title, Company/University Names, and Skill Category headings.
- Section Headers: (SUMMARY, EXPERIENCE, EDUCATION, SKILLS). Must be ALL CAPS, bold, slightly larger, with a thick black bottom border (e.g., border-bottom: 2px solid #000) spanning the page.
- Alignment: Name (largest, bold) and contact info left-aligned. Dates and Locations must be strictly right-aligned using float or position absolute.
- Margins: 0.75in padding. Include 'page-break-inside: avoid' on major sections.

CONTENT GENERATION ENGINE (STRICT RULES):
1. Banned AI Vocabulary: You will be penalized if you use any of the following filler words: "Spearheaded", "Synergy", "Navigated", "Fostered", "Testament", "Dynamic", "Delve", "Leveraged", "Utilized", "Passionate", or "Experienced". Use crisp, executive-level business English.
2. The "So What?" Summary Hook: Do NOT write a generic objective. Write a 2-sentence Value Proposition. Sentence 1: State the candidate's exact years of experience and core operational strength directly mapping to the JD. Sentence 2: State the business impact they deliver (e.g., "Proven ability to enhance workflow efficiency and data accuracy...").
3. Bullet Point Algorithm (XYZ Framework): EVERY experience bullet point must be rewritten into this exact structure:
   - Action Verb (e.g., Engineered, Orchestrated, Reconciled, Authored).
   - The specific Task/Project directly related to the JD.
   - The Metric or Result (Extract metrics like '500 records', '40% efficiency', 'zero-miss rate', '100% adherence' from the source data and front-load them where possible).
   - Example Transformation: Change "Managed weekly administrative scheduling" -> "Governed administrative scheduling and communications, achieving a zero-miss rate for departmental deadlines across critical academic projects."
4. Contextual Skill Integration: Do not isolate skills in the skills section. If the JD requires "Data Management", ensure a bullet point explicitly states how the candidate used Microsoft Excel to execute data management tasks.
5. Skill Categorization: Group skills into readable, bright-blue-titled clusters (e.g., Office & Administration, Technical Tools, Languages) separating individual skills with clean inline spacing.
6. Ruthless Trimming: Omit any data from the CANDIDATE RESUME that does not serve as direct evidence that the candidate can execute the core duties listed in the JOB DESCRIPTION.`

    const responseSchema = {
        type: "object",
        properties: {
            html: { type: "string", description: "The HTML content of the resume which can be converted to PDF using a headless browser like puppeteer" }
        },
        required: ["html"]
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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