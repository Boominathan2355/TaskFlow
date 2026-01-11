import React from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, X } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import VideoPlayer from '../atoms/VideoPlayer';

const CallModal = () => {
    const {
        callAccepted,
        callEnded,
        leaveCall,
        incomingCall,
        answerCall,
        isReceivingCall,
        toggleScreenShare,
        isScreenSharing,
        isVideoCall,
        toggleAudio,
        toggleVideo,
        isAudioMuted,
        peers, // Add peers for status logic
        hasAudio,
        hasVideo
    } = useCall();

    // Timer Logic
    const [duration, setDuration] = React.useState(0);
    const [callStartTime, setCallStartTime] = React.useState(null);
    // peers is already accessed above from useCall()

    React.useEffect(() => {
        if (callAccepted && !callEnded && peers && peers.length > 0) {
            if (!callStartTime) setCallStartTime(Date.now());

            const interval = setInterval(() => {
                setDuration(Math.floor((Date.now() - (callStartTime || Date.now())) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        } else if (peers && peers.length === 0) {
            // Ringing state logic if needed
        }
    }, [callAccepted, callEnded, peers, callStartTime]);

    // If no active call and no incoming call, return null (unless we want a lingering stats screen)
    if (callEnded && !isReceivingCall) return null;
    if (!callAccepted && !isReceivingCall) return null;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Incoming Call Card */}
            {isReceivingCall && !callAccepted && (
                <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <Video size={40} className="text-primary" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-bold">{incomingCall?.name || 'Unknown User'}</h3>
                        <p className="text-muted-foreground mt-1">is calling you...</p>
                        {incomingCall?.isVideo ? (
                            <div className="flex items-center justify-center gap-2 mt-2 text-xs font-bold uppercase tracking-wider text-primary">
                                <Video size={12} /> Video Call
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <Mic size={12} /> Audio Call
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => leaveCall(false)} // Reject
                            className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
                        >
                            Decline
                        </button>
                        <button
                            onClick={answerCall}
                            className="flex-1 py-3 bg-success text-success-foreground rounded-xl font-bold hover:opacity-90 transition-opacity animate-pulse"
                        >
                            Answer
                        </button>
                    </div>
                </div>
            )}

            {/* Active Call UI - ALWAYS FULL SCREEN */}
            {callAccepted && !callEnded && (
                <div className="fixed inset-0 h-full w-full bg-black flex flex-col overflow-hidden transition-all duration-300 relative group/modal">

                    {/* Header Overlay */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-20">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${peers && peers.length > 0 ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                            <span className="font-mono text-sm font-bold opacity-70 text-white">
                                {isVideoCall ? 'VIDEO CALL' : 'AUDIO CALL'}
                            </span>
                            {peers && peers.length > 0 && (
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded ml-2 font-mono text-white">
                                    {formatTime(duration)}
                                </span>
                            )}
                        </div>
                        <div className="text-right text-white">
                            <h2 className="font-bold text-lg text-shadow">{incomingCall?.name || (peers && peers.length > 0 ? 'Connected' : 'Ringing...')}</h2>
                            {peers && peers.length === 0 && <p className="text-xs text-white/70">Waiting for others to join...</p>}
                        </div>
                    </div>

                    {/* Video Area */}
                    <div className="flex-1 bg-black relative w-full h-full">
                        <VideoPlayer />
                    </div>

                    {/* Footer Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/modal:opacity-100 transition-opacity duration-300 z-20 pb-10">
                        <button
                            onClick={toggleAudio}
                            className={`p-4 rounded-full transition-all relative ${!hasAudio
                                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 cursor-pointer' // Fully actionable
                                : isAudioMuted
                                    ? 'bg-destructive text-destructive-foreground'
                                    : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
                                }`}
                            title={!hasAudio ? "No Microphone (Click to Retry)" : (isAudioMuted ? "Unmute" : "Mute")}
                        >
                            {isAudioMuted || !hasAudio ? <MicOff size={24} /> : <Mic size={24} />}
                            {!hasAudio && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-red-500 font-bold text-lg">\</div>}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className={`p-4 rounded-full transition-all relative ${!hasVideo
                                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 cursor-pointer' // Fully actionable
                                : !isVideoCall
                                    ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
                                    : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
                                } ${!isVideoCall && hasVideo ? 'bg-destructive text-destructive-foreground' : ''}`}
                            title={!hasVideo ? "No Camera (Click to Retry)" : (isVideoCall ? "Turn Off Camera" : "Turn On Camera")}
                        >
                            <div className={!hasVideo ? "opacity-50" : ""}>
                                {!isVideoCall || !hasVideo ? <VideoOff size={24} /> : <Video size={24} />}
                            </div>
                            {!hasVideo && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-red-500 font-bold text-lg">\</div>}
                        </button>
                        <button
                            onClick={toggleScreenShare}
                            disabled={!peers || peers.length === 0}
                            className={`p-4 rounded-full transition-all ${!peers || peers.length === 0
                                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                                : isScreenSharing
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
                                }`}
                            title={!peers || peers.length === 0 ? "Wait for others to join to share screen" : "Share Screen"}
                        >
                            <Monitor size={24} />
                        </button>
                        <button
                            onClick={() => leaveCall(true)}
                            className="p-4 bg-destructive text-destructive-foreground rounded-full hover:scale-110 transition-transform shadow-lg shadow-destructive/20"
                            title="End Call"
                        >
                            <PhoneOff size={24} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallModal;
