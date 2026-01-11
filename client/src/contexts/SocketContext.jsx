import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

import { config } from '../config';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    const socketRef = React.useRef(null);

    useEffect(() => {
        const isVercel = window.location.hostname.includes('vercel.app');
        const shouldDisableSocket = import.meta.env.VITE_DISABLE_SOCKET === 'true' || isVercel;

        if (user && !shouldDisableSocket && !socketRef.current) {
            const socketUrl = config.API_URL || undefined;

            const activeSocket = io(socketUrl, {
                path: '/socket.io',
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                autoConnect: true
            });

            activeSocket.on('connect', () => {
                console.log('Socket Connected:', activeSocket.id);
                activeSocket.emit('setup', user);
            });

            // Re-emit setup on reconnect
            activeSocket.on('reconnect', () => {
                console.log('Socket Reconnected');
                activeSocket.emit('setup', user);
            });

            activeSocket.on('connect_error', (err) => {
                if (!isVercel) {
                    console.error('Socket Connection Error:', err.message);
                }
            });

            socketRef.current = activeSocket;
            setSocket(activeSocket);
        }

        return () => {
            // Only disconnect if user logged out or explicitly disabling
            if ((!user || shouldDisableSocket) && socketRef.current) {
                socketRef.current.off();
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
        };
    }, [user?._id || user?.id]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
