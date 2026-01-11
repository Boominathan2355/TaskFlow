import React from 'react';
import { useCall } from '../../contexts/CallContext';
import PeerVideo from './PeerVideo';

const VideoPlayer = () => {
    const { name, callAccepted, myVideo, callEnded, stream, peers, isVideoCall } = useCall();

    React.useEffect(() => {
        if (myVideo.current && stream) {
            myVideo.current.srcObject = stream;
        }
    }, [myVideo, stream]);

    // Layout Logic
    const isOneOnOne = peers && peers.length === 1;

    // Determine if we should be in "Video Mode" (PiP)
    // We stay in video mode if *either* I have my camera on, OR the remote peer seems to be sending video.
    // Since checking remote tracks strictly might be async, we can default to: if it was a video call (isVideoCall=true), we show PiP.
    // BUT the issue is isVideoCall turns false when *I* mute.
    // So let's add a heuristic: If isOneOnOne, and (isVideoCall OR remoteHasVideo).
    // Note: PeerVideo handles the "no track" logic visually, but here we decide the *container* layout.
    // Let's assume if I am in a "Video Call" session, I want PiP.

    // Better Approach:
    // We can assume it is a video call layout if *anyone* is visible.
    // But since we don't have easy access to remote track state here without listeners, 
    // let's try to assume strict Audio Mode only if *Intent* is Audio Only.
    // The previous implementation used `isVideoCall`, which is toggled by mute button. 
    // This is the main flaw. calling `setIsVideoCall` updates state.

    // We should probably rely on a separate "mode" state from CallContext, or just check if *stream* has video tracks enabled?
    // Actually, `isVideoCall` in CallContext IS just the toggle state of my camera.
    // We need to know if the *Remote* user has video.

    // For now, let's fix the Local PiP to show Avatar when I am muted, 
    // AND change the condition to be more sticky. 
    // BUT without new state, we can't easily distinguish "I joined as Audio" vs "I joined as Video but muted".
    // However, we can look at `stream.getVideoTracks()`. If they exist but are disabled, we are in "Muted Video" mode?
    // If they don't exist, we are in "Audio Only" mode?
    // `joinCall` requests video: true/false.
    // If video: true, we get a track. Muting it just sets enabled=false.
    // If video: false, we get NO track (or we stop it immediately). 
    // In CallContext `joinCall`:
    // if (!video) stream.getVideoTracks().forEach(t => t.enabled = false);
    // So we ALWAYS have a video track if we joined as video?
    // Wait: `const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });`
    // Yes, we always assume video capability unless permissions denied.

    // So: check if we *have* video tracks.
    const hasVideoTracks = stream && stream.getVideoTracks().length > 0;

    // If we have video tracks (even if muted), we can consider this a "Video Capable" session -> Use PiP.
    // If we strictly don't have video tracks, maybe use Audio layout.
    // However, if Remote peer has video, we still want PiP regardless of my tracks.

    // Let's force PiP for 1-on-1 unless we are SURE both are audio-only?
    // Or just always use PiP for 1-on-1?
    // If 1-on-1 Audio (Profile Mode) is desired, it's specific.
    // Let's rely on the fact that `PeerVideo` renders an avatar if no video.
    // If we use PiP layout for Audio-Audio:
    // Background = Remote Avatar. PiP = My Avatar.
    // This is actually a fine layout! It's better than the "Small Center Box" for Audio.
    // The "Small Center Box" is good for strict "Focus" mode.

    // Let's try to detect if OTHER person has video.
    // Since we can't easily, let's look at `isVideoCall || (peers[0] && ...)`? No.

    // COMPROMISE:
    // Use PiP layout if `hasVideoTracks` (meaning I *could* enable video, i.e., I am in a video session) 
    // OR `isVideoCall`.

    // Actually, let's allow the "Audio Layout" (Spotlight) ONLY if it's explicitly purely audio content.
    // But since we can't verify remote content easily:
    // Let's default to PiP for 1-on-1, but handle the "My Video" box better (Avatar).

    // Wait, the user request says: "Audio Call: Only a single relevant profile image should be displayed".
    // This implies hiding ME.
    // So if it's Audio-Audio, hiding ME is correct.

    // Rule:
    // 1. If I am sending Video -> PiP.
    // 2. If I am NOT sending Video:
    //    a. If Remote IS sending Video -> PiP (Screen is video, I am avatar in corner? Or I am hidden?)
    //       "Profile image should be shown in a small corner". 
    //       This implies if I am in a video call (viewing video), my profile is in the corner.
    //    b. If Remote is NOT sending Video -> Spotlight (Remote Profile centered, I am hidden).

    // Since I can't know "Remote IS sending Video" easily in this component without refactoring PeerVideo to lift state...
    // I will refactor PeerVideo slightly? No, that's risky.

    // Let's ASSUME if `isVideoCall` is false (I am muted), we use Audio Layout... 
    // UNLESS we can detect the remote stream.
    // Use `peers[0].peer._remoteStreams`? SimplePeer exposes this.

    const [remoteHasVideo, setRemoteHasVideo] = React.useState(false);

    React.useEffect(() => {
        if (isOneOnOne && peers[0].peer) {
            const checkVideo = () => {
                const streams = peers[0].peer._remoteStreams;
                if (streams && streams.length > 0) {
                    const vidTracks = streams[0].getVideoTracks();
                    // Check if any track is enabled. 
                    // Note: 'enabled' might not sync instantly over wire without metadata, 
                    // but track *presence* is a good indicator of "Video Call".
                    // If track exists, we assume Video Layout.
                    if (vidTracks.length > 0) {
                        setRemoteHasVideo(true);
                        // Also listen for mute/unmute? 
                        vidTracks.forEach(t => {
                            t.onunmute = () => setRemoteHasVideo(true);
                            t.onmute = () => setRemoteHasVideo(false);
                            // Initial state check
                            if (!t.muted && t.enabled) setRemoteHasVideo(true);
                            else setRemoteHasVideo(false);
                        });
                    } else {
                        setRemoteHasVideo(false);
                    }
                }
            };

            peers[0].peer.on('stream', checkVideo);
            peers[0].peer.on('track', checkVideo);
            // check immediately
            checkVideo();
        }
    }, [peers, isOneOnOne]);

    // Combined Layout Condition
    const showVideoLayout = isVideoCall || remoteHasVideo;

    // 1-on-1 Layouts
    if (isOneOnOne) {
        if (showVideoLayout) {
            // PiP Layout
            return (
                <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                    {/* Remote Peer (Full Screen) */}
                    <div className="absolute inset-0 z-0">
                        <PeerVideo
                            peer={peers[0].peer}
                            name={peers[0].userName}
                            className="w-full h-full"
                        />
                    </div>

                    {/* My Video / Avatar (Picture in Picture) */}
                    {stream && (
                        <div className="absolute bottom-6 right-6 z-20 w-48 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-900">
                            {/* Show Video if Enabled */}
                            <video
                                playsInline
                                muted
                                ref={myVideo}
                                autoPlay
                                className={`w-full h-full object-cover ${!isVideoCall ? 'hidden' : 'block'}`}
                            />
                            {/* Show Avatar if Disabled */}
                            {!isVideoCall && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-1">
                                        <span className="text-lg font-bold text-primary">You</span>
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
                                You
                            </div>
                        </div>
                    )}
                </div>
            );
        } else {
            // Audio Layout (Spotlight)
            return (
                <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-4">
                    <div className="w-full max-w-sm aspect-square md:aspect-video h-auto max-h-[80vh]">
                        <PeerVideo
                            peer={peers[0].peer}
                            name={peers[0].userName}
                            className="w-full h-full rounded-3xl shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            );
        }
    }

    // Default / Group Layout (Grid)
    return (
        <div className={`grid gap-4 w-full h-full p-4 ${peers && peers.length > 0 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
            {/* My Video - Only show in grid if video is on or we want to see ourselves in group audio? 
                Usually in group audio we want to see everyone. */}
            {stream && (
                <div className="relative rounded-2xl overflow-hidden bg-black/50 aspect-video md:aspect-auto h-full min-h-[200px] border-2 border-primary/20">
                    <video
                        playsInline
                        muted
                        ref={myVideo}
                        autoPlay
                        className={`w-full h-full object-cover ${!isVideoCall ? 'hidden' : 'block'}`}
                    />
                    {!isVideoCall && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800">
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                                <span className="text-xl font-bold text-primary">You</span>
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm">
                        <p className="text-white text-sm font-medium">{name || 'Me'} (You)</p>
                    </div>
                </div>
            )}

            {/* Peers Video */}
            {peers && peers.map((peerObj) => (
                <PeerVideo key={peerObj.peerID} peer={peerObj.peer} name={peerObj.userName} />
            ))}
        </div>
    );
};

export default VideoPlayer;
