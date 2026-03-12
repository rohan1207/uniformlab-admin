import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

const OrdersCountContext = createContext({ unfulfilledCount: 0 });

function getSocketUrl() {
  const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  try {
    const u = new URL(base);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return u.origin;
  } catch {
    return base.replace(/^https?:\/\//, 'ws://');
  }
}

export function OrdersCountProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [unfulfilledCount, setUnfulfilledCount] = useState(0);

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) return null;
    const url = getSocketUrl();
    const socket = io(url, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socket.on('orders:unfulfilled', (count) => {
      setUnfulfilledCount(typeof count === 'number' ? count : 0);
    });
    socket.on('connect_error', () => {
      setUnfulfilledCount((c) => c);
    });
    return socket;
  }, [token, isAuthenticated]);

  useEffect(() => {
    const socket = connect();
    return () => {
      if (socket) socket.disconnect();
    };
  }, [connect]);

  return (
    <OrdersCountContext.Provider value={{ unfulfilledCount }}>
      {children}
    </OrdersCountContext.Provider>
  );
}

export function useOrdersCount() {
  const ctx = useContext(OrdersCountContext);
  return ctx ?? { unfulfilledCount: 0 };
}
