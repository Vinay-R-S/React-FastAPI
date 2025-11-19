from fastapi import APIRouter, HTTPException, Depends
from ..database import supabase
from ..models import CategoryCreate
from ..auth_utils import require_admin

router = APIRouter()

@router.get("/categories")
def list_categories():
    """List all categories."""
    try:
        resp = supabase.table("categories").select("*").order("name").execute()
        return {"data": resp.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/categories", dependencies=[Depends(require_admin)])
def create_category(payload: CategoryCreate):
    """Create a new category (Admin only)."""
    try:
        resp = supabase.table("categories").insert({
            "name": payload.name,
            "description": payload.description
        }).execute()
        return {"message": "Category created", "category": resp.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/categories/{category_id}", dependencies=[Depends(require_admin)])
def delete_category(category_id: int):
    """Delete a category (Admin only)."""
    try:
        resp = supabase.table("categories").delete().eq("id", category_id).execute()
        return {"message": "Category deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
