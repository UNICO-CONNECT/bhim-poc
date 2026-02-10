/* =============================================================
   BHIM UPI – Onboarding Journey (State Machine v2)
   Tooltip Tour → Manual Interactive Flow
   ============================================================= */

// ─── State Definitions ───────────────────────────────────────
const S = Object.freeze({
  LANDING: "landing",
  SPLASH_1: "splash_1",
  SPLASH_2: "splash_2",
  GET_STARTED: "get_started",
  LANG_SELECT: "lang_select",
  MOBILE_ENTRY: "mobile_entry",
  OTP_ENTRY: "otp_entry",
  SIM_SELECT: "sim_select",
  VERIFY_1: "verify_1",
  VERIFY_2: "verify_2",
  VERIFY_3: "verify_3",
  SECURITY_SELECT: "security_select",
  PASSCODE_ENTRY: "passcode_entry",
  LOADING_SPLASH: "loading_splash",
  HOME: "home",
});

// ─── Globals ─────────────────────────────────────────────────
let currentState = null;
let phoneShell = null;
let activeDriver = null;
let timers = [];

// Tooltip tour state
let tooltipsSeen = false;
let currentTTIdx = -1; // current tooltip index during tour

// Interactive input state (manual flow)
let selectedLang = null;
let mobileInput = "";
let otpInput = "";
let passcodeEnter = "";
let passcodeConfirm = "";
let selectedSim = null;
let selectedSecurity = null; // 'device' or 'passcode'

function clearTimers() {
  timers.forEach((t) => clearTimeout(t));
  timers = [];
}
function wait(fn, ms) {
  const t = setTimeout(fn, ms);
  timers.push(t);
  return t;
}

// ─── SVG Helpers ─────────────────────────────────────────────
function statusBarSVG(dark) {
  const c = dark ? "#080a0b" : "#ffffff";
  return `
  <div class="ob-status-bar ob-status-bar--${dark ? "dark" : "light"}">
    <span class="ob-status-bar__time" style="color:${c}">9:41</span>
    <div class="ob-status-bar__icons">
      <svg viewBox="0 0 18 12" fill="none"><rect x="0" y="8" width="3" height="4" rx=".5" fill="${c}"/><rect x="5" y="5" width="3" height="7" rx=".5" fill="${c}"/><rect x="10" y="2" width="3" height="10" rx=".5" fill="${c}"/><rect x="15" y="0" width="3" height="12" rx=".5" fill="${c}"/></svg>
      <svg viewBox="0 0 16 12" fill="none"><path d="M8 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="${c}"/><path d="M4.5 7.5C5.5 6.2 6.7 5.5 8 5.5s2.5.7 3.5 2" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/><path d="M2 5c1.8-2 3.7-3 6-3s4.2 1 6 3" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/></svg>
      <svg viewBox="0 0 28 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="2" stroke="${c}" stroke-opacity=".35"/><rect x="2" y="2" width="20" height="9" rx="1" fill="${c}"/><path d="M25 4.5v4a2 2 0 000-4z" fill="${c}" fill-opacity=".4"/></svg>
    </div>
  </div>`;
}

function backArrowHTML() {
  return `<button class="ob-back-btn" onclick="goBack()" aria-label="Back"><svg viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="#0b0b0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
}

function homeIndHTML() {
  return `<div class="ob-home-ind"><div class="ob-home-ind__bar"></div></div>`;
}

function upiLogoSVG(w, h, svgName) {
  svgName = svgName || "upi.svg";
  w = w || 120;
  h = h || 50;
  return `<img src="assets/${svgName}" width="${w}" height="${h}" alt="UPI Logo" style="object-fit: contain;">`;
}

function upiLogoDarkSVG(w, h, svgName) {
  svgName = svgName || "upi_dark_lg.svg";
  w = w || 120;
  h = h || 50;
  return `<img src="assets/${svgName}" width="${w}" height="${h}" alt="UPI Logo Dark" style="object-fit: contain;">`;
}

function sparkleSVG() {
  return `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 0L5.9 3.5H9.5L6.5 5.5L7.5 9L5 7L2.5 9L3.5 5.5L0.5 3.5H4.1L5 0Z" fill="#f4c77a" opacity=".6"/></svg>`;
}

function indianFlagSVG() {
  return `<svg width="28" height="20" viewBox="0 0 28 20"><rect width="28" height="7" fill="#FF9933"/><rect y="7" width="28" height="6" fill="#FFFFFF"/><rect y="13" width="28" height="7" fill="#138808"/><circle cx="14" cy="10" r="2.5" fill="none" stroke="#000080" stroke-width=".5"/></svg>`;
}

