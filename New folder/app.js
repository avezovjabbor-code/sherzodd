/**
 * KALKULYATOR PRO - DESKTOP EDITION
 * High-performance Calculation Engine, Audio Synthesis, Converter, and Desktop UI
 */

(function () {
  'use strict';

  // State Management
  const state = {
    currentInput: '0',
    expression: '',
    previousResult: null,
    isNewCalculation: false,
    angleMode: 'DEG', // DEG or RAD
    soundEnabled: true,
    theme: 'theme-dark',
    activeMode: 'standard', // 'standard', 'scientific', 'converter'
    memory: 0,
    memoryList: [],
    history: []
  };

  // Audio Synthesis for Desktop Tactile Experience
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'num') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'op') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'equals') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.04); // E5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'clear') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // DOM Elements
  const primaryDisplay = document.getElementById('primaryDisplay');
  const expressionDisplay = document.getElementById('expressionDisplay');
  const equalIndicator = document.getElementById('equalIndicator');
  const memoryIndicator = document.getElementById('memoryIndicator');
  const angleUnitBadge = document.getElementById('angleUnitBadge');
  const btnDegRad = document.getElementById('btnDegRad');

  const scientificKeypad = document.getElementById('scientificKeypad');
  const standardKeypad = document.getElementById('standardKeypad');
  const converterView = document.getElementById('converterView');
  const memoryRibbon = document.getElementById('memoryRibbon');

  const btnMemClear = document.getElementById('btnMemClear');
  const btnMemRecall = document.getElementById('btnMemRecall');
  const btnMemAdd = document.getElementById('btnMemAdd');
  const btnMemSub = document.getElementById('btnMemSub');
  const btnMemStore = document.getElementById('btnMemStore');

  const historyDrawer = document.getElementById('historyDrawer');
  const historyItemsList = document.getElementById('historyItemsList');
  const historyEmpty = document.getElementById('historyEmpty');
  const historyCountBadge = document.getElementById('historyCountBadge');
  const memoryItemsList = document.getElementById('memoryItemsList');
  const memoryEmpty = document.getElementById('memoryEmpty');

  const tabHistList = document.getElementById('tabHistList');
  const tabMemList = document.getElementById('tabMemList');
  const historyListContainer = document.getElementById('historyListContainer');
  const memoryListContainer = document.getElementById('memoryListContainer');
  const btnClearHistory = document.getElementById('btnClearHistory');

  const btnCopyResult = document.getElementById('btnCopyResult');
  const toastNotification = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMsg');

  const tabStandard = document.getElementById('tabStandard');
  const tabScientific = document.getElementById('tabScientific');
  const tabConverter = document.getElementById('tabConverter');

  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');

  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeMenu = document.getElementById('themeMenu');
  const calculatorWindow = document.getElementById('calculatorWindow');

  const btnWinMin = document.getElementById('btnWinMin');
  const btnWinMax = document.getElementById('btnWinMax');
  const btnWinClose = document.getElementById('btnWinClose');

  const btnToggleHistory = document.getElementById('btnToggleHistory');
  const btnShortcutsHint = document.getElementById('btnShortcutsHint');
  const shortcutsModal = document.getElementById('shortcutsModal');
  const btnCloseShortcuts = document.getElementById('btnCloseShortcuts');

  // Converter DOM elements
  const convInputVal = document.getElementById('convInputVal');
  const convResultVal = document.getElementById('convResultVal');
  const convFromUnit = document.getElementById('convFromUnit');
  const convToUnit = document.getElementById('convToUnit');
  const btnSwapConv = document.getElementById('btnSwapConv');
  const convRateInfo = document.getElementById('convRateInfo');

  // Load Saved Data from LocalStorage
  function loadPersistedState() {
    try {
      const savedHist = localStorage.getItem('calc_history');
      if (savedHist) state.history = JSON.parse(savedHist);

      const savedTheme = localStorage.getItem('calc_theme');
      if (savedTheme) applyTheme(savedTheme);

      const savedSound = localStorage.getItem('calc_sound');
      if (savedSound !== null) state.soundEnabled = savedSound === 'true';
      updateSoundUI();

      const savedMemory = localStorage.getItem('calc_memory');
      if (savedMemory) state.memory = parseFloat(savedMemory) || 0;
      updateMemoryUI();

      renderHistory();
    } catch (e) {
      console.warn('Storage load error:', e);
    }
  }

  function savePersistedHistory() {
    try {
      localStorage.setItem('calc_history', JSON.stringify(state.history));
    } catch (e) {}
  }

  // Display Updates & Auto-scaling
  function updateDisplay() {
    let text = state.currentInput;
    if (text === '') text = '0';

    // Format with thousands separator if purely numeric
    if (!isNaN(text) && text !== '' && !text.includes('e') && text.length < 18) {
      const parts = text.split('.');
      parts[0] = Number(parts[0]).toLocaleString('en-US');
      text = parts.join('.');
    }

    primaryDisplay.textContent = text;
    expressionDisplay.textContent = state.expression || ' ';

    // Dynamic Font Scaling
    primaryDisplay.classList.remove('font-sm', 'font-xs');
    const len = text.length;
    if (len > 15) {
      primaryDisplay.classList.add('font-xs');
    } else if (len > 10) {
      primaryDisplay.classList.add('font-sm');
    }
  }

  function showToast(message) {
    toastMsg.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2200);
  }

  // Number Input Handler
  function inputDigit(digit) {
    playSound('num');

    if (state.isNewCalculation) {
      state.currentInput = digit === '.' ? '0.' : digit;
      state.expression = '';
      state.isNewCalculation = false;
      updateDisplay();
      return;
    }

    if (digit === '.') {
      if (state.currentInput.includes('.')) return;
      state.currentInput += '.';
    } else {
      if (state.currentInput === '0') {
        state.currentInput = digit;
      } else {
        if (state.currentInput.length >= 22) return; // limit digits
        state.currentInput += digit;
      }
    }
    updateDisplay();
  }

  // Operator Handlers
  function handleOperator(op) {
    playSound('op');
    const val = state.currentInput;

    if (state.isNewCalculation) {
      state.expression = val + ' ' + op + ' ';
      state.isNewCalculation = false;
      state.currentInput = '0';
    } else {
      if (state.expression !== '' && isLastTokenOperator(state.expression) && state.currentInput === '0') {
        // Replace operator
        state.expression = state.expression.trim().slice(0, -1) + op + ' ';
      } else {
        state.expression += val + ' ' + op + ' ';
        state.currentInput = '0';
      }
    }
    updateDisplay();
  }

  function isLastTokenOperator(expr) {
    const trimmed = expr.trim();
    const lastChar = trimmed.slice(-1);
    return ['+', '−', '-', '×', '*', '÷', '/', '^'].includes(lastChar);
  }

  // Clear Handlers
  function clearAll() {
    playSound('clear');
    state.currentInput = '0';
    state.expression = '';
    state.isNewCalculation = false;
    updateDisplay();
  }

  function clearEntry() {
    playSound('clear');
    state.currentInput = '0';
    updateDisplay();
  }

  function backspace() {
    playSound('clear');
    if (state.isNewCalculation) {
      clearAll();
      return;
    }
    if (state.currentInput.length > 1) {
      state.currentInput = state.currentInput.slice(0, -1);
      if (state.currentInput === '-' || state.currentInput === '') {
        state.currentInput = '0';
      }
    } else {
      state.currentInput = '0';
    }
    updateDisplay();
  }

  function negate() {
    playSound('op');
    if (state.currentInput === '0') return;
    if (state.currentInput.startsWith('-')) {
      state.currentInput = state.currentInput.substring(1);
    } else {
      state.currentInput = '-' + state.currentInput;
    }
    updateDisplay();
  }

  // Instant Single Number Transformations
  function applySingleFunction(funcName) {
    playSound('op');
    const num = parseFloat(state.currentInput);
    if (isNaN(num)) return;

    let res = 0;
    const isDeg = state.angleMode === 'DEG';
    const toRad = (val) => (val * Math.PI) / 180;
    const toDeg = (val) => (val * 180) / Math.PI;

    switch (funcName) {
      case 'quick-sqrt':
      case 'sqrt':
        if (num < 0) {
          showToast("Manfiy sondan ildiz chiqarib bo'lmaydi");
          return;
        }
        res = Math.sqrt(num);
        state.expression = `√(${num})`;
        break;
      case 'square':
      case 'power-2':
        res = Math.pow(num, 2);
        state.expression = `sqr(${num})`;
        break;
      case 'cbrt':
        res = Math.cbrt(num);
        state.expression = `cbrt(${num})`;
        break;
      case 'reciprocal':
        if (num === 0) {
          showToast("Nolga bo'lish mumkin emas");
          return;
        }
        res = 1 / num;
        state.expression = `1/(${num})`;
        break;
      case 'percent':
        res = num / 100;
        state.expression = `${num}%`;
        break;
      case 'sin':
        res = Math.sin(isDeg ? toRad(num) : num);
        state.expression = `sin(${num})`;
        break;
      case 'cos':
        res = Math.cos(isDeg ? toRad(num) : num);
        state.expression = `cos(${num})`;
        break;
      case 'tan':
        res = Math.tan(isDeg ? toRad(num) : num);
        state.expression = `tan(${num})`;
        break;
      case 'asin':
        if (num < -1 || num > 1) {
          showToast('Qiymat [-1, 1] oralig\'ida bo\'lishi kerak');
          return;
        }
        res = isDeg ? toDeg(Math.asin(num)) : Math.asin(num);
        state.expression = `sin⁻¹(${num})`;
        break;
      case 'acos':
        if (num < -1 || num > 1) {
          showToast('Qiymat [-1, 1] oralig\'ida bo\'lishi kerak');
          return;
        }
        res = isDeg ? toDeg(Math.acos(num)) : Math.acos(num);
        state.expression = `cos⁻¹(${num})`;
        break;
      case 'atan':
        res = isDeg ? toDeg(Math.atan(num)) : Math.atan(num);
        state.expression = `tan⁻¹(${num})`;
        break;
      case 'log10':
        if (num <= 0) {
          showToast('Faqat musbat sonlar uchun!');
          return;
        }
        res = Math.log10(num);
        state.expression = `log(${num})`;
        break;
      case 'ln':
        if (num <= 0) {
          showToast('Faqat musbat sonlar uchun!');
          return;
        }
        res = Math.log(num);
        state.expression = `ln(${num})`;
        break;
      case 'exp':
        res = Math.exp(num);
        state.expression = `e^(${num})`;
        break;
      case 'fact':
        if (num < 0 || !Number.isInteger(num)) {
          showToast('Faqat butun musbat sonlar uchun!');
          return;
        }
        if (num > 170) {
          showToast('Cheksiz (juda katta son)');
          return;
        }
        res = factorial(num);
        state.expression = `fact(${num})`;
        break;
      case 'abs':
        res = Math.abs(num);
        state.expression = `abs(${num})`;
        break;
      default:
        return;
    }

    res = roundPrecision(res);
    state.currentInput = res.toString();
    state.isNewCalculation = true;
    updateDisplay();
    addHistoryRecord(state.expression, res.toString());
  }

  function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function roundPrecision(val) {
    if (!isFinite(val)) return val;
    return Math.round(val * 1e12) / 1e12;
  }

  // Evaluate Expression Chain
  function calculateResult() {
    let formula = state.expression + state.currentInput;
    if (!formula.trim()) return;

    // Convert display operators to standard math
    let sanitized = formula
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**');

    try {
      // Safe evaluation of mathematical expressions
      const result = safeMathEval(sanitized);

      if (!isFinite(result) || isNaN(result)) {
        showToast("Nolga bo'lish yoki noto'g'ri amal");
        return;
      }

      playSound('equals');
      const rounded = roundPrecision(result);
      const fullExpr = state.expression + state.currentInput + ' =';

      addHistoryRecord(fullExpr, rounded.toString());

      state.expression = fullExpr;
      state.currentInput = rounded.toString();
      state.isNewCalculation = true;
      updateDisplay();
    } catch (e) {
      showToast('Ifodada xatolik mavjud');
      console.warn('Calculation error:', e);
    }
  }

  // Safe Token-based / sanitized math evaluation
  function safeMathEval(expr) {
    // Check for allowed characters only
    if (/[^0-9\+\-\*\/\(\)\.\s\e\*\*\^]/.test(expr)) {
      throw new Error('Xavfli belgi');
    }
    // Prevent consecutive non-minus operators like ** /
    const fn = new Function(`'use strict'; return (${expr});`);
    return fn();
  }

  // Memory Functions
  function updateMemoryUI() {
    const hasMem = state.memory !== 0;
    if (hasMem) {
      memoryIndicator.classList.remove('hidden');
      btnMemClear.classList.remove('disabled');
      btnMemRecall.classList.remove('disabled');
    } else {
      memoryIndicator.classList.add('hidden');
      btnMemClear.classList.add('disabled');
      btnMemRecall.classList.add('disabled');
    }
    renderMemoryList();
  }

  function handleMemoryAction(action) {
    const current = parseFloat(state.currentInput) || 0;
    playSound('op');

    switch (action) {
      case 'mc':
        state.memory = 0;
        state.memoryList = [];
        showToast('Xotira tozalandi (MC)');
        break;
      case 'mr':
        state.currentInput = state.memory.toString();
        state.isNewCalculation = true;
        showToast('Xotiradan olindi (MR)');
        break;
      case 'm-add':
        state.memory += current;
        state.memoryList.unshift({ val: state.memory, time: getCurrentTime() });
        showToast(`Xotiraga qo'shildi: +${current}`);
        break;
      case 'm-sub':
        state.memory -= current;
        state.memoryList.unshift({ val: state.memory, time: getCurrentTime() });
        showToast(`Xotiradan ayirildi: -${current}`);
        break;
      case 'ms':
        state.memory = current;
        state.memoryList.unshift({ val: state.memory, time: getCurrentTime() });
        showToast(`Xotiraga saqlandi: ${current}`);
        break;
    }

    try {
      localStorage.setItem('calc_memory', state.memory.toString());
    } catch (e) {}

    updateMemoryUI();
    updateDisplay();
  }

  // History System
  function getCurrentTime() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function addHistoryRecord(expr, res) {
    state.history.unshift({
      expr: expr,
      res: res,
      time: getCurrentTime()
    });

    if (state.history.length > 50) {
      state.history.pop();
    }

    savePersistedHistory();
    renderHistory();
  }

  function renderHistory() {
    const total = state.history.length;
    if (total > 0) {
      historyEmpty.classList.add('hidden');
      historyCountBadge.classList.remove('hidden');
      historyCountBadge.textContent = total > 9 ? '9+' : total;
    } else {
      historyEmpty.classList.remove('hidden');
      historyCountBadge.classList.add('hidden');
    }

    historyItemsList.innerHTML = '';
    state.history.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="hist-expr">${escapeHTML(item.expr)}</div>
        <div class="hist-res">${escapeHTML(item.res)}</div>
        <div class="hist-time">${item.time}</div>
      `;
      card.addEventListener('click', () => {
        state.currentInput = item.res;
        state.isNewCalculation = true;
        updateDisplay();
        showToast('Natija kalkulyatorga kiritildi');
      });
      historyItemsList.appendChild(card);
    });
  }

  function renderMemoryList() {
    if (state.memoryList.length > 0) {
      memoryEmpty.classList.add('hidden');
    } else {
      memoryEmpty.classList.remove('hidden');
    }

    memoryItemsList.innerHTML = '';
    state.memoryList.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="hist-expr">Xotira qiymati:</div>
        <div class="hist-res">${escapeHTML(item.val.toString())}</div>
        <div class="hist-time">${item.time}</div>
      `;
      card.addEventListener('click', () => {
        state.currentInput = item.val.toString();
        state.isNewCalculation = true;
        updateDisplay();
        showToast('Xotiradan o\'qildi');
      });
      memoryItemsList.appendChild(card);
    });
  }

  function clearHistory() {
    playSound('clear');
    state.history = [];
    savePersistedHistory();
    renderHistory();
    showToast('Tarix tozalandi');
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // Unit and Currency Converter Engine
  const CONVERTER_DATA = {
    currency: {
      name: 'Valyuta',
      rates: {
        UZS: 1,
        USD: 12850,
        EUR: 13950,
        RUB: 135,
        KZT: 26.5
      },
      labels: {
        UZS: "O'zbek so'mi (UZS)",
        USD: "AQSh Dollari ($)",
        EUR: "Evro (€)",
        RUB: "Rossiya Rubli (₽)",
        KZT: "Qozog'iston Tengesi (₸)"
      }
    },
    length: {
      name: 'Uzunlik',
      rates: {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        in: 0.0254,
        ft: 0.3048,
        mi: 1609.34
      },
      labels: {
        m: 'Metr (m)',
        km: 'Kilometr (km)',
        cm: 'Santimetr (cm)',
        mm: 'Millimetr (mm)',
        in: 'Dyuym (inch)',
        ft: 'Fut (foot)',
        mi: 'Milya (mile)'
      }
    },
    weight: {
      name: "Og'irlik",
      rates: {
        kg: 1,
        g: 0.001,
        mg: 0.000001,
        t: 1000,
        lb: 0.453592,
        oz: 0.0283495
      },
      labels: {
        kg: 'Kilogramm (kg)',
        g: 'Gramm (g)',
        mg: 'Milligramm (mg)',
        t: 'Tonna (t)',
        lb: 'Funt (lb)',
        oz: 'Unsiya (oz)'
      }
    },
    digital: {
      name: 'Raqamli Xotira',
      rates: {
        B: 1,
        KB: 1024,
        MB: 1048576,
        GB: 1073741824,
        TB: 1099511627776
      },
      labels: {
        B: 'Bayt (B)',
        KB: 'Kilobayt (KB)',
        MB: 'Megabayt (MB)',
        GB: 'Gigabayt (GB)',
        TB: 'Terabayt (TB)'
      }
    }
  };

  let activeConvCategory = 'currency';

  function initConverterOptions(cat) {
    activeConvCategory = cat;
    const catData = CONVERTER_DATA[cat];
    if (!catData) return;

    convFromUnit.innerHTML = '';
    convToUnit.innerHTML = '';

    const keys = Object.keys(catData.rates);
    keys.forEach((key, index) => {
      const opt1 = new Option(catData.labels[key] || key, key);
      const opt2 = new Option(catData.labels[key] || key, key);
      convFromUnit.add(opt1);
      convToUnit.add(opt2);
    });

    if (keys.length > 1) {
      if (cat === 'currency') {
        convFromUnit.value = 'USD';
        convToUnit.value = 'UZS';
      } else {
        convFromUnit.value = keys[0];
        convToUnit.value = keys[1];
      }
    }
    runConversion();
  }

  function runConversion() {
    const val = parseFloat(convInputVal.value);
    if (isNaN(val)) {
      convResultVal.value = '0';
      return;
    }

    const catData = CONVERTER_DATA[activeConvCategory];
    const fromRate = catData.rates[convFromUnit.value];
    const toRate = catData.rates[convToUnit.value];

    // Convert via base rate
    const baseValue = val * fromRate;
    const result = baseValue / toRate;

    // Formatting
    let formatted = result.toLocaleString('en-US', { maximumFractionDigits: 6 });
    convResultVal.value = formatted;

    const singleRate = fromRate / toRate;
    convRateInfo.innerHTML = `<strong>1 ${convFromUnit.value}</strong> = ${singleRate.toLocaleString('en-US', { maximumFractionDigits: 6 })} <strong>${convToUnit.value}</strong>`;
  }

  // App Navigation Tabs
  function setAppMode(mode) {
    state.activeMode = mode;
    [tabStandard, tabScientific, tabConverter].forEach(tab => tab.classList.remove('active'));

    if (mode === 'standard') {
      tabStandard.classList.add('active');
      scientificKeypad.classList.add('hidden');
      standardKeypad.classList.remove('hidden');
      converterView.classList.add('hidden');
      memoryRibbon.classList.remove('hidden');
      document.querySelector('.display-panel').classList.remove('hidden');
    } else if (mode === 'scientific') {
      tabScientific.classList.add('active');
      scientificKeypad.classList.remove('hidden');
      standardKeypad.classList.remove('hidden');
      converterView.classList.add('hidden');
      memoryRibbon.classList.remove('hidden');
      document.querySelector('.display-panel').classList.remove('hidden');
    } else if (mode === 'converter') {
      tabConverter.classList.add('active');
      scientificKeypad.classList.add('hidden');
      standardKeypad.classList.add('hidden');
      converterView.classList.remove('hidden');
      memoryRibbon.classList.add('hidden');
      document.querySelector('.display-panel').classList.add('hidden');
      initConverterOptions(activeConvCategory);
    }
  }

  // Theme Management
  function applyTheme(themeClass) {
    document.body.className = themeClass;
    state.theme = themeClass;
    try {
      localStorage.setItem('calc_theme', themeClass);
    } catch (e) {}

    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeClass);
    });
  }

  function updateSoundUI() {
    if (state.soundEnabled) {
      soundIconOn.classList.remove('hidden');
      soundIconOff.classList.add('hidden');
    } else {
      soundIconOn.classList.add('hidden');
      soundIconOff.classList.remove('hidden');
    }
  }

  // Event Listeners Initialization
  function initListeners() {
    // Mode tabs
    tabStandard.addEventListener('click', () => setAppMode('standard'));
    tabScientific.addEventListener('click', () => setAppMode('scientific'));
    tabConverter.addEventListener('click', () => setAppMode('converter'));

    // Sound toggle
    btnSoundToggle.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      updateSoundUI();
      try {
        localStorage.setItem('calc_sound', state.soundEnabled.toString());
      } catch (e) {}
      showToast(state.soundEnabled ? 'Ovoz yoqildi' : "Ovoz o'chirildi");
    });

    // Theme selector
    btnThemeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!themeMenu.contains(e.target) && e.target !== btnThemeToggle) {
        themeMenu.classList.add('hidden');
      }
    });

    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        applyTheme(btn.dataset.theme);
        themeMenu.classList.add('hidden');
      });
    });

    // History & Memory Drawer Toggle
    btnToggleHistory.addEventListener('click', () => {
      historyDrawer.classList.toggle('closed');
    });

    tabHistList.addEventListener('click', () => {
      tabHistList.classList.add('active');
      tabMemList.classList.remove('active');
      historyListContainer.classList.remove('hidden');
      memoryListContainer.classList.add('hidden');
    });

    tabMemList.addEventListener('click', () => {
      tabMemList.classList.add('active');
      tabHistList.classList.remove('active');
      memoryListContainer.classList.remove('hidden');
      historyListContainer.classList.add('hidden');
    });

    btnClearHistory.addEventListener('click', clearHistory);

    // Copy Result to Clipboard
    btnCopyResult.addEventListener('click', () => {
      const textToCopy = state.currentInput;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Nusxalandi: ${textToCopy}`);
        }).catch(() => {
          fallbackCopy(textToCopy);
        });
      } else {
        fallbackCopy(textToCopy);
      }
    });

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`Nusxalandi: ${text}`);
    }

    // Window controls
    btnWinMin.addEventListener('click', () => {
      showToast('Kichraytirish oynasi faol');
    });

    btnWinMax.addEventListener('click', () => {
      calculatorWindow.classList.toggle('maximized');
    });

    btnWinClose.addEventListener('click', () => {
      if (confirm('Kalkulyator oynasini yopmoqchimisiz?')) {
        window.close();
      }
    });

    // Degree / Radian Toggle
    btnDegRad.addEventListener('click', () => {
      state.angleMode = state.angleMode === 'DEG' ? 'RAD' : 'DEG';
      btnDegRad.textContent = state.angleMode === 'DEG' ? 'RAD' : 'DEG';
      angleUnitBadge.textContent = state.angleMode;
      showToast(`Burchak o'lchovi: ${state.angleMode}`);
    });

    // Memory Ribbon buttons
    memoryRibbon.addEventListener('click', (e) => {
      const btn = e.target.closest('.mem-btn');
      if (!btn || btn.classList.contains('disabled')) return;
      handleMemoryAction(btn.dataset.action);
    });

    // Keypads event delegation
    document.querySelectorAll('.keypads-wrapper').forEach(wrapper => {
      wrapper.addEventListener('click', (e) => {
        const btn = e.target.closest('.calc-btn');
        if (!btn) return;

        // Visual press effect
        btn.classList.add('key-pressed');
        setTimeout(() => btn.classList.remove('key-pressed'), 120);

        // Digits
        if (btn.dataset.num !== undefined) {
          inputDigit(btn.dataset.num);
          return;
        }

        // Actions
        const action = btn.dataset.action;
        if (!action) return;

        switch (action) {
          case 'add':
            handleOperator('+');
            break;
          case 'subtract':
            handleOperator('−');
            break;
          case 'multiply':
            handleOperator('×');
            break;
          case 'divide':
            handleOperator('÷');
            break;
          case 'power-y':
            handleOperator('^');
            break;
          case 'equals':
            calculateResult();
            break;
          case 'clear-all':
            clearAll();
            break;
          case 'clear-entry':
            clearEntry();
            break;
          case 'backspace':
            backspace();
            break;
          case 'negate':
            negate();
            break;
          case 'open-paren':
            playSound('op');
            state.expression += '(';
            updateDisplay();
            break;
          case 'close-paren':
            playSound('op');
            state.expression += state.currentInput + ')';
            state.currentInput = '0';
            updateDisplay();
            break;
          case 'pi':
            playSound('num');
            state.currentInput = Math.PI.toString();
            state.isNewCalculation = true;
            updateDisplay();
            break;
          case 'euler':
            playSound('num');
            state.currentInput = Math.E.toString();
            state.isNewCalculation = true;
            updateDisplay();
            break;
          default:
            applySingleFunction(action);
            break;
        }
      });
    });

    // Converter view listeners
    document.querySelectorAll('.conv-sub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.conv-sub-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        initConverterOptions(btn.dataset.convType);
      });
    });

    convInputVal.addEventListener('input', runConversion);
    convFromUnit.addEventListener('change', runConversion);
    convToUnit.addEventListener('change', runConversion);

    btnSwapConv.addEventListener('click', () => {
      const temp = convFromUnit.value;
      convFromUnit.value = convToUnit.value;
      convToUnit.value = temp;
      runConversion();
    });

    // Shortcuts modal
    btnShortcutsHint.addEventListener('click', () => {
      shortcutsModal.classList.remove('hidden');
    });

    btnCloseShortcuts.addEventListener('click', () => {
      shortcutsModal.classList.add('hidden');
    });

    shortcutsModal.addEventListener('click', (e) => {
      if (e.target === shortcutsModal) {
        shortcutsModal.classList.add('hidden');
      }
    });

    // Global Keyboard Listeners
    window.addEventListener('keydown', handleGlobalKeydown);
  }

  function handleGlobalKeydown(e) {
    if (shortcutsModal && !shortcutsModal.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        shortcutsModal.classList.add('hidden');
      }
      return;
    }

    // Ignore if typing inside converter inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      return;
    }

    const key = e.key;

    // Number keys
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      animateKey(`[data-num="${key}"]`);
      inputDigit(key);
      return;
    }

    if (key === '.' || key === ',') {
      e.preventDefault();
      animateKey('[data-num="."]');
      inputDigit('.');
      return;
    }

    // Operators
    if (key === '+') {
      e.preventDefault();
      animateKey('[data-action="add"]');
      handleOperator('+');
    } else if (key === '-') {
      e.preventDefault();
      animateKey('[data-action="subtract"]');
      handleOperator('−');
    } else if (key === '*' || key === 'x' || key === 'X') {
      e.preventDefault();
      animateKey('[data-action="multiply"]');
      handleOperator('×');
    } else if (key === '/') {
      e.preventDefault();
      animateKey('[data-action="divide"]');
      handleOperator('÷');
    } else if (key === '^') {
      e.preventDefault();
      animateKey('[data-action="power-y"]');
      handleOperator('^');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      animateKey('[data-action="equals"]');
      calculateResult();
    } else if (key === 'Backspace') {
      e.preventDefault();
      animateKey('[data-action="backspace"]');
      backspace();
    } else if (key === 'Escape') {
      e.preventDefault();
      animateKey('[data-action="clear-all"]');
      clearAll();
    } else if (key === '%') {
      e.preventDefault();
      animateKey('[data-action="percent"]');
      applySingleFunction('percent');
    } else if (key === '(') {
      e.preventDefault();
      animateKey('[data-action="open-paren"]');
      state.expression += '(';
      updateDisplay();
    } else if (key === ')') {
      e.preventDefault();
      animateKey('[data-action="close-paren"]');
      state.expression += state.currentInput + ')';
      state.currentInput = '0';
      updateDisplay();
    } else if (key === 'h' || key === 'H') {
      historyDrawer.classList.toggle('closed');
    }
  }

  function animateKey(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add('key-pressed');
      setTimeout(() => el.classList.remove('key-pressed'), 120);
    }
  }

  // Initialize Application
  function init() {
    loadPersistedState();
    initListeners();
    initConverterOptions('currency');
    updateDisplay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
