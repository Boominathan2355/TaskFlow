import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Avatar = ({ src, alt, fallback, className, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base',
        xl: 'w-12 h-12 text-lg'
    };

    return (
        <div
            className={twMerge(
                'relative flex shrink-0 overflow-hidden rounded-full bg-muted border border-border items-center justify-center font-medium text-muted-foreground uppercase',
                sizeClasses[size],
                className
            )}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className="aspect-square h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                />
            ) : null}
            <span className={src ? 'hidden' : 'flex'}>
                {fallback || alt?.charAt(0) || '?'}
            </span>
        </div>
    );
};

export default Avatar;
