import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        let activeSocket = null;

        if (user) {
            activeSocket = io({
                path: '/socket.io',
                transports: ['polling', 'websocket'],
                upgrade: true,
                autoConnect: true
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
