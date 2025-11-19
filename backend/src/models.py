from pydantic import BaseModel
from typing import Optional

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class ProductUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    price: Optional[str]
    image_url: Optional[str]
    category_id: Optional[int]

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

class ReviewReply(BaseModel):
    reply: str

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    is_admin: bool = False

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str]
    password: Optional[str]
    avatar_url: Optional[str]
