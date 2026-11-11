# Browser Calculator

A local web calculator built with **Python, FastAPI, HTML, CSS, and JavaScript**. This early learning project connects a browser interface to a Python API and adds calculation history.

## What it does

- Enter arithmetic with the on-screen keypad or keyboard, then request a result from the Python API.
- Parse expressions and check their syntax-tree nodes against an allowlist before evaluation.
- Keep the latest 50 calculations in the browser's local storage and select an earlier expression to reuse it.
- Expose calculation and history endpoints through FastAPI.

The browser history and API history are separate. The API keeps its own most recent 50 entries in memory, which clears when the server restarts; the interface displays the browser's saved history.

## Run locally

Requires Python 3, FastAPI, Pydantic, and Uvicorn. There is no dependency lockfile or `requirements.txt` yet. From the repository directory, the following Windows PowerShell commands create an environment and start the server:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install fastapi pydantic uvicorn
.\.venv\Scripts\python.exe -m uvicorn Calculator:app --host 127.0.0.1 --port 8000
```

Open [the calculator](http://127.0.0.1:8000/) after the server starts. Keep the terminal open and use `Ctrl+C` to stop it. The frontend uses plain JavaScript and needs no Node.js build step.

## Read the source

| File | What to look for |
| --- | --- |
| [Calculator.py](Calculator.py) | Request models, expression parsing, API routes, and in-memory history |
| [static/app.js](static/app.js) | DOM events, API requests, browser storage, and history rendering |
| [static/index.html](static/index.html) | Calculator keypad and history panel |
| [static/styles.css](static/styles.css) | Layout, colors, and interactive states |
| [sample.js](sample.js) | A separate console greeting exercise; it is not part of the calculator |

## Status

This is a local learning prototype. Automated tests, dependency version pinning, and deployment configuration are not included. Input validation, error handling, and layout across screen sizes remain areas for improvement.
