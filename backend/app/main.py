from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import categories, cards, periods, budgets, transactions, summary

app = FastAPI(
    title="Finance Tracker API",
    description="Personal finance tracking backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router, prefix="/api")
app.include_router(cards.router, prefix="/api")
app.include_router(periods.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(summary.router, prefix="/api")


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
