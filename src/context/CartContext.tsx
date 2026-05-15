'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Book, CourseCartItem } from '../types';
import { toast } from 'sonner';
import { api, ApiBook, joinStorage } from '../lib/api';
import { useAuth } from './AuthContext';
import { storageUrl } from '@/lib/config';

interface CartContextType {
  cart: CartItem[];
  addToCart: (book: Book) => void;
  addToCartCourse: (course: CourseCartItem) => void;
  removeFromCart: (bookId: string) => void;
  removeFromCartCourse: (courseId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
    const savedCart = localStorage.getItem('lumina_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      const bookIds = parsedCart.filter((item: CartItem) => item.type === 'book').map((item: CartItem) => item.bookId);
      
      Promise.all(
        bookIds.map((id: string) => api.get<ApiBook>(`/books/${id}`).catch(() => null))
      ).then((results) => {
        const enrichedCart = parsedCart.map((item: CartItem, index: number) => {
          if (item.type === 'book') {
            const apiBook = results[index];
            return {
              ...item,
              stock: apiBook ? apiBook.stock : (item.stock || 0),
            };
          }
          return item;
        });
        setCart(enrichedCart);
      });
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('lumina_cart', JSON.stringify(cart));
    }
  }, [cart, mounted]);

  const addToCart = (book: Book) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.bookId === book.id);
      if (existingItem) {
        if (existingItem.quantity >= book.stock) {
          toast.error(`Only ${book.stock} items available in stock`);
          return prev;
        }
        toast.success(`Updated quantity for ${book.title}`);
        return prev.map(item =>
          item.bookId === book.id ? { ...item, quantity: Math.min(item.quantity + 1, book.stock) } : item
        );
      }
      toast.success(`Added ${book.title} to cart`);
      return [...prev, {
        bookId: book.id,
        type: 'book',
        title: book.title,
        author: book.author,
        price: book.price,
        quantity: 1,
        coverUrl: book.coverUrl,
        stock: book.stock
      }];
    });
  };

    const addToCartCourse = (course: CourseCartItem) => {
      // Check if user already owns this course
      if (user) {
        const orders = JSON.parse(localStorage.getItem('lumina_orders') || '[]');
        const alreadyOwned = orders.some((order: any) => {
          if (order.status === 'cancelled') return false;
          return order.items.some((item: any) => 
            item.type === 'course' && String(item.courseId || item.bookId) === String(course.id)
          );
        });

        if (alreadyOwned) {
          toast.info(`You already own "${course.title}"`);
          return;
        }
      }

      setCart(prev => {
        const existingItem = prev.find(item => item.courseId === String(course.id));
        if (existingItem) {
          toast.info(`${course.title} is already in your cart`);
          return prev;
        }
        toast.success(`Added ${course.title} to cart`);

        const courseImg = course.image;
        const finalCoverUrl = courseImg
          ? storageUrl(courseImg)
          : `https://picsum.photos/seed/course${course.id}/400/600`;

        return [...prev, {
          courseId: String(course.id),
          type: 'course',
          title: course.title,
          author: course.instructor,
          price: course.price,
          quantity: 1,
          coverUrl: finalCoverUrl,
          stock: 999,
          instructor: course.instructor,
          slug: course.slug,
        }];
      });
    };

  const removeFromCart = (bookId: string) => {
    setCart(prev => {
      const itemToRemove = prev.find(item => item.bookId === bookId);
      if (itemToRemove) {
        toast.info(`Removed ${itemToRemove.title} from cart`);
      }
      return prev.filter(item => item.bookId !== bookId);
    });
  };

  const removeFromCartCourse = (courseId: string) => {
    setCart(prev => {
      const itemToRemove = prev.find(item => item.courseId === courseId);
      if (itemToRemove) {
        toast.info(`Removed ${itemToRemove.title} from cart`);
      }
      return prev.filter(item => item.courseId !== courseId);
    });
  };

  const updateQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    setCart(prev => {
      const item = prev.find(i => i.bookId === bookId);
      if (item && quantity > item.stock) {
        toast.error(`Only ${item.stock} items available`);
        return prev.map(i => i.bookId === bookId ? { ...i, quantity: i.stock } : i);
      }
      return prev.map(i => i.bookId === bookId ? { ...i, quantity } : i);
    });
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, addToCartCourse, removeFromCart, removeFromCartCourse, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
