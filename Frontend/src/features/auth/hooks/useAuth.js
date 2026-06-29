import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api.js"


export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context


    const handleLogin = async ({ email, password }) => {
        try {
            const data = await login({ email, password })
            if (data && data.user) {
                setUser(data.user)
                // Store token in localStorage for mobile (cross-origin cookies are blocked)
                if (data.token) localStorage.setItem("auth_token", data.token)
                return { success: true }
            }
            return { success: false, error: "Invalid email or password" }
        } catch (err) {
            return { success: false, error: err.response?.data?.message || "An error occurred during login" }
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        try {
            const data = await register({ username, email, password })
            if (data && data.user) {
                setUser(data.user)
                if (data.token) localStorage.setItem("auth_token", data.token)
                return { success: true }
            }
            return { success: false, error: "Registration failed" }
        }
        catch (err) {
            return { success: false, error: err.response?.data?.message || "An error occurred during registration" }
        }
    }

    const handleLogout = async () => {
        try {
            await logout()
            setUser(null)
        } catch (err) {
            setUser(null)
        } finally {
            localStorage.removeItem("auth_token")
        }
    }

    useEffect(() => {

        const getAndSetUser = async () => {
            try {
                const data = await getMe()
                setUser(data.user)
            } catch (err) { }
            finally {
                setLoading(false)
            }
        }
        getAndSetUser()
    }, [])


    return { user, loading, handleRegister, handleLogin, handleLogout }

}