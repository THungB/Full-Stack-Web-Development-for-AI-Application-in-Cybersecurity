(function () {
  const selectors = window.TelegramSpamGuardSelectors || {};
  const API_URL = "http://localhost:8000/scan";
  const WORD_THRESHOLD_DEFAULT = 10;
  const CACHE_TTL_MS = 2 * 60 * 1000;
  const REQUEST_TIMEOUT_MS = 8000;
  const MAX_CONCURRENCY = 2;
  const REALTIME_DEBOUNCE_MS = 400;
  const HOVER_SCAN_DELAY_MS = 2000;
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
    incomingSeen: new Set(),
    hoverTimer: null,
    hoverFingerprint: "",
    hoveredMessageEl: null,
    lastDraft: "",
    draftDebounceTimer: null,
    healthCheckTimer: null,
    locationTimer: null,
    composerObserver: null,
    incomingObserver: null,
    composerRefreshQueued: false,
  };

  init().catch((error) => {
    console.error("[SpamGuard] init failed:", error);
  });

  async function init() {
    if (!isTelegramWeb()) {
      return;
    }

    injectStyles();
    createPanel();
    await loadSettings();
    syncPanelControls();
    updateStatus("watching", "Watching chat activity.");

    bindGlobalEvents();
    setupLocationWatcher();
    setupComposerObserver();
    refreshComposer();
  }

  function isTelegramWeb() {
    return location.hostname === "web.telegram.org";
  }

  function bindGlobalEvents() {
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
  }

  function setupLocationWatcher() {
    state.locationTimer = window.setInterval(() => {
      const current = getRouteKey();
      if (state.routeKey !== current) {
        state.routeKey = current;
        state.incomingSeen.clear();
        clearHoverTimer();
        state.hoveredMessageEl = null;
        state.hoverFingerprint = "";
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

  function setupIncomingObserver() {
    if (state.incomingObserver) {
      state.incomingObserver.disconnect();
    }

    state.incomingObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (isExtensionNode(mutation.target)) {
          continue;
        }
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) {
            continue;
          }
          if (isExtensionNode(node)) {
            continue;
          }
          processIncomingNode(node);
        }
      }
    });

    state.incomingObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function refreshComposer() {
    const composer = findComposer();
    if (!composer) {
      clearComposerHighlight();
      state.composer = null;
      return;
    }

    if (state.composer === composer) {
      return;
    }

    clearComposerHighlight();
    state.composer = composer;
    applyComposerHighlight(composer);
    hookSendButton();
    updateComposerBadge();
  }

  function queueComposerRefresh() {
    if (state.composerRefreshQueued) {
      return;
    }
    state.composerRefreshQueued = true;
    window.requestAnimationFrame(() => {
      state.composerRefreshQueued = false;
      refreshComposer();
    });
  }

  function findComposer() {
    const candidates = collectCandidates(selectors.composerCandidates);
    if (!candidates.length) {
      return null;
    }

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
    if (!Array.isArray(candidateSelectors)) {
      return [];
    }

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
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }
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
    if (!state.composerBadge) {
      return;
    }
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
    if (!state.composer || !target || target !== state.composer) {
      return;
    }
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
    if (!state.composer || event.target !== state.composer) {
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      triggerDraftScan("send");
    }
  }

  function onClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest(".spam-guard-toggle")) {
      const input = state.panelEls.autoScanToggle;
      if (input) {
        setAutoScanEnabled(Boolean(input.checked));
      }
      return;
    }

    if (target.closest(".spam-guard-collapse")) {
      const next = !state.settings.panelCollapsed;
      setPanelCollapsed(next);
      return;
    }
    if (target.closest(".spam-guard-toggle-visibility")) {
      const next = !state.settings.panelVisible;
      setPanelVisible(next);
      return;
    }

    if (isLikelySendButton(target)) {
      triggerDraftScan("send");
    }
  }

  function onMouseOver(event) {
    if (!state.settings.autoScanEnabled) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const messageElement = findMessageElement(target);
    if (!messageElement || isExtensionNode(messageElement)) {
      return;
    }

    const previous = event.relatedTarget;
    if (previous instanceof Node && messageElement.contains(previous)) {
      return;
    }

    const text = normalizeMessageText(extractText(messageElement));
    if (!text || countWords(text) <= state.settings.minWords) {
      clearHoverTimer();
      updateComposerBadge("hover > " + state.settings.minWords + " words");
      return;
    }

    const direction = inferDirection(messageElement);
    const fingerprint = hashString(getChatKey() + "|" + text);

    if (
      state.incomingSeen.has(fingerprint) ||
      state.hoverFingerprint === fingerprint
    ) {
      return;
    }

    state.hoveredMessageEl = messageElement;
    state.hoverFingerprint = fingerprint;
    clearHoverTimer();
    updateStatus("watching", "Hover 2s to scan message.");
    updateComposerBadge("hover scanning");

    state.hoverTimer = window.setTimeout(() => {
      if (
        !state.hoveredMessageEl ||
        state.hoveredMessageEl !== messageElement
      ) {
        return;
      }
      state.incomingSeen.add(fingerprint);
      enqueueScan({
        chatKey: getChatKey(),
        text,
        direction,
        trigger: "hover",
        timestamp: Date.now(),
        username: getCurrentUsername(),
      });
    }, HOVER_SCAN_DELAY_MS);
  }

  function onMouseOut(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const messageElement = findMessageElement(target);
    if (!messageElement) {
      return;
    }

    const next = event.relatedTarget;
    if (next instanceof Node && messageElement.contains(next)) {
      return;
    }

    if (state.hoveredMessageEl === messageElement) {
      clearHoverTimer();
      state.hoveredMessageEl = null;
      state.hoverFingerprint = "";
      updateComposerBadge();
    }
  }

  function hookSendButton() {
    const sendButtons = collectCandidates(selectors.sendButtonCandidates);
    sendButtons.forEach((button) => {
      if (!(button instanceof HTMLElement)) {
        return;
      }
      if (button.dataset.spamGuardHooked === "true") {
        return;
      }
      button.dataset.spamGuardHooked = "true";
      button.addEventListener(
        "click",
        () => {
          triggerDraftScan("send");
        },
        true,
      );
    });
  }

  function isLikelySendButton(node) {
    const button = node.closest("button");
    if (!button) {
      return false;
    }
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
    if (!state.settings.autoScanEnabled) {
      return;
    }
    if (!state.composer) {
      return;
    }
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

  function processIncomingNode(node) {
    if (isExtensionNode(node)) {
      return;
    }
    const candidates = extractMessageCandidates(node);
    for (const candidate of candidates) {
      const text = extractText(candidate);
      if (!text) {
        continue;
      }
      if (countWords(text) <= state.settings.minWords) {
        continue;
      }

      const direction = inferDirection(candidate);
      if (direction !== "incoming") {
        continue;
      }

      const fingerprint = hashString(getChatKey() + "|" + text);
      if (state.incomingSeen.has(fingerprint)) {
        continue;
      }
      state.incomingSeen.add(fingerprint);

      enqueueScan({
        chatKey: getChatKey(),
        text,
        direction: "incoming",
        trigger: "realtime",
        timestamp: Date.now(),
        username: getCurrentUsername(),
      });
    }
  }

  function findMessageElement(startNode) {
    if (!(startNode instanceof HTMLElement)) {
      return null;
    }
    if (!Array.isArray(selectors.messageCandidates)) {
      return null;
    }

    for (const selector of selectors.messageCandidates) {
      const found = startNode.closest(selector);
      if (found instanceof HTMLElement) {
        return found;
      }
    }
    return null;
  }

  function extractMessageCandidates(node) {
    const candidates = [];
    if (
      !isExtensionNode(node) &&
      matchesAny(node, selectors.messageCandidates)
    ) {
      candidates.push(node);
    }
    if (Array.isArray(selectors.messageCandidates)) {
      for (const selector of selectors.messageCandidates) {
        node.querySelectorAll(selector).forEach((el) => {
          if (el instanceof HTMLElement && !isExtensionNode(el)) {
            candidates.push(el);
          }
        });
      }
    }
    return Array.from(new Set(candidates));
  }

  function matchesAny(element, candidateSelectors) {
    if (!Array.isArray(candidateSelectors)) {
      return false;
    }
    return candidateSelectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });
  }

  function extractText(element) {
    const text = (element.innerText || element.textContent || "").trim();
    if (!text) {
      return "";
    }
    return text.replace(/\s+/g, " ");
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

    if (containsHint(metadata, selectors.outgoingHints)) {
      return "outgoing";
    }
    if (containsHint(metadata, selectors.incomingHints)) {
      return "incoming";
    }
    return "incoming";
  }

  function containsHint(text, hints) {
    if (!Array.isArray(hints)) {
      return false;
    }
    return hints.some((hint) => text.includes(String(hint).toLowerCase()));
  }

  function enqueueScan(candidate) {
    const normalizedText = normalizeMessageText(String(candidate.text || ""));
    if (!normalizedText) {
      return;
    }
    if (countWords(normalizedText) <= state.settings.minWords) {
      return;
    }

    const queueKey = buildQueueKey(candidate.chatKey, normalizedText);
    const now = Date.now();
    const cached = state.cache.get(queueKey);
    if (cached && now - cached.createdAt < CACHE_TTL_MS) {
      applyDecision({
        ...candidate,
        result: cached.data.result,
        confidence: cached.data.confidence,
      });
      return;
    }
    if (state.inFlightKeys.has(queueKey)) {
      return;
    }
    if (state.queue.some((item) => item.queueKey === queueKey)) {
      return;
    }

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
      if (!candidate) {
        return;
      }
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

  async function scanCandidate(candidate) {
    updateStatus("scanning", "Scanning " + candidate.direction + " message...");
    updateComposerBadge("scanning");

    try {
      const data = await scanWithRetry(candidate);
      state.cache.set(candidate.queueKey, {
        createdAt: Date.now(),
        data,
      });
      applyDecision({
        ...candidate,
        result: data.result,
        confidence: Number(data.confidence) || 0,
      });
    } catch (error) {
      const isNetworkError = isLikelyNetworkError(error);
      if (isNetworkError) {
        updateStatus("offline", "Backend unavailable.");
      } else {
        updateStatus("error", "Scan failed.");
      }
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
      if (!response.ok) {
        throw new Error("Scan API error: " + response.status);
      }
      return await response.json();
    } catch (error) {
      if (previousError) {
        throw previousError;
      }
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
    const normalizedResult = String(result || "").toLowerCase();
    const normalizedConfidence = Number(confidence) || 0;

    if (normalizedConfidence >= 0.45 && normalizedConfidence <= 0.55) {
      return {
        level: "caution",
        resultLabelOverride: "UNCERTAIN",
        text: "Caution: Model confidence is near boundary. Verify sender and link before acting.",
      };
    }

    if (normalizedResult === "spam" && normalizedConfidence >= 0.8) {
      return {
        level: "risky",
        resultLabelOverride: "SPAM",
        text: "Risky: Ignore this message and avoid clicking links.",
      };
    }
    if (
      normalizedResult === "spam" &&
      normalizedConfidence >= 0.55 &&
      normalizedConfidence < 0.8
    ) {
      return {
        level: "caution",
        resultLabelOverride: "SPAM",
        text: "Caution: Verify source and link destination before clicking.",
      };
    }
    return {
      level: "safe",
      resultLabelOverride: "HAM",
      text: "Safe: Message looks acceptable, but still verify unusual requests.",
    };
  }

  function createPanel() {
    const panel = document.createElement("aside");
    panel.id = "spam-guard-panel";
    panel.innerHTML = [
      '<div class="spam-guard-header">',
      '<div class="spam-guard-title-wrap">',
      '<div class="spam-guard-kicker">Spam Guard</div>',
      '<div class="spam-guard-title">Telegram Safety</div>',
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
      '<div class="spam-guard-advice-text">Waiting for enough words to scan.</div>',
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
    if (!state.panel) {
      return;
    }
    const toggle = state.panelEls.autoScanToggle;
    if (toggle) {
      toggle.checked = Boolean(state.settings.autoScanEnabled);
    }
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
    if (!state.panel) {
      return;
    }
    const { message, result, confidence, direction, adviceLevel, adviceText } =
      state.panelEls;

    if (message) {
      message.textContent = truncate(content.text || "", 180);
    }
    if (result) {
      result.textContent = content.resultLabel || "-";
    }
    if (confidence) {
      confidence.textContent = content.confidenceLabel || "-";
    }
    if (direction) {
      direction.textContent =
        (content.direction || "unknown").toUpperCase() +
        " / " +
        String(content.trigger || "manual").toUpperCase();
    }
    if (adviceLevel) {
      adviceLevel.textContent = String(
        content.adviceLevel || "safe",
      ).toUpperCase();
      adviceLevel.dataset.level = String(content.adviceLevel || "safe");
    }
    if (adviceText) {
      adviceText.textContent = content.adviceText || "";
    }
  }

  function updateStatus(status, message) {
    state.status = status;
    if (!state.panelEls.statusBadge) {
      return;
    }
    state.panelEls.statusBadge.textContent = status.toUpperCase();
    state.panelEls.statusBadge.dataset.status = status;
    if (
      message &&
      state.panelEls.message &&
      !state.panelEls.message.textContent
    ) {
      state.panelEls.message.textContent = message;
    }
  }

  function setAutoScanEnabled(value) {
    state.settings.autoScanEnabled = Boolean(value);
    if (!state.settings.autoScanEnabled) {
      clearHoverTimer();
      state.hoveredMessageEl = null;
      state.hoverFingerprint = "";
    }
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
    if (state.panel) {
      state.panel.classList.toggle(
        "is-collapsed",
        state.settings.panelCollapsed,
      );
    }
  }

  function setPanelVisible(value) {
    state.settings.panelVisible = Boolean(value);
    chrome.storage.local.set({
      [STORAGE_KEYS.panelVisible]: state.settings.panelVisible,
    });
    if (state.panel) {
      state.panel.classList.toggle("is-hidden", !state.settings.panelVisible);
    }
  }

  async function loadSettings() {
    const defaults = {
      [STORAGE_KEYS.autoScanEnabled]: true,
      [STORAGE_KEYS.minWords]: WORD_THRESHOLD_DEFAULT,
      [STORAGE_KEYS.panelCollapsed]: false,
      [STORAGE_KEYS.panelVisible]: true,
    };

    const result = await new Promise((resolve) => {
      chrome.storage.local.get(defaults, resolve);
    });

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
    const title = document.title || "";
    const normalized = title.replace(/\s+-\s+Telegram$/i, "").trim();
    return normalized || null;
  }

  function countWords(text) {
    const cleaned = String(text || "").trim();
    if (!cleaned) {
      return 0;
    }
    return cleaned.split(/\s+/).filter(Boolean).length;
  }

  function formatConfidence(confidence) {
    const value = Number(confidence);
    if (!Number.isFinite(value)) {
      return "-";
    }
    return (value * 100).toFixed(1) + "%";
  }

  function truncate(value, maxLength) {
    const text = String(value || "");
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - 3) + "...";
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
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
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

  function clearHoverTimer() {
    if (state.hoverTimer) {
      window.clearTimeout(state.hoverTimer);
      state.hoverTimer = null;
    }
  }

  function injectStyles() {
    if (document.getElementById("spam-guard-style")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "spam-guard-style";
    style.textContent = `
      #spam-guard-panel {
        position: fixed;
        right: 14px;
        top: 84px;
        z-index: 2147483647;
        width: min(340px, calc(100vw - 28px));
        border-radius: 14px;
        background: rgba(9, 17, 35, 0.96);
        color: #e5ecff;
        border: 1px solid rgba(130, 160, 255, 0.22);
        box-shadow: 0 18px 45px rgba(2, 6, 18, 0.5);
        font-family: Segoe UI, Arial, sans-serif;
        backdrop-filter: blur(8px);
      }

      #spam-guard-panel.is-collapsed .spam-guard-body,
      #spam-guard-panel.is-collapsed .spam-guard-footer {
        display: none;
      }

      .spam-guard-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 12px 8px;
        border-bottom: 1px solid rgba(130, 160, 255, 0.16);
      }

      .spam-guard-kicker {
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(164, 189, 255, 0.84);
        font-weight: 700;
      }

      .spam-guard-title {
        margin-top: 2px;
        font-size: 14px;
        font-weight: 700;
      }

      .spam-guard-collapse, .spam-guard-toggle-visibility {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 999px;
        background: rgba(130, 160, 255, 0.18);
        color: #e5ecff;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .spam-guard-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
      }

      .spam-guard-toggle {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .spam-guard-toggle-label {
        font-size: 12px;
        font-weight: 600;
        color: rgba(229, 236, 255, 0.88);
      }

      .spam-guard-status-badge {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.12em;
        padding: 5px 8px;
        border-radius: 999px;
        background: rgba(130, 160, 255, 0.15);
      }

      .spam-guard-status-badge[data-status="offline"],
      .spam-guard-status-badge[data-status="error"] {
        background: rgba(255, 110, 144, 0.2);
      }

      .spam-guard-status-badge[data-status="done"] {
        background: rgba(87, 219, 157, 0.22);
      }

      .spam-guard-body {
        padding: 8px 12px 12px;
      }

      .spam-guard-message {
        min-height: 56px;
        font-size: 13px;
        line-height: 1.5;
        color: rgba(229, 236, 255, 0.9);
      }

      .spam-guard-meta {
        margin-top: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .spam-guard-pill {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 5px 8px;
        border-radius: 999px;
        background: rgba(130, 160, 255, 0.17);
      }

      .spam-guard-footer {
        border-top: 1px solid rgba(130, 160, 255, 0.16);
        padding: 10px 12px 12px;
      }

      .spam-guard-advice-level {
        font-size: 11px;
        letter-spacing: 0.1em;
        font-weight: 800;
      }

      .spam-guard-advice-level[data-level="safe"] { color: #66e6b1; }
      .spam-guard-advice-level[data-level="caution"] { color: #ffd96a; }
      .spam-guard-advice-level[data-level="risky"] { color: #ff8aa7; }

      .spam-guard-advice-text {
        margin-top: 4px;
        font-size: 12px;
        line-height: 1.45;
        color: rgba(229, 236, 255, 0.92);
      }

      .spam-guard-composer {
        outline: 2px solid rgba(110, 152, 255, 0.68) !important;
        outline-offset: 2px !important;
        border-radius: 8px !important;
      }

      .spam-guard-composer-badge {
        position: absolute;
        transform: translateY(-128%);
        right: 6px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        background: rgba(9, 17, 35, 0.95);
        color: #e5ecff;
        padding: 4px 8px;
        border-radius: 999px;
        border: 1px solid rgba(130, 160, 255, 0.25);
        z-index: 2147483646;
        white-space: nowrap;
      }

      .spam-guard-composer-badge[data-enabled="false"] {
        border-color: rgba(255, 128, 155, 0.25);
        color: rgba(255, 171, 189, 0.96);
      }

      @media (max-width: 960px) {
        #spam-guard-panel {
          right: 10px;
          top: auto;
          bottom: 10px;
          width: min(95vw, 340px);
        }
      }
      #spam-guard-panel.is-hidden {
        width: auto !important;
        min-width: 0 !important;
        border-radius: 999px !important;
        padding: 0 !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      #spam-guard-panel.is-hidden .spam-guard-header {
        padding: 0;
        border: none;
      }
      #spam-guard-panel.is-hidden .spam-guard-title-wrap,
      #spam-guard-panel.is-hidden .spam-guard-collapse,
      #spam-guard-panel.is-hidden .spam-guard-controls,
      #spam-guard-panel.is-hidden .spam-guard-body,
      #spam-guard-panel.is-hidden .spam-guard-footer {
        display: none !important;
      }
      #spam-guard-panel.is-hidden .spam-guard-toggle-visibility {
        width: 48px;
        height: 48px;
        background: rgba(43, 68, 128, 0.96);
        border: 1px solid rgba(130, 160, 255, 0.4);
        box-shadow: 0 4px 12px rgba(2, 6, 18, 0.5);
      }
      #spam-guard-panel.is-hidden .spam-guard-toggle-visibility svg {
        width: 24px !important;
        height: 24px !important;
      }
      #spam-guard-panel:not(.is-hidden) .icon-eye {
        display: none;
      }
      #spam-guard-panel:not(.is-hidden) .icon-eye-off {
        display: block;
      }
      #spam-guard-panel.is-hidden .icon-eye {
        display: block;
      }
      #spam-guard-panel.is-hidden .icon-eye-off {
        display: none;
      }    
    `;
    document.head.appendChild(style);
  }

  function isExtensionNode(node) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    if (node.id === "spam-guard-panel" || node.id === "spam-guard-style") {
      return true;
    }
    if (node.classList.contains("spam-guard-composer-badge")) {
      return true;
    }
    if (node.closest("#spam-guard-panel")) {
      return true;
    }
    return false;
  }
})();
