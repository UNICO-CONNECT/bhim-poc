/* =============================================================
   BHIM UPI – Onboarding Journey (State Machine)
   Vanilla JS · Driver.js Tooltips · SPA Pattern
   ============================================================= */

// ─── State Definitions ───────────────────────────────────────
const S = Object.freeze({
  LANDING:          'landing',
  SPLASH_1:         'splash_1',
  SPLASH_2:         'splash_2',
  GET_STARTED:      'get_started',
  LANG_DEFAULT:     'lang_default',
  LANG_SELECTED:    'lang_selected',
  MOBILE_EMPTY:     'mobile_empty',
  MOBILE_FILLED:    'mobile_filled',
  OTP_EMPTY:        'otp_empty',
  OTP_FILLED:       'otp_filled',
  SIM_DEFAULT:      'sim_default',
  SIM_SELECTED:     'sim_selected',
  VERIFY_1:         'verify_1',
  VERIFY_2:         'verify_2',
  VERIFY_3:         'verify_3',
  PASSCODE_EMPTY:   'passcode_empty',
  PASSCODE_FILLED:  'passcode_filled',
  LOADING_SPLASH:   'loading_splash',
  HOME:             'home',
});

// ─── Globals ─────────────────────────────────────────────────
let currentState  = null;
let phoneShell    = null;
let activeDriver  = null;
let timers        = [];

function clearTimers() {
  timers.forEach(t => clearTimeout(t));
  timers = [];
}
function delay(fn, ms) {
  const t = setTimeout(fn, ms);
  timers.push(t);
  return t;
}

// ─── Shared SVG Components ──────────────────────────────────

function statusBarSVG(dark) {
  const c = dark ? '#080a0b' : '#ffffff';
  return `
  <div class="ob-status-bar ob-status-bar--${dark ? 'dark' : 'light'}">
    <span class="ob-status-bar__time" style="color:${c}">9:41</span>
    <div class="ob-status-bar__icons">
      <svg viewBox="0 0 18 12" fill="none"><rect x="0" y="8" width="3" height="4" rx=".5" fill="${c}"/><rect x="5" y="5" width="3" height="7" rx=".5" fill="${c}"/><rect x="10" y="2" width="3" height="10" rx=".5" fill="${c}"/><rect x="15" y="0" width="3" height="12" rx=".5" fill="${c}"/></svg>
      <svg viewBox="0 0 16 12" fill="none"><path d="M8 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="${c}"/><path d="M4.5 7.5C5.5 6.2 6.7 5.5 8 5.5s2.5.7 3.5 2" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/><path d="M2 5c1.8-2 3.7-3 6-3s4.2 1 6 3" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/></svg>
      <svg viewBox="0 0 28 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="2" stroke="${c}" stroke-opacity=".35"/><rect x="2" y="2" width="20" height="9" rx="1" fill="${c}"/><path d="M25 4.5v4a2 2 0 000-4z" fill="${c}" fill-opacity=".4"/></svg>
    </div>
  </div>`;
}

function backArrowHTML() {
  return `<button class="ob-back-btn" aria-label="Back"><svg viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="#0b0b0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
}

function homeIndHTML() {
  return `<div class="ob-home-ind"><div class="ob-home-ind__bar"></div></div>`;
}

function upiLogoSVG(w, h) {
  w = w || 120; h = h || 50;
  return `<svg width="${w}" height="${h}" viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 80 Q10 20 40 20 L40 80 Q40 90 30 90 L20 90 Q10 90 10 80Z" fill="#555"/>
    <path d="M55 20 L55 60 Q55 80 75 80 Q95 80 95 60 L95 20" stroke="#555" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M110 20 L110 80" stroke="#555" stroke-width="12" stroke-linecap="round"/>
    <path d="M110 20 L140 20 Q160 20 160 40 Q160 60 140 60 L110 60" fill="none" stroke="#555" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M175 20 L175 80" stroke="#555" stroke-width="12" stroke-linecap="round"/>
    <polygon points="195,15 230,50 195,85" fill="url(#triG)"/>
    <defs><linearGradient id="triG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF9933"/><stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#138808"/>
    </linearGradient></defs>
    <text x="10" y="98" font-family="Figtree,sans-serif" font-size="11" fill="#999" letter-spacing="3.5" font-weight="500">UNIFIED PAYMENTS INTERFACE</text>
  </svg>`;
}

function sparkleSVG() {
  return `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 0L5.9 3.5H9.5L6.5 5.5L7.5 9L5 7L2.5 9L3.5 5.5L0.5 3.5H4.1L5 0Z" fill="#f4c77a" opacity=".6"/></svg>`;
}

function indianFlagSVG() {
  return `<svg width="28" height="20" viewBox="0 0 28 20"><rect width="28" height="7" fill="#FF9933"/><rect y="7" width="28" height="6" fill="#FFFFFF"/><rect y="13" width="28" height="7" fill="#138808"/><circle cx="14" cy="10" r="2.5" fill="none" stroke="#000080" stroke-width=".5"/></svg>`;
}

function numericKeyboardHTML() {
  const keys = [
    {d:'1'},{d:'2',s:'ABC'},{d:'3',s:'DEF'},
    {d:'4',s:'GHI'},{d:'5',s:'JKL'},{d:'6',s:'MNO'},
    {d:'7',s:'PQRS'},{d:'8',s:'TUV'},{d:'9',s:'WXYZ'},
    {d:'',empty:true},{d:'0'},{d:'⌫',del:true}
  ];
  let html = '<div class="ob-keyboard">';
  keys.forEach(k => {
    if (k.empty) { html += '<div class="ob-key ob-key--empty"></div>'; return; }
    const cls = k.del ? ' ob-key--del' : '';
    html += `<button class="ob-key${cls}">${k.d}${k.s ? '<span class="ob-key__sub">'+k.s+'</span>' : ''}</button>`;
  });
  html += '</div>';
  return html;
}

