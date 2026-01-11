import React from 'react';
import { useCall } from '../../contexts/CallContext';
import PeerVideo from './PeerVideo';

const VideoPlayer = () => {
    const { name, callAccepted, myVideo, callEnded, stream, peers } = useCall();

    React.useEffect(() => {
        if (myVideo.current && stream) {
            myVideo.current.srcObject = stream;
        }
    }, [myVideo, stream]);

    React.useEffect(() => {
        if (myVideo.current && stream) {
            myVideo.current.srcObject = stream;
        }
    }, [myVideo, stream]);

    // if (!stream) return null; // Removed to allow Listen-Only mode

    return (
        <div className={`grid gap-4 w-full h-full p-4 ${peers && peers.length > 0 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
            {/* My Video - Only show if stream exists or just placeholder */}
            {stream && (
                <div className="relative rounded-2xl overflow-hidden bg-black/50 aspect-video md:aspect-auto h-full min-h-[200px] border-2 border-primary/20">
                    <video
                        playsInline
                        muted
                        ref={myVideo}
                        autoPlay
                        className="w-full h-full object-cover"
                    />
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
