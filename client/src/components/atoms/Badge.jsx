import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Badge = ({ children, variant = 'default', className, ...props }) => {
    const variants = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'text-foreground border border-border',
        destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20',
        success: 'bg-success/10 text-success hover:bg-success/20 border-success/20',
        warning: 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20',
        info: 'bg-info/10 text-info hover:bg-info/20 border-info/20',
        neutral: 'bg-neutral/10 text-neutral hover:bg-neutral/20 border-neutral/20',
        'priority-low': 'bg-priority-low/10 text-priority-low border-priority-low/20',
        'priority-medium': 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
        'priority-high': 'bg-priority-high/10 text-priority-high border-priority-high/20',
        'priority-urgent': 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20',
    };

    return (
        <div
            className={twMerge(
                'inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export default Badge;
