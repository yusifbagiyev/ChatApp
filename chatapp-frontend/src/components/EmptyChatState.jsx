// ─── EmptyChatState — Chat seçilməyib ekranı ──────────────────────────────────
// Chat.jsx-dən çıxarılıb — 160 sətirlik SVG inline saxlamaq əvəzinə ayrı komponent
export default function EmptyChatState() {
  return (
    <div className="chat-empty">
      {/* Bitrix24-ə oxşar composite icon — chat + təqvim + bildiriş */}
      <div className="chat-empty-icon">
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
          {/* Əsas ekran/board */}
          <rect x="20" y="15" width="65" height="55" rx="8" fill="#c8d8ec" stroke="#b0c4de" strokeWidth="1.5" />
          {/* Xətlər */}
          <rect x="30" y="30" width="30" height="4" rx="2" fill="#a0b8d0" />
          <rect x="30" y="40" width="22" height="4" rx="2" fill="#a0b8d0" />
          <rect x="30" y="50" width="35" height="4" rx="2" fill="#a0b8d0" />
          {/* Progress bar */}
          <rect x="30" y="58" width="40" height="3" rx="1.5" fill="#d0dce8" />
          <rect x="30" y="58" width="18" height="3" rx="1.5" fill="#6aab6a" />
          {/* Chat bubble — yuxarı sağda */}
          <rect x="60" y="5" width="28" height="22" rx="6" fill="#6aab6a" />
          <path d="M70 27 L66 33 L74 27" fill="#6aab6a" />
          <rect x="66" y="11" width="16" height="2.5" rx="1.25" fill="rgba(255,255,255,0.7)" />
          <rect x="66" y="16" width="10" height="2.5" rx="1.25" fill="rgba(255,255,255,0.7)" />
          {/* Təqvim icon — sol aşağıda */}
          <rect x="8" y="50" width="22" height="20" rx="4" fill="#4a7fc4" stroke="#3b6cb5" strokeWidth="1" />
          <rect x="11" y="47" width="3" height="6" rx="1.5" fill="#3b6cb5" />
          <rect x="24" y="47" width="3" height="6" rx="1.5" fill="#3b6cb5" />
          <rect x="12" y="57" width="4" height="3" rx="1" fill="rgba(255,255,255,0.6)" />
          <rect x="18" y="57" width="4" height="3" rx="1" fill="rgba(255,255,255,0.6)" />
          <rect x="12" y="62" width="4" height="3" rx="1" fill="rgba(255,255,255,0.6)" />
          <rect x="18" y="62" width="4" height="3" rx="1" fill="rgba(255,255,255,0.6)" />
          {/* Dairəvi icon — sağ aşağı */}
          <circle cx="78" cy="72" r="12" fill="#6a7fc4" stroke="#5a6fb5" strokeWidth="1" />
          <path d="M73 72 L78 67 L83 72 M78 67 V78" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2>Select a chat to start communicating</h2>
    </div>
  );
}
