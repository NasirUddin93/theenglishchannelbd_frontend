import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "The English Channel BD",
  description: "Your premier destination for English literature, language courses, and educational resources",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Toaster position="top-center" richColors duration={2000} />
              <div className="relative min-h-screen text-gray-900 font-sans">
                <BackgroundAnimation />
                <div className="relative z-10">
                  <Navbar />
                  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                  </main>
                  <Footer />
                </div>
              </div>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-100 py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-serif text-2xl font-bold text-gray-900 mb-4">The English Channel BD</h3>
            <p className="text-gray-500 max-w-sm">Your premier destination for English literature, language courses, and educational resources. Join our community of learners today.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 uppercase text-xs tracking-wider">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="/shop" className="hover:text-orange-600 transition-colors">All Books</a></li>
              <li><a href="/shop?category=Fiction" className="hover:text-orange-600 transition-colors">Fiction</a></li>
              <li><a href="/shop?category=Sci-Fi" className="hover:text-orange-600 transition-colors">Sci-Fi</a></li>
              <li><a href="/shop?category=Self-Help" className="hover:text-orange-600 transition-colors">Self-Help</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 uppercase text-xs tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="/profile" className="hover:text-orange-600 transition-colors">My Account</a></li>
              <li><a href="/cart" className="hover:text-orange-600 transition-colors">Shipping Info</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Returns</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-50 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} The English Channel BD. All rights reserved.
        </div>
      </div>
    </footer>
  );
}