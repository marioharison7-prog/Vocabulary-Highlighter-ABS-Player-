let LANGUAGE = "highlighter"
let path = "http://localhost"
const colorDefinitions = {
  "#096fab":"word of the day",
  "red": "Unfamiliar",

  "#ffff00": "Familiar",
  "#ffaa33": "Learning",
  "#c060ff": "Particles",
  "#ff66cc": "Function words",
  "#228b22": "Known",
  "#66ccff": "Names"
  
};

let wordColors = {};
let irregularWords = {}; // for lemma mapping
let irregularWordsReady = false;

// === Load irregular words dynamically from PHP ===
fetch(`${path}/${LANGUAGE}/php/getIrregularWords.php`)
  .then(res => res.json())
  .then(data => {
    irregularWords = data || {};
    irregularWordsReady = true;
    console.log("✅ Irregular words loaded:", Object.keys(irregularWords).length);
  })
  .catch(err => {
    console.error("❌ Failed to load irregular words:", err);
    irregularWordsReady = true; // avoid infinite waiting; allow manual adds
  });

async function waitForIrregularWords() {
  while (!irregularWordsReady) await new Promise(r => setTimeout(r, 50));
}

// === Helper: try saving to server with JSON first, then fallback form-encoded ===
async function saveIrregularWordToServer(originalWord, lemma) {
  try {
    // Try JSON
    let res = await fetch(`${path}/${LANGUAGE}/php/saveIrregularWord.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalWord, lemma })
    });
    let body = null;
    try { body = await res.json(); } catch (e) { body = null; }
    if (res.ok && body && (body.success || body.originalWord)) {
      return { success: true, body };
    }

    // Fallback: form-url-encoded (some PHP scripts expect this)
    res = await fetch(`${path}/${LANGUAGE}/php/saveIrregularWord.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ originalWord, lemma })
    });
    try { body = await res.json(); } catch (e) { body = null; }
    if (res.ok && body && (body.success || body.originalWord)) {
      return { success: true, body };
    }

    // If we get here, server didn't return a clear success
    return { success: false, error: "Unexpected server response", status: res.status, body };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// === Send word colors to server ===
