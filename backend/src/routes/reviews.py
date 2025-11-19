from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime
from ..database import supabase
from ..models import ReviewCreate, ReviewUpdate, ReviewReply
from ..auth_utils import get_current_user, require_admin

router = APIRouter()

@router.get("/products/{product_id}/reviews")
def product_reviews(
    product_id: int,
    sort_by: Optional[str] = Query("created_at"),
    order: Optional[str] = Query("desc"),
    min_rating: Optional[int] = Query(None),
    max_rating: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50)
):
    """List reviews with sort, filter, and pagination options."""
    try:
        query = supabase.table("reviews").select("*", count="exact").eq("product_id", product_id)
        if min_rating is not None:
            query = query.gte("rating", min_rating)
        if max_rating is not None:
            query = query.lte("rating", max_rating)
        query = query.order(sort_by, desc=(order.lower() == "desc"))
        
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

@router.post("/products/{product_id}/reviews")
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

@router.put("/reviews/{review_id}")
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

@router.delete("/reviews/{review_id}")
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

@router.delete("/admin/reviews/{review_id}", dependencies=[Depends(require_admin)])
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

@router.post("/reviews/{review_id}/reply", dependencies=[Depends(require_admin)])
def admin_reply_review(review_id: int, payload: ReviewReply):
    """Admin replies to a review."""
    try:
        resp = supabase.table("reviews").update({
            "admin_reply": payload.reply,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", review_id).execute()
        
        if not resp.data:
             raise HTTPException(status_code=404, detail="Review not found")
             
        return {"message": "Reply added", "review": resp.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reviews/{review_id}/vote")
def vote_review_helpful(review_id: int, user=Depends(get_current_user)):
    """Toggle helpful vote on a review."""
    try:
        # Check if user already voted
        existing_vote = supabase.table("review_votes").select("*").eq("review_id", review_id).eq("user_id", user["id"]).execute()
        
        if existing_vote.data:
            # Remove vote
            supabase.table("review_votes").delete().eq("id", existing_vote.data[0]["id"]).execute()
            # Decrement count
            review = supabase.table("reviews").select("helpful_votes").eq("id", review_id).single().execute()
            current_votes = review.data.get("helpful_votes", 0) or 0
            
            supabase.table("reviews").update({
                "helpful_votes": max(0, current_votes - 1)
            }).eq("id", review_id).execute()
            
            return {"message": "Vote removed", "voted": False}
        else:
            # Add vote
            supabase.table("review_votes").insert({
                "review_id": review_id,
                "user_id": user["id"],
                "vote_type": "helpful"
            }).execute()
            
            review = supabase.table("reviews").select("helpful_votes").eq("id", review_id).single().execute()
            current_votes = review.data.get("helpful_votes", 0) or 0
            
            supabase.table("reviews").update({
                "helpful_votes": current_votes + 1
            }).eq("id", review_id).execute()
            
            return {"message": "Vote added", "voted": True}
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
