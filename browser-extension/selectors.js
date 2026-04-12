(() => {
  // Centralized selector/hint registry used by content.js scanning heuristics.
  window.TelegramSpamGuardSelectors = {
    composerCandidates: [
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][data-tab]',
      'div[contenteditable="true"]',
      "textarea",
    ],
    sendButtonCandidates: [
      'button[aria-label*="Send"]',
      'button[title*="Send"]',
      'button[aria-label*="send"]',
      'button[class*="send"]',
      'button[data-testid*="send"]',
    ],
    messageCandidates: [
      "[data-mid]",
      "[data-message-id]",
      '[class*="Message"]',
    ],
    incomingHints: ["incoming", "message-in", "is-in", "peer", "left"],
    outgoingHints: ["outgoing", "message-out", "is-out", "own", "right"],
  };
})();
