import { memo } from "react";
import "./ComingSoon.css";

// ComingSoon — hələ implement olunmamış səhifələr üçün placeholder
function ComingSoon({ title = "Coming Soon", icon }) {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-icon">
        {icon || (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        )}
      </div>
      <h2 className="coming-soon-title">{title}</h2>
      <p className="coming-soon-text">This section will be available soon.</p>
    </div>
  );
}

export default memo(ComingSoon);
