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
  // Add Bank Account flow
  ADD_BANK_SELECT: "add_bank_select",
  ADD_BANK_METHOD_SELECT: "add_bank_method_select",
  ADD_BANK_DEBIT_CARD: "add_bank_debit_card",
  ADD_BANK_OTP: "add_bank_otp",
  ADD_BANK_SET_PIN: "add_bank_set_pin",
  ADD_BANK_CONFIRM_PIN: "add_bank_confirm_pin",
  ADD_BANK_SUCCESS: "add_bank_success",
  ADD_BANK_PAYMENT_METHODS: "add_bank_payment_methods",
  // Aadhaar flow
  ADD_BANK_AADHAAR_CONSENT: "add_bank_aadhaar_consent",
  ADD_BANK_AADHAAR_NUMBER: "add_bank_aadhaar_number",
  ADD_BANK_AADHAAR_OTP: "add_bank_aadhaar_otp",
  // Check Balance flow (from home)
  CHECK_BALANCE_PIN: "check_balance_pin",
  // Scan and Pay flow
  SCAN_1: "scan_1",
  SCAN_2: "scan_2",
  ENTER_AMOUNT: "enter_amount",
  SELECT_ACCOUNT_TO_PAY: "select_account_to_pay",
  ENTER_UPI_PIN: "enter_upi_pin",
  PAYMENT_SUCCESS: "payment_success",
  DEBITED_TRANSACTION: "debited_transaction",
  // Send to Mobile flow
  SEND_MOBILE_CONTACTS: "send_mobile_contacts",
  SEND_MOBILE_CHAT: "send_mobile_chat",
  SEND_MOBILE_REVIEW: "send_mobile_review",
  SEND_MOBILE_PIN: "send_mobile_pin",
  SEND_MOBILE_SUCCESS: "send_mobile_success",
  SEND_MOBILE_RECEIPT: "send_mobile_receipt",
});

// ─── Globals ─────────────────────────────────────────────────
let currentState = null;
let phoneShell = null;
let activeDriver = null;
let timers = [];
let skipHomeTour = false;

// Tooltip guide state (non-linear, per-screen)
const tooltipGuide = {
  enabled: true,        // master switch – false after Skip
  shownForScreen: {},   // tracks which screens already showed a tooltip this session
};

// Interactive input state (manual flow)
let selectedLang = null;
let mobileInput = "";
let otpInput = "";
let passcodeEnter = "";
let passcodeConfirm = "";

// Add Bank Account flow state
let addBankCardDigits = "";
let addBankExpiry = "";
let addBankOtp = "";
let addBankPin = "";
let addBankConfirmPin = "";
let addBankSelectedAccount = 0; // default first account
let addBankInputFocus = "card"; // "card" | "expiry"
let addBankMethod = "debit"; // "debit" | "aadhaar"
let addBankAadhaarNumber = "";
let addBankAadhaarOtp = "";
// Check Balance flow
let selectedSim = null;
let selectedSecurity = null; // 'device' or 'passcode'
// Check Balance flow
let checkBalancePinInput = "";
let checkBalancePinMasked = true;
// Scan and Pay flow
let scanPayAmount = "";
let scanPayUpiPin = "";
let scanPayPinMasked = true;
let scanPayPayee = { name: "Rohan Rajput", upi: "rohan.rajput@upi" };
let scanPayNote = "";
// Send to Mobile flow
let smSelectedContactId = null;
let smContactSearch = "";
let smChatAmount = "";
let smReviewNote = "";
let smPinInput = "";
let balanceRevealed = false;

const sendMobileContacts = [
  { id: "c1", name: "Rohan Rajput", mobile: "9876543210", upi: "rohan.rajput@upi", avatar: "RR", color: "#75c5b1", recent: true },
  { id: "c2", name: "Aishwarya Subramaniam", mobile: "9043028745", upi: "aishwarya.s@upi", avatar: "AS", color: "#75c5b1", recent: true },
  { id: "c3", name: "Rakesh Sharma", mobile: "9923012345", upi: "rakesh.sharma@upi", avatar: "RS", color: "#f9e88f", recent: true },
  { id: "c4", name: "Akriti Gupta", mobile: "9811122233", upi: "akriti.g@upi", avatar: "A", color: "#efb2b5", recent: true },
  { id: "c5", name: "Analese Sriraman", mobile: "9898989898", upi: "analese.s@upi", avatar: "AS", color: "#75c5b1", recent: true },
  { id: "c6", name: "Vikram Sharma", mobile: "9765432100", upi: "vikram.sharma@upi", avatar: "VS", color: "#f9e88f", recent: true },
  { id: "c7", name: "Richa Jain", mobile: "9043028745", upi: "richa.jain@upi", avatar: "RS", color: "#f9e88f", recent: false },
  { id: "c8", name: "Hemal Thakkar", mobile: "9043028745", upi: "hemal.thakkar@upi", avatar: "HT", color: "#75c5b1", recent: false },
];

// ─── i18n – Internationalisation helpers ─────────────────────
let currentLang = "en"; // "en" | "hi"

const i18n = {
  en: {
    // Home – Payments & Transfers
    "home.payments_title":    "Payments & Transfers",
    "home.send_mobile":       "Send to mobile",
    "home.send_bank":         "Send to bank/ UPI/Self",
    "home.approve_pay":       "Approve to pay",
    "home.upi_circle":        "UPI circle",
    "home.bills_recharges":   "Bills & recharges",
    "home.mobile_prepaid":    "Mobile prepaid",
    "home.ipo_autopay":       "IPO/Autopay/ Services",
    "home.spend_analytics":   "Spend Analytics",
    // Home – Suggested features
    "home.suggested_features":"Recommended features",
    "home.mobile_prepaid_f":  "Mobile prepaid",
    "home.electricity":       "Electricity",
    "home.dth":               "DTH",
    "home.mobile_postpaid":   "Mobile postpaid",
    // Home – Promo cards
    "home.cashback_offers":   "Cashback & Offers",
    "home.refer_friend":      "Refer a friend",
    // Home – Bottom nav
    "home.offers":            "Offers",
    "home.history":           "History",
    // Tooltip
    "home.welcome_tooltip":   "Welcome to UPI Pay",
  },
  hi: {
    "home.payments_title":    "भुगतान और ट्रांसफ़र",
    "home.send_mobile":       "मोबाइल पर भेजें",
    "home.send_bank":         "बैंक/UPI/खुद को भेजें",
    "home.approve_pay":       "भुगतान की मंज़ूरी दें",
    "home.upi_circle":        "यूपीआई सर्कल",
    "home.bills_recharges":   "बिल और रिचार्ज",
    "home.mobile_prepaid":    "मोबाइल प्रीपेड",
    "home.ipo_autopay":       "आईपीओ / ऑटोपे / सेवाएँ",
    "home.spend_analytics":   "खर्च का विश्लेषण",
    "home.suggested_features":"सुझाए गए फीचर्स",
    "home.mobile_prepaid_f":  "मोबाइल प्रीपेड",
    "home.electricity":       "बिजली",
    "home.dth":               "डीटीएच",
    "home.mobile_postpaid":   "मोबाइल पोस्टपेड",
    "home.cashback_offers":   "कैशबैक और ऑफ़र",
    "home.refer_friend":      "दोस्त को रेफ़र करें",
    "home.offers":            "ऑफ़र",
    "home.history":           "हिस्ट्री",
    "home.welcome_tooltip":   "यूपीआई पे में आपका स्वागत है",
  },
};

/** Translate helper – returns the string for the current language, falls back to English then the key itself. */
function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n.en[key] || key;
}

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
      <button class="ob-btn ob-btn--primary" onclick="startAddBankFlow()"><span>2.</span> Add Bank Account</button>
      <button class="ob-btn ob-btn--primary" onclick="startCheckBalanceFlow()"><span>3.</span> Check Balance</button>
      <button class="ob-btn ob-btn--primary" onclick="startSendToMobileFlow()"><span>4.</span> Send to Mobile</button>
      <button class="ob-btn ob-btn--primary" onclick="startScanAndPayFlow()"><span>5.</span> Scan and Pay</button>
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
  const langSectionId = ' id="gs-lang-section"';
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
          ${[["हिंदी", "नमस्ते"], ["मराठी", "नमस्कार"]].map(([name, greet], i) => {
            const sel = selectedLang === i;
            const cardCls = "gs-lang-card" + (sel ? " gs-lang-card--selected" : "");
            const radioCls = "gs-lang-card__radio" + (sel ? " gs-lang-card__radio--checked" : "");
            const onClick = isPreview ? "" : ` onclick="selectGetStartedLanguage(${i})"`;
            return `<div class="${cardCls}" id="gs-lang-card-${i}"${onClick}><div class="gs-lang-card__text"><h3>${name}</h3><p>${greet}</p></div><div class="${radioCls}"></div></div>`;
          }).join("")}
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
  const wrapId = ' id="mob-input-wrap"';
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
  const cardsId = ' id="sim-cards"';
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
    <div class="verify-sheet"><h2 class="verify-sheet__title">Verifying Your Number</h2><div class="verify-steps" id="verify-steps">${sh}</div></div>${homeIndHTML()}
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.9396 12C16.9448 15.0305 16.3542 18.0324 15.2015 20.835C15.1455 20.9733 15.0497 21.0917 14.9261 21.1752C14.8025 21.2587 14.6568 21.3035 14.5077 21.3038C14.4113 21.3028 14.3158 21.2838 14.2265 21.2475C14.1352 21.2101 14.0523 21.155 13.9824 21.0855C13.9124 21.016 13.8569 20.9334 13.8189 20.8424C13.781 20.7514 13.7613 20.6538 13.7611 20.5552C13.7609 20.4566 13.7801 20.359 13.8177 20.2678C14.8952 17.6449 15.4462 14.8356 15.4396 12C15.4396 11.8011 15.5186 11.6103 15.6593 11.4697C15.7999 11.329 15.9907 11.25 16.1896 11.25C16.3885 11.25 16.5793 11.329 16.7199 11.4697C16.8606 11.6103 16.9396 11.8011 16.9396 12ZM11.6896 8.25001C12.217 8.25038 12.7385 8.36185 13.22 8.57717C13.7016 8.79249 14.1323 9.10682 14.4843 9.49969C14.5494 9.57487 14.6289 9.63633 14.7181 9.6805C14.8072 9.72466 14.9043 9.75064 15.0036 9.75692C15.1029 9.76321 15.2024 9.74968 15.2964 9.71711C15.3905 9.68455 15.4771 9.6336 15.5512 9.56724C15.6253 9.50088 15.6855 9.42044 15.7283 9.33059C15.771 9.24074 15.7954 9.14329 15.8001 9.04391C15.8048 8.94452 15.7897 8.8452 15.7557 8.75171C15.7216 8.65823 15.6693 8.57245 15.6018 8.49938C14.8928 7.70718 13.9601 7.14887 12.9269 6.89832C11.8938 6.64776 10.8089 6.71676 9.81581 7.09619C8.82272 7.47562 7.96823 8.1476 7.36536 9.02324C6.76249 9.89888 6.43967 10.9369 6.43958 12C6.43948 14.1596 5.8911 16.2837 4.84583 18.1734C4.79806 18.2596 4.76774 18.3544 4.75658 18.4523C4.74543 18.5502 4.75367 18.6493 4.78083 18.744C4.80799 18.8387 4.85354 18.9272 4.91488 19.0043C4.97622 19.0814 5.05215 19.1457 5.13833 19.1934C5.22451 19.2412 5.31926 19.2715 5.41716 19.2827C5.51506 19.2938 5.61419 19.2856 5.70891 19.2584C5.80363 19.2313 5.89206 19.1857 5.96918 19.1244C6.04629 19.0631 6.11056 18.9871 6.15833 18.9009C7.32649 16.7884 7.93938 14.414 7.93958 12C7.93958 11.0054 8.33467 10.0516 9.03793 9.34836C9.74119 8.6451 10.695 8.25001 11.6896 8.25001ZM11.6896 2.25001C10.5825 2.24867 9.48322 2.43637 8.43927 2.80501C8.25508 2.87387 8.1053 3.01232 8.02219 3.19055C7.93909 3.36877 7.9293 3.5725 7.99494 3.75786C8.06058 3.94323 8.1964 4.0954 8.37314 4.18161C8.54988 4.26781 8.75341 4.28115 8.93989 4.21876C10.1845 3.77991 11.5161 3.64586 12.8232 3.82785C14.1303 4.00983 15.3747 4.50256 16.4521 5.2647C17.5295 6.02684 18.4084 7.03618 19.0152 8.20809C19.622 9.38 19.939 10.6803 19.9396 12C19.9405 13.9628 19.7223 15.9197 19.289 17.8341C19.2449 18.0276 19.2794 18.2307 19.3848 18.3989C19.4903 18.5671 19.6581 18.6866 19.8515 18.7313C19.9062 18.7439 19.9622 18.7502 20.0183 18.75C20.1884 18.75 20.3534 18.6921 20.4862 18.586C20.6191 18.4799 20.712 18.3318 20.7496 18.1659C21.2077 16.1426 21.4391 14.0746 21.4396 12C21.4369 9.41498 20.4087 6.93662 18.5809 5.10873C16.753 3.28084 14.2746 2.25274 11.6896 2.25001ZM6.19021 5.85188C6.26364 5.7862 6.32343 5.7067 6.36614 5.61791C6.40885 5.52913 6.43366 5.4328 6.43914 5.33443C6.44463 5.23605 6.43068 5.13757 6.3981 5.04458C6.36552 4.9516 6.31495 4.86594 6.24927 4.79251C6.18359 4.71907 6.10408 4.65929 6.0153 4.61658C5.92651 4.57386 5.83019 4.54906 5.73181 4.54357C5.63344 4.53809 5.53495 4.55203 5.44197 4.58461C5.34899 4.61719 5.26333 4.66776 5.18989 4.73344C4.16818 5.64847 3.35069 6.76847 2.79067 8.02049C2.23065 9.2725 1.94066 10.6285 1.93958 12C1.94168 13.1865 1.68577 14.3592 1.18958 15.4369C1.14846 15.5264 1.12537 15.6231 1.12163 15.7215C1.1179 15.82 1.13358 15.9182 1.16779 16.0105C1.23689 16.1971 1.37726 16.3485 1.55802 16.4316C1.73878 16.5146 1.94513 16.5225 2.13167 16.4534C2.31821 16.3843 2.46966 16.2439 2.55271 16.0631C3.13945 14.7891 3.44207 13.4027 3.43958 12C3.44057 10.8395 3.68603 9.69224 4.15996 8.63293C4.63389 7.57362 5.32565 6.62603 6.19021 5.85188ZM10.3696 18.8194C10.2801 18.7783 10.1834 18.7552 10.0849 18.7514C9.98649 18.7477 9.88829 18.7634 9.79592 18.7976C9.70356 18.8318 9.61883 18.8839 9.54659 18.9508C9.47435 19.0178 9.41601 19.0983 9.37489 19.1878C9.19489 19.5816 8.99989 19.9744 8.78521 20.3541C8.73725 20.4403 8.70677 20.5351 8.69552 20.6331C8.68427 20.7311 8.69246 20.8304 8.71963 20.9252C8.7468 21.0201 8.79242 21.1086 8.85386 21.1858C8.91531 21.263 8.99137 21.3273 9.07771 21.375C9.18858 21.4369 9.31353 21.4692 9.44052 21.4688C9.57443 21.4688 9.70591 21.433 9.82131 21.3651C9.93671 21.2972 10.0318 21.1996 10.0968 21.0825C10.3255 20.6691 10.5411 20.2388 10.738 19.815C10.7793 19.7255 10.8025 19.6286 10.8063 19.5301C10.8101 19.4316 10.7945 19.3333 10.7603 19.2408C10.726 19.1483 10.6739 19.0635 10.6069 18.9912C10.5398 18.9189 10.4592 18.8605 10.3696 18.8194ZM11.6896 11.25C11.4907 11.25 11.2999 11.329 11.1593 11.4697C11.0186 11.6103 10.9396 11.8011 10.9396 12C10.9401 13.4546 10.7578 14.9034 10.3968 16.3125C10.3472 16.5051 10.3762 16.7094 10.4773 16.8807C10.5783 17.0519 10.7433 17.176 10.9358 17.2256C10.9971 17.2412 11.0601 17.2491 11.1233 17.2491C11.2895 17.2489 11.4509 17.1936 11.5823 17.0918C11.7136 16.99 11.8074 16.8475 11.849 16.6866C12.242 15.1551 12.4405 13.5802 12.4396 11.9991C12.4393 11.8003 12.3602 11.6098 12.2196 11.4693C12.079 11.3289 11.8883 11.25 11.6896 11.25Z" fill="white"/>
</svg>
              </div>
              <div class="lang-radio" id="sec-radio-device"></div>
            </div>
            <div class="sec-card__body">
              <h3 class="sec-card__name">Use your device lock</h3>
              <p class="sec-card__desc">Use your existing pattern, PIN, Face ID, or Fingerprint to unlock</p>
            </div>
          </div>
          <div class="sec-footer sec-footer--blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M1.16325 0.873142C0.857801 1.01755 0.729785 1.36814 0.873065 1.66795C0.955601 1.84068 22.1797 23.0611 22.3432 23.1345C22.5604 23.2318 22.859 23.1729 23.0198 23.001C23.1796 22.8301 23.2276 22.5534 23.1338 22.344C23.0956 22.2587 21.7995 20.9499 16.9854 16.1351C12.9867 12.1356 10.8975 10.03 10.9204 10.0219C10.9396 10.0152 11.1208 9.99847 11.3232 9.98481C12.6296 9.89654 13.897 10.0587 15.1552 10.475C16.6196 10.9595 17.8299 11.6843 18.9547 12.7504C19.1047 12.8925 19.2616 13.0274 19.3033 13.0501C19.4069 13.1063 19.7341 13.1073 19.8352 13.0517C20.1193 12.8954 20.2443 12.5461 20.118 12.2613C20.047 12.1013 19.5111 11.5906 18.9592 11.1573C17.6368 10.119 16.0526 9.37421 14.3992 9.01358C13.0019 8.70878 11.5273 8.67732 10.0604 8.92097L9.81345 8.96198L8.57836 7.72706C7.89904 7.04784 7.34325 6.48578 7.34325 6.47805C7.34325 6.46308 7.75941 6.33077 8.1809 6.21173C9.001 5.9801 9.97051 5.81078 10.9192 5.73353C11.3676 5.69702 12.6307 5.69702 13.0792 5.73353C15.2621 5.91117 17.218 6.51247 19.1392 7.59653C20.1262 8.1534 21.0044 8.81333 21.9898 9.73853C22.2856 10.0162 22.3964 10.08 22.5832 10.08C22.9052 10.08 23.1836 9.80203 23.183 9.48125C23.1826 9.26057 23.1123 9.14772 22.7702 8.81918C20.3615 6.50585 17.2251 5.01194 13.9312 4.60913C13.2294 4.52328 12.8376 4.50146 11.9992 4.50146C10.9388 4.50146 10.2233 4.56069 9.28636 4.72608C8.37038 4.88777 7.20283 5.20757 6.5291 5.48131L6.38932 5.53812L4.0883 3.2346C2.23859 1.3829 1.76371 0.919846 1.66725 0.873742C1.50662 0.797014 1.32477 0.796798 1.16325 0.873142ZM3.22307 7.27531C3.0791 7.30049 3.02027 7.3361 2.64859 7.62324C1.73332 8.33033 0.968345 9.02121 0.871769 9.22795C0.650897 9.7008 1.10707 10.2101 1.60372 10.0451C1.69943 10.0133 1.78216 9.95215 1.97627 9.76963C2.31602 9.45017 2.69846 9.12158 3.08894 8.81359C3.72477 8.31206 3.77805 8.26711 3.83243 8.18633C4.0108 7.92122 3.93352 7.55407 3.65894 7.36217C3.54875 7.28515 3.37029 7.24961 3.22307 7.27531ZM6.30347 10.3293C5.84742 10.4992 4.12814 11.8522 3.92263 12.2029C3.84832 12.3296 3.82274 12.5224 3.86126 12.6649C3.92755 12.9102 4.1817 13.1042 4.43599 13.1036C4.63859 13.1032 4.75391 13.0337 5.13914 12.6801C5.64417 12.2165 6.18503 11.7951 6.61554 11.5298C6.90635 11.3507 6.95334 11.3088 7.02251 11.1674C7.21288 10.7783 6.95994 10.3363 6.52898 10.3049C6.4485 10.299 6.3587 10.3087 6.30347 10.3293ZM9.66055 13.408C9.57398 13.4326 9.1294 13.6479 8.94962 13.7523C8.31076 14.1231 7.55985 14.7388 7.43702 14.9926C7.33442 15.2045 7.37327 15.4788 7.5305 15.6528C7.69538 15.8353 7.91018 15.8979 8.14123 15.8307C8.24947 15.7993 8.31436 15.7553 8.48687 15.5967C8.96286 15.1589 9.33664 14.8991 9.85168 14.6478C10.2242 14.4661 10.3404 14.3695 10.4013 14.1908C10.4981 13.9067 10.3995 13.635 10.1394 13.4691C10.0644 13.4213 10.0071 13.4065 9.87542 13.4014C9.78292 13.3977 9.68622 13.4007 9.66055 13.408ZM11.6632 17.3308C10.9741 17.4096 10.2585 17.8203 9.82804 18.3839C8.91844 19.575 9.13943 21.2856 10.3209 22.1986C11.5533 23.1511 13.3212 22.896 14.2201 21.636C15.12 20.3744 14.7978 18.6187 13.5112 17.7739C12.9415 17.3998 12.3338 17.2541 11.6632 17.3308ZM11.8312 18.53C11.6243 18.5496 11.4942 18.5878 11.2983 18.6864C11.1078 18.7824 10.8403 19.0251 10.712 19.2185C10.5236 19.5023 10.433 19.9165 10.4854 20.2542C10.5419 20.6187 10.6706 20.8702 10.9365 21.1358C11.5216 21.7204 12.4768 21.7204 13.062 21.1358C13.3249 20.8732 13.4542 20.6231 13.5119 20.2655C13.5663 19.9287 13.4743 19.5013 13.2865 19.2185C13.2373 19.1444 13.1218 19.0128 13.0299 18.926C12.7029 18.6176 12.3031 18.4855 11.8312 18.53Z" fill="white"/>
