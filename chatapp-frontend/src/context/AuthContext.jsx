// ─── AuthContext.jsx — Global Authentication State ───────────────────────────
// Context: React-də məlumatı bütün komponentlərə "broadcast" etmək üçün mexanizm.
// .NET-də: IHttpContextAccessor / DI-da register olunmuş service kimi.
//
// Bu fayl 2 şey export edir:
//   1. AuthContext — istənilən komponent useContext(AuthContext) ilə istifadə edir
//   2. AuthProvider — bütün app-ı əhatə edən wrapper komponenti

// createContext: yeni bir "kanal" yaradır. null — default dəyər (Provider olmadıqda).
// useState: React state hook — dəyər dəyişdikdə komponenti yenidən render edir.
// useEffect: yan-təsirlər üçün hook — mount/unmount, dependency dəyişikliyi.
import { createContext, useState, useEffect } from "react";

// api.js-dən HTTP yardımçı funksiyalar
// scheduleRefresh: token expire olmadan 5 dəq əvvəl refresh edir
// stopRefreshTimer: logout zamanı timer-i dayandırır
import { apiGet, apiPost, scheduleRefresh, stopRefreshTimer } from "../services/api";

// ─── createContext ────────────────────────────────────────────────────────────
// "Kanal" yaradırıq. Bu kanal vasitəsilə user, login, logout bütün app-a çatır.
// null — Provider olmadan istifadə edilərsə default dəyər.
const AuthContext = createContext(null);

// ─── AuthProvider ─────────────────────────────────────────────────────────────
// Bu komponent bütün app-ı əhatə edir (App.jsx-dən görmüşdük).
// children prop: <AuthProvider><App/></AuthProvider> yazdıqda, children = <App/>
function AuthProvider({ children }) {
  // user: { id, email, fullName, ... } — login olubsa, null — olmayıbsa
  // useState(null) → başlanğıc dəyər null-dır
  const [user, setUser] = useState(null);

  // isLoading: checkAuth() işləyərkən true — bitmişdən sonra false
  // Başlanğıcda true — çünki hər açılışda /api/users/me yoxlanılır
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {}, []) — komponentin mount olduğu AN 1 dəfə çağırılır.
  // .NET-də OnInitializedAsync() kimi.
  // Boş array [] — heç bir dependency yoxdur, yalnız 1 dəfə işləyir.
  useEffect(() => {
    checkAuth(); // App açılışında: "mən artıq login olmuşam?" yoxla
  }, []);

  // ─── checkAuth ──────────────────────────────────────────────────────────────
  // Cookie vasitəsilə serverdən cari istifadəçini yoxlayır.
  // Uğurludursa → user state-ini doldur
  // Uğursuzdursa → user = null (login lazımdır)
  async function checkAuth() {
    try {
      // GET /api/users/me — cookie avtomatik göndərilir (credentials: include)
      const data = await apiGet("/api/users/me");
      setUser(data);            // user state-ini doldur → app "login" vəziyyətinə keçir
      scheduleRefresh();        // 25 dəq sonra token proaktiv refresh et
    } catch {
      // 401 Unauthorized → refresh cəhdi edildi amma uğursuz → login lazımdır
      setUser(null);            // user null → ProtectedRoute /login-ə yönləndirir
    } finally {
      setIsLoading(false);
    }
  }

  // ─── login ──────────────────────────────────────────────────────────────────
  // Login form-dan çağırılır. 2 addım:
  //   1. POST /api/auth/login — server cookie (session) yaradır
  //   2. GET /api/users/me — user məlumatını al
  // Uğursuz olarsa — throw edir, Login.jsx catch edib error göstərir
  async function login(email, password, rememberMe) {
    // BFF pattern: server cookie qaytarır, biz token saxlamırıq (güvənli)
    await apiPost("/api/auth/login", { email, password, rememberMe });

    // Login uğurlu → user məlumatını al və state-ə set et
    const data = await apiGet("/api/users/me");
    setUser(data);        // → app yenidən render olur, user artıq null deyil
    scheduleRefresh();    // → proactive refresh timer başlat
  }

  // ─── logout ─────────────────────────────────────────────────────────────────
  // Sidebar-dan çağırılır. Cookie-ni server silir, frontend-i də təmizlər.
  async function logout() {
    stopRefreshTimer(); // Refresh timer-i dayandır (boşuna refresh etməsin)
    try {
      await apiPost("/api/auth/logout"); // Server-də session-u sil
    } catch {
      // Network xətası olsa belə — frontend-i mütləq təmizlə
      // İstifadəçi "sıxışıb qalmasın"
    }
    setUser(null); // user = null → ProtectedRoute /login-ə yönləndirir
  }

  // ─── AuthContext.Provider ────────────────────────────────────────────────────
  // value prop: context kanalından göndərilən məlumatlar.
  // Hər hansı komponent useContext(AuthContext) yazarsa,
  // bu value-dəki { user, isLoading, login, logout } alır.
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children} {/* Bütün child komponentlər (App, Chat, Login...) buraya render olur */}
    </AuthContext.Provider>
  );
}

// Named export: import { AuthContext, AuthProvider } from "..." ilə idxal edilir
export { AuthContext, AuthProvider };
