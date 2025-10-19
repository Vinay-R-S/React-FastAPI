from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils.supabase_client import supabase
from datetime import datetime
from jose import JWTError, jwt
from typing import Optional, List

SECRET_KEY = "dummy_key"  # move to env var
ALGORITHM = "HS256"

app = FastAPI()

# ----------- CORS -----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------- MODELS -----------
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

# ----------- AUTH HELPERS -----------
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
        if not resp.data:
            raise HTTPException(status_code=401, detail="User not found")
        return resp.data[0]
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token error: {str(e)}")

def require_admin(user=Depends(get_current_user)):
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user

# ----------- PRODUCT ENDPOINTS -----------

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

        # sorting
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
    payload_dict["updated_at"] = datetime.utcnow().isoformat()
    resp = supabase.table("products").update(payload_dict).eq("id", product_id).execute()
    return {"message": "Product updated", "product": resp.data[0] if resp.data else None}


@app.delete("/products/{product_id}", dependencies=[Depends(require_admin)])
def delete_product(product_id: int):
    supabase.table("products").delete().eq("id", product_id).execute()
    return {"message": "Product deleted"}


# ----------- REVIEW ENDPOINTS -----------

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

        query = query.order(sort_by, desc=(order == "desc"))
        resp = query.execute()
        return {"data": resp.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/products/{product_id}/reviews")
def add_review(product_id: int, payload: ReviewCreate, user=Depends(get_current_user)):
    """User adds a review."""
    try:
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
        resp = supabase.table("reviews").insert(review_data).execute()
        return {"message": "Review added", "review": resp.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/reviews/{review_id}")
def update_review(review_id: int, payload: ReviewUpdate, user=Depends(get_current_user)):
    """User updates their own review."""
    try:
        # ensure ownership
        check = supabase.table("reviews").select("*").eq("id", review_id).limit(1).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Review not found")
        review = check.data[0]
        if review["user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not allowed to edit this review")

        update_data = {k: v for k, v in payload.dict().items() if v is not None}
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

        supabase.table("reviews").delete().eq("id", review_id).execute()
        return {"message": "Review deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from utils.supabase_client import supabase
# import bcrypt
# from datetime import datetime

# app = FastAPI()

# # CORS setup
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Request models - PyDantic
# class SignupRequest(BaseModel):
#     email: str
#     password: str
#     name: str

# class LoginRequest(BaseModel):
#     email: str
#     password: str

# @app.get("/")
# def root():
#     return {"message": "Backend running!"}

# # --------- SIGNUP ----------
# @app.post("/signup")
# def signup(data: SignupRequest):
#     try:
#         # hash password
#         hashed_password = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()

#         # insert into users table
#         supabase.table("users").insert({
#             "name": data.name,
#             "email": data.email,
#             "password": hashed_password,
#             "created_at": datetime.utcnow().isoformat()
#         }).execute()

#         return {"message": "Signup successful!"}

#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))

# # --------- LOGIN ----------
# @app.post("/login")
# def login(data: LoginRequest):
#     try:
#         # fetch user by email
#         response = supabase.table("users").select("*").eq("email", data.email).execute()
#         users = response.data

#         if not users:
#             raise HTTPException(status_code=404, detail="User not found")

#         user = users[0]

#         # check password
#         if bcrypt.checkpw(data.password.encode(), user["password"].encode()):
#             return {"message": "Login successful!", "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}
#         else:
#             raise HTTPException(status_code=401, detail="Incorrect password")

#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))
