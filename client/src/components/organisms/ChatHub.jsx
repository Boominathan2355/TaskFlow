import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatList from '../molecules/ChatList';
import ChatWindow from '../molecules/ChatWindow';

const ChatHub = () => {
    const { isChatHubOpen, selectedChat } = useChat();

    if (!isChatHubOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-card border rounded-2xl shadow-2xl z-[90] flex overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
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