</svg>
            <span>Works offline</span>
          </div>
        </div>
        <!-- Passcode Card -->
        <div class="sec-option" id="sec-opt-passcode" onclick="selectSecurity('passcode')">
          <div class="sec-card sec-card--gray">
            <div class="sec-card__header">
              <div class="sec-card__icon sec-card__icon--green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.19141 5.25V18.75C4.19141 18.9489 4.11239 19.1397 3.97174 19.2803C3.83108 19.421 3.64032 19.5 3.44141 19.5C3.24249 19.5 3.05173 19.421 2.91108 19.2803C2.77042 19.1397 2.69141 18.9489 2.69141 18.75V5.25C2.69141 5.05109 2.77042 4.86032 2.91108 4.71967C3.05173 4.57902 3.24249 4.5 3.44141 4.5C3.64032 4.5 3.83108 4.57902 3.97174 4.71967C4.11239 4.86032 4.19141 5.05109 4.19141 5.25ZM12.0664 10.3594L10.1914 10.9688V9C10.1914 8.80109 10.1124 8.61032 9.97174 8.46967C9.83108 8.32902 9.64032 8.25 9.44141 8.25C9.24249 8.25 9.05173 8.32902 8.91108 8.46967C8.77042 8.61032 8.69141 8.80109 8.69141 9V10.9688L6.81641 10.3594C6.62719 10.2972 6.42103 10.3128 6.24328 10.4026C6.06553 10.4924 5.93075 10.6492 5.86859 10.8384C5.80643 11.0277 5.82199 11.2338 5.91183 11.4116C6.00167 11.5893 6.15844 11.7241 6.34766 11.7863L8.22266 12.3947L7.06578 13.9884C7.00464 14.0679 6.96005 14.1588 6.93464 14.2557C6.90922 14.3527 6.90351 14.4538 6.91782 14.553C6.93214 14.6522 6.9662 14.7475 7.01798 14.8334C7.06977 14.9192 7.13824 14.9938 7.21934 15.0527C7.30044 15.1116 7.39253 15.1536 7.49016 15.1764C7.58779 15.1991 7.68899 15.202 7.78776 15.1849C7.88654 15.1679 7.9809 15.1312 8.06526 15.077C8.14961 15.0229 8.22226 14.9524 8.27891 14.8697L9.43578 13.2759L10.5927 14.8697C10.6493 14.9524 10.7219 15.0229 10.8063 15.077C10.8907 15.1312 10.985 15.1679 11.0838 15.1849C11.1826 15.202 11.2838 15.1991 11.3814 15.1764C11.479 15.1536 11.5711 15.1116 11.6522 15.0527C11.7333 14.9938 11.8018 14.9192 11.8536 14.8334C11.9054 14.7475 11.9394 14.6522 11.9537 14.553C11.9681 14.4538 11.9623 14.3527 11.9369 14.2557C11.9115 14.1588 11.8669 14.0679 11.8058 13.9884L10.6489 12.3947L12.5239 11.7863C12.7048 11.719 12.8527 11.5846 12.9371 11.411C13.0214 11.2375 13.0355 11.0381 12.9766 10.8543C12.9177 10.6706 12.7902 10.5166 12.6207 10.4244C12.4512 10.3322 12.2527 10.3089 12.0664 10.3594ZM22.0039 10.8412C21.9424 10.6538 21.8096 10.498 21.6341 10.4078C21.4586 10.3176 21.2546 10.3002 21.0664 10.3594L19.1914 10.9688V9C19.1914 8.80109 19.1124 8.61032 18.9717 8.46967C18.8311 8.32902 18.6403 8.25 18.4414 8.25C18.2425 8.25 18.0517 8.32902 17.9111 8.46967C17.7704 8.61032 17.6914 8.80109 17.6914 9V10.9688L15.8164 10.3603C15.7227 10.3298 15.6239 10.3181 15.5257 10.3258C15.4275 10.3335 15.3318 10.3605 15.244 10.4052C15.1562 10.4499 15.078 10.5115 15.014 10.5864C14.95 10.6613 14.9014 10.748 14.8709 10.8417C14.8405 10.9354 14.8287 11.0342 14.8365 11.1324C14.8442 11.2306 14.8711 11.3264 14.9158 11.4142C14.9605 11.502 15.0221 11.5801 15.097 11.6441C15.1719 11.7081 15.2587 11.7567 15.3523 11.7872L17.2273 12.3956L16.0705 13.9894C16.0093 14.0688 15.9647 14.1597 15.9393 14.2567C15.9139 14.3536 15.9082 14.4547 15.9225 14.5539C15.9368 14.6531 15.9709 14.7485 16.0227 14.8343C16.0745 14.9201 16.1429 14.9947 16.224 15.0536C16.3051 15.1125 16.3972 15.1546 16.4948 15.1773C16.5925 15.2 16.6937 15.2029 16.7925 15.1859C16.8912 15.1688 16.9856 15.1321 17.0699 15.078C17.1543 15.0238 17.2269 14.9533 17.2836 14.8706L18.4405 13.2769L19.5973 14.8706C19.654 14.9533 19.7266 15.0238 19.811 15.078C19.8954 15.1321 19.9897 15.1688 20.0885 15.1859C20.1873 15.2029 20.2885 15.2 20.3861 15.1773C20.4837 15.1546 20.5758 15.1125 20.6569 15.0536C20.738 14.9947 20.8065 14.9201 20.8583 14.8343C20.9101 14.7485 20.9441 14.6531 20.9584 14.5539C20.9727 14.4547 20.967 14.3536 20.9416 14.2567C20.9162 14.1597 20.8716 14.0679 20.8105 13.9894L19.6536 12.3956L21.5286 11.7872C21.7168 11.7245 21.8725 11.5897 21.9616 11.4124C22.0507 11.2351 22.0659 11.0297 22.0039 10.8412Z" fill="white"/>
</svg>
              </div>
              <div class="lang-radio" id="sec-radio-passcode"></div>
            </div>
            <div class="sec-card__body">
              <h3 class="sec-card__name">Create a 4 digit UPI passcode</h3>
              <p class="sec-card__desc">UPI App Passcode is the code you set to open and access the UPI application. This is different from the UPI PIN. UPI PIN is used for transactions and will only be asked while completing a transaction</p>
            </div>
          </div>
          <div class="sec-footer sec-footer--green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M11.4127 2.87019C9.80469 2.9516 8.54178 3.17933 7.14074 3.64052C5.42068 4.20673 3.84134 5.04805 2.42474 6.15279C1.73884 6.68768 0.957879 7.41389 0.873351 7.59541C0.679479 8.01173 1.00672 8.48312 1.46099 8.44193C1.53798 8.43495 1.63634 8.41095 1.67961 8.38856C1.72286 8.36619 1.9163 8.20009 2.1095 8.01944C3.23889 6.96327 4.26285 6.24411 5.55674 5.59827C7.28536 4.73547 9.04295 4.24952 10.9687 4.10194C11.7168 4.04461 12.9132 4.07271 13.6927 4.16593C16.4877 4.5001 19.1894 5.67711 21.2887 7.47514C21.4273 7.59385 21.6988 7.83877 21.892 8.01944C22.0852 8.20009 22.2786 8.36619 22.3219 8.38856C22.3651 8.41095 22.4635 8.43495 22.5405 8.44193C22.9947 8.48312 23.322 8.01173 23.1281 7.59541C23.0436 7.41389 22.2626 6.68768 21.5767 6.15279C19.1905 4.29188 16.312 3.16649 13.2967 2.91562C12.8827 2.88116 11.7401 2.85361 11.4127 2.87019ZM11.1127 7.16458C9.42899 7.30251 7.83009 7.80111 6.36393 8.64541C5.56151 9.10748 4.81077 9.67832 4.12658 10.3466C3.95783 10.5115 3.91266 10.5714 3.87758 10.6773C3.73653 11.1026 4.05254 11.502 4.50153 11.466C4.69463 11.4505 4.76351 11.4077 5.08192 11.1056C5.99087 10.2431 6.91456 9.63526 8.05768 9.14729C10.2842 8.19685 12.7647 8.07824 15.071 8.81199C16.5339 9.2774 17.8522 10.0653 18.9906 11.1544C19.2578 11.4102 19.368 11.4707 19.5675 11.4715C19.8028 11.4723 19.9876 11.3635 20.0992 11.1585C20.1755 11.0183 20.1907 10.8254 20.1379 10.668C20.0627 10.4441 19.1816 9.65588 18.4191 9.13037C16.2749 7.65262 13.6794 6.95429 11.1127 7.16458ZM11.6287 11.3181C10.9164 11.3888 10.4895 11.4795 9.92474 11.6806C9.47747 11.8398 8.96169 12.0965 8.59274 12.3434C8.09267 12.6782 7.51518 13.1922 7.42818 13.38C7.36525 13.5159 7.36835 13.7576 7.43466 13.8856C7.54955 14.1073 7.79634 14.2491 8.02624 14.2253C8.20454 14.2069 8.28153 14.1611 8.54795 13.9146C9.23015 13.2836 9.96484 12.8829 10.8469 12.6608C11.593 12.473 12.5044 12.473 13.2506 12.6608C14.142 12.8853 14.9061 13.306 15.5887 13.9483C15.8392 14.184 15.9056 14.218 16.1167 14.2191C16.306 14.2201 16.4108 14.1798 16.5352 14.0582C16.7025 13.8946 16.759 13.6765 16.6931 13.4497C16.6575 13.3273 16.6264 13.2847 16.4327 13.0933C15.4919 12.1637 14.2454 11.5555 12.8887 11.3641C12.6253 11.3269 11.8316 11.298 11.6287 11.3181ZM11.7205 15.6975C10.4823 15.8174 9.46041 16.8091 9.29034 18.0557C9.17303 18.9157 9.49768 19.8228 10.1335 20.4115C11.4637 21.643 13.604 21.2723 14.429 19.6675C14.7208 19.0999 14.8089 18.4056 14.6651 17.808C14.5012 17.1267 14.0809 16.5161 13.5202 16.1446C13.1446 15.8957 12.7052 15.7405 12.2505 15.6963C11.9876 15.6708 11.9969 15.6708 11.7205 15.6975ZM11.6167 16.9338C11.3498 17.0039 11.139 17.13 10.9204 17.3502C10.6352 17.6375 10.5054 17.9173 10.4753 18.3094C10.418 19.055 10.9396 19.7502 11.6767 19.9109C12.4629 20.0823 13.2676 19.5934 13.4791 18.816C13.5364 18.6052 13.5364 18.2066 13.479 18.0134C13.3221 17.4846 12.8923 17.0642 12.3737 16.9323C12.1937 16.8866 11.7935 16.8874 11.6167 16.9338Z" fill="white"/>
</svg>
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

// ─── Check Balance: Enter UPI PIN screen ─────────────────────
function checkBalancePinHTML() {
  let boxes = "";
  for (let i = 0; i < 4; i++) {
    const raw = i < checkBalancePinInput.length ? checkBalancePinInput[i] : "";
    const val = raw && checkBalancePinMasked ? "•" : raw;
    const active = i === checkBalancePinInput.length ? " ab-pin-digit--active" : "";
    boxes += `<div class="ab-pin-digit${active}" id="cb-pin-${i}"><span>${val}</span><div class="ab-pin-digit__line"></div></div>`;
  }
  const showLabel = checkBalancePinMasked ? "Show" : "Hide";
  return `
  <div class="screen screen-check-balance-pin">
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBackFromCheckBalancePin()">←</span><span class="ob-page-title">Enter UPI</span></div>
    <div class="ab-bank-bar">
      <span class="ab-bank-bar__name">Bharatiya Payments Bank</span>
      <span class="ab-bank-bar__num">XXXXXXXX***2453</span>
    </div>
    <div class="ab-pin-content" id="cb-pin-content">
      <p class="ab-pin-heading">ENTER UPI PIN</p>
      <div class="ab-pin-row" id="cb-pin-row">${boxes}</div>
      <p class="ab-pin-show" id="cb-pin-show" onclick="toggleCheckBalancePinMask()" role="button" tabindex="0"><span class="ab-pin-show__circle"></span> <span id="cb-pin-show-label">${showLabel}</span></p>
    </div>
    <div class="ab-pin-keyboard">${abNumpadHTML("cbpin")}</div>
    ${homeIndHTML()}
  </div>`;
}

