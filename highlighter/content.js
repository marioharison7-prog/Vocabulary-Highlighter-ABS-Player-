// ${path} => http(s)://example.com{localhost:0000}etc/${LANGUAGE}/php/getWordNotes.php
let LANGUAGE = "highlighter"
let path = "http://localhost"
let vocab = {};          // word: {definition, color, time}
let vocabColors = {};    // word => color
const styles = document.createElement("style");
styles.textContent = `
.vocab-word {
  text-decoration: underline;
  cursor: pointer;
  color: inherit;
  transition: all 0.3s ease-in-out; /* Smoother transitions */
  border-bottom: 2px solid transparent; /* Subtle bottom border for depth */
}
.vocab-word:hover {
  color: var(--hover-color, #8be9fd); /* Dynamic hover color, default to a vibrant blue */
  text-shadow: 0 0 8px rgba(139, 233, 253, 0.6); /* More pronounced glow */
  border-color: var(--hover-color-border, #8be9fd); /* Border animates on hover */
  transform: translateY(-2px); /* Slight lift effect */
}

/* Base for both tooltip and editor for consistency */
.vocab-tooltip, .vocab-editor {
  position: fixed;
  background: linear-gradient(145deg, #2a2a40, #1e1e2f); /* Deeper gradient */
  color: #000; /* Softer white text */
  padding: 15px 20px; /* More padding */
  border-radius: 12px; /* Slightly more rounded corners */
  max-width: 700px;
  font-size: 20px; /* Slightly smaller, more refined font size */
  box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05); /* Enhanced shadow with a subtle border glow */
  transition: opacity 0.3s ease-out, transform 0.3s ease-out; /* Smoother transitions */
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Modern font choice */
  z-index: 2147483647 !important;
  border: none; /* Remove default border */
  box-sizing: border-box; /* Ensure padding and border are included in the element's total width and height */
}

/* Tooltip specific styles */
.vocab-tooltip {
  pointer-events: none;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.vocab-tooltip.show {
  opacity: 1;
  transform: translateY(0);
}


/* Editor specific styles */
.vocab-editor {
  display: none;
  width: 700px;
  height: 427px;
  border: none;
  cursor: grab;
  padding: 20px; /* More generous padding */
  box-shadow: 0 12px 35px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08); /* Even stronger shadow for editor */
}
.vocab-editor:active {
  cursor: grabbing;
}

.vocab-editor textarea {
  width: 100%;
  height: 180px; /* Adjusted height for better balance with new padding */
  font-size: 18px; /* Consistent with tooltip */
  border: 1px solid #4a4a66; /* Softer border color */
  outline: none;
  resize: vertical;
  background: #1e1e2f; /* Darker input background */
  color: #e0e0e0;
  padding: 10px 12px; /* More padding in textarea */
  border-radius: 8px; /* Slightly more rounded */
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03); /* Deeper inset shadow */
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.vocab-editor textarea:focus {
  border-color: #4a90e2; /* Highlight on focus */
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.4), 0 0 0 1px #4a90e2;
}

.vocab-editor button {
  margin-top: 10px; /* More margin */
  padding: 10px 18px; /* Larger buttons */
  font-size: 16px; /* Larger font for buttons */
  cursor: pointer;
  border: none;
  border-radius: 8px; /* More rounded buttons */
  background: linear-gradient(135deg, #4a90e2, #357ab8); /* Vibrant blue gradient */
  color: #fff;
  transition: all 0.25s ease;
  letter-spacing: 0.5px; /* Spacing for readability */
  text-transform: uppercase; /* Make buttons stand out */
  font-weight: 600; /* Bolder text */
  box-shadow: 0 4px 10px rgba(0,0,0,0.3); /* Button shadow */
}
.vocab-editor button:hover {
  transform: translateY(-2px); /* Lift on hover */
  box-shadow: 0 6px 15px rgba(0,0,0,0.4);
  filter: brightness(1.15);
}
.vocab-editor button:active {
  transform: translateY(0); /* Press effect */
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

#deleteBtn {
  background: linear-gradient(135deg, #e25c5c, #b83535); /* Red gradient */
  color: #fff;
}

.color-btn {
  cursor: pointer;
  border: 2px solid transparent; /* Border for selected state */
  width: 32px; /* Slightly larger color buttons */
  height: 32px;
  margin-right: 8px; /* More space */
  border-radius: 50%;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}
.color-btn:hover {
  transform: scale(1.15); /* More pronounced scale */
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
}
.color-btn.selected {
  border-color: #fff; /* White border for selected */
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255,255,255,0.3); /* Glow for selected */
  outline: none; /* Remove default outline */
}

/* Flex container for color buttons and save/delete */
.vocab-editor > div:nth-of-type(1), /* Color selection row */
.vocab-editor > div:nth-of-type(2) { /* Save/Delete buttons row */
  display: flex;
  align-items: center;
  gap: 10px; /* More space between buttons */
  flex-wrap: wrap;
  margin-top: 15px; /* More space above these sections */
}

.vocab-editor > div:nth-of-type(1) span {

}

/* Keyframe for tooltip fade/slide in */
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
#irregularTextarea{
  color:steelblue;
  height:40px;
}
`;
document.head.appendChild(styles);

// ----------------- Tooltip & editor -----------------
const tooltip = document.createElement("div"); 
tooltip.className = "vocab-tooltip"; 
document.body.appendChild(tooltip);

const editor = document.createElement("div"); 
editor.className = "vocab-editor"; 
editor.style.display = "none"; 
editor.innerHTML = `
  <textarea placeholder="Enter definition..."></textarea><br>
  <label for="irregularTextarea" style="color:steelblue;">Irregular Forms</label>
<textarea id="irregularTextarea" placeholder="e.g., go → went → gone"></textarea>
  <div style="margin:6px 0; display:flex; align-items:center; gap:6px; flex-wrap: wrap;">
    <button class="color-btn" data-color="#FF0000" style="background:#FF0000;"></button>
    <button class="color-btn" data-color="#096fab" style="background:#096fab;"></button>
    <button class="color-btn" data-color="green" style="background:green;"></button>
    <button class="color-btn" data-color="orange" style="background:orange;"></button>
    <button class="color-btn" data-color="yellow" style="background:yellow;"></button>
  </div>
<div style="display: flex; gap: 6px;">
  <button id="saveBtn" style="margin-left: 20px;">Save</button>
  <button id="deleteBtn">Delete</button>
</div>

`;
document.body.appendChild(editor);

// ----------------- Helper functions -----------------
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showTooltip(target, text) {
  const rect = target.getBoundingClientRect();
  tooltip.innerHTML = text;
  tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
  tooltip.style.left = `${rect.left + window.scrollX}px`;

  // Reset animation to allow retriggering
  tooltip.classList.remove("show");
  void tooltip.offsetWidth; // Force reflow to restart animation

  tooltip.classList.add("show");

  // Hide tooltip after 3 seconds
  clearTimeout(tooltip.hideTimeout);
  tooltip.hideTimeout = setTimeout(() => {
    tooltip.classList.remove("show");
  }, 60000);
}
// Hide tooltip if you click anywhere outside vocab words
document.addEventListener("click", e => {
  if (!e.target.closest(".vocab-word") && !tooltip.contains(e.target)) {
    tooltip.classList.remove("show");
  }
});


function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result) return "#ffffff";
  return "#" + result.slice(0,3).map(x => parseInt(x).toString(16).padStart(2,'0')).join('');
}
function applyColorsToExistingWords(word = null) {
  const spans = word 
    ? document.querySelectorAll(`.vocab-word[data-word="${word.toLowerCase()}"]`)
    : document.querySelectorAll('.vocab-word');

  spans.forEach(span => {
    const key = span.getAttribute('data-word').toLowerCase();
    if (vocabColors[key]) {
      span.style.color = vocabColors[key];
    }
  });
}

