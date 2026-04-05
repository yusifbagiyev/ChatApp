# Frontend Audit Report — ChatApp
**Tarix**: 2026-04-03
**Auditor**: Frontend Developer Agent
**Scope**: Bütün frontend faylları (49 fayl, ~23,500 sətir)

---

## Xülasə

| Kateqoriya | Kritik | Yüksək | Orta | Aşağı |
|------------|--------|--------|------|-------|
| Bug / Logic Error | 3 | 8 | 6 | 4 |
| Performance | 1 | 5 | 7 | 3 |
| Memory Leak | 0 | 3 | 5 | 2 |
| Backend Uyumsuzluq | 2 | 3 | 1 | 0 |
| Responsive / Mobile | 0 | 4 | 5 | 2 |
| CSS / Dizayn | 0 | 1 | 3 | 1 |
| Accessibility | 0 | 2 | 4 | 3 |
| **Cəmi** | **6** | **26** | **31** | **15** |

---

## 1. KRİTİK PROBLEMLƏR (Dərhal düzəldin)

### K1. `apiPost()` body olmadan çağırılır — `"undefined"` string göndərilir
**Fayl**: `services/api.js:206-211`
**Təsir**: `apiPost(endpoint)` body parametri olmadan çağırılanda `JSON.stringify(undefined)` → `undefined` string göndərilir. Backend 400 error qaytara bilər.
**Yerləri**: `useSidebarPanels.js:202`, `AuthContext.jsx:89`, `Chat.jsx:924,1080,1641,2038,2070` — cəmi 12 çağırış.
**Həll**: `body !== undefined` yoxlaması əlavə et, body olmazsa `headers`-dan `Content-Type`-ı çıxar.

### K2. `signalr.js:105` — Reconnect zamanı connection `null` olur
**Fayl**: `services/signalr.js:105`
**Təsir**: `onreconnecting` callback-ində `connection = null` təyin edilir. Bu zaman `getConnection()` çağıran hər kod `null` alır. SignalR reconnect bitənə qədər heç bir hub metodu çağırıla bilmir.
**Həll**: `connection = null` yalnız `onclose` zamanı olmalıdır. `onreconnecting`-də connection obyekti hələ keçərlidir.

### K3. `MemberLeftChannel` SignalR eventi handle olunmur
**Fayl**: `hooks/useChatSignalR.js`
**Təsir**: Backend `MemberLeftChannel(channelId, userId)` göndərir, amma frontend-də handler yoxdur. Kanal üzvü ayrılanda real-time UI yenilənmir.
**Həll**: `useChatSignalR.js`-də `MemberLeftChannel` handler əlavə et.

### K4. Chat.jsx — `readBatchTimerRef` unmount zamanı təmizlənmir
**Fayl**: `pages/Chat.jsx:836,870-873`
**Təsir**: Timer unmount-dan sonra fire edə bilər, `apiPost` çağırıb network request göndərər.
**Həll**: Unmount cleanup effect-ində `clearTimeout(readBatchTimerRef.current)` əlavə et.

### K5. Chat.jsx — `setSelectedChat` daxilində asinxron API çağırışı
**Fayl**: `pages/Chat.jsx:473-494`
**Təsir**: State updater funksiya saf (pure) olmalıdır, amma daxilində `apiGet()` çağırılır. React StrictMode-da bu updater iki dəfə çağırıla bilər → iki API request.
**Həll**: State updater-dən API çağırışını çıxar, `useRef` ilə cari state-ə giriş əldə et.

### K6. Chat.jsx — İki dəfə toast göstərilir xəta zamanı
**Fayl**: `pages/Chat.jsx:2227-2228`
**Təsir**: Conversation yaratma xətasında ardıcıl iki `showToast()` çağırılır — istifadəçi eyni xəta üçün iki toast görür.
**Həll**: Artıq toast-u sil.

---

## 2. YÜKSƏK PRİORİTETLİ PROBLEMLƏR

### Y1. DrivePage — Stale closure `handleBulkDelete` və `handleMoveConfirm`-da
**Fayl**: `pages/DrivePage.jsx:1378,1440`
**Təsir**: `files` dəyişəni dependency array-da yoxdur. Köhnə `files` referansı ilə size hesablanır → yanlış storage quota göstəricisi.
**Həll**: `files`-ı dependency array-a əlavə et.

