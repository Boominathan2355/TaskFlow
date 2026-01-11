import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    loading = false,
    type = 'button',
    ...props
}, ref) => {

    const variants = {
        primary: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        success: 'bg-success text-success-foreground shadow-sm hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground shadow-sm hover:bg-warning/90',
        info: 'bg-info text-info-foreground shadow-sm hover:bg-info/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 py-2 text-sm',
        lg: 'h-10 px-8 text-base',
        icon: 'h-9 w-9 p-0'
    };

    return (
        <button
            ref={ref}
            type={type}
            className={twMerge(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
