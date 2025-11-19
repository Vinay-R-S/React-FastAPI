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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Navbar from "./Navbar";
import { isAuthenticated, getUser } from "@/lib/auth";

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

export default function UserHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 9;

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy === "date" ? "created_at" : "name",
        order: sortBy === "date" ? "desc" : "asc",
      });
      
      if (search) params.append("search", search);
      if (selectedCategory !== "all") params.append("category_id", selectedCategory);

      const res = await fetch(`http://127.0.0.1:8000/products?${params}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        toast.error("Failed to fetch products.");
      }
    } catch {
      toast.error("Server connection failed.");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/categories");
      const data = await res.json();
      if (res.ok) setCategories(data.data || []);
    } catch {
      console.error("Failed to fetch categories");
    }
  };

  useEffect(() => {
    // Defensive role check: if not logged in, go to login; if admin, redirect to admin home
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    
    const user = getUser();
    if (user?.is_admin) {
      navigate("/admin-home");
      return;
    }

    fetchCategories();
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
  }, [page, search, sortBy, selectedCategory]);



  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="p-6 container mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center">
          Welcome to ProUX
        </h1>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <Input
          placeholder="Search product..."
          className="w-full md:w-1/3"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedCategory} onValueChange={(val) => {
              setSelectedCategory(val);
              setPage(1);
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="date">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card
            key={product.id}
            className="shadow-md hover:shadow-lg transition flex flex-col h-full"
          >
            {product.image_url && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
            )}
            <CardHeader>
              <CardTitle className="line-clamp-1">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="line-clamp-2 text-muted-foreground mb-2">{product.description || "No description"}</p>
              <p className="text-lg font-bold">
                ₹{product.price || "N/A"}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="default"
                onClick={() => navigate(`/product/${product.id}/reviews`)}
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
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
    </div>
  );
}
