import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

export function useChannelSSE(projectId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { getToken } = useAuth();
  // Use a ref so the reconnect loop survives re-renders
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    if (!projectId) return;
    isUnmountedRef.current = false;

    let reconnectDelay = 1000; // Start at 1s, back off up to 30s

    const connect = async () => {
      if (isUnmountedRef.current) return;

      const token = await getToken();
      if (!token || isUnmountedRef.current) return;

      // Fetch past notifications once on first mount
      if (notifications.length === 0) {
        try {
          const res = await fetch(`/api/projects/${projectId}/notifications?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.notifications) {
              setNotifications(data.notifications);
            }
          }
        } catch {
          // Silently ignore — non-critical
        }
      }

      // Close any previous connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const url = `/api/projects/${projectId}/channel?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('notification', (e) => {
        try {
          const notification = JSON.parse(e.data);
          setNotifications((prev) => [notification, ...prev]);
          toast(notification.title, {
            description: notification.message,
            icon:
              notification.icon ||
              (notification.source === 'payment'
                ? '💳'
                : notification.source === 'identify'
                  ? '👤'
                  : '🔔'),
          });
        } catch {
          // Ignore parse errors
        }
      });

      // Server sends 'ping' with data='reconnect' when the CF Worker 25s window expires
      es.addEventListener('ping', (e) => {
        if (e.data === 'reconnect') {
          es.close();
          // Reconnect immediately — the 25s window just ended cleanly
          if (!isUnmountedRef.current) {
            reconnectTimerRef.current = setTimeout(connect, 500);
          }
        }
      });

      es.addEventListener('error', () => {
        es.close();
        eventSourceRef.current = null;
        if (!isUnmountedRef.current) {
          // Exponential back-off
          reconnectTimerRef.current = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            connect();
          }, reconnectDelay);
        }
      });

      // Reset back-off on successful open
      es.addEventListener('open', () => {
        reconnectDelay = 1000;
      });
    };

    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [projectId, getToken]);

  return { notifications, setNotifications };
}
