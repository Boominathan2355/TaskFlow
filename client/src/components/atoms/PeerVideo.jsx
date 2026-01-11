import React, { useRef, useEffect, useState } from "react";
import { User, Mic, MicOff } from "lucide-react";

const PeerVideo = ({ peer, name, className }) => {
    const ref = useRef();
    const [hasVideo, setHasVideo] = useState(false);
    const [hasAudio, setHasAudio] = useState(false);

    useEffect(() => {
        if (peer) {
            peer.on("stream", stream => {
                if (ref.current) ref.current.srcObject = stream;

                // Check initial tracks
                setHasVideo(stream.getVideoTracks().some(t => t.enabled));
                setHasAudio(stream.getAudioTracks().some(t => t.enabled));

                // Listen for track changes
                stream.getVideoTracks().forEach(track => {
                    track.onmute = () => setHasVideo(false);
                    track.onunmute = () => setHasVideo(true);
                    track.onended = () => setHasVideo(false);
                });
            });

            // Also listen for data/signaling if needed, but stream events are best for track status
            // SimplePeer doesn't emit 'track-updated' easily without signal wrapping, 
            // but we can poll or rely on stream mutation.
            // For now, assume if stream is active we show it.
        }
    }, [peer]);

    // Generate initials
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

    return (
        <div className={`relative bg-zinc-900 overflow-hidden ${className || 'rounded-2xl aspect-video md:aspect-auto h-full min-h-[200px]'}`}>
            <video
                playsInline
                ref={ref}
                autoPlay
                className={`w-full h-full object-cover ${!hasVideo ? 'hidden' : 'block'}`}
            />

            {!hasVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <span className="text-3xl font-bold text-primary">{initials}</span>
                    </div>
                    {/* Pulsing effect for audio could go here */}
                </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm">
                    <p className="text-white text-sm font-medium">{name}</p>
                </div>
                {/* Audio Status Indicator */}
                {/* This could be enhanced to detect speaking */}
            </div>
        </div>
    );
};

export default PeerVideo;
