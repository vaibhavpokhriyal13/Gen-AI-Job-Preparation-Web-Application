import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
})

// Attach JWT from localStorage as Authorization header on every request.
// This is the mobile-safe fallback: cross-origin cookies are blocked on
// Safari/iOS, so we send the token via header instead.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token")
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
})

/**
 * @description Service to generate interview report based on user self description,resume and job description.
 * 
 */


export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    const formData = new FormData();
    if (resumeFile) {
        formData.append("resume", resumeFile); // only attach if a file was actually selected
    }
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