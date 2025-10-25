let sentences = {};
let LANGUAGE = "highlighter"
let path = "http://localhost"
let activeColorFilter = null; // Track selected color filter

// --- Load sentences from server ---
async function loadSentencesFromServer() {
  try {
    const res = await fetch(`${path}/${LANGUAGE}/php/getWords.php`);
    const data = await res.json();
    sentences = data || {};
    updateUI();
    console.log("✅ Sentences loaded:", Object.keys(sentences).length);
  } catch (err) {
    console.error("❌ Failed to fetch sentences:", err);
    sentences = {};
    updateUI();
  }
}

// --- Save sentence to server ---
async function saveSentenceToServer(sentence, definition = "", color = "white") {
  try {
    const payload = { word: sentence, definition, color, time: new Date().toISOString() };
    const res = await fetch(`${path}/${LANGUAGE}/php/saveWord.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.status === "saved") {
      sentences[sentence] = payload;
      updateUI();
    } else {
      console.warn("⚠️ Server error:", result);
    }
  } catch (err) {
    console.error("❌ Failed to save sentence:", err);
  }
}

// --- Delete sentence ---
async function deleteSentenceFromServer(sentence) {
  try {
    const res = await fetch(`${path}/${LANGUAGE}/php/deleteWord.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: sentence })
    });
    const result = await res.json();
    if (result.status === "deleted") {
      delete sentences[sentence];
      updateUI();
    } else {
      console.warn("⚠️ Delete failed:", result);
    }
  } catch (err) {
    console.error("❌ Failed to delete sentence:", err);
  }
}

// --- Update UI ---
function updateUI() {
  const listEl = document.getElementById("sentenceList");
  const countEl = document.querySelector("#sentenceCount .count-number");
  const searchQuery = document.getElementById("searchSentenceInput")?.value.toLowerCase() || "";
  const timeFilter = document.getElementById("timeFilterSelect")?.value || "all";

  if (!listEl || !countEl) return;

  const now = new Date();
  const filtered = Object.keys(sentences).filter(s => {
    const sentence = sentences[s];

    // Search filter
    const textMatch = s.toLowerCase().includes(searchQuery) || (sentence.definition || "").toLowerCase().includes(searchQuery);
    if (!textMatch) return false;

    // Time filter
    if (timeFilter !== "all") {
      const sentenceTime = new Date(sentence.time);
      if (isNaN(sentenceTime.getTime())) return false;
      const diff = now - sentenceTime;

      switch(timeFilter) {
        case "last1h": if (diff > 1*60*60*1000) return false; break;
        case "last24h": if (diff > 24*60*60*1000) return false; break;
        case "last7d": if (diff > 7*24*60*60*1000) return false; break;
        case "last30d": if (diff > 30*24*60*60*1000) return false; break;
      }
    }

    // Color filter
    if (activeColorFilter) {
      return (sentence.color || "white").toLowerCase() === activeColorFilter.toLowerCase();
    }

    return true;
  });

  countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    listEl.innerHTML = '<p class="empty-list-message">No sentences found.</p>';
    updateColorCount();
    return;
  }

  filtered.sort((a,b)=>a.localeCompare(b));
  listEl.innerHTML = "";

  const colorCounter = {};

  filtered.forEach(sentence => {
    const div = document.createElement("div");
    div.className = "sentence-item";

    const color = sentences[sentence].color || "white";
    colorCounter[color] = (colorCounter[color] || 0) + 1;

    const definitionText = sentences[sentence].definition || "";
    const timeText = sentences[sentence].time ? ` (${new Date(sentences[sentence].time).toLocaleString()})` : "";

    div.innerHTML = `
      <span class="sentence-text" style="color: ${color} !important;">${sentence}</span>
      <span class="sentence-definition" style="color: ${color} !important;">${definitionText}</span>
      <span class="sentence-time">${timeText}</span>
    `;

    div.addEventListener("click", () => showSentencePopup(sentence));
    listEl.appendChild(div);
  });

  updateColorCount(colorCounter);
}