// ----------------- Show Editor -----------------
// ----------------- Show Editor -----------------
async function showEditor(target, word) {
  const rect = target.getBoundingClientRect();
  const editorHeight = 400;
  const editorWidth = 700;
  const spacing = 5;

  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  let top = rect.bottom + spacing;

  if (top + editorHeight > viewportHeight) {
    let topAbove = rect.top - editorHeight - spacing;
    top = topAbove > 0 ? topAbove : viewportHeight - editorHeight - spacing;
  }

  let left = rect.left;
  if (left + editorWidth > viewportWidth) left = viewportWidth - editorWidth - spacing;
  if (left < 0) left = spacing;

  editor.style.top = top + "px";
  editor.style.left = left + "px";
  editor.style.position = "fixed";
  editor.style.display = "block";
  ['keydown','keyup','keypress'].forEach(ev => editor.addEventListener(ev, e => e.stopPropagation()));

  const textarea = editor.querySelector("textarea");
  const irregularTextarea = editor.querySelector("#irregularTextarea");
  const colorBtns = editor.querySelectorAll(".color-btn");

  const currentData = vocab[word.toLowerCase()] || { definition: "", color: "#ffffff" };
  textarea.value = currentData.definition && currentData.definition !== "undefined" ? currentData.definition : "";

  // Load irregular forms
  let irregularData = {};
  try {
    const response = await fetch(`${path}/${LANGUAGE}/php/getIrregularWords.php`);
    irregularData = await response.json();
  } catch(err) { console.error("Failed to load irregular words:", err); }

  irregularTextarea.value = irregularData[word.toLowerCase()] || "";

  // Color button selection
  colorBtns.forEach(btn => {
    btn.style.outline = btn.dataset.color.toLowerCase() === currentData.color.toLowerCase() ? "2px solid #fff" : "none";
    btn.classList.toggle("selected", btn.dataset.color.toLowerCase() === currentData.color.toLowerCase());
    btn.addEventListener("click", () => {
      colorBtns.forEach(b => { b.style.outline = "none"; b.classList.remove("selected"); });
      btn.style.outline = "2px solid #fff";
      btn.classList.add("selected");
    });
  });

  textarea.focus();

  // Save button
  const saveBtn = editor.querySelector("#saveBtn");
  saveBtn.replaceWith(saveBtn.cloneNode(true));
  const newSaveBtn = editor.querySelector("#saveBtn");

  newSaveBtn.addEventListener("click", async () => {
    const newDef = textarea.value.trim();
    const newColor = Array.from(colorBtns).find(b => b.classList.contains("selected"))?.dataset.color || "#ffffff";
    const newIrregular = irregularTextarea.value.trim();
    const key = word.toLowerCase();

    if (newDef !== "") {
      vocab[key] = { definition: newDef, color: newColor, time: new Date().toISOString() };

      try {
        await fetch(`${path}/${LANGUAGE}/php/saveWord.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word, definition: newDef, color: newColor })
        });
      } catch(err) { console.error("Save vocab failed:", err); }

      // Save irregular word
      if (newIrregular) {
        try {
          await fetch(`${path}/${LANGUAGE}/php/saveIrregularWord.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ originalWord: word, lemma: newIrregular })
          });
        } catch(err) { console.error("Save irregular failed:", err); }
      }

      showTooltip(target, `${word}: ${newDef}`);

      // Update underline without changing text color
      underlineVocabWords(document.body);
    }

    editor.style.display = "none";
  });

// Delete button
const deleteBtn = editor.querySelector("#deleteBtn");
deleteBtn.replaceWith(deleteBtn.cloneNode(true));
const newDeleteBtn = editor.querySelector("#deleteBtn");

newDeleteBtn.addEventListener("click", async () => {
  const lowerWord = word.toLowerCase();

  // 1️⃣ Remove word from vocab + colors
  delete vocab[lowerWord];
  delete vocabColors[lowerWord];

  // 2️⃣ Remove underline style from all spans for this word
  document.querySelectorAll(`span.vocab-word[data-word="${lowerWord}"]`).forEach(span => {
    span.style.textDecoration = "none";
    span.style.textDecorationColor = "inherit";
    span.classList.remove("vocab-word");
    delete span.dataset.word;
  });

  // 3️⃣ Sync backend
  try {
    await fetch(`${path}/${LANGUAGE}/php/deleteWord.php`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word })
    });
  } catch (err) {
    console.error("Delete failed:", err);
  }

  // 4️⃣ Hide editor popup
  editor.style.display = "none";
});
}



// ----------------- Underline words -----------------
// ----------------- Underline words (optimized + reactive) -----------------


// ----------------- Underline logic -----------------
function underlineVocabWords(parentNode) {
  if (!parentNode || !(parentNode instanceof Node)) return;

  const unallowedSelectors = [
    '.main_content_wrapper show-left clearfix',
    '.bg-gray-xxlight', '.para-play', '.popup',
    '.word-counts-popup.modern-popup', '.srp', '.modal', '.tooltip', '#someUnallowedDiv',
    '.bookmark-btn', '.vocab-editor', '.vocab-modal-overlay', 'word-counts-popup modern-popup',
    ".ytp-caption-segment",".able-controller","transcriptPanel"
  ];

  const walker = document.createTreeWalker(
    parentNode,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  const BATCH_SIZE = 100;
  let index = 0;

  function processBatch() {
    const end = Math.min(index + BATCH_SIZE, nodes.length);

    for (; index < end; index++) {
      const node = nodes[index];
      if (!node.parentNode || !(node.parentNode instanceof Element)) continue;

      // Skip unwanted nodes
      if (node.parentNode.closest(".vocab-word")) continue;
      if (unallowedSelectors.some(sel => node.parentNode.closest(sel))) continue;
      if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(node.parentNode.tagName)) continue;

      let combinedText = "";
      let nodeList = [];
      let current = node;

      while (current && (
        current.nodeType === Node.TEXT_NODE ||
        (current.nodeType === Node.ELEMENT_NODE &&
         current.tagName === 'SPAN' &&
         !current.classList.contains('vocab-word'))
      )) {
        combinedText += current.textContent;
        nodeList.push(current);
        current = current.nextSibling;
      }

      if (!combinedText) continue;

      const fragment = document.createDocumentFragment();
      const text = combinedText;
      const matches = [];

      Object.keys(vocab).forEach(word => {
        const regex = /\s/.test(word)
          ? new RegExp(`(${escapeRegex(word)})`, "gi")
          : new RegExp(`\\b(${escapeRegex(word)})\\b`, "gi");

        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({ start: match.index, end: regex.lastIndex, word: match[0], lower: word.toLowerCase() });
          if (regex.lastIndex === match.index) regex.lastIndex++;
        }
      });

      matches.sort((a, b) => a.start - b.start);

      let cursor = 0;
      matches.forEach(m => {
        if (m.start > cursor) {
          const span = document.createElement('span');
          span.textContent = text.slice(cursor, m.start);
          fragment.appendChild(span);
        }
        const span = document.createElement('span');
        span.className = 'vocab-word';
        span.dataset.word = m.lower;
        span.style.textDecoration = 'underline';
        span.style.textDecorationColor = vocab[m.lower]?.color || 'red';
        if (vocab[m.lower]?.lemma) {
          span.title = `Base form: ${vocab[m.lower].lemma}`;
        }
        span.textContent = text.slice(m.start, m.end);
        fragment.appendChild(span);
        cursor = m.end;
      });

      if (cursor < text.length) {
        const span = document.createElement('span');
        span.textContent = text.slice(cursor);
        fragment.appendChild(span);
      }

      nodeList[0].parentNode.insertBefore(fragment, nodeList[0]);
      nodeList.forEach(n => n.parentNode.removeChild(n));
    }

    if (index < nodes.length) {
      if ('requestIdleCallback' in window) requestIdleCallback(processBatch);
      else setTimeout(processBatch, 20);
    }
  }

  processBatch();
}

// ----------------- Reactive vocab (auto-update underline) -----------------
function makeVocabReactive(obj) {
  return new Proxy(obj, {
    set(target, prop, value) {
      target[prop] = value;
      scheduleUnderlineUpdate(); // reactively update
      return true;
    }
  });
}

vocab = makeVocabReactive(vocab);

// ----------------- Dynamic underline updater -----------------
let underlineUpdateScheduled = false;

function scheduleUnderlineUpdate() {
  if (underlineUpdateScheduled) return;
  underlineUpdateScheduled = true;

  requestAnimationFrame(() => {
    document.querySelectorAll('span.vocab-word').forEach(span => {
      const word = span.dataset.word;
      const vocabData = vocab[word];
      if (!vocabData) return;

      const color = vocabData.color || 'red';
      const style = vocabData.underlineStyle || 'underline';
      const newDecoration = `${style} ${color}`;

      if (span.style.textDecoration !== newDecoration) {
        span.style.textDecoration = newDecoration;
      }
    });
    underlineUpdateScheduled = false;
  });
}

// ----------------- Load vocab -----------------
async function loadVocab() {
  try {
    const res = await fetch(`${path}/${LANGUAGE}/php/getWords.php`);
    const data = await res.json();

    vocab = makeVocabReactive({});
    vocabColors = {};

    for (let word in data) {
      vocab[word.toLowerCase()] = data[word];
      vocabColors[word.toLowerCase()] = data[word].color || 'inherit';
    }

    if (document.body) underlineVocabWords(document.body);
    startObserver();
  } catch (err) {
    console.error("Error fetching vocab:", err);
  }
}

