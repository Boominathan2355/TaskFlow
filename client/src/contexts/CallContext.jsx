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
        // Request Notification Permission on mount
        if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        if (socket && user) {
            setMe(user._id);
            setName(user.name);

            // Helper to show system notification via Service Worker
            const showCallNotification = async (props) => {
                const { name, isVideo, from } = props;
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {

                    try {
                        const registration = await navigator.serviceWorker.ready;
                        registration.showNotification(`Incoming ${isVideo ? 'Video' : 'Audio'} Call`, {
                            body: `${name} is calling you...`,
                            icon: '/logo192.png',
                            tag: 'incoming_call',
                            requireInteraction: true,
                            data: { from, isVideo }, // Pass data if needed
                            actions: [
                                { action: 'answer', title: 'Answer' },
                                { action: 'decline', title: 'Decline' }
                            ]
                        });
                    } catch (e) {
                        console.error("Notification Error:", e);
                        // Fallback to simple notification
                        new Notification(`Incoming ${isVideo ? 'Video' : 'Audio'} Call from ${name}`);
                    }
                }
            };

            // Listen for Service Worker messages (Action Clicks)
            const handleSWMessage = (event) => {
                if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
                    console.log("Notification Action:", event.data.action);
                    if (event.data.action === 'answer') {
                        // We can't guarantee 'answerCall' works if state is stale, 
                        // but since we focus window, the Modal should be visible.
                        // Ideally we trigger answerCall here if valid.
                        // We can check if 'incomingCall' state is valid, or just blindly try calling answerCall
                        // But answerCall relies on 'incomingCall' state.
                        // If the SW focuses the window, React state *should* be fresh enough?
                        // Let's call answerCall() directly.
                        answerCall();
                    } else if (event.data.action === 'decline') {
                        leaveCall(false);
                    }
                }
            };

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', handleSWMessage);
            }

            // 1-on-1 legacy support (or improved direct call notification)
            const handleCallUser = ({ from, name: callerName, signal, isVideo }) => {
                setIncomingCall({ isReceivingCall: true, from, name: callerName, signal, isVideo });
                setIsReceivingCall(true);
                soundManager.playRing();
                showCallNotification({ name: callerName, isVideo, from });
            };
            socket.on("call_user", handleCallUser);

            // Mesh: Receive returned signal from a peer we called
            const handleReturningSignal = payload => {
                soundManager.stopRing(); // Stop ringback/notification sound when answered
                const item = peersRef.current.find(p => p.peerID === payload.id);
                if (item) {
                    item.peer.signal(payload.signal);
                }
            };
            socket.on("receiving_returned_signal", handleReturningSignal);

            // Mesh: A new user joined and is signaling us
            const handleUserJoinedSignal = payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream); // We are answering
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                    userName: payload.name,
                });
                setPeers(users => [...users, { peerID: payload.callerID, peer, userName: payload.name }]);
            };
            socket.on('user_joined_signal', handleUserJoinedSignal);

            // Notification: Someone rang the room
            const handleIncomingCall = ({ roomID, callerName, isVideo, from, callerId }) => {
                // Prevent self-ringing (if logged in on multiple devices)
                if (callerId && user && callerId === user._id) return;

                setIncomingCall({
                    isReceivingCall: true,
                    from,
                    name: callerName,
                    isVideo,
                    chatId: roomID // Store room ID to join
                });
                setIsReceivingCall(true);
                soundManager.playRing();
                showCallNotification({ name: callerName, isVideo, from });
            };
            socket.on("incoming_call_notification", handleIncomingCall);

            const handleAllUsers = users => {
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
            };
            socket.on("all_users", handleAllUsers);

            // Handle Remote End Call
            const handleEndCall = () => {
                console.log("Received end_call signal from server. terminating call.");
                leaveCall(false); // End local call without emitting
                // Close any open notifications?
            };
            socket.on("end_call", handleEndCall);

            // Handle Call Answered Elsewhere (Same User, Different Device)
            const handleStopRinging = () => {
                soundManager.stopRing();
                setIsReceivingCall(false);
                setIncomingCall(null);
            };
            socket.on("stop_ringing_self", handleStopRinging);

            // Cleanup function to remove listeners
            return () => {
                socket.off("call_user", handleCallUser);
                socket.off("receiving_returned_signal", handleReturningSignal);
                socket.off("user_joined_signal", handleUserJoinedSignal);
                socket.off("incoming_call_notification", handleIncomingCall);
                socket.off("all_users", handleAllUsers);
                socket.off("end_call", handleEndCall);
                socket.off("stop_ringing_self", handleStopRinging);
            };
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
            socket.emit("ring_room", { roomID: chatId, callerName: user.name, isVideo: video && !!currentStream, callerId: user._id });

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
        setIncomingCall(null); // Clear incoming UI immediately

        const video = incomingCall?.isVideo;
        const chatId = incomingCall?.chatId;

        callStartTime.current = Date.now(); // Track start time

        if (chatId) {
            chatIdRef.current = chatId; // Store chat ID

            // Notify other devices to stop ringing
            if (socket && user) {
                socket.emit("call_answered_by_user", { userId: user._id });
            }

            joinCall(chatId, video);
        } else {
            console.error("No Chat ID in incoming call");
        }
    };

    const leaveCall = async (endCall = false) => {
        soundManager.stopRing();

        // Emit End Call to others if initiator
        if (endCall && socket && chatIdRef.current) {
            console.log("Emitting end_call for room:", chatIdRef.current);
            socket.emit("end_call", { roomID: chatIdRef.current });
        }

        // Prepare logging data but don't await default behavior
        if (callAccepted && callStartTime.current && chatIdRef.current) {
            const duration = Math.round((Date.now() - callStartTime.current) / 1000); // seconds
            const token = localStorage.getItem('token');
            const chatId = chatIdRef.current; // Capture current ref before cleanup

            // Fire and forget logging
            axios.post(`${config.API_URL}/api/message`,
                {
                    content: `Call ended • ${Math.floor(duration / 60)}m ${duration % 60}s`,
                    chatId: chatId,
                    type: 'call',
                    callDuration: duration
                },
                { headers: { Authorization: `Bearer ${token}` } }
            ).catch(e => console.error("Failed to log call history", e));
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

        // Reset refs
        connectionRef.current = null;
        screenStreamRef.current = null;
        originalStreamRef.current = null;
        // chatIdRef.current = null; // Do not nullify immediately if needed for race conditions, but logically it's done.

        setCallEnded(false);
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