// --- Update Color Count Display ---
function updateColorCount(colorCounter = {}) {
  const container = document.getElementById("colorCount");
  if (!container) return;

  container.innerHTML = "";

  // Map colors to vocab labels
  const colorMap = {
    "#FF0000": "Unknown",
    green: "Known",
    yellow: "Familiar",
    "#096fab":"today_W",      // Names
    orange: "Learning",
    white: "New"
  };

  Object.entries(colorMap).forEach(([color, label]) => {
    const count = colorCounter[color] || 0;
    const span = document.createElement("span");
    span.textContent = `${label}: ${count}`;
    span.style.color = color;
    span.style.marginRight = "12px";
    span.style.fontWeight = "bold";
    span.style.cursor = "pointer";
    if (activeColorFilter === color) span.style.textDecoration = "underline";

    span.onclick = () => {
      activeColorFilter = (activeColorFilter === color) ? null : color;
      updateUI();
    };

    container.appendChild(span);
  });
}

// --- Add new sentence ---
document.getElementById('addSentenceBtn')?.addEventListener('click', () => {
  const input = document.getElementById('newSentenceInput');
  const text = (input?.value || "").trim();
  if (!text) return alert("Enter a sentence.");
  if (sentences[text]) return alert("This sentence already exists.");
  saveSentenceToServer(text);
  input.value = "";
});

// --- Search ---
document.getElementById('searchSentenceInput')?.addEventListener('input', updateUI);

// --- Time filter ---
document.getElementById('timeFilterSelect')?.addEventListener('change', updateUI);

// --- Show popup for editing ---
function showSentencePopup(sentence) {
  const popup = document.getElementById("sentenceActionPopup");
  if (!popup) return;

  document.getElementById("selectedSentence").textContent = sentence;

  const defInput = document.getElementById("sentenceDefinition");
  defInput.value = sentences[sentence].definition || "";

  // --- Color buttons ---
  const colorContainer = document.getElementById("sentenceColorButtons");
  colorContainer.innerHTML = "";
  const colors = {
    "Default": "white",
    "Unknown": "#FF0000",
    "Familiar": "yellow",
    "Known": "green",
    "today_W": "#096fab",
    "Learning": "orange"
  };

  Object.entries(colors).forEach(([label, hex]) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.backgroundColor = hex;
    btn.style.color = ['#ffff00','#fff'].includes(hex.toLowerCase()) ? "#000" : "#fff";
    btn.style.marginRight = "6px";
    btn.style.border = "none";
    btn.style.padding = "6px 10px";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";

    if ((sentences[sentence].color || "white").toLowerCase() === hex.toLowerCase()) {
      btn.classList.add('active');
    }

    btn.onclick = () => {
      sentences[sentence].color = hex;
      saveSentenceToServer(sentence, defInput.value, hex);
      updateUI();
      colorContainer.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };

    colorContainer.appendChild(btn);
  });

  // --- Definition save ---
  let saveTimeout;
  defInput.oninput = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      sentences[sentence].definition = defInput.value;
      saveSentenceToServer(sentence, defInput.value, sentences[sentence].color || "white");
      updateUI();
    }, 500);
  };

  // --- Remove sentence ---
  document.getElementById("removeSentenceBtn").onclick = () => {
    deleteSentenceFromServer(sentence);
    popup.style.display = "none";
  };

  // --- Close popup ---
  document.getElementById("closeSentencePopupBtn").onclick = () => popup.style.display = "none";

  popup.style.display = "block";
}

// --- Close popup when clicking outside ---
document.addEventListener('mousedown', (e) => {
  const popup = document.getElementById("sentenceActionPopup");
  if (!popup || popup.style.display === 'none') return;
  if (!popup.contains(e.target) && !e.target.closest('.sentence-item') && e.target.id !== 'addSentenceBtn') {
    popup.style.display = 'none';
  }
});

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => loadSentencesFromServer());
