from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import projects, likes, users, evaluation, admin, contact

app = FastAPI(title="funded.gr API", version="1.0.0", root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://funded.gr",
        "https://www.funded.gr",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(likes.router)
app.include_router(users.router)
app.include_router(evaluation.router)
app.include_router(admin.router)
app.include_router(contact.router)


@app.get("/health")
def health():
    return {"status": "ok"}
