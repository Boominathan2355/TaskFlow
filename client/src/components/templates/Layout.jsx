import React from 'react';
import Header from '../organisms/Header';
import Footer from '../organisms/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { Outlet, Navigate } from 'react-router-dom';

const Layout = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="spinner w-8 h-8"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />
            <main className={`flex-1 w-full flex flex-col ${window.location.pathname.includes('/chat') ? 'px-0 py-0' : 'px-6 py-8'}`}>
                <Outlet />
            </main>
            {!window.location.pathname.includes('/chat') && <Footer />}
        </div>
    );
};

export default Layout;