// ----------------- MutationObserver (throttled) -----------------
let observerTimeout;
let observers;

function startObserver() {
  if (observers) return;

  observers = new MutationObserver(mutations => {
    const nodesToProcess = [];
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (!node) return;
        nodesToProcess.push(node);
      });
    });

    if (observerTimeout) clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
      nodesToProcess.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.parentNode) underlineVocabWords(node.parentNode);
        else if (node.nodeType === Node.ELEMENT_NODE) underlineVocabWords(node);
      });
    }, 50);
  });

  observers.observe(document.body, { childList: true, subtree: true });
}

// ----------------- Helper -----------------
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// ----------------- Right-click handler for editor -----------------
document.addEventListener("contextmenu", (e) => {
  const target = e.target.closest(".vocab-word");
  if (!target) return;

  e.preventDefault(); // Prevent default context menu

  const word = target.getAttribute("data-word");
  const key = word.toLowerCase();

  // Right-click opens editor
  showEditor(target, key);
});


// ----------------- ALT click → tooltip -----------------
document.addEventListener("click", (e) => {
  const target = e.target.closest(".vocab-word");
  if (!target) return;

  const word = target.getAttribute("data-word");
  const key = word.toLowerCase();

  // ALT only → show tooltip
  if (e.altKey) { 
    const def = vocab[key]?.definition;
    if (def && def !== "undefined"){
      showTooltip(target, `${word}: ${def}`);
    } else {
      showTooltip(target, `${word}: (no definition yet)`);
    }
  }
});


// ----------------- Click outside editor to close -----------------
document.addEventListener("click", e => {
  if(!editor.contains(e.target) && !e.target.closest(".vocab-word")) {
    editor.style.display = "none";
  }
});


// ----------------- Listen to background messages -----------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if(msg.type === "RELOAD_VOCAB"){ 
    loadVocab(); 
    sendResponse({ success:true }); 
  }
  if(msg.type === "UPDATE_COLORS"){ 
    vocabColors = msg.wordColors; 
    underlineVocabWords(document.body); 
    sendResponse({ success:true }); 
  }
});

// ----------------- Initialize -----------------
if(document.readyState === "loading"){ 
  document.addEventListener("DOMContentLoaded", loadVocab); 
}else{ 
  loadVocab(); 
}

// ----------------- Make Editor Draggable -----------------
function makeDraggable(el) {
  let offsetX = 0, offsetY = 0, isDown = false;

  // Mouse events
  el.addEventListener("mousedown", e => {
    if (e.target.tagName === "TEXTAREA") return;
    isDown = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    el.style.cursor = "move";
    el.style.zIndex = 10000;
  });

  document.addEventListener("mousemove", e => {
    if (!isDown) return;
    el.style.left = (e.clientX - offsetX) + "px";
    el.style.top = (e.clientY - offsetY) + "px";
  });

  document.addEventListener("mouseup", () => {
    isDown = false;
    el.style.cursor = "grab";
  });

  // Touch events
  el.addEventListener("touchstart", e => {
    if (e.target.tagName === "TEXTAREA") return;
    isDown = true;
    const touch = e.touches[0];
    offsetX = touch.clientX - el.offsetLeft;
    offsetY = touch.clientY - el.offsetTop;
    el.style.zIndex = 10000;
  });

  document.addEventListener("touchmove", e => {
    if (!isDown) return;
    const touch = e.touches[0];
    el.style.left = (touch.clientX - offsetX) + "px";
    el.style.top = (touch.clientY - offsetY) + "px";
    e.preventDefault(); // Prevent scrolling while dragging
  }, { passive: false });

  document.addEventListener("touchend", () => {
    isDown = false;
  });
}

makeDraggable(editor);



// the sencondd----------------------------------------------------------------------------------------------

// === Allowed sites list ===
const allowedSites = [
  'https://www.languagereactor.com/',
  '',
  ''
];

// === Constants for Color Picker Styling and Behavior ===
const Z_INDEX_MAX = 2147483647 ;
const PICKER_SPACING_FROM_WORD = 4;
const PICKER_MAX_WIDTH_PX = 280;
const PICKER_COLOR_BOX_SIZE_PX = 28;
const PICKER_BORDER_THICKNESS_PX = 1;
const PICKER_PADDING_PX = 12;
const PICKER_TRANSITION_DURATION_MS = 50;

function isAllowedSite(url) {
  return allowedSites.some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(url);
  });
}

// Storage and observer setup
let wordColors = {};
let wordNotes = {};
const processedNodes = new WeakSet();

// MutationObserver
const observer = new MutationObserver((mutations) => {
  observer.disconnect();
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (processedNodes.has(node)) continue;

      if (node.nodeType === Node.TEXT_NODE && isSubtitleNode(node)) {
        wrapWords(node);
        processedNodes.add(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        handleElementNode(node);
      }
    }
  }
  observer.observe(document.body, { childList: true, subtree: true });
});

// Process existing text nodes at load
function processExistingTextNodes() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (processedNodes.has(node)) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && (node.parentNode.tagName === 'SCRIPT' || node.parentNode.tagName === 'STYLE')) {
          return NodeFilter.FILTER_REJECT;
        }
        return isSubtitleNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  let cur;
  while ((cur = walker.nextNode())) {
    wrapWords(cur);
  }
}
// Load colors and notes from PHP backend only
async function loadWordColorsAndNotes() {
  try {
    const res = await fetch(`${path}/${LANGUAGE}/php/getWordColors.php`);
    const colorsData = await res.json();
    wordColors = colorsData || {};
  } catch (err) {
    console.error("❌ Failed to load word colors from PHP:", err);
    wordColors = {};
  }

  try {
    const resNotes = await fetch(`${path}/${LANGUAGE}/php/getWordNotes.php`);
    const notesData = await resNotes.json();
    wordNotes = notesData || {};
  } catch (err) {
    console.error("❌ Failed to load word notes from PHP:", err);
    wordNotes = {};
  }

  processExistingTextNodes();
  observer.observe(document.body, { childList: true, subtree: true });
}

// Call the loader
loadWordColorsAndNotes();


// Handle element nodes
function handleElementNode(node) {
  const targetTagNames = ['P', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'A'];
  const elements = node.querySelectorAll(targetTagNames.map(tag => tag.toLowerCase()).join(', '));
  const toProcess = [];

  if (targetTagNames.includes(node.tagName)) {
    toProcess.push(node);
  }
  toProcess.push(...elements);

  toProcess.forEach(el => {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
    el.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim() && !processedNodes.has(child)) {
        wrapWords(child);
        processedNodes.add(child);
      }
    });
  });
}

// Determine if node is a subtitle
function isSubtitleNode(node) {
  if (isAllowedSite(window.location.href)) return true;

  return node.parentNode && node.parentNode.closest && (
    node.parentNode.closest('.caption-window') ||
    node.parentNode.closest('[data-testid="subtitle"]') ||
    node.parentNode.closest('[data-token-index]') || // matches any number
    node.parentNode.closest('.ytp-caption-segment')
  );
}


// Color definitions
const colors = {
  blue: "#096fab",
  red: "red",
  green: "#228b22",
  orange: "#ffaa33",
  yellow: "#FFFF00",
  pink: "#ff66cc",
  purple: "#c060ff",
  blueSky: "#66ccff",
  none: "" 
};

