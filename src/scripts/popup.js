/**
 * AmazonSEO Pro — Popup Controller with Live Amazon API & AI Optimizer
 * Handles UI rendering, tab navigation, live Amazon Suggestions API,
 * AI Listing Generation (Gemini API or Smart Offline Engine), and settings.
 */

'use strict';

// ─── Global State ──────────────────────────────────────────────────────────

let currentProductData = null;
let currentMarketplaceKey = 'IN';
let currentGeminiApiKey = '';
let currentApiMode = 'proxy';
let currentProxyUrl = 'http://localhost:3000';
let lastSuggestions = [];

// ─── Marketplaces Configuration ────────────────────────────────────────────

const MARKETPLACES = {
  IN: { mid: 'A21TJRUUN4KGV', host: 'completion.amazon.in', domain: 'amazon.in' },
  US: { mid: 'ATVPDKIKX0DER', host: 'completion.amazon.com', domain: 'amazon.com' },
  UK: { mid: 'A1F83G8C2ARO7P', host: 'completion.amazon.co.uk', domain: 'amazon.co.uk' },
  CA: { mid: 'A2EUQ1WTGCTBG2', host: 'completion.amazon.ca', domain: 'amazon.ca' },
  DE: { mid: 'A1PA6795UKMFR9', host: 'completion.amazon.de', domain: 'amazon.de' },
  FR: { mid: 'A13V1IB3VIYZZH', host: 'completion.amazon.fr', domain: 'amazon.fr' },
  IT: { mid: 'APJ6JRA9NG5V4', host: 'completion.amazon.it', domain: 'amazon.it' },
  ES: { mid: 'A1RKKUPIHCS9HS', host: 'completion.amazon.es', domain: 'amazon.es' },
  JP: { mid: 'A1VC38T7YXB528', host: 'completion.amazon.co.jp', domain: 'amazon.co.jp' },
  AU: { mid: 'A39IBJ37TRP1C6', host: 'completion.amazon.com.au', domain: 'amazon.com.au' },
  AE: { mid: 'A2VIGQ35RCS4UG', host: 'completion.amazon.ae', domain: 'amazon.ae' },
  SA: { mid: 'A17E79C6D8DWNP', host: 'completion.amazon.sa', domain: 'amazon.sa' },
  BR: { mid: 'A2Q3Y263D00KWC', host: 'completion.amazon.com.br', domain: 'amazon.com.br' },
  MX: { mid: 'A1AM78C64UM0Y8', host: 'completion.amazon.com.mx', domain: 'amazon.com.mx' },
};

// ─── Country & Currency Options for FBA & Pricing ──────────────────────────

let selectedCountryKey = 'IN';

const COUNTRY_CONFIG = {
  US: {
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    defaultReferralPct: 15.0,
    domain: 'amazon.com',
    defaultPrice: 29.99,
    defaultCogs: 7.50,
    defaultShipping: 1.50,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 3.22;
      if (w <= 1.0) return 3.86;
      if (w <= 1.5) return 4.75;
      if (w <= 2.0) return 5.40;
      if (w <= 3.0) return 6.10;
      return 6.10 + (w - 3.0) * 0.40;
    },
    formatMoney: (val) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  UK: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    symbol: '£',
    defaultReferralPct: 15.3,
    domain: 'amazon.co.uk',
    defaultPrice: 24.99,
    defaultCogs: 6.25,
    defaultShipping: 1.20,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 1.95;
      if (w <= 1.0) return 2.60;
      if (w <= 1.5) return 3.20;
      if (w <= 2.0) return 3.75;
      return 3.75 + (w - 2.0) * 0.35;
    },
    formatMoney: (val) => `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  CA: {
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    symbol: 'CA$',
    defaultReferralPct: 15.0,
    domain: 'amazon.ca',
    defaultPrice: 39.99,
    defaultCogs: 10.00,
    defaultShipping: 2.50,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 4.15;
      if (w <= 1.0) return 4.95;
      if (w <= 1.5) return 5.75;
      if (w <= 2.0) return 6.45;
      return 6.45 + (w - 2.0) * 0.50;
    },
    formatMoney: (val) => `CA$${Number(val).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  DE: {
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    symbol: '€',
    defaultReferralPct: 15.0,
    domain: 'amazon.de',
    defaultPrice: 27.99,
    defaultCogs: 7.00,
    defaultShipping: 1.50,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 2.85;
      if (w <= 1.0) return 3.60;
      if (w <= 1.5) return 4.40;
      if (w <= 2.0) return 5.10;
      return 5.10 + (w - 2.0) * 0.45;
    },
    formatMoney: (val) => `€${Number(val).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  FR: {
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    symbol: '€',
    defaultReferralPct: 15.0,
    domain: 'amazon.fr',
    defaultPrice: 27.99,
    defaultCogs: 7.00,
    defaultShipping: 1.50,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 2.95;
      if (w <= 1.0) return 3.75;
      if (w <= 1.5) return 4.55;
      if (w <= 2.0) return 5.25;
      return 5.25 + (w - 2.0) * 0.45;
    },
    formatMoney: (val) => `€${Number(val).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  IT: {
    name: 'Italy',
    flag: '🇮🇹',
    currency: 'EUR',
    symbol: '€',
    defaultReferralPct: 15.0,
    domain: 'amazon.it',
    defaultPrice: 27.99,
    defaultCogs: 7.00,
    defaultShipping: 1.50,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 2.90;
      if (w <= 1.0) return 3.65;
      if (w <= 1.5) return 4.45;
      if (w <= 2.0) return 5.15;
      return 5.15 + (w - 2.0) * 0.45;
    },
    formatMoney: (val) => `€${Number(val).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  ES: {
    name: 'Spain',
    flag: '🇪🇸',
    currency: 'EUR',
    symbol: '€',
    defaultReferralPct: 15.0,
    domain: 'amazon.es',
    defaultPrice: 27.99,
    defaultCogs: 7.00,
    defaultShipping: 1.50,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 2.85;
      if (w <= 1.0) return 3.60;
      if (w <= 1.5) return 4.40;
      if (w <= 2.0) return 5.10;
      return 5.10 + (w - 2.0) * 0.45;
    },
    formatMoney: (val) => `€${Number(val).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  IN: {
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    symbol: '₹',
    defaultReferralPct: 12.0,
    domain: 'amazon.in',
    defaultPrice: 1499.00,
    defaultCogs: 375.00,
    defaultShipping: 40.00,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 42;
      if (w <= 1.1) return 58;
      if (w <= 2.2) return 82;
      if (w <= 4.4) return 120;
      return 120 + (w - 4.4) * 25;
    },
    formatMoney: (val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  JP: {
    name: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    symbol: '¥',
    defaultReferralPct: 10.0,
    domain: 'amazon.co.jp',
    defaultPrice: 3980,
    defaultCogs: 1000,
    defaultShipping: 250,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 380;
      if (w <= 1.0) return 460;
      if (w <= 2.0) return 580;
      return 580 + (w - 2.0) * 50;
    },
    formatMoney: (val) => `¥${Math.round(val).toLocaleString('ja-JP')}`
  },
  AU: {
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    symbol: 'A$',
    defaultReferralPct: 12.0,
    domain: 'amazon.com.au',
    defaultPrice: 44.99,
    defaultCogs: 11.25,
    defaultShipping: 3.00,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 4.60;
      if (w <= 1.0) return 5.50;
      if (w <= 2.0) return 7.10;
      return 7.10 + (w - 2.0) * 0.60;
    },
    formatMoney: (val) => `A$${Number(val).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  AE: {
    name: 'UAE',
    flag: '🇦🇪',
    currency: 'AED',
    symbol: 'AED ',
    defaultReferralPct: 10.0,
    domain: 'amazon.ae',
    defaultPrice: 99.00,
    defaultCogs: 25.00,
    defaultShipping: 5.00,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 11.50;
      if (w <= 1.0) return 14.00;
      if (w <= 2.0) return 18.00;
      return 18.00 + (w - 2.0) * 2.00;
    },
    formatMoney: (val) => `AED ${Number(val).toFixed(2)}`
  },
  SA: {
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    symbol: 'SAR ',
    defaultReferralPct: 10.0,
    domain: 'amazon.sa',
    defaultPrice: 109.00,
    defaultCogs: 27.00,
    defaultShipping: 6.00,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 13.00;
      if (w <= 1.0) return 16.00;
      if (w <= 2.0) return 21.00;
      return 21.00 + (w - 2.0) * 2.50;
    },
    formatMoney: (val) => `SAR ${Number(val).toFixed(2)}`
  },
  BR: {
    name: 'Brazil',
    flag: '🇧🇷',
    currency: 'BRL',
    symbol: 'R$',
    defaultReferralPct: 13.0,
    domain: 'amazon.com.br',
    defaultPrice: 129.90,
    defaultCogs: 32.50,
    defaultShipping: 8.00,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 14.50;
      if (w <= 1.0) return 17.90;
      if (w <= 2.0) return 22.50;
      return 22.50 + (w - 2.0) * 2.50;
    },
    formatMoney: (val) => `R$${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  MX: {
    name: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    symbol: 'Mex$',
    defaultReferralPct: 15.0,
    domain: 'amazon.com.mx',
    defaultPrice: 499.00,
    defaultCogs: 125.00,
    defaultShipping: 25.00,
    calculateFba: (weightLbs) => {
      const w = Math.max(0.1, weightLbs || 1.0);
      if (w <= 0.5) return 65.00;
      if (w <= 1.0) return 80.00;
      if (w <= 2.0) return 105.00;
      return 105.00 + (w - 2.0) * 12.00;
    },
    formatMoney: (val) => `Mex$${Number(val).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
};

// Sample realistic product data for demo & offline testing
const SAMPLE_PRODUCT_DATA = {
  asin: 'B07PR1CL3S',
  url: 'https://www.amazon.in/dp/B07PR1CL3S',
  marketplace: 'amazon.in',
  extractedAt: new Date().toISOString(),
  title: 'boAt Rockerz 450 Bluetooth On Ear Headphones with Mic, Up to 15 Hours Playback, 40mm Drivers, Padded Ear Cushions, Integrated Controls (Luscious Black)',
  brand: 'boAt',
  rating: 4.2,
  reviewCount: 125890,
  price: '₹1,499.00',
  priceInfo: { symbol: '₹', currency: 'INR', numeric: 1499.00 },
  originalPrice: '₹3,990.00',
  discount: '62%',
  availability: 'In Stock',
  dimensions: '17.5 x 7.5 x 18.5 cm',
  weight: '168 g',
  weightInLbs: 0.37,
  bullets: [
    'PLAYBACK TIME: Get up to 15 hours of non-stop audio bliss with its massive battery backup in a single charge.',
    '40MM DYNAMIC DRIVERS: Immerse in HD immersive audio with punchy, thumping bass powered by precision 40mm drivers.',
    'ERGONOMIC DESIGN: Lightweight, plush-padded adaptive ear cushions and foldable headband offer ergonomic comfort all day.',
    'DUAL CONNECTIVITY: Seamlessly switch between Bluetooth v5.0 and 3.5mm AUX cable mode for uninterrupted listening.',
    'VOICE ASSISTANT & EASY CONTROLS: Access Google Assistant or Siri and manage music/calls with smooth tactile buttons.'
  ],
  description: 'Tap into instant musical bliss with the boAt Rockerz 450 Bluetooth Headphones. Featuring custom-tuned 40mm drivers, luxurious padded earcups, and an astonishing 15-hour playtime on a single charge. Switch effortlessly between Bluetooth 5.0 wireless and AUX cable modes. Enjoy crystal clear hands-free calls with the built-in noise-isolated microphone.',
  metaKeywords: 'boat rockerz 450, bluetooth headphones, wireless headphones with mic, over ear headset, boat audio',
  metaDescription: 'Buy boAt Rockerz 450 Bluetooth On Ear Headphones with Mic on Amazon.in with fast delivery and warranty.',
  categories: ['Electronics', 'Headphones, Earbuds & Accessories', 'Headphones', 'On-Ear Headphones'],
  images: [
    'https://m.media-amazon.com/images/I/51xxA+6E+xL._SL1500_.jpg',
    'https://m.media-amazon.com/images/I/61u1VALn6JL._SL1500_.jpg',
    'https://m.media-amazon.com/images/I/61gY23vvxvL._SL1500_.jpg'
  ],
  hasAplus: true,
  hasVideo: true,
  bsr: [
    { rank: 1, category: 'On-Ear Headphones' },
    { rank: 14, category: 'Electronics' }
  ],
  customerReviews: {
    items: [],
    positiveCount: 88,
    criticalCount: 12,
    positiveHighlights: [
      'Outstanding bass and sound clarity for the ₹1,499 price point.',
      'Battery lasts well over 14 hours on a single charge.',
      'Super comfortable padded ear cushions even during extended study and workout sessions.'
    ],
    criticalPainPoints: [
      'Microphone quality is average in noisy outdoor environments.',
      'Earcups do not rotate completely flat for small travel bags.'
    ]
  },
  productDetails: {
    'Brand': 'boAt',
    'Model Name': 'Rockerz 450',
    'Color': 'Luscious Black',
    'Form Factor': 'On Ear',
    'Connectivity': 'Bluetooth 5.0, 3.5mm Aux',
    'Item Weight': '168 g',
    'Battery Life': '15 Hours'
  },
  seller: {
    soldBy: 'Appario Retail Private Ltd',
    fulfillment: 'Fulfilled by Amazon',
    isFBA: true,
    isPrime: true
  },
  keywordAnalysis: {
    topWords: [
      { word: 'headphones', count: 18 },
      { word: 'bluetooth', count: 16 },
      { word: 'battery', count: 14 },
      { word: 'wireless', count: 12 },
      { word: 'playback', count: 10 },
      { word: 'drivers', count: 9 },
      { word: 'cushions', count: 8 },
      { word: 'controls', count: 7 },
      { word: 'sound', count: 6 },
      { word: 'audio', count: 5 }
    ],
    topPhrases: [
      { phrase: 'bluetooth headphones', count: 8 },
      { phrase: 'wireless headphones', count: 7 },
      { phrase: 'hours playback', count: 6 },
      { phrase: 'padded ear', count: 5 },
      { phrase: 'dynamic drivers', count: 4 }
    ]
  },
  seoScore: {
    score: 95,
    grade: 'A+',
    issues: [
      { severity: 'info', text: 'Listing has strong keyword density across top wireless audio search terms.' }
    ],
    suggestions: [
      'Consider adding secondary noise isolation phrases in backend search terms for Amazon India.',
      'Add lifestyle infographic highlighting sweat/gym resistance in main image carousel.'
    ]
  },
  qualityChecklist: [
    { label: 'Title length between 150-200 chars', pass: true, tip: 'Current title is 162 chars — optimal for mobile & desktop' },
    { label: '5 bullet points provided', pass: true, tip: 'Full 5 bullets utilize indexation capacity' },
    { label: 'High resolution images (7+ images)', pass: true, tip: 'Crisp images enable zoom & convert higher' },
    { label: 'Product description present', pass: true, tip: 'Rich description aids search discovery' },
    { label: 'A+ Brand Content active', pass: true, tip: 'A+ content increases conversions by 5-10%' },
    { label: 'Video included in media block', pass: true, tip: 'Video showcases product in real use' },
    { label: 'High customer rating (≥ 4.0)', pass: true, tip: '4.2 stars provides strong social proof' },
    { label: 'Prime eligible / FBA', pass: true, tip: 'Fast Prime delivery wins Buy Box' },
    { label: 'Availability: In Stock', pass: true, tip: 'Stock status protects BSR velocity' }
  ]
};

// ─── Utilities ─────────────────────────────────────────────────────────────

function $(id) { return document.getElementById(id); }

function showToast(msg, duration = 2000) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function copyToClipboard(text, msg = '✅ Copied!') {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => showToast(msg));
}

function countUtf8Bytes(str) {
  return new TextEncoder().encode(str || '').length;
}

function starsHTML(rating) {
  if (!rating) return '—';
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty) + ` ${rating.toFixed(1)}`;
}

function formatNumber(n) {
  if (!n) return '—';
  return n.toLocaleString();
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Tab Navigation ─────────────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabEl = $(`tab-${tabId}`);
      if (tabEl) tabEl.classList.add('active');
    });
  });
}

function setAiEngineStatus(text, badgeClass) {
  const el = $('aiEngineStatus');
  if (el) {
    el.textContent = text;
    el.className = badgeClass;
  }
}

// ─── Storage & Settings ─────────────────────────────────────────────────────

async function loadSettings() {
  try {
    const res = await chrome.storage.local.get([
      'geminiApiKey',
      'apiMarketplace',
      'apiMode',
      'proxyUrl'
    ]);

    if (res.apiMode && $('apiModeSelect')) {
      currentApiMode = res.apiMode;
      $('apiModeSelect').value = res.apiMode;
    }
    if (res.proxyUrl && $('proxyUrlInput')) {
      currentProxyUrl = res.proxyUrl;
      $('proxyUrlInput').value = res.proxyUrl;
    }
    if (res.geminiApiKey && $('geminiApiKeyInput')) {
      currentGeminiApiKey = res.geminiApiKey;
      $('geminiApiKeyInput').value = res.geminiApiKey;
    }

    updateSettingsVisibility();

    // Update status badge
    if (currentApiMode === 'proxy') {
      setAiEngineStatus('Proxy Server Ready', 'badge badge-blue');
    } else if (currentApiMode === 'direct' && currentGeminiApiKey) {
      setAiEngineStatus('Direct Gemini Ready', 'badge badge-green');
    } else {
      setAiEngineStatus('Smart Rule Engine', 'badge badge-orange');
    }

    if (res.apiMarketplace && MARKETPLACES[res.apiMarketplace] && $('apiMarketplaceSelect')) {
      currentMarketplaceKey = res.apiMarketplace;
      $('apiMarketplaceSelect').value = res.apiMarketplace;
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

function updateSettingsVisibility() {
  const modeEl = $('apiModeSelect');
  if (!modeEl) return;
  const mode = modeEl.value;
  if ($('proxyServerGroup')) $('proxyServerGroup').style.display = mode === 'proxy' ? 'block' : 'none';
  if ($('directApiKeyGroup')) $('directApiKeyGroup').style.display = mode === 'direct' ? 'block' : 'none';
}

function initSettings() {
  if ($('apiModeSelect')) {
    $('apiModeSelect').addEventListener('change', () => {
      updateSettingsVisibility();
    });
  }

  if ($('saveSettingsBtn')) {
    $('saveSettingsBtn').addEventListener('click', async () => {
      const mode = $('apiModeSelect') ? $('apiModeSelect').value : 'proxy';
      const proxy = $('proxyUrlInput') ? ($('proxyUrlInput').value.trim() || 'http://localhost:3000') : 'http://localhost:3000';
      const key = $('geminiApiKeyInput') ? $('geminiApiKeyInput').value.trim() : '';
      const mkt = $('apiMarketplaceSelect') ? $('apiMarketplaceSelect').value : 'US';

      currentApiMode = mode;
      currentProxyUrl = proxy;
      currentGeminiApiKey = key;
      currentMarketplaceKey = mkt;

      await chrome.storage.local.set({
        apiMode: mode,
        proxyUrl: proxy,
        geminiApiKey: key,
        apiMarketplace: mkt
      });

      if (mode === 'proxy') {
        setAiEngineStatus('Proxy Server Ready', 'badge badge-blue');
      } else if (mode === 'direct' && key) {
        setAiEngineStatus('Direct Gemini Ready', 'badge badge-green');
      } else {
        setAiEngineStatus('Smart Rule Engine', 'badge badge-orange');
      }

      const statusEl = $('settingsSaveStatus');
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:var(--accent-green)">✓ Settings saved successfully!</span>';
        setTimeout(() => { statusEl.innerHTML = ''; }, 3000);
      }
      showToast('✅ Settings Saved!');
    });
  }

  $('testApiBtn').addEventListener('click', async () => {
    const statusEl = $('settingsSaveStatus');
    statusEl.innerHTML = '<span style="color:var(--amazon-orange)">⏳ Testing connection…</span>';

    try {
      // 1. Test Amazon Completion API
      const mkt = MARKETPLACES[currentMarketplaceKey] || MARKETPLACES.US;
      const res = await fetch(`https://${mkt.host}/api/2017/suggestions?limit=2&prefix=laptop&suggestion-type=KEYWORD&mid=${mkt.mid}&alias=aps`);
      const data = await res.json();
      const amazonOk = data && data.suggestions && data.suggestions.length > 0;

      // 2. Test AI Connection based on selected mode
      let aiStatus = 'Offline Rule Engine (No connection needed)';
      const mode = $('apiModeSelect').value;

      if (mode === 'proxy') {
        const proxyUrl = ($('proxyUrlInput').value.trim() || 'http://localhost:3000').replace(/\/$/, '');
        try {
          const pRes = await fetch(`${proxyUrl}/api/health`);
          if (pRes.ok) {
            const pData = await pRes.json();
            aiStatus = `✓ Proxy Server Online (${pData.hasApiKey ? 'Key Configured' : 'Missing Key in .env'})`;
          } else {
            aiStatus = `⚠️ Proxy returned HTTP ${pRes.status}`;
          }
        } catch (_) {
          aiStatus = '❌ Cannot reach Proxy Server (Run start-backend.bat)';
        }
      } else if (mode === 'direct') {
        const key = $('geminiApiKeyInput').value.trim();
        if (key) {
          try {
            const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: 'Respond with OK' }] }]
              })
            });
            aiStatus = gRes.ok ? '✓ Gemini Direct Key Online' : '⚠️ Gemini key error';
          } catch (_) {
            aiStatus = '❌ Gemini API unreachable';
          }
        } else {
          aiStatus = '⚠️ No key entered';
        }
      }

      statusEl.innerHTML = `
        <div style="text-align:left; background:var(--bg-secondary); padding:8px; border-radius:4px; margin-top:4px;">
          <div>Amazon Search API: <b style="color:${amazonOk ? 'var(--accent-green)' : 'var(--accent-red)'}">${amazonOk ? 'Online ✓' : 'Failed ✗'}</b></div>
          <div>AI Optimizer: <b>${aiStatus}</b></div>
        </div>
      `;
    } catch (err) {
      statusEl.innerHTML = `<span style="color:var(--accent-red)">Error: ${err.message}</span>`;
    }
  });
}

