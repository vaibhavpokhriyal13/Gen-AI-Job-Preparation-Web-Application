import axios from "axios";


const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
})

// Attach JWT from localStorage as Authorization header on every request.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token")
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
})


export async function register({ username, email, password }) {

    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        }, )

        return response.data
    } catch (err) {
        console.log(err)
        throw err
    }


}

export async function login({ email, password }) {

    try {
        const response = await api.post('/api/auth/login', {
            email, password
        },)

        return response.data
    } catch (err) {
        console.log(err)
        throw err
    }


}


export async function logout() {

    try {
        const response = await api.get('/api/auth/logout', {
        },)

        return response.data
    } catch (err) {
        console.log(err)
    }


}


export async function getMe() {

    try {
        const response = await api.get('/api/auth/get-me', {
        },)

        return response.data
    } catch (err) {
        console.log(err)
    }


}