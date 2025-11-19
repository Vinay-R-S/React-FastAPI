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
  admin_reply?: string;
  helpful_votes: number;
}

interface Category {
  id: number;
  name: string;
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
  image_url?: string;
  category_id?: number;
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
  const [category, setCategory] = useState<Category | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const fetchProduct = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/products`);
      const data = await res.json();
      if (data.data) {
        const foundProduct = data.data.find((p: Product) => p.id === parseInt(productId!));
        setProduct(foundProduct || null);
        if (foundProduct?.category_id) {
            fetchCategory(foundProduct.category_id);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load product details");
    }
  };

  const fetchCategory = async (id: number) => {
    try {
        const res = await fetch(`http://127.0.0.1:8000/categories`);
        const data = await res.json();
        const cat = data.data.find((c: Category) => c.id === id);
        setCategory(cat || null);
    } catch (err) {
        console.error(err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/products/${productId}/reviews?page=${page}&limit=${limit}`);
      const data = await res.json();
      setReviews(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
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

  const handleVote = async (reviewId: number) => {
    if (!token) {
        toast.error("Login to vote");
        return;
    }
    try {
        const res = await fetch(`http://127.0.0.1:8000/reviews/${reviewId}/vote`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
            toast.success(data.message);
            // Optimistically update UI or refetch
            fetchReviews();
        }
    } catch {
        toast.error("Failed to vote");
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

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
        <div className="flex flex-col md:flex-row">
            {product.image_url && (
                <div className="w-full md:w-1/3 h-64 md:h-auto">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none" />
                </div>
            )}
            <div className="flex-1">
                <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    {category && <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded mt-1 inline-block">{category.name}</span>}
                    <p className="text-muted-foreground mt-2">{product.description || "No description available"}</p>
                    <p className="text-lg font-semibold text-green-600 mt-2">
                        Price: ₹{product.price || "N/A"}
                    </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/user-home")}>
                    ← Back to Products
                    </Button>
                </div>
                </CardHeader>
            </div>
        </div>
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
            <p className="text-muted-foreground mb-4">Please log in to submit a review</p>
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
              <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
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
                              i < r.rating ? "text-yellow-400" : "text-muted-foreground/30"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm text-muted-foreground">({r.rating}/5)</span>
                      </div>
                    </div>
                    <p className="mb-2">{r.review}</p>
                    {r.phone_number && (
                      <p className="text-sm text-muted-foreground">Contact: {r.phone_number}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      <p>Created: {new Date(r.created_at).toLocaleString()}</p>
                      {r.updated_at && r.updated_at !== r.created_at && (
                        <p>Updated: {new Date(r.updated_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
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
                    <Button variant="ghost" size="sm" onClick={() => handleVote(r.id)}>
                        👍 {r.helpful_votes || 0}
                    </Button>
                  </div>
                </div>
                {r.admin_reply && (
                    <div className="mt-4 p-3 bg-muted rounded-md border-l-4 border-primary">
                        <p className="text-sm font-semibold text-primary">Admin Reply:</p>
                        <p className="text-sm">{r.admin_reply}</p>
                    </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
            <Button 
                variant="outline" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
            >
                Previous
            </Button>
            <span className="flex items-center px-4">
                Page {page} of {totalPages}
            </span>
            <Button 
                variant="outline" 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
                Next
            </Button>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
