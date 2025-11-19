from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import bcrypt
from ..database import supabase
from ..models import SignupRequest, LoginRequest, UserProfileUpdate
from ..auth_utils import create_access_token, get_current_user

router = APIRouter()

@router.post("/signup")
def signup(data: SignupRequest):
    try:
        # Check if user already exists
        existing_user = supabase.table("users").select("*").eq("email", data.email).execute()
        
        if existing_user.data:
            raise HTTPException(status_code=400, detail="User already exists")

        # Hash password
        hashed_password = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insert into users table
        user_data = {
            "name": data.name,
            "email": data.email,
            "password": hashed_password,
            "is_admin": data.is_admin,
            "created_at": datetime.utcnow().isoformat()
        }
        
        resp = supabase.table("users").insert(user_data).execute()
        
        if not resp.data:
            raise HTTPException(status_code=400, detail="Failed to create user")

        created_user = resp.data[0]

        # Create JWT token
        access_token = create_access_token(data={"sub": data.email})
        
        # Store JWT token in Supabase users table
        try:
            supabase.table("users").update({
                "jwt_token": access_token,
                "last_login": datetime.utcnow().isoformat()
            }).eq("id", created_user["id"]).execute()
        except Exception as update_error:
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

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
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
            print(f"Warning: Could not update JWT token in database: {str(update_error)}")
        
        return {
            "message": "Login successful!",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "is_admin": user.get("is_admin", False),
                "avatar_url": user.get("avatar_url")
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/logout")
def logout(user=Depends(get_current_user)):
    """Logout user by clearing JWT token from database."""
    try:
        # Clear JWT token from Supabase users table
        supabase.table("users").update({
            "jwt_token": None
        }).eq("id", user["id"]).execute()
        
        return {"message": "Logout successful!"}
    except Exception as e:
        print(f"Warning: Could not clear JWT token: {str(e)}")
        return {"message": "Logout successful!"}

@router.put("/users/me")
def update_user_profile(payload: UserProfileUpdate, user=Depends(get_current_user)):
    """Update user profile (name, avatar, password)."""
    try:
        update_data = {}
        if payload.name:
            update_data["name"] = payload.name
        if payload.avatar_url:
            update_data["avatar_url"] = payload.avatar_url
        if payload.password:
            hashed_password = bcrypt.hashpw(payload.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            update_data["password"] = hashed_password
            
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        resp = supabase.table("users").update(update_data).eq("id", user["id"]).execute()
        
        # Return updated user info (excluding password)
        updated_user = resp.data[0]
        return {
            "message": "Profile updated",
            "user": {
                "id": updated_user["id"],
                "name": updated_user["name"],
                "email": updated_user["email"],
                "is_admin": updated_user.get("is_admin", False),
                "avatar_url": updated_user.get("avatar_url")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
