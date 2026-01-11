import React, { useRef, useEffect } from "react";

const PeerVideo = ({ peer, name }) => {
    const ref = useRef();

    useEffect(() => {
        if (peer) {
            peer.on("stream", stream => {
                if (ref.current) ref.current.srcObject = stream;
            });
        }
    }, [peer]);

    return (
        <div className="relative rounded-2xl overflow-hidden bg-black/50 aspect-video md:aspect-auto h-full min-h-[200px]">
            <video playsInline ref={ref} autoPlay className="w-full h-full object-cover" />
            {name && (
                <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm">
                    <p className="text-white text-sm font-medium">{name}</p>
                </div>
            )}
        </div>
    );
};

export default PeerVideo;