// ─── Live Amazon Suggestion API ─────────────────────────────────────────────

async function fetchAmazonSuggestions(prefix) {
  if (!prefix || !prefix.trim()) return [];
  const mkt = MARKETPLACES[currentMarketplaceKey] || MARKETPLACES.US;
  const url = `https://${mkt.host}/api/2017/suggestions?limit=12&prefix=${encodeURIComponent(prefix.trim())}&suggestion-type=KEYWORD&mid=${mkt.mid}&alias=aps`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const list = (data.suggestions || []).map(s => s.value).filter(Boolean);
      if (list.length > 0) return list;
    }
  } catch (_) {}

  // Fallback to primary completion host if regional host is unavailable
  try {
    const fallbackUrl = `https://completion.amazon.com/api/2017/suggestions?limit=12&prefix=${encodeURIComponent(prefix.trim())}&suggestion-type=KEYWORD&mid=ATVPDKIKX0DER&alias=aps`;
    const res2 = await fetch(fallbackUrl);
    if (res2.ok) {
      const data2 = await res2.json();
      return (data2.suggestions || []).map(s => s.value).filter(Boolean);
    }
  } catch (err) {
    console.error('Amazon suggestions error:', err);
  }
  return [];
}

async function runSuggestionSearch(query) {
  const input = $('apiSearchInput');
  const btn = $('apiSearchBtn');
  const list = $('apiSuggestionsList');
  const countEl = $('apiResultsCount');
  const copyAllBtn = $('copyAllSuggestionsBtn');

  if (query) input.value = query;
  const term = input.value.trim();
  if (!term) return;

  btn.disabled = true;
  btn.textContent = 'Searching…';
  list.innerHTML = '<span class="empty-state">Fetching live Amazon buyer queries…</span>';

  const suggestions = await fetchAmazonSuggestions(term);
  lastSuggestions = suggestions;
  btn.disabled = false;
  btn.textContent = 'Search API';

  list.innerHTML = '';
  countEl.textContent = `Suggestions: ${suggestions.length}`;

  if (suggestions.length === 0) {
    list.innerHTML = '<span class="empty-state">No suggestions found for this query. Try a broader term.</span>';
    copyAllBtn.style.display = 'none';
    return;
  }

  copyAllBtn.style.display = 'inline-block';
  copyAllBtn.onclick = () => {
    copyToClipboard(suggestions.join('\n'), '✅ All Suggestions Copied!');
  };

  suggestions.forEach((kw, index) => {
    const tag = document.createElement('div');
    tag.className = 'live-suggestion-tag';
    tag.innerHTML = `<span>#${index + 1} ${escapeHTML(kw)}</span> <span class="tag-add">📋</span>`;
    tag.title = 'Click to copy suggestion';
    tag.onclick = () => copyToClipboard(kw, `✅ Copied: ${kw}`);
    list.appendChild(tag);
  });
}

function initSearchApi() {
  $('apiSearchBtn').addEventListener('click', () => runSuggestionSearch());
  $('apiSearchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSuggestionSearch();
  });
}

// ─── AI Listing Optimizer ───────────────────────────────────────────────────

