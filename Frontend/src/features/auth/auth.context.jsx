import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext()
export const AuthProvider = ({ children }) => {

    // Hydrate from localStorage immediately so Protected doesn't redirect on refresh
    const [user, setUser] = useState(() => {
        try {
            const cached = localStorage.getItem("auth_user")
            return cached ? JSON.parse(cached) : null
        } catch {
            return null
        }
    })

    // loading=false when we already have a cached user, so Protected doesn't flash
    const [loading, setLoading] = useState(() => {
        return !localStorage.getItem("auth_user")
    })

    // Keep localStorage in sync whenever user changes
    useEffect(() => {
        if (user) {
            localStorage.setItem("auth_user", JSON.stringify(user))
        } else {
            localStorage.removeItem("auth_user")
        }
    }, [user])

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    )
}