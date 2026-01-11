import React from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

const FloatingChatIcon = () => {
    const { isChatHubOpen, toggleChatHub, notification } = useChat();

    return (
        <button
            onClick={toggleChatHub}
            className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 z-[100] flex items-center justify-center
                ${isChatHubOpen
                    ? 'bg-secondary text-secondary-foreground hover:bg-muted'
                    : 'bg-primary text-primary-foreground hover:scale-110'}`}
            aria-label="Toggle Chat"
        >
            {isChatHubOpen ? (
                <X size={24} />
            ) : (
                <div className="relative">
                    <MessageSquare size={24} />
                    {notification.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {notification.length}
                        </span>
                    )}
                </div>
            )}
        </button>
    );
};

export default FloatingChatIcon;
