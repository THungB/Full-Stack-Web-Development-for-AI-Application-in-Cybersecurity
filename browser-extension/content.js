(function () {
  const POPUP_ID = "spam-detector-popup";

  function removePopup() {
    document.getElementById(POPUP_ID)?.remove();
  }

  async function scanSelectedText(selectedText, popup) {
    const button = popup.querySelector("button");
    const resultEl = popup.querySelector("[data-result]");

    button.disabled = true;
    button.textContent = "Scanning...";

    try {
      const response = await fetch("http://localhost:8000/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: selectedText,
          source: "extension",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to contact the spam detection API.");
      }

      const data = await response.json();
      resultEl.style.display = "block";
      resultEl.style.color = data.result === "spam" ? "#e11d48" : "#0f766e";
      resultEl.textContent = `${String(data.result).toUpperCase()} • ${(Number(data.confidence) * 100).toFixed(1)}%`;
      button.textContent = "Scan complete";
    } catch (error) {
      resultEl.style.display = "block";
      resultEl.style.color = "#e11d48";
      resultEl.textContent = error.message;
      button.textContent = "Retry";
      button.disabled = false;
    }
  }

  function createPopup(selectedText) {
    removePopup();

    const popup = document.createElement("div");
    popup.id = POPUP_ID;
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      width: min(320px, calc(100vw - 32px));
      border-radius: 18px;
      background: rgba(255, 250, 240, 0.97);
      border: 1px solid rgba(17, 32, 59, 0.12);
      box-shadow: 0 18px 40px rgba(17, 32, 59, 0.16);
      padding: 16px;
      font-family: "Segoe UI", sans-serif;
      color: #11203b;
    `;

    popup.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#5f6f8c;">Spam Detector</div>
          <div style="margin-top:8px;font-size:14px;line-height:1.5;color:#11203b;">${selectedText.slice(0, 120)}${selectedText.length > 120 ? "..." : ""}</div>
        </div>
        <button data-close style="border:none;background:transparent;color:#5f6f8c;font-size:14px;cursor:pointer;">✕</button>
      </div>
      <div style="margin-top:14px;display:flex;gap:10px;align-items:center;">
        <button style="border:none;border-radius:999px;padding:10px 14px;background:#11203b;color:white;font-weight:700;cursor:pointer;">Scan for Spam</button>
        <div data-result style="display:none;font-size:13px;font-weight:700;"></div>
      </div>
    `;

    popup.querySelector("[data-close]")?.addEventListener("click", removePopup);
    popup.querySelector("button:not([data-close])")?.addEventListener("click", () => {
      scanSelectedText(selectedText, popup);
    });

    document.body.appendChild(popup);
  }

  document.addEventListener("mouseup", () => {
    const selectedText = window.getSelection()?.toString().trim() || "";
    if (selectedText.length >= 10) {
      createPopup(selectedText);
      return;
    }

    removePopup();
  });
})();
