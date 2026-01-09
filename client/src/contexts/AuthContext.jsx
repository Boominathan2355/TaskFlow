import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastActivity, setLastActivity] = useState(Date.now());

    // Activity listener to track user interaction
    useEffect(() => {
        const updateActivity = () => setLastActivity(Date.now());

        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keypress', updateActivity);
        window.addEventListener('click', updateActivity);
        window.addEventListener('scroll', updateActivity);

        return () => {
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('keypress', updateActivity);
            window.removeEventListener('click', updateActivity);
            window.removeEventListener('scroll', updateActivity);
        };
    }, []);

    // Session check interval
    useEffect(() => {
        if (!user) return;

        const checkSession = async () => {
            const now = Date.now();
            const tokenTimestamp = parseInt(localStorage.getItem('tokenTimestamp') || '0');
            const IDLE_TIMEOUT = 60 * 60 * 1000; // 1 hour
            const REFRESH_THRESHOLD = 50 * 60 * 1000; // 50 minutes

            // Idle Check: Logout if inactive for > 1 hour
            if (now - lastActivity > IDLE_TIMEOUT) {
                console.log('Session expired due to inactivity');
                logout();
            }
        };

        const interval = setInterval(checkSession, 60 * 1000); // Check every minute
        return () => clearInterval(interval);
    }, [user, lastActivity]);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            // Optionally verify token with backend
            verifyToken();
        } else {
            setLoading(false);
        }
    }, []);

    const verifyToken = async () => {
        try {
            const { data } = await authAPI.getCurrentUser();
            setUser(data.user);
        } catch (error) {
            console.error('Token verification failed:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const { data } = await authAPI.login({ email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('tokenTimestamp', Date.now().toString());
            setUser(data.user);
            setLastActivity(Date.now());
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const signup = async (name, email, password) => {
        try {
            const { data } = await authAPI.signup({ name, email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('tokenTimestamp', Date.now().toString());
            setUser(data.user);
            setLastActivity(Date.now());
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Signup failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenTimestamp');
        setUser(null);
    };

    const updateUserProfile = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                signup,
                logout,
                updateUserProfile,
                isAuthenticated: !!user,
                isAdmin: user?.role === 'Admin'
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
