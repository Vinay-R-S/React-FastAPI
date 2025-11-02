from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils.supabase_client import supabase
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional, List
import bcrypt
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY not set in environment (.env)")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models 
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    price: Optional[str]

class ReviewCreate(BaseModel):
    name: str
    email: str
    phone_number: str
    rating: int
    review: str

class ReviewUpdate(BaseModel):
    rating: Optional[int]
    review: Optional[str]
    phone_number: Optional[str]

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    is_admin: bool = False

class LoginRequest(BaseModel):
    email: str
    password: str
    
    
# API docs path 
API_HTML_PATH = "./api.html"

@app.get("/api.html")
async def serve_api_html():
    return FileResponse(API_HTML_PATH)

# Auth Helpers
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        resp = supabase.table("users").select("*").eq("email", sub).limit(1).execute()
        # print(f"Looking for user with email: {sub}")  # Debug log
        # print(f"User lookup result: {resp.data}")  # Debug log
        
        if not resp.data:
            # print(f"No user found with email: {sub}")  # Debug log
            raise HTTPException(status_code=401, detail="User not found")
        
        user = resp.data[0]
        # print(f"Found user: {user}")  # Debug log
        return user

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token error: {str(e)}")

def require_admin(user=Depends(get_current_user)):
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Auth Endpoints

@app.get("/")
def root():
    return {"message": "Backend running!", "status": "ok"}

@app.post("/signup")
def signup(data: SignupRequest):
    try:
        # print(f"Signup attempt for email: {data.email}")  # Debug log
        
        # Check if user already exists
        existing_user = supabase.table("users").select("*").eq("email", data.email).execute()
        # print(f"Existing user check result: {existing_user}")  # Debug log
        # print(f"Existing user data: {existing_user.data}")  # Debug log
        # print(f"Existing user error: {getattr(existing_user, 'error', None)}")  # Debug log
        
        if existing_user.data:
            # print("User already exists")  # Debug log
            raise HTTPException(status_code=400, detail="User already exists")

        # Hash password
        hashed_password = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        # print("Password hashed successfully")  # Debug log

        # Insert into users table
        user_data = {
            "name": data.name,
            "email": data.email,
            "password": hashed_password,
            "is_admin": data.is_admin,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # print(f"Inserting user data: {user_data}")  # Debug log
        resp = supabase.table("users").insert(user_data).execute()
        # print(f"Insert response: {resp}")  # Debug log
        # print(f"Insert data: {resp.data}")  # Debug log
        # print(f"Insert error: {getattr(resp, 'error', None)}")  # Debug log
        
        if not resp.data:
            # print("No data returned from insert")  # Debug log
            raise HTTPException(status_code=400, detail="Failed to create user")

        created_user = resp.data[0]
        # print(f"Created user with ID: {created_user.get('id')}")  # Debug log

        # Create JWT token
        access_token = create_access_token(data={"sub": data.email})
        # print("JWT token created successfully")  # Debug log
        
        # Store JWT token in Supabase users table
        try:
            supabase.table("users").update({
                "jwt_token": access_token,
                "last_login": datetime.utcnow().isoformat()
            }).eq("id", created_user["id"]).execute()
        except Exception as update_error:
            # If jwt_token column doesn't exist, log but don't fail
            print(f"Warning: Could not update JWT token in database: {str(update_error)}")
        
        return {
            "message": "Signup successful!",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": created_user["id"],
                "name": data.name,
                "email": data.email,
                "is_admin": data.is_admin
            }
        }

    except HTTPException as e:
        # print(f"HTTPException in signup: {e.detail}")  # Debug log
        raise
    except Exception as e:
        # print(f"General exception in signup: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