// ─── Home Screen HTML (Check balance UI from Figma) ──────────
function homeScreenHTML() {
  const bannerText = "Beat the heat with Swiggy 50%";
  const upiId = "***2776@upi";
  const bankCardLeft = `
    <div class="bank-card__logo"><svg viewBox="0 0 18 18" fill="none"><path d="M9 1L1.5 5v1.5h15V5L9 1z" fill="#1a237e"/><rect x="3" y="8" width="2" height="6" fill="#1a237e"/><rect x="8" y="8" width="2" height="6" fill="#1a237e"/><rect x="13" y="8" width="2" height="6" fill="#1a237e"/><rect x="1" y="15" width="16" height="2" rx=".5" fill="#1a237e"/></svg></div>
    <div class="bank-card__details">
      <span class="bank-card__name">Bharatiya Payments Bank</span>
      <span class="bank-card__account">***2453 Bank account</span>
    </div>
    <svg class="bank-card__chevron" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="#666" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const bankCardRight = balanceRevealed
    ? `<div class="bank-card__balance" id="bank-card-balance"><span class="bank-card__balance-label">Balance</span><span class="bank-card__balance-amount">₹37,28,373</span></div>`
    : `<button type="button" class="bank-card__check-btn" id="check-balance-btn" onclick="openCheckBalancePinScreen()">Check balance<svg viewBox="0 0 8 8" fill="none"><path d="M3 1l3 3-3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  const bankCardInner = `<div class="bank-card__info">${bankCardLeft}</div><div class="bank-card__divider"></div><div class="bank-card__action">${bankCardRight}</div>`;
  const bankCardHTML = `<div class="bank-card bank-card--with-check" id="bank-card">${bankCardInner}</div><div class="bank-card-dots"><span class="bank-card-dots__dot bank-card-dots__dot--active"></span><span class="bank-card-dots__dot"></span><span class="bank-card-dots__dot"></span><span class="bank-card-dots__dot"></span></div>`;

  return `
  <div class="screen screen--no-anim" style="display:block">
    <div class="status-bar"><span class="status-bar__time">9:41</span><div class="status-bar__icons"><svg viewBox="0 0 18 12" fill="none"><rect x="0" y="8" width="3" height="4" rx="0.5" fill="#080a0b"/><rect x="5" y="5" width="3" height="7" rx="0.5" fill="#080a0b"/><rect x="10" y="2" width="3" height="10" rx="0.5" fill="#080a0b"/><rect x="15" y="0" width="3" height="12" rx="0.5" fill="#080a0b"/></svg><svg viewBox="0 0 16 12" fill="none"><path d="M8 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="#080a0b"/><path d="M4.5 7.5C5.5 6.2 6.7 5.5 8 5.5s2.5.7 3.5 2" stroke="#080a0b" stroke-width="1.2" stroke-linecap="round"/><path d="M2 5c1.8-2 3.7-3 6-3s4.2 1 6 3" stroke="#080a0b" stroke-width="1.2" stroke-linecap="round"/></svg><svg viewBox="0 0 28 13" fill="none"><rect x="0.5" y="0.5" width="23" height="12" rx="2" stroke="#080a0b" stroke-opacity="0.35"/><rect x="2" y="2" width="20" height="9" rx="1" fill="#080a0b"/><path d="M25 4.5v4a2 2 0 000-4z" fill="#080a0b" fill-opacity="0.4"/></svg></div></div>
    <div class="header">
      <div class="avatar">RS<div class="avatar__qr-badge"><svg viewBox="0 0 12 12" fill="none"><rect x="0" y="0" width="5" height="5" rx="1" stroke="#0b0b0b" stroke-width="1"/><rect x="7" y="0" width="5" height="5" rx="1" stroke="#0b0b0b" stroke-width="1"/><rect x="0" y="7" width="5" height="5" rx="1" stroke="#0b0b0b" stroke-width="1"/><rect x="2" y="2" width="1.5" height="1.5" fill="#0b0b0b"/><rect x="9" y="2" width="1.5" height="1.5" fill="#0b0b0b"/><rect x="2" y="9" width="1.5" height="1.5" fill="#0b0b0b"/><rect x="8" y="8" width="4" height="4" rx="0.5" stroke="#0b0b0b" stroke-width="0.8"/></svg></div></div>
      <div class="mode-switch"><div class="mode-switch__tab mode-switch__tab--active"><svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" fill="#f47920"/><path d="M3 17.5c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="#f47920" stroke-width="1.5" stroke-linecap="round"/></svg><span>Me</span></div><div class="mode-switch__tab mode-switch__tab--icon-only"><svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="3" fill="#999"/><circle cx="14" cy="7" r="2.5" fill="#999"/><path d="M1 17c0-3 2.5-5 6-5s6 2 6 5" stroke="#999" stroke-width="1.2" stroke-linecap="round"/><path d="M13 17c0-2.5 1.8-4 4-4s4 1.5 4 4" stroke="#999" stroke-width="1" stroke-linecap="round" opacity="0.6"/></svg></div></div>
      <div class="notification-btn"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2.5c-3.5 0-6 2.5-6 6v3.5l-1.5 2.5c-.3.5.1 1 .6 1h13.8c.5 0 .9-.5.6-1L18 12v-3.5c0-3.5-2.5-6-6-6z" stroke="#0b0b0b" stroke-width="1.5"/><path d="M9 18.5c.5 1.5 1.5 2.5 3 2.5s2.5-1 3-2.5" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round"/></svg><div class="notification-btn__dot"></div></div>
    </div>
    <div class="content">
      <div class="home-upi-row">
        <div class="ticker-banner ticker-banner--dashed"><div class="ticker-banner__pill"><span class="ticker-banner__emoji">🎉</span><span class="ticker-banner__text">${bannerText}</span></div></div>
        <div class="home-upi-id"><span class="home-upi-id__masked">${upiId}</span><button type="button" class="home-upi-id__icon" aria-label="Toggle visibility"><svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M10 4C4 4 1 10 1 10s3 6 9 6 9-6 9-6-3-6-9-6z" stroke="#666" stroke-width="1.2"/><circle cx="10" cy="10" r="2.5" stroke="#666" stroke-width="1.2"/></svg></button><button type="button" class="home-upi-id__icon" aria-label="Copy"><svg viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="6" y="6" width="10" height="10" rx="1" stroke="#666" stroke-width="1.2"/><path d="M4 4v10h10" stroke="#666" stroke-width="1.2"/></svg></button></div>
      </div>
      ${bankCardHTML}
      <div class="section" id="payments-section"><h2 class="section__title">${t("home.payments_title")}</h2>
        <div class="icon-grid">
          <div class="icon-grid__item" id="send-to-mobile"><div class="icon-grid__circle"><img src="assets/home/Icon.png" alt="" class="icon-grid__img"/></div><span class="icon-grid__label">${t("home.send_mobile")}</span></div>
          <div class="icon-grid__item" id="bank-upi-transfer"><div class="icon-grid__circle"><img src="assets/home/Icon-1.png" alt="" class="icon-grid__img"/></div><span class="icon-grid__label">${t("home.send_bank")}</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><img src="assets/home/Icon-2.png" alt="" class="icon-grid__img"/></div><span class="icon-grid__label">${t("home.approve_pay")}</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><img src="assets/home/Icon-3.png" alt="" class="icon-grid__img"/></div><span class="icon-grid__label">${t("home.upi_circle")}</span></div>
          <div class="icon-grid__separator"></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><img src="assets/home/Icon-4.png" alt="" class="icon-grid__img"/></div><span class="icon-grid__label">${t("home.bills_recharges")}</span></div>
          <div class="icon-grid__item" id="mobile-prepaid"><div class="icon-grid__circle"><img src="assets/home/Icon-5.png" alt="" class="icon-grid__img"/></div><span class="icon-grid__label">${t("home.mobile_prepaid")}</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><img src="assets/home/Icon-6.png" alt="" class="icon-grid__img"/></div><span class="icon-grid__label">${t("home.ipo_autopay")}</span></div>
          <div class="icon-grid__item"><div class="icon-grid__circle"><img src="assets/home/Icon-7.png" alt="" class="icon-grid__img"/></div><span class="icon-grid__label">${t("home.spend_analytics")}</span></div>
        </div>
      </div>
      <div class="section" id="suggested-features"><h2 class="section__title">${t("home.suggested_features")}</h2>
        <div class="features-row">
          <div class="feature-item"><div class="feature-item__icon"><img src="assets/home/mobile-recharge.png" alt="" class="feature-item__img"/></div><span class="feature-item__label">${t("home.mobile_prepaid_f")}</span></div>
          <div class="feature-item"><span class="feature-item__chip">POPULAR</span><div class="feature-item__icon"><img src="assets/home/Car wifi icon 2.png" alt="" class="feature-item__img"/></div><span class="feature-item__label">FASTag</span></div>
          <div class="feature-item"><div class="feature-item__icon"><img src="assets/home/electric.png" alt="" class="feature-item__img"/></div><span class="feature-item__label">${t("home.electricity")}</span></div>
          <div class="feature-item"><div class="feature-item__icon"><img src="assets/home/dish3d.png" alt="" class="feature-item__img"/></div><span class="feature-item__label">${t("home.dth")}</span></div>
          <div class="feature-item"><div class="feature-item__icon"><span>📲</span></div><span class="feature-item__label">${t("home.mobile_postpaid")}</span></div>
        </div>
      </div>
      <div class="promo-cards"><div class="promo-card"><div class="promo-card__icon">🪙</div><span class="promo-card__text">${t("home.cashback_offers")}</span></div><div class="promo-card"><div class="promo-card__icon">🎁</div><span class="promo-card__text">${t("home.refer_friend")}</span></div></div>
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
      <div class="bottom-nav__items"><div class="bottom-nav__item"><svg viewBox="0 0 20 20" fill="none"><path d="M4 5l4.5-3.5a2 2 0 012.5 0L16 5" stroke="#687f8f" stroke-width="1.3" stroke-linecap="round"/><path d="M3 8h14" stroke="#687f8f" stroke-width="1.3"/><path d="M5 8v7h3.5v-4h3v4H15V8" stroke="#687f8f" stroke-width="1.3"/><path d="M2 17h16" stroke="#687f8f" stroke-width="1.3" stroke-linecap="round"/></svg><span class="bottom-nav__label">${t("home.offers")}</span></div><div style="width:72px"></div><div class="bottom-nav__item"><svg viewBox="0 0 18 18" fill="none"><path d="M2 5v8a2 2 0 002 2h10a2 2 0 002-2V5" stroke="#687f8f" stroke-width="1.3"/><path d="M5 2h8l3 3H2l3-3z" stroke="#687f8f" stroke-width="1.3" stroke-linejoin="round"/><path d="M7 8h4" stroke="#687f8f" stroke-width="1.3" stroke-linecap="round"/></svg><span class="bottom-nav__label">${t("home.history")}</span></div></div>
      <div class="scanner-fab"><button type="button" class="scanner-fab__outer scanner-fab__outer--bg" id="scanner-btn" aria-label="Scanner" onclick="renderScreen(S.SCAN_1)"></button></div>
      <div class="home-indicator"></div>
    </div>
  </div>`;
}

// ─── Add Bank Account Screen Renderers ───────────────────────

function bankIconSVG() {
  return '<svg viewBox="0 0 18 18" fill="none" width="18" height="18"><path d="M9 1L1.5 5v1.5h15V5L9 1z" fill="#1a237e"/><rect x="3" y="8" width="2" height="6" fill="#1a237e"/><rect x="8" y="8" width="2" height="6" fill="#1a237e"/><rect x="13" y="8" width="2" height="6" fill="#1a237e"/><rect x="1" y="15" width="16" height="2" rx=".5" fill="#1a237e"/></svg>';
}

function selectBankHTML() {
  const accounts = [
    { name: "Bharatiya Payments Bank", ifsc: "BPB1234IN" },
    { name: "Bharatiya Payments Bank", ifsc: "HDF1234IN", needsPin: true },
  ];
  let accountList = "";
  accounts.forEach((acc, i) => {
    const isSelected = addBankSelectedAccount === i;
    const radioClass = isSelected ? "ab-radio ab-radio--checked" : "ab-radio";
    const pinWarningHTML = acc.needsPin ? `
        <div class="ab-pin-warning">
          <svg viewBox="0 0 20 20" fill="none" width="20" height="20"><circle cx="10" cy="10" r="8.5" stroke="#e5a100" stroke-width="1.2"/><path d="M10 6v5" stroke="#e5a100" stroke-width="1.3" stroke-linecap="round"/><circle cx="10" cy="14" r=".8" fill="#e5a100"/></svg>
          <span class="ab-pin-warning__text">4 digit UPI PIN not set</span>
          <span class="ab-pin-warning__link">Set UPI PIN</span>
        </div>` : "";
    accountList += `
      <div class="ab-account-card${acc.needsPin ? " ab-account-card--has-pin" : ""}" onclick="selectBankAccount(${i})">
        <div class="ab-account-row">
          <div class="ab-account-info">
            <div class="ab-account-logo">${bankIconSVG()}</div>
            <div class="ab-account-details">
              <span class="ab-account-name">${acc.name}</span>
              <span class="ab-account-ifsc">IFSC - ${acc.ifsc}</span>
            </div>
          </div>
          <div class="${radioClass}"></div>
        </div>${pinWarningHTML}
      </div>`;
  });

  return `
  <div class="screen screen-ab-select">
    <div class="ab-gradient-bg"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBack()">←</span></div>
    <div class="ab-select-content">
      <h1 class="ab-title">Choose your bank</h1>
      <p class="ab-subtitle">Select which bank you have an account with</p>
      <div class="ab-bank-header" id="ab-tour-select-bank-header">
        <div class="ab-bank-header__info">
          <div class="ab-account-logo">${bankIconSVG()}</div>
          <div class="ab-bank-header__details">
            <span class="ab-bank-header__name">Bharatiya Payments Bank</span>
            <span class="ab-bank-header__num">*** 2453</span>
          </div>
        </div>
        <span class="ab-bank-header__change">Change bank →</span>
      </div>
      <div class="ab-section-label">
        <span>Select your account</span>
        <span class="ab-section-label__star">✦</span>
        <div class="ab-section-label__line"></div>
      </div>
      <div class="ab-account-list">${accountList}</div>
    </div>
    <div class="ob-bottom-bar"><div class="ob-bottom-bar__inner"><button class="ob-btn ob-btn--primary" onclick="renderScreen(S.ADD_BANK_METHOD_SELECT)">Confirm</button></div>${homeIndHTML()}</div>
  </div>`;
}

function debitCardHTML() {
  let cardBoxes = "";
  for (let i = 0; i < 6; i++) {
    const val = i < addBankCardDigits.length ? addBankCardDigits[i] : "";
    const active = (addBankInputFocus === "card" && i === addBankCardDigits.length) ? " ab-digit--active" : "";
    cardBoxes += `<div class="ab-digit${active}" id="ab-card-${i}"><span>${val}</span><div class="ab-digit__line"></div></div>`;
  }
  let expiryBoxes = "";
  for (let i = 0; i < 4; i++) {
    const val = i < addBankExpiry.length ? addBankExpiry[i] : "";
    const active = (addBankInputFocus === "expiry" && i === addBankExpiry.length) ? " ab-digit--active" : "";
    expiryBoxes += `<div class="ab-digit${active}" id="ab-exp-${i}"><span>${val}</span><div class="ab-digit__line"></div></div>`;
    if (i === 1) expiryBoxes += '<span class="ab-expiry-slash">/</span>';
  }
  const canConfirm = addBankCardDigits.length === 6 && addBankExpiry.length === 4;
  const btnClass = canConfirm ? "ob-btn ob-btn--primary" : "ob-btn ob-btn--disabled";

  return `
  <div class="screen screen-ab-debit">
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBack()">←</span><span class="ob-page-title">Set UPI PIN</span></div>
    <div class="ab-bank-bar">
      <span class="ab-bank-bar__name">HDFC Bank Ltd</span>
      <span class="ab-bank-bar__num">658568XXXXXXXX55</span>
    </div>
    <div class="ab-debit-content" id="ab-tour-debit-content">
      <div class="ab-debit-section">
        <p class="ab-debit-label">LAST 6 DIGIT OF DEBIT CARD</p>
        <div class="ab-digit-row" id="ab-card-digits">${cardBoxes}</div>
      </div>
      <div class="ab-debit-section">
        <p class="ab-debit-label">Valid Upto</p>
        <div class="ab-digit-row ab-digit-row--expiry" id="ab-expiry-digits">${expiryBoxes}</div>
      </div>
    </div>
    <div class="ab-debit-bottom">
      <div class="ab-debit-btn-area"><button class="${btnClass}" id="ab-debit-confirm" ${canConfirm ? 'onclick="renderScreen(S.ADD_BANK_OTP)"' : ''}>Confirm</button></div>
      ${interactiveKBHTML()}
    </div>
  </div>`;
}

function bankOtpHTML() {
  let boxes = "";
  for (let i = 0; i < 4; i++) {
    const val = i < addBankOtp.length ? addBankOtp[i] : "";
    const active = i === addBankOtp.length ? " ab-pin-digit--active" : "";
    boxes += `<div class="ab-pin-digit${active}" id="ab-otp-${i}"><span>${val}</span><div class="ab-pin-digit__line"></div></div>`;
  }

  return `
  <div class="screen screen-ab-otp">
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBack()">←</span><span class="ob-page-title">Enter OTP</span></div>
    <div class="ab-bank-bar">
      <span class="ab-bank-bar__name">HDFC Bank Ltd</span>
      <span class="ab-bank-bar__num">658568XXXXXXXX55</span>
    </div>
    <div class="ab-pin-content" id="ab-tour-otp-content">
      <p class="ab-pin-heading">ENTER OTP</p>
      <div class="ab-pin-row" id="ab-tour-otp-row">${boxes}</div>
    </div>
    <div class="ab-pin-keyboard">${abNumpadHTML("otp")}</div>
  </div>`;
}

function setUpiPinHTML() {
  let boxes = "";
  for (let i = 0; i < 4; i++) {
    const val = i < addBankPin.length ? addBankPin[i] : "";
    const active = i === addBankPin.length ? " ab-pin-digit--active" : "";
    boxes += `<div class="ab-pin-digit${active}" id="ab-pin-${i}"><span>${val}</span><div class="ab-pin-digit__line"></div></div>`;
  }

  return `
  <div class="screen screen-ab-setpin">
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBack()">←</span><span class="ob-page-title">Set UPI PIN</span></div>
    <div class="ab-bank-bar">
      <span class="ab-bank-bar__name">HDFC Bank Ltd</span>
      <span class="ab-bank-bar__num">658568XXXXXXXX55</span>
    </div>
    <div class="ab-pin-content" id="ab-tour-setpin-content">
      <p class="ab-pin-heading">ENTER NEW UPI PIN</p>
      <div class="ab-pin-row" id="ab-tour-setpin-row">${boxes}</div>
    </div>
    <div class="ab-pin-keyboard">${abNumpadHTML("pin")}</div>
  </div>`;
}

function confirmUpiPinHTML() {
  let boxes = "";
  for (let i = 0; i < 4; i++) {
    const val = i < addBankConfirmPin.length ? addBankConfirmPin[i] : "";
    const active = i === addBankConfirmPin.length ? " ab-pin-digit--active" : "";
    boxes += `<div class="ab-pin-digit${active}" id="ab-cpin-${i}"><span>${val}</span><div class="ab-pin-digit__line"></div></div>`;
  }

  return `
  <div class="screen screen-ab-confirmpin">
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBack()">←</span><span class="ob-page-title">Set UPI PIN</span></div>
    <div class="ab-bank-bar">
      <span class="ab-bank-bar__name">HDFC Bank Ltd</span>
      <span class="ab-bank-bar__num">658568XXXXXXXX55</span>
    </div>
    <div class="ab-pin-content">
      <p class="ab-pin-heading">CONFIRM NEW UPI PIN</p>
      <div class="ab-pin-row" id="ab-cpin-row">${boxes}</div>
    </div>
    <div class="ab-pin-keyboard">${abNumpadHTML("cpin")}</div>
  </div>`;
}

function bankSuccessHTML() {
  return `
  <div class="screen screen-ab-success">
    ${statusBarSVG(false)}
    <div class="ab-success-content">
      <div class="ab-success-badge">
        <img src="assets/paymentDone.gif" alt="Success" width="110" height="80" autoplay />
      </div>
      <p class="ab-success-text">Your Bank has been added successfully!</p>
    </div>
  </div>`;
}