function checkCircleSVG(active) {
  if (active) return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><path d="M7 12l3 3 7-7" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#f0f0f0" stroke="#ddd" stroke-width="1.5"/><path d="M7 12l3 3 7-7" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ─── Screen Renderers ────────────────────────────────────────

function landingHTML() {
  return `
  <div class="screen screen-landing">
    <div class="landing-logo">${upiLogoSVG(140, 58)}</div>
    <div class="landing-buttons">
      <button class="ob-btn ob-btn--primary" onclick="startOnboarding()">
        <span>1.</span> Start Onboarding Flow
      </button>
      <button class="ob-btn ob-btn--primary" onclick="goHome()">
        <span>2.</span> Add Bank Account
      </button>
      <button class="ob-btn ob-btn--primary" onclick="goHome()">
        <span>3.</span> Scan and Pay
      </button>
      <button class="ob-btn ob-btn--primary" onclick="goHome()">
        <span>4.</span> Send to mobile
      </button>
      <button class="ob-btn ob-btn--primary" onclick="goHome()">
        <span>5.</span> Check Balance
      </button>
    </div>
  </div>`;
}

function splash1HTML() {
  return `
  <div class="screen screen-splash screen--no-anim">
    <div class="ob-tricolor"></div>
    <div class="ob-circle-deco"></div>
    <div class="ob-sparkle ob-sparkle--1">${sparkleSVG()}</div>
    <div class="ob-sparkle ob-sparkle--2">${sparkleSVG()}</div>
  </div>`;
}

function splash2HTML() {
  return `
  <div class="screen screen-splash">
    <div class="ob-tricolor"></div>
    <div class="ob-circle-deco"></div>
    <div class="ob-sparkle ob-sparkle--1">${sparkleSVG()}</div>
    <div class="ob-sparkle ob-sparkle--2">${sparkleSVG()}</div>
    <p class="splash-text">यूपीआई ऐप खोलें</p>
    <div class="splash-logo splash-logo--animate">${upiLogoSVG(180, 75)}</div>
  </div>`;
}

function getStartedHTML() {
  return `
  <div class="screen screen-get-started">
    <div class="gs-blue-bg"></div>
    ${statusBarSVG(false)}
    <div class="gs-header">
      <div style="margin-top:8px">${upiLogoSVG(80, 36)}</div>
      <div class="gs-tagline">India's most loved<br>UPI App!</div>
    </div>
    <div class="gs-body">
      <div class="gs-carousel">
        <div class="gs-carousel__icon">⭐</div>
        <div class="gs-carousel__text">Bring your family together<br>with BHIM's family mode</div>
      </div>
      <div class="gs-dots">
        <div class="gs-dot"></div>
        <div class="gs-dot gs-dot--active"></div>
        <div class="gs-dot"></div>
        <div class="gs-dot"></div>
      </div>
      <div id="gs-lang-section" class="gs-lang-section">
        <p class="gs-lang-title">Choose your preferred language</p>
        <div class="gs-lang-cards">
          <div class="gs-lang-card">
            <div class="gs-lang-card__text"><h3>हिंदी</h3><p>नमस्ते</p></div>
            <div class="gs-lang-card__radio"></div>
          </div>
          <div class="gs-lang-card">
            <div class="gs-lang-card__text"><h3>मराठी</h3><p>नमस्कार</p></div>
            <div class="gs-lang-card__radio"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="ob-bottom-bar">
      <div class="ob-bottom-bar__inner" style="padding-top:0">
        <button class="ob-btn ob-btn--tertiary" onclick="renderScreen(S.LANG_DEFAULT)">view all languages</button>
      </div>
      <div class="ob-bottom-bar__inner">
        <button class="ob-btn ob-btn--primary" onclick="renderScreen(S.LANG_DEFAULT)">Proceed</button>
      </div>
      ${homeIndHTML()}
    </div>
  </div>`;
}

function languageHTML(selected) {
  const langs = [
    { native: 'हिन्दी', eng: 'Hindi' },
    { native: 'मराठी', eng: 'Marathi' },
    { native: 'English', eng: '' },
    { native: 'বাংলা', eng: 'Bengali' },
    { native: 'தமிழ்', eng: 'Tamil' },
    { native: 'తెలుగు', eng: 'Telegu' },
    { native: 'ગુજરાતી', eng: 'Gujarati' },
  ];
  let list = '';
  langs.forEach((l, i) => {
    const isSel = selected && l.native === 'English';
    const cls   = isSel ? ' lang-item--selected' : '';
    const radio = isSel ? '<div class="lang-radio lang-radio--checked"></div>' : '<div class="lang-radio"></div>';
    const click = selected ? '' : `onclick="renderScreen(S.LANG_SELECTED)"`;
    list += `
      <div class="lang-item${cls}" id="lang-${i}" ${click}>
        <div class="lang-item__text">
          <h4>${l.native}</h4>
          ${l.eng ? '<p>'+l.eng+'</p>' : ''}
        </div>
        ${radio}
      </div>`;
  });
  const btnCls = selected ? 'ob-btn--primary' : 'ob-btn--disabled';
  const btnClick = selected ? `onclick="renderScreen(S.MOBILE_EMPTY)"` : '';
  return `
  <div class="screen screen-language">
    <div class="ob-tricolor"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header">
      ${backArrowHTML()}
      <span class="ob-page-title">Change language</span>
    </div>
    <div class="lang-search">
      <div class="lang-search__box">
        <svg class="lang-search__icon" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="#999" stroke-width="1.5"/><path d="M14 14l4 4" stroke="#999" stroke-width="1.5" stroke-linecap="round"/></svg>
        Search preferred language
        <svg class="lang-search__mic" viewBox="0 0 20 20" fill="none"><rect x="7" y="2" width="6" height="10" rx="3" stroke="#999" stroke-width="1.3"/><path d="M4 10c0 4 3 6 6 6s6-2 6-6" stroke="#999" stroke-width="1.3" stroke-linecap="round"/><path d="M10 16v3" stroke="#999" stroke-width="1.3" stroke-linecap="round"/></svg>
      </div>
    </div>
    <div class="lang-list" id="lang-list">
      ${list}
    </div>
    <div class="ob-bottom-bar">
      <div class="ob-bottom-bar__inner">
        <button class="ob-btn ${btnCls}" ${btnClick}>Done</button>
      </div>
      ${homeIndHTML()}
    </div>
  </div>`;
}

function mobileHTML(filled) {
  const val = filled ? '9999999999' : '';
  const btnCls = filled ? 'ob-btn--primary' : 'ob-btn--disabled';
  const btnClick = filled ? `onclick="renderScreen(S.OTP_EMPTY)"` : '';
  const btnText = 'Proceed';
  return `
  <div class="screen screen-mobile">
    <div class="ob-tricolor"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header">${backArrowHTML()}</div>
    <div class="mob-content">
      <h1 class="mob-title">Enter Your Mobile Number</h1>
      <p class="mob-subtitle">Please enter the mobile number linked to your bank account to continue using the UPI app.</p>
      <div class="mob-input-wrap" id="mob-input-wrap">
        <div class="mob-flag">${indianFlagSVG()}</div>
        <svg class="mob-dropdown" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="#999" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="mob-code">+91</span>
        <div class="mob-divider"></div>
        <span class="mob-number" id="mob-number">${val}</span>
      </div>
      <div class="mob-btn-area">
        <button class="ob-btn ${btnCls}" ${btnClick}>${btnText}</button>
      </div>
    </div>
    ${numericKeyboardHTML()}
    ${homeIndHTML()}
  </div>`;
}

function otpHTML(filled) {
  const digits = filled ? ['1','2','4','5','6','8'] : ['-','-','-','-','-','-'];
  let boxes = '';
  digits.forEach(d => {
    const cls = d !== '-' ? ' otp-box--filled' : '';
    boxes += `<div class="otp-box${cls}">${d !== '-' ? d : ''}</div>`;
  });
  const btnCls = filled ? 'ob-btn--primary' : 'ob-btn--disabled';
  const btnClick = filled ? `onclick="renderScreen(S.SIM_DEFAULT)"` : '';
  const btnText = 'Proceed';
  return `
  <div class="screen screen-otp">
    <div class="ob-tricolor"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header">${backArrowHTML()}</div>
    <div class="otp-content">
      <h1 class="otp-title">We are fetching your OTP sent on your number</h1>
      <div class="otp-number-row">
        <span class="otp-phone">+91 9999999999</span>
        <span class="otp-change">Change →</span>
      </div>
      <div class="otp-boxes" id="otp-boxes">${boxes}</div>
      <p class="otp-timer">Auto reading OTP 1:00</p>
      <div class="otp-btn-area">
        <button class="ob-btn ${btnCls}" ${btnClick}>${btnText}</button>
      </div>
    </div>
    ${numericKeyboardHTML()}
    ${homeIndHTML()}
  </div>`;
}

function simHTML(selected) {
  const airtelSel = selected ? ' sim-card--selected' : '';
  const radioA = selected
    ? '<div class="lang-radio lang-radio--checked"></div>'
    : '<div class="lang-radio"></div>';
  const radioJ = '<div class="lang-radio"></div>';
  const btnCls = selected ? 'ob-btn--primary' : 'ob-btn--disabled';
  const btnClick = selected ? `onclick="renderScreen(S.VERIFY_1)"` : '';
  const airtelClick = selected ? '' : `onclick="renderScreen(S.SIM_SELECTED)"`;
  return `
  <div class="screen screen-sim">
    <div class="ob-tricolor"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header">${backArrowHTML()}</div>
    <div class="sim-content">
      <h1 class="sim-title">Lets Verify your number</h1>
      <p class="sim-subtitle">Choose a SIM card registered to your bank account</p>
      <div class="sim-cards" id="sim-cards">
        <div class="sim-card${airtelSel}" ${airtelClick}>
          <div class="sim-card__logo" style="background:#fce4e4">
            <svg width="32" height="32" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#E40000"/><path d="M12 34 C16 18, 32 18, 36 34" stroke="white" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>
          </div>
          <div class="sim-card__bottom">
            <div><div class="sim-card__name">Airtel</div><div class="sim-card__slot">SIM 1</div></div>
            ${radioA}
          </div>
        </div>
        <div class="sim-card">
          <div class="sim-card__logo" style="background:#e4ebf8">
            <svg width="32" height="32" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#1A3F8E"/><text x="24" y="30" font-family="sans-serif" font-size="16" font-weight="700" fill="white" text-anchor="middle">Jio</text></svg>
          </div>
          <div class="sim-card__bottom">
            <div><div class="sim-card__name">Jio</div><div class="sim-card__slot">SIM 2</div></div>
            ${radioJ}
          </div>
        </div>
      </div>
      <div class="sim-info-box">
        <svg class="sim-info-box__icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8.5" stroke="#999" stroke-width="1.2"/><path d="M10 9v5" stroke="#999" stroke-width="1.3" stroke-linecap="round"/><circle cx="10" cy="6.5" r=".8" fill="#999"/></svg>
        <span class="sim-info-box__text">By selecting a SIM I agree to the Terms and Conditions. Regular carrier chargers may apply.</span>
      </div>
    </div>
    <div class="ob-bottom-bar">
      <div class="ob-bottom-bar__inner">
        <button class="ob-btn ${btnCls}" ${btnClick}>Confirm SIM</button>
      </div>
      ${homeIndHTML()}
    </div>
  </div>`;
}

function verifyHTML(step) {
  // step: 1, 2, or 3 (which steps are active)
  const steps = [
    { text: 'Verify Mobile Number', active: step >= 1 },
    { text: 'SMS sent from your mobile', active: step >= 2 },
    { text: 'Verification completed', active: step >= 3 },
  ];
  let stepsHTML = '';
  steps.forEach((s, i) => {
    const cls = s.active ? 'verify-step--active' : 'verify-step--pending';
    stepsHTML += `
      <div class="verify-step ${cls}">
        <div class="verify-step__circle">${checkCircleSVG(s.active)}</div>
        <span class="verify-step__text">${s.text}</span>
      </div>`;
    if (i < steps.length - 1) {
      const connCls = steps[i + 1].active ? ' verify-connector--active' : '';
      stepsHTML += `<div class="verify-connector${connCls}"></div>`;
    }
  });
  return `
  <div class="screen screen-verify screen--no-anim">
    ${statusBarSVG(true)}
    <div class="verify-overlay"></div>
    <div class="verify-sheet">
      <h2 class="verify-sheet__title">Verifying Your Number</h2>
      <div class="verify-steps" id="verify-steps">${stepsHTML}</div>
    </div>
    ${homeIndHTML()}
  </div>`;
}

function passcodeHTML(filled) {
  const boxFilled = filled
    ? '<div class="pass-box"><div class="pass-box__dot"></div></div>'
    : '<div class="pass-box pass-box--empty"><div class="pass-box__dot"></div></div>';
  const boxEmpty = '<div class="pass-box pass-box--empty"><div class="pass-box__dot"></div></div>';
  const boxes = filled
    ? (boxFilled.repeat(4))
    : (boxEmpty.repeat(4));
  const boxes2 = filled
    ? (boxFilled.repeat(4))
    : (boxEmpty.repeat(4));
  const btnCls = filled ? 'ob-btn--primary' : 'ob-btn--disabled';
  const btnClick = filled ? `onclick="renderScreen(S.LOADING_SPLASH)"` : '';
  const btnText = filled ? 'Confirm Passcode' : 'Proceed';
  return `
  <div class="screen screen-passcode">
    <div class="ob-tricolor"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header">${backArrowHTML()}</div>
    <div class="pass-content">
      <h1 class="pass-title">Register New Passcode</h1>
      <p class="pass-subtitle">Enter & confirm a new passcode below</p>
      <div class="pass-section">
        <p class="pass-label">Enter Passcode</p>
        <div class="pass-boxes">${boxes}</div>
      </div>
      <div class="pass-section">
        <p class="pass-label">Re-Enter Passcode</p>
        <div class="pass-boxes">${boxes2}</div>
      </div>
      <p class="pass-show">Show</p>
      <div class="pass-btn-area">
        <button class="ob-btn ${btnCls}" ${btnClick}>${btnText}</button>
      </div>
    </div>
    ${numericKeyboardHTML()}
    ${homeIndHTML()}
  </div>`;
}

function loadingSplashHTML() {
  return `
  <div class="screen screen-loading-splash">
    <div class="ob-tricolor"></div>
    ${statusBarSVG(true)}
    <div class="loading-content">
      ${upiLogoSVG(140, 58)}
      <p class="loading-text">Loading...</p>
    </div>
  </div>`;
}

// ─── Home Screen (from existing index.html) ──────────────────
function homeScreenHTML() {
  return `
  <div class="screen screen--no-anim" style="display:block">
    <!-- Status Bar -->
    <div class="status-bar">
      <span class="status-bar__time">9:41</span>
      <div class="status-bar__icons">
        <svg viewBox="0 0 18 12" fill="none"><rect x="0" y="8" width="3" height="4" rx="0.5" fill="#080a0b"/><rect x="5" y="5" width="3" height="7" rx="0.5" fill="#080a0b"/><rect x="10" y="2" width="3" height="10" rx="0.5" fill="#080a0b"/><rect x="15" y="0" width="3" height="12" rx="0.5" fill="#080a0b"/></svg>
        <svg viewBox="0 0 16 12" fill="none"><path d="M8 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="#080a0b"/><path d="M4.5 7.5C5.5 6.2 6.7 5.5 8 5.5s2.5.7 3.5 2" stroke="#080a0b" stroke-width="1.2" stroke-linecap="round"/><path d="M2 5c1.8-2 3.7-3 6-3s4.2 1 6 3" stroke="#080a0b" stroke-width="1.2" stroke-linecap="round"/></svg>
        <svg viewBox="0 0 28 13" fill="none"><rect x="0.5" y="0.5" width="23" height="12" rx="2" stroke="#080a0b" stroke-opacity="0.35"/><rect x="2" y="2" width="20" height="9" rx="1" fill="#080a0b"/><path d="M25 4.5v4a2 2 0 000-4z" fill="#080a0b" fill-opacity="0.4"/></svg>
      </div>
    </div>

    <!-- Header -->
    <div class="header">
      <div class="avatar">RS
        <div class="avatar__qr-badge"><svg viewBox="0 0 12 12" fill="none"><rect x="0" y="0" width="5" height="5" rx="1" stroke="#0b0b0b" stroke-width="1"/><rect x="7" y="0" width="5" height="5" rx="1" stroke="#0b0b0b" stroke-width="1"/><rect x="0" y="7" width="5" height="5" rx="1" stroke="#0b0b0b" stroke-width="1"/><rect x="2" y="2" width="1.5" height="1.5" fill="#0b0b0b"/><rect x="9" y="2" width="1.5" height="1.5" fill="#0b0b0b"/><rect x="2" y="9" width="1.5" height="1.5" fill="#0b0b0b"/><rect x="8" y="8" width="4" height="4" rx="0.5" stroke="#0b0b0b" stroke-width="0.8"/></svg></div>
      </div>
      <div class="mode-switch">
        <div class="mode-switch__tab mode-switch__tab--active">
          <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" fill="#f47920"/><path d="M3 17.5c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="#f47920" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span>Me</span>
        </div>
        <div class="mode-switch__tab mode-switch__tab--icon-only">
          <svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" fill="#999"/><circle cx="14" cy="7" r="2.5" fill="#999"/><path d="M1 17c0-3 2.5-5 6-5s6 2 6 5" stroke="#999" stroke-width="1.2" stroke-linecap="round"/><path d="M13 17c0-2.5 1.8-4 4-4s4 1.5 4 4" stroke="#999" stroke-width="1" stroke-linecap="round" opacity="0.6"/></svg>
        </div>
      </div>
      <div class="notification-btn">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2.5c-3.5 0-6 2.5-6 6v3.5l-1.5 2.5c-.3.5.1 1 .6 1h13.8c.5 0 .9-.5.6-1L18 12v-3.5c0-3.5-2.5-6-6-6z" stroke="#0b0b0b" stroke-width="1.5"/><path d="M9 18.5c.5 1.5 1.5 2.5 3 2.5s2.5-1 3-2.5" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round"/></svg>
        <div class="notification-btn__dot"></div>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="ticker-banner"><div class="ticker-banner__pill"><span class="ticker-banner__emoji">🎉</span><span class="ticker-banner__text">गर्मी को मात दो, स्विगी पर 50% छूट के साथ!</span></div></div>

      <div class="bank-card" id="bank-card">
        <div class="bank-card__info">
          <div class="bank-card__logo"><svg viewBox="0 0 18 18" fill="none"><path d="M9 1L1.5 5v1.5h15V5L9 1z" fill="#1a237e"/><rect x="3" y="8" width="2" height="6" fill="#1a237e"/><rect x="8" y="8" width="2" height="6" fill="#1a237e"/><rect x="13" y="8" width="2" height="6" fill="#1a237e"/><rect x="1" y="15" width="16" height="2" rx=".5" fill="#1a237e"/></svg></div>
          <span class="bank-card__label">अपना बैंक खाता अभी जोड़ें</span>
        </div>
        <div class="bank-card__arrow"><svg viewBox="0 0 8 8" fill="none"><path d="M3 1l3 3-3 3" stroke="#4258a2" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      </div>

      <div class="section" id="payments-section">
        <h2 class="section__title">भुगतान और ट्रांसफ़र</h2>
        <div class="icon-grid">
          <div class="icon-grid__item" id="send-to-mobile"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="10" height="18" rx="2" stroke="#1d264e" stroke-width="1.5"/><path d="M8 17h4" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/><path d="M17 6l3 3-3 3" stroke="#1d264e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 9h-5" stroke="#1d264e" stroke-width="1.5" stroke-linecap="round"/></svg></div><span class="icon-grid__label">मोबाइल पर भेजें</span></div>
          <div class="icon-grid__item" id="bank-upi-transfer"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><path d="M3 21h18" stroke="#1d264e" stroke-width="1.5" stroke-linecap="round"/><path d="M5 17V10" stroke="#1d264e" stroke-width="1.5"/><path d="M10 17V10" stroke="#1d264e" stroke-width="1.5"/><path d="M14 17V10" stroke="#1d264e" stroke-width="1.5"/><path d="M19 17V10" stroke="#1d264e" stroke-width="1.5"/><path d="M12 3L2 8h20L12 3z" stroke="#1d264e" stroke-width="1.5" stroke-linejoin="round"/></svg></div><span class="icon-grid__label">बैंक/UPI/खुद को भेजें</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="14" rx="2" stroke="#1d264e" stroke-width="1.5"/><path d="M7 11h4" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/><path d="M7 14h2" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/><circle cx="17" cy="12" r="2" stroke="#1d264e" stroke-width="1.2"/><path d="M12 21l5-5" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="icon-grid__label">भुगतान की मंज़ूरी दें</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#1d264e" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="#1d264e" stroke-width="1.2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="icon-grid__label">यूपीआई सर्कल</span></div>
          <div class="icon-grid__separator"></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><path d="M4 4h16v16H4z" stroke="#1d264e" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 9h16" stroke="#1d264e" stroke-width="1.2"/><path d="M8 13h3" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/><path d="M8 16h5" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="icon-grid__label">बिल और रिचार्ज</span></div>
          <div class="icon-grid__item" id="mobile-prepaid"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><rect x="6" y="2" width="12" height="20" rx="2" stroke="#1d264e" stroke-width="1.5"/><circle cx="12" cy="18" r="1" fill="#1d264e"/><path d="M10 5h4" stroke="#1d264e" stroke-width="1" stroke-linecap="round"/></svg></div><span class="icon-grid__label">मोबाइल प्रीपेड</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="14" height="10" rx="2" stroke="#1d264e" stroke-width="1.5"/><path d="M6 9h8M6 12h5" stroke="#1d264e" stroke-width="1" stroke-linecap="round"/><circle cx="18" cy="14" r="4" stroke="#1d264e" stroke-width="1.2"/><path d="M18 12.5v3l1.5-1" stroke="#1d264e" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="icon-grid__label">आईपीओ / ऑटोपे / सेवाएँ</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><svg viewBox="0 0 24 24" fill="none"><path d="M3 20L7 4" stroke="#1d264e" stroke-width="1.5" stroke-linecap="round"/><path d="M10 20l4-16" stroke="#1d264e" stroke-width="1.5" stroke-linecap="round"/><path d="M17 20l4-16" stroke="#1d264e" stroke-width="1.5" stroke-linecap="round"/><path d="M2 8h20" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/><path d="M1 14h20" stroke="#1d264e" stroke-width="1.2" stroke-linecap="round"/></svg></div><span class="icon-grid__label">खर्च का विश्लेषण</span></div>
        </div>
      </div>

      <div class="section" id="suggested-features">
        <h2 class="section__title">सुझाए गए फीचर्स</h2>
        <div class="features-row">
          <div class="feature-item"><div class="feature-item__icon"><span>📱</span></div><span class="feature-item__label">मोबाइल प्रीपेड</span></div>
          <div class="feature-item"><span class="feature-item__chip">POPULAR</span><div class="feature-item__icon"><span>🚗</span></div><span class="feature-item__label">FASTag</span></div>
          <div class="feature-item"><div class="feature-item__icon"><span>💡</span></div><span class="feature-item__label">बिजली</span></div>
          <div class="feature-item"><div class="feature-item__icon"><span>📡</span></div><span class="feature-item__label">डीटीएच</span></div>
          <div class="feature-item"><div class="feature-item__icon"><span>📲</span></div><span class="feature-item__label">मोबाइल पोस्टपेड</span></div>
        </div>
      </div>

      <div class="promo-cards">
        <div class="promo-card"><div class="promo-card__icon">🪙</div><span class="promo-card__text">कैशबैक और ऑफ़र</span></div>
        <div class="promo-card"><div class="promo-card__icon">🎁</div><span class="promo-card__text">दोस्त को रेफ़र करें</span></div>
      </div>

      <div class="ad-banner">
        <div class="ad-banner__content">
          <div class="ad-banner__title">It's Payday!</div>
          <div class="ad-banner__subtitle">Treat yourself with a nice meal with <strong>Swiggy</strong></div>
          <div class="ad-banner__cta">Claim your <strong>20% off</strong></div>
        </div>
        <div class="ad-banner__image">🍜</div>
      </div>

      <div class="explore-section">
        <h2 class="explore-section__title">Explore more with BHIM</h2>
        <div class="explore-cards">
          <div class="explore-card"><div class="explore-card__icon">🎁</div><p class="explore-card__text">Show your love with a surprise gift, instantly delivered!</p><div class="explore-card__divider"></div><span class="explore-card__link">My Gifts <svg viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
          <div class="explore-card"><div class="explore-card__icon">📊</div><p class="explore-card__text" style="padding-top:4px"><span style="font-size:32px;font-weight:400">₹44,871</span><br><span style="font-size:12px;color:#e33838">↑ 7%</span> <span style="font-size:12px;color:#0b0b0b"> increase from last month</span></p><div class="explore-card__divider"></div><span class="explore-card__link">View Analytics <svg viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
          <div class="explore-card"><div class="explore-card__icon">🧾</div><p class="explore-card__text">Tired of keeping a track of your group expenses?</p><div class="explore-card__divider"></div><span class="explore-card__link">Split an Expense <svg viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
        </div>
      </div>
      <div style="height:30px"></div>
    </div>

    <!-- Bottom Nav -->
    <div class="bottom-nav">
      <div class="bottom-nav__bg"><svg viewBox="0 0 390 108" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 28C0 28 120 28 155 28C165 28 172 12 180 4C186 -2 190 0 195 0C200 0 204 -2 210 4C218 12 225 28 235 28C270 28 390 28 390 28V108H0V28Z" fill="white"/><path d="M0 28C0 28 120 28 155 28C165 28 172 12 180 4C186 -2 190 0 195 0C200 0 204 -2 210 4C218 12 225 28 235 28C270 28 390 28 390 28" stroke="rgba(29,38,78,0.08)" stroke-width="1"/></svg></div>
      <div class="bottom-nav__items">
        <div class="bottom-nav__item"><svg viewBox="0 0 20 20" fill="none"><path d="M4 5l4.5-3.5a2 2 0 012.5 0L16 5" stroke="#687f8f" stroke-width="1.3" stroke-linecap="round"/><path d="M3 8h14" stroke="#687f8f" stroke-width="1.3"/><path d="M5 8v7h3.5v-4h3v4H15V8" stroke="#687f8f" stroke-width="1.3"/><path d="M2 17h16" stroke="#687f8f" stroke-width="1.3" stroke-linecap="round"/></svg><span class="bottom-nav__label">ऑफ़र</span></div>
        <div style="width:72px"></div>
        <div class="bottom-nav__item"><svg viewBox="0 0 18 18" fill="none"><path d="M2 5v8a2 2 0 002 2h10a2 2 0 002-2V5" stroke="#687f8f" stroke-width="1.3"/><path d="M5 2h8l3 3H2l3-3z" stroke="#687f8f" stroke-width="1.3" stroke-linejoin="round"/><path d="M7 8h4" stroke="#687f8f" stroke-width="1.3" stroke-linecap="round"/></svg><span class="bottom-nav__label">हिस्ट्री</span></div>
      </div>
      <div class="scanner-fab"><div class="scanner-fab__outer" id="scanner-btn"><div class="scanner-fab__inner"><svg viewBox="0 0 28 28" fill="none"><rect x="2" y="2" width="9" height="9" rx="2" stroke="white" stroke-width="2"/><rect x="17" y="2" width="9" height="9" rx="2" stroke="white" stroke-width="2"/><rect x="2" y="17" width="9" height="9" rx="2" stroke="white" stroke-width="2"/><rect x="4.5" y="4.5" width="4" height="4" rx="1" fill="white"/><rect x="19.5" y="4.5" width="4" height="4" rx="1" fill="white"/><rect x="4.5" y="19.5" width="4" height="4" rx="1" fill="white"/><rect x="17" y="17" width="9" height="9" rx="1.5" stroke="white" stroke-width="1.5"/><rect x="20" y="20" width="3" height="3" rx=".5" fill="white"/></svg></div></div></div>
      <div class="home-indicator"></div>
    </div>
  </div>`;
}

// ─── Main Render ─────────────────────────────────────────────
function renderScreen(state) {
  clearTimers();
  if (activeDriver) { activeDriver.destroy(); activeDriver = null; }

  const html = getScreenHTML(state);
  phoneShell.innerHTML = html;
  currentState = state;

  // Post-render actions
  handlePostRender(state);
}

function getScreenHTML(state) {
  switch (state) {
    case S.LANDING:          return landingHTML();
    case S.SPLASH_1:         return splash1HTML();
    case S.SPLASH_2:         return splash2HTML();
    case S.GET_STARTED:      return getStartedHTML();
    case S.LANG_DEFAULT:     return languageHTML(false);
    case S.LANG_SELECTED:    return languageHTML(true);
    case S.MOBILE_EMPTY:     return mobileHTML(false);
    case S.MOBILE_FILLED:    return mobileHTML(true);
    case S.OTP_EMPTY:        return otpHTML(false);
    case S.OTP_FILLED:       return otpHTML(true);
    case S.SIM_DEFAULT:      return simHTML(false);
    case S.SIM_SELECTED:     return simHTML(true);
    case S.VERIFY_1:         return verifyHTML(1);
    case S.VERIFY_2:         return verifyHTML(2);
    case S.VERIFY_3:         return verifyHTML(3);
    case S.PASSCODE_EMPTY:   return passcodeHTML(false);
    case S.PASSCODE_FILLED:  return passcodeHTML(true);
    case S.LOADING_SPLASH:   return loadingSplashHTML();
    case S.HOME:             return homeScreenHTML();
    default:                 return landingHTML();
  }
}

function handlePostRender(state) {
  switch (state) {
    case S.SPLASH_1:
      delay(() => renderScreen(S.SPLASH_2), 1500);
      break;
    case S.SPLASH_2:
      delay(() => renderScreen(S.GET_STARTED), 2500);
      break;
    case S.GET_STARTED:
      delay(() => showTooltip(0), 600);
      break;
    case S.LANG_DEFAULT:
      // If arriving from tooltip flow, auto-select English
      break;
    case S.LANG_SELECTED:
      delay(() => showTooltip(1), 400);
      break;
    case S.MOBILE_EMPTY:
      delay(() => showTooltip(2), 400);
      break;
    case S.OTP_EMPTY:
      delay(() => showTooltip(3), 400);
      break;
    case S.SIM_DEFAULT:
      delay(() => showTooltip(4), 400);
      break;
    case S.VERIFY_1:
      delay(() => showTooltip(5), 400);
      break;
    case S.LOADING_SPLASH:
      delay(() => renderScreen(S.HOME), 2500);
      break;
    case S.HOME:
      delay(() => startHomeTour(), 800);
      break;
  }
}

// ─── Tooltip System ──────────────────────────────────────────
const TOOLTIP_DATA = [
  {
    index: 0,
    element: '#gs-lang-section',
    text: 'You can choose your preferred language in which you want to access the app',
    side: 'top',
    screenState: S.GET_STARTED,
  },
  {
    index: 1,
    element: '#lang-2',
    text: 'You can choose other languages apart from Hindi and English from here',
    side: 'bottom',
    screenState: S.LANG_SELECTED,
  },
  {
    index: 2,
    element: '#mob-input-wrap',
    text: 'You need to enter the mobile number linked with your bank account so that you can link and use your bank account for UPI Payments',
    side: 'bottom',
    screenState: S.MOBILE_EMPTY,
  },
  {
    index: 3,
    element: '#otp-boxes',
    text: 'To ensure that your mobile number, linked with your bank account, is being used only by you, we will send an OTP on your number which will be auto fetched by your app.',
    side: 'bottom',
    screenState: S.OTP_EMPTY,
  },
  {
    index: 4,
    element: '#sim-cards',
    text: 'In this step you need to confirm your SIM Card company and we will proceed with binding of your SIM and device with the app. This will ensure that no one else can use your UPI Account apart from yourself',
    side: 'bottom',
    screenState: S.SIM_DEFAULT,
  },
  {
    index: 5,
    element: '#verify-steps',
    text: 'Verifying and Binding your SIM in Progress',
    bullets: [
      'This happens automatically in real UPI apps',
      'User does not need to do anything here'
    ],
    side: 'top',
    screenState: S.VERIFY_1,
  },
];

function buildTooltipDots(activeIdx, total) {
  let html = '<div class="tt-dots">';
  for (let i = 0; i < total; i++) {
    html += `<div class="tt-dot${i <= activeIdx ? ' tt-dot--active' : ''}"></div>`;
  }
  html += '</div>';
  return html;
}

function showTooltip(idx) {
  if (idx >= TOOLTIP_DATA.length) return;
  const tt = TOOLTIP_DATA[idx];
  const el = document.querySelector(tt.element);
  if (!el) return;

  if (activeDriver) { activeDriver.destroy(); activeDriver = null; }

  let bodyHTML = `<div class="tt-text">${tt.text}</div>`;
  if (tt.bullets) {
    bodyHTML += '<ul class="tt-bullets">';
    tt.bullets.forEach(b => { bodyHTML += `<li>${b}</li>`; });
    bodyHTML += '</ul>';
  }
  bodyHTML += buildTooltipDots(idx, TOOLTIP_DATA.length);
  bodyHTML += `
    <div class="tt-buttons">
      <button class="tt-btn-skip" onclick="skipToHome()">Skip</button>
      <button class="tt-btn-next" onclick="advanceFromTooltip(${idx})">Next</button>
    </div>`;

  const driverObj = window.driver.js.driver({
    showProgress: false,
    showButtons: [],
    overlayColor: 'rgba(0, 0, 0, 0.55)',
    stagePadding: 8,
    stageRadius: 12,
    animate: true,
    popoverClass: 'ob-tooltip',
    allowClose: false,
  });

  driverObj.highlight({
    element: tt.element,
    popover: {
      description: bodyHTML,
      side: tt.side,
      align: 'center',
    },
  });

  activeDriver = driverObj;
}

// ─── Flow Control ────────────────────────────────────────────

function startOnboarding() {
  renderScreen(S.SPLASH_1);
}

function goHome() {
  renderScreen(S.HOME);
}

function skipToHome() {
  if (activeDriver) { activeDriver.destroy(); activeDriver = null; }
  clearTimers();
  renderScreen(S.HOME);
}

function advanceFromTooltip(idx) {
  if (activeDriver) { activeDriver.destroy(); activeDriver = null; }

  switch (idx) {
    case 0: // From Get Started → Language selection
      renderScreen(S.LANG_DEFAULT);
      delay(() => renderScreen(S.LANG_SELECTED), 600);
      break;

    case 1: // From Language Selected → Mobile entry
      renderScreen(S.MOBILE_EMPTY);
      break;

    case 2: // From Mobile Empty → fill number → proceed
      renderScreen(S.MOBILE_FILLED);
      delay(() => renderScreen(S.OTP_EMPTY), 800);
      break;

    case 3: // From OTP → fill OTP → proceed
      renderScreen(S.OTP_FILLED);
      delay(() => renderScreen(S.SIM_DEFAULT), 800);
      break;

    case 4: // From SIM → select Airtel → confirm
      renderScreen(S.SIM_SELECTED);
      delay(() => renderScreen(S.VERIFY_1), 800);
      break;

    case 5: // From Verify → run animation → passcode
      runVerificationAnimation();
      break;
  }
}

function runVerificationAnimation() {
  // We are already on VERIFY_1 — do NOT re-render (avoids tooltip re-trigger).
  // Use a sequential chain so each step's clearTimers doesn't kill the next.
  clearTimers();

  delay(() => {
    phoneShell.innerHTML = verifyHTML(2);
    currentState = S.VERIFY_2;

    delay(() => {
      phoneShell.innerHTML = verifyHTML(3);
      currentState = S.VERIFY_3;

      delay(() => {
        renderScreen(S.PASSCODE_EMPTY);

        delay(() => {
          renderScreen(S.PASSCODE_FILLED);

          delay(() => {
            renderScreen(S.LOADING_SPLASH);
          }, 1000);
        }, 800);
      }, 1200);
    }, 1200);
  }, 1200);
}

// ─── Home Screen Tour ────────────────────────────────────────
function startHomeTour() {
  const totalSteps = 4;
  function buildHomeFooter(stepIndex) {
    let dotsHtml = '';
    for (let i = 0; i < totalSteps; i++) {
      const ac = i === stepIndex ? ' bhim-popover-dot--active' : '';
      dotsHtml += '<div class="bhim-popover-dot' + ac + '"></div>';
    }
    return '<div class="bhim-popover-footer"><div class="bhim-popover-dots">' + dotsHtml +
      '</div><div class="bhim-popover-buttons"><button class="bhim-btn-skip" onclick="window.bhimDriver.destroy()">Skip</button>' +
      '<button class="bhim-btn-next" onclick="window.bhimDriver.moveNext()">Next</button></div></div>';
  }

  const tourSteps = [
    {
      element: '#scanner-btn',
      popover: {
        title: 'Scan & Pay',
        description: 'Click on Scanner Icon to start the journey of Scan & pay.' + buildHomeFooter(0),
        side: 'top', align: 'center',
        popoverClass: 'bhim-driver-popover',
      },
    },
    {
      element: '#bank-card',
      popover: {
        title: 'Link Your Bank',
        description: 'Add your bank account to start making payments instantly.' + buildHomeFooter(1),
        side: 'bottom', align: 'center',
        popoverClass: 'bhim-driver-popover',
      },
    },
    {
      element: '#send-to-mobile',
      popover: {
        title: 'Send to Mobile',
        description: 'Send money to any mobile number using UPI. Fast and secure!' + buildHomeFooter(2),
        side: 'bottom', align: 'start',
        popoverClass: 'bhim-driver-popover',
      },
    },
    {
      element: '#suggested-features',
      popover: {
        title: 'Suggested Features',
        description: 'Quick access to your most used services like Recharge, FASTag, and more.' + buildHomeFooter(3),
        side: 'top', align: 'center',
        popoverClass: 'bhim-driver-popover',
      },
    },
  ];

  const driverObj = window.driver.js.driver({
    showProgress: false,
    showButtons: [],
    overlayColor: 'rgba(0, 0, 0, 0.65)',
    stagePadding: 10,
    stageRadius: 50,
    animate: true,
    smoothScroll: false,
    allowClose: true,
    popoverClass: 'bhim-driver-popover',
    steps: tourSteps,
    onDestroyStarted: () => { driverObj.destroy(); },
  });

  window.bhimDriver = driverObj;
  driverObj.drive();
}

// ─── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  phoneShell = document.getElementById('phone-shell');
  renderScreen(S.LANDING);
});
