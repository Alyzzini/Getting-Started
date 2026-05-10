from ast import AST, Expression, NodeVisitor, parse
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# Global history storage (in production, this would be a database)
calculation_history = []


class ExpressionRequest(BaseModel):
    expression: str


class HistoryItem(BaseModel):
    expression: str
    result: float
    timestamp: str


class SafeEvalVisitor(NodeVisitor):
    allowed_nodes = {
        "Expression",
        "BinOp",
        "UnaryOp",
        "Constant",
        "Add",
        "Sub",
        "Mult",
        "Div",
        "Pow",
        "Mod",
        "USub",
        "UAdd",
        "Load",
        "Paren",
    }

    def generic_visit(self, node: AST) -> Any:
        node_name = type(node).__name__
        if node_name not in self.allowed_nodes:
            raise ValueError(f"Unsupported expression element: {node_name}")
        super().generic_visit(node)

    def visit_Expression(self, node: Expression) -> Any:
        return self.generic_visit(node)


def evaluate_expression(expression: str) -> float:
    if not expression or not expression.strip():
        raise ValueError("Expression must not be empty.")

    tree = parse(expression, mode="eval")
    SafeEvalVisitor().visit(tree)
    compiled = compile(tree, filename="<calculator>", mode="eval")
    result = eval(compiled, {"__builtins__": {}}, {})

    if isinstance(result, bool):
        raise ValueError("Boolean values are not allowed.")

    return result


def add_to_history(expression: str, result: float) -> None:
    """Add a successful calculation to history."""
    from datetime import datetime

    history_item = HistoryItem(
        expression=expression, result=result, timestamp=datetime.now().isoformat()
    )
    calculation_history.insert(0, history_item)  # Add to beginning
    # Keep only last 50 calculations
    if len(calculation_history) > 50:
        calculation_history.pop()


@app.get("/")
async def serve_ui() -> FileResponse:
    return FileResponse("static/index.html")


@app.post("/api/calc")
async def calculate(request: ExpressionRequest) -> JSONResponse:
    try:
        result = evaluate_expression(request.expression)
        # Add successful calculation to history
        add_to_history(request.expression, result)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return JSONResponse(content={"result": result, "expression": request.expression})


@app.get("/api/calc")
async def calculate_get(expression: Optional[str] = None) -> JSONResponse:
    if expression is None:
        raise HTTPException(
            status_code=400, detail="Query parameter 'expression' is required."
        )
    try:
        result = evaluate_expression(expression)
        # Add successful calculation to history
        add_to_history(expression, result)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return JSONResponse(content={"result": result, "expression": expression})


@app.get("/api/history")
async def get_history() -> JSONResponse:
    """Get calculation history."""
    return JSONResponse(
        content={"history": [item.dict() for item in calculation_history]}
    )


@app.delete("/api/history")
async def clear_history() -> JSONResponse:
    """Clear all calculation history."""
    calculation_history.clear()
    return JSONResponse(content={"message": "History cleared"})


if __name__ == "__main__":
    import uvicorn
    import webbrowser

    url = "http://127.0.0.1:8000/"
    webbrowser.open(url, new=2)
    uvicorn.run("Calculator:app", host="127.0.0.1", port=8000, reload=True)