function paymentMethodsHTML() {
  return `
  <div class="screen screen-ab-methods">
    <div class="ab-gradient-bg"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="renderScreen(S.HOME)">←</span><span class="ob-page-title">Payment Methods</span></div>
    <div class="ab-methods-content">
      <div class="ab-section-label">
        <span>Bank Account</span>
        <span class="ab-section-label__star">✦</span>
        <div class="ab-section-label__line"></div>
      </div>
      <div class="ab-methods-list">
        <div class="ab-methods-bank">
          <div class="ab-methods-bank__icon">${bankIconSVG()}</div>
          <div class="ab-methods-bank__details">
            <span class="ab-account-name">Pragati Bank</span>
            <span class="ab-account-ifsc">XXXX53</span>
          </div>
        </div>
        <div class="ab-methods-bank">
          <div class="ab-methods-bank__icon">${bankIconSVG()}</div>
          <div class="ab-methods-bank__details">
            <span class="ab-account-name">Bharatiya Payments Bank</span>
            <span class="ab-account-ifsc">XXXX53</span>
          </div>
        </div>
        <div class="ab-methods-add">
          <div class="ab-methods-add__icon">
            <svg viewBox="0 0 20 20" fill="none" width="20" height="20"><rect x="2" y="4" width="16" height="12" rx="2" stroke="#6b7280" stroke-width="1.3"/><path d="M2 8h16" stroke="#6b7280" stroke-width="1.2"/><path d="M6 12h3" stroke="#6b7280" stroke-width="1.2" stroke-linecap="round"/></svg>
          </div>
          <span class="ab-methods-add__text">Add new bank account</span>
        </div>
      </div>
    </div>
    <div class="ab-toast ab-toast--success">
      <div class="ab-toast__icon">
        <svg viewBox="0 0 20 20" fill="none" width="20" height="20"><circle cx="10" cy="10" r="8" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.2"/><path d="M7 10l2 2 4-4" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span class="ab-toast__text">Your Bharatiya Payments Bank has been added successfully!</span>
      <span class="ab-toast__close" onclick="renderScreen(S.LANDING)">Close</span>
    </div>
    ${homeIndHTML()}
  </div>`;
}

// ─── Method Selection Bottom Sheet ────────────────────────────
function methodSelectHTML() {
  const debitChecked = addBankMethod === "debit" ? "ab-ms-radio--checked" : "";
  const aadhaarChecked = addBankMethod === "aadhaar" ? "ab-ms-radio--checked" : "";
  return `
  <div class="screen screen-ab-method-select">
    <div class="ab-gradient-bg"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBack()">←</span></div>
    <div class="ab-select-content">
      <h1 class="ab-title">Which account?</h1>
      <p class="ab-subtitle">Choose the account that you would want to use</p>
      <div class="ab-bank-header">
        <div class="ab-bank-header__info">
          <div class="ab-account-logo">${bankIconSVG()}</div>
          <div class="ab-bank-header__details">
            <span class="ab-bank-header__name">Bharatiya Payments Bank</span>
            <span class="ab-bank-header__num">*** 2453</span>
          </div>
        </div>
        <span class="ab-bank-header__change">Change bank →</span>
      </div>
      <div class="ab-section-label"><span>Select your account</span><span class="ab-section-label__star">✦</span><div class="ab-section-label__line"></div></div>
      <div class="ab-account-list">
        <div class="ab-account-card" onclick="selectBankAccount(0)">
          <div class="ab-account-row">
            <div class="ab-account-info">
              <div class="ab-account-logo">${bankIconSVG()}</div>
              <div class="ab-account-details">
                <span class="ab-account-name">Bharatiya Payments Bank</span>
                <span class="ab-account-ifsc">IFSC - BPB1234IN</span>
              </div>
            </div>
            <div class="ab-radio${addBankSelectedAccount === 0 ? " ab-radio--checked" : ""}"></div>
          </div>
        </div>
        <div class="ab-account-card ab-account-card--has-pin" onclick="selectBankAccount(1)">
          <div class="ab-account-row">
            <div class="ab-account-info">
              <div class="ab-account-logo">${bankIconSVG()}</div>
              <div class="ab-account-details">
                <span class="ab-account-name">Bharatiya Payments Bank</span>
                <span class="ab-account-ifsc">IFSC - HDF1234IN</span>
              </div>
            </div>
            <div class="ab-radio${addBankSelectedAccount === 1 ? " ab-radio--checked" : ""}"></div>
          </div>
          <div class="ab-pin-warning">
            <svg viewBox="0 0 20 20" fill="none" width="20" height="20"><circle cx="10" cy="10" r="8.5" stroke="#e5a100" stroke-width="1.2"/><path d="M10 6v5" stroke="#e5a100" stroke-width="1.3" stroke-linecap="round"/><circle cx="10" cy="14" r=".8" fill="#e5a100"/></svg>
            <span class="ab-pin-warning__text">4 digit UPI PIN not set</span>
            <span class="ab-pin-warning__link">Set UPI PIN</span>
          </div>
        </div>
      </div>
    </div>
    <!-- Bottom sheet overlay -->
    <div class="ab-ms-overlay">
      <div class="ab-ms-sheet" id="ab-tour-method-sheet">
        <div class="ab-ms-handle"></div>
        <h3 class="ab-ms-title">Choose option to set UPI PIN</h3>
        <div class="ab-ms-options">
          <div class="ab-ms-option" onclick="selectMethod('debit')">
            <div class="ab-ms-option__info">
              <svg class="ab-ms-option__icon" viewBox="0 0 24 24" fill="none" width="24" height="24"><rect x="2" y="4" width="20" height="16" rx="3" stroke="#0b0b0b" stroke-width="1.5"/><path d="M2 10h20" stroke="#0b0b0b" stroke-width="1.5"/><path d="M6 15h4" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round"/></svg>
              <span class="ab-ms-option__label">Debit Card</span>
            </div>
            <div class="ab-ms-radio ${debitChecked}"></div>
          </div>
          <div class="ab-ms-option" onclick="selectMethod('aadhaar')">
            <div class="ab-ms-option__info">
                        <img src="assets/aadhar.png" alt="Aadhaar" class="ab-aadhaar-logo" width="24" height="24"/>
              <span class="ab-ms-option__label">Aadhaar number</span>
            </div>
            <div class="ab-ms-radio ${aadhaarChecked}"></div>
          </div>
        </div>
        <div class="ab-ms-buttons">
          <button class="ab-ms-btn ab-ms-btn--cancel" onclick="renderScreen(S.ADD_BANK_SELECT)">Cancel</button>
          <button class="ab-ms-btn ab-ms-btn--proceed" onclick="proceedMethod()">Proceed</button>
        </div>
      </div>
    </div>
  </div>`;
}

function selectMethod(method) {
  addBankMethod = method;
  document.querySelectorAll(".ab-ms-radio").forEach((r, i) => {
    r.className = (i === 0 && method === "debit") || (i === 1 && method === "aadhaar")
      ? "ab-ms-radio ab-ms-radio--checked" : "ab-ms-radio";
  });
}

function proceedMethod() {
  if (addBankMethod === "debit") {
    renderScreen(S.ADD_BANK_DEBIT_CARD);
  } else {
    renderScreen(S.ADD_BANK_AADHAAR_CONSENT);
  }
}

// ─── Aadhaar Consent Bottom Sheet ─────────────────────────────
function aadhaarConsentHTML() {
  return `
  <div class="screen screen-ab-aadhaar-consent">
    <div class="ab-gradient-bg"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBack()">←</span></div>
    <div class="ab-select-content">
      <h1 class="ab-title">Which account?</h1>
      <p class="ab-subtitle">Choose the account that you would want to use</p>
      <div class="ab-bank-header">
        <div class="ab-bank-header__info">
          <div class="ab-account-logo">${bankIconSVG()}</div>
          <div class="ab-bank-header__details">
            <span class="ab-bank-header__name">Bharatiya Payments Bank</span>
            <span class="ab-bank-header__num">*** 2453</span>
          </div>
        </div>
        <span class="ab-bank-header__change">Change bank →</span>
      </div>
      <div class="ab-section-label"><span>Select your account</span><span class="ab-section-label__star">✦</span><div class="ab-section-label__line"></div></div>
      <div class="ab-account-list">
        <div class="ab-account-card" onclick="selectBankAccount(0)">
          <div class="ab-account-row">
            <div class="ab-account-info">
              <div class="ab-account-logo">${bankIconSVG()}</div>
              <div class="ab-account-details">
                <span class="ab-account-name">Bharatiya Payments Bank</span>
                <span class="ab-account-ifsc">IFSC - BPB1234IN</span>
              </div>
            </div>
            <div class="ab-radio${addBankSelectedAccount === 0 ? " ab-radio--checked" : ""}"></div>
          </div>
        </div>
        <div class="ab-account-card ab-account-card--has-pin" onclick="selectBankAccount(1)">
          <div class="ab-account-row">
            <div class="ab-account-info">
              <div class="ab-account-logo">${bankIconSVG()}</div>
              <div class="ab-account-details">
                <span class="ab-account-name">Bharatiya Payments Bank</span>
                <span class="ab-account-ifsc">IFSC - HDF1234IN</span>
              </div>
            </div>
            <div class="ab-radio${addBankSelectedAccount === 1 ? " ab-radio--checked" : ""}"></div>
          </div>
          <div class="ab-pin-warning">
            <svg viewBox="0 0 20 20" fill="none" width="20" height="20"><circle cx="10" cy="10" r="8.5" stroke="#e5a100" stroke-width="1.2"/><path d="M10 6v5" stroke="#e5a100" stroke-width="1.3" stroke-linecap="round"/><circle cx="10" cy="14" r=".8" fill="#e5a100"/></svg>
            <span class="ab-pin-warning__text">4 digit UPI PIN not set</span>
            <span class="ab-pin-warning__link">Set UPI PIN</span>
          </div>
        </div>
      </div>
    </div>
    <!-- Aadhaar Consent Bottom Sheet -->
    <div class="ab-ms-overlay">
      <div class="ab-ms-sheet ab-ms-sheet--consent">
        <div class="ab-ms-handle"></div>
        <p class="ab-consent-text">I hereby give my consent to <strong>Bharatiya Payments BANK</strong> to collect & use my Aadhaar number for Aadhaar based authentication for the purpose of providing me UPI based payment facilities. I understand that my Aadhaar number shall be used solely for authenticating my identity through Aadhaar Authentication System for the purpose stated above.</p>
        <div class="ab-ms-buttons">
          <button class="ab-ms-btn ab-ms-btn--cancel" onclick="renderScreen(S.ADD_BANK_METHOD_SELECT)">Cancel</button>
          <button class="ab-ms-btn ab-ms-btn--proceed" onclick="renderScreen(S.ADD_BANK_AADHAAR_NUMBER)">Accept</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ─── Aadhaar Number Entry ─────────────────────────────────────
function aadhaarNumberHTML() {
  let boxes = "";
  for (let i = 0; i < 6; i++) {
    const val = i < addBankAadhaarNumber.length ? addBankAadhaarNumber[i] : "";
    const active = i === addBankAadhaarNumber.length ? " ab-digit--active" : "";
    boxes += `<div class="ab-digit${active}" id="ab-aadh-${i}"><span>${val}</span><div class="ab-digit__line"></div></div>`;
  }
  const maskDigits = "XXXX";
  return `
  <div class="screen screen-ab-aadhaar-num">
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBack()">←</span><span class="ob-page-title">SET UPI PIN</span></div>
    <div class="ab-bank-bar">
      <div class="ab-bank-bar__left">
        <div class="ab-bank-bar__icon">${bankIconSVG()}</div>
        <span class="ab-bank-bar__name">Bharatiya Payments Bank- XXXX2657</span>
      </div>
    </div>
    <div class="ab-aadhaar-content">
      <h2 class="ab-aadhaar-heading">Create 4-digit UPI PIN using your Aadhaar details</h2>
      <p class="ab-aadhaar-desc">Your PIN will be securely saved with your Bank. You will need to enter this PIN every time you make a payment using your Bank Account.</p>
      <div class="ab-aadhaar-input-section">
        <div class="ab-aadhaar-label-row">
          <span class="ab-aadhaar-label">AADHAAR NUMBER</span>
          <img src="assets/aadhar.png" alt="Aadhaar" class="ab-aadhaar-logo" width="24" height="24"/>
        </div>
        <p class="ab-aadhaar-sublabel">First 6-Digits of Aadhaar Number</p>
        <div class="ab-aadhaar-input-row">
          <div class="ab-aadhaar-mask">
            <span class="ab-aadhaar-mask__sep"></span>
            <div class="ab-aadhaar-digits-row" id="ab-aadh-row">${boxes}</div>
          </div>
          <div class="ab-aadhaar-mask-suffix">
            <span>${maskDigits}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="ab-aadhaar-keyboard">
      <div class="ab-aadhaar-numpad">
        ${[1,2,3,4,5,6,7,8,9,"del",0,"go"].map(k => {
          if (k === "del") return '<button class="ab-aadhaar-numpad__key ab-aadhaar-numpad__key--del" onclick="handleAadhaarNumberKey(\'DEL\')">⌫</button>';
          if (k === "go") return '<button class="ab-aadhaar-numpad__key ab-aadhaar-numpad__key--go" onclick="handleAadhaarNumberKey(\'GO\')" id="ab-aadh-go">Go</button>';
          return '<button class="ab-aadhaar-numpad__key" onclick="handleAadhaarNumberKey(\'' + k + '\')">'+k+'</button>';
        }).join("")}
      </div>
    </div>
  </div>`;
}

// ─── Aadhaar OTP Entry ────────────────────────────────────────
function aadhaarOtpHTML() {
  let boxes = "";
  for (let i = 0; i < 6; i++) {
    const val = i < addBankAadhaarOtp.length ? addBankAadhaarOtp[i] : "";
    const active = i === addBankAadhaarOtp.length ? " ab-aadh-otp-digit--active" : "";
    boxes += `<div class="ab-aadh-otp-digit${active}" id="ab-aadhotp-${i}"><span>${val}</span></div>`;
  }
  return `
  <div class="screen screen-ab-aadhaar-otp">
    <div class="ab-aadhaar-otp-header">
      ${statusBarSVG(false)}
      <div class="ab-aadhaar-otp-topbar">
        <span class="ab-aadhaar-otp-cancel" onclick="goBack()">CANCEL</span>
        <div class="ab-aadhaar-otp-upi">
          <svg viewBox="0 0 40 16" fill="none" width="40" height="16"><text x="0" y="13" font-family="Arial" font-weight="bold" font-size="14" fill="white">UPI</text></svg>
        </div>
      </div>
      <div class="ab-aadhaar-otp-bankbar">
        <span class="ab-aadhaar-otp-bankname">Bharatiya Payments BANK</span>
      </div>
      <div class="ab-aadhaar-otp-acctbar">
        <span class="ab-aadhaar-otp-acctnum">XXXXXXXXXXXX</span>
        <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><polyline points="12,4 6,10 12,16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>
    <div class="ab-aadhaar-otp-body">
      <p class="ab-aadhaar-otp-title">ENTER 6 DIGIT OTP</p>
      <div class="ab-aadhaar-otp-row" id="ab-aadhotp-row">${boxes}</div>
      <p class="ab-aadhaar-otp-msg">AADHAAR-OTP has been sent to your registered mobile number via SMS</p>
      <span class="ab-aadhaar-otp-timer">0s</span>
    </div>
    <div class="ab-aadhaar-otp-keyboard">
      <div class="ab-aadhaar-otp-numpad">
        ${[1,2,3,4,5,6,7,8,9,"del",0,"submit"].map(k => {
          if (k === "del") return '<button class="ab-aadhaar-otp-numpad__key ab-aadhaar-otp-numpad__key--del" onclick="handleAadhaarOtpKey(\'DEL\')">⌫</button>';
          if (k === "submit") return '<button class="ab-aadhaar-otp-numpad__key ab-aadhaar-otp-numpad__key--submit" onclick="handleAadhaarOtpKey(\'SUBMIT\')">SUBMIT</button>';
          return '<button class="ab-aadhaar-otp-numpad__key" onclick="handleAadhaarOtpKey(\'' + k + '\')">'+k+'</button>';
        }).join("")}
      </div>
    </div>
  </div>`;
}

// ─── Aadhaar Input Handlers ───────────────────────────────────
function handleAadhaarNumberKey(key) {
  if (key === "DEL") {
    addBankAadhaarNumber = addBankAadhaarNumber.slice(0, -1);
  } else if (key === "GO" && addBankAadhaarNumber.length === 6) {
    renderScreen(S.ADD_BANK_AADHAAR_OTP);
    return;
  } else if (key !== "GO" && addBankAadhaarNumber.length < 6) {
    addBankAadhaarNumber += key;
  }
  updateAadhaarNumberUI();
}

function handleAadhaarOtpKey(key) {
  if (key === "DEL") {
    addBankAadhaarOtp = addBankAadhaarOtp.slice(0, -1);
  } else if (key === "SUBMIT" && addBankAadhaarOtp.length === 6) {
    renderScreen(S.ADD_BANK_SET_PIN);
    return;
  } else if (key !== "SUBMIT" && addBankAadhaarOtp.length < 6) {
    addBankAadhaarOtp += key;
  }
  updateAadhaarOtpUI();
}

function updateAadhaarNumberUI() {
  for (let i = 0; i < 6; i++) {
    const el = document.getElementById("ab-aadh-" + i);
    if (el) {
      el.querySelector("span").textContent = i < addBankAadhaarNumber.length ? addBankAadhaarNumber[i] : "";
      el.classList.toggle("ab-digit--active", i === addBankAadhaarNumber.length);
    }
  }
  const goBtn = document.getElementById("ab-aadh-go");
  if (goBtn) {
    goBtn.classList.toggle("ab-aadhaar-numpad__key--go-active", addBankAadhaarNumber.length === 6);
  }
}

function updateAadhaarOtpUI() {
  for (let i = 0; i < 6; i++) {
    const el = document.getElementById("ab-aadhotp-" + i);
    if (el) {
      el.querySelector("span").textContent = i < addBankAadhaarOtp.length ? addBankAadhaarOtp[i] : "";
      el.classList.toggle("ab-aadh-otp-digit--active", i === addBankAadhaarOtp.length);
    }
  }
}

/* iOS-style numpad for OTP/PIN screens */
function abNumpadHTML(target) {
  const keys = [1,2,3,4,5,6,7,8,9,"del",0,"submit"];
  let h = '<div class="ab-numpad">';
  keys.forEach(k => {
    if (k === "del") {
      h += `<button class="ab-numpad__key ab-numpad__key--del" onclick="handleAddBankKey('${target}','DEL')"><svg viewBox="0 0 24 18" fill="none" width="23" height="17"><path d="M7.5 1h13A2.5 2.5 0 0 1 23 3.5v11a2.5 2.5 0 0 1-2.5 2.5h-13L1 9l6.5-8z" stroke="#0b0b0b" stroke-width="1.3"/><path d="M11 6l6 6M17 6l-6 6" stroke="#0b0b0b" stroke-width="1.3" stroke-linecap="round"/></svg></button>`;
    } else if (k === "submit") {
      h += `<button class="ab-numpad__key ab-numpad__key--submit" onclick="handleAddBankKey('${target}','SUBMIT')"><svg viewBox="0 0 24 24" fill="none" width="24" height="24"><circle cx="12" cy="12" r="11" fill="#1b327e"/><path d="M7 12l3.5 3.5 6.5-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
    } else {
      h += `<button class="ab-numpad__key" onclick="handleAddBankKey('${target}','${k}')">${k}</button>`;
    }
  });
  h += '</div>';
  return h;
}

