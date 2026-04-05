// ErrorBoundary — React 18 class component (hooks ilə error boundary yaratmaq mümkün deyil)
// Child komponentlərdə render xətası baş verərsə, bütün app crash etmir — fallback UI göstərir
// .NET ekvivalenti: global exception handler / middleware

import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    // retryCount — təkrar cəhd sayını izləyir, sonsuz dövrün qarşısını alır
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    // Maksimum 3 cəhd — ondan sonra səhifəni yeniləmək lazımdır
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "16px",
          fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
          color: "#374151",
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#6b7280", maxWidth: "400px", textAlign: "center" }}>
            {this.state.retryCount >= 3
              ? "The error persists. Please refresh the page."
              : "An unexpected error occurred. Please try again."}
          </p>
          {this.state.retryCount >= 3 ? (
            <button
              onClick={this.handleRefresh}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                background: "#ef4444",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.target.style.background = "#dc2626"}
              onMouseLeave={(e) => e.target.style.background = "#ef4444"}
            >
              Refresh page
            </button>
          ) : (
            <button
              onClick={this.handleRetry}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                background: "#2fc6f6",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.target.style.background = "#17b3e6"}
              onMouseLeave={(e) => e.target.style.background = "#2fc6f6"}
            >
              Try again ({3 - this.state.retryCount} {3 - this.state.retryCount === 1 ? "attempt" : "attempts"} left)
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