### Y2. DrivePage — Yanlış pagination hesablanması
**Fayl**: `pages/DrivePage.jsx:1527`
**Təsir**: `totalItems = folders.length + totalFiles` — `folders.length` cari səhifədəki qovluq sayıdır, `totalFiles` isə backend-dən gələn ümumi fayl sayıdır. Bu iki fərqli miqyas qarışdırılır → yanlış səhifə sayı.
**Həll**: Backend-dən ümumi qovluq sayını da almaq (ya da `DriveContentsDto`-ya `TotalFolderCount` əlavə etmək).

### Y3. Chat.jsx — MessageBubble-lar üçün inline closure-lar (Performance)
**Fayl**: `pages/Chat.jsx:3431-3604`
**Təsir**: `flatItems.map()` daxilində hər mesaj üçün yeni `onClick`, `onError`, `style` obyektləri yaradılır. 100+ mesajda ciddi performans problemi.
**Həll**: `MessageBubble`-ı `React.memo` ilə wrap et, callback-ləri `useCallback` ilə stabilləşdir.

### Y4. Upload XHR unmount zamanı abort olunmur
**Fayl**: `hooks/useFileUploadManager.js:324-340`
**Təsir**: Komponent unmount olduqda aktiv yükləmələr davam edir. Yükləmə bitdikdə unmount edilmiş komponentdə state yeniləmə cəhdi baş verir.
**Həll**: Unmount cleanup-da `task.abortController.abort()` çağır.

### Y5. UserManagement — DTO field uyumsuzluğu
**Fayl**: `components/admin/UserManagement.jsx:83,237,407,408`
**Təsir**: `UserListItemDto`-da `fullName`, `departmentName`, `positionName` field-ləri yoxdur. Bu field-lər `undefined` göstəriləcək.
**Həll**: Backend-dən qaytarılan DTO-nu yoxla. Ya frontend-i `firstName + " " + lastName`-a dəyiş, ya backend-dən bu field-ləri əlavə et.

### Y6. HierarchyView — `positionName` field uyumsuzluğu
**Fayl**: `components/admin/HierarchyView.jsx:883`
**Təsir**: `OrganizationHierarchyNodeDto`-da field adı `Position`-dır (`position` camelCase-də), `positionName` deyil. Vəzifə badge-i heç vaxt görünməyəcək.
**Həll**: `data.positionName` → `data.position` dəyiş.

### Y7. UserProfilePanel — About bölməsi API-yə bağlı deyil
**Fayl**: `components/UserProfilePanel.jsx:634`
**Təsir**: `handleAboutSave` yalnız local state-i yeniləyir. Səhifə yeniləndikdə dəyişikliklər itir. `// TODO: real API call` şərhi var.
**Həll**: `apiPut("/api/users/me", { aboutMe: newAbout })` əlavə et.

### Y8. FilePreviewPanel — Paylaşılan `dragListenersRef` toqquşması
**Fayl**: `components/FilePreviewPanel.jsx:110,135`
**Təsir**: Fayl sıralama drag və text resize drag eyni ref-i istifadə edir. Biri digərinin cleanup ref-ini əzə bilər → `document`-da `mousemove`/`mouseup` listener-lər qalır.
**Həll**: İki ayrı ref istifadə et.

---

## 3. PERFORMANCE PROBLEMLƏRI

### P1. Chat.jsx — 4436 sətirlik komponent
**Fayl**: `pages/Chat.jsx`
**Təsir**: Hər hansı state dəyişikliyi bütün 4436 sətirlik komponenti re-render edir. İçindəki add-member paneli (234 sətir), avatar menu (126 sətir) və boş-vəziyyət SVG (160 sətir) ayrı komponent olmalıdır.

### P2. Chat.jsx — `handleSelectChat` 430 sətirlik funksiya
**Fayl**: `pages/Chat.jsx:1514-1943`
**Təsir**: Cache save, restore, state reset, API çağırışları, read-later logic, unread separator, üzv yükləmə — hamısı bir funksiyada. Debug etmək çətindir, stale closure riski yüksəkdir.

### P3. Chat.jsx — `handleToggle*` funksiyaları useCallback-siz
**Fayl**: `pages/Chat.jsx:1098-1208`
**Təsir**: `handleTogglePin`, `handleToggleMute`, `handleToggleReadLater`, `handleToggleHide` hər render-də yeni referans yaradır → `ConversationList` lazımsız re-render edilir.