def login(data: LoginRequest):
    try:
        # Fetch user by email
        resp = supabase.table("users").select("*").eq("email", data.email).execute()
        
        if not resp.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = resp.data[0]

        # Check password
        if not bcrypt.checkpw(data.password.encode('utf-8'), user["password"].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Incorrect password")

        # Create JWT token
        access_token = create_access_token(data={"sub": data.email})
        
        # Store JWT token in Supabase users table
        try:
            supabase.table("users").update({
                "jwt_token": access_token,
                "last_login": datetime.utcnow().isoformat()
            }).eq("id", user["id"]).execute()
        except Exception as update_error:
            # If jwt_token column doesn't exist, log but don't fail
            print(f"Warning: Could not update JWT token in database: {str(update_error)}")
        
        return {
            "message": "Login successful!",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "is_admin": user.get("is_admin", False)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/logout")
def logout(user=Depends(get_current_user)):
    """Logout user by clearing JWT token from database."""
    try:
        # Clear JWT token from Supabase users table
        supabase.table("users").update({
            "jwt_token": None
        }).eq("id", user["id"]).execute()
        
        return {"message": "Logout successful!"}
    except Exception as e:
        # Don't fail if update doesn't work
        print(f"Warning: Could not clear JWT token: {str(e)}")
        return {"message": "Logout successful!"}

# Product Endpoints

@app.get("/products")
def list_products(
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    order: Optional[str] = Query("desc")
):
    """List products with search and sorting."""
    try:
        query = supabase.table("products").select("*")

        if search:
            query = query.ilike("name", f"%{search}%")

        is_desc = order.lower() == "desc"
        query = query.order(sort_by, desc=is_desc)

        resp = query.execute()
        return {"data": resp.data}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/products", dependencies=[Depends(require_admin)])
def create_product(payload: ProductCreate):
    now = datetime.utcnow().isoformat()
    resp = supabase.table("products").insert({
        "name": payload.name,
        "description": payload.description,
        "price": payload.price,
        "created_at": now,
        "updated_at": now
    }).execute()
    return {"message": "Product created", "product": resp.data[0]}

@app.put("/products/{product_id}", dependencies=[Depends(require_admin)])
def update_product(product_id: int, payload: ProductUpdate):
    payload_dict = {k: v for k, v in payload.dict().items() if v is not None}
    if not payload_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    payload_dict["updated_at"] = datetime.utcnow().isoformat()

    resp = supabase.table("products").update(payload_dict).eq("id", product_id).execute()
    return {"message": "Product updated", "product": resp.data[0] if resp.data else None}

@app.delete("/products/{product_id}", dependencies=[Depends(require_admin)])
def delete_product(product_id: int):
    resp = supabase.table("products").delete().eq("id", product_id).execute()
    return {"message": "Product deleted"}

# Review Endpoints

@app.get("/products/{product_id}/reviews")
def product_reviews(
    product_id: int,
    sort_by: Optional[str] = Query("created_at"),
    order: Optional[str] = Query("desc"),
    min_rating: Optional[int] = Query(None),
    max_rating: Optional[int] = Query(None)
):
    """List reviews with sort and filter options."""
    try:
        query = supabase.table("reviews").select("*").eq("product_id", product_id)
        if min_rating is not None:
            query = query.gte("rating", min_rating)
        if max_rating is not None:
            query = query.lte("rating", max_rating)
        query = query.order(sort_by, desc=(order.lower() == "desc"))
        resp = query.execute()
        return {"data": resp.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/products/{product_id}/reviews")
def add_review(product_id: int, payload: ReviewCreate, user=Depends(get_current_user)):
    """User adds a review."""
    try:
        # print(f"Creating review for product_id: {product_id}")  # Debug log
        # print(f"User creating review: {user}")  # Debug log
        # print(f"User ID: {user.get('id')}")  # Debug log
        
        now = datetime.utcnow().isoformat()
        review_data = {
            "product_id": product_id,
            "user_id": user["id"],
            "name": payload.name,
            "email": payload.email,
            "phone_number": payload.phone_number,
            "rating": payload.rating,
            "review": payload.review,
            "created_at": now,
            "updated_at": now
        }
        # print(f"Review data to insert: {review_data}")  # Debug log
        
        resp = supabase.table("reviews").insert(review_data).execute()
        # print(f"Insert response: {resp}")  # Debug log
        return {"message": "Review added", "review": resp.data[0]}
    except Exception as e:
        # print(f"Error creating review: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/reviews/{review_id}")
def update_review(review_id: int, payload: ReviewUpdate, user=Depends(get_current_user)):
    """User updates their own review."""
    try:
        check = supabase.table("reviews").select("*").eq("id", review_id).limit(1).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Review not found")
        review = check.data[0]
        if review["user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not allowed to edit this review")

        update_data = {k: v for k, v in payload.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        update_data["updated_at"] = datetime.utcnow().isoformat()

        resp = supabase.table("reviews").update(update_data).eq("id", review_id).execute()
        return {"message": "Review updated", "review": resp.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/reviews/{review_id}")
def delete_review(review_id: int, user=Depends(get_current_user)):
    """User deletes their own review."""
    try:
        check = supabase.table("reviews").select("*").eq("id", review_id).limit(1).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Review not found")
        review = check.data[0]
        if review["user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not allowed to delete this review")

        resp = supabase.table("reviews").delete().eq("id", review_id).execute()
        return {"message": "Review deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Admin Review Endpoint 

@app.delete("/admin/reviews/{review_id}", dependencies=[Depends(require_admin)])
def admin_delete_review(review_id: int):
    """Admin deletes any review."""
    try:
        # Check if review exists
        check = supabase.table("reviews").select("*").eq("id", review_id).limit(1).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Review not found")

        resp = supabase.table("reviews").delete().eq("id", review_id).execute()
        return {"message": "Review deleted by admin"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
