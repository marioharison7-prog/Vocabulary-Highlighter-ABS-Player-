// -----------------------------
// Background / Context Menu
// -----------------------------
let LANGUAGE = "highlighter" 
let path = "http://localhost" 
let wordColors = {};
// Load colors from storage
chrome.storage.local.get("wordColors", (data) => {
  if (data.wordColors) wordColors = data.wordColors;
});

// Broadcast color updates to all tabs
function broadcastColorsUpdate() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { type: "UPDATE_WORD_COLORS", wordColors });
    }
  });
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateColors") {
    wordColors = message.wordColors;
    chrome.storage.local.set({ wordColors }, () => {
      broadcastColorsUpdate();
      sendResponse({ success: true });
    });
    return true;
  }

  // ✅ This block must be inside the listener
  if (message.type === "triggerPopup" && message.word) {
    const tabId = sender.tab.id;
    const selectedWord = message.word;

    // Reuse the same logic as context menu
    chrome.contextMenus.onClicked.dispatch(
      {
        menuItemId: "sendToPHP",
        selectionText: selectedWord
      },
      {
        id: tabId,
        url: "http://dummy" // dummy URL to satisfy validation
      }
    );
    return true;
  }
});
// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "sendToPHP") return;
  if (!tab.url.startsWith("http")) return;

  // Keep spaces but remove control characters
  const selectedWord = info.selectionText
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();

  if (!selectedWord) return;

  // ...rest of your c


  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (word) => {
      return new Promise(resolve => {
        if (document.querySelector(".vocab-modal-overlay")) return;

        // Overlay
        const overlay = document.createElement("div");
        overlay.className = "vocab-modal-overlay";
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          color:black;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2147483647;
        `;
        document.body.appendChild(overlay);

        // Popup
        const popup = document.createElement("div");
        popup.style.cssText = `
          background: #fff;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          max-width: 1500px;
          width: 95%;
          position: relative;
          z-index: 2147483648;
          font-family: Arial, sans-serif;
          font-size: 28px;
        `;
        popup.innerHTML = `
          <h2 style="margin:0 0 15px 0;font-size:24px;">Enter definition for "<strong>${word}</strong>"</h2>
          <textarea rows="5" style="
            width:100%;
            margin-top:10px;
            padding: 15px;
            font-size: 28px;
            line-height: 1.5;
            border-radius: 10px;
            border: 1px solid #ccc;
            resize: vertical;
          "></textarea>
          <div style="margin-top:20px;text-align:right;">
            <button id="cancelBtn" style="
              padding: 12px 25px;
              font-size: 28px;
              border-radius: 10px;
              border:none;
              background:#ccc;
              margin-right:10px;
              cursor:pointer;
            ">Cancel</button>
            <button id="saveBtn" style="
              padding: 12px 25px;
              font-size: 28px;
              border-radius: 10px;
              border:none;
              background:#4a90e2;
              color:#fff;
              cursor:pointer;
            ">Save</button>
          </div>
        `;
        overlay.appendChild(popup);

        const textarea = popup.querySelector("textarea");
        const saveBtn = popup.querySelector("#saveBtn");
        const cancelBtn = popup.querySelector("#cancelBtn");

        requestAnimationFrame(() => { textarea.focus(); textarea.select(); });

        // Block keyboard events outside popup
        const blockKeyboard = (e) => { if(!popup.contains(e.target)){ e.stopPropagation(); e.preventDefault(); } };
        document.addEventListener("keydown", blockKeyboard, true);
        document.addEventListener("keyup", blockKeyboard, true);
        document.addEventListener("keypress", blockKeyboard, true);

        const focusable = [textarea, cancelBtn, saveBtn]; 
        let index = 0;
        popup.addEventListener("keydown", (e) => {
          if (e.key === "Tab") { 
            e.preventDefault(); 
            index = e.shiftKey ? (index - 1 + focusable.length) % focusable.length : (index + 1) % focusable.length;
            focusable[index].focus();
          }
        });
        ['keydown','keyup','keypress'].forEach(ev => popup.addEventListener(ev, e => e.stopPropagation()));
        function cleanup() {
          document.removeEventListener("keydown", blockKeyboard, true);
          document.removeEventListener("keyup", blockKeyboard, true);
          document.removeEventListener("keypress", blockKeyboard, true);
          if (overlay.parentNode) document.body.removeChild(overlay);
        }

        saveBtn.addEventListener("click", () => { cleanup(); resolve(textarea.value.trim()); });
        cancelBtn.addEventListener("click", () => { cleanup(); resolve(null); });
      });
    },
    args: [selectedWord]
  }, (results) => {
    const def = results[0].result;
    if (!def) return;
    const time = new Date().toISOString();

    fetch(`${path}/${LANGUAGE}/php/saveWord.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: selectedWord, definition: def, time })
    })
    .then(res => res.json())
    .then(data => {
      // Toast feedback
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (msg) => {
          const toast = document.createElement("div");
          toast.textContent = msg;
          toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0,0,0,0.85);
            color: #fff;
            padding: 15px 20px;
            border-radius: 8px;
            font-size: 28px;
            z-index: 2147483647;
            opacity: 0;
            transition: opacity 0.3s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          `;
          document.body.appendChild(toast);
          requestAnimationFrame(() => { toast.style.opacity = "1"; });
          setTimeout(() => {
            toast.style.opacity = "0";
            toast.addEventListener("transitionend", () => toast.remove());
          }, 4000);
        },
        args: [`✅ Saved: ${data.word} = ${data.definition} @ ${data.time || time}`]
      });

      // Notify content script to reload highlights
      try { 
        chrome.tabs.sendMessage(tab.id, { type: "RELOAD_VOCAB" }); 
      } catch(err) { console.warn("Content script not ready:", err.message); }
    })
    .catch(err => console.error("Error:", err));
  });
});
