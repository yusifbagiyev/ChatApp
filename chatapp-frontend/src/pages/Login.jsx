// useState — state yaratmaq (like C# property + OnChange)
// useContext — global state-ə daxil olmaq (like @inject ServiceName)
import { useState, useContext } from "react";

// AuthContext — global auth state (user, login, logout)
import { AuthContext } from "../context/AuthContext";

// useNavigate — koddan redirect etmək (like NavigationManager.NavigateTo("/"))
// Navigate — JSX-dən redirect (like <Redirect to="/" />)
import { useNavigate, Navigate } from "react-router-dom";

import "./Login.css";

// Login komponenti — Login səhifəsi
// .NET ekvivalenti: @page "/login" ilə Blazor LoginPage komponenti
function Login() {
  // useContext ilə AuthContext-dən login funksiyasını və cari useri al
  // .NET: @inject AuthService AuthService → AuthService.Login(...)
  const { login, user } = useContext(AuthContext);

  // useNavigate — hook-dan navigate funksiyası al
  // navigate("/") çağıranda URL dəyişir və / route render olunur
  const navigate = useNavigate();

  // --- STATE DEĞİŞƏNLƏRİ ---
  // useState("") — başlanğıc dəyər boş string
  // [email, setEmail] → email oxumaq üçün, setEmail dəyişmək üçün
  // .NET: string Email { get; set; } + event OnChange
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // rememberMe — checkbox vəziyyəti (true/false)
  const [rememberMe, setRememberMe] = useState(false);

  // showPassword — şifrəni göstər/gizlə toggle
  const [showPassword, setShowPassword] = useState(false);

  // isLoading — API çağrısı davam edərkən true (button disable olur, spinner görünür)
  const [isLoading, setIsLoading] = useState(false);

  // errorMessage — login uğursuz olarsa göstəriləcək xəta mətni
  const [errorMessage, setErrorMessage] = useState("");

  // --- EARLY RETURN: Artıq login olubsa ana səhifəyə redirect et ---
  // Bu hooks-dan SONRA olmalıdır — hooks şərtli return-dan əvvəl olmalıdır (React qaydası)
  // <Navigate to="/" /> — component render olunmadan yönləndirir
  if (user) {
    return <Navigate to="/" />;
  }

  // handleSubmit — form submit olduqda çağırılır
  // async funksiya — await ilə API cavabını gözləyirik
  // .NET ekvivalenti: OnValidSubmit() event handler
  const handleSubmit = async (e) => {
    // e.preventDefault() — default browser davranışını (səhifəni yeniləmək) dayandır
    // .NET: e.PreventDefault() yoxdur, Blazor EditForm bunu özü edir
    e.preventDefault();

    // Boş field yoxlaması — validation
    if (!email || !password) {
      setErrorMessage("Email and password are required");
      return; // Erkən çıx — API-ə getmə
    }

    // Loading başladı — button disable et, spinner göstər
    setIsLoading(true);
    setErrorMessage(""); // Köhnə xəta mesajını sil

    try {
      // login(email, password, rememberMe) — AuthContext-dən gəlir
      // İçəridə POST /api/auth/login çağırır
      // await — API cavabını gözlə
      await login(email, password, rememberMe);

      // Remember me — emaili localStorage-da saxla (brauzer yaddaşı, session bitdikdə silinmir)
      // .NET ekvivalenti: ILocalStorageService (Blazored.LocalStorage)
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Login uğurlu — ana səhifəyə yönləndir
      navigate("/");
    } catch (err) {
      // Login uğursuz — xəta mesajını göstər
      // err.message — throw new Error("...") ilə gəlir (AuthContext-dən)
      setErrorMessage(
        err.message || "An error occurred during login. Please try again.",
      );
    } finally {
      // finally — həm try, həm catch-dən sonra işləyir
      // Loading bitdi — spinner gizlə, button aktiv et
      setIsLoading(false);
    }
  };

  // --- JSX: UI render ---
  // return (...) — bu komponentin görsel çıxışı
  // JSX = JavaScript içərisində HTML-yə bənzər syntax
  return (
    <div className="login-layout">
      {/* Arxa fon — CSS animasiyalı shapes və particles */}
      <div className="login-background">
        <div className="login-background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
          <div className="particle particle-7"></div>
          <div className="particle particle-8"></div>
        </div>
      </div>

      {/* Login card — mərkəzdə görünən form */}
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            {/* SVG logo — inline SVG (like <img> amma daha çevik) */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="48" height="48" rx="12" fill="url(#gradient)" />
              <path
                d="M12 18C12 16.3431 13.3431 15 15 15H33C34.6569 15 36 16.3431 36 18V28C36 29.6569 34.6569 31 33 31H20L14 35V31C12.8954 31 12 30.1046 12 29V18Z"
                fill="white"
                fillOpacity="0.9"
              />
              <circle cx="18" cy="23" r="1.5" fill="#6366F1" />
              <circle cx="24" cy="23" r="1.5" fill="#6366F1" />
              <circle cx="30" cy="23" r="1.5" fill="#6366F1" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <h1 className="login-brand">ChatApp</h1>
          </div>
          <p className="login-tagline">Modern Team Communication</p>
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">Welcome Back</h2>
            <p className="login-card-subtitle">
              Sign in to continue to ChatApp
            </p>
          </div>

          <div className="login-card-body">
            {/* onSubmit={handleSubmit} — form submit edildikdə handleSubmit çağır */}
            {/* .NET: <EditForm OnValidSubmit="HandleSubmit"> */}
            <form onSubmit={handleSubmit}>

              {/* Email field */}
              <div className="login-form-group">
                <label className="login-label">Email</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">👤</span>
                  <input
                    type="text"
                    value={email}           // Controlled input — value state-dən gəlir
                    onChange={(e) => {
                      // e.target.value — istifadəçinin yazdığı mətn
                      // setEmail ilə state yenilə → React yenidən render edir
                      setEmail(e.target.value);
                      setErrorMessage(""); // Yazmağa başlayanda xəta sil
                    }}
                    className="login-input"
                    placeholder="Enter your email address"
                    autoComplete="email"    // Browser email suggestion-ları göstərsin
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="login-form-group">
                <label className="login-label">Password</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">🔒</span>
                  <input
                    // showPassword true → type="text" (görsənir), false → type="password" (nöqtələr)
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage("");
                    }}
                    className="login-input"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  {/* Şifrəni göstər/gizlə toggle button */}
                  <button
                    type="button"           // type="button" — bu form submit etmir!
                    className="login-input-toggle"
                    onClick={() => setShowPassword(!showPassword)} // Toggle: true↔false
                    tabIndex={-1}           // Tab düyməsi ilə bu button-a keçmə
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* Remember Me checkbox */}
              <div className="login-form-options">
                <label className="login-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}              // Controlled checkbox — checked state-dən gəlir
                    onChange={(e) => setRememberMe(e.target.checked)} // .checked — boolean dəyər
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {/* Şərti render: errorMessage boş deyilsə xəta blokunı göstər */}
              {/* {condition && (...)} — condition true olduqda JSX render olunur */}
              {errorMessage && (
                <div className="login-error">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="login-button"
                disabled={isLoading} // isLoading true olarsa button deaktiv olur
              >
                {/* Ternary: isLoading true → spinner + "Signing in...", false → "Sign In" */}
                {isLoading ? (
                  <>
                    {/* Fragment <> </> — birden çox element qaytarmaq üçün (like C# tuple) */}
                    <span className="login-button-spinner"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="login-footer">
          <p>&copy; 2026 ChatApp. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

// default export — bu fayldan yalnız bir şey export olunur
// import Login from "./pages/Login" ilə istifadə olunur
export default Login;
