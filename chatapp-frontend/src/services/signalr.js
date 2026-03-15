// ─── signalr.js — Real-Time WebSocket Connection ─────────────────────────────
// SignalR: Microsoft-un real-time communication library-si.
// WebSocket vasitəsilə server client-ə birbaşa mesaj göndərə bilir.
// .NET-də: IHubContext<ChatHub> kimi işləyir — amma bu tərəf client (JavaScript) hissəsidir.
//
// Analogy: HTTP = məktub (göndər, gözlə), SignalR = telefon zəngi (hər zaman açıq)
//
// Bu faylda:
//   - Server ilə bağlantı qurmaq (startConnection)
//   - Bağlantını almaq (getConnection) — event handler-lər əlavə etmək üçün

import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

// SignalR hub-ının URL-i — backend-dəki ChatHub endpoint-i
// Docker-da: window.__ENV__.API_BASE_URL runtime-da set olunur (nginx/docker-entrypoint.sh)
const HUB_URL = (window.__ENV__?.API_BASE_URL ?? "http://localhost:7000") + "/hubs/chat";

// ─── Module-Level Singleton ───────────────────────────────────────────────────
// connection: aktiv SignalR bağlantısı (1 ədəd — singleton pattern)
// connectionPromise: bağlantı qurularkən gözlənilən Promise
// Bu 2 dəyişən sayəsində eyni anda 2 bağlantı yaranmır (race condition yoxdur)
let connection = null;
let connectionPromise = null;

// stopRequested: logout zamanı true olur — onclose handler-da retry olmasın
let stopRequested = false;

// retryTimerId: onclose retry setTimeout ID-si — cleanup üçün
let retryTimerId = null;

// ─── Tab bağlananda bağlantını təmiz bağla ──────────────────────────────────
// beforeunload: tab/window bağlananda fire olur
// Bu olmasa onclose handler retry loop davam edər — memory leak
window.addEventListener("beforeunload", () => {
  stopRequested = true;
  if (retryTimerId) {
    clearTimeout(retryTimerId);
    retryTimerId = null;
  }
  if (connection) {
    connection.stop();
  }
});

// ─── getSignalRToken ──────────────────────────────────────────────────────────
// SignalR JWT token alır. SignalR WebSocket-də HTTP cookie işlətmir,
// ona görə ayrıca JWT token lazımdır.
// Server: GET /api/auth/signalr-token → { token: "eyJ..." }
async function getSignalRToken() {
  const response = await fetch((window.__ENV__?.API_BASE_URL ?? "http://localhost:7000") + "/api/auth/signalr-token", {
    credentials: "include",   // Session cookie göndər ki, server bizi tanısın
  });

  if (!response.ok) throw new Error("Failed to get SignalR token");
  const data = await response.json();
  return data.token;           // JWT string-i qaytar
}

