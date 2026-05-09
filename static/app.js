const display = document.getElementById("output");
const keypad = document.querySelector(".calculator-keypad");
let expression = "";

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

    expression = String(data.result);
    updateDisplay();
  } catch (error) {
    display.textContent = "Offline";
  }
};

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
