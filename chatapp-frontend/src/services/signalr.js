import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

const HUB_URL = "http://localhost:7000/hubs/chat";
let connection = null;
let connectionPromise = null;

async function getSignalRToken() {
  const response = await fetch("http://localhost:7000/api/auth/signalr-token", {
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to get SignalR token");
  const data = await response.json();
  return data.token;
}

export async function startConnection() {
  if (connection) return connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const token = await getSignalRToken();

    const conn = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    conn.onreconnecting(() => {
      console.log("SignalR reconnecting...");
    });

    conn.onreconnected(() => {
      console.log("SignalR reconnected!");
    });

    conn.onclose(() => {
      console.log("SignalR connection closed.");
      connection = null;
      connectionPromise = null;
    });

    await conn.start();
    console.log("SignalR connected!");

    connection = conn;
    connectionPromise = null;
    return conn;
  })();

  return connectionPromise;
}

export async function stopConnection() {
  if (connectionPromise) {
    await connectionPromise;
  }
  if (connection) {
    const conn = connection;
    connection = null;
    connectionPromise = null;
    await conn.stop();
  }
}

export function getConnection() {
  return connection;
}

export async function joinConversation(conversationId) {
  if (connection) {
    await connection.invoke("JoinConversation", conversationId);
  }
}

export async function leaveConversation(conversationId) {
  if (connection) {
    await connection.invoke("LeaveConversation", conversationId);
  }
}

export async function joinChannel(channelId) {
  if (connection) {
    await connection.invoke("JoinChannel", channelId);
  }
}

export async function leaveChannel(channelId) {
  if (connection) {
    await connection.invoke("LeaveChannel", channelId);
  }
}