// ─── Add Bank Account Flow Control ──────────────────────────

// ─── Add Bank Account – Non-Linear Tooltip Guide ────────────
const abTooltipGuide = {
  enabled: true,        // master switch – false after Skip
  shownForScreen: {},   // tracks which screens already showed a tooltip this session
};

const AB_SCREEN_TOOLTIPS = {
  [S.HOME]: {
    element: "#bank-card",
    get desc() { return t("home.welcome_tooltip"); },
    side: "bottom",
    radius: 16,
  },
  [S.ADD_BANK_SELECT]: {
    element: "#ab-tour-select-bank-header",
    desc: "Select bank from the list below and link your bank account to proceed further",
    side: "bottom",
    radius: 12,
  },
  [S.ADD_BANK_METHOD_SELECT]: {
    element: "#ab-tour-method-sheet",
    desc: "Link your bank account via Debit Card",
    side: "top",
    radius: 20,
  },
  [S.ADD_BANK_DEBIT_CARD]: {
    element: "#ab-tour-debit-content",
    desc: "Enter your debit card details to link your bank account",
    side: "bottom",
    radius: 12,
  },
  [S.ADD_BANK_OTP]: {
    element: "#ab-tour-otp-row",
    desc: "Select bank from the list below and link your bank account to proceed further",
    side: "bottom",
    radius: 12,
  },
  [S.ADD_BANK_SET_PIN]: {
    element: "#ab-tour-setpin-row",
    desc: "Your bank will ask you to set a 4 or 6 digit UPI PIN (as per bank rules). This PIN is required to approve UPI payments from your account.\n\nChoose a PIN you can easily remember, keep it confidential, and never share it with anyone.\nBHIM or your bank will never ask for your UPI PIN-stay alert and secure.",
    side: "top",
    radius: 12,
  },
};

function showAbScreenTooltip(state) {
  if (!abTooltipGuide.enabled) return;
  if (abTooltipGuide.shownForScreen[state]) return;

  const step = AB_SCREEN_TOOLTIPS[state];
  if (!step) return;

  abTooltipGuide.shownForScreen[state] = true;

  wait(() => {
    const el = document.querySelector(step.element);
    if (!el) {
      console.warn('AB tooltip target not found:', step.element, '— skipping');
      return;
    }

    let body = `<div class="tt-text">${step.desc}</div>`;
    // Buttons
    body += '<div class="bhim-popover-footer"><div class="bhim-popover-buttons">' +
      '<button class="bhim-btn-skip" onclick="abTourSkip()">Skip</button>' +
      '<button class="bhim-btn-next" onclick="abTourNext()">Next</button>' +
      '</div></div>';

    const dObj = window.driver.js.driver({
      showProgress: false,
      showButtons: [],
      overlayColor: "rgba(0,0,0,0.65)",
      stagePadding: 10,
      stageRadius: step.radius || 12,
      animate: true,
      popoverClass: "bhim-driver-popover ab-driver-popover",
      allowClose: true,
      onDestroyStarted: () => {
        activeDriver = null;
        dObj.destroy();
      },
    });
    dObj.highlight({
      element: step.element,
      popover: {
        title: "",
        description: body,
        side: step.side,
        align: "center",
      },
    });
    window.bhimDriver = dObj;
    activeDriver = dObj;
  }, 400);
}

function abTourSkip() {
  // Disable all remaining Add Bank tooltips for this session
  abTooltipGuide.enabled = false;
  if (activeDriver) { activeDriver.destroy(); activeDriver = null; }
}

function abTourNext() {
  // Close tooltip — user stays on current interactive screen
  if (activeDriver) { activeDriver.destroy(); activeDriver = null; }
}

function startAddBankFlow() {
  abTooltipGuide.enabled = true;
  abTooltipGuide.shownForScreen = {};
  renderScreen(S.ADD_BANK_SELECT);
}


function selectBankAccount(idx) {
  addBankSelectedAccount = idx;
  // Re-render to update radio buttons
  const container = document.querySelector(".ab-account-list");
  if (container) {
    document.querySelectorAll(".ab-radio").forEach((r, i) => {
      if (i === idx) r.className = "ab-radio ab-radio--checked";
      else r.className = "ab-radio";
    });
  }
}

function handleAddBankKey(target, key) {
  if (target === "cbpin") {
    if (key === "DEL") checkBalancePinInput = checkBalancePinInput.slice(0, -1);
    else if (key === "SUBMIT" && checkBalancePinInput.length === 4) {
      balanceRevealed = true;
      checkBalancePinInput = "";
      if (activeDriver) { activeDriver.destroy(); activeDriver = null; }
      // Allow the "Balance visible" tooltip to show on HOME
      cbTooltipGuide.shownForScreen[S.HOME] = false;
      renderScreen(S.HOME);
      return;
    } else if (key !== "SUBMIT" && checkBalancePinInput.length < 4) checkBalancePinInput += String(key);
    updateCheckBalancePinUI();
    return;
  }
  if (target === "otp") {
    if (key === "DEL") addBankOtp = addBankOtp.slice(0, -1);
    else if (key === "SUBMIT" && addBankOtp.length === 4) { renderScreen(S.ADD_BANK_SET_PIN); return; }
    else if (key !== "SUBMIT" && addBankOtp.length < 4) addBankOtp += key;
    updateBankOtpUI();
  } else if (target === "pin") {
    if (key === "DEL") addBankPin = addBankPin.slice(0, -1);
    else if (key === "SUBMIT" && addBankPin.length === 4) { renderScreen(S.ADD_BANK_CONFIRM_PIN); return; }
    else if (key !== "SUBMIT" && addBankPin.length < 4) addBankPin += key;
    updateSetPinUI();
  } else if (target === "cpin") {
    if (key === "DEL") addBankConfirmPin = addBankConfirmPin.slice(0, -1);
    else if (key === "SUBMIT" && addBankConfirmPin.length === 4) { renderScreen(S.ADD_BANK_SUCCESS); return; }
    else if (key !== "SUBMIT" && addBankConfirmPin.length < 4) addBankConfirmPin += key;
    updateConfirmPinUI();
  }
}

function updateCheckBalancePinUI() {
  const display = (i) => {
    if (i >= checkBalancePinInput.length) return "";
    return checkBalancePinMasked ? "•" : checkBalancePinInput[i];
  };
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById("cb-pin-" + i);
    if (el) {
      const span = el.querySelector("span");
      if (span) span.textContent = display(i);
      el.classList.toggle("ab-pin-digit--active", i === checkBalancePinInput.length);
    }
  }
  const labelEl = document.getElementById("cb-pin-show-label");
  if (labelEl) labelEl.textContent = checkBalancePinMasked ? "Show" : "Hide";
}

function toggleCheckBalancePinMask() {
  checkBalancePinMasked = !checkBalancePinMasked;
  updateCheckBalancePinUI();
}

function updateDebitCardUI() {
  // Update card digit boxes
  for (let i = 0; i < 6; i++) {
    const el = document.getElementById("ab-card-" + i);
    if (el) {
      el.querySelector("span").textContent = i < addBankCardDigits.length ? addBankCardDigits[i] : "";
      el.classList.toggle("ab-digit--active", addBankInputFocus === "card" && i === addBankCardDigits.length);
    }
  }
  // Update expiry digit boxes
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById("ab-exp-" + i);
    if (el) {
      el.querySelector("span").textContent = i < addBankExpiry.length ? addBankExpiry[i] : "";
      el.classList.toggle("ab-digit--active", addBankInputFocus === "expiry" && i === addBankExpiry.length);
    }
  }
  // Update button
  const btn = document.getElementById("ab-debit-confirm");
  if (btn) {
    const canConfirm = addBankCardDigits.length === 6 && addBankExpiry.length === 4;
    btn.className = canConfirm ? "ob-btn ob-btn--primary" : "ob-btn ob-btn--disabled";
    btn.onclick = canConfirm ? function() { renderScreen(S.ADD_BANK_OTP); } : null;
  }
}

function updateBankOtpUI() {
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById("ab-otp-" + i);
    if (el) {
      el.querySelector("span").textContent = i < addBankOtp.length ? addBankOtp[i] : "";
      el.classList.toggle("ab-pin-digit--active", i === addBankOtp.length);
    }
  }
}

function updateSetPinUI() {
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById("ab-pin-" + i);
    if (el) {
      el.querySelector("span").textContent = i < addBankPin.length ? addBankPin[i] : "";
      el.classList.toggle("ab-pin-digit--active", i === addBankPin.length);
    }
  }
}

function updateConfirmPinUI() {
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById("ab-cpin-" + i);
    if (el) {
      el.querySelector("span").textContent = i < addBankConfirmPin.length ? addBankConfirmPin[i] : "";
      el.classList.toggle("ab-pin-digit--active", i === addBankConfirmPin.length);
    }
  }
}

// ─── Main Render ─────────────────────────────────────────────
function renderScreen(state) {
  clearTimers();
  dismissSmCoachMark();
  dismissSpCoachMark();
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
  // Add Bank Account flow resets
  if (state === S.ADD_BANK_SELECT) { addBankSelectedAccount = 0; }
  if (state === S.ADD_BANK_DEBIT_CARD) { addBankCardDigits = ""; addBankExpiry = ""; addBankInputFocus = "card"; }
  if (state === S.ADD_BANK_METHOD_SELECT) { addBankMethod = "debit"; }
  if (state === S.ADD_BANK_OTP) { addBankOtp = ""; }
  if (state === S.ADD_BANK_SET_PIN) { addBankPin = ""; }
  if (state === S.ADD_BANK_CONFIRM_PIN) { addBankConfirmPin = ""; }
  if (state === S.ADD_BANK_AADHAAR_NUMBER) { addBankAadhaarNumber = ""; }
  if (state === S.ADD_BANK_AADHAAR_OTP) { addBankAadhaarOtp = ""; }
  if (state === S.CHECK_BALANCE_PIN) { checkBalancePinInput = ""; }
  // Scan and Pay flow resets
  if (state === S.ENTER_AMOUNT) { scanPayAmount = ""; }
  if (state === S.ENTER_UPI_PIN) { scanPayUpiPin = ""; scanPayPinMasked = true; }
  // Send to Mobile flow resets
  if (state === S.SEND_MOBILE_CONTACTS) { smContactSearch = ""; }
  if (state === S.SEND_MOBILE_PIN) { smPinInput = ""; }

  phoneShell.innerHTML = getScreenHTML(state);
  currentState = state;
  handlePostRender(state);
}

// ─── Scan and Pay Screen Renderers ──────────────────────────

function scan1HTML() {
  return `
  <div class="screen screen-scan1">
    <div class="scan1-gradient-bg"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header">
      <span class="ob-back-arrow" onclick="goBack()">←</span>
    </div>
    <div class="scan1-stepper">
      <div class="scan1-stepper__line"></div>
      <span class="scan1-stepper__star">✦</span>
      <span class="scan1-stepper__text">SEND MONEY TO ANY UPI APP</span>
      <span class="scan1-stepper__star">✦</span>
      <div class="scan1-stepper__line"></div>
    </div>
    <div class="scan1-camera">
      <div class="scan1-camera__bg" style="background:#000"></div>
      <div class="scan1-camera__area">
        <div class="scan1-corner scan1-corner--tl"></div>
        <div class="scan1-corner scan1-corner--tr"></div>
        <div class="scan1-corner scan1-corner--bl"></div>
        <div class="scan1-corner scan1-corner--br"></div>
        <div class="scan1-scanline"></div>
      </div>
      <div class="scan1-side-btns">
        <button class="scan1-side-btn" aria-label="Flashlight">
          <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M10 2v5l3-1.5v7a3 3 0 01-6 0v-7L10 7V2z" stroke="#0b0b0b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="scan1-side-btn" aria-label="Gallery">
          <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="2" y="3" width="16" height="14" rx="2" stroke="#0b0b0b" stroke-width="1.2"/><circle cx="7" cy="8" r="1.5" stroke="#0b0b0b" stroke-width="1"/><path d="M2 14l4-4 3 3 4-4 5 5" stroke="#0b0b0b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
    <div class="scan1-recent">
      <div class="scan1-recent__header">
        <div class="scan1-stepper__line"></div>
        <span class="scan1-stepper__star">✦</span>
        <span class="scan1-stepper__text">RECENT SCANS</span>
        <span class="scan1-stepper__star">✦</span>
        <div class="scan1-stepper__line"></div>
      </div>
      <div class="scan1-recent__list">
        <div class="scan1-recent__item">
          <div class="scan1-avatar scan1-avatar--green"><img src="assets/sample_avatar_real_image.png" alt="" class="scan1-avatar__img" style="object-fit:cover"/></div>
          <span class="scan1-recent__name">Hari Hara Subrama...</span>
        </div>
        <div class="scan1-recent__item">
          <div class="scan1-avatar scan1-avatar--yellow"><span>RS</span></div>
          <span class="scan1-recent__name">Rakesh Sharma</span>
        </div>
        <div class="scan1-recent__item">
          <div class="scan1-avatar scan1-avatar--yellow"><span>PG</span></div>
          <span class="scan1-recent__name">Patel General...</span>
        </div>
        <div class="scan1-recent__item">
          <div class="scan1-avatar scan1-avatar--pink"><span>A</span></div>
          <span class="scan1-recent__name">Akriti Bansal</span>
        </div>
      </div>
    </div>
    <div class="scan1-footer">
      <img src="assets/upi_dark_sm.svg" alt="UPI" class="scan1-footer__upi" width="46" height="20"/>
    </div>
    ${homeIndHTML()}
  </div>`;
}

function scan2HTML() {
  return `
  <div class="screen screen-scan2">
    <div class="scan2-gradient-bg"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header">
      <span class="ob-back-arrow" onclick="goBack()" style="cursor:pointer">←</span>
    </div>
    <div class="scan1-stepper">
      <div class="scan1-stepper__line"></div>
      <span class="scan1-stepper__star">✦</span>
      <span class="scan1-stepper__text">SEND MONEY TO ANY UPI APP</span>
      <span class="scan1-stepper__star">✦</span>
      <div class="scan1-stepper__line"></div>
    </div>
    <div class="scan2-camera">
      <img src="assets/sample_qr_code.png" alt="" class="scan2-camera__bg"/>
      <div class="scan2-camera__area">
        <div class="scan1-corner scan1-corner--tl"></div>
        <div class="scan1-corner scan1-corner--tr"></div>
        <div class="scan1-corner scan1-corner--bl"></div>
        <div class="scan1-corner scan1-corner--br"></div>
      </div>
    </div>
    <div class="scan2-result" style="display:none"></div>
    <div class="scan1-recent">
      <div class="scan1-recent__header">
        <div class="scan1-stepper__line"></div>
        <span class="scan1-stepper__star">✦</span>
        <span class="scan1-stepper__text">RECENT SCANS</span>
        <span class="scan1-stepper__star">✦</span>
        <div class="scan1-stepper__line"></div>
      </div>
      <div class="scan1-recent__list">
        <div class="scan1-recent__item">
          <div class="scan1-avatar scan1-avatar--green"><img src="assets/sample_avatar_real_image.png" alt="" class="scan1-avatar__img" style="object-fit:cover"/></div>
          <span class="scan1-recent__name">Hari Hara Subrama...</span>
        </div>
        <div class="scan1-recent__item">
          <div class="scan1-avatar scan1-avatar--yellow"><span>RS</span></div>
          <span class="scan1-recent__name">Rakesh Sharma</span>
        </div>
        <div class="scan1-recent__item">
          <div class="scan1-avatar scan1-avatar--yellow"><span>PG</span></div>
          <span class="scan1-recent__name">Patel General...</span>
        </div>
        <div class="scan1-recent__item">
          <div class="scan1-avatar scan1-avatar--pink"><span>A</span></div>
          <span class="scan1-recent__name">Akriti Bansal</span>
        </div>
      </div>
    </div>
    <div style="padding: 0 16px 16px;">
      <button class="sp-cta-btn" onclick="renderScreen(S.ENTER_AMOUNT)">Proceed</button>
    </div>
    <div class="scan1-footer">
      <img src="assets/upi_dark_sm.svg" alt="UPI" class="scan1-footer__upi" width="46" height="20"/>
    </div>
    ${homeIndHTML()}
  </div>`;
}

function enterAmountHTML() {
  const amountDisplay = scanPayAmount || "";
  const hasAmount = scanPayAmount.length > 0 && parseInt(scanPayAmount) > 0;
  const ctaClass = hasAmount ? "sp-cta-btn" : "sp-cta-btn sp-cta-btn--disabled";
  return `
  <div class="screen screen-enter-amount">
    <div class="ea-gradient-bg"></div>
    ${statusBarSVG(true)}
    <div class="ob-page-header" style="position:relative;z-index:1">
      <span class="ob-back-arrow" onclick="goBack()" style="cursor:pointer">←</span>
    </div>
    <div class="ea-body">
      <div class="ea-user-section">
        <div class="ea-user-info">
          <div class="ea-user-avatar scan1-avatar--green" style="width:56px;height:56px;border-radius:300px;overflow:hidden;position:relative">
            <img src="assets/sample_avatar_real_image.png" alt="" class="scan1-avatar__img"/>
          </div>
          <p class="ea-user-name">Paying ${scanPayPayee.name}</p>
        </div>
        <div class="ea-upi-pill">
          <img src="assets/upi.svg" alt="" class="ea-upi-pill__icon" width="24" height="12"/>
          <span class="ea-upi-pill__text">${scanPayPayee.upi}</span>
        </div>
      </div>
      <div class="ea-amount-area">
        <div class="ea-amount-display" id="ea-amount-display">
          <span class="ea-amount-prefix">₹</span>
          <span class="ea-amount-value" id="ea-amount-value">${amountDisplay}</span>
          <span class="ea-amount-cursor" id="ea-amount-cursor">|</span>
        </div>
        <p class="ea-amount-words" id="ea-amount-words"></p>
      </div>
      <div class="ea-note-pill">
        <input type="text" class="ea-note-input" placeholder="Note" value="${scanPayNote}" 
               oninput="scanPayNote=this.value" 
               onfocus="document.getElementById('ea-amount-cursor').style.visibility='hidden'" 
               onblur="document.getElementById('ea-amount-cursor').style.visibility='visible'" />
      </div>
    </div>
    <div class="ea-bottom">
      <div class="ea-cta-wrap">
        <button class="${ctaClass}" id="ea-next-btn" onclick="onEnterAmountNext()">Next</button>
      </div>
      <div class="ea-keyboard">${spNumpadHTML("amount")}</div>
    </div>
    ${homeIndHTML()}
  </div>`;
}

