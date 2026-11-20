const pdfParse = require('pdf-parse')
const { generateInterviewReport, generateResumePDF } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")


/**
 * @description generate new interview report on the basis of user self description ,resyme pdf, and job description.
 
 */


async function generateInterviewReportController(req, res) {
    try {
        let resumeContent = "";

        // 1. Check if file is uploaded before trying to parse
        if (req.file) {
            try {
                if (typeof pdfParse === 'function') {
                    const pdfData = await pdfParse(req.file.buffer);
                    resumeContent = pdfData?.text || "";
                } else {
                    const PdfClass = pdfParse.PDFParse || pdfParse.default || pdfParse;
                    const parser = new PdfClass({ data: req.file.buffer });
                    const result = await parser.getText();
                    resumeContent = typeof result === 'string' ? result : (result?.text || "");
                    if (typeof parser.destroy === 'function') {
                        await parser.destroy();
                    }
                }
            } catch (parseErr) {
                console.warn("Primary PDF parse attempt failed, trying fallback:", parseErr.message);
                try {
                    const PdfClass = pdfParse.PDFParse || pdfParse.default || pdfParse;
                    const parser = new PdfClass(Uint8Array.from(req.file.buffer));
                    const result = await parser.getText();
                    resumeContent = typeof result === 'string' ? result : (result?.text || "");
                    if (typeof parser.destroy === 'function') {
                        await parser.destroy();
                    }
                } catch (fallbackErr) {
                    console.error("All PDF parse attempts failed:", fallbackErr);
                }
            }
        }

        // Guarantee resumeContent is a pure string (never an object or [object Object])
        if (typeof resumeContent === 'object' && resumeContent !== null) {
            resumeContent = resumeContent.text || "";
        }
        resumeContent = String(resumeContent || "").trim();

        const { selfDescription = "", jobDescription = "" } = req.body;

        // 2. Call the AI service
        const interviewReportByAi = await generateInterviewReport({
            resume: resumeContent,
            selfDescription,
            jobDescription
        });

        // Validation safety check for gibberish/keyboard-mashing inputs
        if (interviewReportByAi.isValid === false) {
            return res.status(400).json({
                message: interviewReportByAi.errorMessage || "The provided job description or candidate profile could not be parsed as valid text. Please verify your input."
            });
        }

        const finalResumeString = typeof resumeContent === 'string' ? resumeContent : (resumeContent?.text || "");

        const { resume: aiEchoedResume, ...cleanAiData } = interviewReportByAi;

        // 3. Save to database
        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: String(finalResumeString),
            selfDescription,
            jobDescription,
            ...cleanAiData
        });

        res.status(201).json({
            message: "Interview report generated successfully",
            interviewReport
        });
    } catch (error) {
        // Log the exact error to console for debugging
        console.error("Error generating interview report:", error);

        let clientMessage = "Error generating interview report. Please try again.";
        const errMsg = error?.message || "";
        if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE")) {
            clientMessage = "The AI model is experiencing temporary high traffic. Please wait a moment and try again.";
        } else if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
            clientMessage = "Gemini rate limit reached. Please wait a moment before trying again.";
        }

        res.status(500).json({
            message: clientMessage,
            error: error.message
        });
    }
}




/**
 *  @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params
    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found"
        })
    }
    res.status(200).json({
        message: "Interview report found",
        interviewReport
    })
}


/**
 * @description Controller to get all interview reports of the user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        // FIX: Using the correct model name (interviewReportModel)
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestion -behavioralQuestion -skillGaps -preparationPlan");

        res.status(200).json({
            message: "Interview reports fetched successfully",
            interviewReports
        });
    } catch (error) {
        console.error("Error fetching all reports:", error);
        res.status(500).json({ message: "Error fetching reports" });
    }
}



/**
 * @description Controller to generate resume pdf.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found"
            })
        }

        const { resume, selfDescription, jobDescription } = interviewReport

        const pdfBuffer = await generateResumePDF({
            resume,
            selfDescription,
            jobDescription
        })
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer);
    } catch (error) {
        console.error("Error generating resume pdf:", error);

        let clientMessage = "Error generating resume pdf. Please try again.";
        const errMsg = error?.message || "";
        if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE")) {
            clientMessage = "The AI model is experiencing temporary high traffic. Please wait a moment and try again.";
        } else if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
            clientMessage = "Gemini rate limit reached. Please wait a moment before trying again.";
        }

        res.status(500).json({
            message: clientMessage,
            error: error.message
        });
    }
}

async function deleteInterviewReportController(req, res) {
    try {
        const { interviewId } = req.params;
        const result = await interviewReportModel.deleteOne({ _id: interviewId, user: req.user.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "Interview report not found or you are not authorized to delete it"
            });
        }
        res.status(200).json({
            message: "Interview report deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting interview report:", error);
        res.status(500).json({
            message: "Error deleting interview report",
            error: error.message
        });
    }
}

module.exports = { 
    generateInterviewReportController, 
    getInterviewReportByIdController, 
    getAllInterviewReportsController, 
    generateResumePdfController,
    deleteInterviewReportController
}