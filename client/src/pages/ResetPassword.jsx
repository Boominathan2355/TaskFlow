import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useTheme } from '../contexts/ThemeContext';
import { Lock, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('Password must be at least 6 characters');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            await axios.put(`/api/auth/reset-password/${token}`, { password });

            setStatus('success');
            setMessage('Password reset successfully!');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.error || 'Invalid or expired token.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative transition-colors duration-200">
            {/* Theme Toggle */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-colors shadow-sm"
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
                        <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                            <Lock className="w-6 h-6" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Set New Password</h2>
                    <p className="text-sm text-muted-foreground">
                        Create a strong password for your account.
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="p-4 bg-green-500/10 text-green-600 rounded-xl flex flex-col items-center gap-2 border border-green-500/20">
                            <CheckCircle className="w-8 h-8" />
                            <p className="font-medium text-sm">
                                {message}
                            </p>
                            <p className="text-xs opacity-90">
                                Redirecting to login...
                            </p>
                        </div>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {status === 'error' && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2 border border-destructive/20 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4" />
                                {message}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-foreground">
                                    New Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="bg-background border-border focus:ring-primary rounded-xl"
                                    disabled={status === 'loading'}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                    Confirm Password
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="bg-background border-border focus:ring-primary rounded-xl"
                                    disabled={status === 'loading'}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground rounded-xl py-5 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? (
                                <span className="flex items-center gap-2 justify-center">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Updating...
                                </span>
                            ) : 'Update Password'}
                        </Button>

                        <div className="text-center">
                            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>

            <footer className="fixed bottom-4 text-center text-xs text-muted-foreground w-full">
                © 2024 TaskFlow. All rights reserved.
            </footer>
        </div>
    );
};

export default ResetPassword;