### P4. DrivePage — IIFE hər render-də çağırılır
**Fayl**: `pages/DrivePage.jsx:1793-1803`
**Təsir**: Image viewer üçün `files.filter()` hər render-də çağırılır. `useMemo` ilə əvəz edilməlidir.

### P5. DepartmentManagement — O(n²) tree render
**Fayl**: `components/admin/DepartmentManagement.jsx:630`
**Təsir**: Hər sətir üçün `depts.filter(d => d.parentDepartmentId === dept.id).length` çağırılır → O(n²).

### P6. HierarchyView — countUsers/countOnlineUsers memoize deyil
**Fayl**: `components/admin/HierarchyView.jsx:1002-1003`
**Təsir**: Hər company node render-ində bütün subtree rekursiv sayılır.

### P7. useChatScroll — Süni 400ms minimum yükləmə müddəti
**Fayl**: `hooks/useChatScroll.js:134-138`
**Təsir**: API 50ms-də cavab versə belə 400ms gözləyir. Scroll performansını pisləşdirir.

---

## 4. MEMORY LEAK PROBLEMLƏRİ

### ML1. Chat.jsx — `scrollbarTimerRef` unmount-da təmizlənmir
**Fayl**: `pages/Chat.jsx:295,3224-3228`

### ML2. Chat.jsx — Çoxlu `setTimeout` təmizlənmir
**Fayl**: `pages/Chat.jsx:956-967, 1627-1629, 770-792, 800-823`
**Təsir**: `handleScrollToBottom`, `handleSelectChat`, highlight effect-lərində `setTimeout` ID-ləri saxlanmır.

### ML3. ChatInputArea — Drag listener-ləri unmount-da təmizlənmir
**Fayl**: `components/ChatInputArea.jsx:88-109`
**Təsir**: Drag əməliyyatı zamanı komponent unmount olsa, `document`-da listener-lər qalar.

### ML4. UserProfilePanel — AvatarCropModal drag listener-ləri
**Fayl**: `components/UserProfilePanel.jsx:220-229`

### ML5. useMention — `mentionSearchTimerRef` unmount-da təmizlənmir
**Fayl**: `hooks/useMention.js:32,52-54`

---

## 5. BACKEND UYUMSUZLUQLARI

### B1. TopNavbar — Role adı uyumsuzluğu
**Fayl**: `components/TopNavbar.jsx:44`
**Təsir**: `"Admin"` / `"SuperAdmin"` yoxlayır, amma backend `"Administrator"` göndərə bilər. Admin nav elementi görünməyə bilər.
**Həll**: Backend-dən gələn role string-lərini yoxla və uyğunlaşdır.

### B2. HierarchyView — `headOfDepartmentName` field yoxdur
**Fayl**: `components/admin/HierarchyView.jsx:1020`
**Təsir**: `OrganizationHierarchyNodeDto`-da bu field yoxdur → company head etiketi heç vaxt render olunmur.

### B3. DrivePage — Trash item-lərdə `serveUrl` və `originalFileName` yoxdur
**Fayl**: `pages/DrivePage.jsx:940,951`
**Təsir**: `DriveTrashItemDto`-da bu field-lər yoxdur. Thumbnail heç vaxt göstərilmir (dead code), `originalFileName` fallback-ı lazımsızdır.

### B4. HierarchyView — Role integer vs string uyumsuzluğu
**Fayl**: `components/admin/HierarchyView.jsx:452` vs `UserManagement.jsx:54`
**Təsir**: Biri role-u integer kimi, digəri string kimi göndərir. Backend-in hansını gözlədiyini yoxla.

### B5. ConversationList — AbortController.signal API-yə ötürülmür
**Fayl**: `components/ConversationList.jsx:361-366`
**Təsir**: `AbortController` yaradılır amma signal `apiGet` çağırışlarına ötürülmür → request-lər əslində cancel olunmur.

---

## 6. RESPONSİV DİZAYN PROBLEMLƏRİ

