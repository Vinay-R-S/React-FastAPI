from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils.supabase_client import supabase
import bcrypt
from datetime import datetime

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class SignupRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

@app.get("/")
def root():
    return {"message": "Backend running!"}

# --------- SIGNUP ----------
@app.post("/signup")
def signup(data: SignupRequest):
    try:
        # hash password
        hashed_password = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()

        # insert into users table
        supabase.table("users").insert({
            "name": data.name,
            "email": data.email,
            "password": hashed_password,
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        return {"message": "Signup successful!"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --------- LOGIN ----------
@app.post("/login")
def login(data: LoginRequest):
    try:
        # fetch user by email
        response = supabase.table("users").select("*").eq("email", data.email).execute()
        users = response.data

        if not users:
            raise HTTPException(status_code=404, detail="User not found")

        user = users[0]

        # check password
        if bcrypt.checkpw(data.password.encode(), user["password"].encode()):
            return {"message": "Login successful!", "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}
        else:
            raise HTTPException(status_code=401, detail="Incorrect password")

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