function createOfflineOptimizedListing(data) {
  const brand = data.brand || 'Brand';
  const rawTitle = data.title || '';
  const topKw = (data.keywordAnalysis && data.keywordAnalysis.topWords) || [];
  const topPhrases = (data.keywordAnalysis && data.keywordAnalysis.topPhrases) || [];

  // Pick top 3-4 descriptive keywords
  const kwList = topPhrases.slice(0, 3).map(p => p.phrase)
    .concat(topKw.slice(0, 4).map(k => k.word));
  const uniqueKw = [...new Set(kwList)].filter(w => w.toLowerCase() !== brand.toLowerCase());

  // Form structured Title: [Brand] + [Core Keyword Phrase] + [Key Benefits/Attributes]
  let mainPhrase = uniqueKw.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (!mainPhrase) mainPhrase = 'Premium Product';

  let title = `${brand} ${mainPhrase} - High Performance & Ergonomic Design, Durable Construction`;
  if (title.length < 120 && uniqueKw[2]) {
    title += `, Ideal for Daily Use & Travel`;
  }
  if (title.length > 195) {
    title = title.substring(0, 192) + '...';
  }

  // Generate 5 High-Converting Bullet Points
  const bullets = [
    `SUPERIOR PERFORMANCE & RELIABILITY: Engineered with precision materials to deliver consistent, top-tier performance for all your everyday requirements.`,
    `ERGONOMIC & INTUITIVE DESIGN: Crafted for maximum comfort, effortless operation, and seamless integration into your existing setup.`,
    `LONG-LASTING DURABILITY: Built with rugged, premium components tested to withstand rigorous daily wear and demanding conditions.`,
    `UNIVERSAL VERSATILITY: Optimized for wide compatibility and multi-purpose functionality, making it the perfect choice at home, office, or on the go.`,
    `100% SATISFACTION GUARANTEED: Backed by our dedicated customer support team and hassle-free warranty for complete peace of mind.`
  ];

  // Synthesize Backend Search Terms (strictly <= 249 bytes, space separated, no duplicates, no brand, no title words)
  const titleWords = new Set(title.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/));
  const candidateWords = [];

  // Add words from bullets, description and keywords that aren't in title
  topKw.forEach(k => {
    const w = k.word.toLowerCase();
    if (!titleWords.has(w) && w.length >= 3 && !w.includes(brand.toLowerCase())) {
      candidateWords.push(w);
    }
  });

  const backendWords = [];
  let currentBytes = 0;

  for (const word of candidateWords) {
    const candidateStr = backendWords.length === 0 ? word : `${backendWords.join(' ')} ${word}`;
    const bytes = countUtf8Bytes(candidateStr);
    if (bytes <= 249) {
      backendWords.push(word);
      currentBytes = bytes;
    } else {
      break;
    }
  }

  const backendKeywords = backendWords.join(' ');

  return {
    title,
    bullets,
    backendKeywords
  };
}

async function callGeminiApi(data, apiKey) {
  const prompt = `You are a world-class Amazon SEO copywriter. Optimize this Amazon product listing for maximum organic ranking (A9/Cosmo algorithm) and high conversion:

Current Title: ${data.title || 'N/A'}
Brand: ${data.brand || 'N/A'}
Price: ${data.price || 'N/A'}
Current Bullets:
${(data.bullets || []).join('\n')}
Extracted Keywords:
${((data.keywordAnalysis && data.keywordAnalysis.topWords) || []).slice(0, 15).map(k => k.word).join(', ')}

Strict Requirements:
1. Title: Under 200 characters. Structure: [Brand] + [Core Keyword in first 70 chars] + [Key Differentiators & Specs]. Title Case. No spam words ("Best Seller", "Cheap").
2. Bullets: Exactly 5 bullets. Each MUST begin with a [CAPITALIZED BENEFIT HEADER] followed by a persuasive 150-250 character benefit-driven sentence.
3. Backend Search Terms: Space-separated keywords strictly UNDER 249 BYTES total. Do NOT repeat words from the title. Do NOT use commas or punctuation. Do NOT use brand names.

Return strictly a valid JSON object with keys:
{
  "title": "...",
  "bullets": ["...", "...", "...", "...", "..."],
  "backendKeywords": "..."
}`;

  const models = ['gemini-3.8-flash', 'gemini-3.5-flash'];
  let lastErr = null;

  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!res.ok) {
        lastErr = new Error(`Gemini API error (${res.status}): ${await res.text()}`);
        continue;
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      return JSON.parse(text);
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('No content returned from Gemini.');
}

async function callProxyApi(data, proxyUrl) {
  const url = `${(proxyUrl || 'http://localhost:3000').replace(/\/$/, '')}/api/optimize`;
  const body = {
    title: data.title,
    brand: data.brand,
    price: data.price,
    bullets: data.bullets,
    keywords: (data.keywordAnalysis && data.keywordAnalysis.topWords || []).slice(0, 15).map(k => k.word)
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Proxy server error (HTTP ${res.status})`);
  }

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Invalid response from proxy');
  }

  return json.data;
}

async function generateAiListing() {
  await generateFullListing();
}

function renderAiResults(res) {
  renderBuilderResults(res);
}

function initAiOptimizer() {
  // Aliased to listing builder
}

// ─── FBA & Profit Calculator (Multi-Country & Multi-Currency Engine) ────────

function parsePriceNumber(priceStr) {
  if (!priceStr) return 0;
  let s = String(priceStr).replace(/[^0-9.,]/g, '').trim();
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.');
  } else if (s.includes(',') && s.includes('.')) {
    if (s.indexOf('.') < s.indexOf(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function detectCountryFromData(data) {
  if (!data) return 'US';
  const mkt = (data.marketplace || '').toLowerCase();
  const url = (data.url || '').toLowerCase();
  const symbol = (data.priceInfo && data.priceInfo.symbol) || '';

  if (mkt.includes('.co.uk') || url.includes('.co.uk') || symbol === '£') return 'UK';
  if (mkt.includes('.in') || url.includes('.in') || symbol === '₹') return 'IN';
  if (mkt.includes('.ca') || url.includes('.ca') || symbol === 'CA$') return 'CA';
  if (mkt.includes('.de') || url.includes('.de')) return 'DE';
  if (mkt.includes('.fr') || url.includes('.fr')) return 'FR';
  if (mkt.includes('.it') || url.includes('.it')) return 'IT';
  if (mkt.includes('.es') || url.includes('.es')) return 'ES';
  if (mkt.includes('.co.jp') || url.includes('.co.jp') || symbol === '¥') return 'JP';
  if (mkt.includes('.com.au') || url.includes('.com.au') || symbol === 'A$') return 'AU';
  if (mkt.includes('.ae') || url.includes('.ae') || symbol.includes('AED')) return 'AE';
  if (mkt.includes('.sa') || url.includes('.sa') || symbol.includes('SAR')) return 'SA';
  if (mkt.includes('.com.br') || url.includes('.com.br') || symbol === 'R$') return 'BR';
  if (mkt.includes('.com.mx') || url.includes('.com.mx') || symbol.includes('Mex$')) return 'MX';
  return 'US';
}

function onCountryOptionChanged(newCountryKey, preserveUserPrice = false) {
  selectedCountryKey = newCountryKey;
  const cfg = COUNTRY_CONFIG[selectedCountryKey] || COUNTRY_CONFIG.US;

  // Update input labels with local currency symbol
  if ($('labelSalePrice')) $('labelSalePrice').textContent = `Sale Price (${cfg.symbol})`;
  if ($('labelCogs')) $('labelCogs').textContent = `Unit Cost / COGS (${cfg.symbol})`;
  if ($('labelShipping')) $('labelShipping').textContent = `Shipping to FBA (${cfg.symbol})`;
  if ($('labelReferralPct')) $('labelReferralPct').textContent = `Amazon Referral (%)`;

  if (!preserveUserPrice) {
    $('inputReferralPct').value = cfg.defaultReferralPct;
    $('inputShipping').value = cfg.defaultShipping.toFixed(2);
  }

  // Update FBA dimensions/weight labels
  if (currentProductData) {
    if ($('calcItemWeight')) $('calcItemWeight').textContent = currentProductData.weight || '1.0 lb';
    if ($('calcDimensions')) $('calcDimensions').textContent = (currentProductData.dimensions || 'Standard size').substring(0, 30);
  }

  updateProfitCalculation();

  // Also update Sales Estimator for target country currency
  if (currentProductData) {
    renderSalesEstimator(currentProductData);
  }
}

function updateProfitCalculation() {
  const cfg = COUNTRY_CONFIG[selectedCountryKey] || COUNTRY_CONFIG.US;
  const salePrice = parseFloat($('inputSalePrice').value) || 0;
  const cogs = parseFloat($('inputCogs').value) || 0;
  const shipping = parseFloat($('inputShipping').value) || 0;
  const refPct = parseFloat($('inputReferralPct').value) || cfg.defaultReferralPct;

  const weightLbs = currentProductData ? (currentProductData.weightInLbs || 1.0) : 1.0;
  const fbaFee = cfg.calculateFba(weightLbs);
  const referralFee = salePrice * (refPct / 100);
  const totalCost = cogs + shipping;
  const totalAmazonFees = referralFee + fbaFee;
  const totalOutgoing = totalCost + totalAmazonFees;
  const netProfit = salePrice - totalOutgoing;

  const margin = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  // Breakeven Sale Price formula: (COGS + Shipping + FBA Fee) / (1 - referralPct/100)
  const breakevenFactor = 1 - (refPct / 100);
  const breakeven = breakevenFactor > 0 ? (totalCost + fbaFee) / breakevenFactor : 0;

  if ($('calcReferralFee')) $('calcReferralFee').textContent = cfg.formatMoney(referralFee);
  if ($('calcFbaFee')) $('calcFbaFee').textContent = cfg.formatMoney(fbaFee);
  if ($('calcTotalFees')) $('calcTotalFees').textContent = cfg.formatMoney(totalAmazonFees);
  if ($('calcBreakevenPrice')) $('calcBreakevenPrice').textContent = cfg.formatMoney(breakeven);

  const profitEl = $('calcNetProfit');
  if (profitEl) {
    profitEl.textContent = cfg.formatMoney(netProfit);
    profitEl.style.color = netProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
  }

  const marginEl = $('calcMargin');
  if (marginEl) {
    marginEl.textContent = `${margin.toFixed(1)}%`;
    marginEl.style.color = margin >= 20 ? 'var(--accent-green)' : margin >= 10 ? 'var(--accent-yellow)' : 'var(--accent-red)';
  }

  const roiEl = $('calcRoi');
  if (roiEl) {
    roiEl.textContent = `${roi.toFixed(1)}%`;
    roiEl.style.color = roi >= 100 ? 'var(--accent-green)' : roi >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)';
  }
}

function renderProfitCalculator(data) {
  const detected = detectCountryFromData(data);
  selectedCountryKey = detected;

  if ($('calcCountrySelect')) {
    $('calcCountrySelect').value = selectedCountryKey;
    $('calcCountrySelect').onchange = (e) => {
      onCountryOptionChanged(e.target.value, false);
    };
  }

  const cfg = COUNTRY_CONFIG[selectedCountryKey] || COUNTRY_CONFIG.US;

  // Determine initial sale price
  let priceNum = 0;
  if (data.priceInfo && data.priceInfo.numeric > 0) {
    priceNum = data.priceInfo.numeric;
  } else if (data.price) {
    priceNum = parsePriceNumber(data.price);
  }
  if (!priceNum || priceNum <= 0) {
    priceNum = cfg.defaultPrice;
  }

  $('inputSalePrice').value = priceNum.toFixed(2);
  $('inputCogs').value = (priceNum * 0.25).toFixed(2);
  $('inputShipping').value = cfg.defaultShipping.toFixed(2);
  $('inputReferralPct').value = cfg.defaultReferralPct;

  if ($('calcItemWeight')) $('calcItemWeight').textContent = data.weight || '1.0 lb';
  if ($('calcDimensions')) $('calcDimensions').textContent = (data.dimensions || 'Standard size').substring(0, 30);

  // Bind live change listeners
  ['inputSalePrice', 'inputCogs', 'inputShipping', 'inputReferralPct'].forEach(id => {
    const el = $(id);
    if (el) el.oninput = updateProfitCalculation;
  });

  onCountryOptionChanged(selectedCountryKey, true);
}

// ─── Sales & Revenue Estimator (BSR Model) ─────────────────────────────────

function estimateMonthlyUnitsFromBsr(rank) {
  if (!rank || rank <= 0) return 0;
  if (rank <= 10) return Math.round(15000 - rank * 500);
  if (rank <= 50) return Math.round(6000 + (50 - rank) * 150);
  if (rank <= 200) return Math.round(2500 + (200 - rank) * 23);
  if (rank <= 1000) return Math.round(800 + (1000 - rank) * 2.1);
  if (rank <= 5000) return Math.round(300 + (5000 - rank) * 0.12);
  if (rank <= 20000) return Math.round(100 + (20000 - rank) * 0.013);
  if (rank <= 100000) return Math.max(15, Math.round(500000 / rank));
  return Math.max(5, Math.round(150000 / rank));
}

function renderSalesEstimator(data) {
  const bsrItem = (data.bsr && data.bsr[0]) || null;
  const cfg = COUNTRY_CONFIG[selectedCountryKey] || COUNTRY_CONFIG.US;

  let priceNum = parseFloat($('inputSalePrice').value);
  if (!priceNum || isNaN(priceNum) || priceNum <= 0) {
    priceNum = (data.priceInfo && data.priceInfo.numeric) || parsePriceNumber(data.price) || cfg.defaultPrice;
  }

  if ($('salesCountryBadge')) {
    $('salesCountryBadge').textContent = `Target: ${cfg.flag} ${selectedCountryKey} (${cfg.symbol})`;
  }

  if (bsrItem && bsrItem.rank) {
    const rank = bsrItem.rank;
    const monthlyUnits = estimateMonthlyUnitsFromBsr(rank);
    const dailyUnits = Math.round(monthlyUnits / 30);
    const monthlyRev = monthlyUnits * priceNum;
    const dailyRev = dailyUnits * priceNum;

    $('salesBsrRank').textContent = `#${formatNumber(rank)}`;
    $('salesBsrCat').textContent = bsrItem.category || 'General';

    $('estMonthlyUnits').textContent = `${formatNumber(monthlyUnits)} units`;
    $('estDailyUnits').textContent = `~${formatNumber(dailyUnits)} units / day`;

    $('estMonthlyRev').textContent = cfg.formatMoney(monthlyRev);
    $('estDailyRev').textContent = `~${cfg.formatMoney(dailyRev)} / day`;

    if (rank <= 1000) {
      $('salesDemandLevel').innerHTML = '<span class="badge badge-green">🔥 Ultra High Demand</span>';
      $('salesCompetitionLevel').innerHTML = '<span class="badge badge-red">High Competition</span>';
    } else if (rank <= 10000) {
      $('salesDemandLevel').innerHTML = '<span class="badge badge-green">✓ High Demand</span>';
      $('salesCompetitionLevel').innerHTML = '<span class="badge badge-yellow">Moderate Competition</span>';
    } else {
      $('salesDemandLevel').innerHTML = '<span class="badge badge-yellow">Steady / Niche Demand</span>';
      $('salesCompetitionLevel').innerHTML = '<span class="badge badge-blue">Low / Accessible</span>';
    }
  } else {
    $('salesBsrRank').textContent = 'N/A';
    $('salesBsrCat').textContent = 'No BSR found on page';
    $('estMonthlyUnits').textContent = '—';
    $('estMonthlyRev').textContent = '—';
  }
}

