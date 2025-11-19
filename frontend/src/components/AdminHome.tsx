import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Navbar from "./Navbar";
import { isAuthenticated, getUser, getToken } from "@/lib/auth";

interface Product {
  id: number;
  name: string;
  description?: string;
  price?: string;
  image_url?: string;
  category_id?: number;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", image_url: "", category_id: "" });
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/products");
      const data = await res.json();
      if (res.ok) setProducts(data.data || []);
      else toast.error("Failed to fetch products.");
    } catch {
      toast.error("Server connection failed.");
    }
  };

  useEffect(() => {
    // Defensive role check: if not admin, redirect to user home or login
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    
    const user = getUser();
    if (!user?.is_admin) {
      navigate("/user-home");
      return;
    }

    fetchProducts();
    fetchCategories();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/categories");
      const data = await res.json();
      if (res.ok) setCategories(data.data || []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    const method = editProduct ? "PUT" : "POST";
    const url = editProduct
      ? `http://127.0.0.1:8000/products/${editProduct.id}`
      : "http://127.0.0.1:8000/products";

    try {
      const token = getToken();
      if (!token) {
        toast.error("Not authenticated");
        navigate("/");
        return;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Product saved successfully!");
        fetchProducts();
        setIsDialogOpen(false);
        setForm({ name: "", description: "", price: "", image_url: "", category_id: "" });
        setEditProduct(null);
      } else {
        toast.error(data.detail || "Failed to save product.");
      }
    } catch {
      toast.error("Unable to connect to the server.");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = getToken();
      if (!token) {
        toast.error("Not authenticated");
        navigate("/");
        return;
      }

      const res = await fetch(`http://127.0.0.1:8000/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Product deleted.");
        fetchProducts();
      } else {
        toast.error(data.detail || "Failed to delete product.");
      }
    } catch {
      toast.error("Server error while deleting product.");
    }
  };

  const filteredProducts = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "date")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="p-6 container mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center sm:text-left">
          Admin Dashboard - ProUX
        </h1>

      {/* Controls: stack on small screens */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <Input
          placeholder="Search product..."
          className="w-full sm:w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="date">Added Date</SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditProduct(null);
              setForm({ name: "", description: "", price: "", image_url: "", category_id: "" });
              setIsDialogOpen(true);
            }}
          >
            + Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="shadow-md hover:shadow-lg transition"
          >
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{product.description || "No description"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Price: ₹{product.price || "N/A"}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/admin/product/${product.id}/reviews`)}
                >
                  Reviews
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditProduct(product);
                    setForm({
                      name: product.name,
                      description: product.description || "",
                      price: product.price || "",
                      image_url: product.image_url || "",
                      category_id: product.category_id?.toString() || "",
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
              </div>
              <div className="flex items-center">
                <Button
                  variant="destructive"
                  onClick={() => deleteProduct(product.id)}
                >
                  Delete
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Add or Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Name"
            className="mb-2 mt-4"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Description"
            className="mb-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Input
            placeholder="Image URL"
            className="mb-2 mt-2"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          />
          <Select
            value={form.category_id}
            onValueChange={(val) => setForm({ ...form, category_id: val })}
          >
            <SelectTrigger className="w-full mb-2">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={handleSubmit}>
              {editProduct ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
