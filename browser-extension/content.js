(function () {
  const selectors = window.TelegramSpamGuardSelectors || {};
  const API_URL = "http://localhost:8000/scan";
  const WORD_THRESHOLD_DEFAULT = 10;
  const CACHE_TTL_MS = 2 * 60 * 1000;
  const REQUEST_TIMEOUT_MS = 8000;
  const MAX_CONCURRENCY = 2;
  const REALTIME_DEBOUNCE_MS = 400;
  const STORAGE_KEYS = {
    autoScanEnabled: "autoScanEnabled",
    minWords: "minWords",
    panelCollapsed: "panelCollapsed",
    panelVisible: "panelVisible",
  };

  const state = {
    settings: {
      autoScanEnabled: true,
      minWords: WORD_THRESHOLD_DEFAULT,
      panelCollapsed: false,
      panelVisible: true,
    },
    status: "idle",
    composer: null,
    composerBadge: null,
    composerHighlighter: null,
    panel: null,
    panelEls: {},
    routeKey: getRouteKey(),
    queue: [],
    running: 0,
    inFlightKeys: new Set(),
    cache: new Map(),
    lastDraft: "",
    draftDebounceTimer: null,
    locationTimer: null,
    composerObserver: null,
    composerRefreshQueued: false,
    botPassTimer: null,
  };

  init().catch((error) => {
    console.error("[SpamGuard] init failed:", error);
  });

  async function init() {
    if (!isTelegramWeb()) {
      return;
    }
    createPanel();
    await loadSettings();
    syncPanelControls();
    updateStatus("watching", "Watching chat activity.");

    bindGlobalEvents();
    setupLocationWatcher();
    setupComposerObserver();
    refreshComposer();

    // Periodically inject buttons into new messages
    state.botPassTimer = window.setInterval(injectButtonsPass, 1000);
  }

  function isTelegramWeb() {
    return location.hostname === "web.telegram.org";
  }

  function bindGlobalEvents() {
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("click", onClick, true);
  }

  function setupLocationWatcher() {
    state.locationTimer = window.setInterval(() => {
      const current = getRouteKey();
      if (state.routeKey !== current) {
        state.routeKey = current;
        state.lastDraft = "";
        refreshComposer();
        updateStatus("watching", "Chat changed. Watching new thread.");
      }
    }, 1000);
  }

  function setupComposerObserver() {
    if (state.composerObserver) {
      state.composerObserver.disconnect();
    }
    state.composerObserver = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => isExtensionNode(mutation.target))) {
        return;
      }
      queueComposerRefresh();
    });
    state.composerObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function injectButtonsPass() {
    // 1. Gather all potential message nodes based on our selectors
    const rawCandidates = collectCandidates(selectors.messageCandidates);

    // 2. Filter out giant chat history lists to avoid pinning buttons to the top of the screen
    const validNodes = [];
    for (const node of rawCandidates) {
      if (isExtensionNode(node)) continue;
      const cls = (node.className || "").toString().toLowerCase();
      if (
        cls.includes("list") ||
        cls.includes("scroll") ||
        cls.includes("history")
      )
        continue;
      validNodes.push(node);
    }

    const rootNodes = new Set();
    for (const node of validNodes) {
      let current = node.parentElement;
      let hasValidAncestor = false;
      while (current && current !== document.body) {
        if (validNodes.includes(current)) {
          hasValidAncestor = true;
          break;
        }
        current = current.parentElement;
      }
      if (!hasValidAncestor) {
        rootNodes.add(node);
      }
    }

    // 4. Inject button exactly once per message!
    for (const root of rootNodes) {
      // Skip if this branch was already processed previously
      if (root.dataset.spamGuardButtonInjected === "true") continue;

      const text = extractText(root);
      if (!text || countWords(text) <= state.settings.minWords) continue;

      const direction = inferDirection(root);
      if (direction !== "incoming") continue;

      // Safety net: mark this root AND all its inner nested layers as processed!
      root.dataset.spamGuardButtonInjected = "true";
      root
        .querySelectorAll(selectors.messageCandidates.join(","))
        .forEach((child) => {
          child.dataset.spamGuardButtonInjected = "true";
        });

      const btnContainer = document.createElement("div");
      btnContainer.className = "spam-guard-scan-container";
      btnContainer.style.paddingLeft = "45px";
      btnContainer.style.marginBottom = "4px";
      btnContainer.style.zIndex = "10";

      const btn = document.createElement("button");
      btn.className = "spam-guard-scan-btn";
      btn.innerText = "Click for scan";
      btn.dataset.scanText = text;
      btn.dataset.direction = direction;
      btnContainer.appendChild(btn);

      if (!root.parentElement) continue;
      root.parentElement.insertBefore(btnContainer, root);
    }
  }

  function refreshComposer() {
    const composer = findComposer();
    if (!composer) {
      clearComposerHighlight();
      state.composer = null;
      return;
    }
    if (state.composer === composer) return;

    clearComposerHighlight();
    state.composer = composer;
    applyComposerHighlight(composer);
    hookSendButton();
    updateComposerBadge();
  }

  function queueComposerRefresh() {
    if (state.composerRefreshQueued) return;
    state.composerRefreshQueued = true;
    window.requestAnimationFrame(() => {
      state.composerRefreshQueued = false;
      refreshComposer();
    });
  }

  function findComposer() {
    const candidates = collectCandidates(selectors.composerCandidates);
    if (!candidates.length) return null;

    const scored = candidates
      .filter(isVisibleElement)
      .map((element) => ({
        element,
        score: scoreComposerCandidate(element),
      }))
      .sort((a, b) => b.score - a.score);

    return scored[0]?.element || null;
  }

  function collectCandidates(candidateSelectors) {
    if (!Array.isArray(candidateSelectors)) return [];
    const found = [];
    for (const selector of candidateSelectors) {
      document.querySelectorAll(selector).forEach((node) => found.push(node));
    }
    return Array.from(new Set(found));
  }

  function scoreComposerCandidate(element) {
    const rect = element.getBoundingClientRect();
    const contentEditable =
      element.getAttribute("contenteditable") === "true" ? 20 : 0;
    const bottomBias = rect.bottom > window.innerHeight * 0.6 ? 50 : 0;
    const sizeBias = Math.min(30, Math.max(0, rect.width / 25));
    return rect.bottom + contentEditable + bottomBias + sizeBias;
  }

  function isVisibleElement(element) {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function applyComposerHighlight(composer) {
    composer.classList.add("spam-guard-composer");
    const badge = document.createElement("div");
    badge.className = "spam-guard-composer-badge";
    badge.textContent = "";
    composer.parentElement?.appendChild(badge);
    state.composerBadge = badge;
    state.composerHighlighter = composer;
  }

  function clearComposerHighlight() {
    if (state.composerHighlighter) {
      state.composerHighlighter.classList.remove("spam-guard-composer");
    }
    state.composerHighlighter = null;
    if (state.composerBadge) {
      state.composerBadge.remove();
      state.composerBadge = null;
    }
  }

  function updateComposerBadge(extraText) {
    if (!state.composerBadge) return;
    const statusText = state.settings.autoScanEnabled ? "AUTO ON" : "AUTO OFF";
    state.composerBadge.textContent = extraText
      ? "Spam Guard " + statusText + " - " + extraText
      : "Spam Guard " + statusText;
    state.composerBadge.dataset.enabled = String(
      state.settings.autoScanEnabled,
    );
  }

  function onInput(event) {
    const target = event.target;
    if (!state.composer || !target || target !== state.composer) return;
    state.lastDraft = getComposerText(state.composer);

    if (!state.settings.autoScanEnabled) {
      updateComposerBadge("manual mode");
      return;
    }

    window.clearTimeout(state.draftDebounceTimer);
    state.draftDebounceTimer = window.setTimeout(() => {
      triggerDraftScan("realtime");
    }, REALTIME_DEBOUNCE_MS);
  }

  function onKeyDown(event) {
    if (!state.composer || event.target !== state.composer) return;
    if (event.key === "Enter" && !event.shiftKey) {
      triggerDraftScan("send");
    }
  }

  function onClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest(".spam-guard-scan-btn")) {
      const btn = target.closest(".spam-guard-scan-btn");
      const text = btn.dataset.scanText;
      const direction = btn.dataset.direction;

      btn.innerText = "Scanning...";
      btn.classList.add("is-scanning");

      enqueueScan({
        chatKey: getChatKey(),
        text: text,
        direction: direction,
        trigger: "manual",
        timestamp: Date.now(),
        username: getCurrentUsername(),
      });
      return;
    }

    if (target.closest(".spam-guard-toggle")) {
      const input = state.panelEls.autoScanToggle;
      if (input) setAutoScanEnabled(Boolean(input.checked));
      return;
    }

    if (target.closest(".spam-guard-collapse")) {
      setPanelCollapsed(!state.settings.panelCollapsed);
      return;
    }
    if (target.closest(".spam-guard-toggle-visibility")) {
      setPanelVisible(!state.settings.panelVisible);
      return;
    }

    if (isLikelySendButton(target)) {
      triggerDraftScan("send");
    }
  }

  function hookSendButton() {
    const sendButtons = collectCandidates(selectors.sendButtonCandidates);
    sendButtons.forEach((button) => {
      if (!(button instanceof HTMLElement)) return;
      if (button.dataset.spamGuardHooked === "true") return;
      button.dataset.spamGuardHooked = "true";
      button.addEventListener("click", () => triggerDraftScan("send"), true);
    });
  }

  function isLikelySendButton(node) {
    const button = node.closest("button");
    if (!button) return false;
    const hints = [
      button.getAttribute("aria-label"),
      button.getAttribute("title"),
      button.className,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hints.includes("send");
  }

  function triggerDraftScan(trigger) {
    if (!state.settings.autoScanEnabled) return;
    if (!state.composer) return;
    const text = normalizeMessageText(getComposerText(state.composer));
    enqueueScan({
      chatKey: getChatKey(),
      text,
      direction: "outgoing",
      trigger,
      timestamp: Date.now(),
      username: getCurrentUsername(),
    });
  }

  function getComposerText(composer) {
    const raw = (composer.innerText || composer.textContent || "").trim();
    return raw.replace(/\s+/g, " ");
  }

  function extractText(element) {
    const clone = element.cloneNode(true);
    // Remove extension injected nodes so text doesn't include "Click for scan"
    clone
      .querySelectorAll(".spam-guard-scan-container")
      .forEach((el) => el.remove());
    const text = (clone.innerText || clone.textContent || "").trim();
    return text ? text.replace(/\s+/g, " ") : "";
  }

  function inferDirection(element) {
    const metadata = [
      element.className,
      element.getAttribute("data-is-outgoing"),
      element.getAttribute("data-message-owner"),
      element.getAttribute("aria-label"),
      element.closest('[class*="message"]')?.className,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (containsHint(metadata, selectors.outgoingHints)) return "outgoing";
    if (containsHint(metadata, selectors.incomingHints)) return "incoming";
    return "incoming";
  }

  function containsHint(text, hints) {
    if (!Array.isArray(hints)) return false;
    return hints.some((hint) => text.includes(String(hint).toLowerCase()));
  }

  function enqueueScan(candidate) {
    const normalizedText = normalizeMessageText(String(candidate.text || ""));
    if (
      !normalizedText ||
      countWords(normalizedText) <= state.settings.minWords
    )
      return;

    const queueKey = buildQueueKey(candidate.chatKey, normalizedText);
    const now = Date.now();
    const cached = state.cache.get(queueKey);

    if (cached && now - cached.createdAt < CACHE_TTL_MS) {
      applyDecision({
        ...candidate,
        result: cached.data.result,
        confidence: cached.data.confidence,
      });
      updateButtonScanned(normalizedText, cached.data.result);
      return;
    }
    if (state.inFlightKeys.has(queueKey)) return;
    if (state.queue.some((item) => item.queueKey === queueKey)) return;

    state.queue.push({
      ...candidate,
      text: normalizedText,
      queueKey,
    });
    pumpQueue();
  }

  function buildQueueKey(chatKey, text) {
    return String(chatKey || "chat") + ":" + hashString(text);
  }

  function pumpQueue() {
    while (state.running < MAX_CONCURRENCY && state.queue.length > 0) {
      const candidate = state.queue.shift();
      if (!candidate) return;
      state.running += 1;
      state.inFlightKeys.add(candidate.queueKey);
      scanCandidate(candidate)
        .catch(() => {})
        .finally(() => {
          state.running -= 1;
          state.inFlightKeys.delete(candidate.queueKey);
          pumpQueue();
        });
    }
  }

  function updateButtonScanned(text, result) {
    const btns = document.querySelectorAll(".spam-guard-scan-btn");
    btns.forEach((btn) => {
      if (btn.dataset.scanText === text) {
        const isSpam = String(result).toLowerCase() === "spam";
        btn.innerText = isSpam ? "⚠ SPAM" : "✔ " + String(result).toUpperCase();
        btn.classList.remove("is-scanning");
        btn.classList.add(isSpam ? "is-scanned-spam" : "is-scanned");
      }
    });
  }

  async function scanCandidate(candidate) {
    updateStatus("scanning", "Scanning " + candidate.direction + " message...");
    updateComposerBadge("scanning");

    try {
      const data = await scanWithRetry(candidate);
      state.cache.set(candidate.queueKey, { createdAt: Date.now(), data });

      applyDecision({
        ...candidate,
        result: data.result,
        confidence: Number(data.confidence) || 0,
      });

      updateButtonScanned(candidate.text, data.result);
    } catch (error) {
      if (isLikelyNetworkError(error)) {
        updateStatus("offline", "Backend unavailable.");
      } else {
        updateStatus("error", "Scan failed.");
      }

      updateButtonScanned(candidate.text, "Error");

      updatePanelContent({
        text: candidate.text,
        direction: candidate.direction,
        trigger: candidate.trigger,
        resultLabel: "-",
        confidenceLabel: "-",
        adviceLevel: "caution",
        adviceText: "Could not score this message right now.",
      });
    } finally {
      updateComposerBadge();
    }
  }

  async function scanWithRetry(candidate) {
    try {
      return await requestScan(candidate);
    } catch (firstError) {
      await sleep(250);
      return requestScan(candidate, firstError);
    }
  }

  async function requestScan(candidate, previousError) {
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: candidate.text,
          source: "extension",
          username: candidate.username || null,
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Scan API error: " + response.status);
      return await response.json();
    } catch (error) {
      if (previousError) throw previousError;
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  }

  function applyDecision(payload) {
    const decision = mapDecision(payload.result, payload.confidence);
    const confidenceLabel = formatConfidence(payload.confidence);
    updateStatus("done", "Latest " + payload.direction + " message scored.");
    updatePanelContent({
      text: payload.text,
      direction: payload.direction,
      trigger: payload.trigger,
      resultLabel:
        decision.resultLabelOverride ||
        String(payload.result || "").toUpperCase(),
      confidenceLabel,
      adviceLevel: decision.level,
      adviceText: decision.text,
    });
  }

  function mapDecision(result, confidence) {
    const c = Number(confidence) || 0;
    const r = String(result || "").toLowerCase();
    if (r === "spam" && c >= 0.8)
      return {
        level: "risky",
        resultLabelOverride: "SPAM",
        text: "Risky: High-confidence spam. Ignore and avoid all links.",
      };
    if (r === "spam" && c >= 0.6)
      return {
        level: "caution",
        resultLabelOverride: "SPAM",
        text: "Caution: Likely spam. Verify source before clicking any link.",
      };
    if (r === "needs_review" || (c > 0.4 && c < 0.6))
      return {
        level: "caution",
        resultLabelOverride: "REVIEW",
        text: "Uncertain: Score is borderline. Verify sender identity before acting.",
      };
    return {
      level: "safe",
      resultLabelOverride: "HAM",
      text: "Safe: Message looks legitimate. Stay cautious with unknown links.",
    };
  }

  function createPanel() {
    const panel = document.createElement("aside");
    panel.id = "spam-guard-panel";
    panel.innerHTML = [
      '<div class="spam-guard-header">',
      '<div class="spam-guard-title-wrap">',
      '<div class="spam-guard-kicker">Spam Detection</div>',
      '<div class="spam-guard-title">Telegram Scan</div>',
      "</div>",
      '<div class="spam-guard-header-actions" style="display:flex;gap:4px">',
      `<button class="spam-guard-toggle-visibility" type="button" aria-label="Toggle visibility" title="Show/Hide">
        <svg fill="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px">
          <path class="icon-eye-off" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
          <path class="icon-eye" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
      </button>`,
      '<button class="spam-guard-collapse" type="button" aria-label="Collapse panel" title="Collapse">-</button>',
      "</div>",
      "</div>",
      '<div class="spam-guard-controls">',
      '<label class="spam-guard-toggle">',
      '<input type="checkbox" class="spam-guard-toggle-input" />',
      '<span class="spam-guard-toggle-label">Auto Scan</span>',
      "</label>",
      '<span class="spam-guard-status-badge">IDLE</span>',
      "</div>",
      '<div class="spam-guard-body">',
      '<div class="spam-guard-message"></div>',
      '<div class="spam-guard-meta">',
      '<span class="spam-guard-pill spam-guard-result">-</span>',
      '<span class="spam-guard-pill spam-guard-confidence">-</span>',
      '<span class="spam-guard-pill spam-guard-direction">-</span>',
      "</div>",
      "</div>",
      '<div class="spam-guard-footer">',
      '<div class="spam-guard-advice-level">SAFE</div>',
      '<div class="spam-guard-advice-text">Waiting to scan a message.</div>',
      "</div>",
    ].join("");

    document.body.appendChild(panel);
    state.panel = panel;
    state.panelEls = {
      autoScanToggle: panel.querySelector(".spam-guard-toggle-input"),
      statusBadge: panel.querySelector(".spam-guard-status-badge"),
      message: panel.querySelector(".spam-guard-message"),
      result: panel.querySelector(".spam-guard-result"),
      confidence: panel.querySelector(".spam-guard-confidence"),
      direction: panel.querySelector(".spam-guard-direction"),
      adviceLevel: panel.querySelector(".spam-guard-advice-level"),
      adviceText: panel.querySelector(".spam-guard-advice-text"),
    };
  }

  function syncPanelControls() {
    if (!state.panel) return;
    const toggle = state.panelEls.autoScanToggle;
    if (toggle) toggle.checked = Boolean(state.settings.autoScanEnabled);
    state.panel.classList.toggle(
      "is-collapsed",
      Boolean(state.settings.panelCollapsed),
    );
    state.panel.classList.toggle(
      "is-hidden",
      !Boolean(state.settings.panelVisible),
    );
    updateComposerBadge();
  }

  function updatePanelContent(content) {
    if (!state.panel) return;
    const { message, result, confidence, direction, adviceLevel, adviceText } =
      state.panelEls;

    if (message) message.textContent = truncate(content.text || "", 180);
    if (result) {
      result.textContent = content.resultLabel || "-";
      result.dataset.level = content.adviceLevel || "safe";
    }
    if (confidence) confidence.textContent = content.confidenceLabel || "-";
    if (direction)
      direction.textContent =
        (content.direction || "unknown").toUpperCase() +
        " / " +
        String(content.trigger || "manual").toUpperCase();
    if (adviceLevel) {
      adviceLevel.textContent = String(
        content.adviceLevel || "safe",
      ).toUpperCase();
      adviceLevel.dataset.level = String(content.adviceLevel || "safe");
    }
    if (adviceText) adviceText.textContent = content.adviceText || "";
  }

  function updateStatus(status, message) {
    state.status = status;
    if (!state.panelEls.statusBadge) return;
    state.panelEls.statusBadge.textContent = status.toUpperCase();
    state.panelEls.statusBadge.dataset.status = status;
    if (
      message &&
      state.panelEls.message &&
      !state.panelEls.message.textContent
    )
      state.panelEls.message.textContent = message;
  }

  function setAutoScanEnabled(value) {
    state.settings.autoScanEnabled = Boolean(value);
    chrome.storage.local.set({
      [STORAGE_KEYS.autoScanEnabled]: state.settings.autoScanEnabled,
    });
    syncPanelControls();
    updateStatus(
      "watching",
      state.settings.autoScanEnabled
        ? "Auto scan enabled."
        : "Auto scan disabled.",
    );
  }

  function setPanelCollapsed(value) {
    state.settings.panelCollapsed = Boolean(value);
    chrome.storage.local.set({
      [STORAGE_KEYS.panelCollapsed]: state.settings.panelCollapsed,
    });
    if (state.panel)
      state.panel.classList.toggle(
        "is-collapsed",
        state.settings.panelCollapsed,
      );
  }

  function setPanelVisible(value) {
    state.settings.panelVisible = Boolean(value);
    chrome.storage.local.set({
      [STORAGE_KEYS.panelVisible]: state.settings.panelVisible,
    });
    if (state.panel)
      state.panel.classList.toggle("is-hidden", !state.settings.panelVisible);
  }

  async function loadSettings() {
    const defaults = {
      [STORAGE_KEYS.autoScanEnabled]: true,
      [STORAGE_KEYS.minWords]: WORD_THRESHOLD_DEFAULT,
      [STORAGE_KEYS.panelCollapsed]: false,
      [STORAGE_KEYS.panelVisible]: true,
    };
    const result = await new Promise((resolve) =>
      chrome.storage.local.get(defaults, resolve),
    );
    state.settings.autoScanEnabled = Boolean(
      result[STORAGE_KEYS.autoScanEnabled],
    );
    state.settings.minWords = Math.max(
      WORD_THRESHOLD_DEFAULT,
      Number(result[STORAGE_KEYS.minWords]) || WORD_THRESHOLD_DEFAULT,
    );
    state.settings.panelCollapsed = Boolean(
      result[STORAGE_KEYS.panelCollapsed],
    );
    state.settings.panelVisible = Boolean(result[STORAGE_KEYS.panelVisible]);
  }

  function getChatKey() {
    return getRouteKey();
  }
  function getRouteKey() {
    return location.pathname + location.search + location.hash;
  }
  function getCurrentUsername() {
    return (
      (document.title || "").replace(/\s+-\s+Telegram$/i, "").trim() || null
    );
  }

  function countWords(text) {
    const cleaned = String(text || "").trim();
    if (!cleaned) return 0;
    return cleaned.split(/\s+/).filter(Boolean).length;
  }

  function formatConfidence(confidence) {
    const value = Number(confidence);
    if (!Number.isFinite(value)) return "-";
    return (value * 100).toFixed(1) + "%";
  }

  function truncate(value, maxLength) {
    const text = String(value || "");
    return text.length <= maxLength
      ? text
      : text.slice(0, maxLength - 3) + "...";
  }

  function normalizeMessageText(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isLikelyNetworkError(error) {
    const message = String(error?.message || "").toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("network") ||
      message.includes("abort")
    );
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function hashString(value) {
    let hash = 0;
    const text = String(value || "");
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  function isExtensionNode(node) {
    if (!(node instanceof HTMLElement)) return false;
    if (node.id === "spam-guard-panel" || node.id === "spam-guard-style")
      return true;
    if (node.classList.contains("spam-guard-composer-badge")) return true;
    if (
      node.classList.contains("spam-guard-scan-container") ||
      node.classList.contains("spam-guard-scan-btn")
    )
      return true;
    if (node.closest("#spam-guard-panel")) return true;
    return false;
  }
})();