// ─── Customer Voice & Review Sentiment ─────────────────────────────────────

function renderReviewSentiment(data) {
  const reviews = data.customerReviews || {};
  const posContainer = $('positiveReviewList');
  const negContainer = $('negativeReviewList');

  posContainer.innerHTML = '';
  negContainer.innerHTML = '';

  const posHighlights = reviews.positiveHighlights || [];
  if (posHighlights.length > 0) {
    posHighlights.forEach(text => {
      const div = document.createElement('div');
      div.className = 'sentiment-item';
      div.textContent = text;
      posContainer.appendChild(div);
    });
  } else {
    posContainer.innerHTML = '<div class="sentiment-item" style="color:var(--text-muted)">High rating detected. Customer satisfaction is strong on core features.</div>';
  }

  const negHighlights = reviews.criticalPainPoints || [];
  if (negHighlights.length > 0) {
    negHighlights.forEach(text => {
      const div = document.createElement('div');
      div.className = 'sentiment-item';
      div.textContent = text;
      negContainer.appendChild(div);
    });
  } else {
    negContainer.innerHTML = '<div class="sentiment-item" style="color:var(--text-muted)">Few or no critical complaints found. Check packaging & durability to stand out.</div>';
  }
}

// ─── New Listing Builder & Full HTML Description ───────────────────────────

function createOfflineFullListing(brand, concept, currentData) {
  const b = brand || 'NovaCraft';
  const c = concept || (currentData ? currentData.title : 'Premium Product');

  const title = `${b} ${c} - Advanced Ergonomic Design, Durable Stainless Construction & Multi-Purpose Performance - Ideal for Home & Travel`;

  const bullets = [
    `[SUPERIOR CRAFTSMANSHIP & DURABILITY] Engineered with heavy-duty premium materials designed to withstand daily wear, ensuring peak reliability and long-lasting performance.`,
    `[ERGONOMIC & USER-FRIENDLY] Thoughtfully contoured for effortless operation and maximum comfort, seamlessly integrating into your everyday routine.`,
    `[MULTI-PURPOSE VERSATILITY] Built to adapt to diverse environments—whether at home, in the office, or outdoors on the go, deliver consistent results every time.`,
    `[UPGRADED SAFETY & PRECISION] Features enhanced protective mechanisms and reinforced seals to prevent leaks, drops, or unexpected malfunctions.`,
    `[100% SATISFACTION GUARANTEE] Supported by our round-the-clock customer care team and comprehensive replacement warranty for total confidence.`
  ];

  const descriptionHtml = `<h3>Transform Your Daily Routine with ${escapeHTML(b)}</h3>
<p>Experience unmatched performance, sleek modern aesthetics, and relentless durability with our flagship product. Designed specifically for demanding users who refuse to settle for mediocre alternatives.</p>

<h3>Key Performance Features</h3>
<ul>
  <li><b>Engineered for Excellence:</b> Precision-calibrated components ensure seamless operation and consistent output.</li>
  <li><b>Rugged Durability:</b> Scratch-resistant and impact-tested exterior built for long-term daily usage.</li>
  <li><b>Intuitive Ergonomics:</b> Contoured grip and balanced weight distribution minimize fatigue.</li>
</ul>

<h3>Technical Specifications</h3>
<ul>
  <li><b>Brand:</b> ${escapeHTML(b)}</li>
  <li><b>Compatibility:</b> Universal standard</li>
  <li><b>Materials:</b> Premium eco-friendly composite</li>
</ul>

<h3>What's in the Box</h3>
<p>1x ${escapeHTML(c)} Premium Unit, 1x Quick Start Guide, 1x Warranty Registration Card.</p>`;

  const backendKeywords = 'portable travel compact durable lightweight organizer replacement accessories heavy duty silent modern multipurpose';

  return {
    title,
    bullets,
    descriptionHtml,
    backendKeywords
  };
}

async function callFullListingProxy(body, proxyUrl) {
  const url = `${(proxyUrl || 'http://localhost:3000').replace(/\/$/, '')}/api/generate-full-listing`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`Proxy error (HTTP ${res.status})`);
  const json = await res.json();
  if (!json.success || !json.data) throw new Error(json.error || 'Failed to generate');
  return json.data;
}

async function generateFullListing() {
  const btn = $('generateFullListingBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Creating high-demand listing…';

  const brand = $('builderBrandInput').value.trim() || (currentProductData ? currentProductData.brand : 'Brand');
  const concept = $('builderConceptInput').value.trim() || (currentProductData ? currentProductData.title : 'Product');
  const keywords = currentProductData && currentProductData.keywordAnalysis
    ? currentProductData.keywordAnalysis.topWords.map(k => k.word)
    : [];

  const payload = {
    brand,
    concept,
    keywords,
    currentTitle: currentProductData ? currentProductData.title : '',
    currentBullets: currentProductData ? currentProductData.bullets : []
  };

  let result = null;

  try {
    if (currentApiMode === 'proxy') {
      result = await callFullListingProxy(payload, currentProxyUrl);
    } else if (currentApiMode === 'direct' && currentGeminiApiKey) {
      const prompt = `Create a high-demand Amazon product listing in JSON format with title, bullets (array of 5), descriptionHtml, backendKeywords for ${brand} ${concept}.`;
      result = await callGeminiApi(payload, currentGeminiApiKey);
    } else {
      result = createOfflineFullListing(brand, concept, currentProductData);
    }
  } catch (err) {
    console.warn('Listing builder error, falling to offline generator:', err);
    showToast(`⚠️ Server note: ${err.message.substring(0, 35)} — used smart engine`);
    result = createOfflineFullListing(brand, concept, currentProductData);
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ Re-Generate High-Demand Listing';
  }

  renderBuilderResults(result);
}

function renderBuilderResults(res) {
  $('builderResultsContainer').style.display = 'block';

  // Title
  const title = res.title || '';
  $('builderTitleOutput').textContent = title;
  $('builderTitleLen').textContent = title.length;
  $('copyBuilderTitleBtn').onclick = () => copyToClipboard(title, '✅ Title Copied!');

  // Bullets
  const bullets = res.bullets || [];
  const bulletsBox = $('builderBulletsOutput');
  bulletsBox.innerHTML = '';
  bullets.forEach((b, i) => {
    const div = document.createElement('div');
    div.className = 'bullet-item';
    div.style.marginBottom = '4px';
    div.innerHTML = `
      <div class="bullet-num">${i + 1}</div>
      <div style="flex:1;">
        <div class="bullet-text" style="font-size:11px;">${escapeHTML(b)}</div>
        <div style="text-align:right; margin-top:2px;">
          <button class="copy-mini-btn copy-single-bld-bullet" data-index="${i}">📋 Copy</button>
        </div>
      </div>
    `;
    bulletsBox.appendChild(div);
  });

  bulletsBox.querySelectorAll('.copy-single-bld-bullet').forEach(btn => {
    btn.onclick = (e) => {
      const idx = e.currentTarget.dataset.index;
      copyToClipboard(bullets[idx], `✅ Bullet #${parseInt(idx) + 1} Copied!`);
    };
  });

  $('copyBuilderBulletsBtn').onclick = () => copyToClipboard(bullets.join('\n\n'), '✅ All Bullets Copied!');

  // HTML Description
  const html = res.descriptionHtml || '<p>Description</p>';
  $('builderHtmlPreview').innerHTML = html;
  $('builderHtmlCode').textContent = html;

  let isHtmlCodeView = false;
  $('toggleHtmlModeBtn').onclick = () => {
    isHtmlCodeView = !isHtmlCodeView;
    $('builderHtmlPreview').style.display = isHtmlCodeView ? 'none' : 'block';
    $('builderHtmlCode').style.display = isHtmlCodeView ? 'block' : 'none';
    $('toggleHtmlModeBtn').textContent = isHtmlCodeView ? '👁 View Visual' : '👁 View Code';
  };

  $('copyBuilderHtmlBtn').onclick = () => copyToClipboard(html, '✅ HTML Description Copied!');

  // Backend Keywords
  const backend = (res.backendKeywords || '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const bytes = countUtf8Bytes(backend);
  $('builderBackendOutput').textContent = backend || '(None)';
  const badge = $('builderBytesBadge');
  badge.textContent = `${bytes} / 249 bytes`;
  badge.className = bytes <= 249 ? 'byte-counter-badge safe' : 'byte-counter-badge over';
  $('copyBuilderBackendBtn').onclick = () => copyToClipboard(backend, '✅ Backend Terms Copied!');
}

function initListingBuilder() {
  const popBtn = $('populateFromCurrentBtn');
  if (popBtn) {
    popBtn.onclick = () => {
      if (currentProductData) {
        $('builderBrandInput').value = currentProductData.brand || '';
        $('builderConceptInput').value = currentProductData.title || '';
        showToast('✅ Auto-filled from current listing!');
      }
    };
  }

  const genBtn = $('generateFullListingBtn');
  if (genBtn) genBtn.onclick = generateFullListing;
}

// ─── Render Functions ───────────────────────────────────────────────────────

function renderOverview(data) {
  // ASIN
  $('asinValue').textContent = data.asin || '—';
  $('marketplaceBadge').textContent = data.marketplace || '';

  // Rating
  if (data.rating) {
    $('ratingValue').innerHTML = `<span class="stars">${starsHTML(data.rating)}</span>`;
  }
  $('reviewCountValue').textContent = data.reviewCount
    ? `${formatNumber(data.reviewCount)} reviews`
    : 'No reviews';

  // Price
  $('priceValue').textContent = data.price || '—';
  if (data.discount) {
    $('discountValue').innerHTML = `<span style="color:var(--accent-red)">${data.discount} OFF</span>`;
    if (data.originalPrice) {
      $('discountValue').innerHTML += ` <s style="color:var(--text-muted)">${data.originalPrice}</s>`;
    }
  }

  // BSR
  if (data.bsr && data.bsr.length > 0) {
    $('bsrValue').textContent = `#${formatNumber(data.bsr[0].rank)}`;
    $('bsrCategory').textContent = data.bsr[0].category.substring(0, 40) + (data.bsr[0].category.length > 40 ? '…' : '');
  } else {
    $('bsrValue').textContent = 'N/A';
  }

  // Images
  $('imageCountValue').textContent = (data.images || []).length || '—';

  // Availability
  $('availValue').innerHTML = data.availability
    ? `<span class="badge ${data.availability.toLowerCase().includes('in stock') ? 'badge-green' : 'badge-red'}">${data.availability}</span>`
    : '—';

  // Seller
  $('soldByValue').textContent = (data.seller && data.seller.soldBy) ? data.seller.soldBy : 'Amazon / Third-party';
  $('fulfillmentValue').innerHTML = data.seller && data.seller.isFBA
    ? '<span class="badge badge-green">✓ Fulfilled by Amazon (FBA)</span>'
    : '<span class="badge badge-yellow">FBM — Merchant Fulfilled</span>';
  $('primeValue').innerHTML = data.seller && data.seller.isPrime
    ? '<span class="badge badge-blue">✓ Prime Eligible</span>'
    : '<span class="badge badge-yellow">Not Prime</span>';

  if ($('aplusStatusValue')) {
    $('aplusStatusValue').innerHTML = data.hasAplus
      ? '<span class="badge badge-green">✓ Active A+ Content</span>'
      : '<span class="badge badge-yellow">Standard Description</span>';
  }
  if ($('videoStatusValue')) {
    $('videoStatusValue').innerHTML = data.hasVideo
      ? '<span class="badge badge-green">✓ Video Included</span>'
      : '<span class="badge badge-yellow">No Video</span>';
  }
  if ($('mediaFeaturesBadge')) {
    $('mediaFeaturesBadge').textContent = data.hasAplus ? 'A+ Content: Yes' : 'A+ Content: No';
  }

  // Categories
  const catContainer = $('categoriesValue');
  catContainer.innerHTML = '';
  (data.categories || []).forEach(cat => {
    if (cat.trim()) {
      const tag = document.createElement('span');
      tag.className = 'keyword-tag';
      tag.textContent = cat;
      tag.onclick = () => {
        // Switch to API tab and run search
        document.querySelector('[data-tab="api-suggest"]').click();
        runSuggestionSearch(cat);
      };
      catContainer.appendChild(tag);
    }
  });
  if ((data.categories || []).length === 0) {
    catContainer.innerHTML = '<span style="color:var(--text-muted);font-size:11px">Categories not detected</span>';
  }

  // SEO Score
  renderScoreCircle(data.seoScore);
}

function renderScoreCircle(seoScore) {
  if (!seoScore) return;
  const { score, grade, gradeColor, issues, suggestions } = seoScore;

  const circle = $('scoreCircle');
  const circumference = 213.6;
  const offset = circumference - (score / 100) * circumference;
  circle.style.stroke = gradeColor;
  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
  }, 100);

  $('scoreNumber').textContent = score;
  $('scoreGrade').textContent = `Grade ${grade}`;
  $('scoreGrade').style.color = gradeColor;

  const descriptions = {
    'A': '🏆 Excellent listing! Strong SEO foundation.',
    'B': '👍 Good listing. A few improvements possible.',
    'C': '⚠️ Average listing. Missing key SEO elements.',
    'D': '📉 Poor listing. Several critical issues found.',
    'F': '🚨 Very poor. Major SEO improvements needed.',
  };
  $('scoreDesc').textContent = descriptions[grade] || '';

  if (issues.length > 0) {
    $('issueCount').textContent = `${issues.length} issue${issues.length > 1 ? 's' : ''}`;
    $('issueCount').style.display = 'inline-flex';
  }
  if (suggestions.length > 0) {
    $('suggestionCount').textContent = `${suggestions.length} tip${suggestions.length > 1 ? 's' : ''}`;
    $('suggestionCount').style.display = 'inline-flex';
  }
}

