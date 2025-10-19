import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface User {
  id: number;
  name: string;
  email: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price?: string;
  created_at: string;
}

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({
    name: "",
    email: "",
    phone_number: "",
    rating: 5,
    review: "",
  });
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [error, setError] = useState("");

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
      setError("Failed to load product details");
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/products/${productId}/reviews`);
      const data = await res.json();
      setReviews(data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load reviews");
    }
  };

  const loadUserData = () => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setNewReview(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || ""
      }));
    }
    
    if (storedToken) {
      setToken(storedToken);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setNewReview({ ...newReview, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReview.name.trim() || !newReview.email.trim() || !newReview.review.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!token) {
      setError("You must be logged in to submit a review.");
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newReview),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to submit review");
      }

      const data = await res.json();
      setReviews((prev) => [data.review, ...prev]);
      setNewReview({ ...newReview, review: "", rating: 5, phone_number: "" });
      setError("");
      toast.success("Review submitted successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setNewReview({
      name: review.name,
      email: review.email,
      phone_number: review.phone_number,
      rating: review.rating,
      review: review.review,
    });
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingReview || !token) return;

    if (!newReview.name.trim() || !newReview.email.trim() || !newReview.review.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/reviews/${editingReview.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: newReview.rating,
          review: newReview.review,
          phone_number: newReview.phone_number,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update review");
      }

      const data = await res.json();
      setReviews((prev) => 
        prev.map((r) => r.id === editingReview.id ? data.review : r)
      );
      setEditingReview(null);
      setNewReview({ name: "", email: "", phone_number: "", rating: 5, review: "" });
      setError("");
      toast.success("Review updated successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setNewReview({ name: "", email: "", phone_number: "", rating: 5, review: "" });
    setError("");
  };

  const handleDelete = async (reviewId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/reviews/${reviewId}`, {
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
      setError(err.message);
      toast.error(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (productId) {
        setLoading(true);
        loadUserData();
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
            <Button variant="outline" onClick={() => navigate("/user-home")}>
              ← Back to Products
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add/Edit Review Form */}
      {currentUser && (
        <Card>
          <CardHeader>
            <CardTitle>{editingReview ? "Edit Review" : "Add a Review"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingReview ? handleUpdateReview : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newReview.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newReview.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={newReview.phone_number}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rating">Rating *</Label>
                  <Select 
                    name="rating" 
                    onValueChange={(value) => setNewReview({ ...newReview, rating: Number(value) })} 
                    value={newReview.rating.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} Star{n > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="review">Review Description *</Label>
                <Textarea
                  id="review"
                  name="review"
                  value={newReview.review}
                  onChange={handleInputChange}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingReview ? "Update Review" : "Submit Review"}
                </Button>
                {editingReview && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
              {error && <p className="text-red-500 text-center">{error}</p>}
            </form>
          </CardContent>
        </Card>
      )}

      {!currentUser && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-4">Please log in to submit a review</p>
            <Button onClick={() => navigate("/")}>Go to Login</Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
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
                    {r.phone_number && (
                      <p className="text-sm text-gray-500">Contact: {r.phone_number}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      <p>Created: {new Date(r.created_at).toLocaleString()}</p>
                      {r.updated_at && r.updated_at !== r.created_at && (
                        <p>Updated: {new Date(r.updated_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  {currentUser?.id === r.user_id && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(r)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(r.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