function selectAccountHTML() {
  const c = scanPayPayee;
  const amount = parseInt(scanPayAmount || "0", 10);
  const words = amount > 0 ? numberToWords(amount).replace(/\b\w/g, (m) => m.toUpperCase()) + " Rupees Only" : "";

  return `
  <div class="screen screen-sm-review">
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBack()">←</span></div>
    <div class="sm-review-body">
      <div class="sm-review-payee">
        <div class="scan1-avatar scan1-avatar--green" style="width:64px;height:64px;margin:0 auto 12px;border-radius:50%;overflow:hidden">
          <img src="assets/sample_avatar_real_image.png" alt="" class="scan1-avatar__img" style="width:100%;height:100%;object-fit:cover"/>
        </div>
        <p class="sm-review-payee__name">${c.name}</p>
        <div class="sm-review-upi-pill">
          <svg class="sm-review-upi-icon" width="10" height="14" viewBox="0 0 10 14" fill="none"><path d="M3.5 0.5L9.5 5.5L6.5 7L9.5 13.5L3.5 8.5L6.5 7L3.5 0.5Z" fill="#097939"/></svg>
          <span>${c.upi}</span>
        </div>
      </div>
      <div class="sm-review-amount-block">
        <p class="sm-review-amount">₹ ${amount || ""}</p>
        <p class="sm-review-words">${words}</p>
      </div>
      <div class="sm-review-comment-pill">
        <input class="sm-review-comment-input" type="text" placeholder="Add a comment" value="${scanPayNote}" oninput="scanPayNote=this.value" />
      </div>
    </div>
    <div class="sm-review-bottom-sheet">
      <div class="sm-review-sheet-title">Select account to pay with</div>
      <div class="sm-review-sheet-body">
        <p class="sm-review-bank-heading">Bank account</p>
        <div class="sm-review-bank-card">
          <div class="sm-review-bank-card__header">
            <div class="sm-review-bank-card__info">
              <div class="sm-review-bank-logo">${bankIconSVG()}</div>
              <div class="sm-review-bank-detail">
                <span class="sm-review-bank-detail__name">Bharatiya Payments Bank</span>
                <span class="sm-review-bank-detail__acc">*** 2453 • DEFAULT</span>
              </div>
            </div>
            <svg class="sm-review-bank-card__arrow" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M12 20l4-4-4-4" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="sm-review-bank-card__footer">
            <a class="sm-review-check-bal" href="javascript:void(0)">Check Balance</a>
          </div>
        </div>
      </div>
      <div class="sm-review-cta-wrap">
        <button class="sm-review-cta-btn" onclick="renderScreen(S.ENTER_UPI_PIN)">Pay</button>
      </div>
    </div>
    ${homeIndHTML()}
  </div>`;
}

function enterUpiPinHTML() {
  let boxes = "";
  for (let i = 0; i < 4; i++) {
    const raw = i < scanPayUpiPin.length ? scanPayUpiPin[i] : "";
    const val = raw && scanPayPinMasked ? "•" : raw;
    const active = i === scanPayUpiPin.length ? " ab-pin-digit--active" : "";
    boxes += `<div class="ab-pin-digit${active}" id="sp-pin-${i}"><span>${val}</span><div class="ab-pin-digit__line"></div></div>`;
  }
  const showLabel = scanPayPinMasked ? "Show" : "Hide";
  return `
  <div class="screen screen-enter-upi-pin">
    ${statusBarSVG(true)}
    <div class="sp-bank-header">
      <div class="sp-bank-header__logo">
        <img src="assets/bank_logo.png" alt="" class="sp-bank-header__logo-img"/>
      </div>
    </div>
    <div class="sp-bank-name-bar">
      <span class="sp-bank-name-bar__text">XXXXXXXXXXXX</span>
      <svg class="sp-bank-name-bar__chevron" viewBox="0 0 12 12" fill="none" width="16" height="16"><path d="M3 4.5l3 3 3-3" stroke="#fafafa" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="sp-pin-content" id="sp-pin-content">
      <p class="ab-pin-heading">ENTER UPI PIN</p>
      <div class="ab-pin-row" id="sp-pin-row">${boxes}</div>
      <p class="ab-pin-show" onclick="toggleScanPayPinMask()" role="button" tabindex="0"><span class="ab-pin-show__circle"></span> <span id="sp-pin-show-label">${showLabel}</span></p>
    </div>
    <div class="sp-powered-by">
      <img src="assets/upi_dark_sm.svg" onerror="this.src='assets/upi.svg'" alt="UPI" width="46" height="20" />
    </div>
    <div class="ab-pin-keyboard">${spNumpadHTML("upipin")}</div>
    ${homeIndHTML()}
  </div>`;
}

function paymentSuccessHTML() {
  return `
  <div class="screen screen-ab-success">
    ${statusBarSVG(false)}
    <div class="ab-success-content" id="sp-success-content">
      <div class="ab-success-badge">
        <img src="assets/paymentDone.gif" alt="Success" width="110" height="80" autoplay />
      </div>
      <p class="ab-success-text" id="sp-success-text">Payment Successful</p>
    </div>
  </div>`;
}


// ─── Debited Transaction (Scan & Pay Receipt) ────────────────
function debitedTransactionHTML() {
  const c = scanPayPayee;
  const amount = parseInt(scanPayAmount || "0", 10) || 0;
  const txId = "T" + Date.now().toString().slice(-10);
  const dt = new Date();
  const dateStr = dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
  const timeStr = dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

  return `
  <div class="screen screen-sm-receipt">
    ${statusBarSVG(false)}
    <div class="sm-receipt-hero">
      <div class="sm-receipt-hero__check">
        <img src="./assets/tick.gif" alt="Success" class="sm-receipt-hero__tick" />
      </div>
      <div class="sm-receipt-hero__payee">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="#fff" stroke-width="1"/><path d="M1.5 11c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="#fff" stroke-width="1" stroke-linecap="round"/></svg>
        <span>Paid to ${c.name}</span>
        <img src="./assets/curve.png" alt="Success" class="curve-path" />
      </div>
      <p class="sm-receipt-hero__amount">₹${amount}</p>
    </div>
    <div class="sm-receipt-card" id="sm-receipt-card">
      <div class="sm-receipt-info-grid">
        <div class="sm-receipt-info-item">
          <span class="sm-receipt-info-item__label">Banking Name</span>
          <span class="sm-receipt-info-item__value">Samartha Bhandhar Gruha Udyog</span>
        </div>
      </div>
      <div class="sm-receipt-info-grid sm-receipt-info-grid--two">
        <div class="sm-receipt-info-item">
          <span class="sm-receipt-info-item__label">Transaction ID</span>
          <div class="sm-receipt-info-item__value sm-receipt-info-item__value--copy">
            <span>${txId}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="#626262" stroke-width="1.2"/><path d="M3 11V3.5A.5.5 0 013.5 3H11" stroke="#626262" stroke-width="1.2" stroke-linecap="round"/></svg>
          </div>
        </div>
        <div class="sm-receipt-info-item">
          <span class="sm-receipt-info-item__label">Date &amp; Time</span>
          <span class="sm-receipt-info-item__value">${dateStr}, ${timeStr}</span>
        </div>
      </div>
      <div class="sm-receipt-divider"></div>
      <div class="sm-receipt-more">
        <span>More details</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#0b0b0b" stroke-width="1.2"/><path d="M10 7v6M7 13l3 0" stroke="#0b0b0b" stroke-width="1.2" stroke-linecap="round"/></svg>
      </div>
    </div>
    <div class="sm-receipt-options">
      <div class="sm-receipt-option">
        <div class="sm-receipt-option__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3.27 13.6L12 22.33l8.73-8.73M12 2v20" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <span class="sm-receipt-option__label">Split this<br>expense</span>
      </div>
      <div class="sm-receipt-option">
        <div class="sm-receipt-option__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="#0b0b0b" stroke-width="1.5"/><circle cx="6" cy="12" r="3" stroke="#0b0b0b" stroke-width="1.5"/><circle cx="18" cy="19" r="3" stroke="#0b0b0b" stroke-width="1.5"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#0b0b0b" stroke-width="1.5"/></svg>
        </div>
        <span class="sm-receipt-option__label">Share<br>screenshot</span>
      </div>
    </div>
    <div class="sm-receipt-ad">
      <div class="sm-receipt-ad__text">
        <p class="sm-receipt-ad__title">It's Payday!</p>
        <p class="sm-receipt-ad__sub">Treat yourself with a nice meal with <strong>Swiggy</strong></p>
        <span class="sm-receipt-ad__cta">Claim your <strong>20% off</strong></span>
      </div>
    </div>
    <div class="sm-receipt-powered">
      <img src="assets/upi_dark_sm.svg" onerror="this.src='assets/upi.svg'" alt="UPI" width="46" height="20" />
    </div>
    <div class="sm-receipt-footer">
      <button class="sm-receipt-btn sm-receipt-btn--light" onclick="renderScreen(S.SCAN_1)">Send again</button>
      <button class="sm-receipt-btn sm-receipt-btn--primary" onclick="renderScreen(S.HOME)">Home</button>
    </div>
    ${homeIndHTML()}
  </div>`;
}

// ─── Send to Mobile Screen Renderers ─────────────────────────
function getSmSelectedContact() {
  return sendMobileContacts.find((c) => c.id === smSelectedContactId) || sendMobileContacts[0];
}

function getFilteredSendMobileContacts() {
  const q = smContactSearch.trim().toLowerCase();
  if (!q) return sendMobileContacts;
  return sendMobileContacts.filter((c) =>
    c.name.toLowerCase().includes(q) || c.mobile.includes(q)
  );
}

function renderSmAvatar(contact, sizeCls) {
  const textColor = contact.color === "#f9e88f" || contact.color === "#efb2b5" ? "#000" : "#fff";
  return `<div class="${sizeCls}" style="background:${contact.color};color:${textColor}"><span>${contact.avatar}</span></div>`;
}

function sendMobileContactsHTML() {
  const filtered = getFilteredSendMobileContacts();
  const recents = sendMobileContacts.filter((c) => c.recent);

  // Build 4-column rows for recents grid
  const rows = [];
  for (let i = 0; i < recents.length; i += 4) rows.push(recents.slice(i, i + 4));
  const recentsGridHTML = rows.map(row =>
    `<div class="sm-recents-row">${row.map(c =>
      `<button class="sm-recent-item" onclick="selectSendMobileContact('${c.id}')">
        ${renderSmAvatar(c, "sm-avatar sm-avatar--md")}
        <span class="sm-recent-item__name">${c.name.length > 14 ? c.name.slice(0, 14) + '...' : c.name}</span>
      </button>`
    ).join("")}${row.length === 4 ? "" : ""}</div>`
  ).join("");

  // contacts list (non-recents)
  const contacts = filtered.filter(c => !c.recent);
  const listHTML = contacts
    .map(
      (c) => `<button class="sm-contact-item" onclick="selectSendMobileContact('${c.id}')">
        ${renderSmAvatar(c, "sm-avatar sm-avatar--lg")}
        <div class="sm-contact-item__info">
          <span class="sm-contact-item__name">${c.name}</span>
          <span class="sm-contact-item__mobile">${c.mobile}</span>
        </div>
        <span class="sm-contact-item__menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill="#626262"/><circle cx="12" cy="12" r="1.5" fill="#626262"/><circle cx="12" cy="19" r="1.5" fill="#626262"/></svg>
        </span>
      </button>`
    )
    .join("");

  return `
  <div class="screen screen-sm-contacts">
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBack()">←</span><span class="ob-page-title">Send Money to any UPI App</span></div>
    <div class="sm-contacts-wrap">
      <div class="sm-search-row">
        <div class="sm-search-pill">
          <svg class="sm-search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M9.167 15.833a6.667 6.667 0 1 0 0-13.333 6.667 6.667 0 0 0 0 13.333ZM17.5 17.5l-3.625-3.625" stroke="#626262" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <input id="sm-search-input" class="sm-search-input" type="text" placeholder="Search by name or mobile number" value="${smContactSearch}" oninput="updateSendMobileSearch(this.value)" />
        </div>
      </div>
      <div class="sm-section">
        <div class="sm-section__header">
          <span class="sm-section__title">Recents</span>
          <span class="sm-section__star">✦</span>
          <span class="sm-section__line"></span>
        </div>
        <div class="sm-recents-grid">${recentsGridHTML}</div>
      </div>
      <div class="sm-section sm-section--list">
        <div class="sm-section__header">
          <span class="sm-section__title">Contacts</span>
          <span class="sm-section__star">✦</span>
          <span class="sm-section__line"></span>
        </div>
        <div class="sm-contacts-list">${listHTML || '<p class="sm-empty">No contacts found</p>'}</div>
      </div>
    </div>
    ${homeIndHTML()}
  </div>`;
}

function sendMobileChatHTML() {
  const c = getSmSelectedContact();
  const payEnabled = parseInt(smChatAmount || "0", 10) > 0;
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return `
  <div class="screen screen-sm-chat">
    ${statusBarSVG(true)}
    <div class="sm-chat-header">
      <span class="ob-back-arrow" onclick="goBack()">←</span>
      ${renderSmAvatar(c, "sm-avatar sm-avatar--lg")}
      <div class="sm-chat-header__info">
        <span class="sm-chat-header__name">${c.name}</span>
        <span class="sm-chat-header__phone">+91 ${c.mobile}</span>
      </div>
    </div>
    <div class="sm-chat-body">
      <div class="sm-chat-date-sep">
        <span class="sm-chat-date-sep__line"></span>
        <span class="sm-chat-date-sep__star">✦</span>
        <span class="sm-chat-date-sep__text">${dateStr}</span>
        <span class="sm-chat-date-sep__star">✦</span>
        <span class="sm-chat-date-sep__line"></span>
      </div>
      <div class="sm-chat-bubble-wrap">
        <div class="sm-chat-bubble--payment">
          <p class="sm-chat-bubble__label">Payment to you</p>
          <p class="sm-chat-bubble__amount">₹2,000</p>
          <div class="sm-chat-bubble__divider"></div>
          <div class="sm-chat-bubble__footer">
            <div class="sm-chat-bubble__status">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#16a34a" fill="#16a34a"/><path d="M5.5 8l2 2 3.5-3.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Paid • 3:06 PM</span>
            </div>
            <svg class="sm-chat-bubble__arrow" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 14l4-4-4-4" stroke="#353535" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>
      </div>
    </div>
    <div class="sm-chat-footer" id="sm-chat-footer">
      <div class="sm-chat-footer__input-wrap">
        <input class="sm-chat-footer__input" type="number" min="1" placeholder="Enter amount" value="${smChatAmount}" oninput="updateSendMobileAmount(this.value)" />
      </div>
      <button class="sm-chat-footer__pay${payEnabled ? "" : " sm-chat-footer__pay--disabled"}" onclick="proceedSendMobileReview()">Pay</button>
    </div>
    ${homeIndHTML()}
  </div>`;
}

function sendMobileReviewHTML() {
  const c = getSmSelectedContact();
  const amount = parseInt(smChatAmount || "0", 10);
  const words = amount > 0 ? numberToWords(amount).replace(/\b\w/g, (m) => m.toUpperCase()) + " Rupees Only" : "";
  return `
  <div class="screen screen-sm-review">
    ${statusBarSVG(true)}
    <div class="ob-page-header"><span class="ob-back-arrow" onclick="goBack()">←</span></div>
    <div class="sm-review-body">
      <div class="sm-review-payee">
        ${renderSmAvatar(c, "sm-avatar sm-avatar--xl")}
        <p class="sm-review-payee__name">${c.name}</p>
        <div class="sm-review-upi-pill">
          <svg class="sm-review-upi-icon" width="10" height="14" viewBox="0 0 10 14" fill="none"><path d="M3.5 0.5L9.5 5.5L6.5 7L9.5 13.5L3.5 8.5L6.5 7L3.5 0.5Z" fill="#097939"/></svg>
          <span>+91 ${c.mobile}@upi</span>
        </div>
      </div>
      <div class="sm-review-amount-block">
        <p class="sm-review-amount">₹ ${amount || ""}</p>
        <p class="sm-review-words">${words}</p>
      </div>
      <div class="sm-review-comment-pill">
        <input class="sm-review-comment-input" type="text" placeholder="Add a comment" value="${smReviewNote}" oninput="smReviewNote=this.value" />
      </div>
    </div>
    <div class="sm-review-bottom-sheet">
      <div class="sm-review-sheet-title">Select account to pay with</div>
      <div class="sm-review-sheet-body">
        <p class="sm-review-bank-heading">Bank account</p>
        <div class="sm-review-bank-card">
          <div class="sm-review-bank-card__header">
            <div class="sm-review-bank-card__info">
              <div class="sm-review-bank-logo">A</div>
              <div class="sm-review-bank-detail">
                <span class="sm-review-bank-detail__name">ABC Banking Ltd</span>
                <span class="sm-review-bank-detail__acc">*** 2453 • DEFAULT</span>
              </div>
            </div>
            <svg class="sm-review-bank-card__arrow" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M12 20l4-4-4-4" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="sm-review-bank-card__footer">
            <a class="sm-review-check-bal" href="javascript:void(0)">Check Balance</a>
          </div>
        </div>
      </div>
      <div class="sm-review-cta-wrap">
        <button class="sm-review-cta-btn" onclick="renderScreen(S.SEND_MOBILE_PIN)">Next</button>
      </div>
    </div>
    ${homeIndHTML()}
  </div>`;
}