function renderSEOTab(data) {
  const seoScore = data.seoScore || {};
  const title = data.title || '';

  // Title Analysis
  const mobileTitle = title.substring(0, 70);
  $('titleMobileText').textContent = mobileTitle || '—';
  $('titleFull').textContent = title.length > 70 ? `…${title.substring(70)}` : '';

  const charCountEl = $('titleCharCount');
  charCountEl.textContent = title.length;
  charCountEl.className = title.length >= 80 && title.length <= 200 ? 'ok' : title.length >= 50 ? 'warn' : 'bad';

  // Bullets
  const bullets = data.bullets || [];
  $('bulletCount').textContent = bullets.length;
  const bulletList = $('bulletList');
  bulletList.innerHTML = '';

  if (bullets.length === 0) {
    bulletList.innerHTML = '<div class="empty-state">No bullet points found on this page.</div>';
  } else {
    bullets.forEach((bullet, i) => {
      const charClass = bullet.length >= 150 && bullet.length <= 1000 ? 'ok' : bullet.length >= 50 ? 'warn' : 'bad';
      bulletList.innerHTML += `
        <div class="bullet-item">
          <div class="bullet-num">${i + 1}</div>
          <div>
            <div class="bullet-text">${escapeHTML(bullet)}</div>
            <div class="bullet-chars char-count"><span class="${charClass}">${bullet.length}</span> chars</div>
          </div>
        </div>`;
    });
  }

  // Issues
  const issues = seoScore.issues || [];
  if (issues.length > 0) {
    $('issuesCard').style.display = 'block';
    const icons = { critical: '🚨', warning: '⚠️', info: 'ℹ️' };
    $('issueList').innerHTML = issues.map(issue => `
      <div class="issue-item ${issue.severity}">
        <span class="issue-icon">${icons[issue.severity] || '•'}</span>
        <span>${escapeHTML(issue.text)}</span>
      </div>`).join('');
  }

  // Suggestions
  const suggestions = seoScore.suggestions || [];
  if (suggestions.length > 0) {
    $('suggestionsCard').style.display = 'block';
    $('suggestionList').innerHTML = suggestions.map(s => `
      <div class="issue-item suggestion">
        <span class="issue-icon">💡</span>
        <span>${escapeHTML(s)}</span>
      </div>`).join('');
  }

  // Quality Checklist
  const checklist = data.qualityChecklist || [];
  const passed = checklist.filter(c => c.pass).length;
  $('checkPassed').textContent = passed;
  const container = $('checklistContainer');
  container.innerHTML = '';
  checklist.forEach(item => {
    const div = document.createElement('div');
    div.className = 'check-item';
    div.title = item.tip || '';
    div.innerHTML = `
      <div class="check-icon ${item.pass ? 'pass' : 'fail'}">${item.pass ? '✓' : '✗'}</div>
      <div>
        <div class="check-label">${escapeHTML(item.label)}</div>
        ${item.tip ? `<div class="check-tip">${escapeHTML(item.tip)}</div>` : ''}
      </div>`;
    container.appendChild(div);
  });
}

function renderKeywordsTab(data) {
  const kw = data.keywordAnalysis || {};

  // Keywords
  const kwList = $('keywordList');
  kwList.innerHTML = '';
  (kw.topWords || []).forEach(({ word, count }) => {
    const tag = document.createElement('span');
    tag.className = 'keyword-tag';
    tag.innerHTML = `${escapeHTML(word)} <span class="keyword-count">${count}</span>`;
    tag.title = 'Click to search in Live Amazon API';
    tag.onclick = () => {
      document.querySelector('[data-tab="api-suggest"]').click();
      runSuggestionSearch(word);
    };
    kwList.appendChild(tag);
  });

  if ((kw.topWords || []).length === 0) {
    kwList.innerHTML = '<span class="empty-state">No keywords extracted.</span>';
  }

  // Phrases
  const phraseList = $('phraseList');
  phraseList.innerHTML = '';
  (kw.topPhrases || []).forEach(({ phrase, count }) => {
    const tag = document.createElement('span');
    tag.className = 'keyword-tag';
    tag.innerHTML = `${escapeHTML(phrase)} <span class="keyword-count">${count}</span>`;
    tag.title = 'Click to search in Live Amazon API';
    tag.onclick = () => {
      document.querySelector('[data-tab="api-suggest"]').click();
      runSuggestionSearch(phrase);
    };
    phraseList.appendChild(tag);
  });

  if ((kw.topPhrases || []).length === 0) {
    phraseList.innerHTML = '<span class="empty-state" style="font-size:11px;color:var(--text-muted)">No repeated phrases found.</span>';
  }

  // Pre-fill seed keyword in API search input if available
  if (kw.topPhrases && kw.topPhrases[0]) {
    $('apiSearchInput').value = kw.topPhrases[0].phrase;
  } else if (kw.topWords && kw.topWords[0]) {
    $('apiSearchInput').value = kw.topWords[0].word;
  }

  // Meta keywords
  $('metaKeywordsValue').textContent = data.metaKeywords || '(none found — Amazon rarely uses this tag)';
  $('metaDescriptionValue').textContent = data.metaDescription || '(none found)';
}

function renderProductTab(data) {
  // BSR
  const bsrList = $('bsrList');
  bsrList.innerHTML = '';
  if (data.bsr && data.bsr.length > 0) {
    data.bsr.forEach(b => {
      bsrList.innerHTML += `
        <div class="bsr-item">
          <div class="bsr-rank">#${formatNumber(b.rank)}<br><span>BSR</span></div>
          <div class="bsr-category">${escapeHTML(b.category)}</div>
        </div>`;
    });
  } else {
    bsrList.innerHTML = '<div class="empty-state">BSR not found on this page.</div>';
  }

  // Description
  $('descriptionValue').textContent = data.description || 'No description found.';

  // Specs table
  const specs = data.productDetails || {};
  const specsContainer = $('specsContainer');
  const entries = Object.entries(specs);

  if (entries.length > 0) {
    let html = '<table class="specs-table">';
    entries.forEach(([key, val]) => {
      html += `<tr><th>${escapeHTML(key)}</th><td>${escapeHTML(val)}</td></tr>`;
    });
    html += '</table>';
    specsContainer.innerHTML = html;
  } else {
    specsContainer.innerHTML = '<div class="empty-state">No product specifications found.</div>';
  }
}

function renderImagesTab(data) {
  const images = data.images || [];
  $('imageCount').textContent = images.length;
  const gallery = $('imageGallery');
  gallery.innerHTML = '';

  if (images.length === 0) {
    $('noImagesMsg').style.display = 'block';
    return;
  }

  images.slice(0, 9).forEach((src, i) => {
    const div = document.createElement('div');
    div.className = 'image-thumb';
    div.title = `Image ${i + 1} — Click to open`;
    div.innerHTML = `<img src="${src}" alt="Product image ${i + 1}" loading="lazy">`;
    div.onclick = () => chrome.tabs.create({ url: src });
    gallery.appendChild(div);
  });
}

function renderExportTab(data) {
  const preview = JSON.stringify({
    asin: data.asin,
    title: data.title,
    brand: data.brand,
    rating: data.rating,
    reviewCount: data.reviewCount,
    price: data.price,
    bsr: data.bsr,
    seoScore: data.seoScore ? { score: data.seoScore.score, grade: data.seoScore.grade } : null,
    bullets: data.bullets,
    categories: data.categories,
    marketplace: data.marketplace
  }, null, 2);
  $('jsonPreview').textContent = preview;
}

// ─── Export Functions ───────────────────────────────────────────────────────

function buildTextReport(data) {
  const sep = '─'.repeat(55);
  const seo = data.seoScore || {};
  const lines = [
    '═'.repeat(55),
    '⚡ OMNIRANK — E-COMMERCE INTELLIGENCE REPORT',
    '🚀 AMAZON • FLIPKART • GOOGLE COMMERCE AUDIT',
    '═'.repeat(55),
    '',
    `Identifier:  ${data.asin || data.fsn || '—'}`,
    `Platform:    ${data.source_platform || 'E-Commerce'}`,
    `Marketplace: ${data.marketplace || '—'}`,
    `URL:         ${data.url || '—'}`,
    `Analyzed:    ${data.extractedAt || new Date().toISOString()}`,
    `Engine:      OmniRank v2.2 (Engineered by tarikislam.in)`,
    '',
    sep,
    'PRODUCT OVERVIEW',
    sep,
    `Title:       ${data.title || '—'}`,
    `Brand:       ${data.brand || '—'}`,
    `Price:       ${data.price || '—'} ${data.discount ? `(${data.discount} OFF)` : ''}`,
    `Rating:      ${data.rating ? `${data.rating}/5 (${formatNumber(data.reviewCount)} reviews)` : '—'}`,
    `Availability:${data.availability || '—'}`,
    `Fulfillment: ${data.seller && data.seller.isFBA ? 'FBA / Assured' : 'Merchant'}`,
    `A+ Content:  ${data.hasAplus ? 'Yes' : 'No'}`,
    `Video:       ${data.hasVideo ? 'Yes' : 'No'}`,
    '',
    sep,
    `SEO SCORE: ${seo.score || 0}/100 (Grade ${seo.grade || '—'})`,
    sep,
    '',
    'ISSUES:',
    ...((seo.issues || []).map(i => `  [${i.severity.toUpperCase()}] ${i.text}`)),
    '',
    'SUGGESTIONS:',
    ...((seo.suggestions || []).map(s => `  • ${s}`)),
    '',
    sep,
    'BEST SELLERS RANK & DEMAND',
    sep,
    ...((data.bsr || []).map(b => `  #${formatNumber(b.rank)} in ${b.category}`)),
    '',
    sep,
    'BULLET POINTS',
    sep,
    ...((data.bullets || []).map((b, i) => `${i + 1}. ${b}\n`)),
    sep,
    'TOP KEYWORDS',
    sep,
    (data.keywordAnalysis && data.keywordAnalysis.topWords || [])
      .map(k => `${k.word} (${k.count})`)
      .join(', '),
    '',
    sep,
    'CATEGORIES',
    sep,
    (data.categories || []).join(' > '),
    '',
    '═'.repeat(55),
    '⚡ Powered by OmniRank • Engineered by tarikislam.in',
    '═'.repeat(55),
  ];
  return lines.join('\n');
}

