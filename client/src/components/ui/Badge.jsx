import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Badge = ({ children, variant = 'default', className, ...props }) => {
    const variants = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'text-foreground border border-border',
        destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
        'priority-low': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        'priority-medium': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        'priority-high': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        'priority-urgent': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
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
