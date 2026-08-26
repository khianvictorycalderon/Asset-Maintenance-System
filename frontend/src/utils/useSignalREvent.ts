import { useEffect, useRef } from "react";
import type { HubConnection } from "@microsoft/signalr";
import { ensureSyncConnection } from "../services/signalr/connection";

export function useSignalREvent<TArgs extends unknown[] = []>(
    eventName: string,
    callback: (...args: TArgs) => void
) {
    const callbackRef = useRef(callback);

    // Keep the latest callback without re-subscribing.
    callbackRef.current = callback;

    useEffect(() => {
        let cancelled = false;
        let connection: HubConnection | null = null;

        const handler = (...args: TArgs) => {
            callbackRef.current(...args);
        };

        ensureSyncConnection()
            .then((conn) => {
                if (cancelled) return;

                connection = conn;
                connection.on(eventName, handler);
            })
            .catch((err) => {
                console.error(
                    `Failed to subscribe to SignalR event "${eventName}"`,
                    err
                );
            });

        return () => {
            cancelled = true;

            if (connection) {
                connection.off(eventName, handler);
            }
        };
    }, [eventName]);
}