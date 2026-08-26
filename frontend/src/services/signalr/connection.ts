import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from "@microsoft/signalr";

import { HUBS_URL } from "../../config";

const HUB_URL = `${HUBS_URL}/sync`;

let connection: HubConnection | null = null;
let startPromise: Promise<HubConnection> | null = null;

function createConnection(): HubConnection {
    return new HubConnectionBuilder()
        .withUrl(HUB_URL, {
            withCredentials: true,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();
}

export function ensureSyncConnection(): Promise<HubConnection> {
    if (
        !connection ||
        connection.state === HubConnectionState.Disconnected
    ) {
        connection = createConnection();
    }

    switch (connection.state) {
        case HubConnectionState.Connected:
            return Promise.resolve(connection);

        case HubConnectionState.Connecting:
        case HubConnectionState.Reconnecting:
            return startPromise ?? Promise.resolve(connection);

        default:
            break;
    }

    if (startPromise) {
        return startPromise;
    }

    const current = connection;

    startPromise = current
        .start()
        .then(() => current)
        .finally(() => {
            startPromise = null;
        });

    return startPromise;
}

export async function stopSyncConnection(): Promise<void> {
    const current = connection;

    connection = null;
    startPromise = null;

    if (!current) {
        return;
    }

    try {
        await current.stop();
    } catch {
        // Ignore shutdown errors.
    }
}