function createColorPicker(span, rawWord) {
  // Remove existing picker if any
  const existing = document.querySelector('.color-picker-popup');
  if (existing) existing.remove();

  const picker = document.createElement('div');
  picker.className = 'color-picker-popup';
  Object.assign(picker.style, {
    position: 'fixed',
    zIndex: Z_INDEX_MAX,
    visibility: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '8px',
    color: 'black',
    background: '#222',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: `top ${PICKER_TRANSITION_DURATION_MS}ms ease, left ${PICKER_TRANSITION_DURATION_MS}ms ease`
  });
  document.body.appendChild(picker);

  // Auto-close variables
  let isHovering = false;
  let isTyping = false;
  let closeTimeout = null;

  const scheduleClose = () => {
    clearTimeout(closeTimeout);
    closeTimeout = setTimeout(() => {
      if (!isHovering && !isTyping && (!noteInput || !noteInput.value.trim())) {
        picker.remove();
      }
    }, 1000);
  };

  picker.addEventListener('mouseenter', () => {
    isHovering = true;
    clearTimeout(closeTimeout);
  });
  picker.addEventListener('mouseleave', () => {
    isHovering = false;
    scheduleClose();
  });
  // 🖱 Close picker when clicking outside
function handleOutsideClick(e) {
  if (!picker.contains(e.target)) {
    picker.remove();
    document.removeEventListener('mousedown', handleOutsideClick);
  }
}

// ✅ Delay listener to avoid triggering from the click that opened the picker
setTimeout(() => {
  document.addEventListener('mousedown', handleOutsideClick);
}, 0);

  // Close button
  const btnClose = document.createElement('button');
  btnClose.textContent = '×';
  Object.assign(btnClose.style, {
    position: 'absolute',
    top: '-1px',
    right: '-1px',
    border: 'none',
    background: 'transparent',
    fontSize: '18px',
    cursor: 'pointer',
    lineHeight: '0.5',
    fontWeight: '300',
    color: '#999'
  });
  btnClose.title = 'Close Color Picker';
  btnClose.addEventListener('click', e => {
    e.stopPropagation();
    picker.remove();
  });
  picker.appendChild(btnClose);

  // Color options container
  const colorsContainer = document.createElement('div');
  colorsContainer.className = 'color-options-container';
  Object.assign(colorsContainer.style, {
    display: 'flex',
    flexWrap: 'wrap',
    marginBottom: '8px'
  });
  picker.appendChild(colorsContainer);

  for (const [name, color] of Object.entries(colors)) {
    const box = document.createElement('div');
    box.className = 'color-box';
    Object.assign(box.style, {
      backgroundColor: color || 'transparent',
      width: '24px',
      height: '24px',
      margin: '2px',
      cursor: 'pointer',
      boxShadow: '0 0 4px rgba(0,0,0,0.2)'
    });
    box.title = name === 'blueSky' ? 'Sky Blue' : name === 'none' ? 'None' : name.charAt(0).toUpperCase() + name.slice(1);

    box.addEventListener('click', e => {
      e.stopPropagation();

      let lemmaValue = cleanWord(rawWord);
      if (irregularWords[lemmaValue]) lemmaValue = irregularWords[lemmaValue];

      if (color) wordColors[lemmaValue] = color;
      else delete wordColors[lemmaValue];

      document.querySelectorAll(`span[data-word="${lemmaValue}"]`).forEach(s => {
        s.style.color = color || '';
      });

      fetch(`${path}/${LANGUAGE}/php/saveWordColor.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: lemmaValue, color })
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        })
        .then(data => console.log("✅ Color saved:", data))
        .catch(err => console.error("❌ Failed to save color:", err));

      picker.remove();
    });

    colorsContainer.appendChild(box);
  }

  // Note input
  const noteInput = document.createElement('textarea');
  noteInput.placeholder = 'Add a note...';
  noteInput.rows = 3;
  noteInput.className = 'note-input';

  // ✅ Use note from span if available, fallback to word
  noteInput.value = span.dataset.note || rawWord;

  Object.assign(noteInput.style, {
    width: '100%',
    marginBottom: '8px'
  });
  picker.appendChild(noteInput);

  // ✅ Update all spans with notes from wordNotes (once per picker open)
  document.querySelectorAll('span[data-word]').forEach(s => {
    const word = s.dataset.word;
    const note = wordNotes[word];
    if (note) {
      s.dataset.note = note;
      s.title = note;
    } else {
      delete s.dataset.note;
      s.removeAttribute('title');
    }
  });

  ['keydown', 'keyup', 'keypress'].forEach(ev =>
    noteInput.addEventListener(ev, e => e.stopPropagation())
  );

  noteInput.addEventListener('focus', () => {
    isTyping = true;
    clearTimeout(closeTimeout);
  });
  noteInput.addEventListener('blur', () => {
    isTyping = false;
    scheduleClose();
  });

  let noteSaveTimeout = null;
  noteInput.addEventListener('input', () => {
    clearTimeout(noteSaveTimeout);
    const newNote = noteInput.value.trim();

    // 🔄 Update all matching spans immediately
    document.querySelectorAll(`span[data-word="${rawWord}"]`).forEach(s => {
      s.dataset.note = newNote;
      s.title = newNote;
    });

    // 💾 Save to backend after debounce
    noteSaveTimeout = setTimeout(() => {
      fetch(`${path}/${LANGUAGE}/php/saveWordNote.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: rawWord, note: newNote })
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log("✅ Note saved:", data);
          wordNotes[rawWord] = newNote; // ✅ Update local cache
        })
        .catch(err => console.error("❌ Failed to save note:", err));
    }, 500);
  });

  scheduleClose();


