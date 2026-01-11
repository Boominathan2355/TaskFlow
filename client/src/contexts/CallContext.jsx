import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import SimplePeer from 'simple-peer';
import { soundManager } from '../utils/sound';
import PermissionDialog from '../components/molecules/PermissionDialog';

import axios from 'axios'; // Import axios
import { config } from '../config'; // Import config

// Polyfills
import * as process from "process";
if (!window.global) window.global = window;
if (!window.process) window.process = process;
if (!window.Buffer) window.Buffer = [];

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
    const [stream, setStream] = useState(null);
    const [me, setMe] = useState('');
    const [peers, setPeers] = useState([]); // Array of peer objects { peerId, peer, stream }
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');
    const [isVideoCall, setIsVideoCall] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // For 1-on-1 ringing UI (still needed for initial handshake or direct calls)
    const [incomingCall, setIncomingCall] = useState(null);
    const [isReceivingCall, setIsReceivingCall] = useState(false);

    const myVideo = useRef();
    const peersRef = useRef([]); // Keep refs to peers for signal handling
    const connectionRef = useRef(); // Legacy ref for 1-on-1, ideally deprecated or used for primary peer
    const screenStreamRef = useRef();
    const originalStreamRef = useRef();
    const roomIdRef = useRef(null);
    const chatIdRef = useRef(null); // Ref to store chatId for logging

    const socket = useSocket();
    const { user } = useAuth();

    useEffect(() => {
        if (socket && user) {
            setMe(user._id);
            setName(user.name);

            // 1-on-1 legacy support (or improved direct call notification)
            socket.on("call_user", ({ from, name: callerName, signal, isVideo }) => {
                setIncomingCall({ isReceivingCall: true, from, name: callerName, signal, isVideo });
                setIsReceivingCall(true);
                soundManager.playRing();
            });

            // Mesh: Receive returned signal from a peer we called
            socket.on("receiving_returned_signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                if (item) {
                    item.peer.signal(payload.signal);
                }
            });

            // Mesh: A new user joined and is signaling us
            socket.on('user_joined_signal', payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream); // We are answering
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                    userName: payload.name,
                });
                setPeers(users => [...users, { peerID: payload.callerID, peer, userName: payload.name }]);
            });

            // Notification: Someone rang the room
            socket.on("incoming_call_notification", ({ roomID, callerName, isVideo, from }) => {
                setIncomingCall({
                    isReceivingCall: true,
                    from,
                    name: callerName,
                    isVideo,
                    chatId: roomID // Store room ID to join
                });
                setIsReceivingCall(true);
                soundManager.playRing();
            });

            socket.on("all_users", users => {
                // We joined, here is the list of existing users to call
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socket.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    });
                    peers.push({ // We can't put 'peer' in state directly safely sometimes, but here we do
                        peerID: userID,
                        peer
                    });
                });
                setPeers(peers);
            });
        }
    }, [socket, user, stream]); // Stream dependency crucial for addPeer/createPeer

    // Helper: Initiator
    function createPeer(userToSignal, callerID, stream) {
        const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socket.emit("sending_signal", { userToSignal, callerID, signal, name: user.name, isVideo: isVideoCall });
        });

        return peer;
    }

    // Helper: Receiver
    function addPeer(incomingSignal, callerID, stream) {
        const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socket.emit("returning_signal", { signal, callerID });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    // Refined Call Function (Unified Join)
    const joinCall = (chatId, video = true) => {
        chatIdRef.current = chatId; // Store chat ID
        setIsVideoCall(video);
        setCallAccepted(true);
        setCallEnded(false);
        roomIdRef.current = chatId;

        // Helper to get media: Always try for Video+Audio to allow seamless toggling
        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!video) {
                    // If audio-only mode, disable video track initially
                    stream.getVideoTracks().forEach(track => track.enabled = false);
                }
                return stream;
            } catch (err) {
                console.warn("Failed to get video+audio, trying audio only", err);

                if (err.name === 'NotAllowedError') {
                    console.warn("Permission denied. Joining as listener.");
                    setPermissionDialog({
                        isOpen: true,
                        title: "Media Access Blocked",
                        message: "We need access to your microphone/camera to join the call. Please check your browser settings.",
                        onRetry: () => joinCall(chatId, video)
                    });
                }

                // Return null to proceed without media
                return null;
            }
        };

        getMedia().then(currentStream => {
            setStream(currentStream);
            originalStreamRef.current = currentStream;
            if (myVideo.current && currentStream) myVideo.current.srcObject = currentStream;

            // 1. Join the room (for Socket.io room logic)
            socket.emit("join_chat", chatId); // Ensure we are in the socket room first! Server relies on it.

            // 2. Emit join event for Mesh
            socket.emit("join_room", { roomID: chatId, userId: user._id, name: user.name, isVideo: video && !!currentStream });

            // 3. Ring the room (Notify others who might NOT be in the room)
            socket.emit("ring_room", { roomID: chatId, callerName: user.name, isVideo: video && !!currentStream });

        }).catch(err => {
            console.error("Critical error joining call", err);
            // Only fail if something else breaks, not media
        });
    };

    const callStartTime = useRef(null);

    // Answer Incoming Logic
    const answerCall = () => {
        soundManager.stopRing();
        setCallAccepted(true);
        setIsReceivingCall(false);
        const video = incomingCall?.isVideo;
        const chatId = incomingCall?.chatId;

        callStartTime.current = Date.now(); // Track start time

        if (chatId) {
            chatIdRef.current = chatId; // Store chat ID
            joinCall(chatId, video);
        } else {
            console.error("No Chat ID in incoming call");
        }
    };

    const leaveCall = async (endCall = false) => {
        soundManager.stopRing();

        // Log Call Duration
        if (callAccepted && callStartTime.current && chatIdRef.current) {
            const duration = Math.round((Date.now() - callStartTime.current) / 1000); // seconds

            try {
                const token = localStorage.getItem('token');
                await axios.post(`${config.API_URL}/api/message`,
                    {
                        content: `Call ended • ${Math.floor(duration / 60)}m ${duration % 60}s`,
                        chatId: chatIdRef.current,
                        type: 'call',
                        callDuration: duration
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (e) {
                console.error("Failed to log call history", e);
            }
        }

        setCallEnded(true);
        // Destroy all peers
        peersRef.current.forEach(p => {
            if (p.peer) p.peer.destroy();
        });
        peersRef.current = [];
        setPeers([]);

        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setCallAccepted(false);
        setIsReceivingCall(false);
        setIncomingCall(null);

        // window.location.reload(); // REMOVED: Prevent auto-refresh

        // Reset refs
        connectionRef.current = null;
        screenStreamRef.current = null;
        originalStreamRef.current = null;

        // Signal that we are ready for next call
        setCallEnded(false); // Reset this too to allow new calls? Or keep it true until new action?
        // Typically callEnded=true might show "Call Ended" UI. 
        // Let's set it to false after a short delay or immediately if we want to return to "idle" state.
        // For now, let's keep it consistent with "clean slate".
        setCallEnded(false);

        // Optional: Re-initialize specific listeners if they were removed? 
        // Socket listeners in useEffect depend on 'me' which doesn't change. 
        // So we should remain connected to socket.
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
                screenStreamRef.current = screenStream;
                const videoTrack = screenStream.getVideoTracks()[0];

                // Replace track for ALL peers
                peersRef.current.forEach(p => {
                    if (p.peer) {
                        try {
                            p.peer.replaceTrack(stream.getVideoTracks()[0], videoTrack, stream);
                        } catch (e) { console.error("Replace track failed", e); }
                    }
                });

                setStream(screenStream);
                if (myVideo.current) myVideo.current.srcObject = screenStream;
                setIsScreenSharing(true);

                videoTrack.onended = stopScreenShare;

            } catch (error) {
                console.error("Error sharing screen:", error);
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = () => {
        if (screenStreamRef.current) {
            const screenTrack = screenStreamRef.current.getVideoTracks()[0];
            const originalTrack = originalStreamRef.current.getVideoTracks()[0];

            peersRef.current.forEach(p => {
                if (p.peer) {
                    try {
                        p.peer.replaceTrack(screenTrack, originalTrack, screenStreamRef.current);
                    } catch (e) { }
                }
            });

            screenTrack.stop();
            screenStreamRef.current = null;

            setStream(originalStreamRef.current);
            if (myVideo.current) myVideo.current.srcObject = originalStreamRef.current;
            setIsScreenSharing(false);
        }
    };

    // Permission Dialog State
    const [permissionDialog, setPermissionDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onRetry: null
    });

    const closePermissionDialog = () => setPermissionDialog(prev => ({ ...prev, isOpen: false }));

    const [isAudioMuted, setIsAudioMuted] = useState(false);

    const toggleAudio = () => {
        if (stream && stream.getAudioTracks().length > 0) {
            const audioTrack = stream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioMuted(!audioTrack.enabled);
            console.log(`Audio ${audioTrack.enabled ? 'Enabled' : 'Muted'}`);
        } else {
            // Retry
            navigator.mediaDevices.getUserMedia({ audio: true }).then(audioStream => {
                const newAudioTrack = audioStream.getAudioTracks()[0];
                console.log("Acquired audio track...");

                let newStream;
                if (stream) {
                    // Add to existing stream
                    // We create a new MediaStream object to ensure React detects change
                    newStream = new MediaStream([...stream.getTracks(), newAudioTrack]);

                    // Add to peers
                    peersRef.current.forEach(p => {
                        if (p.peer) {
                            try { p.peer.addTrack(newAudioTrack, newStream); } catch (e) { }
                        }
                    });
                } else {
                    newStream = audioStream;
                }

                setStream(newStream);
                if (myVideo.current) myVideo.current.srcObject = newStream;
                setIsAudioMuted(false);

            }).catch(err => {
                console.error("Failed to enable audio", err);
                if (err.name === 'NotAllowedError') {
                    setPermissionDialog({
                        isOpen: true,
                        title: "Microphone Access Blocked",
                        message: "We need microphone access to unmute you. Please check your browser settings.",
                        onRetry: () => toggleAudio() // Retry action
                    });
                } else {
                    setPermissionDialog({
                        isOpen: true,
                        title: "Microphone Error",
                        message: `Could not enable microphone. Error: ${err.message}`,
                        onRetry: () => toggleAudio()
                    });
                }
            });
        }
    };

    // Better toggle logic: if we have a track, toggle enabled. If not, get one.
    const toggleVideoTrack = () => {
        if (stream && stream.getVideoTracks().length > 0) {
            const videoTrack = stream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoCall(videoTrack.enabled);
            console.log(`Video ${videoTrack.enabled ? 'Enabled' : 'Disabled'}`);
        } else {
            // Retry: Request Video ONLY
            navigator.mediaDevices.getUserMedia({ video: true }).then(videoStream => {
                const newVideoTrack = videoStream.getVideoTracks()[0];
                console.log("Acquired video track...");

                let newStream;
                if (stream) {
                    newStream = new MediaStream([...stream.getTracks(), newVideoTrack]);

                    peersRef.current.forEach(p => {
                        if (p.peer) {
                            try { p.peer.addTrack(newVideoTrack, newStream); } catch (e) {
                                console.error("Peer addTrack failed", e);
                            }
                        }
                    });
                } else {
                    newStream = videoStream;
                }

                setStream(newStream);
                if (myVideo.current) myVideo.current.srcObject = newStream;
                setIsVideoCall(true);

            }).catch(err => {
                console.error("Failed to enable video", err);
                if (err.name === 'NotAllowedError') {
                    setPermissionDialog({
                        isOpen: true,
                        title: "Camera Access Blocked",
                        message: "We need camera access to turn on your video. Please check your browser settings.",
                        onRetry: () => toggleVideoTrack()
                    });
                } else {
                    setPermissionDialog({
                        isOpen: true,
                        title: "Camera Error",
                        message: `Could not enable camera. Error: ${err.message}`,
                        onRetry: () => toggleVideoTrack()
                    });
                }
            });
        }
    };

    // Derived state for UI to know if media is available
    const hasAudio = stream ? stream.getAudioTracks().length > 0 : false;
    const hasVideo = stream ? stream.getVideoTracks().length > 0 : false;

    return (
        <CallContext.Provider value={{
            callAccepted,
            myVideo,
            stream,
            callEnded,
            isReceivingCall,
            incomingCall,
            joinCall,
            leaveCall,
            answerCall,
            peers,
            toggleScreenShare,
            isScreenSharing,
            callUser: joinCall,
            toggleAudio,
            toggleVideo: toggleVideoTrack,
            isAudioMuted,
            isVideoCall,
            hasAudio, // Exported
            hasVideo  // Exported
        }}>
            {children}
            {/* Render Custom Permission Dialog */}
            <PermissionDialog
                isOpen={permissionDialog.isOpen}
                onClose={closePermissionDialog}
                title={permissionDialog.title}
                message={permissionDialog.message}
                onRetry={permissionDialog.onRetry}
            />
        </CallContext.Provider>
    );
};
