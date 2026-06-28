import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
})

/**
 * @description Service to generate interview report based on user self description,resume and job description.
 * 
 */


export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return response.data
}



/**
 * @description Service to get interview report by interview id.
 * 
 
*/



export const generateInterviewReportById = async (id) => {
    const response = await api.get(`/api/interview/report/${id}`)
    return response.data
}

/**
 * @description Service to get all interview reports of user.
 */

export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview")

    return response.data
}

/**
 * @description Service to generate resume pdf from interview report.
 */

export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.get(`/api/interview/resume/pdf/${interviewReportId}`, { responseType: "blob" })


    return response.data
}