from fastapi import HTTPException, Header, Depends
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from .config import SECRET_KEY, ALGORITHM
from .database import supabase

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
        
        user = resp.data[0]
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
