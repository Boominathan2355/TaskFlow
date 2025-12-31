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

    useEffect(() => {
        let activeSocket = null;

        // Allow disabling sockets via env var (useful for Vercel serverless)
        if (user && !import.meta.env.VITE_DISABLE_SOCKET) {
            const socketUrl = config.API_URL || undefined; // undefined defaults to window.location.host

            activeSocket = io(socketUrl, {
                path: '/socket.io',
                transports: ['polling', 'websocket'],
                upgrade: true,
                autoConnect: true,
                reconnectionAttempts: 5, // Limit retries to stop console spam on Vercel
                timeout: 10000
            });

            activeSocket.on('connect', () => {
                console.log('Socket Connected:', activeSocket.id);
                activeSocket.emit('join_user', user._id || user.id);
            });

            activeSocket.on('connect_error', (err) => {
                console.error('Socket Connection Error:', err.message);
            });

            setSocket(activeSocket);
        }

        return () => {
            if (activeSocket) {
                console.log('Disconnecting socket...');
                activeSocket.disconnect();
            }
            setSocket(null);
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
