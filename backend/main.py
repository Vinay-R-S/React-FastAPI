from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from src.routes import auth, categories, products, reviews, admin

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(reviews.router)
app.include_router(admin.router)

# API docs path 
API_HTML_PATH = "./api.html"

@app.get("/api.html")
async def serve_api_html():
    return FileResponse(API_HTML_PATH)

@app.get("/")
def root():
    return {"message": "Backend running!", "status": "ok"}
