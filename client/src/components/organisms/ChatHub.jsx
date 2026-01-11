import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatList from '../molecules/ChatList';
import ChatWindow from '../molecules/ChatWindow';

const ChatHub = () => {
    const { isChatHubOpen, selectedChat } = useChat();

    if (!isChatHubOpen) return null;

    return (
        <div className="fixed md:bottom-24 md:right-6 md:w-[400px] md:h-[600px] inset-0 md:inset-auto bg-card border md:rounded-2xl shadow-2xl z-[90] flex overflow-hidden animate-in md:slide-in-from-bottom-5 fade-in duration-300">
            {/* If we want a separate sidebar on larger screens we could, but for a 400px popover, usually we toggle views */}
            {!selectedChat ? (
                <ChatList />
            ) : (
                <ChatWindow />
            )}
        </div>
    );
};

export default ChatHub;
