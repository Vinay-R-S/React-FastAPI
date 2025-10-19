import { useEffect, useState } from "react";
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
// ⛔ Removed deprecated useToast
// import { useToast } from "@/components/ui/use-toast";

// ✅ Import Sonner toast
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  description?: string;
  price?: string;
  created_at: string;
}

export default function UserHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");

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
    fetchProducts();
  }, []);

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
      <h1 className="text-3xl font-bold mb-4 text-center">
        Welcome to ProUX
      </h1>

      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Search product..."
          className="w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="date">Added Date</SelectItem>
          </SelectContent>
        </Select>
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
            <CardFooter>
              <Button
                variant="default"
                onClick={() =>
                  (window.location.href = `/product/${product.id}/reviews`)
                }
              >
                View Reviews
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
