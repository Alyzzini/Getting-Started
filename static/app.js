const display = document.getElementById("output");
const keypad = document.querySelector(".calculator-keypad");
const historyToggle = document.getElementById("historyToggle");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

let expression = "";
let historyVisible = false;
let calculationHistory = [];

// Load history from localStorage
const loadHistory = () => {
  const stored = localStorage.getItem("calculatorHistory");
  if (stored) {
    calculationHistory = JSON.parse(stored);
  }
};

// Save history to localStorage
const saveHistory = () => {
  localStorage.setItem("calculatorHistory", JSON.stringify(calculationHistory));
};

// Add calculation to history
const addToHistory = (expression, result) => {
  const historyItem = {
    expression: expression,
    result: result,
    timestamp: new Date().toISOString(),
  };

  calculationHistory.unshift(historyItem); // Add to beginning

  // Keep only last 50 calculations
  if (calculationHistory.length > 50) {
    calculationHistory = calculationHistory.slice(0, 50);
  }

  saveHistory();
  renderHistory();
};

// Render history items
const renderHistory = () => {
  if (calculationHistory.length === 0) {
    historyList.innerHTML =
      '<div class="history-empty">No calculations yet</div>';
    return;
  }

  historyList.innerHTML = calculationHistory
    .map(
      (item, index) =>
        `<div class="history-item" data-index="${index}">
      <div class="history-expression">${item.expression}</div>
      <div class="history-result">${item.result}</div>
    </div>`,
    )
    .join("");
};

// Toggle history panel
const toggleHistory = () => {
  historyVisible = !historyVisible;
  historyPanel.style.display = historyVisible ? "flex" : "none";
  historyToggle.textContent = historyVisible ? "📖" : "📚";
};

// Clear history
const clearHistory = async () => {
  if (!confirm("Are you sure you want to clear all history?")) {
    return;
  }

  try {
    const response = await fetch("/api/history", { method: "DELETE" });
    if (response.ok) {
      calculationHistory = [];
      saveHistory();
      renderHistory();
    }
  } catch (error) {
    // Fallback: clear local history
    calculationHistory = [];
    saveHistory();
    renderHistory();
  }
};

const updateDisplay = () => {
  display.textContent = expression || "0";
};

const clearExpression = () => {
  expression = "";
  updateDisplay();
};

const backspace = () => {
  expression = expression.slice(0, -1);
  updateDisplay();
};

const calculate = async () => {
  if (!expression.trim()) {
    display.textContent = "0";
    return;
  }

  try {
    const response = await fetch("/api/calc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expression }),
    });

    const data = await response.json();
    if (!response.ok) {
      display.textContent = "Error";
      return;
    }

    // Add to history
    addToHistory(expression, data.result);

    expression = String(data.result);
    updateDisplay();
  } catch (error) {
    display.textContent = "Offline";
  }
};

// Initialize
loadHistory();
renderHistory();
historyPanel.style.display = "none";

// Event listeners
historyToggle.addEventListener("click", toggleHistory);
clearHistoryBtn.addEventListener("click", clearHistory);

// History item click handler
historyList.addEventListener("click", (event) => {
  const historyItem = event.target.closest(".history-item");
  if (historyItem) {
    const index = parseInt(historyItem.dataset.index);
    const item = calculationHistory[index];
    expression = item.expression;
    updateDisplay();
  }
});

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const value = button.dataset.value;
  const action = button.dataset.action;

  if (action === "clear") {
    clearExpression();
    return;
  }

  if (action === "back") {
    backspace();
    return;
  }

  if (action === "equals") {
    calculate();
    return;
  }

  if (value) {
    expression += value;
    updateDisplay();
  }
});

window.addEventListener("keydown", (event) => {
  const allowed = "0123456789+-*/().";
  if (allowed.includes(event.key)) {
    expression += event.key;
    updateDisplay();
    return;
  }

  if (event.key === "Backspace") {
    backspace();
    return;
  }

  if (event.key === "Escape") {
    clearExpression();
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    calculate();
  }
});

clearExpression();
