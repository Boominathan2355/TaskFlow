import React from 'react';
import {
    Bold,
    Italic,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    Link as LinkIcon,
    Quote,
    Code,
    Type
} from 'lucide-react';

const MarkdownToolbar = ({ textareaRef, value, onChange }) => {

    const insertMarkdown = (before, after = '') => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);

        const newText =
            value.substring(0, start) +
            before +
            selectedText +
            after +
            value.substring(end);

        onChange(newText);

        // Reset cursor/selection after state update
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + before.length,
                end + before.length
            );
        }, 0);
    };

    const actions = [
        { icon: <Bold className="w-4 h-4" />, title: 'Bold', action: () => insertMarkdown('**', '**') },
        { icon: <Italic className="w-4 h-4" />, title: 'Italic', action: () => insertMarkdown('*', '*') },
        { icon: <Type className="w-4 h-4" />, title: 'Heading', action: () => insertMarkdown('### ') },
        { icon: <List className="w-4 h-4" />, title: 'Bullet List', action: () => insertMarkdown('- ') },
        { icon: <ListOrdered className="w-4 h-4" />, title: 'Numbered List', action: () => insertMarkdown('1. ') },
        { icon: <Quote className="w-4 h-4" />, title: 'Quote', action: () => insertMarkdown('> ') },
        { icon: <Code className="w-4 h-4" />, title: 'Code', action: () => insertMarkdown('`', '`') },
        { icon: <LinkIcon className="w-4 h-4" />, title: 'Link', action: () => insertMarkdown('[', '](url)') },
    ];

    return (
        <div className="flex items-center gap-0.5 p-1 border-b border-border bg-muted/30">
            {actions.map((btn, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={btn.action}
                    title={btn.title}
                    className="p-1.5 rounded hover:bg-background hover:shadow-sm text-muted-foreground hover:text-foreground transition-all"
                >
                    {btn.icon}
                </button>
            ))}
        </div>
    );
};

export default MarkdownToolbar;
