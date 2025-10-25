let LANGUAGE = "highlighter"
let path = "http://localhost"
const colorDefinitions = {
  "#096fab":"word of the day", 
  "":"remove",
  "white":"remove",
  "black":"remove",
  "#ffaa33": "Learning",
  "#ffff00": "Familiar",
  "#66ccff": "Names", 
  "#c060ff": "Particles",
  "#ff66cc": "Function words",
  "#228b22": "Known",
  "red": "Unfamiliar",
  
};

// === Send wordColors to PHP server ===
function sendWordColorsToServer(wordColors) {
  fetch(`${path}/${LANGUAGE}/php/backupWordColors.php`, { // replace with your server URL
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wordColors })
  })
  .then(res => res.json())
  .then(data => {
    console.log("wordColors backed up to server:", data);
  })
  .catch(err => {
    console.error("Failed to send wordColors to server:", err);
  });
}

// === Load wordColors from server (GET) ===
function loadWordColorsFromServer() {
  fetch(`${path}/${LANGUAGE}/php/getbackupWordColors.php`)
    .then(res => res.json())
    .then(data => {
      if (data.wordColors && typeof data.wordColors === "object") {
        chrome.storage.local.set({ wordColors: data.wordColors }, () => {
          updateColoredCount();
        });
      }
    })
    .catch(err => console.error("Failed to fetch wordColors from server:", err));
}

// === Update colored words count & breakdown with search ===
function updateColoredCount() {
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();
  chrome.storage.local.get("wordColors", (data) => {
    const wordColors = data.wordColors || {};
    const countEl = document.querySelector("#coloredCount .count-number");
    const breakdownEl = document.getElementById("colorBreakdown");

    // Total colored words
    countEl.textContent = Object.keys(wordColors).length;

    // Group words by color
    const colorGroups = {};
    Object.entries(wordColors).forEach(([word, color]) => {
      const normalizedColor = color.toLowerCase();
      if (!colorGroups[normalizedColor]) colorGroups[normalizedColor] = [];
      colorGroups[normalizedColor].push(word);
    });

    breakdownEl.innerHTML = '';
    const groupedWordsContainer = document.createElement('div');
    groupedWordsContainer.classList.add('grouped-words-container');

    // Sort colors: word of the day first, then others
    // Sort colors according to colorDefinitions order
const sortedColors = Object.keys(colorGroups).sort((a, b) => {
  const order = Object.keys(colorDefinitions).map(c => c.toLowerCase());
  const indexA = order.indexOf(a.toLowerCase());
  const indexB = order.indexOf(b.toLowerCase());
  return indexA - indexB;
});


    for (const color of sortedColors) {
      const words = colorGroups[color];
      const definition = colorDefinitions[color] || color;

      // Color summary
      const colorSummarySpan = document.createElement('span');
      colorSummarySpan.style.color = color;
      colorSummarySpan.style.fontWeight = '600';
      colorSummarySpan.style.fontSize = '0.9em';
      colorSummarySpan.textContent = `${definition} (${words.length})`;
      groupedWordsContainer.appendChild(colorSummarySpan);

      const colorDot = document.createElement('span');
      colorDot.classList.add('color-dot');
      colorDot.style.backgroundColor = color;
      groupedWordsContainer.appendChild(colorDot);

      // Filtered words
      let filteredWords = words.filter(word => word.toLowerCase().includes(searchQuery));

      // Make word of the day words appear first inside the group
      if (color.toLowerCase() === "#096fab") {
        filteredWords = filteredWords.sort((a, b) => 0); // keeps original order, already prioritized by color
      }

      if (filteredWords.length > 0) {
        const wordsWrapper = document.createElement('div');
        wordsWrapper.classList.add('words-wrapper');

        filteredWords.forEach(word => {
          const span = document.createElement('span');
          span.textContent = word;
          span.style.color = color;
          span.classList.add('clickable-word');
          span.addEventListener('click', () => showWordActionPopup(word, color));
          wordsWrapper.appendChild(span);
        });
        groupedWordsContainer.appendChild(wordsWrapper);
      }
    }

    breakdownEl.appendChild(groupedWordsContainer);
  });
}

// === Show popup for color change or removal ===
function showWordActionPopup(word, currentColor) {
  const popup = document.getElementById('wordActionPopup');
  document.getElementById('selectedWord').textContent = word;
  const colorButtonsContainer = document.getElementById('colorButtonsContainer');
  colorButtonsContainer.innerHTML = '';

  for (const [colorCode, definition] of Object.entries(colorDefinitions)) {
    const button = document.createElement('button');
    button.classList.add('color-button');
    button.style.backgroundColor = colorCode;
    if (colorCode.toLowerCase() === currentColor.toLowerCase()) {
      button.style.border = '2px solid #ecf0f1';
      button.style.boxShadow = `0 0 0 3px ${colorCode}`;
    }
    button.title = definition;
    button.addEventListener('click', () => {
      changeWordColor(word, colorCode);
      popup.style.display = 'none';
    });
    colorButtonsContainer.appendChild(button);
  }

  popup.style.display = 'block';
  document.getElementById('removeWordBtn').onclick = () => {
    removeWord(word);
    popup.style.display = 'none';
  };
  document.getElementById('closePopupBtn').onclick = () => popup.style.display = 'none';
}

// === Change word color ===
function changeWordColor(word, newColor) {
  chrome.storage.local.get("wordColors", (data) => {
    const wordColors = data.wordColors || {};
    wordColors[word] = newColor;
    chrome.storage.local.set({ wordColors }, () => {
      updateColoredCount();
      sendWordColorsToServer(wordColors);
    });
  });
}

// === Remove word ===
function removeWord(word) {
  chrome.storage.local.get("wordColors", (data) => {
    const wordColors = data.wordColors || {};
    delete wordColors[word];
    chrome.storage.local.set({ wordColors }, () => {
      updateColoredCount();
      sendWordColorsToServer(wordColors);
    });
  });
}

// === Export colors ===
document.getElementById("export").addEventListener("click", () => {
  chrome.storage.local.get("wordColors", (data) => {
    const jsonText = JSON.stringify(data.wordColors || {}, null, 2);
    document.getElementById("importExportArea").value = jsonText;
    navigator.clipboard.writeText(jsonText).catch(err => console.error(err));
  });
});

// === Import colors ===
document.getElementById("import").addEventListener("click", () => {
  try {
    const imported = JSON.parse(document.getElementById("importExportArea").value);
    if (typeof imported === "object") {
      chrome.storage.local.set({ wordColors: imported }, () => {
        updateColoredCount();
        sendWordColorsToServer(imported);
      });
    }
  } catch (e) { console.error("Invalid JSON", e); }
});

// === Initial load ===
document.addEventListener("DOMContentLoaded", () => {
  // First load from server
  loadWordColorsFromServer();
  // Then display UI
  updateColoredCount();
});

// === Live updates from content script ===
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "colorChanged") updateColoredCount();
});

// === Open Vocabulary Tab ===
document.getElementById('openTab').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("tab.html") });
});
// === Open Sentences Tab ===
document.getElementById('openSentencesTab').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("sentences.html") });
}); 

// === Search input listener ===
document.getElementById('searchInput').addEventListener('input', updateColoredCount);
