import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const products = [
  {
    id: 1,
    name: "ProUX Kit",
    desc: "UI components for fast prototyping",
    price: "Free",
  },
  {
    id: 2,
    name: "Design Tokens",
    desc: "Color and spacing system",
    price: "$9",
  },
  {
    id: 3,
    name: "UX Audit",
    desc: "Automated accessibility & UX checks",
    price: "$49",
  },
];

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">ProUX</h1>
          <span className="text-sm text-gray-500">
            — Designer & Feedback hub
          </span>
        </div>

        <nav className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex">
            Home
          </Button>
          <Button variant="ghost" className="hidden sm:inline-flex">
            Products
          </Button>
          <Button variant="ghost" className="hidden sm:inline-flex">
            Dashboard
          </Button>

          <Avatar>
            <AvatarImage src="/avatar.png" alt="Admin" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </nav>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to ProUX</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                ProUX is a lightweight feedback & product admin hub built with
                React, TypeScript, Tailwind CSS and shadcn/ui. Use the admin
                dashboard to add, update, and moderate product reviews.
              </p>

              <div className="flex gap-3">
                <Button>Explore Products</Button>
                <Button variant="outline">Go to Dashboard</Button>
              </div>
            </CardContent>
            <CardFooter />
          </Card>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-xl font-semibold">{products.length}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-500">Reviews</p>
              <p className="text-xl font-semibold">128</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-500">Active Admins</p>
              <p className="text-xl font-semibold">3</p>
            </div>
          </div>
        </section>

        {/* Product list */}
        <aside>
          <h2 className="text-lg font-semibold mb-3">Products</h2>
          <div className="space-y-3">
            {products.map((p) => (
              <Card key={p.id} className="p-3">
                <CardHeader>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{p.desc}</p>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{p.price}</span>
                    <Button size="sm">View</Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </aside>
      </main>

      <footer className="max-w-6xl mx-auto mt-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ProUX — Built with shadcn/ui + Tailwind
      </footer>
    </div>
  );
};

export default HomePage;
