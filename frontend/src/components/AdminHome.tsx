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

interface Product {
  id: number;
  name: string;
  description?: string;
  price?: string;
  created_at: string;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "" });

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
    const userStr = localStorage.getItem("user");
    let user: any = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }
    if (!user) return navigate("/");
    if (!user.is_admin) return navigate("/user-home");

    fetchProducts();
  }, []);

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
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Product saved successfully!");
        fetchProducts();
        setIsDialogOpen(false);
        setForm({ name: "", description: "", price: "" });
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
      const res = await fetch(`http://127.0.0.1:8000/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
    <div className="p-6">
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
            className="text-white w-full sm:w-auto"
            onClick={() => {
              setEditProduct(null);
              setForm({ name: "", description: "", price: "" });
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
              <p className="text-sm text-gray-500 mt-1">
                Price: ₹{product.price || "N/A"}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  className="text-white"
                  variant="outline"
                  onClick={() => navigate(`/admin/product/${product.id}/reviews`)}
                >
                  View Reviews
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditProduct(product);
                    setForm({
                      name: product.name,
                      description: product.description || "",
                      price: product.price || "",
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

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Name"
            className="mb-2"
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
          <DialogFooter>
            <Button onClick={handleSubmit}>
              {editProduct ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