// ─── startConnection ──────────────────────────────────────────────────────────
// SignalR bağlantısını başladır. Singleton pattern:
//   - Artıq bağlantı varsa → mövcud bağlantını qaytar
//   - Bağlantı gedirsə → eyni Promise-i qaytar (2-ci start etmə)
//   - Yoxdursa → yeni bağlantı qur
export async function startConnection() {
  // Artıq aktiv bağlantı var → onu qaytar
  if (connection) return connection;

  // Bağlantı hələ qurulur (başqa bir çağırış başlatıb) → eyni promise-i gözlə
  if (connectionPromise) return connectionPromise;

  // Yeni bağlantı başlayır — stopRequested sıfırla
  stopRequested = false;

  // IIFE (Immediately Invoked Async Function): async funksiyonu dərhal çağır
  // Bu pattern race condition-u önləyir — yalnız 1 bağlantı yaranır
  connectionPromise = (async () => {
    // 1. HubConnection obyekti qur
    // HubConnectionBuilder — builder pattern (.NET-də WebApplicationBuilder kimi)
    const conn = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // accessTokenFactory: Hər reconnect zamanı TƏZƏ token alır.
        // Köhnə variant: () => token (statik, expire olurdu)
        // Yeni variant: () => getSignalRToken() (dinamik, hər dəfə fresh token)
        accessTokenFactory: () => getSignalRToken(),
      })
      // withAutomaticReconnect: şəbəkə kəsildikdə avtomatik yenidən qoşul
      // Array: [0ms, 1s, 2s, 5s, 10s, 30s] — hər cəhd arasındakı gözləmə müddəti
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
      // LogLevel.Warning: yalnız xəbərdarlıq + error-ları console-a yaz
      .configureLogging(LogLevel.Warning)
      .build(); // HubConnection obyekti yarat

    // 2. Lifecycle event-ləri qur
    // onreconnecting: şəbəkə kəsildikdə — connection null-a set et
    conn.onreconnecting(() => {
      connection = null;
      notifyConnectionState("reconnecting");
    });

    // onreconnected: yenidən qoşulduqda — yeni bağlantını set et
    conn.onreconnected(() => {
      connection = conn;
      notifyConnectionState("connected");
    });

    // onclose: bağlantı tamamilə bağlandıqda (bütün reconnect cəhdləri uğursuz)
    // Əgər logout deyilsə → 5 saniyə sonra sıfırdan yenidən bağlan
    conn.onclose(() => {
      connection = null;
      connectionPromise = null;
      notifyConnectionState("disconnected");

      if (!stopRequested) {
        console.warn("SignalR: connection lost. Retrying in 5s...");
        if (retryTimerId) clearTimeout(retryTimerId);
        retryTimerId = setTimeout(() => {
          retryTimerId = null;
          // Retry-dan əvvəl yenidən yoxla — bu müddətdə logout ola bilər
          if (stopRequested) return;
          startConnection().catch((err) =>
            console.error("SignalR: reconnect from scratch failed:", err),
          );
        }, 5000);
      }
    });

    // 3. Bağlantını başlat (WebSocket el sıxışması)
    await conn.start();
    notifyConnectionState("connected");

    // 4. Singleton-u set et
    connection = conn;
    connectionPromise = null; // Promise bitdi, növbəti çağırışlar birbaşa connection-u alsın
    return conn;
  })();

  return connectionPromise;
}

// ─── stopConnection ───────────────────────────────────────────────────────────
// Bağlantını dayandırır. Logout zamanı çağırılır.
export async function stopConnection() {
  // stopRequested = true → onclose handler retry etməsin
  stopRequested = true;

  // Pending retry timer-i ləğv et
  if (retryTimerId) {
    clearTimeout(retryTimerId);
    retryTimerId = null;
  }

  // Əgər bağlantı hələ qurulursa — əvvəl gözlə, sonra dayandır
  if (connectionPromise) {
    await connectionPromise;
  }
  if (connection) {
    const conn = connection;
    connection = null;          // Reference-i dərhal sıfırla
    connectionPromise = null;
    await conn.stop();          // WebSocket-i bağla
  }
}

// ─── getConnection ────────────────────────────────────────────────────────────
// Mövcud bağlantını qaytarır (null ola bilər əgər hələ qurulmayıbsa).
// Chat.jsx-dən: hub metodlarını çağırmaq üçün istifadə olunur.
// Məsələn: getConnection().invoke("GetOnlineStatus", [userId])
export function getConnection() {
  return connection;
}

// ─── Connection State Listener ──────────────────────────────────────────────
// Chat.jsx-dən SignalR bağlantı vəziyyətini izləmək üçün callback register et
// callback(state): "connected" | "reconnecting" | "disconnected"
let connectionStateCallback = null;

export function onConnectionStateChange(callback) {
  connectionStateCallback = callback;
}

function notifyConnectionState(state) {
  if (connectionStateCallback) connectionStateCallback(state);
}

