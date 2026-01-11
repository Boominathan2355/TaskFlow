import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Input from '../components/atoms/Input';
import Button from '../components/atoms/Button';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 transition-colors duration-200 relative">
            <div className="absolute top-4 right-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors shadow-sm"
                    aria-label="Toggle theme"
                >
                    {isDark ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                    )}
                </button>
            </div>

            <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 space-y-8 border border-border">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">TaskFlow</h2>
                    <p className="text-sm text-muted-foreground">
                        Welcome back! Sign in to your account
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2 border border-destructive/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                            {typeof error === 'string' ? error : (error?.message || 'An error occurred')}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="bg-background border-border focus:ring-primary rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-foreground">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="bg-background border-border focus:ring-primary rounded-xl"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background"
                                />
                                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                                    Remember me
                                </label>
                            </div>
                            <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground rounded-xl py-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2 justify-center">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                Signing in...
                            </span>
                        ) : 'Sign in'}
                    </Button>
                </form>

                <div className="text-center space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-medium text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>

            <footer className="fixed bottom-4 text-center text-xs text-muted-foreground w-full">
                © 2024 TaskFlow. All rights reserved.
            </footer>
        </div>
    );
};

export default Login;