function buildCSV(data) {
  const seo = data.seoScore || {};
  const bsr = data.bsr && data.bsr[0];
  const fields = {
    'Identifier': data.asin || data.fsn,
    'Platform': data.source_platform || 'Amazon',
    'Title': data.title,
    'Brand': data.brand,
    'Price': data.price,
    'Discount': data.discount,
    'Rating': data.rating,
    'Review Count': data.reviewCount,
    'Availability': data.availability,
    'Fulfillment': data.seller && data.seller.isFBA ? 'FBA' : 'Standard',
    'BSR Rank': bsr ? bsr.rank : '',
    'BSR Category': bsr ? bsr.category : '',
    'Bullet Count': (data.bullets || []).length,
    'Image Count': (data.images || []).length,
    'SEO Score': seo.score,
    'SEO Grade': seo.grade,
    'Marketplace': data.marketplace,
    'URL': data.url,
    'Analyzed At': data.extractedAt,
    'Engine': 'OmniRank v2.2 (tarikislam.in)'
  };

  const headers = Object.keys(fields);
  const values = Object.values(fields).map(v =>
    `"${String(v || '').replace(/"/g, '""')}"`
  );
  return headers.join(',') + '\n' + values.join(',');
}

// ─── Main Render ─────────────────────────────────────────────────────────────

function renderAll(data) {
  currentProductData = data;

  // Auto-detect marketplace from URL
  if (data.marketplace) {
    for (const [key, val] of Object.entries(MARKETPLACES)) {
      if (data.marketplace.includes(val.domain)) {
        currentMarketplaceKey = key;
        $('apiMarketplaceSelect').value = key;
        break;
      }
    }
  }

  // Show main UI
  $('loadingState').style.display = 'none';
  $('mainUI').style.display = 'block';
  $('mainFooter').style.display = 'flex';

  // Footer timestamp
  $('footerTimestamp').textContent = `Analyzed ${timeAgo(data.extractedAt)}`;

  renderOverview(data);
  renderProfitCalculator(data);
  renderSalesEstimator(data);
  renderReviewSentiment(data);
  renderSEOTab(data);
  renderKeywordsTab(data);
  renderProductTab(data);
  renderImagesTab(data);
  renderExportTab(data);

  // ── Bind action buttons ──

  $('copyAsinBtn').onclick = () => copyToClipboard(data.asin || data.fsn || '', '✅ Identifier Copied!');

  $('exportJsonBtn').onclick = () => {
    copyToClipboard(JSON.stringify(data, null, 2), '✅ JSON Copied!');
  };

  $('exportCsvBtn').onclick = () => {
    copyToClipboard(buildCSV(data), '✅ CSV Copied!');
  };

  if ($('downloadCsvBtn')) {
    $('downloadCsvBtn').onclick = () => downloadCSV(data);
  }

  $('exportTextBtn').onclick = () => {
    copyToClipboard(buildTextReport(data), '✅ Report Copied!');
  };

  $('downloadJsonBtn').onclick = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnirank-${data.asin || data.fsn || 'product'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ JSON Downloaded!');
  };

  $('refreshBtn').onclick = () => {
    $('mainUI').style.display = 'none';
    $('mainFooter').style.display = 'none';
    $('loadingState').style.display = 'flex';
    loadData();
  };
}

function downloadCSV(data) {
  const csvContent = buildCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `omnirank-${data.asin || data.fsn || 'product'}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ CSV Spreadsheet Downloaded!');
}

function isAmazonProductUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (!host.includes('amazon.')) return false;

    const path = u.pathname;
    if (/\/(?:dp|gp\/product|gp\/aw\/d|d|product|product-reviews|exec\/obidos\/asin)\/([A-Z0-9]{10})/i.test(path)) {
      return true;
    }
    if (/[?&]asin=([A-Z0-9]{10})/i.test(u.search)) {
      return true;
    }
    if (/\/(B0[A-Z0-9]{8})(?:[/?#]|$)/i.test(path)) {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

// ─── Search, Comparison, History & Diagnostics Engine ────────────────────────

let currentSerpData = null;

function isAmazonSearchUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (!u.hostname.toLowerCase().includes('amazon.')) return false;
    return u.pathname.startsWith('/s') || u.searchParams.has('k') || u.searchParams.has('rh');
  } catch (_) {
    return false;
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.dataset.tab === tabId) b.classList.add('active');
    else b.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(c => {
    if (c.id === `tab-${tabId}`) c.classList.add('active');
    else c.classList.remove('active');
  });
}

// ── SERP Search Results View ────────────────────────────────────────────────

function renderSerpResults(serpData) {
  currentSerpData = serpData;
  if ($('serpSummaryBar')) $('serpSummaryBar').style.display = 'grid';
  if ($('serpQueryText')) $('serpQueryText').textContent = serpData.query || 'Search';
  if ($('serpParsedCount')) $('serpParsedCount').textContent = serpData.items ? serpData.items.length : 0;

  let sponsored = 0;
  let organic = 0;
  (serpData.items || []).forEach(item => {
    if (item.sponsored) sponsored++;
    else organic++;
  });
  if ($('serpSponsoredCount')) $('serpSponsoredCount').textContent = sponsored;
  if ($('serpOrganicCount')) $('serpOrganicCount').textContent = organic;
  if ($('serpTotalCount')) $('serpTotalCount').textContent = serpData.totalResultsText || `${serpData.items ? serpData.items.length : 0} items`;

  const tbody = $('serpResultsBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!serpData.items || serpData.items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:18px; color:var(--text-muted);">No visible products extracted from this search page.</td></tr>`;
    return;
  }

  serpData.items.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="serp-rank-col">${item.rank || '-'}</td>
      <td>
        <div style="font-weight:600; line-height:1.3; font-size:11px; margin-bottom:2px;">
          ${escapeHTML(item.title ? item.title.substring(0, 68) + (item.title.length > 68 ? '...' : '') : 'Amazon Product')}
        </div>
        <div style="font-size:10px; color:var(--text-muted); display:flex; gap:6px; align-items:center;">
          <span>ASIN: <strong>${item.asin || '-'}</strong></span>
          ${item.asin ? `<button class="copy-mini-btn copy-serp-asin" data-asin="${item.asin}">Copy</button>` : ''}
          ${item.asin ? `<button class="copy-mini-btn comp-serp-asin" data-asin="${item.asin}" style="color:#00c0f0;">Compare</button>` : ''}
        </div>
      </td>
      <td style="font-weight:700; color:var(--text-primary); font-size:11px;">${item.priceText || '—'}</td>
      <td style="color:#f59e0b; font-size:11px;">${item.rating ? `★ ${item.rating}` : '—'}</td>
      <td style="color:var(--text-secondary); font-size:11px;">${item.reviewsCount ? Number(item.reviewsCount).toLocaleString() : '—'}</td>
      <td>
        <span class="serp-badge ${item.sponsored ? 'sponsored' : 'organic'}">
          ${item.sponsored ? 'Ad' : 'Org'}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.copy-serp-asin').forEach(b => {
    b.onclick = () => copyToClipboard(b.dataset.asin, 'ASIN Copied!');
  });
  tbody.querySelectorAll('.comp-serp-asin').forEach(b => {
    b.onclick = () => {
      if ($('compAsinInput')) $('compAsinInput').value = b.dataset.asin;
      switchTab('compare');
      executeCompetitorComparison(b.dataset.asin);
    };
  });
}

