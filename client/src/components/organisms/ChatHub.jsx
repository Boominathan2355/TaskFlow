import React from 'react';
import { X } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import ChatList from '../molecules/ChatList';
import ChatWindow from '../molecules/ChatWindow';

const ChatHub = () => {
    const { isChatHubOpen, selectedChat, setIsChatHubOpen } = useChat();

    if (!isChatHubOpen) return null;

    return (
        <div className="fixed md:bottom-24 md:right-6 md:w-[400px] md:h-[600px] inset-0 md:inset-auto bg-card border md:rounded-2xl shadow-2xl z-[90] flex flex-col overflow-hidden animate-in md:slide-in-from-bottom-5 fade-in duration-300">
            {/* Close button - only visible on mobile */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-border/40 bg-card sticky top-0 z-10">
                <h2 className="font-bold text-lg">Messages</h2>
                <button
                    onClick={() => setIsChatHubOpen(false)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="Close Chat"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Chat content */}
            <div className="flex-1 overflow-hidden">
                {!selectedChat ? (
                    <ChatList />
                ) : (
                    <ChatWindow />
                )}
            </div>
        </div>
    );
};

export default ChatHub;