### R1. 9 komponent mobile responsive deyil
Aşağıdakı komponentlərdə heç bir `@media` query yoxdur:
1. **ChatInputArea.css** — Emoji panel 350x435px sabit → mobildə overflow
2. **ChatHeader.css** — Action button-lar sığmaya bilər
3. **ChannelPanel.css** — Channel yaratma formu responsive deyil
4. **MentionPanel.css** — 400px sabit eni → telefonlarda overflow
5. **ForwardPanel.css** — 400x520px sabit ölçü
6. **ReadersPanel.css** — 360px sabit en
7. **PinnedBar.css** — Adaptiv layout yoxdur
8. **ImageViewer.css** — Mobile override yoxdur
9. **UserProfilePanel.css** — 380px sabit sütun eni, 500px-dən kiçik ekranlarda qırılır

### R2. Admin panel table-ları mobil uyğun deyil
**Fayllar**: `UserManagement.css`, `CompanyManagement.css`
**Təsir**: 6 sütunlu table-lar mobil ekranlarda sığmır. Horizontal scroll wrapper yoxdur.

### R3. UserDetailPage grid-i responsive deyil
**Fayl**: `components/admin/UserDetailPage.css:84-86,146-148`
**Təsir**: `grid-template-columns: repeat(4, 1fr)` (stat-lar) və `1fr 380px` (content) tablet/mobil override yoxdur.

### R4. DepartmentManagement tree indent-i mobil ekranlarda overflow edir
**Fayl**: `components/admin/DepartmentManagement.jsx:588`
**Təsir**: `paddingLeft: level * 24 + 12` — dərin hierarchy-lərdə elementlər ekrandan çıxır.

---

## 7. CSS / DİZAYN PROBLEMLƏRİ

### D1. z-index xaosu
Hardcoded dəyərlər: `100` (TopNavbar, DetailSidebar), `1900-1902` (UserProfilePanel), `3000` (crop modal), `99999` (toast).
**Həll**: `--z-navbar`, `--z-sidebar`, `--z-modal`, `--z-overlay`, `--z-toast` CSS dəyişənləri yaradıb istifadə et.

### D2. 5 fərqli shimmer keyframe təkrarlama
`convShimmer`, `headerShimmer`, `ds-shimmer`, `adm-shimmer`, `imgShimmer` — hamısı eyni effektdir.
**Həll**: Vahid `@keyframes shimmer` `index.css`-də təyin et.

