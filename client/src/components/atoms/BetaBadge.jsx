import React from 'react';
import { twMerge } from 'tailwind-merge';

const BetaBadge = ({
    text = 'BETA',
    variant = 'warning',
    pulse = true,
    className = ''
}) => {
    const variants = {
        warning: 'bg-warning/10 text-warning border-warning/20',
        info: 'bg-info/10 text-info border-info/20',
        success: 'bg-success/10 text-success border-success/20',
        primary: 'bg-primary/10 text-primary border-primary/20'
    };

    return (
        <span
            className={twMerge(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border',
                variants[variant],
                pulse && 'animate-pulse',
                className
            )}
        >
            {text}
        </span>
    );
};

export default BetaBadge;
