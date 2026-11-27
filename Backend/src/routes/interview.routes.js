const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")

const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()


/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description ,resyme pdf, and job description.
 * @access private
 */


interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterviewReportController)


/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController);


/**
 * @route GET /api/interview/
 * @description get all interview reports of the user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController);


/**
 * @route POST /api/interview/resume/:interviewReportId
 * @description generate and download resume pdf of user from interview report.
 * @access private
 */
interviewRouter.get("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController);


/**
 * @route DELETE /api/interview/report/:interviewId
 * @description delete interview report by interviewId.
 * @access private
 */
interviewRouter.delete("/report/:interviewId", authMiddleware.authUser, interviewController.deleteInterviewReportController);

/**
 * @route POST /api/interview/evaluate-answer
 * @description evaluate a candidate's practice answer with AI
 * @access private
 */
interviewRouter.post("/evaluate-answer", authMiddleware.authUser, interviewController.evaluateAnswerController);

/**
 * @route GET /api/interview/elevator-pitch/:interviewId
 * @description generate a 60-second elevator pitch for the interview
 * @access private
 */
interviewRouter.get("/elevator-pitch/:interviewId", authMiddleware.authUser, interviewController.getElevatorPitchController);

/**
 * @route POST /api/interview/live-turn/:interviewId
 * @description conduct a multi-turn live AI interview with dynamic follow-ups
 * @access private
 */
interviewRouter.post("/live-turn/:interviewId", authMiddleware.authUser, interviewController.liveInterviewTurnController);

module.exports = interviewRouter