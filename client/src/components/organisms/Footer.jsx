import React from 'react';

const Footer = () => {
    return (
        <footer className="border-t border-border mt-12 py-6 bg-background">
            <div className="w-full px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © 2024 TaskFlow. Built with React, TypeScript & Tailwind CSS.
                    </p>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-primary transition-colors">About</a>
                        <a href="#" className="hover:text-primary transition-colors">Help</a>
                        <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