function sendMobilePinHTML() {
  let boxes = "";
  for (let i = 0; i < 4; i++) {
    const v = i < smPinInput.length ? "•" : "";
    const active = i === smPinInput.length ? " sm-pin-digit--active" : "";
    boxes += `<div class="sm-pin-digit${active}" id="sm-pin-${i}"><span class="sm-pin-digit__val">${v}</span><div class="sm-pin-digit__line"></div></div>`;
  }
  return `
  <div class="screen screen-sm-pin">
    ${statusBarSVG(true)}
    <div class="sm-pin-bank-bar">
      <span class="sm-pin-bank-bar__name">IDBI Bank Limited</span>
      <svg class="sm-pin-bank-bar__upi" width="58" height="24" viewBox="0 0 58 24" fill="none"><text x="0" y="18" font-size="12" font-weight="700" fill="#6b7280">UPI</text><text x="20" y="18" font-size="8" fill="#6b7280">UNIFIED PAYMENTS</text><text x="20" y="24" font-size="8" fill="#6b7280">INTERFACE</text></svg>
    </div>
    <div class="sm-pin-acct-bar">
      <span class="sm-pin-acct-bar__text">XXXXXXXXXXXX</span>
      <svg class="sm-pin-acct-bar__arrow" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 8l3 3 3-3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="sm-pin-center">
      <p class="sm-pin-title">ENTER UPI PIN</p>
      <div class="sm-pin-row" id="sm-pin-row">${boxes}</div>
      <div class="sm-pin-show">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="#a0a0a0" stroke-width="1.2"/><circle cx="8" cy="8" r="2" stroke="#a0a0a0" stroke-width="1.2"/></svg>
        <span>Show</span>
      </div>
    </div>
    <div class="sm-pin-keyboard">${spNumpadHTML("smpin")}</div>
    ${homeIndHTML()}
  </div>`;
}

function sendMobileSuccessHTML() {
  return `
  <div class="screen screen-sm-success">
    ${statusBarSVG(false)}
    <div class="sm-success-wrap" id="sm-success-wrap">
      <img src="./assets/paymentDone.gif" alt="Payment Successful" class="sm-success-gif" />
      <p class="sm-success-text" id="sm-success-text">Payment Successful</p>
    </div>
    ${homeIndHTML()}
  </div>`;
}

function sendMobileReceiptHTML() {
  const c = getSmSelectedContact();
  const amount = parseInt(smChatAmount || "0", 10) || 0;
  const txId = "SM" + Date.now().toString().slice(-10);
  const dt = new Date();
  const dateStr = dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
  const timeStr = dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  return `
  <div class="screen screen-sm-receipt">
    ${statusBarSVG(false)}
    <div class="sm-receipt-hero">
      <div class="sm-receipt-hero__check">
        <img src="./assets/tick.gif" alt="Success" class="sm-receipt-hero__tick" />
      </div>
      <div class="sm-receipt-hero__payee">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="#fff" stroke-width="1"/><path d="M1.5 11c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="#fff" stroke-width="1" stroke-linecap="round"/></svg>
        <span>Paid to ${c.name}</span>
        <img src="./assets/curve.png" alt="Success" class="curve-path" />
      </div>
      <p class="sm-receipt-hero__amount">₹${amount}</p>
    </div>
    <div class="sm-receipt-card" id="sm-receipt-card">
      <div class="sm-receipt-info-grid">
        <div class="sm-receipt-info-item">
          <span class="sm-receipt-info-item__label">Banking Name</span>
          <span class="sm-receipt-info-item__value">ABC Banking Ltd</span>
        </div>
      </div>
      <div class="sm-receipt-info-grid sm-receipt-info-grid--two">
        <div class="sm-receipt-info-item">
          <span class="sm-receipt-info-item__label">Transaction ID</span>
          <div class="sm-receipt-info-item__value sm-receipt-info-item__value--copy">
            <span>${txId}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="#626262" stroke-width="1.2"/><path d="M3 11V3.5A.5.5 0 013.5 3H11" stroke="#626262" stroke-width="1.2" stroke-linecap="round"/></svg>
          </div>
        </div>
        <div class="sm-receipt-info-item">
          <span class="sm-receipt-info-item__label">Date &amp; Time</span>
          <span class="sm-receipt-info-item__value">${dateStr}, ${timeStr}</span>
        </div>
      </div>
      <div class="sm-receipt-divider"></div>
      <div class="sm-receipt-more">
        <span>More details</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#0b0b0b" stroke-width="1.2"/><path d="M10 7v6M7 13l3 0" stroke="#0b0b0b" stroke-width="1.2" stroke-linecap="round"/></svg>
      </div>
    </div>
    <div class="sm-receipt-options">
      <div class="sm-receipt-option">
        <div class="sm-receipt-option__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3.27 13.6L12 22.33l8.73-8.73M12 2v20" stroke="#0b0b0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <span class="sm-receipt-option__label">Split this<br>expense</span>
      </div>
      <div class="sm-receipt-option">
        <div class="sm-receipt-option__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="#0b0b0b" stroke-width="1.5"/><circle cx="6" cy="12" r="3" stroke="#0b0b0b" stroke-width="1.5"/><circle cx="18" cy="19" r="3" stroke="#0b0b0b" stroke-width="1.5"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#0b0b0b" stroke-width="1.5"/></svg>
        </div>
        <span class="sm-receipt-option__label">Share<br>screenshot</span>
      </div>
    </div>
    <div class="sm-receipt-ad">
      <div class="sm-receipt-ad__text">
        <p class="sm-receipt-ad__title">It's Payday!</p>
        <p class="sm-receipt-ad__sub">Treat yourself with a nice meal with <strong>Swiggy</strong></p>
        <span class="sm-receipt-ad__cta">Claim your <strong>20% off</strong></span>
      </div>
    </div>
    <div class="sm-receipt-powered">
        <img src="assets/upi_dark_sm.svg" onerror="this.src='assets/upi.svg'" alt="UPI" width="46" height="20" />
    </div>
    <div class="sm-receipt-footer">
      <button class="sm-receipt-btn sm-receipt-btn--light" onclick="renderScreen(S.SEND_MOBILE_CHAT)">Send again</button>
      <button class="sm-receipt-btn sm-receipt-btn--primary" onclick="renderScreen(S.HOME)">Home</button>
    </div>
    ${homeIndHTML()}
  </div>`;
}

