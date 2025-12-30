import React, { createContext, useContext, useState } from 'react';
import { twMerge } from 'tailwind-merge';

const TabsContext = createContext({});

const Tabs = ({ defaultValue, value, onValueChange, children, className }) => {
    const [selected, setSelected] = useState(defaultValue);

    const current = value !== undefined ? value : selected;
    const onChange = onValueChange || setSelected;

    return (
        <TabsContext.Provider value={{ value: current, onChange }}>
            <div className={twMerge("flex flex-col gap-2", className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

const TabsList = ({ children, className }) => {
    return (
        <div className={twMerge(
            "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px]",
            className
        )}>
            {children}
        </div>
    );
};

const TabsTrigger = ({ value, children, className, disabled }) => {
    const { value: selectedValue, onChange } = useContext(TabsContext);
    const isActive = selectedValue === value;

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => !disabled && onChange(value)}
            className={twMerge(
                "inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-xl px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
                className
            )}
        >
            {children}
        </button>
    );
};

const TabsContent = ({ value, children, className }) => {
    const { value: selectedValue } = useContext(TabsContext);

    if (selectedValue !== value) return null;

    return (
        <div
            role="tabpanel"
            className={twMerge(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
        >
            {children}
        </div>
    );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