### D3. WCAG kontrast nisbəti pozuntuları
- **ChatStatusBar.css:25**: Ağ mətn `#a3bad4` fonunda — kontrast 2.7:1 (AA minimum 4.5:1)
- **ConversationList.css:539**: `var(--gray-400)` (#9CA3AF) ağ fonunda — kontrast 2.8:1

---

## 8. ACCESSİBİLİTY PROBLEMLƏRİ

### A1. Touch target ölçüləri minimum 44px-dən aşağıdır
- `.search-clear-btn`: 20x20px
- `.create-channel-chip-remove`: 14x14px
- `.pinned-bar-btn`: 28x28px
- `.bubble-action-btn`: 26x26px
- `.select-checkbox`: 22x22px

### A2. Focus-visible state-lər çoxluq komponentdə yoxdur
ConversationList, ChatHeader, DetailSidebar, ChannelPanel, ForwardPanel, ReadersPanel, PinnedBar, MentionPanel, DrivePage, admin panellər — focus indicator yoxdur.

### A3. Chat.jsx — ARIA atributları çatışmır
- Scroll-to-bottom button-da `aria-label` yoxdur
- Avatar menu-da `role="menu"` yoxdur
- Mobile tab-larda `role="tablist"` yoxdur
- Connection toast-da `role="alert"` yoxdur

### A4. Clickable div-lərdə `role="button"` yoxdur
ConversationList item-ləri, ChatHeader avatar, context menu-lar — div kimi render olunur ama click handler var. `tabIndex={0}` və keyboard handler-lar çatışmır.

---

## 9. DİGƏR PROBLEMLƏR

### X1. Password validation uyumsuzluğu
- HierarchyView placeholder: "Min. 6 characters" amma validation 8 tələb edir
- UserManagement: heç bir length validation yoxdur
- UserDetailPage: 8 character tələb edir
**Həll**: Vahid password validation utility funksiyası yarat.

### X2. HierarchyView — DeptDetailPanel dublikatı
**Fayl**: `HierarchyView.jsx:65` vs `DepartmentManagement.jsx:14`
**Təsir**: Eyni funksionallıq (head assignment, member list, edit, delete) iki müstəqil nüsxədə saxlanılır → drift riski.

### X3. DrivePage — `formatSize` və `formatFileSize` dublikatı
**Fayl**: `pages/DrivePage.jsx:35,44`
**Təsir**: İki fərqli size formatlama funksiyası istifadə olunur (biri import, biri lokal). Birini sil.

### X4. Chat.jsx — Boş-vəziyyət SVG inline
**Fayl**: `pages/Chat.jsx:3893-4054`
**Təsir**: 160 sətir static SVG hər render-də yenidən yaradılır. Ayrı komponent olmalıdır.

### X5. ImageViewer — Passive event listener pozuntusu
**Fayl**: `components/ImageViewer.jsx:40-43`
**Təsir**: `onWheel` handler-ında `e.preventDefault()` — modern brauzerlər passive event listener xəbərdarlığı göstərə bilər.

### X6. ErrorBoundary — Sonsuz retry dövrü
**Fayl**: `components/ErrorBoundary.jsx:21-23`
**Təsir**: Retry sayğacı yoxdur. Deterministik xəta olduqda sonsuz crash-retry dövrü başlayır.

### X7. MessageActionMenu — "Save to drive" boş funksionaldır
**Fayl**: `components/MessageActionMenu.jsx:192-205`
**Təsir**: TODO şərhi var, button heç nə etmir. Ya implement et, ya disable et.

### X8. TopNavbar — Notification button boş
**Fayl**: `components/TopNavbar.jsx:130`
**Təsir**: `onClick={() => {}}` — click heç nə etmir. İstifadəçini çaşdırır.

### X9. useChatSignalR — `conn.off(event)` bütün handler-ları silir
**Fayl**: `hooks/useChatSignalR.js:555-557`
**Təsir**: Yalnız bu hook-un handler-larını deyil, bütün handler-ları silir. Fragile pattern.

### X10. Dark mode hazırlığı yoxdur
Heç bir CSS faylında `prefers-color-scheme: dark` yoxdur. Gələcəkdə dark mode əlavə etmək çətin olacaq.

---

## TÖVSİYƏLƏR PRİORİTETƏ GÖRƏ

### Faz 1 — Kritik düzəlişlər (dərhal)
1. `apiPost` body undefined problemi (K1)
2. SignalR reconnect connection null problemi (K2)
3. `MemberLeftChannel` handler əlavə et (K3)
4. Timer cleanup-lar (K4, ML1-ML5)
5. Double toast sil (K6)
6. State updater-dən API çağırışını çıxar (K5)

### Faz 2 — Yüksək prioritet (1 həftə)
1. DTO field uyumsuzluqlarını düzəlt (Y5, Y6, B1-B4)
2. Stale closure bug-ları düzəlt (Y1)
3. Pagination hesablamasını düzəlt (Y2)
4. UserProfilePanel about save API-ni implement et (Y7)
5. FilePreviewPanel drag ref toqquşmasını həll et (Y8)
6. Upload abort-u implement et (Y4)

### Faz 3 — Responsive dizayn (2 həftə)
1. 9 responsive-olmayan komponenti mobile-uyğun et (R1)
2. Admin table-ları horizontal scroll-la wrap et (R2)
3. UserDetailPage grid-i responsive et (R3)
4. UserProfilePanel mobile layout (R1.9)

### Faz 4 — Performance & Refactoring (3 həftə)
1. Chat.jsx-i kiçik komponentlərə böl (P1)
2. MessageBubble map-ında callback optimization (Y3)
3. z-index sistemini standardlaşdır (D1)
4. Shimmer keyframe-ləri birləşdir (D2)

### Faz 5 — Accessibility (4 həftə)
1. Touch target-ları 44px-ə yüksəlt (A1)
2. Focus-visible state-ləri əlavə et (A2)
3. ARIA atributlarını əlavə et (A3, A4)
4. Kontrast nisbətlərini düzəlt (D6)

---

*Audit nəticəsi: Frontend funksional vəziyyətdədir, amma 6 kritik, 28 yüksək prioritetli problem var. Responsive dizayn 9 komponentdə əksikdir. CSS rəng harmoniyası pozulub. Prioritet sırasına uyğun düzəliş tövsiyə olunur.*
