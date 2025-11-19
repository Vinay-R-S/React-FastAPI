from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime
from ..database import supabase
from ..models import ProductCreate, ProductUpdate
from ..auth_utils import require_admin

router = APIRouter()

@router.get("/products")
def list_products(
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    order: Optional[str] = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50)
):
    """List products with search, filtering, sorting, and pagination."""
    try:
        query = supabase.table("products").select("*", count="exact")

        if search:
            query = query.ilike("name", f"%{search}%")
        
        if category_id:
            query = query.eq("category_id", category_id)

        is_desc = order.lower() == "desc"
        query = query.order(sort_by, desc=is_desc)
        
        # Pagination
        start = (page - 1) * limit
        end = start + limit - 1
        query = query.range(start, end)

        resp = query.execute()
        
        return {
            "data": resp.data,
            "pagination": {
                "total": resp.count,
                "page": page,
                "limit": limit,
                "pages": (resp.count + limit - 1) // limit if resp.count else 0
            }
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/products", dependencies=[Depends(require_admin)])
def create_product(payload: ProductCreate):
    now = datetime.utcnow().isoformat()
    product_data = {
        "name": payload.name,
        "description": payload.description,
        "price": payload.price,
        "created_at": now,
        "updated_at": now
    }
    if payload.image_url:
        product_data["image_url"] = payload.image_url
    if payload.category_id:
        product_data["category_id"] = payload.category_id
        
    resp = supabase.table("products").insert(product_data).execute()
    return {"message": "Product created", "product": resp.data[0]}

@router.put("/products/{product_id}", dependencies=[Depends(require_admin)])
def update_product(product_id: int, payload: ProductUpdate):
    payload_dict = {k: v for k, v in payload.dict().items() if v is not None}
    if not payload_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    payload_dict["updated_at"] = datetime.utcnow().isoformat()

    resp = supabase.table("products").update(payload_dict).eq("id", product_id).execute()
    return {"message": "Product updated", "product": resp.data[0] if resp.data else None}

@router.delete("/products/{product_id}", dependencies=[Depends(require_admin)])
def delete_product(product_id: int):
    resp = supabase.table("products").delete().eq("id", product_id).execute()
    return {"message": "Product deleted"}