// --- Helper function to clean words ---
function cleanWord(word) {
    if (!word) return "";
    word = word.toLowerCase().trim();
    // Keep letters (including accented), numbers, and spaces only
    // Keep letters (including accented), numbers, spaces, apostrophes, and dashes only
    word = word.replace(/[^a-zA-Z0-9À-ÿ '\-]/g, "").toLowerCase();

    // Normalize multiple spaces to single space
    word = word.replace(/\s+/g, " ");
    return word.trim();
}

// Lemma input setup
const lemmaInput = document.createElement('textarea');
lemmaInput.type = 'text';
lemmaInput.placeholder = 'Loading lemma...'; // show temporary loading
lemmaInput.className = 'lemma-input';
lemmaInput.style.width = '100%';
lemmaInput.style.marginBottom = '8px';
lemmaInput.style.padding = '6px 10px';
lemmaInput.style.borderRadius = '5px';
lemmaInput.style.border = '1px solid #d0d0d0';
picker.appendChild(lemmaInput);

// Prevent propagation of key events
['keydown','keyup','keypress'].forEach(ev => lemmaInput.addEventListener(ev, e => e.stopPropagation()));

const originalWordText = cleanWord(span.textContent);

// Fetch existing lemma from PHP
fetch(`${path}/${LANGUAGE}/php/getIrregularWords.php`)
    .then(res => res.json())
    .then(data => {
        const lemma = data[originalWordText] || originalWordText;
        lemmaInput.value = lemma;
        lemmaInput.placeholder = 'Lemma...'; // remove loading
    })
    .catch(err => {
        console.error("❌ Failed to fetch lemma:", err);
        lemmaInput.value = originalWordText; // fallback
        lemmaInput.placeholder = 'Lemma...';
    });

// Debounced auto-save when user edits
// Debounced auto-save when user edits
let saveTimeout = null;

function onUserEdit() {
  // Clear any previous pending save
  clearTimeout(saveTimeout);

  // Set a new 3-second timer
  saveTimeout = setTimeout(() => {
    autoSave();
  }, 3000); // 3000 ms = 3 seconds
}

function autoSave() {
  console.log("Auto-saving...");
  // 🔹 Your save logic here (e.g., send data to server)
}


lemmaInput.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        const cleanedLemma = cleanWord(lemmaInput.value);
        if (!cleanedLemma) return;

        // Save lemma to backend
        fetch(`${path}/${LANGUAGE}/php/saveIrregularWord.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                originalWord: originalWordText,
                lemma: cleanedLemma
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log(`✅ Lemma saved: ${data.originalWord} → ${data.lemma}`);

                // 🔹 Update the span's dataset
                span.dataset.word = cleanedLemma;

                // 🔹 Transfer old color if exists
                if (wordColors[originalWordText]) {
                    wordColors[cleanedLemma] = wordColors[originalWordText];
                    delete wordColors[originalWordText];
                }

                // 🔹 Re-apply color using the new lemma key
                const newColor = wordColors[cleanedLemma] || '';
                span.style.color = newColor;

                // 🔹 Update the picker immediately (optional)
                const colorBoxes = picker.querySelectorAll('.color-box');
                colorBoxes.forEach(box => {
                    if (box.style.backgroundColor === newColor) {
                        box.classList.add('selected');
                    } else {
                        box.classList.remove('selected');
                    }
                });
            }
        })
        .catch(err => console.error("❌ Failed to save lemma:", err));
    }, 500);
});



    // Delete note button
    if (wordNotes[cleanWord]) {
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete Note';
        Object.assign(delBtn.style, { border: '1px solid #c00', backgroundColor: '#fdd', color: '#c00', marginBottom: '4px' });
        delBtn.addEventListener('click', e => {
            e.stopPropagation();
            delete wordNotes[cleanWord];
            span.removeAttribute('title');
            span.style.textDecoration = '';
            span.style.textDecorationColor = '';
            chrome.storage.local.set({ wordNotes });
            picker.remove();
        });
        picker.appendChild(delBtn);
    }

let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
let animationFrameScheduled = false;

// Mouse support
picker.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  if (!['BUTTON', 'TEXTAREA'].includes(e.target.tagName) && !e.target.classList.contains('color-box')) {
    isDragging = true;
    dragOffsetX = e.clientX - picker.getBoundingClientRect().left;
    dragOffsetY = e.clientY - picker.getBoundingClientRect().top;
    picker.style.cursor = 'grabbing';
    clearTimeout(closeTimeout);
    e.stopPropagation();
  }
});

window.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    animationFrameScheduled = false;
    picker.style.cursor = 'grab';
    scheduleClose();
  }
});

window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  if (!animationFrameScheduled) {
    animationFrameScheduled = true;
    requestAnimationFrame(() => {
      let newLeft = e.clientX - dragOffsetX;
      let newTop = e.clientY - dragOffsetY;
      newLeft = Math.min(Math.max(0, newLeft), window.innerWidth - picker.offsetWidth);
      newTop = Math.min(Math.max(0, newTop), window.innerHeight - picker.offsetHeight);
      picker.style.left = newLeft + 'px';
      picker.style.top = newTop + 'px';
      animationFrameScheduled = false;
    });
  }
});

// Touch support
picker.addEventListener('touchstart', e => {
  if (e.touches.length !== 1) return;
  const touch = e.touches[0];
  if (!['BUTTON', 'TEXTAREA'].includes(touch.target.tagName) && !touch.target.classList.contains('color-box')) {
    isDragging = true;
    const rect = picker.getBoundingClientRect();
    dragOffsetX = touch.clientX - rect.left;
    dragOffsetY = touch.clientY - rect.top;
    clearTimeout(closeTimeout);
    e.stopPropagation();
  }
}, { passive: false });

window.addEventListener('touchend', () => {
  if (isDragging) {
    isDragging = false;
    animationFrameScheduled = false;
    scheduleClose();
  }
});

window.addEventListener('touchmove', e => {
  if (!isDragging || e.touches.length !== 1) return;
  const touch = e.touches[0];
  if (!animationFrameScheduled) {
    animationFrameScheduled = true;
    requestAnimationFrame(() => {
      let newLeft = touch.clientX - dragOffsetX;
      let newTop = touch.clientY - dragOffsetY;
      newLeft = Math.min(Math.max(0, newLeft), window.innerWidth - picker.offsetWidth);
      newTop = Math.min(Math.max(0, newTop), window.innerHeight - picker.offsetHeight);
      picker.style.left = newLeft + 'px';
      picker.style.top = newTop + 'px';
      animationFrameScheduled = false;
    });
  }
  e.preventDefault(); // Prevent scrolling while dragging
}, { passive: false });
    // **Position picker reliably using viewport coordinates**
    requestAnimationFrame(() => {
        const rect = span.getBoundingClientRect();
        const pickerHeight = picker.offsetHeight;
        const pickerWidth = picker.offsetWidth;

        let top = rect.bottom + PICKER_SPACING_FROM_WORD; // viewport coordinates
        if (top + pickerHeight > window.innerHeight) {
            top = rect.top - pickerHeight - PICKER_SPACING_FROM_WORD;
        }

        let left = rect.left;
        left = Math.min(Math.max(0, left), window.innerWidth - pickerWidth);

        picker.style.top = `${top}px`;
        picker.style.left = `${left}px`;
        picker.style.visibility = 'visible';
    });

    scheduleClose();
}
// === Load irregular words dynamically from PHP ===
let irregularWords = {};
let irregularWordsReady = false;

fetch(`${path}/${LANGUAGE}/php/getIrregularWords.php`) // replace with your actual URL
  .then(res => res.json())
  .then(data => {
    irregularWords = data;
    irregularWordsReady = true;
    console.log("✅ Irregular words loaded:", Object.keys(irregularWords).length);
  })
  .catch(err => console.error("❌ Failed to load irregular words:", err));

// Helper: wait until irregular words are ready
async function waitForIrregularWords() {
  while (!irregularWordsReady) {
    await new Promise(r => setTimeout(r, 50));
  }
}


// Wrap words in a text node
function wrapWords(node) {
  if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;

  const wordsAndSpaces = node.textContent.split(/(\s+)/);
  const frag = document.createDocumentFragment();

  wordsAndSpaces.forEach(segment => {
    if (!segment.trim()) {
      frag.appendChild(document.createTextNode(segment));
      return;
    }

    // Clean and stem the word
    let cleanWord = segment.replace(/[^a-zA-ZÀ-ž\u0600-\u06FF]/g, '').toLowerCase();

    // First check irregular dictionary (loaded from irregularWords.js)
    if (irregularWords[cleanWord]) {
      cleanWord = irregularWords[cleanWord];
    } else {
      // Apply suffix rules
      if (cleanWord.endsWith('q') && cleanWord.length > 1) {
      cleanWord = cleanWord.slice(0, -1);
      }
    }

    const span = document.createElement('span');
    span.textContent = segment;
    span.dataset.word = cleanWord;

    if (wordColors[cleanWord]) span.style.color = wordColors[cleanWord];
    if (wordNotes[cleanWord]) {
      span.title = wordNotes[cleanWord];
      span.style.textDecoration = 'none';
      span.style.textDecorationColor = wordColors[cleanWord] || 'black';
    }

span.addEventListener('mousedown', e => {
  if (e.button === 4 || (e.ctrlKey && e.altKey)) {
    e.preventDefault();
    createColorPicker(span, cleanWord);
  }
});

let lastTapTime = 0;

span.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;

    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      e.preventDefault();
      createColorPicker(span, cleanWord);
      lastTapTime = 0; // Reset
    } else {
      lastTapTime = currentTime;
    }
  }
});
    frag.appendChild(span);
  });

  node.parentNode.replaceChild(frag, node);
}



// Add CSS
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');

  body { font-family: 'Open Sans', sans-serif; color: #333; line-height: 1.6; }

  span { cursor: pointer; transition: color 0.2s ease-in-out, text-decoration-color 0.2s ease-in-out; position: relative; }

  .color-picker-popup { max-width: ${PICKER_MAX_WIDTH_PX}px; background-color: #ffffff !important; font-family: 'Roboto', sans-serif; font-size: 13px; border: ${PICKER_BORDER_THICKNESS_PX}px solid #e0e0e0; padding: ${PICKER_PADDING_PX}px; display: flex; flex-direction: column; gap: 10px; border-radius: 8px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); align-items: stretch; cursor: grab; transform: translateY(-5px); animation: fadeIn 0.15s ease-out forwards; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

  .color-picker-popup button, .color-picker-popup textarea, .color-picker-popup input { font-family: 'Roboto', sans-serif; font-size: 13px; box-sizing: border-box; }

  .color-picker-popup .close-button { position: absolute; top: 8px; right: 10px; border: none; background: transparent; font-size: 22px; cursor: pointer; line-height: 1; font-weight: 300; color: #999; transition: color 0.2s ease, transform 0.2s ease; width: auto; }
  .color-picker-popup .close-button:hover { color: #333; transform: rotate(90deg); }

  .color-options-container { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 15px; justify-content: center; padding: 5px 0; border-bottom: 1px solid #eee; padding-bottom: 15px; }

  .color-picker-popup .color-box { width: ${PICKER_COLOR_BOX_SIZE_PX}px; height: ${PICKER_COLOR_BOX_SIZE_PX}px; cursor: pointer; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; position: relative; border-color:darkgray; }
  .color-picker-popup .color-box.none-color { background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0); background-size: 8px 8px; background-position: 0 0, 4px 4px; border-color: #ddd!important; }
  .color-picker-popup .color-box:hover { transform: scale(1.15); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); border-color: #cccccc; }

  .color-picker-popup textarea.note-input { resize: vertical; width: 100%; margin-top: 12px; border: 1px solid #d0d0d0; padding: 8px 10px; border-radius: 5px; font-size: 13px; line-height: 1.5; min-height: 70px; background-color: #fcfcfc; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
  .color-picker-popup textarea.note-input:focus { outline: none; border-color: #8c8c8c; box-shadow: 0 0 0 2px rgba(140, 140, 140, 0.2); }

  .color-picker-popup input.lemma-input { font-size: 13px; line-height: 1.4; }

  .color-picker-popup button { margin-top: 8px; padding: 8px 15px; cursor: pointer; border: none; border-radius: 5px; background-color: #f0f0f0; color: #555; font-weight: 500; transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease; width: 100%; }
  .color-picker-popup button:hover { background-color: #e0e0e0; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); }
  .color-picker-popup button:active { transform: translateY(0); box-shadow: none; }
  .color-picker-popup button:last-of-type:not(.close-button) { background-color: #4CAF50; color: white; }
  .color-picker-popup button:last-of-type:not(.close-button):hover { background-color: #45a049; }
  .color-picker-popup button[style*="border: 1px solid #c00"] { background-color: #f44336; color: white; border: none !important; margin-top: 5px; }
  .color-picker-popup button[style*="border: 1px solid #c00"]:hover { background-color: #e53935; }

  .color-picker-popup, .color-picker-popup *, .color-picker-popup button { z-index: 2147483647  !important; }

  .word-counts-popup { max-width: 300px; background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 12px; font-family: Roboto, sans-serif; font-size: 13px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); position: fixed; top: 50px; right: 50px; z-index: 2147483647 ; max-height: 70vh; overflow-y: auto; }
  .word-counts-popup button {  border: none; background: transparent; font-size: 18px; cursor: pointer; }
`;
document.head.appendChild(style);

// === Dynamic update from PHP backend ===
async function updateWordColorsAndNotesFromPHP() {
    try {
        // Fetch colors
        const resColors = await fetch(`${path}/${LANGUAGE}/php/getWordColors.php`);
        const colorsData = await resColors.json();
        window.wordColors = colorsData || {};

        // Fetch notes
        const resNotes = await fetch(`${path}/${LANGUAGE}/php/getWordNotes.php`);
        const notesData = await resNotes.json();
        window.wordNotes = notesData || {};

        // Apply colors and notes to existing spans
        document.querySelectorAll('span[data-word]').forEach(span => {
            const word = span.dataset.word;

            // Apply color
            if (wordColors[word]) {
                span.style.color = wordColors[word];
            } else {
                span.style.color = '';
            }

            // Apply note
            if (wordNotes[word]) {
                span.title = wordNotes[word];
                span.style.textDecoration = 'underline';
                span.style.textDecorationColor = wordColors[word] || 'black';
            } else {
                span.removeAttribute('title');
                span.style.textDecoration = '';
                span.style.textDecorationColor = '';
            }
        });

        console.log("✅ Colors and notes updated from PHP");
    } catch (err) {
        console.error("❌ Failed to update colors and notes from PHP:", err);
    }
}


// === COLOR LABELS ===
const colorLabels = {
    red: "XunknownX:",
    green: "XKnownX:",     // #228B22
    orange: "XRéviewX:",
    yellow: "XFamiliarX:",
    pink: "XFunction wordsX:",
    purple: "XparticlesX:",
    blueSky: "XnamesX:",
    phrase: "XphraseX:",
    phrasal_1: "XphrasalX:",
    phrasal_2:"Xphrasal_2X:",
    new_sentence:"Xnew_sentenceX:",
    known_phrasal:"Xknown_phrasalX:",
    todays_word : "XwordXofXtheXday",
    none: ""
};

function getColorLabel(color) {
    switch(color) {
        case "red": return colorLabels.red;
        case "#228B22":return colorLabels.green
        case "rgb(255, 0, 0)": return colorLabels.phrase;
        case "rgb(34, 139, 34)": return colorLabels.green;
        case "green":return colorLabels.known_phrasal;
        case "yellow":return colorLabels.phrasal_1;
        case "orange":return colorLabels.phrasal_2;
        case "inherit":return colorLabels.new_sentence;
        case "#ffaa33":
        case "#096fab":return colorLabels.todays_word;
        case "rgb(9, 111, 171)":return colorLabels.todays_word;
        case "rgb(255, 170, 51)": return colorLabels.orange;
        case "#FFFF00":
        case "rgb(255, 255, 0)": return colorLabels.yellow;
        case "#ff66cc":
        case "rgb(255, 102, 204)": return colorLabels.pink;
        case "#c060ff":
        case "rgb(192, 96, 255)": return colorLabels.purple;
        case "#66ccff":
        case "rgb(102, 204, 255)": return colorLabels.blueSky;
        case "transparent": return colorLabels.none;
        case "#FFFFFF": return colorLabels.none;
        case "rgb(255, 255, 255)": return colorLabels.none;
        default: return color; 
    }
}

// === CLEAN WORD FOR COUNTING / STEMMING ===
function cleanForCount(word) {
    let w = word.toLowerCase();

    // 1. Check irregular dictionary first
    if (irregularWords && irregularWords[w]) return irregularWords[w];

    // 2. English stemming / normalization rules
    else if (w.endsWith('q') && w.length > 1) w = w.slice(0, -1);

    return w;
}
// === REVERSE FUNCTION: FROM LEMMA TO POSSIBLE SURFACE FORMS ===
function expandFromLemma(lemma) {
  const forms = [lemma]; // always include lemma itself

  // Include original irregular forms
  for (const [orig, base] of Object.entries(irregularWords)) {
    if (base === lemma) forms.push(orig);
  }

  // English plural / stemming variations
  if (lemma.endsWith('s') && lemma.length > 1) forms.push(lemma.slice(0, -1));          // "cats" → "cat"

  // generic plural
  forms.push(lemma + 's');

  // remove duplicates
  return [...new Set(forms)];
}

// === COUNTS ===
function getUniqueWordCountsByColorStemmed() {
    const counts = {};
    const subtitleCounts = {};
    const countedWordsGlobal = {};
    const countedWordsSubtitle = {};

    document.querySelectorAll('span[data-word]').forEach(span => {
        const color = span.style.color || 'none';
        const word = cleanForCount(span.dataset.word);

        if (!countedWordsGlobal[color]) countedWordsGlobal[color] = new Set();
        if (!countedWordsGlobal[color].has(word)) {
            countedWordsGlobal[color].add(word);
            counts[color] = (counts[color] || 0) + 1;
        }

        if (span.parentNode.closest('.asbplayer-offscreen','.v-main','.col-xs-12')) {
            if (!countedWordsSubtitle[color]) countedWordsSubtitle[color] = new Set();
            if (!countedWordsSubtitle[color].has(word)) {
                countedWordsSubtitle[color].add(word);
                subtitleCounts[color] = (subtitleCounts[color] || 0) + 1;
            }
        }
    });

    return { counts, subtitleCounts };
}

// === WORDS LIST FOR CURRENT PAGE ONLY ===
function getWordsByColorCurrentPage() {
    const wordsByColor = {};
    const hasSubText = document.querySelector('.asbplayer-offscreen','.v-main','.col-xs-12') !== null;

    document.querySelectorAll('span[data-word]').forEach(span => {
        // always ignore spans inside the word-counts popup
        if (span.closest('.word-counts-popup')) return;

        // if .asbplayer-subtitles exists, only gather words inside it
        if (hasSubText && !span.closest('.asbplayer-offscreen','.v-main','.col-xs-12')) return;

        // normalize color and word to lowercase
        const color = (span.style.color || 'none').toLowerCase();
        const word = cleanForCount(span.dataset.word).toLowerCase();

        // create set for each color
        if (!wordsByColor[color]) wordsByColor[color] = new Set();
        wordsByColor[color].add(word);
    });

    // convert sets to arrays
    for (const c in wordsByColor) {
        wordsByColor[c] = Array.from(wordsByColor[c]);
    }

    return wordsByColor;
}


// === SHOW SENTENCES POPUP ===
function showSentencesPopup(lemma) {
    const existing = document.querySelector('.sentences-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.className = 'sentences-popup';
    popup.style.position = 'fixed';
    popup.style.top = '100px';
    popup.style.right = '50px';
    popup.style.maxWidth = '1000px';
    popup.style.background = '#222';
    popup.style.color = '#fff';
    popup.style.padding = '12px';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 8px 25px rgba(0,0,0,0.5)';
    popup.style.zIndex = '2147483646';
    popup.style.maxHeight = '70vh';
    popup.style.overflowY = 'auto';
    popup.style.fontSize = '26px';

    const btnClose = document.createElement('button');
    btnClose.textContent = '×';
    btnClose.style.position = 'absolute';
    btnClose.style.top = '5px';
    btnClose.style.right = '8px';
    btnClose.style.border = 'none';
    btnClose.style.background = 'transparent';
    btnClose.style.color = '#fff';
    btnClose.style.fontSize = '50px';
    btnClose.style.cursor = 'pointer';
    btnClose.addEventListener('click', () => popup.remove());
    popup.appendChild(btnClose);

    const title = document.createElement('div');
    title.textContent = `Sentences containing: "${lemma}"`;
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    popup.appendChild(title);

    // === Gather full sentence blocks for all forms of the lemma and highlight them ===
    const forms = expandFromLemma(lemma); // get all surface forms
    const sentences = [];

    document.querySelectorAll('span[data-word]').forEach(span => {
        // skip spans inside the word-counts popup
        if (span.closest('.word-counts-popup')) return;

        const original = span.dataset.word.toLowerCase();
        if (forms.includes(original)) {
            const parentText = span.parentNode.textContent.trim();
            parentText.split('.').forEach(s => {
                const lowerS = s.toLowerCase();
                if (forms.some(f => lowerS.includes(f))) {
                    let highlighted = s;
                    // highlight all forms in the sentence
                    forms.forEach(f => {
                        const re = new RegExp(`\\b(${f})\\b`, 'gi');
                        highlighted = highlighted.replace(re, '<mark style="background:#000; color:#fff;">$1</mark>');

                    });
                    const sentence = highlighted.trim() + '.';
                    if (!sentences.includes(sentence)) sentences.push(sentence);
                }
            });
        }
    });

    if (sentences.length === 0) {
        const noneDiv = document.createElement('div');
        noneDiv.textContent = 'No sentences found.';
        popup.appendChild(noneDiv);
    } else {
        sentences.forEach((s, i) => {
            const sDiv = document.createElement('div');
            sDiv.innerHTML = `Sentence ${i + 1}: ${s}`; // use innerHTML to render <mark>
            sDiv.style.marginBottom = '8px';
            sDiv.style.lineHeight = '1.4';
            popup.appendChild(sDiv);
        });
    }

    document.body.appendChild(popup);
}



// === POPUP ===
function showWordCountsPopupStemmed() {
    // Remove existing popup
    const existing = document.querySelector('.word-counts-popup');
    if (existing) return existing.remove();

    const { counts, subtitleCounts } = getUniqueWordCountsByColorStemmed();

    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'word-counts-popup modern-popup';
    popup.style.zIndex = '2147483645';
    popup.style.position = 'fixed';
    popup.style.top = '80px';
    popup.style.right = '50px';
    popup.style.background = '#222';
    popup.style.color = '#fff';
    popup.style.padding = '12px';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 8px 25px rgba(0,0,0,0.5)';
    popup.style.maxHeight = '70vh';
    popup.style.overflowY = 'auto';
    popup.style.fontSize = '20px';

    // Close button
    const btnClose = document.createElement('button');
    btnClose.className = 'popup-close-btn';
    btnClose.textContent = '×';
    btnClose.style.fontSize = '30px';
    btnClose.style.position = 'absolute';
    btnClose.style.top = '5px';
    btnClose.style.right = '8px';
    btnClose.style.border = 'none';
    btnClose.style.background = 'transparent';
    btnClose.style.color = '#fff';
    btnClose.style.cursor = 'pointer';
    btnClose.addEventListener('click', () => popup.remove());
    popup.appendChild(btnClose);

    // Define full order of labels
    const labelOrder = ["rgb(9, 111, 171)","none","inherit","rgb(255, 0, 0)","yellow","orange","green", "red","rgb(255, 255, 0)","rgb(255, 170, 51)", "rgb(192, 96, 255)","rgb(255, 102, 204)","rgb(102, 204, 255)","rgb(34, 139, 34)"];

    // Helper to add sections
    const addSection = (title, obj) => {
        const section = document.createElement('div');
        section.className = 'popup-section';
        section.style.marginBottom = '12px';
        section.style.fontSize='20px'

        const header = document.createElement('h3');
        header.textContent = title;
        section.appendChild(header);

        // Inside showWordCountsPopupStemmed(), replace the <ul> creation with this:
        const list = document.createElement('div'); // use div instead of ul
        list.className = 'popup-list';
        list.style.display = 'flex';
        list.style.flexWrap = 'wrap';
        list.style.gap = '8px'; // spacing between items



        for (const color of labelOrder) {
            const count = obj[color] || 0;
            const item = document.createElement('li');
            item.textContent = `${getColorLabel(color)}: ${count}`;
            item.style.color = color && color !== 'none' ? color : '#fff';
            list.appendChild(item);
        }

        section.appendChild(list);
        popup.appendChild(section);
    };

    addSection('All Unique Words:', counts);
    addSection('Unique Subtitle Words:', subtitleCounts);

    // Show Words button
    const btnShowWords = document.createElement('button');
    btnShowWords.textContent = 'Show Words';
    btnShowWords.className = 'popup-show-words-btn';
    btnShowWords.style.marginTop = '12px';
    popup.appendChild(btnShowWords);

    btnShowWords.addEventListener('click', () => {
        const wordsByColor = getWordsByColorCurrentPage();
        const listContainer = document.createElement('div');
        listContainer.className = 'popup-words-container';
        listContainer.style.marginTop = '10px';

        // Copy None Words button
        const btnCopyNone = document.createElement('button');
        btnCopyNone.textContent = 'Copy None Words';
        btnCopyNone.style.background = '#4CAF50';
        btnCopyNone.style.color = 'white';
        btnCopyNone.style.marginBottom = '12px';
        btnCopyNone.addEventListener('click', () => {
            const noneWords = wordsByColor['none'] || [];
            if (noneWords.length === 0) {
                alert('No "none" words found!');
                return;
            }
            navigator.clipboard.writeText(noneWords.join('\n')).then(() => {
                alert('✅ "None" words copied to clipboard!');
            }).catch(err => {
                alert('❌ Failed to copy words: ' + err);
            });
        });
        listContainer.appendChild(btnCopyNone);

        // Render words by color in order
        for (const color of labelOrder) {
            const words = wordsByColor[color] || [];
            if (words.length === 0) continue;

            const groupTitle = document.createElement('h4');
            groupTitle.textContent = getColorLabel(color);
            groupTitle.style.color = color && color !== 'none' ? color : '#fff';
            listContainer.appendChild(groupTitle);

            const wordLine = document.createElement('div');
            wordLine.className = 'popup-word-line';
            wordLine.style.marginBottom = '6px';
            wordLine.style.display = 'flex';
            wordLine.style.flexWrap = 'wrap';
            wordLine.style.gap = '8px';

            words.forEach(w => {
                const wSpan = document.createElement('span');
                wSpan.textContent = w;
                wSpan.className = 'popup-word';
                wSpan.style.color = color && color !== 'none' ? color : '#fff';
                wSpan.style.cursor = 'pointer';
                wSpan.addEventListener('click', () => showSentencesPopup(w));
                wordLine.appendChild(wSpan);
            });

            listContainer.appendChild(wordLine);
        }

        popup.appendChild(listContainer);
        btnShowWords.remove();
    });

    document.body.appendChild(popup);
}




// === HOTKEY: Ctrl + Shift ===
window.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && !e.altKey) {
        e.preventDefault();
        showWordCountsPopupStemmed();
    }
});
let touchStartPoints = 0;

window.addEventListener('touchstart', e => {
  touchStartPoints = e.touches.length;

  // Check for exactly three fingers
  if (touchStartPoints === 3) {
    e.preventDefault(); // Prevent default behavior like zoom

    // Optional: add a short delay to confirm it's a tap, not a gesture
    setTimeout(() => {
      showWordCountsPopupStemmed();
    }, 100); // 100ms delay to avoid accidental triggers
  }
});

window.addEventListener('touchend', () => {
  touchStartPoints = 0;
});

// === HOTKEY: Mouse Button 4 (Back button) ===
window.addEventListener('mousedown', e => {
    if (e.button === 3) { // Mouse 3
        // Note: this will trigger your function, but browser may still go back
        showWordCountsPopupStemmed();
    }
});




// === STYLE ===
const styleWordCountPopup = document.createElement('style');
styleWordCountPopup.textContent = `
.word-counts-popup.modern-popup {
    position: fixed;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    width: 2500px;
    max-width: 95vw;
    overflow-x: auto;
    background: #1e1e1e;
    color: #fff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    font-family: 'Segoe UI', sans-serif;
    z-index: 2147483645 !important ;
}
/*.asbplayer-subtitles,
.asbplayer-fullscreen-subtitles {
    color: #ffffff;
    font-size: 36px;
    padding: 8px 12px; /* a bit more breathing space */
    text-align: center !important;
    background-color: #333; /* semi-transparent black for smoother look */
    
    /* Smooth text */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    
    /* Make it easier to select */
    user-select: text !important;
    cursor: text !important;

    line-height: 1.3 !important; /* slightly larger line height for readability */
    white-space: pre-wrap !important;

    /* Optional: subtle shadow for better contrast */
    text-shadow: 0 0 4px rgba(0,0,0,0.7);

    border-radius: 4px; /* soft edges */
    display: inline-block; /* helps background-radius */
}*/

.popup-close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 28px;
    color: #fff;
    cursor: pointer;
}

.popup-section h3 {
    margin: 10px 0 5px;
    font-size: 18px;
    border-bottom: 1px solid #444;
    padding-bottom: 3px;
}

.popup-list {
    list-style: none;
    padding-left: 10px;
    background: #2a2a2a;
    border-radius: 40px;
    font-size: 28px;
    display: flex;         /* make list horizontal */
    flex-wrap: nowrap;     /* prevent wrapping to next line */
    gap: 12px;             /* space between items */
    overflow-x: auto;      /* allow horizontal scrolling if too wide */
    white-space: nowrap;   /* prevent line breaks inside items */
}


.popup-show-words-btn {
    display: block;
    width: 100%;
    padding: 8px 0;
    margin-top: 10px;
    color: #555;
    margin-right: 800px;
    max-width: 200px;
    text-align: center;
    background: #fc921aff;
    border: none;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.3s;
}

.popup-show-words-btn:hover {
    background: #b9ac83ff;
}

.popup-words-container h4 {
    margin: 10px 0 5px;
    font-size: 25px;
    border-bottom: 1px solid #444;
    padding-bottom: 3px;
}

.popup-word-line {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 34px;
    margin-bottom: 8px;
}


.popup-word {
    cursor: pointer;
    font-size: 28px;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background 0.2s;
}

.popup-word:hover {
    background: rgba(255, 255, 255, 0.1);
}

}

`;
document.head.appendChild(styleWordCountPopup);
// List of sites where dark mode should NOT run
const blockedSites = [
  'google.com',
  'youtube.com',
  'cineby.app'

];

// Check if the current site is blocked
const currentHost = window.location.hostname;
const isBlocked = blockedSites.some(site => currentHost.includes(site));

// Always apply white text color
document.body.style.color = 'white';

// Apply white text color to all paragraphs
const allParagraphs = document.querySelectorAll('p');
allParagraphs.forEach(p => {
  p.style.color = 'white';
});

// Apply background color ONLY on allowed sites
if (!isBlocked) {
  document.body.style.setProperty('background-color', '#121212', 'important'); 
  //exercise-block class box_shadow_yt_iframe seg-block
  // Select #container OR .entry-content (whichever exists)
  const mainContainer =
    document.getElementById('container','wrapper','exercise-block') ||
    document.querySelector('.fc0','.ws0','.gb-block-layout-column-inner','.seg-block','.box_shadow_yt_iframe seg-block','.section','.paragraph current-marker');

  if (mainContainer) {
    mainContainer.style.setProperty('background-color', '#121212', 'important');
    mainContainer.style.color = 'white';
  }

  console.log('Dark mode applied (background + text)');
} else {
  console.log('Blocked site: text is white, background unchanged');

}
//--------------------------------------------------------------------
// Listen for mouseup to detect text selection
// Function to create and position the icon
// Function to create and position the icon
function createSendIcon(selection) {
  // Remove existing icon if present
  const existing = document.querySelector("#sendToServerIcon");
  if (existing) {
    if (existing.cleanupScrollListeners) existing.cleanupScrollListeners();
    if (existing.autoRemoveTimeout) clearTimeout(existing.autoRemoveTimeout);
    existing.remove();
  }

  const range = window.getSelection().getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Calculate adjusted position
  let adjustedX = rect.right + window.scrollX;
  let adjustedY = rect.top + window.scrollY - 40; // above selection

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Ensure icon stays within viewport bounds
  if (adjustedX + 50 > viewportWidth + window.scrollX) adjustedX = viewportWidth + window.scrollX - 50;
  if (adjustedX < window.scrollX) adjustedX = window.scrollX + 10;
  if (adjustedY < window.scrollY) adjustedY = rect.bottom + window.scrollY + 20;
  if (adjustedY + 50 > viewportHeight + window.scrollY) adjustedY = viewportHeight + window.scrollY - 50;

  // Create icon
  const icon = document.createElement("div");
  icon.id = "sendToServerIcon";
  icon.title = "Send to server";
  icon.setAttribute('aria-label', 'Send to server');
  icon.style.cssText = `
    position: absolute;
    top: ${adjustedY}px;
    left: ${adjustedX}px;
    font-size: 24px;
    background: #4a90e2;
    color: white;
    padding: 24px 24px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    pointer-events: auto;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    min-width: 40px;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transform: translateZ(0);
    transition: opacity 0.3s, top 0.1s, left 0.1s;
  `;
  const iconstyle = document.createElement("style");
  iconstyle.textContent = `
    #sendToServerIcon::before {
      content: "📤";
      display: block;
      font-size: 24px;
      line-height: 1;
      pointer-events: none;
    }
  `;
  document.head.appendChild(iconstyle);
  // Handle both click and touch events
  const handleIconClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: "triggerPopup", word: selection });
    icon.remove();
  };

  icon.addEventListener('pointerup', handleIconClick);
  document.body.appendChild(icon);

  // Update position on scroll with requestAnimationFrame
  let ticking = false;
  const updatePositionOnScroll = () => {
    if (!document.contains(icon)) return;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        const newRect = window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).getBoundingClientRect() : rect;
        let newX = newRect.right + window.scrollX;
        let newY = newRect.top + window.scrollY - 40;

        if (newX + 50 > viewportWidth + window.scrollX) newX = viewportWidth + window.scrollX - 50;
        if (newX < window.scrollX) newX = window.scrollX + 10;
        if (newY < window.scrollY) newY = newRect.bottom + window.scrollY + 20;
        if (newY + 50 > viewportHeight + window.scrollY) newY = viewportHeight + window.scrollY - 50;

        icon.style.top = `${newY}px`;
        icon.style.left = `${newX}px`;

        // Hide if too far from original selection
        const distance = Math.abs(newY - adjustedY);
        if (distance > 300) icon.remove();

        ticking = false;
      });
    }
  };

  // Scrollable containers
  const scrollableContainers = findScrollableContainers(document.body);
  scrollableContainers.push(window); // add window to scrollables

  scrollableContainers.forEach(container => {
    container.addEventListener('scroll', updatePositionOnScroll, { passive: true });
  });

  // Store cleanup function
  icon.cleanupScrollListeners = () => {
    scrollableContainers.forEach(container => container.removeEventListener('scroll', updatePositionOnScroll));
  };

  // Auto-remove after 10s with fade-out
  icon.autoRemoveTimeout = setTimeout(() => {
    icon.style.opacity = '0';
    setTimeout(() => {
      if (document.contains(icon)) {
        icon.cleanupScrollListeners();
        icon.remove();
      }
    }, 300);
  }, 10000);
}