function sendWordColorsToServer(wordColors) {
  fetch(`${path}/${LANGUAGE}/php/backupWordColors.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wordColors })
  })
  .then(res => res.json())
  .then(data => console.log("wordColors backed up:", data))
  .catch(err => console.error("Failed to send:", err));
}

// === Load word colors from server ===
function loadWordColorsFromServer() {
  fetch(`${path}/${LANGUAGE}/php/getbackupWordColors.php`)
    .then(res => res.json())
    .then(data => {
      if (data.wordColors && typeof data.wordColors === 'object') {
        wordColors = data.wordColors;
        chrome.storage.local.set({ wordColors }, () => updateUI());
      }
    })
    .catch(err => console.error("Failed to fetch wordColors from server:", err));
}

// === Update UI ===
function updateUI() {
  const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || "";
  const countEl = document.querySelector("#coloredCount .count-number");
  const summaryEl = document.getElementById("colorBreakdownSummary");
  const detailedEl = document.getElementById("colorBreakdown");

  chrome.storage.local.get("wordColors", (data) => {
    wordColors = data.wordColors || {};
    countEl && (countEl.textContent = Object.keys(wordColors).length);

    const colorGroups = {};
    Object.entries(wordColors).forEach(([word, color]) => {
      const normalizedColor = color.toLowerCase();
      if (!colorGroups[normalizedColor]) colorGroups[normalizedColor] = [];
      colorGroups[normalizedColor].push(word);
    });

    // Fixed display order for colors
    const colorOrder = [
      "",        // Word of the day
      "#096fab",
      "#ffaa33",       // Learning
      "#ffff00",       // Familiar
      "#66ccff",      // Names
      "#c060ff",       // Particles
      "#ff66cc",       // Function words
      "red",           // Unfamiliar
      "#228b22"       // Known
      
      
    ];

    // --- Summary ---
    if (summaryEl) {
      summaryEl.innerHTML = "";
      for (const color of colorOrder) {
        const words = colorGroups[color];
        if (!words) continue;

        const definition = colorDefinitions[color] || color;
        const item = document.createElement('div');
        item.className = 'color-summary-item';

        const dot = document.createElement('span');
        dot.className = 'color-summary-dot';
        dot.style.backgroundColor = color;

        const text = document.createElement('span');
        text.textContent = `${definition}: ${words.length}`;
        text.style.color = color;

        item.appendChild(dot);
        item.appendChild(text);
        summaryEl.appendChild(item);
      }
    }

    // --- Detailed ---
    if (detailedEl) {
      detailedEl.innerHTML = "";
      const groupedContainer = document.createElement('div');

      for (const color of colorOrder) {
        const words = colorGroups[color];
        if (!words) continue;

        const definition = colorDefinitions[color] || color;
        const filteredWords = words.filter(w => w.toLowerCase().includes(searchQuery));
        if (filteredWords.length > 0) {
          const title = document.createElement('div');
          title.textContent = `${definition} words:`;
          title.style.color = color;
          title.style.fontWeight = '600';
          groupedContainer.appendChild(title);

          const wrapper = document.createElement('div');
          wrapper.className = 'words-wrapper';
          filteredWords.forEach(word => {
            const span = document.createElement('span');
            span.textContent = word;
            span.style.color = color;
            span.className = 'clickable-word';
            span.addEventListener('click', () => showWordActionPopup(word, color));
            wrapper.appendChild(span);
          });
          groupedContainer.appendChild(wrapper);
        }
      }
      detailedEl.appendChild(groupedContainer);
    }
  });
}

// === Word action popup ===
function showWordActionPopup(word, currentColor) {
  const popup = document.getElementById('wordActionPopup');
  popup.style.zoom = "150%"; // default zoom
  if (!popup) return;

  document.getElementById('selectedWord').textContent = word;
  const container = document.getElementById('colorButtonsContainer');
  container.innerHTML = "";

  // remove previous dynamic elements
  popup.querySelectorAll('.lemma-input, .form-list, .add-form-btn, .new-form-input, .show-forms-btn').forEach(el => el.remove());

  const originalWordText = word;

  // === Lemma input ===
  const lemmaInput = document.createElement('textarea');
  lemmaInput.type = 'text';
  lemmaInput.placeholder = 'Loading lemma...';
  lemmaInput.className = 'lemma-input';
  Object.assign(lemmaInput.style, {
    width: '100%',
    marginBottom: '8px',
    padding: '6px 10px',
    borderRadius: '5px',
    border: '1px solid #d0d0d0'
  });
  popup.insertBefore(lemmaInput, container);

  ['keydown','keyup','keypress'].forEach(ev =>
    lemmaInput.addEventListener(ev, e => e.stopPropagation())
  );

  waitForIrregularWords().then(() => {
    const lemma = irregularWords[originalWordText] || originalWordText;
    lemmaInput.value = lemma;
    lemmaInput.placeholder = 'Lemma...';
    showFormsList(lemma); // show forms immediately
  });

  // Debounced lemma auto-save using the helper
  let saveTimeout = null;
  lemmaInput.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      const cleanedLemma = cleanWord(lemmaInput.value);
      if (!cleanedLemma) return;

      const result = await saveIrregularWordToServer(originalWordText, cleanedLemma);
      if (result.success) {
        const body = result.body || {};
        const savedOriginal = body.originalWord || originalWordText;
        const savedLemma = body.lemma || cleanedLemma;
        irregularWords[savedOriginal] = savedLemma;
        showFormsList(savedLemma);
        updateUI();
        console.log('Lemma saved (server):', savedOriginal, '→', savedLemma);
      } else {
        console.error('Failed saving lemma:', result);
        irregularWords[originalWordText] = cleanedLemma;
        showFormsList(cleanedLemma);
        updateUI();
      }
    }, 500);
  });

  // === Add new form button + input (robust save) ===
  const addFormBtn = document.createElement('button');
  addFormBtn.textContent = "+ Add New Form";
  addFormBtn.className = "add-form-btn";
  Object.assign(addFormBtn.style, {
    display: 'block',
    marginBottom: '8px',
    background: '#28a745',
    color: 'white',
    padding: '6px 10px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer'
  });

  const newFormInput = document.createElement('input');
  newFormInput.type = 'text';
  newFormInput.placeholder = 'Enter new form...';
  newFormInput.className = "new-form-input";
  Object.assign(newFormInput.style, {
    display: 'none',
    width: '100%',
    marginBottom: '8px',
    padding: '6px 10px',
    borderRadius: '5px',
    border: '1px solid #ccc'
  });

  popup.insertBefore(addFormBtn, container);
  popup.insertBefore(newFormInput, container);

  async function submitNewForm() {
    const newFormRaw = newFormInput.value;
    const newForm = cleanWord(newFormRaw);
    const lemma = cleanWord(lemmaInput.value);

    if (!newForm) return alert("Enter a valid form (non-empty).");
    if (!lemma) return alert("Enter a valid lemma first.");

    if (irregularWords[newForm]) {
        return alert(`"${newForm}" already exists mapped to "${irregularWords[newForm]}".`);
    }

    const result = await saveIrregularWordToServer(newForm, lemma);
    if (result.success) {
        irregularWords[newForm] = lemma;
        newFormInput.value = "";
        newFormInput.style.display = 'none';
        showFormsList(lemma);
        updateUI();
        console.log('Added new form:', newForm, '→', lemma);
    } else {
        console.error('Failed to add new form:', result);
        alert("Failed to save new form. See console for details.");
    }
  }

  addFormBtn.addEventListener('click', () => {
    if (newFormInput.style.display === 'none') {
      newFormInput.style.display = 'block';
      newFormInput.focus();
      return;
    }
    submitNewForm();
  });

  newFormInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitNewForm();
    } else if (e.key === 'Escape') {
      newFormInput.style.display = 'none';
    }
  });

  for (const [color, def] of Object.entries(colorDefinitions)) {
    const btn = document.createElement('button');
    btn.style.backgroundColor = color;
    btn.title = def;
    if (color.toLowerCase() === (currentColor || '').toLowerCase()) {
      btn.style.border = '2px solid #fff';
    }
    btn.addEventListener('click', () => {
      changeWordColor(word, color);
      popup.style.display = 'none';
    });
    container.appendChild(btn);
  }

  const removeBtn = document.getElementById('removeWordBtn');
  removeBtn && (removeBtn.onclick = () => {
    removeWord(word);
    popup.style.display = 'none';
  });

  const closeBtn = document.getElementById('closePopupBtn');
  closeBtn && (closeBtn.onclick = () => popup.style.display = 'none');

  popup.style.display = 'block';
}

// show forms list for a lemma
function showFormsList(lemma) {
  const popup = document.getElementById('wordActionPopup');
  if (!popup) return;

  popup.querySelectorAll('.form-list').forEach(el => el.remove());

  const forms = Object.entries(irregularWords)
    .filter(([form, base]) => base === lemma)
    .map(([form]) => form)
    .sort();

  const list = document.createElement('div');
  list.className = 'form-list';
  Object.assign(list.style, {
    background: '#555',
    padding: '8px',
    borderRadius: '5px',
    marginBottom: '8px',
    fontSize: '14px'
  });

  list.innerHTML = forms.length
    ? `<b>Forms of "${lemma}":</b> ${forms.join(', ')}`
    : `<i>No forms found for "${lemma}"</i>`;

  const colorButtons = document.getElementById('colorButtonsContainer');
  popup.insertBefore(list, colorButtons);
}

// === Change word color ===
function changeWordColor(word, newColor) {
  chrome.storage.local.get("wordColors", (data) => {
    const stored = data.wordColors || {};
    stored[word] = newColor;
    chrome.storage.local.set({ wordColors: stored }, () => {
      updateUI();
      sendWordColorsToServer(stored);
    });
  });
}

// === Remove word ===
function removeWord(word) {
  chrome.storage.local.get("wordColors", (data) => {
    const stored = data.wordColors || {};
    delete stored[word];
    chrome.storage.local.set({ wordColors: stored }, () => {
      updateUI();
      sendWordColorsToServer(stored);
    });
  });
}

// === Helper: clean word ===
function cleanWord(word) {
  return (word || "").trim().replace(/[.,!?;:'"()\[\]{}]/g, "").toLowerCase();
}

// === Close color+lemma popup when clicking outside ===
document.addEventListener('mousedown', (e) => {
  const popup = document.getElementById('wordActionPopup');
  if (!popup || popup.style.display === 'none' || popup.style.display === '') return;

  // don't close if the click happened inside the popup
  if (popup.contains(e.target)) return;

  // don't close if click is on a word that just opened it
  if (e.target.classList.contains('clickable-word')) return;

  popup.style.display = 'none';
});

// === DOMContentLoaded ===
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  searchInput && searchInput.addEventListener('input', updateUI);

  const exportBtn = document.getElementById('export');
  exportBtn && (exportBtn.onclick = () => {
    document.getElementById('importExportArea').value = JSON.stringify(wordColors, null, 2);
    navigator.clipboard.writeText(JSON.stringify(wordColors, null, 2)).catch(()=>{});
  });

  const importBtn = document.getElementById('import');
  importBtn && (importBtn.onclick = () => {
    try {
      const imported = JSON.parse(document.getElementById('importExportArea').value);
      if (typeof imported === 'object') {
        wordColors = imported;
        chrome.storage.local.set({ wordColors }, () => {
          updateUI();
          sendWordColorsToServer(wordColors);
        });
      }
    } catch (e) { console.error("Invalid JSON"); }
  });

  loadWordColorsFromServer();
});

// === Listen for runtime messages ===
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "colorChanged") updateUI();
});
