import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Review {
  id: number;
  product_id: number;
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price?: string;
  created_at: string;
}

const AdminReviews: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/products`);
      const data = await res.json();
      if (data.data) {
        const foundProduct = data.data.find((p: Product) => p.id === parseInt(productId!));
        setProduct(foundProduct || null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load product details");
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/products/${productId}/reviews`);
      const data = await res.json();
      setReviews(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reviews");
    }
  };

  const loadToken = () => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!token) {
      toast.error("You must be logged in to delete reviews");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to delete review");
      }
      
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Review deleted successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (productId) {
        setLoading(true);
        loadToken();
        await Promise.all([fetchProduct(), fetchReviews()]);
        setLoading(false);
      }
    };
    loadData();
  }, [productId]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!product) return <div className="p-6">Product not found</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Product Details */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              <p className="text-gray-600 mt-2">{product.description || "No description available"}</p>
              <p className="text-lg font-semibold text-green-600 mt-2">
                Price: ₹{product.price || "N/A"}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/admin-home")}>
              ← Back to Admin Dashboard
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Reviews Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No reviews yet for this product.</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold">{r.name}</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < r.rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm text-gray-500">({r.rating}/5)</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{r.review}</p>
                    <div className="text-sm text-gray-500 mb-2">
                      <p>Email: {r.email}</p>
                      {r.phone_number && <p>Phone: {r.phone_number}</p>}
                    </div>
                    <div className="text-xs text-gray-400">
                      <p>Created: {new Date(r.created_at).toLocaleString()}</p>
                      {r.updated_at && r.updated_at !== r.created_at && (
                        <p>Updated: {new Date(r.updated_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteReview(r.id)}
                  >
                    Delete Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
