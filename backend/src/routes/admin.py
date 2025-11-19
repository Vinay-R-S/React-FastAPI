from fastapi import APIRouter, HTTPException, Depends
from ..database import supabase
from ..auth_utils import require_admin

router = APIRouter()

@router.get("/admin/stats", dependencies=[Depends(require_admin)])
def get_admin_stats():
    """Get dashboard statistics."""
    try:
        # Note: Supabase-py doesn't have a direct 'count' method in the same way as SQL, 
        # but we can select 'id' with count='exact'.
        
        users_count = supabase.table("users").select("id", count="exact").execute().count
        products_count = supabase.table("products").select("id", count="exact").execute().count
        reviews_count = supabase.table("reviews").select("id", count="exact").execute().count
        
        # Calculate average rating
        reviews = supabase.table("reviews").select("rating").execute()
        avg_rating = 0
        if reviews.data:
            total_rating = sum(r["rating"] for r in reviews.data)
            avg_rating = round(total_rating / len(reviews.data), 1)

        return {
            "total_users": users_count,
            "total_products": products_count,
            "total_reviews": reviews_count,
            "average_rating": avg_rating
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