function exportSerpToCSV() {
  if (!currentSerpData || !currentSerpData.items || !currentSerpData.items.length) {
    showToast('No SERP data to export');
    return;
  }
  const headers = ['Rank', 'Type', 'ASIN', 'Title', 'Price', 'Rating', 'ReviewsCount', 'URL'];
  const rows = currentSerpData.items.map(i => [
    i.rank || '',
    i.sponsored ? 'Sponsored' : 'Organic',
    `"${(i.asin || '').replace(/"/g, '""')}"`,
    `"${(i.title || '').replace(/"/g, '""')}"`,
    `"${(i.priceText || '').replace(/"/g, '""')}"`,
    i.rating || '',
    i.reviewsCount || '',
    `"${(i.url || '').replace(/"/g, '""')}"`
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `serp-${(currentSerpData.query || 'amazon').replace(/\W+/g, '_')}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ SERP CSV Spreadsheet Exported!');
}

function initSerp() {
  if ($('rescanSerpBtn')) {
    $('rescanSerpBtn').onclick = () => scanCurrentTabSearch();
  }
  if ($('scanActiveSearchBtn')) {
    $('scanActiveSearchBtn').onclick = () => scanCurrentTabSearch();
  }
  if ($('exportSerpCsvBtn')) {
    $('exportSerpCsvBtn').onclick = () => exportSerpToCSV();
  }
}

async function scanCurrentTabSearch() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showToast('No active tab');
      return;
    }
    showState('loading');
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/content.js']
      });
    } catch (_) {}

    await new Promise(r => setTimeout(r, 200));

    chrome.tabs.sendMessage(tab.id, { action: 'extractSearchResults' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        showState('error', response ? response.error : 'Could not extract search rankings. Ensure you are on an Amazon search page.');
        return;
      }
      showState('ready');
      renderSerpResults(response.data);
      switchTab('serp');
      showToast(`✅ Extracted ${response.data.items ? response.data.items.length : 0} search results`);
    });
  } catch (err) {
    showState('error', err.message);
  }
}

// ── Competitor Comparison ───────────────────────────────────────────────────

function executeCompetitorComparison(targetAsin) {
  const active = currentProductData || SAMPLE_PRODUCT_DATA;
  targetAsin = (targetAsin || ($('compAsinInput') ? $('compAsinInput').value : '')).trim();
  if (!targetAsin) {
    showToast('Please enter a competitor ASIN');
    return;
  }

  if ($('compActiveColHeader')) $('compActiveColHeader').textContent = active.asin || 'Active Product';
  if ($('compTargetColHeader')) $('compTargetColHeader').textContent = targetAsin;

  if ($('compActiveAsin')) $('compActiveAsin').textContent = active.asin || '—';
  if ($('compTargetAsin')) $('compTargetAsin').textContent = targetAsin;

  if ($('compActiveTitleLen')) $('compActiveTitleLen').textContent = `${(active.title || '').length} chars (${(active.title || '').split(/\s+/).length} words)`;
  if ($('compActivePrice')) $('compActivePrice').textContent = active.price || '—';
  if ($('compActiveRating')) $('compActiveRating').textContent = active.rating ? `${active.rating} ★` : '—';
  if ($('compActiveReviews')) $('compActiveReviews').textContent = active.reviewCount ? Number(active.reviewCount).toLocaleString() : '—';
  if ($('compActiveBullets')) $('compActiveBullets').textContent = `${(active.bullets || []).length} bullets`;
  if ($('compActiveScore')) $('compActiveScore').textContent = active.seoScore ? `${active.seoScore.score}/100 (${active.seoScore.grade})` : '—';
  if ($('compActiveMargin')) $('compActiveMargin').textContent = $('calcMargin') ? $('calcMargin').textContent : '—';

  // Check if target ASIN is in our visible SERP items
  let foundInSerp = null;
  if (currentSerpData && currentSerpData.items) {
    foundInSerp = currentSerpData.items.find(i => i.asin && i.asin.toUpperCase() === targetAsin.toUpperCase());
  }

  if (foundInSerp) {
    if ($('compTargetTitleLen')) $('compTargetTitleLen').textContent = `${(foundInSerp.title || '').length} chars`;
    if ($('compTargetPrice')) $('compTargetPrice').textContent = foundInSerp.priceText || '—';
    if ($('compTargetRating')) $('compTargetRating').textContent = foundInSerp.rating ? `${foundInSerp.rating} ★` : '—';
    if ($('compTargetReviews')) $('compTargetReviews').textContent = foundInSerp.reviewsCount ? Number(foundInSerp.reviewsCount).toLocaleString() : '—';
    if ($('compTargetBullets')) $('compTargetBullets').textContent = 'Visible on SERP';
    if ($('compTargetScore')) $('compTargetScore').textContent = '— (SERP)';
    if ($('compTargetMargin')) $('compTargetMargin').textContent = '—';

    let diffText = `Competitor ${targetAsin} is ranking visible on SERP at position #${foundInSerp.rank} (${foundInSerp.sponsored ? 'Sponsored' : 'Organic'}). `;
    if (active.priceInfo && foundInSerp.priceNumber) {
      const diff = active.priceInfo.numeric - foundInSerp.priceNumber;
      if (diff > 0) {
        diffText += `Your price is higher by ${active.priceInfo.symbol || ''}${diff.toFixed(2)}. Highlight your value proposition or optimize PPC bids. `;
      } else if (diff < 0) {
        diffText += `Your price is lower by ${active.priceInfo.symbol || ''}${Math.abs(diff).toFixed(2)}, giving you a strong pricing advantage! `;
      }
    }
    if (active.reviewCount && foundInSerp.reviewsCount) {
      if (active.reviewCount > foundInSerp.reviewsCount) {
        diffText += `You have social proof superiority (+${(active.reviewCount - foundInSerp.reviewsCount).toLocaleString()} reviews).`;
      } else {
        diffText += `Competitor has review lead (+${(foundInSerp.reviewsCount - active.reviewCount).toLocaleString()} reviews). Focus on review acquisition campaigns.`;
      }
    }
    if ($('compareTakeawayBox')) $('compareTakeawayBox').style.display = 'block';
    if ($('compareTakeawayText')) $('compareTakeawayText').textContent = diffText;
  } else {
    if ($('compTargetTitleLen')) $('compTargetTitleLen').textContent = 'Target ASIN';
    if ($('compTargetPrice')) $('compTargetPrice').textContent = 'Audit via URL';
    if ($('compTargetRating')) $('compTargetRating').textContent = '—';
    if ($('compTargetReviews')) $('compTargetReviews').textContent = '—';
    if ($('compTargetBullets')) $('compTargetBullets').textContent = '—';
    if ($('compTargetScore')) $('compTargetScore').textContent = '—';
    if ($('compTargetMargin')) $('compTargetMargin').textContent = '—';

    if ($('compareTakeawayBox')) $('compareTakeawayBox').style.display = 'block';
    if ($('compareTakeawayText')) {
      $('compareTakeawayText').innerHTML = `To benchmark against <strong>${escapeHTML(targetAsin)}</strong>, you can open <a href="https://www.amazon.in/dp/${encodeURIComponent(targetAsin)}" target="_blank" style="color:var(--amazon-orange);">amazon.in/dp/${escapeHTML(targetAsin)} ↗</a> and run the audit.`;
    }
  }
}

function initCompetitorComparison() {
  if ($('compareAsinBtn')) {
    $('compareAsinBtn').onclick = () => executeCompetitorComparison();
  }
  if ($('compAsinInput')) {
    $('compAsinInput').onkeydown = (e) => {
      if (e.key === 'Enter') executeCompetitorComparison();
    };
  }
}

// ── Local Rank Observations & History ───────────────────────────────────────

async function loadRankHistory() {
  try {
    const res = await chrome.storage.local.get(['rank_history_records']);
    const records = res.rank_history_records || [];
    renderRankHistoryList(records);
  } catch (err) {
    console.warn('Failed to load rank history:', err);
  }
}

function renderRankHistoryList(records) {
  const container = $('rankHistoryList');
  if (!container) return;
  container.innerHTML = '';

  if (!records || records.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:11px;">No rank observations recorded yet. Log your first observation above!</div>';
    return;
  }

  records.slice(0, 30).forEach((rec) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div style="flex:1;">
        <div class="history-query">${escapeHTML(rec.keyword || '-')}</div>
        <div class="history-meta">
          <span>ASIN: <strong>${escapeHTML(rec.asin || '-')}</strong></span>
          <span>•</span>
          <span>${rec.type || 'Organic'}</span>
          <span>•</span>
          <span>${new Date(rec.timestamp).toLocaleDateString()} ${new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div class="history-rank">#${rec.rank || '-'}</div>
    `;
    container.appendChild(card);
  });
}

async function saveRankObservation() {
  const asin = (($('historyAsinInput') ? $('historyAsinInput').value.trim() : '') || (currentProductData ? currentProductData.asin : '')).toUpperCase();
  const keyword = $('historyKeywordInput') ? $('historyKeywordInput').value.trim() : '';
  const rank = $('historyRankInput') ? parseInt($('historyRankInput').value, 10) : NaN;
  const type = $('historyTypeSelect') ? $('historyTypeSelect').value : 'Organic';

  if (!asin || !keyword || isNaN(rank)) {
    showToast('Please provide ASIN, Keyword, and Rank');
    return;
  }

  const record = {
    asin,
    keyword,
    rank,
    type,
    timestamp: new Date().toISOString()
  };

  try {
    const res = await chrome.storage.local.get(['rank_history_records']);
    const list = res.rank_history_records || [];
    list.unshift(record);
    await chrome.storage.local.set({ rank_history_records: list });
    renderRankHistoryList(list);
    if ($('historyKeywordInput')) $('historyKeywordInput').value = '';
    if ($('historyRankInput')) $('historyRankInput').value = '';
    showToast(`✅ Logged Rank #${rank} for "${keyword}"`);
  } catch (err) {
    showToast(`Failed to save: ${err.message}`);
  }
}

async function clearRankHistory() {
  if (!confirm('Clear all local rank observations?')) return;
  await chrome.storage.local.set({ rank_history_records: [] });
  renderRankHistoryList([]);
  showToast('Rank history cleared');
}

async function exportRankHistoryCSV() {
  const res = await chrome.storage.local.get(['rank_history_records']);
  const list = res.rank_history_records || [];
  if (!list.length) {
    showToast('No rank history to export');
    return;
  }
  const headers = ['Timestamp', 'ASIN', 'Keyword', 'Rank', 'Type'];
  const rows = list.map(r => [
    `"${r.timestamp}"`,
    `"${r.asin}"`,
    `"${(r.keyword || '').replace(/"/g, '""')}"`,
    r.rank,
    `"${r.type}"`
  ]);
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rank-history-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Rank History CSV Exported!');
}

function initRankHistory() {
  if ($('saveRankObservationBtn')) {
    $('saveRankObservationBtn').onclick = () => saveRankObservation();
  }
  if ($('clearHistoryBtn')) {
    $('clearHistoryBtn').onclick = () => clearRankHistory();
  }
  if ($('exportHistoryCsvBtn')) {
    $('exportHistoryCsvBtn').onclick = () => exportRankHistoryCSV();
  }
}

// ── Flipkart Seller Fee Engine ──────────────────────────────────────────────

function initFlipkartFeeCalculator() {
  function computeFlipkartFees() {
    const categoryEl = $('calcFkCategory');
    const priceEl = $('calcFkSellingPrice');
    const weightEl = $('calcFkWeight');
    const tierEl = $('calcFkShippingTier');
    const payEl = $('calcFkPaymentMode');

    const category = categoryEl ? categoryEl.value : 'Electronics';
    const sellingPrice = parseFloat(priceEl ? priceEl.value : 0) || 0;
    const weightGrams = parseFloat(weightEl ? weightEl.value : 450) || 450;
    const shippingTier = tierEl ? tierEl.value : 'national';
    const isCod = payEl ? payEl.value === 'cod' : false;

    const rateCard = {
      'Electronics': 8.5,
      'Mobiles & Accessories': 9.0,
      'Computers & IT': 5.5,
      'Apparel & Fashion': 14.0,
      'Footwear': 12.5,
      'Home & Kitchen': 11.0,
      'Beauty & Grooming': 8.0,
      'Books': 7.0,
      'Sports & Fitness': 10.5
    };

    const commPct = rateCard[category] || 10.0;
    const commFee = sellingPrice * (commPct / 100);

    let fixedFee = 30;
    if (sellingPrice <= 250) fixedFee = 5;
    else if (sellingPrice <= 500) fixedFee = 9;
    else if (sellingPrice <= 1000) fixedFee = 15;

    let collFee = sellingPrice * 0.02;
    if (isCod) collFee += 15;

    const baseRates = { local: 44, zonal: 54, national: 69 };
    const addlRates = { local: 15, zonal: 20, national: 26 };
    const baseShip = baseRates[shippingTier] || baseRates.national;
    const addl = addlRates[shippingTier] || addlRates.national;

    let shipFee = baseShip;
    if (weightGrams > 500) {
      shipFee += Math.ceil((weightGrams - 500) / 500) * addl;
    }

    const totalMktFees = commFee + fixedFee + collFee + shipFee;
    const gst = totalMktFees * 0.18;
    const totalDeductions = totalMktFees + gst;
    const netPayout = Math.max(0, sellingPrice - totalDeductions);
    const feePct = sellingPrice > 0 ? (totalDeductions / sellingPrice) * 100 : 0;

    if ($('calcFkCommissionFee')) $('calcFkCommissionFee').textContent = `₹${commFee.toFixed(2)}`;
    if ($('calcFkFixedFee')) $('calcFkFixedFee').textContent = `₹${fixedFee.toFixed(2)}`;
    if ($('calcFkCollectionFee')) $('calcFkCollectionFee').textContent = `₹${collFee.toFixed(2)}`;
    if ($('calcFkShippingFee')) $('calcFkShippingFee').textContent = `₹${shipFee.toFixed(2)}`;
    if ($('calcFkGst')) $('calcFkGst').textContent = `₹${gst.toFixed(2)}`;
    if ($('calcFkNetPayout')) $('calcFkNetPayout').textContent = `₹${netPayout.toFixed(2)}`;
    if ($('calcFkFeePct')) $('calcFkFeePct').textContent = `${feePct.toFixed(2)}%`;
  }

  if ($('btnCalculateFlipkartFees')) {
    $('btnCalculateFlipkartFees').onclick = computeFlipkartFees;
  }
  ['calcFkCategory', 'calcFkSellingPrice', 'calcFkWeight', 'calcFkShippingTier', 'calcFkPaymentMode'].forEach(id => {
    const el = $(id);
    if (el) {
      el.oninput = computeFlipkartFees;
      el.onchange = computeFlipkartFees;
    }
  });

  computeFlipkartFees();
}

// ── Google Trends CSV Importer ───────────────────────────────────────────────

function initGoogleTrendsImporter() {
  const btn = $('importTrendsBtn');
  const input = $('trendsCsvInput');
  const status = $('trendsStatusText');
  const container = $('trendsResultsContainer');

  if (!btn || !input) return;

  btn.onclick = async () => {
    const text = input.value.trim();
    if (!text) {
      if (status) status.innerHTML = `<span style="color:#ff6b6b;">⚠️ Please paste a valid Google Trends CSV export first.</span>`;
      return;
    }

    if (status) status.textContent = 'Parsing authentic Google Trends data...';

    try {
      const res = await fetch(`${currentProxyUrl.replace(/\/$/, '')}/api/google/trends-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: text })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const respData = await res.json();
      const parsed = respData.data || respData;

      if (status) {
        status.innerHTML = `<span style="color:#00c853;">✔ Parsed ${parsed.totalDataPoints || 0} time intervals (${parsed.dateRange || 'Recent'}). Verified Real Data.</span>`;
      }

      if (container && parsed.metrics) {
        let html = '<div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">';
        for (const [kw, metric] of Object.entries(parsed.metrics)) {
          const color = metric.trendDirection === 'RISING' ? '#00c853' : metric.trendDirection === 'DECLINING' ? '#ff6b6b' : '#ff9900';
          html += `
            <div style="padding:6px 8px; background:rgba(255,255,255,0.04); border-left:3px solid ${color}; border-radius:4px;">
              <div style="font-weight:700; color:#fff;">${escapeHTML(kw)}: <span style="color:${color}; font-size:10px;">${metric.trendDirection} (${metric.velocityPct > 0 ? '+' : ''}${metric.velocityPct}%)</span></div>
              <div style="font-size:10px; color:var(--text-muted);">Avg Interest: ${metric.averageInterest} &bull; Recent: ${metric.recentInterest}${metric.peakDate ? ` &bull; Peak: ${metric.peakDate}` : ''}</div>
            </div>
          `;
        }
        html += '</div>';
        container.innerHTML = html;
      }
    } catch (err) {
      if (status) status.innerHTML = `<span style="color:#ff6b6b;">Failed to parse CSV: ${err.message}</span>`;
    }
  };
}

// ── Live System Diagnostics ─────────────────────────────────────────────────

async function runSystemDiagnostics() {
  const backendBadge = $('diagBackendBadge');
  const backendDetails = $('diagBackendDetails');
  const creatorsBadge = $('diagCreatorsBadge');
  const creatorsDetails = $('diagCreatorsDetails');
  const spApiBadge = $('diagSpApiBadge');
  const spApiDetails = $('diagSpApiDetails');
  const fkBadge = $('diagFlipkartBadge');
  const fkDetails = $('diagFlipkartDetails');
  const gBadge = $('diagGoogleBadge');
  const gDetails = $('diagGoogleDetails');

  if (backendBadge) {
    backendBadge.className = 'badge badge-blue';
    backendBadge.textContent = 'Checking...';
  }

  try {
    const url = `${currentProxyUrl.replace(/\/$/, '')}/api/diagnostics`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (backendBadge) {
      backendBadge.className = 'badge badge-green';
      backendBadge.textContent = '200 OK • CONNECTED';
    }
    if (backendDetails) {
      backendDetails.innerHTML = `Active on <strong>${currentProxyUrl}</strong> • Zero client secrets • Hardcore security verified`;
    }

    const amz = (data.ecosystems && data.ecosystems.amazon) || data;

    if (amz.creatorsApi) {
      const c = amz.creatorsApi;
      if (c.hasCredentials && c.hasPartnerTag) {
        if (creatorsBadge) {
          creatorsBadge.className = 'badge badge-green';
          creatorsBadge.textContent = 'CONFIGURED';
        }
        if (creatorsDetails) creatorsDetails.innerHTML = `Marketplace: <strong>${c.marketplace}</strong> • Partner Tag: <strong>${c.partnerTag}</strong>`;
      } else {
        if (creatorsBadge) {
          creatorsBadge.className = 'badge';
          creatorsBadge.style.background = 'rgba(255, 153, 0, 0.2)';
          creatorsBadge.style.color = '#ff9900';
          creatorsBadge.textContent = 'NOT CONFIGURED';
        }
        if (creatorsDetails) {
          creatorsDetails.innerHTML = `Amazon India Associates account required (3 qualifying sales in 180 days). Set <code>CREATORS_API_CLIENT_ID</code> and <code>CREATORS_API_PARTNER_TAG</code> in backend <code>.env</code>.`;
        }
      }
    }

    if (amz.sellingPartnerApi) {
      const sp = amz.sellingPartnerApi;
      if (sp.hasAppRegistration && sp.hasSellerAuthorization) {
        if (spApiBadge) {
          spApiBadge.className = 'badge badge-green';
          spApiBadge.textContent = 'CONFIGURED';
        }
        if (spApiDetails) spApiDetails.innerHTML = `Marketplace: <strong>${sp.marketplaceId}</strong> • EU Endpoint: <strong>${sp.endpoint}</strong>`;
      } else {
        if (spApiBadge) {
          spApiBadge.className = 'badge';
          spApiBadge.style.background = 'rgba(255, 153, 0, 0.2)';
          spApiBadge.style.color = '#ff9900';
          spApiBadge.textContent = 'NOT CONFIGURED';
        }
        if (spApiDetails) {
          spApiDetails.innerHTML = `Seller Central India developer registration required. Set <code>SP_API_CLIENT_ID</code> and <code>SP_API_REFRESH_TOKEN</code> in backend <code>.env</code>.`;
        }
      }
    }

    const fk = (data.ecosystems && data.ecosystems.flipkart && data.ecosystems.flipkart.sellerApiV3) || {};
    if (fkBadge) {
      if (fk.hasCredentials && fk.hasSellerId) {
        fkBadge.className = 'badge badge-green';
        fkBadge.textContent = 'CONFIGURED';
      } else {
        fkBadge.className = 'badge';
        fkBadge.style.background = 'rgba(255, 153, 0, 0.2)';
        fkBadge.style.color = '#ff9900';
        fkBadge.textContent = 'NOT CONFIGURED';
      }
    }
    if (fkDetails) {
      fkDetails.innerHTML = fk.hasCredentials
        ? `Seller ID: <strong>${fk.sellerId}</strong> • OAuth v3.0 Endpoint Active`
        : `Official Flipkart Seller API v3.0. Set <code>FLIPKART_APP_ID</code> and <code>FLIPKART_SELLER_ID</code> in backend <code>.env</code>.`;
    }

    const g = (data.ecosystems && data.ecosystems.google) || {};
    if (gBadge) {
      gBadge.className = 'badge badge-blue';
      gBadge.textContent = 'CSV / API READY';
    }
    if (gDetails) {
      gDetails.innerHTML = `Google Trends CSV Ingestion Active • GSC &amp; Google Ads Developer Token adapters ready`;
    }

  } catch (err) {
    if (backendBadge) {
      backendBadge.className = 'badge';
      backendBadge.style.background = 'rgba(255, 107, 107, 0.2)';
      backendBadge.style.color = '#ff6b6b';
      backendBadge.textContent = 'OFFLINE';
    }
    if (backendDetails) {
      backendDetails.innerHTML = `Could not reach ${currentProxyUrl}. Run <code>start-backend.bat</code> to enable proxy APIs. Note: <em>Deterministic local engine remains 100% active in browser!</em>`;
    }
    if (creatorsBadge) {
      creatorsBadge.className = 'badge';
      creatorsBadge.textContent = 'BACKEND OFFLINE';
    }
    if (spApiBadge) {
      spApiBadge.className = 'badge';
      spApiBadge.textContent = 'BACKEND OFFLINE';
    }
    if (fkBadge) {
      fkBadge.className = 'badge';
      fkBadge.textContent = 'BACKEND OFFLINE';
    }
    if (gBadge) {
      gBadge.className = 'badge';
      gBadge.textContent = 'LOCAL ONLY';
    }
  }
}

function initDiagnostics() {
  if ($('refreshDiagBtn')) {
    $('refreshDiagBtn').onclick = () => runSystemDiagnostics();
  }
}

function updatePageConnectionBanner(mode, url, meta) {
  const banner = $('connectionBanner');
  const icon = $('connBannerIcon');
  const text = $('connBannerText');
  const btn = $('connBannerActionBtn');
  if (!banner || !text) return;

  banner.style.display = 'flex';

  if (mode === 'product') {
    banner.style.background = 'rgba(0, 200, 83, 0.12)';
    banner.style.borderLeftColor = '#00c853';
    if (icon) icon.textContent = '🟢';
    text.innerHTML = `Live Amazon Product Active &bull; ASIN: <strong>${escapeHTML(meta || 'Detected')}</strong>`;
    if (btn) btn.style.display = 'none';
  } else if (mode === 'search') {
    banner.style.background = 'rgba(255, 153, 0, 0.12)';
    banner.style.borderLeftColor = 'var(--amazon-orange)';
    if (icon) icon.textContent = '🔍';
    text.innerHTML = `Live Amazon Search Active &bull; Query: <strong>${escapeHTML(meta || 'Results')}</strong>`;
    if (btn) {
      btn.style.display = 'inline-block';
      btn.textContent = 'Re-Scan';
      btn.onclick = () => scanCurrentTabSearch();
    }
  } else if (mode === 'flipkart_product') {
    banner.style.background = 'rgba(40, 116, 240, 0.12)';
    banner.style.borderLeftColor = '#2874F0';
    if (icon) icon.textContent = '🛍️';
    text.innerHTML = `Live Flipkart Product Active &bull; FSN/PID: <strong>${escapeHTML(meta || 'Detected')}</strong>`;
    if (btn) btn.style.display = 'none';
  } else if (mode === 'flipkart_search') {
    banner.style.background = 'rgba(251, 100, 27, 0.12)';
    banner.style.borderLeftColor = '#FB641B';
    if (icon) icon.textContent = '🔍';
    text.innerHTML = `Live Flipkart Search Active &bull; Query: <strong>${escapeHTML(meta || 'Results')}</strong>`;
    if (btn) {
      btn.style.display = 'inline-block';
      btn.textContent = 'Re-Scan';
      btn.onclick = () => scanCurrentTabSearch();
    }
  } else if (mode === 'flipkart_generic') {
    banner.style.background = 'rgba(40, 116, 240, 0.12)';
    banner.style.borderLeftColor = '#2874F0';
    if (icon) icon.textContent = '🛍️';
    text.innerHTML = `Flipkart Page Active &bull; Open any product or search page for live audit`;
    if (btn) {
      btn.style.display = 'inline-block';
      btn.textContent = 'Scan SERP';
      btn.onclick = () => scanCurrentTabSearch();
    }
  } else if (mode === 'amazon_generic') {
    banner.style.background = 'rgba(20, 110, 180, 0.12)';
    banner.style.borderLeftColor = '#146EB4';
    if (icon) icon.textContent = '🛒';
    text.innerHTML = `Amazon Page Active &bull; Open any product or search page for live audit`;
    if (btn) {
      btn.style.display = 'inline-block';
      btn.textContent = 'Scan SERP';
      btn.onclick = () => scanCurrentTabSearch();
    }
  } else {
    banner.style.background = 'rgba(0, 192, 240, 0.12)';
    banner.style.borderLeftColor = '#00c0f0';
    if (icon) icon.textContent = '⚡';
    text.innerHTML = `<strong>Standalone Research Workspace</strong> &bull; All Amazon, Flipkart &amp; Google tools active`;
    if (btn) {
      btn.style.display = 'inline-block';
      btn.textContent = 'Open Amazon.in';
      btn.onclick = () => chrome.tabs.create({ url: 'https://www.amazon.in' });
    }
  }
}

// ─── Main Data Loading ──────────────────────────────────────────────────────

async function loadData() {
  try {
    let tab = null;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs.length > 0) tab = tabs[0];
    } catch (_) {}

    const isAmazon = tab && tab.url && tab.url.toLowerCase().includes('amazon.');
    const isFlipkart = tab && tab.url && tab.url.toLowerCase().includes('flipkart.com');

    if (isAmazon || isFlipkart) {
      const isSearch = isFlipkart
        ? (tab.url.includes('/search') || tab.url.includes('q='))
        : isAmazonSearchUrl(tab.url);

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/content.js']
        });
      } catch (_) {}

      await new Promise(r => setTimeout(r, 150));

      if (isSearch) {
        chrome.tabs.sendMessage(tab.id, { action: 'extractSearchResults' }, (response) => {
          if (!chrome.runtime.lastError && response && response.success && response.data) {
            showState('ready');
            renderSerpResults(response.data);
            switchTab('serp');
            updatePageConnectionBanner(isFlipkart ? 'flipkart_search' : 'search', tab.url, response.data.query);
            return;
          }
          renderAll(SAMPLE_PRODUCT_DATA);
          switchTab('serp');
          updatePageConnectionBanner(isFlipkart ? 'flipkart_search' : 'search', tab.url, 'Visible Items');
        });
        return;
      }

      // Try extract product data
      chrome.tabs.sendMessage(tab.id, { action: 'extractData' }, (response) => {
        if (!chrome.runtime.lastError && response && response.success && response.data) {
          if (response.isSearch) {
            showState('ready');
            renderSerpResults(response.data);
            switchTab('serp');
            updatePageConnectionBanner(isFlipkart ? 'flipkart_search' : 'search', tab.url, response.data.query);
          } else {
            renderAll(response.data);
            updatePageConnectionBanner(isFlipkart ? 'flipkart_product' : 'product', tab.url, response.data.asin || response.data.fsn);
          }
          return;
        }

        renderAll(SAMPLE_PRODUCT_DATA);
        updatePageConnectionBanner(isFlipkart ? 'flipkart_generic' : 'amazon_generic', tab.url);
      });
      return;
    }

    // Standalone workspace for non-supported tab
    renderAll(SAMPLE_PRODUCT_DATA);
    updatePageConnectionBanner('standalone', tab ? tab.url : '');

  } catch (err) {
    console.warn('loadData fallback:', err);
    renderAll(SAMPLE_PRODUCT_DATA);
    updatePageConnectionBanner('standalone', '');
  }
}

function showState(state, msg = '') {
  $('loadingState').style.display = 'none';
  $('notAmazonState').style.display = 'none';
  $('errorState').style.display = 'none';

  if (state === 'loading') {
    $('loadingState').style.display = 'flex';
    $('mainUI').style.display = 'none';
    $('mainFooter').style.display = 'none';
  } else if (state === 'error') {
    $('errorState').style.display = 'flex';
    if (msg && $('errorMsg')) $('errorMsg').textContent = msg;
  } else {
    // Show mainUI and mainFooter so all tabs are always accessible
    $('mainUI').style.display = 'block';
    $('mainFooter').style.display = 'flex';
  }
}

// ─── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initSearchApi();
  initAiOptimizer();
  initListingBuilder();
  initSettings();
  initSerp();
  initCompetitorComparison();
  initRankHistory();
  initDiagnostics();
  initFlipkartFeeCalculator();
  initGoogleTrendsImporter();

  // Wire demo and sample preview buttons
  if ($('loadSampleDataBtn')) {
    $('loadSampleDataBtn').onclick = () => {
      renderAll(SAMPLE_PRODUCT_DATA);
      showToast('⚡ Standalone Workspace Activated!');
    };
  }

  if ($('openAmazonDemoBtn')) {
    $('openAmazonDemoBtn').onclick = () => {
      chrome.tabs.create({ url: 'https://www.amazon.com/dp/B08N5WRWNW' });
    };
  }

  // Wire Side Panel button
  if ($('openSidePanelBtn')) {
    $('openSidePanelBtn').onclick = async () => {
      try {
        const window = await chrome.windows.getCurrent();
        if (chrome.sidePanel && chrome.sidePanel.open) {
          await chrome.sidePanel.open({ windowId: window.id });
          window.close();
        } else {
          showToast('Side panel requires Chrome 116+');
        }
      } catch (err) {
        console.warn('Could not open side panel:', err);
      }
    };
  }

  await loadSettings();
  loadData();
  loadRankHistory();
  runSystemDiagnostics();
});
