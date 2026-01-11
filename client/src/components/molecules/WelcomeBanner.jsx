import React, { useState, useEffect } from 'react';
import { X, Sparkles, LayoutGrid, Users, Bell } from 'lucide-react';
import Button from '../atoms/Button';

const WelcomeBanner = () => {
    // Initialize state from localStorage, defaulting to true if key doesn't exist
    const [isVisible, setIsVisible] = useState(() => {
        const dismissed = localStorage.getItem('welcomeBannerDismissed');
        return !dismissed;
    });

    const handleDismiss = () => {
        localStorage.setItem('welcomeBannerDismissed', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-primary/5 to-info/5 border border-primary/10 rounded-xl p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-info/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg text-foreground">Welcome to TaskFlow!</h3>
                    </div>

                    <p className="text-muted-foreground">
                        Get started with these powerful features to manage your projects efficiently:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
                            <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0 text-info">
                                <LayoutGrid className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">Kanban Boards</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Drag and drop tasks between workflow stages
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">Team Collaboration</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Assign tasks, add comments, and track progress
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
                            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0 text-success">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">Real-time Updates</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Stay notified on task changes and comments
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismiss}
                    className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default WelcomeBanner;
