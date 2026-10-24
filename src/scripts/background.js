/**
 * OmniRank — Background Service Worker
 * Platforms: Amazon • Flipkart • Google
 * Engineered by tarikislam.in
 */

'use strict';

function isAmazonProductUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (!host.includes('amazon.')) return false;

    const path = u.pathname;
    if (/\/(?:dp|gp\/product|product-reviews|exec\/obidos\/asin)\/([A-Z0-9]{10})/i.test(path)) {
      return true;
    }
    if (/[?&]asin=([A-Z0-9]{10})/i.test(u.search)) {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

function isAmazonSearchUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (!host.includes('amazon.')) return false;
    return u.pathname.startsWith('/s') || u.search.includes('k=');
  } catch (_) {
    return false;
  }
}

function isFlipkartProductUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (!u.hostname.toLowerCase().includes('flipkart.com')) return false;
    return u.pathname.includes('/p/') || u.search.includes('pid=');
  } catch (_) {
    return false;
  }
}

function isFlipkartSearchUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (!u.hostname.toLowerCase().includes('flipkart.com')) return false;
    return u.pathname.startsWith('/search') || u.search.includes('q=');
  } catch (_) {
    return false;
  }
}

// Enable side panel on action click if supported
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
}

// Show badge when on Amazon or Flipkart product or search page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (isAmazonProductUrl(tab.url)) {
      chrome.action.setBadgeText({ text: 'AMZ-P', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#FF9900', tabId });
    } else if (isAmazonSearchUrl(tab.url)) {
      chrome.action.setBadgeText({ text: 'AMZ-S', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#146EB4', tabId });
    } else if (isFlipkartProductUrl(tab.url)) {
      chrome.action.setBadgeText({ text: 'FK-P', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#2874F0', tabId });
    } else if (isFlipkartSearchUrl(tab.url)) {
      chrome.action.setBadgeText({ text: 'FK-S', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#FB641B', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
});

// Handle messages from popup/sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({
      status: 'alive',
      product: 'OmniRank',
      version: '2.2.0',
      signature: 'Engineered by tarikislam.in'
    });
  } else if (request.action === 'openSidePanel') {
    if (chrome.sidePanel && chrome.sidePanel.open && sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Side panel API unavailable' });
    }
  }
  return true;
});