function checkCircleSVG(active) {
  if (active)
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><path d="M7 12l3 3 7-7" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#f0f0f0" stroke="#ddd" stroke-width="1.5"/><path d="M7 12l3 3 7-7" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/* Keyboard with interactive onclick handlers */
function interactiveKBHTML() {
  const keys = [
    { d: "1" },
    { d: "2", s: "ABC" },
    { d: "3", s: "DEF" },
    { d: "4", s: "GHI" },
    { d: "5", s: "JKL" },
    { d: "6", s: "MNO" },
    { d: "7", s: "PQRS" },
    { d: "8", s: "TUV" },
    { d: "9", s: "WXYZ" },
    { d: "", empty: true },
    { d: "0" },
    { d: "⌫", del: true },
  ];
  let h = '<div class="ob-keyboard">';
  keys.forEach((k) => {
    if (k.empty) {
      h += '<div class="ob-key ob-key--empty"></div>';
      return;
    }
    const cls = k.del ? " ob-key--del" : "";
    const val = k.del ? "DEL" : k.d;
    h += `<button class="ob-key${cls}" onclick="handleKeyPress('${val}')">${k.d}${k.s ? '<span class="ob-key__sub">' + k.s + "</span>" : ""}</button>`;
  });
  h += "</div>";
  return h;
}

/* Static (non-interactive) keyboard for tooltip preview screens */
function staticKBHTML() {
  const keys = [
    { d: "1" },
    { d: "2", s: "ABC" },
    { d: "3", s: "DEF" },
    { d: "4", s: "GHI" },
    { d: "5", s: "JKL" },
    { d: "6", s: "MNO" },
    { d: "7", s: "PQRS" },
    { d: "8", s: "TUV" },
    { d: "9", s: "WXYZ" },
    { d: "", empty: true },
    { d: "0" },
    { d: "⌫", del: true },
  ];
  let h = '<div class="ob-keyboard">';
  keys.forEach((k) => {
    if (k.empty) {
      h += '<div class="ob-key ob-key--empty"></div>';
      return;
    }
    const cls = k.del ? " ob-key--del" : "";
    h += `<button class="ob-key${cls}">${k.d}${k.s ? '<span class="ob-key__sub">' + k.s + "</span>" : ""}</button>`;
  });
  h += "</div>";
  return h;
}

// ─── INTERACTIVE Screen Renderers (Manual Flow) ──────────────
// These functions accept an optional `mode` parameter.
// When mode === "preview", screens get `screen--no-anim` class and use static keyboards.

function landingHTML() {
  return `
  <div class="screen screen-landing">
    <div class="landing-logo">${upiLogoDarkSVG(140, 58, "upi_dark_sm.svg")}</div>
    <div class="landing-buttons">
      <button class="ob-btn ob-btn--primary" onclick="startOnboarding()"><span>1.</span> Start Onboarding Flow</button>
      <button class="ob-btn ob-btn--primary" onclick="goHome()"><span>2.</span> Add Bank Account</button>
      <button class="ob-btn ob-btn--primary" onclick="goHome()"><span>3.</span> Scan and Pay</button>
      <button class="ob-btn ob-btn--primary" onclick="goHome()"><span>4.</span> Send to mobile</button>
      <button class="ob-btn ob-btn--primary" onclick="goHome()"><span>5.</span> Check Balance</button>
    </div>
  </div>`;
}

function splash1HTML() {
  return `<div class="screen screen-splash screen--no-anim"><div class="ob-tricolor"></div><div class="ob-circle-deco"></div><div class="ob-sparkle ob-sparkle--1">${sparkleSVG()}</div><div class="ob-sparkle ob-sparkle--2">${sparkleSVG()}</div></div>`;
}

function splash2HTML() {
  return `<div class="screen screen-splash"><div class="ob-tricolor"></div><div class="ob-circle-deco"></div><div class="ob-sparkle ob-sparkle--1">${sparkleSVG()}</div><div class="ob-sparkle ob-sparkle--2">${sparkleSVG()}</div><p class="splash-text">यूपीआई ऐप खोलें</p><div class="splash-logo splash-logo--animate">${upiLogoDarkSVG(180, 75, "upi_dark_lg.svg")}</div></div>`;
}

function getStartedHTML(mode) {
  const isPreview = mode === "preview";
  const noAnim = isPreview ? " screen--no-anim" : "";
  const langSectionId = isPreview ? ' id="gs-lang-section"' : '';
  return `
  <div class="screen screen-get-started${noAnim}">
    <div class="gs-blue-bg"></div>
    ${statusBarSVG(false)}
    <div class="gs-header"><div style="margin-top:8px">${upiLogoSVG(91, 48, "upi.svg")}</div><div class="gs-tagline">India's most loved<br>UPI App!</div></div>
    <div class="gs-body">
      <div class="gs-carousel"><div class="gs-carousel__icon"><img width="64" height="64" src="assets/star.png"  alt="Star"></div><div class="gs-carousel__text">Bring your family together<br>with BHIM's family mode</div></div>
      <div class="gs-dots"><div class="gs-dot"></div><div class="gs-dot gs-dot--active"></div><div class="gs-dot"></div><div class="gs-dot"></div></div>
      <div class="gs-lang-section"${langSectionId}>
        <p class="gs-lang-title">Choose your preferred language</p>
        <div class="gs-lang-cards">
          <div class="gs-lang-card"><div class="gs-lang-card__text"><h3>हिंदी</h3><p>नमस्ते</p></div><div class="gs-lang-card__radio"></div></div>
          <div class="gs-lang-card"><div class="gs-lang-card__text"><h3>मराठी</h3><p>नमस्कार</p></div><div class="gs-lang-card__radio"></div></div>
        </div>
      </div>
    </div>
    <div class="ob-bottom-bar">
      <div class="ob-bottom-bar__inner" style="padding-top:0"><button class="ob-btn ob-btn--tertiary"${isPreview ? '' : ' onclick="renderScreen(S.LANG_SELECT)"'}>view all languages</button></div>
      <div class="ob-bottom-bar__inner"><button class="ob-btn ob-btn--primary"${isPreview ? '' : ' onclick="renderScreen(S.LANG_SELECT)"'}>Proceed</button></div>
      ${homeIndHTML()}
    </div>
  </div>`;
}

function langSelectHTML(mode) {
  const isPreview = mode === "preview";
  const noAnim = isPreview ? " screen--no-anim" : "";
  const langs = [
    { native: "हिन्दी", eng: "Hindi" },
    { native: "मराठी", eng: "Marathi" },
    { native: "English", eng: "" },
    { native: "বাংলা", eng: "Bengali" },
    { native: "தமிழ்", eng: "Tamil" },
    { native: "తెలుగు", eng: "Telegu" },
    { native: "ગુજરાતી", eng: "Gujarati" },
  ];
  let list = "";
  langs.forEach((l, i) => {
    const isSel = isPreview && l.native === "English";
    const cls = isSel ? " lang-item--selected" : "";
    const radio = isSel
      ? '<div class="lang-radio lang-radio--checked"></div>'
      : `<div class="lang-radio" id="lang-radio-${i}"></div>`;
    const onclick = isPreview ? '' : ` onclick="selectLanguage(${i})"`;
    list += `<div class="lang-item${cls}" id="lang-item-${i}"${onclick}><div class="lang-item__text"><h4>${l.native}</h4>${l.eng ? "<p>" + l.eng + "</p>" : ""}</div>${radio}</div>`;
  });
  const doneBtn = isPreview
    ? '<button class="ob-btn ob-btn--primary">Done</button>'
    : '<button class="ob-btn ob-btn--disabled" id="lang-done-btn">Done</button>';
  return `
  <div class="screen screen-language${noAnim}">
    <div class="ob-tricolor"></div>${statusBarSVG(true)}
    <div class="ob-page-header">${backArrowHTML()}<span class="ob-page-title">Change language</span></div>
    <div class="lang-search"><div class="lang-search__box"><svg class="lang-search__icon" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="#999" stroke-width="1.5"/><path d="M14 14l4 4" stroke="#999" stroke-width="1.5" stroke-linecap="round"/></svg>Search preferred language<svg class="lang-search__mic" viewBox="0 0 20 20" fill="none"><rect x="7" y="2" width="6" height="10" rx="3" stroke="#999" stroke-width="1.3"/><path d="M4 10c0 4 3 6 6 6s6-2 6-6" stroke="#999" stroke-width="1.3" stroke-linecap="round"/><path d="M10 16v3" stroke="#999" stroke-width="1.3" stroke-linecap="round"/></svg></div></div>
    <div class="lang-list" id="lang-list">${list}</div>
    <div class="ob-bottom-bar"><div class="ob-bottom-bar__inner">${doneBtn}</div>${homeIndHTML()}</div>
  </div>`;
}

function mobileEntryHTML(mode) {
  const isPreview = mode === "preview";
  const noAnim = isPreview ? " screen--no-anim" : "";
  const phoneDisplay = isPreview ? "9999999999" : "";
  const inputId = isPreview ? '' : ' id="mob-number"';
  const wrapId = isPreview ? ' id="mob-input-wrap"' : '';
  const btnClass = isPreview ? "ob-btn--primary" : "ob-btn--disabled";
  const btnId = isPreview ? '' : ' id="mob-proceed-btn"';
  const kb = isPreview ? staticKBHTML() : interactiveKBHTML();
  return `
  <div class="screen screen-mobile${noAnim}">
    <div class="ob-tricolor"></div>${statusBarSVG(true)}
    <div class="ob-page-header">${backArrowHTML()}</div>
    <div class="mob-content">
      <h1 class="mob-title">Enter Your Mobile Number</h1>
      <p class="mob-subtitle">Please enter the mobile number linked to your bank account to continue using the UPI app.</p>
      <div class="mob-input-wrap"${wrapId}><div class="mob-flag">${indianFlagSVG()}</div><svg class="mob-dropdown" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="#999" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="mob-code">+91</span><div class="mob-divider"></div><span class="mob-number"${inputId}>${phoneDisplay}</span></div>
      <div class="mob-btn-area"><button class="ob-btn ${btnClass}"${btnId}>Proceed</button></div>
    </div>${kb}${homeIndHTML()}
  </div>`;
}

function otpEntryHTML(mode) {
  const isPreview = mode === "preview";
  const noAnim = isPreview ? " screen--no-anim" : "";
  let boxes = "";
  for (let i = 0; i < 6; i++) {
    if (isPreview) {
      boxes += '<div class="otp-box">-</div>';
    } else {
      boxes += `<div class="otp-box" id="otp-box-${i}"></div>`;
    }
  }
  const phone = mobileInput || "9999999999";
  const kb = isPreview ? staticKBHTML() : interactiveKBHTML();
  const btnId = isPreview ? '' : ' id="otp-proceed-btn"';
  return `
  <div class="screen screen-otp${noAnim}">
    <div class="ob-tricolor"></div>${statusBarSVG(true)}
    <div class="ob-page-header">${backArrowHTML()}</div>
    <div class="otp-content">
      <h1 class="otp-title">We are fetching your OTP sent on your number</h1>
      <div class="otp-number-row"><span class="otp-phone">+91 ${phone}</span><span class="otp-change">Change →</span></div>
      <div class="otp-boxes" id="otp-boxes">${boxes}</div>
      <p class="otp-timer">Auto reading OTP 1:00</p>
      <div class="otp-btn-area"><button class="ob-btn ob-btn--disabled"${btnId}>Proceed</button></div>
    </div>${kb}${homeIndHTML()}
  </div>`;
}

function simSelectHTML(mode) {
  const isPreview = mode === "preview";
  const noAnim = isPreview ? " screen--no-anim" : "";
  const cardsId = isPreview ? ' id="sim-cards"' : '';
  return `
  <div class="screen screen-sim${noAnim}">
    <div class="ob-tricolor"></div>${statusBarSVG(true)}
    <div class="ob-page-header">${backArrowHTML()}</div>
    <div class="sim-content">
      <h1 class="sim-title">Lets Verify your number</h1>
      <p class="sim-subtitle">Choose a SIM card registered to your bank account</p>
      <div class="sim-cards"${cardsId}>
        <div class="sim-card"${isPreview ? '' : ' id="sim-card-airtel" onclick="selectSim(\'airtel\')"'}>
          <div class="sim-card__logo" style="background:#fce4e4"><svg width="32" height="32" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#E40000"/><path d="M12 34 C16 18, 32 18, 36 34" stroke="white" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg></div>
          <div class="sim-card__bottom"><div><div class="sim-card__name">Airtel</div><div class="sim-card__slot">SIM 1</div></div><div class="lang-radio"${isPreview ? '' : ' id="sim-radio-airtel"'}></div></div>
        </div>
        <div class="sim-card"${isPreview ? '' : ' id="sim-card-jio" onclick="selectSim(\'jio\')"'}>
          <div class="sim-card__logo" style="background:#e4ebf8"><svg width="32" height="32" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#1A3F8E"/><text x="24" y="30" font-family="sans-serif" font-size="16" font-weight="700" fill="white" text-anchor="middle">Jio</text></svg></div>
          <div class="sim-card__bottom"><div><div class="sim-card__name">Jio</div><div class="sim-card__slot">SIM 2</div></div><div class="lang-radio"${isPreview ? '' : ' id="sim-radio-jio"'}></div></div>
        </div>
      </div>
      <div class="sim-info-box"><svg class="sim-info-box__icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="#999" stroke-width="1.2"/><path d="M10 9v5" stroke="#999" stroke-width="1.3" stroke-linecap="round"/><circle cx="10" cy="6.5" r=".8" fill="#999"/></svg><span class="sim-info-box__text">By selecting a SIM I agree to the Terms and Conditions. Regular carrier chargers may apply.</span></div>
    </div>
    <div class="ob-bottom-bar"><div class="ob-bottom-bar__inner"><button class="ob-btn ob-btn--disabled"${isPreview ? '' : ' id="sim-confirm-btn"'}>Confirm SIM</button></div>${homeIndHTML()}</div>
  </div>`;
}

function verifyHTML(step) {
  const steps = [
    { text: "Verify Mobile Number", active: step >= 1 },
    { text: "SMS sent from your mobile", active: step >= 2 },
    { text: "Verification completed", active: step >= 3 },
  ];
  let sh = "";
  steps.forEach((s, i) => {
    const cls = s.active ? "verify-step--active" : "verify-step--pending";
    sh += `<div class="verify-step ${cls}"><div class="verify-step__circle">${checkCircleSVG(s.active)}</div><span class="verify-step__text">${s.text}</span></div>`;
    if (i < 2) {
      const cc = steps[i + 1].active ? " verify-connector--active" : "";
      sh += `<div class="verify-connector${cc}"></div>`;
    }
  });
  return `
  <div class="screen screen-verify screen--no-anim">${statusBarSVG(true)}<div class="verify-overlay"></div>
    <div class="verify-sheet"><h2 class="verify-sheet__title">Verifying Your Number</h2><div class="verify-steps">${sh}</div></div>${homeIndHTML()}
  </div>`;
}

function securitySelectHTML() {
  return `
  <div class="screen screen-security">
    <div class="ob-tricolor"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header">${backArrowHTML()}</div>
    <div class="sec-content">
      <h1 class="sec-title">Choose Your Security Method</h1>
      <p class="sec-subtitle">Select a method to securely login to your UPI app</p>
      <div class="sec-options">
        <!-- Device Lock Card -->
        <div class="sec-option" id="sec-opt-device" onclick="selectSecurity('device')">
          <div class="sec-card sec-card--blue">
            <div class="sec-card__header">
              <div class="sec-card__icon sec-card__icon--blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.7 2 6 4.7 6 8c0 1.5.6 2.9 1.5 4-.2.3-.3.5-.5.8C5.8 14.5 5 16.7 5 19h2c0-1.8.6-3.5 1.7-4.8.3.1.6.2.9.2C10 16 11.8 18 12 20h2c.2-2 1.9-4 2.4-5.6.3 0 .6-.1.9-.2C18.4 15.5 19 17.2 19 19h2c0-2.3-.8-4.5-2-6.2-.1-.3-.3-.5-.5-.8.9-1.1 1.5-2.5 1.5-4 0-3.3-2.7-6-6-6zm0 2c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="white"/></svg>
              </div>
              <div class="lang-radio" id="sec-radio-device"></div>
            </div>
            <div class="sec-card__body">
              <h3 class="sec-card__name">Use your device lock</h3>
              <p class="sec-card__desc">Use your existing pattern, PIN, Face ID, or Fingerprint to unlock</p>
            </div>
          </div>
          <div class="sec-footer sec-footer--blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M1 9l2-2m0 0C5 5 8.5 3 12 3c3.5 0 7 2 9 4m-18 0l2 2m14-2l2 2m-4.5 2.5c-1-1.2-2.7-2-4.5-2s-3.5.8-4.5 2" stroke="white" stroke-width="1.5" stroke-linecap="round"/><line x1="4" y1="4" x2="20" y2="20" stroke="white" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="18" r="1.5" fill="white"/></svg>
            <span>Works offline</span>
          </div>
        </div>
        <!-- Passcode Card -->
        <div class="sec-option" id="sec-opt-passcode" onclick="selectSecurity('passcode')">
          <div class="sec-card sec-card--gray">
            <div class="sec-card__header">
              <div class="sec-card__icon sec-card__icon--green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="10" rx="2" stroke="white" stroke-width="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="white" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="16" r="1.5" fill="white"/><path d="M12 17.5V19" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>
              </div>
              <div class="lang-radio" id="sec-radio-passcode"></div>
            </div>
            <div class="sec-card__body">
              <h3 class="sec-card__name">Create a 4 digit UPI passcode</h3>
              <p class="sec-card__desc">UPI App Passcode is the code you set to open and access the UPI application. This is different from the UPI PIN. UPI PIN is used for transactions and will only be asked while completing a transaction</p>
            </div>
          </div>
          <div class="sec-footer sec-footer--green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M1 9l2-2m0 0C5 5 8.5 3 12 3c3.5 0 7 2 9 4m-18 0l2 2m14-2l2 2m-4.5 2.5c-1-1.2-2.7-2-4.5-2s-3.5.8-4.5 2" stroke="white" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="18" r="1.5" fill="white"/></svg>
            <span>Works online</span>
          </div>
        </div>
      </div>
    </div>
    <div class="ob-bottom-bar">
      <div class="ob-bottom-bar__inner"><button class="ob-btn ob-btn--disabled" id="sec-next-btn">Next</button></div>
      ${homeIndHTML()}
    </div>
  </div>`;
}

function passcodeEntryHTML() {
  let eBoxes = "",
    cBoxes = "";
  for (let i = 0; i < 4; i++) {
    eBoxes += `<div class="pass-box pass-box--empty" id="pass-e-${i}"><div class="pass-box__dot"></div></div>`;
    cBoxes += `<div class="pass-box pass-box--empty" id="pass-c-${i}"><div class="pass-box__dot"></div></div>`;
  }
  return `
  <div class="screen screen-passcode">
    <div class="ob-tricolor"></div>${statusBarSVG(true)}
    <div class="ob-page-header">${backArrowHTML()}</div>
    <div class="pass-content">
      <h1 class="pass-title">Register New Passcode</h1>
      <p class="pass-subtitle">Enter & confirm a new passcode below</p>
      <div class="pass-section"><p class="pass-label">Enter Passcode</p><div class="pass-boxes">${eBoxes}</div></div>
      <div class="pass-section"><p class="pass-label">Re-Enter Passcode</p><div class="pass-boxes">${cBoxes}</div></div>
      <p class="pass-show">Show</p>
      <div class="pass-btn-area"><button class="ob-btn ob-btn--disabled" id="pass-confirm-btn">Proceed</button></div>
    </div>${interactiveKBHTML()}${homeIndHTML()}
  </div>`;
}

function loadingSplashHTML() {
  return `<div class="screen screen-loading-splash"><div class="ob-tricolor"></div>${statusBarSVG(true)}<div class="loading-content">${upiLogoDarkSVG(140, 58, "upi_dark_lg.svg")}<p class="loading-text">Loading...</p></div></div>`;
}

// ─── Home Screen HTML (from original index.html) ─────────────
function homeScreenHTML() {
  return `
  <div class="screen screen--no-anim" style="display:block">
    <div class="status-bar"><span class="status-bar__time">9:41</span><div class="status-bar__icons"><svg viewBox="0 0 18 12" fill="none"><rect x="0" y="8" width="3" height="4" rx="0.5" fill="#080a0b"/><rect x="5" y="5" width="3" height="7" rx="0.5" fill="#080a0b"/><rect x="10" y="2" width="3" height="10" rx="0.5" fill="#080a0b"/><rect x="15" y="0" width="3" height="12" rx="0.5" fill="#080a0b"/></svg><svg viewBox="0 0 16 12" fill="none"><path d="M8 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="#080a0b"/><path d="M4.5 7.5C5.5 6.2 6.7 5.5 8 5.5s2.5.7 3.5 2" stroke="#080a0b" stroke-width="1.2" stroke-linecap="round"/><path d="M2 5c1.8-2 3.7-3 6-3s4.2 1 6 3" stroke="#080a0b" stroke-width="1.2" stroke-linecap="round"/></svg><svg viewBox="0 0 28 13" fill="none"><rect x="0.5" y="0.5" width="23" height="12" rx="2" stroke="#080a0b" stroke-opacity="0.35"/><rect x="2" y="2" width="20" height="9" rx="1" fill="#080a0b"/><path d="M25 4.5v4a2 2 0 000-4z" fill="#080a0b" fill-opacity="0.4"/></svg></div></div>
    <div class="header">
      <div class="avatar">RS<div class="avatar__qr-badge"><svg viewBox="0 0 12 12" fill="none"><rect x="0" y="0" width="5" height="5" rx="1" stroke="#0b0b0b" stroke-width="1"/><rect x="7" y="0" width="5" height="5" rx="1" stroke="#0b0b0b" stroke-width="1"/><rect x="0" y="7" width="5" height="5" rx="1" stroke="#0b0b0b" stroke-width="1"/><rect x="2" y="2" width="1.5" height="1.5" fill="#0b0b0b"/><rect x="9" y="2" width="1.5" height="1.5" fill="#0b0b0b"/><rect x="2" y="9" width="1.5" height="1.5" fill="#0b0b0b"/><rect x="8" y="8" width="4" height="4" rx="0.5" stroke="#0b0b0b" stroke-width="0.8"/></svg></div></div>
      <div class="mode-switch"><div class="mode-switch__tab mode-switch__tab--active"><svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" fill="#f47920"/><path d="M3 17.5c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="#f47920" stroke-width="1.5" stroke-linecap="round"/></svg><span>Me</span></div><div class="mode-switch__tab mode-switch__tab--icon-only"><svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" fill="#999"/><circle cx="14" cy="7" r="2.5" fill="#999"/><path d="M1 17c0-3 2.5-5 6-5s6 2 6 5" stroke="#999" stroke-width="1.2" stroke-linecap="round"/><path d="M13 17c0-2.5 1.8-4 4-4s4 1.5 4 4" stroke="#999" stroke-width="1" stroke-linecap="round" opacity="0.6"/></svg></div></div>
      <div class="notification-btn"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2.5c-3.5 0-6 2.5-6 6v3.5l-1.5 2.5c-.3.5.1 1 .6 1h13.8c.5 0 .9-.5.6-1L18 12v-3.5c0-3.5-2.5-6-6-6z" stroke="#0b0b0b" stroke-width="1.5"/><path d="M9 18.5c.5 1.5 1.5 2.5 3 2.5s2.5-1 3-2.5" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round"/></svg><div class="notification-btn__dot"></div></div>
    </div>
    <div class="content">
      <div class="ticker-banner"><div class="ticker-banner__pill"><span class="ticker-banner__emoji">🎉</span><span class="ticker-banner__text">गर्मी को मात दो, स्विगी पर 50% छूट के साथ!</span></div></div>
      <div class="bank-card" id="bank-card"><div class="bank-card__info"><div class="bank-card__logo"><svg viewBox="0 0 18 18" fill="none"><path d="M9 1L1.5 5v1.5h15V5L9 1z" fill="#1a237e"/><rect x="3" y="8" width="2" height="6" fill="#1a237e"/><rect x="8" y="8" width="2" height="6" fill="#1a237e"/><rect x="13" y="8" width="2" height="6" fill="#1a237e"/><rect x="1" y="15" width="16" height="2" rx=".5" fill="#1a237e"/></svg></div><span class="bank-card__label">अपना बैंक खाता अभी जोड़ें</span></div><div class="bank-card__arrow"><svg viewBox="0 0 8 8" fill="none"><path d="M3 1l3 3-3 3" stroke="#4258a2" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>
      <div class="section" id="payments-section"><h2 class="section__title">भुगतान और ट्रांसफ़र</h2>
        <div class="icon-grid">
          <div class="icon-grid__item" id="send-to-mobile"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="10" height="18" rx="2" stroke="#1d264e" stroke-width="1.5"/><path d="M8 17h4" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/><path d="M17 6l3 3-3 3" stroke="#1d264e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 9h-5" stroke="#1d264e" stroke-width="1.5" stroke-linecap="round"/></svg></div><span class="icon-grid__label">मोबाइल पर भेजें</span></div>
          <div class="icon-grid__item" id="bank-upi-transfer"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><path d="M3 21h18" stroke="#1d264e" stroke-width="1.5" stroke-linecap="round"/><path d="M5 17V10M10 17V10M14 17V10M19 17V10" stroke="#1d264e" stroke-width="1.5"/><path d="M12 3L2 8h20L12 3z" stroke="#1d264e" stroke-width="1.5" stroke-linejoin="round"/></svg></div><span class="icon-grid__label">बैंक/UPI/खुद को भेजें</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="14" rx="2" stroke="#1d264e" stroke-width="1.5"/><path d="M7 11h4M7 14h2" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/><circle cx="17" cy="12" r="2" stroke="#1d264e" stroke-width="1.2"/></svg></div><span class="icon-grid__label">भुगतान की मंज़ूरी दें</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#1d264e" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="#1d264e" stroke-width="1.2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="icon-grid__label">यूपीआई सर्कल</span></div>
          <div class="icon-grid__separator"></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><path d="M4 4h16v16H4z" stroke="#1d264e" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 9h16" stroke="#1d264e" stroke-width="1.2"/><path d="M8 13h3M8 16h5" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="icon-grid__label">बिल और रिचार्ज</span></div>
          <div class="icon-grid__item" id="mobile-prepaid"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><rect x="6" y="2" width="12" height="20" rx="2" stroke="#1d264e" stroke-width="1.5"/><circle cx="12" cy="18" r="1" fill="#1d264e"/><path d="M10 5h4" stroke="#1d264e" stroke-width="1" stroke-linecap="round"/></svg></div><span class="icon-grid__label">मोबाइल प्रीपेड</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="14" height="10" rx="2" stroke="#1d264e" stroke-width="1.5"/><path d="M6 9h8M6 12h5" stroke="#1d264e" stroke-width="1" stroke-linecap="round"/><circle cx="18" cy="14" r="4" stroke="#1d264e" stroke-width="1.2"/><path d="M18 12.5v3l1.5-1" stroke="#1d264e" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="icon-grid__label">आईपीओ / ऑटोपे / सेवाएँ</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><path d="M3 20L7 4M10 20l4-16M17 20l4-16" stroke="#1d264e" stroke-width="1.5" stroke-linecap="round"/><path d="M2 8h20M1 14h20" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="icon-grid__label">खर्च का विश्लेषण</span></div>
        </div>
      </div>
      <div class="section" id="suggested-features"><h2 class="section__title">सुझाए गए फीचर्स</h2>
        <div class="features-row">
          <div class="feature-item"><div class="feature-item__icon"><span>📱</span></div><span class="feature-item__label">मोबाइल प्रीपेड</span></div>
          <div class="feature-item"><span class="feature-item__chip">POPULAR</span><div class="feature-item__icon"><span>🚗</span></div><span class="feature-item__label">FASTag</span></div>
          <div class="feature-item"><div class="feature-item__icon"><span>💡</span></div><span class="feature-item__label">बिजली</span></div>
          <div class="feature-item"><div class="feature-item__icon"><span>📡</span></div><span class="feature-item__label">डीटीएच</span></div>
          <div class="feature-item"><div class="feature-item__icon"><span>📲</span></div><span class="feature-item__label">मोबाइल पोस्टपेड</span></div>
        </div>
      </div>
      <div class="promo-cards"><div class="promo-card"><div class="promo-card__icon">🪙</div><span class="promo-card__text">कैशबैक और ऑफ़र</span></div><div class="promo-card"><div class="promo-card__icon">🎁</div><span class="promo-card__text">दोस्त को रेफ़र करें</span></div></div>
      <div class="ad-banner"><div class="ad-banner__content"><div class="ad-banner__title">It's Payday!</div><div class="ad-banner__subtitle">Treat yourself with a nice meal with <strong>Swiggy</strong></div><div class="ad-banner__cta">Claim your <strong>20% off</strong></div></div><div class="ad-banner__image">🍜</div></div>
      <div class="explore-section"><h2 class="explore-section__title">Explore more with BHIM</h2>
        <div class="explore-cards">
          <div class="explore-card"><div class="explore-card__icon">🎁</div><p class="explore-card__text">Show your love with a surprise gift, instantly delivered!</p><div class="explore-card__divider"></div><span class="explore-card__link">My Gifts <svg viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
          <div class="explore-card"><div class="explore-card__icon">📊</div><p class="explore-card__text" style="padding-top:4px"><span style="font-size:32px;font-weight:400">₹44,871</span><br><span style="font-size:12px;color:#e33838">↑ 7%</span> <span style="font-size:12px;color:#0b0b0b"> increase from last month</span></p><div class="explore-card__divider"></div><span class="explore-card__link">View Analytics <svg viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
          <div class="explore-card"><div class="explore-card__icon">🧾</div><p class="explore-card__text">Tired of keeping a track of your group expenses?</p><div class="explore-card__divider"></div><span class="explore-card__link">Split an Expense <svg viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
        </div>
      </div>
      <div style="height:30px"></div>
    </div>
    <div class="bottom-nav">
      <div class="bottom-nav__bg"><svg viewBox="0 0 390 108" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 28C0 28 120 28 155 28C165 28 172 12 180 4C186 -2 190 0 195 0C200 0 204 -2 210 4C218 12 225 28 235 28C270 28 390 28 390 28V108H0V28Z" fill="white"/><path d="M0 28C0 28 120 28 155 28C165 28 172 12 180 4C186 -2 190 0 195 0C200 0 204 -2 210 4C218 12 225 28 235 28C270 28 390 28 390 28" stroke="rgba(29,38,78,0.08)" stroke-width="1"/></svg></div>
      <div class="bottom-nav__items"><div class="bottom-nav__item"><svg viewBox="0 0 20 20" fill="none"><path d="M4 5l4.5-3.5a2 2 0 012.5 0L16 5" stroke="#687f8f" stroke-width="1.3" stroke-linecap="round"/><path d="M3 8h14" stroke="#687f8f" stroke-width="1.3"/><path d="M5 8v7h3.5v-4h3v4H15V8" stroke="#687f8f" stroke-width="1.3"/><path d="M2 17h16" stroke="#687f8f" stroke-width="1.3" stroke-linecap="round"/></svg><span class="bottom-nav__label">ऑफ़र</span></div><div style="width:72px"></div><div class="bottom-nav__item"><svg viewBox="0 0 18 18" fill="none"><path d="M2 5v8a2 2 0 002 2h10a2 2 0 002-2V5" stroke="#687f8f" stroke-width="1.3"/><path d="M5 2h8l3 3H2l3-3z" stroke="#687f8f" stroke-width="1.3" stroke-linejoin="round"/><path d="M7 8h4" stroke="#687f8f" stroke-width="1.3" stroke-linecap="round"/></svg><span class="bottom-nav__label">हिस्ट्री</span></div></div>
      <div class="scanner-fab"><div class="scanner-fab__outer" id="scanner-btn"><div class="scanner-fab__inner"><svg viewBox="0 0 28 28" fill="none"><rect x="2" y="2" width="9" height="9" rx="2" stroke="white" stroke-width="2"/><rect x="17" y="2" width="9" height="9" rx="2" stroke="white" stroke-width="2"/><rect x="2" y="17" width="9" height="9" rx="2" stroke="white" stroke-width="2"/><rect x="4.5" y="4.5" width="4" height="4" rx="1" fill="white"/><rect x="19.5" y="4.5" width="4" height="4" rx="1" fill="white"/><rect x="4.5" y="19.5" width="4" height="4" rx="1" fill="white"/><rect x="17" y="17" width="9" height="9" rx="1.5" stroke="white" stroke-width="1.5"/><rect x="20" y="20" width="3" height="3" rx=".5" fill="white"/></svg></div></div></div>
      <div class="home-indicator"></div>
    </div>
  </div>`;
}

// ─── Main Render ─────────────────────────────────────────────
function renderScreen(state) {
  clearTimers();
  if (activeDriver) {
    activeDriver.destroy();
    activeDriver = null;
  }

  // Reset input state for interactive screens
  if (state === S.LANG_SELECT) selectedLang = null;
  if (state === S.MOBILE_ENTRY) mobileInput = "";
  if (state === S.OTP_ENTRY) otpInput = "";
  if (state === S.SIM_SELECT) selectedSim = null;
  if (state === S.SECURITY_SELECT) selectedSecurity = null;
  if (state === S.PASSCODE_ENTRY) {
    passcodeEnter = "";
    passcodeConfirm = "";
  }

  phoneShell.innerHTML = getScreenHTML(state);
  currentState = state;
  handlePostRender(state);
}

function getScreenHTML(state) {
  switch (state) {
    case S.LANDING:
      return landingHTML();
    case S.SPLASH_1:
      return splash1HTML();
    case S.SPLASH_2:
      return splash2HTML();
    case S.GET_STARTED:
      return getStartedHTML();
    case S.LANG_SELECT:
      return langSelectHTML();
    case S.MOBILE_ENTRY:
      return mobileEntryHTML();
    case S.OTP_ENTRY:
      return otpEntryHTML();
    case S.SIM_SELECT:
      return simSelectHTML();
    case S.VERIFY_1:
      return verifyHTML(1);
    case S.VERIFY_2:
      return verifyHTML(2);
    case S.VERIFY_3:
      return verifyHTML(3);
    case S.SECURITY_SELECT:
      return securitySelectHTML();
    case S.PASSCODE_ENTRY:
      return passcodeEntryHTML();
    case S.LOADING_SPLASH:
      return loadingSplashHTML();
    case S.HOME:
      return homeScreenHTML();
    default:
      return landingHTML();
  }
}

function handlePostRender(state) {
  switch (state) {
    case S.SPLASH_1:
      wait(() => renderScreen(S.SPLASH_2), 1500);
      break;
    case S.SPLASH_2:
      wait(() => {
        if (!tooltipsSeen) {
          showTooltipStep(0);
        } else {
          renderScreen(S.GET_STARTED);
        }
      }, 2500);
      break;
    case S.VERIFY_1:
      // Auto-play verification animation (non-interactive loading)
      wait(() => {
        phoneShell.innerHTML = verifyHTML(2);
        currentState = S.VERIFY_2;
        wait(() => {
          phoneShell.innerHTML = verifyHTML(3);
          currentState = S.VERIFY_3;
          wait(() => renderScreen(S.SECURITY_SELECT), 1200);
        }, 1200);
      }, 1200);
      break;
    case S.LOADING_SPLASH:
      wait(() => renderScreen(S.HOME), 2500);
      break;
    case S.HOME:
      wait(() => startHomeTour(), 800);
      break;
  }
}

// ─── Input Handlers (Manual Flow) ────────────────────────────

function handleKeyPress(key) {
  switch (currentState) {
    case S.MOBILE_ENTRY:
      if (key === "DEL") mobileInput = mobileInput.slice(0, -1);
      else if (mobileInput.length < 10) mobileInput += key;
      updateMobileUI();
      break;
    case S.OTP_ENTRY:
      if (key === "DEL") otpInput = otpInput.slice(0, -1);
      else if (otpInput.length < 6) otpInput += key;
      updateOtpUI();
      break;
    case S.PASSCODE_ENTRY:
      if (key === "DEL") {
        if (passcodeConfirm.length > 0)
          passcodeConfirm = passcodeConfirm.slice(0, -1);
        else passcodeEnter = passcodeEnter.slice(0, -1);
      } else {
        if (passcodeEnter.length < 4) passcodeEnter += key;
        else if (passcodeConfirm.length < 4) passcodeConfirm += key;
      }
      updatePasscodeUI();
      break;
  }
}

function selectLanguage(idx) {
  selectedLang = idx;
  document.querySelectorAll(".lang-item").forEach((el, i) => {
    if (i === idx) {
      el.classList.add("lang-item--selected");
      el.querySelector(".lang-radio").className =
        "lang-radio lang-radio--checked";
    } else {
      el.classList.remove("lang-item--selected");
      el.querySelector(".lang-radio").className = "lang-radio";
    }
  });
  const btn = document.getElementById("lang-done-btn");
  if (btn) {
    btn.className = "ob-btn ob-btn--primary";
    btn.onclick = function () {
      renderScreen(S.MOBILE_ENTRY);
    };
  }
}

function selectSim(sim) {
  selectedSim = sim;
  ["airtel", "jio"].forEach((s) => {
    const card = document.getElementById("sim-card-" + s);
    const radio = document.getElementById("sim-radio-" + s);
    if (s === sim) {
      card.classList.add("sim-card--selected");
      radio.className = "lang-radio lang-radio--checked";
    } else {
      card.classList.remove("sim-card--selected");
      radio.className = "lang-radio";
    }
  });
  const btn = document.getElementById("sim-confirm-btn");
  if (btn) {
    btn.className = "ob-btn ob-btn--primary";
    btn.onclick = function () {
      renderScreen(S.VERIFY_1);
    };
  }
}

function selectSecurity(type) {
  selectedSecurity = type;
  ['device', 'passcode'].forEach(t => {
    const opt = document.getElementById('sec-opt-' + t);
    const radio = document.getElementById('sec-radio-' + t);
    if (t === type) {
      opt.classList.add('sec-option--selected');
      radio.className = 'lang-radio lang-radio--checked';
    } else {
      opt.classList.remove('sec-option--selected');
      radio.className = 'lang-radio';
    }
  });
  const btn = document.getElementById('sec-next-btn');
  if (btn) {
    btn.className = 'ob-btn ob-btn--primary';
    btn.onclick = function () {
      if (selectedSecurity === 'device') renderScreen(S.LOADING_SPLASH);
      else renderScreen(S.PASSCODE_ENTRY);
    };
  }
}

function goBack() {
  switch (currentState) {
    case S.LANG_SELECT:
      renderScreen(S.GET_STARTED);
      break;
    case S.MOBILE_ENTRY:
      renderScreen(S.LANG_SELECT);
      break;
    case S.OTP_ENTRY:
      renderScreen(S.MOBILE_ENTRY);
      break;
    case S.SIM_SELECT:
      renderScreen(S.OTP_ENTRY);
      break;
    case S.SECURITY_SELECT:
      renderScreen(S.SIM_SELECT);
      break;
    case S.PASSCODE_ENTRY:
      renderScreen(S.SECURITY_SELECT);
      break;
  }
}

// ─── DOM Update Helpers (no re-render, just patch) ───────────

function updateMobileUI() {
  const el = document.getElementById("mob-number");
  if (el) el.textContent = mobileInput;
  const btn = document.getElementById("mob-proceed-btn");
  if (!btn) return;
  if (mobileInput.length === 10) {
    btn.className = "ob-btn ob-btn--primary";
    btn.onclick = function () {
      renderScreen(S.OTP_ENTRY);
    };
  } else {
    btn.className = "ob-btn ob-btn--disabled";
    btn.onclick = null;
  }
}

function updateOtpUI() {
  for (let i = 0; i < 6; i++) {
    const box = document.getElementById("otp-box-" + i);
    if (!box) continue;
    if (i < otpInput.length) {
      box.textContent = otpInput[i];
      box.classList.add("otp-box--filled");
    } else {
      box.textContent = "";
      box.classList.remove("otp-box--filled");
    }
  }
  const btn = document.getElementById("otp-proceed-btn");
  if (!btn) return;
  if (otpInput.length === 6) {
    btn.className = "ob-btn ob-btn--primary";
    btn.onclick = function () {
      renderScreen(S.SIM_SELECT);
    };
  } else {
    btn.className = "ob-btn ob-btn--disabled";
    btn.onclick = null;
  }
}

function updatePasscodeUI() {
  for (let i = 0; i < 4; i++) {
    const eBox = document.getElementById("pass-e-" + i);
    if (eBox) {
      if (i < passcodeEnter.length) eBox.classList.remove("pass-box--empty");
      else eBox.classList.add("pass-box--empty");
    }
    const cBox = document.getElementById("pass-c-" + i);
    if (cBox) {
      if (i < passcodeConfirm.length) cBox.classList.remove("pass-box--empty");
      else cBox.classList.add("pass-box--empty");
    }
  }
  const btn = document.getElementById("pass-confirm-btn");
  if (!btn) return;
  if (passcodeEnter.length === 4 && passcodeConfirm.length === 4) {
    btn.className = "ob-btn ob-btn--primary";
    btn.textContent = "Confirm Passcode";
    btn.onclick = function () {
      renderScreen(S.LOADING_SPLASH);
    };
  } else {
    btn.className = "ob-btn ob-btn--disabled";
    btn.textContent = "Proceed";
    btn.onclick = null;
  }
}

// ─── Tooltip Tour System ─────────────────────────────────────

const TOOLTIP_DATA = [
  {
    element: "#gs-lang-section",
    text: "You can choose your preferred language in which you want to access the app",
    side: "top",
  },
  {
    element: "#lang-item-2",
    text: "You can choose other languages apart from Hindi and English from here",
    side: "bottom",
  },
  {
    element: "#mob-input-wrap",
    text: "You need to enter the mobile number linked with your bank account so that you can link and use your bank account for UPI Payments",
    side: "bottom",
  },
  {
    element: "#otp-boxes",
    text: "To ensure that your mobile number, linked with your bank account, is being used only by you, we will send an OTP on your number which will be auto fetched by your app.",
    side: "bottom",
  },
  {
    element: "#sim-cards",
    text: "In this step you need to confirm your SIM Card company and we will proceed with binding of your SIM and device with the app. This will ensure that no one else can use your UPI Account apart from yourself",
    side: "bottom",
  },
  {
    element: "#verify-steps",
    text: "Verifying and Binding your SIM in Progress",
    bullets: [
      "This happens automatically in real UPI apps",
      "User does not need to do anything here",
    ],
    side: "top",
  },
];

// Screens shown behind each tooltip (reusing interactive functions in preview mode)
const TOOLTIP_SCREENS = [
  () => getStartedHTML("preview"),
  () => langSelectHTML("preview"),
  () => mobileEntryHTML("preview"),
  () => otpEntryHTML("preview"),
  () => simSelectHTML("preview"),
  () => verifyHTML(3),
];

function showTooltipStep(idx) {
  clearTimers();
  if (activeDriver) {
    activeDriver.destroy();
    activeDriver = null;
  }

  currentTTIdx = idx;
  phoneShell.innerHTML = TOOLTIP_SCREENS[idx]();

  wait(() => {
    const tt = TOOLTIP_DATA[idx];
    const el = document.querySelector(tt.element);
    if (!el) return;

    let body = `<div class="tt-text">${tt.text}</div>`;
    if (tt.bullets) {
      body += '<ul class="tt-bullets">';
      tt.bullets.forEach((b) => {
        body += "<li>" + b + "</li>";
      });
      body += "</ul>";
    }
    // Dots
    body += '<div class="tt-dots">';
    for (let i = 0; i < TOOLTIP_DATA.length; i++) {
      body +=
        '<div class="tt-dot' + (i <= idx ? " tt-dot--active" : "") + '"></div>';
    }
    body += "</div>";
    // Buttons
    body +=
      '<div class="tt-buttons"><button class="tt-btn-skip" onclick="tooltipSkip()">Skip</button><button class="tt-btn-next" onclick="tooltipNext()">Next</button></div>';

    const dObj = window.driver.js.driver({
      showProgress: false,
      showButtons: [],
      overlayColor: "rgba(0,0,0,0.55)",
      stagePadding: 8,
      stageRadius: 12,
      animate: true,
      popoverClass: "ob-tooltip ob-tooltip-step-" + idx,
      allowClose: false,
    });
    dObj.highlight({
      element: tt.element,
      popover: { description: body, side: tt.side, align: "center" },
    });
    activeDriver = dObj;
  }, 300);
}

function tooltipNext() {
  if (currentTTIdx < TOOLTIP_DATA.length - 1) {
    showTooltipStep(currentTTIdx + 1);
  } else {
    endTooltipTour();
  }
}

function tooltipSkip() {
  endTooltipTour();
}

function endTooltipTour() {
  tooltipsSeen = true;
  currentTTIdx = -1;
  if (activeDriver) {
    activeDriver.destroy();
    activeDriver = null;
  }
  renderScreen(S.GET_STARTED);
}

// ─── Flow Control ────────────────────────────────────────────

function startOnboarding() {
  renderScreen(S.SPLASH_1);
}
function goHome() {
  renderScreen(S.HOME);
}

// ─── Home Screen Tour ────────────────────────────────────────
function startHomeTour() {
  const total = 4;
  function hf(si) {
    let d = "";
    for (let i = 0; i < total; i++)
      d +=
        '<div class="bhim-popover-dot' +
        (i === si ? " bhim-popover-dot--active" : "") +
        '"></div>';
    return (
      '<div class="bhim-popover-footer"><div class="bhim-popover-dots">' +
      d +
      '</div><div class="bhim-popover-buttons"><button class="bhim-btn-skip" onclick="window.bhimDriver.destroy()">Skip</button><button class="bhim-btn-next" onclick="window.bhimDriver.moveNext()">Next</button></div></div>'
    );
  }
  const steps = [
    {
      element: "#scanner-btn",
      popover: {
        title: "Scan & Pay",
        description:
          "Click on Scanner Icon to start the journey of Scan & pay." + hf(0),
        side: "top",
        align: "center",
        popoverClass: "bhim-driver-popover",
      },
    },
    {
      element: "#bank-card",
      popover: {
        title: "Link Your Bank",
        description:
          "Add your bank account to start making payments instantly." + hf(1),
        side: "bottom",
        align: "center",
        popoverClass: "bhim-driver-popover",
      },
    },
    {
      element: "#send-to-mobile",
      popover: {
        title: "Send to Mobile",
        description:
          "Send money to any mobile number using UPI. Fast and secure!" + hf(2),
        side: "bottom",
        align: "start",
        popoverClass: "bhim-driver-popover",
      },
    },
    {
      element: "#suggested-features",
      popover: {
        title: "Suggested Features",
        description:
          "Quick access to your most used services like Recharge, FASTag, and more." +
          hf(3),
        side: "top",
        align: "center",
        popoverClass: "bhim-driver-popover",
      },
    },
  ];
  const d = window.driver.js.driver({
    showProgress: false,
    showButtons: [],
    overlayColor: "rgba(0,0,0,0.65)",
    stagePadding: 10,
    stageRadius: 50,
    animate: true,
    smoothScroll: false,
    allowClose: true,
    popoverClass: "bhim-driver-popover",
    steps: steps,
    onDestroyStarted: () => {
      d.destroy();
    },
  });
  window.bhimDriver = d;
  d.drive();
}

// ─── Init ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  phoneShell = document.getElementById("phone-shell");
  renderScreen(S.LANDING);
});
