import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api.js"


export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            if (data && data.user) {
                setUser(data.user)
                return { success: true }
            }
            return { success: false, error: "Invalid email or password" }
        } catch (err) {
            return { success: false, error: err.response?.data?.message || "An error occurred during login" }
        }
        finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            if (data && data.user) {
                setUser(data.user)
                return { success: true }
            }
            return { success: false, error: "Registration failed" }
        }
        catch (err) {
            return { success: false, error: err.response?.data?.message || "An error occurred during registration" }
        }
        finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null) // this triggers the useEffect in AuthContext to clear localStorage
        } catch (err) {
            // Even if logout API fails, clear local session
            setUser(null)
        } finally {
            setLoading(false)
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