// Function to find all scrollable containers
function findScrollableContainers(element) {
  const scrollableContainers = [];
  let current = element;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const isScrollable = ['auto','scroll'].includes(style.overflow) || ['auto','scroll'].includes(style.overflowY) || ['auto','scroll'].includes(style.overflowX);
    if (isScrollable && current.scrollHeight > current.clientHeight) scrollableContainers.push(current);
    current = current.parentElement;
  }
  return scrollableContainers;
}

// Function to handle text selection
function handleTextSelection() {
  const selection = window.getSelection().toString().trim();
  if (!selection) {
    const existing = document.querySelector("#sendToServerIcon");
    if (existing) {
      if (existing.cleanupScrollListeners) existing.cleanupScrollListeners();
      if (existing.autoRemoveTimeout) clearTimeout(existing.autoRemoveTimeout);
      existing.remove();
    }
    return;
  }

  setTimeout(() => {
    const currentSelection = window.getSelection().toString().trim();
    if (currentSelection) createSendIcon(currentSelection);
  }, 100);
}

// Debounce utility
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedSelectionHandler = debounce(handleTextSelection, 150);

// Event listeners
document.addEventListener('mouseup', debouncedSelectionHandler);
document.addEventListener('touchend', debouncedSelectionHandler);
document.addEventListener('selectionchange', debouncedSelectionHandler);

document.addEventListener('contextmenu', e => {
  if (e.target.id === 'sendToServerIcon') e.preventDefault();
});

document.addEventListener('touchstart', e => {
  if (e.target.id !== 'sendToServerIcon') {
    const existing = document.querySelector("#sendToServerIcon");
    if (existing) {
      if (existing.cleanupScrollListeners) existing.cleanupScrollListeners();
      if (existing.autoRemoveTimeout) clearTimeout(existing.autoRemoveTimeout);
      existing.remove();
    }
  }
});

document.addEventListener('mousedown', e => {
  if (e.target.id !== 'sendToServerIcon') {
    const existing = document.querySelector("#sendToServerIcon");
    if (existing) {
      if (existing.cleanupScrollListeners) existing.cleanupScrollListeners();
      if (existing.autoRemoveTimeout) clearTimeout(existing.autoRemoveTimeout);
      existing.remove();
    }
  }
});

window.addEventListener('beforeunload', () => {
  const existing = document.querySelector("#sendToServerIcon");
  if (existing) {
    if (existing.cleanupScrollListeners) existing.cleanupScrollListeners();
    if (existing.autoRemoveTimeout) clearTimeout(existing.autoRemoveTimeout);
    existing.remove();
  }
});
