import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../atoms/Button';

const PageIntro = ({
    pageKey,
    title,
    description,
    features = [],
    variant = 'default'
}) => {
    const [isVisible, setIsVisible] = useState(() => {
        const dismissed = localStorage.getItem(`pageIntro_${pageKey}_dismissed`);
        return !dismissed;
    });

    const handleDismiss = () => {
        localStorage.setItem(`pageIntro_${pageKey}_dismissed`, 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const variantStyles = {
        default: 'from-primary/5 to-info/5 border-primary/10',
        beta: 'from-warning/5 to-info/5 border-warning/10',
        admin: 'from-destructive/5 to-primary/5 border-destructive/10'
    };

    return (
        <div className={`bg-gradient-to-r ${variantStyles[variant]} border rounded-xl p-6 mb-8 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-info/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>

            <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex-1 space-y-4">
                    <h3 className="font-semibold text-lg text-foreground">{title}</h3>

                    {description && (
                        <p className="text-muted-foreground text-sm">{description}</p>
                    )}

                    {features.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                const colorClass = {
                                    info: 'bg-info/10 text-info',
                                    success: 'bg-success/10 text-success',
                                    warning: 'bg-warning/10 text-warning',
                                    primary: 'bg-primary/10 text-primary'
                                }[feature.color] || 'bg-info/10 text-info';

                                return (
                                    <div key={index} className="flex gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm">{feature.title}</h4>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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

export default PageIntro;