// Scan and Pay numpad helper
function spNumpadHTML(target) {
  const keys = [1,2,3,4,5,6,7,8,9,"del",0,"submit"];
  let h = '<div class="ab-numpad">';
  keys.forEach(k => {
    if (k === "del") {
      h += `<button class="ab-numpad__key ab-numpad__key--del" onclick="handleScanPayKey('${target}','DEL')"><svg viewBox="0 0 24 18" fill="none" width="23" height="17"><path d="M7.5 1h13A2.5 2.5 0 0 1 23 3.5v11a2.5 2.5 0 0 1-2.5 2.5h-13L1 9l6.5-8z" stroke="#0b0b0b" stroke-width="1.3"/><path d="M11 6l6 6M17 6l-6 6" stroke="#0b0b0b" stroke-width="1.3" stroke-linecap="round"/></svg></button>`;
    } else if (k === "submit") {
      h += `<button class="ab-numpad__key ab-numpad__key--submit" onclick="handleScanPayKey('${target}','SUBMIT')"><svg viewBox="0 0 24 24" fill="none" width="24" height="24"><circle cx="12" cy="12" r="11" fill="#1b327e"/><path d="M7 12l3.5 3.5 6.5-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
    } else {
      h += `<button class="ab-numpad__key" onclick="handleScanPayKey('${target}','${k}')">${k}</button>`;
    }
  });
  h += '</div>';
  return h;
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
    case S.CHECK_BALANCE_PIN:
      return checkBalancePinHTML();
    case S.HOME:
      return homeScreenHTML();
    // Add Bank Account flow
    case S.ADD_BANK_SELECT:
      return selectBankHTML();
    case S.ADD_BANK_METHOD_SELECT:
      return methodSelectHTML();
    case S.ADD_BANK_AADHAAR_CONSENT:
      return aadhaarConsentHTML();
    case S.ADD_BANK_AADHAAR_NUMBER:
      return aadhaarNumberHTML();
    case S.ADD_BANK_AADHAAR_OTP:
      return aadhaarOtpHTML();
    case S.ADD_BANK_DEBIT_CARD:
      return debitCardHTML();
    case S.ADD_BANK_OTP:
      return bankOtpHTML();
    case S.ADD_BANK_SET_PIN:
      return setUpiPinHTML();
    case S.ADD_BANK_CONFIRM_PIN:
      return confirmUpiPinHTML();
    case S.ADD_BANK_SUCCESS:
      return bankSuccessHTML();
    case S.ADD_BANK_PAYMENT_METHODS:
      return paymentMethodsHTML();
    // Scan and Pay flow
    case S.SCAN_1:
      return scan1HTML();
    case S.SCAN_2:
      return scan2HTML();
    case S.ENTER_AMOUNT:
      return enterAmountHTML();
    case S.SELECT_ACCOUNT_TO_PAY:
      return selectAccountHTML();
    case S.ENTER_UPI_PIN:
      return enterUpiPinHTML();
    case S.PAYMENT_SUCCESS:
      return paymentSuccessHTML();
    case S.DEBITED_TRANSACTION:
      return debitedTransactionHTML();
    // Send to Mobile flow
    case S.SEND_MOBILE_CONTACTS:
      return sendMobileContactsHTML();
    case S.SEND_MOBILE_CHAT:
      return sendMobileChatHTML();
    case S.SEND_MOBILE_REVIEW:
      return sendMobileReviewHTML();
    case S.SEND_MOBILE_PIN:
      return sendMobilePinHTML();
    case S.SEND_MOBILE_SUCCESS:
      return sendMobileSuccessHTML();
    case S.SEND_MOBILE_RECEIPT:
      return sendMobileReceiptHTML();
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
      wait(() => renderScreen(S.GET_STARTED), 2500);
      break;
    case S.GET_STARTED:
    case S.LANG_SELECT:
    case S.MOBILE_ENTRY:
    case S.OTP_ENTRY:
    case S.SIM_SELECT:
      showScreenTooltip(state);
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
      showCbScreenTooltip(state);
      showSendMobileTour(state);
      showScanPayTour(state);
      const sendToMobileBtn = document.getElementById("send-to-mobile");
      if (sendToMobileBtn) {
        sendToMobileBtn.style.cursor = "pointer";
        sendToMobileBtn.onclick = function () {
          renderScreen(S.SEND_MOBILE_CONTACTS);
        };
      }
      break;
    // Add Bank Account flow
    case S.ADD_BANK_SELECT:
    case S.ADD_BANK_METHOD_SELECT:
    case S.ADD_BANK_DEBIT_CARD:
    case S.ADD_BANK_OTP:
    case S.ADD_BANK_SET_PIN:
      showAbScreenTooltip(state);
      break;
    case S.CHECK_BALANCE_PIN:
      showCbScreenTooltip(state);
      break;
    case S.ADD_BANK_SUCCESS:
      wait(() => renderScreen(S.ADD_BANK_PAYMENT_METHODS), 2500);
      break;
    // Scan and Pay flow – timed transitions + tooltips
    case S.SCAN_1:
      wait(() => renderScreen(S.SCAN_2), 3500);
      break;
    case S.SCAN_2:
    case S.ENTER_AMOUNT:
    case S.SELECT_ACCOUNT_TO_PAY:
    case S.ENTER_UPI_PIN:
      showScanPayTour(state);
      break;
    case S.PAYMENT_SUCCESS:
      showScanPayTour(state);
      wait(() => renderScreen(S.DEBITED_TRANSACTION), 3000);
      break;
    case S.DEBITED_TRANSACTION:
      showScanPayTour(state);
      break;
    // Send to Mobile flow
    case S.SEND_MOBILE_CHAT:
    case S.SEND_MOBILE_PIN:
    case S.SEND_MOBILE_SUCCESS:
    case S.SEND_MOBILE_RECEIPT:
      showSendMobileTour(state);
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
    case S.ADD_BANK_DEBIT_CARD:
      if (key === "DEL") {
        if (addBankInputFocus === "expiry" && addBankExpiry.length > 0) {
          addBankExpiry = addBankExpiry.slice(0, -1);
        } else if (addBankInputFocus === "expiry" && addBankExpiry.length === 0) {
          addBankInputFocus = "card";
        } else if (addBankInputFocus === "card" && addBankCardDigits.length > 0) {
          addBankCardDigits = addBankCardDigits.slice(0, -1);
        }
      } else {
        if (addBankInputFocus === "card" && addBankCardDigits.length < 6) {
          addBankCardDigits += key;
          if (addBankCardDigits.length === 6) addBankInputFocus = "expiry";
        } else if (addBankInputFocus === "expiry" && addBankExpiry.length < 4) {
          addBankExpiry += key;
        }
      }
      updateDebitCardUI();
      break;
  }
}

function selectGetStartedLanguage(idx) {
  selectedLang = idx;
  [0, 1].forEach((i) => {
    const card = document.getElementById("gs-lang-card-" + i);
    const radio = card && card.querySelector(".gs-lang-card__radio");
    if (card && radio) {
      if (i === idx) {
        card.classList.add("gs-lang-card--selected");
        radio.className = "gs-lang-card__radio gs-lang-card__radio--checked";
      } else {
        card.classList.remove("gs-lang-card--selected");
        radio.className = "gs-lang-card__radio";
      }
    }
  });
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
    // Add Bank Account flow back navigation
    case S.ADD_BANK_SELECT:
      renderScreen(S.HOME);
      break;
    case S.ADD_BANK_METHOD_SELECT:
      renderScreen(S.ADD_BANK_SELECT);
      break;
    case S.ADD_BANK_DEBIT_CARD:
      renderScreen(S.ADD_BANK_METHOD_SELECT);
      break;
    case S.ADD_BANK_AADHAAR_CONSENT:
      renderScreen(S.ADD_BANK_METHOD_SELECT);
      break;
    case S.ADD_BANK_AADHAAR_NUMBER:
      renderScreen(S.ADD_BANK_AADHAAR_CONSENT);
      break;
    case S.ADD_BANK_AADHAAR_OTP:
      renderScreen(S.ADD_BANK_AADHAAR_NUMBER);
      break;
    case S.ADD_BANK_OTP:
      renderScreen(S.ADD_BANK_DEBIT_CARD);
      break;
    case S.ADD_BANK_SET_PIN:
      renderScreen(S.ADD_BANK_OTP);
      break;
    case S.ADD_BANK_CONFIRM_PIN:
      renderScreen(S.ADD_BANK_SET_PIN);
      break;
    case S.CHECK_BALANCE_PIN:
      renderScreen(S.HOME);
      break;
    // Scan and Pay flow back navigation
    case S.SCAN_1:
      renderScreen(S.HOME);
      break;
    case S.SCAN_2:
      renderScreen(S.SCAN_1);
      break;
    case S.ENTER_AMOUNT:
      renderScreen(S.SCAN_2);
      break;
    case S.SELECT_ACCOUNT_TO_PAY:
      renderScreen(S.ENTER_AMOUNT);
      break;
    case S.ENTER_UPI_PIN:
      renderScreen(S.SELECT_ACCOUNT_TO_PAY);
      break;
    // Send to Mobile flow back navigation
    case S.SEND_MOBILE_CONTACTS:
      renderScreen(S.HOME);
      break;
    case S.SEND_MOBILE_CHAT:
      renderScreen(S.SEND_MOBILE_CONTACTS);
      break;
    case S.SEND_MOBILE_REVIEW:
      renderScreen(S.SEND_MOBILE_CHAT);
      break;
    case S.SEND_MOBILE_PIN:
      renderScreen(S.SEND_MOBILE_REVIEW);
      break;
    case S.SEND_MOBILE_RECEIPT:
      renderScreen(S.HOME);
      break;
  }
}

function goBackFromCheckBalancePin() {
  renderScreen(S.HOME);
}

// ─── Scan and Pay – Flow Control & UI Helpers ────────────────

function handleScanPayKey(target, key) {
  if (target === "amount") {
    if (key === "DEL") {
      scanPayAmount = scanPayAmount.slice(0, -1);
    } else if (key === "SUBMIT") {
      onEnterAmountNext();
      return;
    } else if (scanPayAmount.length < 7) {
      scanPayAmount += key;
    }
    updateAmountUI();
  } else if (target === "upipin") {
    if (key === "DEL") {
      scanPayUpiPin = scanPayUpiPin.slice(0, -1);
      updateScanPayPinUI();
    } else if (key === "SUBMIT") {
      if (scanPayUpiPin.length === 4) {
        renderScreen(S.PAYMENT_SUCCESS);
      }
      return;
    } else if (scanPayUpiPin.length < 4) {
      scanPayUpiPin += key;
      updateScanPayPinUI();
      if (scanPayUpiPin.length === 4) {
        // auto-submit after short delay
        wait(() => renderScreen(S.PAYMENT_SUCCESS), 400);
      }
    }
  } else if (target === "smpin") {
    if (key === "DEL") {
      smPinInput = smPinInput.slice(0, -1);
      updateSendMobilePinUI();
    } else if (key === "SUBMIT") {
      if (smPinInput.length === 4) {
        renderScreen(S.SEND_MOBILE_SUCCESS);
      }
    } else if (smPinInput.length < 4) {
      smPinInput += key;
      updateSendMobilePinUI();
      if (smPinInput.length === 4) {
        wait(() => renderScreen(S.SEND_MOBILE_SUCCESS), 350);
      }
    }
  }
}

function onEnterAmountNext() {
  if (scanPayAmount.length > 0 && parseInt(scanPayAmount) > 0) {
    renderScreen(S.SELECT_ACCOUNT_TO_PAY);
  }
}

function updateAmountUI() {
  const valEl = document.getElementById("ea-amount-value");
  if (valEl) valEl.textContent = scanPayAmount;
  /* cursor logic removed to keep it visible */
  const btn = document.getElementById("ea-next-btn");
  if (btn) {
    const hasAmount = scanPayAmount.length > 0 && parseInt(scanPayAmount) > 0;
    btn.className = hasAmount ? "sp-cta-btn" : "sp-cta-btn sp-cta-btn--disabled";
  }
  const wordsEl = document.getElementById("ea-amount-words");
  if (wordsEl) {
    const num = parseInt(scanPayAmount) || 0;
    wordsEl.textContent = num > 0 ? numberToWords(num) + " rupees only" : "";
  }
}

function numberToWords(n) {
  if (n === 0) return "zero";
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " " + ones[n%10] : "");
  if (n < 1000) return ones[Math.floor(n/100)] + " hundred" + (n%100 ? " " + numberToWords(n%100) : "");
  if (n < 100000) return numberToWords(Math.floor(n/1000)) + " thousand" + (n%1000 ? " " + numberToWords(n%1000) : "");
  if (n < 10000000) return numberToWords(Math.floor(n/100000)) + " lakh" + (n%100000 ? " " + numberToWords(n%100000) : "");
  return String(n);
}

function updateScanPayPinUI() {
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById("sp-pin-" + i);
    if (!d) continue;
    const raw = i < scanPayUpiPin.length ? scanPayUpiPin[i] : "";
    const val = raw && scanPayPinMasked ? "•" : raw;
    d.querySelector("span").textContent = val;
    d.className = i === scanPayUpiPin.length ? "ab-pin-digit ab-pin-digit--active" : "ab-pin-digit";
  }
}

function toggleScanPayPinMask() {
  scanPayPinMasked = !scanPayPinMasked;
  updateScanPayPinUI();
  const lbl = document.getElementById("sp-pin-show-label");
  if (lbl) lbl.textContent = scanPayPinMasked ? "Show" : "Hide";
}

// ─── Send to Mobile – Flow Control & UI Helpers ──────────────
function updateSendMobileSearch(val) {
  smContactSearch = val || "";
  renderScreen(S.SEND_MOBILE_CONTACTS);
}

function selectSendMobileContact(contactId) {
  smSelectedContactId = contactId;
  smChatAmount = "";
  smReviewNote = "";
  smPinInput = "";
  renderScreen(S.SEND_MOBILE_CHAT);
}

function updateSendMobileAmount(val) {
  const digits = String(val || "").replace(/\D/g, "");
  smChatAmount = digits.slice(0, 7);
  const payBtn = document.querySelector(".sm-chat-footer__pay");
  if (payBtn) {
    const enabled = parseInt(smChatAmount || "0", 10) > 0;
    payBtn.className = enabled ? "sm-chat-footer__pay" : "sm-chat-footer__pay sm-chat-footer__pay--disabled";
  }
}

function proceedSendMobileReview() {
  if (parseInt(smChatAmount || "0", 10) > 0) {
    renderScreen(S.SEND_MOBILE_REVIEW);
  }
}

function updateSendMobilePinUI() {
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById("sm-pin-" + i);
    if (!d) continue;
    const val = i < smPinInput.length ? "•" : "";
    const valEl = d.querySelector(".sm-pin-digit__val");
    if (valEl) valEl.textContent = val;
    d.className = i === smPinInput.length ? "sm-pin-digit sm-pin-digit--active" : "sm-pin-digit";
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

// ─── Tooltip Guide System (Non-Linear, Per-Screen) ──────────

const SCREEN_TOOLTIPS = {
  [S.GET_STARTED]: {
    element: "#gs-lang-section",
    text: "You can choose your preferred language in which you want to access the app",
    side: "top",
  },
  [S.LANG_SELECT]: {
    element: "#lang-item-2",
    text: "You can choose other languages apart from Hindi and Marathi from here",
    side: "top",
  },
  [S.MOBILE_ENTRY]: {
    element: "#mob-input-wrap",
    text: "You need to enter the mobile number linked with your bank account so that you can link and use your bank account for UPI Payments",
    side: "bottom",
  },
  [S.OTP_ENTRY]: {
    element: "#otp-boxes",
    text: "To ensure that your mobile number, linked with your bank account, is being used only by you, we will send an OTP on your number which will be auto fetched by your app.",
    side: "bottom",
  },
  [S.SIM_SELECT]: {
    element: "#sim-cards",
    text: "In this step you need to confirm your SIM Card company and we will proceed with binding of your SIM and device with the app. This will ensure that no one else can use your UPI Account apart from yourself",
    side: "bottom",
  },
};

function showScreenTooltip(state) {
  if (!tooltipGuide.enabled) return;
  if (tooltipGuide.shownForScreen[state]) return;

  const tt = SCREEN_TOOLTIPS[state];
  if (!tt) return;

  tooltipGuide.shownForScreen[state] = true;

  wait(() => {
    const el = document.querySelector(tt.element);
    if (!el) {
      console.warn('Tooltip target not found:', tt.element, '— skipping');
      return;
    }

    let body = `<div class="tt-text">${tt.text}</div>`;
    if (tt.bullets) {
      body += '<ul class="tt-bullets">';
      tt.bullets.forEach((b) => { body += '<li>' + b + '</li>'; });
      body += '</ul>';
    }
    // Buttons
    body += '<div class="tt-buttons"><button class="tt-btn-skip" onclick="tooltipSkip()">Skip</button><button class="tt-btn-next" onclick="tooltipNext()">Next</button></div>';

    const dObj = window.driver.js.driver({
      showProgress: false,
      showButtons: [],
      overlayColor: "rgba(0,0,0,0.55)",
      stagePadding: 8,
      stageRadius: 12,
      animate: true,
      popoverClass: "ob-tooltip",
      allowClose: false,
    });
    dObj.highlight({
      element: tt.element,
      popover: {
        description: body,
        side: tt.side,
        align: "center",
      },
    });
    activeDriver = dObj;
  }, 300);
}

function tooltipNext() {
  // Close tooltip — user stays on current interactive screen
  if (activeDriver) {
    activeDriver.destroy();
    activeDriver = null;
  }
}

function tooltipSkip() {
  // Disable all remaining tooltips for this onboarding session
  tooltipGuide.enabled = false;
  if (activeDriver) {
    activeDriver.destroy();
    activeDriver = null;
  }
}

// ─── Flow Control ────────────────────────────────────────────

function startOnboarding() {
  renderScreen(S.SPLASH_1);
}
function goHome() {
  renderScreen(S.HOME);
}
function startScanAndPayFlow() {
  skipHomeTour = true;
  // Disable other tours so only Scan & Pay tooltip shows
  smTour.enabled = false;
  cbTooltipGuide.enabled = false;
  // Enable Scan & Pay tour
  spTour.enabled = true;
  spTour.shownForScreen = {};
  renderScreen(S.HOME);
  // Note: Don't call clearTimers() here — it would cancel the tooltip's wait() timer
}

function startSendToMobileFlow() {
  // Disable other tours so only Send to Mobile tooltip shows
  cbTooltipGuide.enabled = false;
  spTour.enabled = false;
  // Enable Send to Mobile tour
  smTour.enabled = true;
  smTour.shownForScreen = {};
  smSelectedContactId = sendMobileContacts[0].id;
  smChatAmount = "";
  smReviewNote = "";
  smPinInput = "";
  renderScreen(S.HOME);
}

// ─── Check Balance – Non-Linear Tooltip Guide ─────────────────
const cbTooltipGuide = {
  enabled: false,       // activated only when user starts CB flow
  shownForScreen: {},   // per-screen tracking
};

function showCbScreenTooltip(state) {
  if (!cbTooltipGuide.enabled) return;
  if (cbTooltipGuide.shownForScreen[state]) return;

  // Determine tooltip config based on state
  let step;
  if (state === S.HOME) {
    if (balanceRevealed) {
      step = {
        element: "#bank-card",
        desc: "Your account balance is shown here after you enter your UPI PIN.",
        title: "Balance visible",
        side: "bottom",
      };
    } else {
      step = {
        element: "#bank-card",
        desc: "Tap here to enter your UPI PIN and view your account balance.",
        title: "Check Balance",
        side: "bottom",
      };
    }
  } else if (state === S.CHECK_BALANCE_PIN) {
    step = {
      element: "#cb-pin-row",
      desc: "Enter your 4-digit UPI PIN to view your account balance securely.",
      title: "Enter UPI PIN",
      side: "bottom",
    };
  }
  if (!step) return;

  cbTooltipGuide.shownForScreen[state] = true;

  wait(() => {
    const el = document.querySelector(step.element);
    if (!el) {
      console.warn('CB tooltip target not found:', step.element, '— skipping');
      return;
    }

    let body = `<div class="tt-text">${step.desc}</div>`;
    body += '<div class="bhim-popover-footer"><div class="bhim-popover-buttons">' +
      '<button class="bhim-btn-skip" onclick="cbTourSkip()">Skip</button>' +
      '<button class="bhim-btn-next" onclick="cbTourNext()">Next</button>' +
      '</div></div>';

    const dObj = window.driver.js.driver({
      showProgress: false,
      showButtons: [],
      overlayColor: "rgba(0,0,0,0.65)",
      stagePadding: 6,
      stageRadius: 16,
      animate: true,
      smoothScroll: false,
      allowClose: true,
      popoverClass: "bhim-driver-popover",
      onDestroyStarted: () => {
        activeDriver = null;
        dObj.destroy();
      },
    });
    dObj.highlight({
      element: step.element,
      popover: {
        title: step.title || "",
        description: body,
        side: step.side,
        align: "center",
      },
    });
    window.checkBalanceDriver = dObj;
    activeDriver = dObj;
  }, 400);
}

function cbTourSkip() {
  cbTooltipGuide.enabled = false;
  if (activeDriver) { activeDriver.destroy(); activeDriver = null; }
}

function cbTourNext() {
  if (activeDriver) { activeDriver.destroy(); activeDriver = null; }
}

function startCheckBalanceFlow() {
  // Disable other tours so only Check Balance tooltip shows
  smTour.enabled = false;
  spTour.enabled = false;
  // Enable Check Balance tour
  cbTooltipGuide.enabled = true;
  cbTooltipGuide.shownForScreen = {};
  renderScreen(S.HOME);
}

function openCheckBalancePinScreen() {
  if (activeDriver) { activeDriver.destroy(); activeDriver = null; }
  checkBalancePinMasked = true;
  renderScreen(S.CHECK_BALANCE_PIN);
}

// ─── Send to Mobile – Guided Tour ─────────────────────────────
const smTour = {
  enabled: true,
  shownForScreen: {},
};

// ─── Custom In-Frame Coach Marks (Send to Mobile) ───────────
let smCoachNextAction = null;

function dismissSmCoachMark() {
  const els = document.querySelectorAll(".smc-overlay, .smc-spotlight, .smc-tooltip");
  els.forEach(e => e.remove());
  smCoachNextAction = null;
}

function smCoachNext() {
  const action = smCoachNextAction;
  dismissSmCoachMark();
  if (action) action();
}

function showSendMobileTour(state) {
  if (!smTour.enabled || smTour.shownForScreen[state]) return;

  const SM_TOTAL_STEPS = 5;
  let step = null;
  if (state === S.HOME) {
    step = { element: "#send-to-mobile", title: "Send to Mobile", desc: "Click here to send money.", side: "bottom", padding: 10, radius: 14, idx: 0 };
  } else if (state === S.SEND_MOBILE_CHAT) {
    step = { element: "#sm-chat-footer", title: "Enter Amount", desc: "Use this footer to enter the amount and tap Pay.", side: "top", padding: 8, radius: 16, idx: 1 };
  } else if (state === S.SEND_MOBILE_PIN) {
    step = { element: "#sm-pin-row", title: "Enter UPI PIN", desc: "Enter your 4-digit UPI PIN and tap the tick button.", side: "bottom", padding: 12, radius: 12, idx: 2 };
  } else if (state === S.SEND_MOBILE_SUCCESS) {
    step = { element: "#sm-success-text", title: "Payment Successful", desc: "Success message will appear once transaction is done.", side: "bottom", padding: 20, radius: 16, idx: 3, onNext: function () { renderScreen(S.SEND_MOBILE_RECEIPT); } };
  } else if (state === S.SEND_MOBILE_RECEIPT) {
    step = { element: "#sm-receipt-card", title: "Detailed Transaction History Screen", desc: "", side: "bottom", padding: 10, radius: 20, idx: 4, onNext: function () { renderScreen(S.HOME); } };
  }

  if (!step) return;
  smTour.shownForScreen[state] = true;

  wait(() => {
    const target = document.querySelector(step.element);
    if (!target) return;

    // Get positions relative to phone shell
    const shellRect = phoneShell.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const pad = step.padding;

    const spotTop = targetRect.top - shellRect.top - pad;
    const spotLeft = targetRect.left - shellRect.left - pad;
    const spotW = targetRect.width + pad * 2;
    const spotH = targetRect.height + pad * 2;
    const spotR = step.radius + pad;

    // 1) Dark overlay covering entire phone shell
    const overlay = document.createElement("div");
    overlay.className = "smc-overlay";
    overlay.onclick = dismissSmCoachMark;

    // 2) Spotlight cutout via box-shadow
    const spotlight = document.createElement("div");
    spotlight.className = "smc-spotlight";
    spotlight.style.cssText =
      "top:" + spotTop + "px;left:" + spotLeft + "px;" +
      "width:" + spotW + "px;height:" + spotH + "px;" +
      "border-radius:" + spotR + "px;";

    // Store onNext action if present
    smCoachNextAction = step.onNext || null;

    // 3) Tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "smc-tooltip";
    const descHTML = step.desc ? '<p class="smc-tooltip__desc">' + step.desc + "</p>" : "";

    // Step dots
    let dotsHTML = '<div class="smc-tooltip__dots">';
    for (let d = 0; d < SM_TOTAL_STEPS; d++) {
      dotsHTML += '<span class="smc-dot' + (d === step.idx ? " smc-dot--active" : "") + '"></span>';
    }
    dotsHTML += "</div>";

    tooltip.innerHTML =
      '<p class="smc-tooltip__title">' + step.title + "</p>" +
      descHTML +
      dotsHTML +
      '<div class="smc-tooltip__btns">' +
        '<button class="smc-tooltip__skip" onclick="dismissSmCoachMark()">Skip</button>' +
        '<button class="smc-tooltip__next" onclick="smCoachNext()">Next</button>' +
      "</div>";

    // Position tooltip above or below the spotlight
    if (step.side === "bottom") {
      tooltip.style.top = (spotTop + spotH + 14) + "px";
    } else {
      // 'top' — position above the spotlight
      tooltip.style.top = (spotTop - 14) + "px";
      tooltip.style.transform = "translateY(-100%)";
    }
    tooltip.style.left = "16px";
    tooltip.style.right = "16px";

    // Inject into phone shell (not body!)
    phoneShell.appendChild(overlay);
    phoneShell.appendChild(spotlight);
    phoneShell.appendChild(tooltip);
  }, 300);
}




// ─── Scan and Pay – Guided Tour (Custom In-Frame Coach Marks) ──
const spTour = {
  enabled: false,       // activated only when user starts Scan & Pay from landing
  shownForScreen: {},   // per-screen tracking
};
let spCoachNextAction = null;

function dismissSpCoachMark() {
  const els = document.querySelectorAll(".spc-overlay, .spc-spotlight, .spc-tooltip");
  els.forEach(e => e.remove());
  spCoachNextAction = null;
}

function spCoachNext() {
  const action = spCoachNextAction;
  dismissSpCoachMark();
  if (action) action();
}

function spCoachSkip() {
  spTour.enabled = false;
  dismissSpCoachMark();
}

function showScanPayTour(state) {
  if (!spTour.enabled || spTour.shownForScreen[state]) return;

  const SP_TOTAL_STEPS = 7;
  let step = null;

  if (state === S.HOME) {
    step = {
      element: "#scanner-btn",
      title: "Click on Scanner Icon to start the journey of Scan & pay",
      desc: "",
      side: "top",
      padding: 14,
      radius: 50,
      idx: 0,
    };
  } else if (state === S.SCAN_2) {
    step = {
      element: ".scan2-camera",
      title: "Select any QR to send money",
      desc: "",
      side: "bottom",
      padding: 10,
      radius: 14,
      idx: 1,
    };
  } else if (state === S.ENTER_AMOUNT) {
    step = {
      element: ".ea-body",
      title: "Enter amount and details, purpose of sending money",
      desc: "",
      side: "bottom",
      padding: 10,
      radius: 16,
      idx: 2,
    };
  } else if (state === S.SELECT_ACCOUNT_TO_PAY) {
    step = {
      element: ".sm-review-bottom-sheet",
      title: "Bank selection from bottom sheet dropdown if User has multiple bank added in UPI App",
      desc: "",
      side: "top",
      padding: 8,
      radius: 20,
      idx: 3,
    };
  } else if (state === S.ENTER_UPI_PIN) {
    step = {
      element: "#sp-pin-content",
      title: "Enter UPI PIN to send money",
      desc: "",
      side: "bottom",
      padding: 10,
      radius: 16,
      idx: 4,
    };
  } else if (state === S.PAYMENT_SUCCESS) {
    step = {
      element: "#sp-success-text",
      title: "Success message will appear once transaction is done",
      desc: "",
      side: "bottom",
      padding: 20,
      radius: 16,
      idx: 5,
    };
  } else if (state === S.DEBITED_TRANSACTION) {
    step = {
      element: "#sm-receipt-card",
      title: "Detailed Transaction History Screen",
      desc: "",
      side: "bottom",
      padding: 10,
      radius: 20,
      idx: 6,
    };
  }

  if (!step) return;
  spTour.shownForScreen[state] = true;

  wait(() => {
    const target = document.querySelector(step.element);
    if (!target) return;

    // Get positions relative to phone shell
    const shellRect = phoneShell.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const pad = step.padding;

    const spotTop = targetRect.top - shellRect.top - pad;
    const spotLeft = targetRect.left - shellRect.left - pad;
    const spotW = targetRect.width + pad * 2;
    const spotH = targetRect.height + pad * 2;
    const spotR = step.radius + pad;

    // 1) Dark overlay covering entire phone shell
    const overlay = document.createElement("div");
    overlay.className = "spc-overlay";
    overlay.onclick = dismissSpCoachMark;

    // 2) Spotlight cutout via box-shadow
    const spotlight = document.createElement("div");
    spotlight.className = "spc-spotlight";
    spotlight.style.cssText =
      "top:" + spotTop + "px;left:" + spotLeft + "px;" +
      "width:" + spotW + "px;height:" + spotH + "px;" +
      "border-radius:" + spotR + "px;";

    // Store onNext action if present
    spCoachNextAction = step.onNext || null;

    // 3) Tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "spc-tooltip";
    const descHTML = step.desc ? '<p class="spc-tooltip__desc">' + step.desc + "</p>" : "";

    // Step dots
    let dotsHTML = '<div class="spc-tooltip__dots">';
    for (let d = 0; d < SP_TOTAL_STEPS; d++) {
      dotsHTML += '<span class="spc-dot' + (d === step.idx ? " spc-dot--active" : "") + '"></span>';
    }
    dotsHTML += "</div>";

    tooltip.innerHTML =
      '<p class="spc-tooltip__title">' + step.title + "</p>" +
      descHTML +
      dotsHTML +
      '<div class="spc-tooltip__btns">' +
        '<button class="spc-tooltip__skip" onclick="spCoachSkip()">Skip</button>' +
        '<button class="spc-tooltip__next" onclick="spCoachNext()">Next</button>' +
      "</div>";

    // Position tooltip above or below the spotlight
    if (step.side === "bottom") {
      tooltip.style.top = (spotTop + spotH + 14) + "px";
    } else {
      // 'top' — position above the spotlight
      tooltip.style.top = (spotTop - 14) + "px";
      tooltip.style.transform = "translateY(-100%)";
    }
    tooltip.style.left = "16px";
    tooltip.style.right = "16px";

    // Inject into phone shell (not body!)
    phoneShell.appendChild(overlay);
    phoneShell.appendChild(spotlight);
    phoneShell.appendChild(tooltip);
  }, 400);
}

// ─── Init ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  phoneShell = document.getElementById("phone-shell");
  renderScreen(S.LANDING);
});
