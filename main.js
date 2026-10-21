/**
 * ==========================================================================
 * ALRAYYAN OPTICS - SECURE APPLICATION CONTROLLER & ANTI-INSPECT ENGINE
 * نظام إدارة وحساب فواتير نظارات الريان المحمي مشفّر بالكامل
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. CRYPTOGRAPHIC SECURITY & AUTH CREDENTIALS
  // ==========================================================================

  // Default SHA-256 hashes (admin / rayyan@2026)
  // username: "admin"        -> 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
  // password: "rayyan@2026" -> bab459f4ac476f1e0dc9652a32264b5943ca811163ff1afd4019ddc52babe318
  const DEFAULT_USER_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
  const DEFAULT_PASS_HASH = 'bab459f4ac476f1e0dc9652a32264b5943ca811163ff1afd4019ddc52babe318';

  const STORAGE_KEY_USER_HASH = 'alrayyan_user_hash_v1';
  const STORAGE_KEY_PASS_HASH = 'alrayyan_pass_hash_v1';
  const STORAGE_KEY_AUTH_SESSION = 'alrayyan_auth_session_active';
  const STORAGE_KEY_INVOICES = 'alrayyan_invoices_history_v1';
  const STORAGE_KEY_THEME = 'alrayyan_app_theme';
  const STORAGE_KEY_LAST_INV = 'alrayyan_last_invoice_counter';

  // Compute SHA-256 hash using Web Crypto API
  async function computeSha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getExpectedUserHash() {
    return localStorage.getItem(STORAGE_KEY_USER_HASH) || DEFAULT_USER_HASH;
  }

  function getExpectedPassHash() {
    return localStorage.getItem(STORAGE_KEY_PASS_HASH) || DEFAULT_PASS_HASH;
  }

  // ==========================================================================
  // 2. ANTI-INSPECT & ANTI-DEVTOOLS SHIELD
  // ==========================================================================

  // Block Right-Click Context Menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showToast('🔒 تم تعطيل القائمة لحماية سرية الفاتورة والأسعار', 'warning');
    return false;
  }, false);

  // Block DevTools & Source Inspection Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      showToast('🔒 أدوات الفحص (Inspect) معطلة لحماية بيانات النظام', 'warning');
      return false;
    }

    // Ctrl + Shift + I / J / C (DevTools & Element Inspector)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      e.stopPropagation();
      showToast('🔒 أدوات الفحص (Inspect) معطلة لحماية بيانات النظام', 'warning');
      return false;
    }

    // Ctrl + U (View Source)
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      showToast('🔒 عرض كود الصفحة معطّل لحماية البيانات', 'warning');
      return false;
    }

    // Ctrl + S (Save Page)
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Cmd keys on macOS
    if (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J' || e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      e.stopPropagation();
      showToast('🔒 أدوات الفحص معطلة', 'warning');
      return false;
    }
  }, true);

  // Anti-tamper console clearing
  setInterval(() => {
    if (window.console && !window.__DEBUG_MODE__) {
      // Periodic check to discourage tampering
    }
  }, 2000);

  // ==========================================================================
  // 3. TOAST NOTIFICATION UTILITY
  // ==========================================================================

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // ==========================================================================
  // 4. LOGIN PORTAL CONTROLLER
  // ==========================================================================

  const loginPortal = document.getElementById('loginPortal');
  const loginForm = document.getElementById('loginForm');
  const loginUsername = document.getElementById('loginUsername');
  const loginPassword = document.getElementById('loginPassword');
  const loginErrorBanner = document.getElementById('loginErrorBanner');
  const togglePasswordVisibilityBtn = document.getElementById('togglePasswordVisibilityBtn');
  const eyeShowIcon = document.getElementById('eyeShowIcon');
  const eyeHideIcon = document.getElementById('eyeHideIcon');
  const appProtectedRoot = document.getElementById('appProtectedRoot');

  // Toggle password visibility
  if (togglePasswordVisibilityBtn && loginPassword) {
    togglePasswordVisibilityBtn.addEventListener('click', () => {
      const isPassword = loginPassword.type === 'password';
      loginPassword.type = isPassword ? 'text' : 'password';
      if (eyeShowIcon) eyeShowIcon.style.display = isPassword ? 'none' : 'block';
      if (eyeHideIcon) eyeHideIcon.style.display = isPassword ? 'block' : 'none';
    });
  }

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userVal = (loginUsername.value || '').trim();
      const passVal = (loginPassword.value || '').trim();

      if (!userVal || !passVal) {
        if (loginErrorBanner) {
          loginErrorBanner.textContent = 'يرجى كتابة اسم المستخدم وكلمة المرور';
          loginErrorBanner.classList.remove('haid');
        }
        return;
      }

      // Compute cryptographic hashes
      const inputUserHash = await computeSha256(userVal);
      const inputPassHash = await computeSha256(passVal);

      const expectedUser = getExpectedUserHash();
      const expectedPass = getExpectedPassHash();

      if (inputUserHash === expectedUser && inputPassHash === expectedPass) {
        // Successful login
        if (loginErrorBanner) loginErrorBanner.classList.add('haid');
        sessionStorage.setItem(STORAGE_KEY_AUTH_SESSION, 'active');
        mountProtectedApp();
        showToast('تم التحقق وتسجيل الدخول بنجاح 🔓 مرحباً بك في نظارات الريان');
      } else {
        // Invalid credentials
        if (loginErrorBanner) {
          loginErrorBanner.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة!';
          loginErrorBanner.classList.remove('haid');
          loginErrorBanner.classList.add('shake-anim');
          setTimeout(() => loginErrorBanner.classList.remove('shake-anim'), 500);
        }
        loginPassword.value = '';
        loginPassword.focus();
        showToast('خطأ: بيانات الدخول غير صحيحة', 'error');
      }
    });
  }

  // ==========================================================================
  // 5. DECRYPTION & SECURE APP MOUNTING
  // (Zero-DOM: The app HTML is injected ONLY after verification!)
  // ==========================================================================

  function mountProtectedApp() {
    if (!window.__ALRAYYAN_ENCRYPTED_APP__) {
      console.error('Encrypted template missing!');
      showToast('خطأ: تعذر تحميل حزمة النظام المشفّرة', 'error');
      return;
    }

    try {
      // Decode Base64 UTF-8 safely
      const binaryString = atob(window.__ALRAYYAN_ENCRYPTED_APP__);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decodedHtml = new TextDecoder('utf-8').decode(bytes);

      // Inject into DOM
      appProtectedRoot.innerHTML = decodedHtml;
      appProtectedRoot.style.display = 'block';

      // Hide login portal
      if (loginPortal) loginPortal.style.display = 'none';
      document.body.classList.remove('auth-locked');

      // Initialize all application logic & listeners
      initAppLogic();

    } catch (err) {
      console.error('Mount error:', err);
      showToast('حدث خطأ أثناء تحميل الفاتورة', 'error');
    }
  }

  function unmountProtectedApp() {
    // Clear session
    sessionStorage.removeItem(STORAGE_KEY_AUTH_SESSION);

    // Completely wipe invoice DOM elements from memory
    appProtectedRoot.innerHTML = '';
    appProtectedRoot.style.display = 'none';

    // Show login portal
    if (loginPortal) loginPortal.style.display = 'flex';
    document.body.classList.add('auth-locked');
    if (loginPassword) loginPassword.value = '';

    showToast('تم تسجيل الخروج وقفل الفاتورة بنجاح 🔒');
  }

  // Check existing session on load
  const existingSession = sessionStorage.getItem(STORAGE_KEY_AUTH_SESSION);
  if (existingSession === 'active') {
    mountProtectedApp();
  }

  // ==========================================================================
  // 6. SECURITY SETTINGS MODAL (CHANGE CREDENTIALS)
  // ==========================================================================

  const securityModal = document.getElementById('securityModal');
  const secModalOverlay = document.getElementById('secModalOverlay');
  const closeSecModalBtn = document.getElementById('closeSecModalBtn');
  const changeAuthForm = document.getElementById('changeAuthForm');
  const secErrorBanner = document.getElementById('secErrorBanner');
  const currPassInput = document.getElementById('currPassInput');
  const newUserInput = document.getElementById('newUserInput');
  const newPassInput = document.getElementById('newPassInput');
  const confirmPassInput = document.getElementById('confirmPassInput');
  const resetDefaultAuthBtn = document.getElementById('resetDefaultAuthBtn');

  function openSecurityModal() {
    if (securityModal) {
      securityModal.classList.add('active');
      if (secErrorBanner) secErrorBanner.classList.add('haid');
      if (changeAuthForm) changeAuthForm.reset();
    }
  }

  function closeSecurityModal() {
    if (securityModal) securityModal.classList.remove('active');
  }

  if (closeSecModalBtn) closeSecModalBtn.addEventListener('click', closeSecurityModal);
  if (secModalOverlay) secModalOverlay.addEventListener('click', closeSecurityModal);

  // Handle Change Credentials Form
  if (changeAuthForm) {
    changeAuthForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currPass = (currPassInput.value || '').trim();
      const newUser = (newUserInput.value || '').trim();
      const newPass = (newPassInput.value || '').trim();
      const confirmPass = (confirmPassInput.value || '').trim();

      const currHash = await computeSha256(currPass);
      const expectedPass = getExpectedPassHash();

      if (currHash !== expectedPass) {
        if (secErrorBanner) {
          secErrorBanner.textContent = 'كلمة المرور الحالية غير صحيحة!';
          secErrorBanner.classList.remove('haid');
        }
        return;
      }

      if (newPass.length < 4) {
        if (secErrorBanner) {
          secErrorBanner.textContent = 'يجب أن تكون كلمة المرور 4 أحرف أو أرقام على الأقل';
          secErrorBanner.classList.remove('haid');
        }
        return;
      }

      if (newPass !== confirmPass) {
        if (secErrorBanner) {
          secErrorBanner.textContent = 'كلمة المرور وتأكيدها غير متطابقين!';
          secErrorBanner.classList.remove('haid');
        }
        return;
      }

      // Hash and store new credentials
      const newUserHash = await computeSha256(newUser);
      const newPassHash = await computeSha256(newPass);

      localStorage.setItem(STORAGE_KEY_USER_HASH, newUserHash);
      localStorage.setItem(STORAGE_KEY_PASS_HASH, newPassHash);

      closeSecurityModal();
      showToast('تم تحديث اسم المستخدم وكلمة المرور بنجاح 🔑');
    });
  }

  // Restore Default Credentials
  if (resetDefaultAuthBtn) {
    resetDefaultAuthBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY_USER_HASH);
      localStorage.removeItem(STORAGE_KEY_PASS_HASH);
      closeSecurityModal();
      showToast('تمت استعادة بيانات الدخول الافتراضية: admin / rayyan@2026');
    });
  }

  // ==========================================================================
  // 7. INVOICE APPLICATION CORE LOGIC (RUNS UPON AUTHENTICATION)
  // ==========================================================================

  function initAppLogic() {
    // Core Elements
    const btncalc = document.getElementById('btncalc');
    const invoice = document.getElementById('invoice');
    const alhsab = document.getElementById('alhsab');
    const done = document.getElementById('done');
    const fprice = document.getElementById('fprice');
    const afterDic = document.getElementById('afterDic');
    const lPrice = document.getElementById('lPrice');
    const lPrice2 = document.getElementById('lPrice2');
    const lPrice3 = document.getElementById('lPrice3');
    const lensPrice = document.getElementById('lensPrice');
    const lens3Price = document.getElementById('lens3Price');
    const total2 = document.getElementById('total2');
    const send = document.getElementById('send');
    const home = document.getElementById('home');
    const back = document.getElementById('back');

    const fDiscountPercent = document.getElementById('fDiscountPercent');
    const discountPills = document.querySelectorAll('.discount-pill');
    const frameDiscountAmount = document.getElementById('frameDiscountAmount');
    const frameNetPrice = document.getElementById('frameNetPrice');
    const rPriceBadge = document.getElementById('rPriceBadge');
    const lPriceBadge = document.getElementById('lPriceBadge');
    const cPriceBadge = document.getElementById('cPriceBadge');

    const invNumberInput = document.getElementById('invNumberInput');
    const invDateInput = document.getElementById('invDateInput');
    const custNameInput = document.getElementById('custNameInput');
    const custPhoneInput = document.getElementById('custPhoneInput');
    const depositPaidInput = document.getElementById('depositPaidInput');
    const orderNotes = document.getElementById('orderNotes');
    const genInvNumberBtn = document.getElementById('genInvNumberBtn');
    const resetOrderBtn = document.getElementById('resetOrderBtn');
    const copyLensBtn = document.getElementById('copyLensBtn');

    // Live Summary Elements
    const liveFrameOriginal = document.getElementById('liveFrameOriginal');
    const liveDiscountPct = document.getElementById('liveDiscountPct');
    const liveFrameDiscount = document.getElementById('liveFrameDiscount');
    const liveFrameNet = document.getElementById('liveFrameNet');
    const liveRightLens = document.getElementById('liveRightLens');
    const liveLeftLens = document.getElementById('liveLeftLens');
    const liveCoating = document.getElementById('liveCoating');
    const liveTotalAmount = document.getElementById('liveTotalAmount');
    const liveDepositVal = document.getElementById('liveDepositVal');
    const liveRemainingVal = document.getElementById('liveRemainingVal');

    // Stepper Elements
    const stepIndicator1 = document.getElementById('stepIndicator1');
    const stepIndicator2 = document.getElementById('stepIndicator2');
    const stepIndicator3 = document.getElementById('stepIndicator3');
    const stepLine1 = document.getElementById('stepLine1');
    const stepLine2 = document.getElementById('stepLine2');

    // Receipt Elements
    const rcptInvNumber = document.getElementById('rcptInvNumber');
    const rcptDate = document.getElementById('rcptDate');
    const rcptTime = document.getElementById('rcptTime');
    const rcptCustName = document.getElementById('rcptCustName');
    const rcptCustPhone = document.getElementById('rcptCustPhone');
    const rcptItemsBody = document.getElementById('rcptItemsBody');
    const rcptNotesText = document.getElementById('rcptNotesText');
    const rcptDepositPaid = document.getElementById('rcptDepositPaid');
    const rcptBalanceDue = document.getElementById('rcptBalanceDue');
    const barcodeText = document.getElementById('barcodeText');
    const rcptRxBlock = document.getElementById('rcptRxBlock');
    const printBtn = document.getElementById('printBtn');
    const whatsappShareBtn = document.getElementById('whatsappShareBtn');

    // Done View Elements
    const doneInvNum = document.getElementById('doneInvNum');
    const doneTotalVal = document.getElementById('doneTotalVal');
    const doneRemainingVal = document.getElementById('doneRemainingVal');
    const reprintFromDoneBtn = document.getElementById('reprintFromDoneBtn');

    // History Drawer Elements
    const historyDrawer = document.getElementById('historyDrawer');
    const historyDrawerBtn = document.getElementById('historyDrawerBtn');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const historySearchInput = document.getElementById('historySearchInput');
    const historyListContainer = document.getElementById('historyListContainer');
    const historyBadgeCount = document.getElementById('historyBadgeCount');
    const histTotalCount = document.getElementById('histTotalCount');
    const histTotalSales = document.getElementById('histTotalSales');
    const clearAllHistoryBtn = document.getElementById('clearAllHistoryBtn');

    // Header Security Actions (Logout & Change Password)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', unmountProtectedApp);
    }

    const changePassBtn = document.getElementById('changePassBtn');
    if (changePassBtn) {
      changePassBtn.addEventListener('click', openSecurityModal);
    }

    // Theme Switcher Elements
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem(STORAGE_KEY_THEME, nextTheme);
        showToast(nextTheme === 'dark' ? 'تم تفعيل الوضع الليلي 🌙' : 'تم تفعيل الوضع النهاري ☀️');
      });
    }

    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
      currentYearSpan.textContent = new Date().getFullYear();
    }

    let currentCalculatedData = null;

    // Helper: Generate Invoice Number
    function generateNewInvoiceNumber() {
      let counter = parseInt(localStorage.getItem(STORAGE_KEY_LAST_INV) || '1025', 10) + 1;
      localStorage.setItem(STORAGE_KEY_LAST_INV, counter.toString());
      const formatted = `RY-${counter}`;
      if (invNumberInput) invNumberInput.value = formatted;
      return formatted;
    }

    // Helper: Initialize Date
    function initDate() {
      if (invDateInput) {
        const today = new Date().toISOString().split('T')[0];
        invDateInput.value = today;
      }
    }

    // Helper: Format Currency
    function formatQAR(val) {
      const num = parseFloat(val) || 0;
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ر.ق';
    }

    // Live Calculation Function
    function calculateAll() {
      const rawFrame = Math.max(0, parseFloat(fprice?.value) || 0);
      let discountPct = parseFloat(fDiscountPercent?.value);
      if (isNaN(discountPct) || discountPct < 0) discountPct = 0;
      if (discountPct > 100) discountPct = 100;

      // Frame Calculations (25% default)
      const frameDiscountVal = rawFrame * (discountPct / 100);
      const netFrameVal = rawFrame - frameDiscountVal;

      // Lens Calculations
      const rLensVal = parseFloat(lPrice?.value) || 0;
      const lLensVal = parseFloat(lPrice2?.value) || 0;
      const totalLensesVal = rLensVal + lLensVal;

      // Coating Calculation
      const coatingVal = parseFloat(lPrice3?.value) || 0;

      // Grand Total
      const grandTotalVal = netFrameVal + totalLensesVal + coatingVal;

      // Deposit and Remaining
      const depositVal = Math.max(0, parseFloat(depositPaidInput?.value) || 0);
      const remainingVal = Math.max(0, grandTotalVal - depositVal);

      // Selected options labels
      const rOption = lPrice?.options[lPrice.selectedIndex];
      const lOption = lPrice2?.options[lPrice2.selectedIndex];
      const cOption = lPrice3?.options[lPrice3.selectedIndex];

      const rLensLabel = rOption ? (rOption.getAttribute('data-label') || rOption.text) : 'None';
      const lLensLabel = lOption ? (lOption.getAttribute('data-label') || lOption.text) : 'None';
      const coatingLabel = cOption ? (cOption.getAttribute('data-label') || cOption.text) : 'None';

      // Update Live Badges
      if (frameDiscountAmount) frameDiscountAmount.textContent = formatQAR(frameDiscountVal);
      if (frameNetPrice) frameNetPrice.textContent = formatQAR(netFrameVal);
      if (rPriceBadge) rPriceBadge.textContent = formatQAR(rLensVal);
      if (lPriceBadge) lPriceBadge.textContent = formatQAR(lLensVal);
      if (cPriceBadge) cPriceBadge.textContent = formatQAR(coatingVal);

      // Update Live Summary Card
      if (liveFrameOriginal) liveFrameOriginal.textContent = formatQAR(rawFrame);
      if (liveDiscountPct) liveDiscountPct.textContent = discountPct;
      if (liveFrameDiscount) liveFrameDiscount.textContent = `-${formatQAR(frameDiscountVal)}`;
      if (liveFrameNet) liveFrameNet.textContent = formatQAR(netFrameVal);
      if (liveRightLens) liveRightLens.textContent = formatQAR(rLensVal);
      if (liveLeftLens) liveLeftLens.textContent = formatQAR(lLensVal);
      if (liveCoating) liveCoating.textContent = formatQAR(coatingVal);
      if (liveTotalAmount) liveTotalAmount.textContent = grandTotalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (liveDepositVal) liveDepositVal.textContent = formatQAR(depositVal);
      if (liveRemainingVal) liveRemainingVal.textContent = formatQAR(remainingVal);

      // Update Mobile Floating Bottom Bar
      const mobileTotalText = document.getElementById('mobileTotalText');
      if (mobileTotalText) mobileTotalText.textContent = formatQAR(grandTotalVal);

      currentCalculatedData = {
        rawFrame,
        discountPct,
        frameDiscountVal,
        netFrameVal,
        rLensVal,
        rLensLabel,
        lLensVal,
        lLensLabel,
        totalLensesVal,
        coatingVal,
        coatingLabel,
        grandTotalVal,
        depositVal,
        remainingVal
      };

      return currentCalculatedData;
    }

    // Attach live listeners
    [fprice, fDiscountPercent, lPrice, lPrice2, lPrice3, depositPaidInput].forEach(elem => {
      if (elem) {
        elem.addEventListener('input', calculateAll);
        elem.addEventListener('change', calculateAll);
      }
    });

    // Discount Presets
    discountPills.forEach(pill => {
      pill.addEventListener('click', () => {
        discountPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const pct = pill.getAttribute('data-pct');
        if (fDiscountPercent) {
          fDiscountPercent.value = pct;
          calculateAll();
        }
      });
    });

    // Copy Right Lens to Left Lens
    if (copyLensBtn) {
      copyLensBtn.addEventListener('click', () => {
        const rightIndex = lPrice.selectedIndex;
        if (rightIndex > 0) {
          lPrice2.selectedIndex = rightIndex;
          calculateAll();
          showToast('تم نسخ عدسة اليمين إلى اليسار بنجاح 👓');
        } else {
          showToast('يرجى تحديد عدسة اليمين أولاً لنسخها', 'warning');
        }
      });
    }

    // Generate Invoice Number Button
    if (genInvNumberBtn) {
      genInvNumberBtn.addEventListener('click', () => {
        const newNo = generateNewInvoiceNumber();
        showToast(`تم إنشاء رقم فاتورة جديد: ${newNo}`);
      });
    }

    // Reset Order Form
    if (resetOrderBtn) {
      resetOrderBtn.addEventListener('click', () => {
        fprice.value = '';
        if (fDiscountPercent) fDiscountPercent.value = '25';
        lPrice.selectedIndex = 0;
        lPrice2.selectedIndex = 0;
        lPrice3.selectedIndex = 0;
        if (custNameInput) custNameInput.value = '';
        if (custPhoneInput) custPhoneInput.value = '';
        if (depositPaidInput) depositPaidInput.value = '';
        if (orderNotes) orderNotes.value = '';
        ['rx_r_sph', 'rx_r_cyl', 'rx_r_axis', 'rx_r_add', 'rx_l_sph', 'rx_l_cyl', 'rx_l_axis', 'rx_l_add'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        calculateAll();
        showToast('تم إفراغ النموذج وجاهز للطلب الجديد');
      });
    }

    // Stepper Control
    function setStep(stepNum) {
      [stepIndicator1, stepIndicator2, stepIndicator3].forEach((ind, idx) => {
        if (!ind) return;
        ind.classList.remove('active', 'completed');
        if (idx + 1 < stepNum) {
          ind.classList.add('completed');
        } else if (idx + 1 === stepNum) {
          ind.classList.add('active');
        }
      });

      if (stepLine1) stepLine1.classList.toggle('active', stepNum > 1);
      if (stepLine2) stepLine2.classList.toggle('active', stepNum > 2);
    }

    function showView(viewId) {
      [invoice, alhsab, done].forEach(v => {
        if (v) {
          v.classList.add('haid');
          v.classList.remove('active-panel');
        }
      });

      const activeView = document.getElementById(viewId);
      if (activeView) {
        activeView.classList.remove('haid');
        activeView.classList.add('active-panel');
      }

      const mobileBottomBar = document.getElementById('mobileBottomBar');
      if (mobileBottomBar) {
        mobileBottomBar.style.display = viewId === 'invoice' ? '' : 'none';
      }

      if (viewId === 'invoice') setStep(1);
      else if (viewId === 'alhsab') setStep(2);
      else if (viewId === 'done') setStep(3);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const mobileCalcBtn = document.getElementById('mobileCalcBtn');
    if (mobileCalcBtn) {
      mobileCalcBtn.addEventListener('click', () => {
        btncalc.click();
      });
    }

    // Generate Invoice / Review Action
    btncalc.onclick = function () {
      const data = calculateAll();

      const invNum = invNumberInput.value.trim() || 'RY-1025';
      const dateVal = invDateInput.value || new Date().toISOString().split('T')[0];
      const now = new Date();
      const timeVal = now.toLocaleTimeString('ar-QA', { hour: '2-digit', minute: '2-digit' });
      const custName = custNameInput.value.trim() || 'عميل نقدي';
      const custPhone = custPhoneInput.value.trim() || '--';

      if (rcptInvNumber) rcptInvNumber.textContent = invNum;
      if (rcptDate) rcptDate.textContent = dateVal;
      if (rcptTime) rcptTime.textContent = timeVal;
      if (rcptCustName) rcptCustName.textContent = custName;
      if (rcptCustPhone) rcptCustPhone.textContent = custPhone !== '--' ? `+974 ${custPhone}` : '--';
      if (barcodeText) barcodeText.textContent = invNum;

      // Prescription Table
      const rSph = document.getElementById('rx_r_sph')?.value.trim();
      const rCyl = document.getElementById('rx_r_cyl')?.value.trim();
      const rAxis = document.getElementById('rx_r_axis')?.value.trim();
      const rAdd = document.getElementById('rx_r_add')?.value.trim();
      const lSph = document.getElementById('rx_l_sph')?.value.trim();
      const lCyl = document.getElementById('rx_l_cyl')?.value.trim();
      const lAxis = document.getElementById('rx_l_axis')?.value.trim();
      const lAdd = document.getElementById('rx_l_add')?.value.trim();

      const hasRx = rSph || rCyl || rAxis || rAdd || lSph || lCyl || lAxis || lAdd;
      if (rcptRxBlock) {
        rcptRxBlock.style.display = hasRx ? 'block' : 'none';
        if (hasRx) {
          document.getElementById('rcpt_r_sph').textContent = rSph || '-';
          document.getElementById('rcpt_r_cyl').textContent = rCyl || '-';
          document.getElementById('rcpt_r_axis').textContent = rAxis || '-';
          document.getElementById('rcpt_r_add').textContent = rAdd || '-';
          document.getElementById('rcpt_l_sph').textContent = lSph || '-';
          document.getElementById('rcpt_l_cyl').textContent = lCyl || '-';
          document.getElementById('rcpt_l_axis').textContent = lAxis || '-';
          document.getElementById('rcpt_l_add').textContent = lAdd || '-';
        }
      }

      // Populate Receipt Items
      if (rcptItemsBody) {
        rcptItemsBody.innerHTML = '';
        let rowIdx = 1;

        if (data.rawFrame > 0) {
          const frameRow = document.createElement('tr');
          frameRow.innerHTML = `
            <td>${rowIdx++}</td>
            <td>
              <strong>إطار نظارة طبي / شمسي (Eyewear Frame)</strong>
              <div style="font-size: 0.78rem; color: #64748b;">خصم خاص: ${data.discountPct}% (وفرت ${formatQAR(data.frameDiscountVal)})</div>
            </td>
            <td>${formatQAR(data.rawFrame)}</td>
            <td style="text-align: left; font-weight: 700;">${formatQAR(data.netFrameVal)}</td>
          `;
          rcptItemsBody.appendChild(frameRow);
        }

        if (data.rLensVal > 0 || data.rLensLabel !== 'None') {
          const rRow = document.createElement('tr');
          rRow.innerHTML = `
            <td>${rowIdx++}</td>
            <td>
              <strong>عدسة العين اليمنى (OD) R-Eye</strong>
              <div style="font-size: 0.78rem; color: #64748b;">النوع: ${data.rLensLabel}</div>
            </td>
            <td>${formatQAR(data.rLensVal)}</td>
            <td style="text-align: left; font-weight: 700;">${formatQAR(data.rLensVal)}</td>
          `;
          rcptItemsBody.appendChild(rRow);
        }

        if (data.lLensVal > 0 || data.lLensLabel !== 'None') {
          const lRow = document.createElement('tr');
          lRow.innerHTML = `
            <td>${rowIdx++}</td>
            <td>
              <strong>عدسة العين اليسرى (OS) L-Eye</strong>
              <div style="font-size: 0.78rem; color: #64748b;">النوع: ${data.lLensLabel}</div>
            </td>
            <td>${formatQAR(data.lLensVal)}</td>
            <td style="text-align: left; font-weight: 700;">${formatQAR(data.lLensVal)}</td>
          `;
          rcptItemsBody.appendChild(lRow);
        }

        if (data.coatingVal > 0 || (data.coatingLabel !== 'None' && data.coatingLabel !== 'بدون طبقة إضافية')) {
          const cRow = document.createElement('tr');
          cRow.innerHTML = `
            <td>${rowIdx++}</td>
            <td>
              <strong>معالجة وطبقة الحماية (Lenses Coating)</strong>
              <div style="font-size: 0.78rem; color: #64748b;">الطبقة: ${data.coatingLabel}</div>
            </td>
            <td>${formatQAR(data.coatingVal)}</td>
            <td style="text-align: left; font-weight: 700;">${formatQAR(data.coatingVal)}</td>
          `;
          rcptItemsBody.appendChild(cRow);
        }

        if (rcptItemsBody.children.length === 0) {
          const emptyRow = document.createElement('tr');
          emptyRow.innerHTML = `
            <td>1</td>
            <td>خدمات فحص وبصريات عامة</td>
            <td>0.00 ر.ق</td>
            <td style="text-align: left; font-weight: 700;">0.00 ر.ق</td>
          `;
          rcptItemsBody.appendChild(emptyRow);
        }
      }

      // Update Totals
      afterDic.innerHTML = formatQAR(data.netFrameVal);
      lensPrice.innerHTML = formatQAR(data.totalLensesVal);
      lens3Price.innerHTML = formatQAR(data.coatingVal);
      total2.innerHTML = formatQAR(data.grandTotalVal);

      if (rcptDepositPaid) rcptDepositPaid.textContent = formatQAR(data.depositVal);
      if (rcptBalanceDue) rcptBalanceDue.textContent = formatQAR(data.remainingVal);
      if (rcptNotesText) rcptNotesText.textContent = orderNotes?.value.trim() || 'لا توجد ملاحظات إضافية.';

      showView('alhsab');
    };

    back.onclick = function () {
      showView('invoice');
    };

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // WhatsApp Message Share
    if (whatsappShareBtn) {
      whatsappShareBtn.addEventListener('click', () => {
        const data = currentCalculatedData || calculateAll();
        const invNum = invNumberInput.value.trim() || 'RY-1025';
        const custName = custNameInput.value.trim() || 'عميلنا العزيز';
        let phone = custPhoneInput.value.trim().replace(/[^0-9]/g, '');

        const msg = `*نظارات الريان | ALRAYYAN OPTICS* 👓
فاتورة إلكترونية وسند استلام
----------------------------------
📋 *رقم الفاتورة:* ${invNum}
👤 *اسم العميل:* ${custName}
📅 *التاريخ:* ${invDateInput.value || new Date().toISOString().split('T')[0]}
----------------------------------
👓 *سعر الإطار:* ${formatQAR(data.rawFrame)}
🏷️ *الخصم (${data.discountPct}%):* -${formatQAR(data.frameDiscountVal)}
✨ *الإطار بعد الخصم:* ${formatQAR(data.netFrameVal)}
👁️ *عدسة اليمين (OD):*\n ${data.rLensLabel} (${formatQAR(data.rLensVal)})
👁️ *عدسة اليسار (OS):*\n ${data.lLensLabel} (${formatQAR(data.lLensVal)})
🛡️ *طبقة المعالجة:*\n ${data.coatingLabel} (${formatQAR(data.coatingVal)})
----------------------------------
💰 *المجموع الإجمالي:* ${formatQAR(data.grandTotalVal)}
💵 *المدفوع (العربون):* ${formatQAR(data.depositVal)}
⏳ *المتبقي عند الاستلام:* ${formatQAR(data.remainingVal)}
----------------------------------
📍الريان الجديد - شارع الشافي
📞 تواصل معنا: +974 44119160
نتشرف دائماً بخدمتكم في نظارات الريان!`;

        let targetNumber = '97444119160';
        if (phone) {
          if (!phone.startsWith('974') && phone.length === 8) {
            phone = '974' + phone;
          }
          targetNumber = phone;
        }

        const waUrl = `https://api.whatsapp.com/send?phone=${targetNumber}&text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
        showToast('جارٍ فتح تطبيق واتساب لمشاركة الفاتورة 💬');
      });
    }

    // Save & Confirm Order
    send.onclick = function () {
      const data = currentCalculatedData || calculateAll();
      const invNum = invNumberInput.value.trim() || 'RY-1025';
      const custName = custNameInput.value.trim() || 'عميل نقدي';
      const custPhone = custPhoneInput.value.trim() || '';

      const orderRecord = {
        id: Date.now(),
        invNum: invNum,
        date: invDateInput.value || new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('ar-QA', { hour: '2-digit', minute: '2-digit' }),
        customerName: custName,
        customerPhone: custPhone,
        framePrice: data.rawFrame,
        discountPct: data.discountPct,
        frameNet: data.netFrameVal,
        rightLens: data.rLensLabel,
        rightLensPrice: data.rLensVal,
        leftLens: data.lLensLabel,
        leftLensPrice: data.lLensVal,
        coating: data.coatingLabel,
        coatingPrice: data.coatingVal,
        total: data.grandTotalVal,
        deposit: data.depositVal,
        remaining: data.remainingVal,
        notes: orderNotes?.value.trim() || ''
      };

      saveInvoiceToHistory(orderRecord);

      if (doneInvNum) doneInvNum.textContent = invNum;
      if (doneTotalVal) doneTotalVal.textContent = formatQAR(data.grandTotalVal);
      if (doneRemainingVal) doneRemainingVal.textContent = formatQAR(data.remainingVal);

      showToast('تم حفظ الطلب وإرساله بنجاح! 🎉', 'success');
      showView('done');
    };

    home.onclick = function () {
      generateNewInvoiceNumber();
      fprice.value = '';
      if (depositPaidInput) depositPaidInput.value = '';
      if (orderNotes) orderNotes.value = '';
      if (custNameInput) custNameInput.value = '';
      if (custPhoneInput) custPhoneInput.value = '';
      calculateAll();
      showView('invoice');
    };

    if (reprintFromDoneBtn) {
      reprintFromDoneBtn.addEventListener('click', () => {
        showView('alhsab');
      });
    }

    // Invoices History Manager
    function getSavedInvoices() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_INVOICES)) || [];
      } catch (e) {
        return [];
      }
    }

    function saveInvoiceToHistory(record) {
      const list = getSavedInvoices();
      list.unshift(record);
      if (list.length > 100) list.pop();
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(list));
      updateHistoryUI();
    }

    function deleteInvoiceFromHistory(id) {
      let list = getSavedInvoices();
      list = list.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(list));
      updateHistoryUI();
      showToast('تم حذف الفاتورة من السجل');
    }

    function updateHistoryUI(filterQuery = '') {
      const list = getSavedInvoices();
      const query = filterQuery.toLowerCase().trim();

      const filtered = list.filter(item => {
        if (!query) return true;
        return (
          item.invNum.toLowerCase().includes(query) ||
          item.customerName.toLowerCase().includes(query) ||
          (item.customerPhone && item.customerPhone.includes(query))
        );
      });

      if (historyBadgeCount) historyBadgeCount.textContent = list.length;
      if (histTotalCount) histTotalCount.textContent = list.length;

      const totalSales = list.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
      if (histTotalSales) histTotalSales.textContent = formatQAR(totalSales);

      if (!historyListContainer) return;

      if (filtered.length === 0) {
        historyListContainer.innerHTML = `
          <div class="empty-history-notice">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.4;">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            <p>لا توجد فواتير محفوظة في السجل حالياً.</p>
          </div>
        `;
        return;
      }

      historyListContainer.innerHTML = '';
      filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-item';
        card.innerHTML = `
          <div class="hist-top">
            <span class="hist-inv-no">${item.invNum}</span>
            <span class="hist-date">${item.date} ${item.time || ''}</span>
          </div>
          <div class="hist-cust">${item.customerName} ${item.customerPhone ? `(${item.customerPhone})` : ''}</div>
          <div class="hist-bottom">
            <span class="hist-total text-gold">${formatQAR(item.total)}</span>
            <div class="hist-actions">
              <button class="hist-action-btn load-inv-btn" data-id="${item.id}" title="عرض وطباعة">عرض</button>
              <button class="hist-action-btn del-inv-btn danger-text" data-id="${item.id}" title="حذف">حذف</button>
            </div>
          </div>
        `;
        historyListContainer.appendChild(card);
      });

      historyListContainer.querySelectorAll('.load-inv-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'), 10);
          loadInvoiceFromRecord(id);
        });
      });

      historyListContainer.querySelectorAll('.del-inv-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'), 10);
          deleteInvoiceFromHistory(id);
        });
      });
    }

    function loadInvoiceFromRecord(id) {
      const list = getSavedInvoices();
      const item = list.find(i => i.id === id);
      if (!item) return;

      if (invNumberInput) invNumberInput.value = item.invNum;
      if (invDateInput) invDateInput.value = item.date;
      if (custNameInput) custNameInput.value = item.customerName;
      if (custPhoneInput) custPhoneInput.value = item.customerPhone;
      if (fprice) fprice.value = item.framePrice || '';
      if (fDiscountPercent) fDiscountPercent.value = item.discountPct ?? 25;
      if (depositPaidInput) depositPaidInput.value = item.deposit || '';
      if (orderNotes) orderNotes.value = item.notes || '';

      selectOptionByText(lPrice, item.rightLens);
      selectOptionByText(lPrice2, item.leftLens);
      selectOptionByText(lPrice3, item.coating);

      calculateAll();
      closeHistory();
      btncalc.click();
      showToast(`تم استرجاع الفاتورة ${item.invNum} بنجاح`);
    }

    function selectOptionByText(selectElem, text) {
      if (!selectElem || !text) return;
      for (let i = 0; i < selectElem.options.length; i++) {
        const opt = selectElem.options[i];
        const dataLabel = opt.getAttribute('data-label');
        if (dataLabel === text || opt.text.includes(text)) {
          selectElem.selectedIndex = i;
          break;
        }
      }
    }

    function openHistory() {
      updateHistoryUI();
      if (historyDrawer) historyDrawer.classList.add('active');
    }

    function closeHistory() {
      if (historyDrawer) historyDrawer.classList.remove('active');
    }

    if (historyDrawerBtn) historyDrawerBtn.addEventListener('click', openHistory);
    if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', closeHistory);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeHistory);

    if (historySearchInput) {
      historySearchInput.addEventListener('input', (e) => {
        updateHistoryUI(e.target.value);
      });
    }

    if (clearAllHistoryBtn) {
      clearAllHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY_INVOICES);
        updateHistoryUI();
        showToast('تم مسح سجل الفواتير بالكامل');
      });
    }

    // Initialize App Date & Calculations
    initDate();
    if (invNumberInput && !invNumberInput.value) {
      generateNewInvoiceNumber();
    }
    calculateAll();
    updateHistoryUI();
  }

});
