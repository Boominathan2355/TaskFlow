import React from 'react';
import { useChat } from '../contexts/ChatContext';
import ChatList from '../components/molecules/ChatList';
import ChatWindow from '../components/molecules/ChatWindow';
import PageIntro from '../components/molecules/PageIntro';
import { MessageSquare, Users, Type, Sparkles } from 'lucide-react';

const ChatPage = () => {
    const { selectedChat } = useChat();

    const chatFeatures = [
        {
            icon: MessageSquare,
            title: 'Real-time Messaging',
            description: 'Instant communication with typing indicators',
            color: 'info'
        },
        {
            icon: Users,
            title: 'Group Chats',
            description: 'Collaborate with multiple team members',
            color: 'primary'
        },
        {
            icon: Type,
            title: 'Markdown Support',
            description: 'Rich text formatting for better expression',
            color: 'success'
        },
        {
            icon: Sparkles,
            title: 'Beta Features',
            description: 'Experimental features and improvements',
            color: 'warning'
        }
    ];

    return (
        <>
            <div className="px-6 pt-6 hidden md:block">
                <PageIntro
                    pageKey="chat"
                    title="💬 Team Chat (Beta)"
                    description="Stay connected with your team through real-time messaging. This feature is actively being improved!"
                    features={chatFeatures}
                    variant="beta"
                />
            </div>
            <div className="flex bg-card/60 backdrop-blur-xl border-x border-b border-border/40 overflow-hidden md:h-[calc(100vh-64px)] h-screen animate-in fade-in zoom-in-95 duration-700 mesh-gradient">
                {/* Sidebar / Chat List */}
                <div className={`w-full md:w-[320px] lg:w-[380px] border-r border-border/30 flex flex-col transition-all duration-500 glass-panel ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    <ChatList />
                </div>

                {/* Main Chat Area */}
                <div className={`flex-1 flex flex-col relative ${selectedChat ? 'flex' : 'hidden md:flex items-center justify-center'}`}>
                    {selectedChat ? (
                        <ChatWindow />
                    ) : (
                        <div className="flex flex-col items-center gap-6 p-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <div className="relative w-24 h-24 rounded-3xl bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
                                </div>
                            </div>
                            <div className="max-w-xs space-y-2">
                                <h3 className="text-2xl font-bold tracking-tight text-foreground">Your workspace, synchronized</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">Select a conversation from the sidebar to start collaborating in real-time.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatPage;
