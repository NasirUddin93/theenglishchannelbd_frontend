'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Book } from '@/types';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Heart,
  MessageSquare,
  Send,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  Quote,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { api, ApiBook, mapApiBookToBook } from '@/lib/api';
import { toast } from 'sonner';

interface ApiReview {
  id: number;
  book_id: number;
  user_id: number | null;
  user_name: string;
  user_email: string | null;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

interface ApiQuestion {
  id: number;
  book_id: number;
  user_id: number | null;
  user_name: string;
  user_email: string | null;
  question: string;
  answer: string | null;
  is_answered: boolean;
  is_approved: boolean;
  created_at: string;
}

type TabId = 'details' | 'preview' | 'reviews' | 'qanda';

function RatingStars({
  value,
  className = 'w-4 h-4',
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(value);
        const partial = !filled && star === Math.ceil(value) && value % 1 !== 0;

        return (
          <span key={star} className="relative inline-block">
            <Star className={cn(className, 'text-gray-200 fill-gray-200')} />
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : `${(value % 1) * 100}%` }}
              >
                <Star className={cn(className, 'text-orange-400 fill-orange-400')} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist: toggleWishlistFromContext } = useWishlist();

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [previewPage, setPreviewPage] = useState(0);

  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [newQuestion, setNewQuestion] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [hasPurchased, setHasPurchased] = useState(false);
  const [userReview, setUserReview] = useState<ApiReview | null>(null);
  const [editingReview, setEditingReview] = useState(false);

  useEffect(() => {
    setActiveTab('details');
    setPreviewPage(0);
    setEditingReview(false);
    setUserReview(null);
    setHasPurchased(false);
    setNewReview({ rating: 5, comment: '' });
    setNewQuestion('');
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      api.get<ApiBook>(`/books/${id}`),
      api.get<{ reviews: ApiReview[]; average_rating: number; total: number }>(`/books/${id}/reviews`),
      api.get<{ questions: ApiQuestion[]; total: number }>(`/books/${id}/questions`),
    ])
      .then(([bookRes, reviewsRes, questionsRes]) => {
        setBook(mapApiBookToBook(bookRes));
        setReviews(reviewsRes.reviews || []);
        setAverageRating(reviewsRes.average_rating || 0);
        setQuestions(questionsRes.questions || []);
      })
      .catch((err) => {
        console.error('Book detail error:', err);
        setBook(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setHasPurchased(false);
      return;
    }

    const checkPurchase = async () => {
      try {
        const ordersRes = await api.get<any>('/orders');
        const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes?.data || [];

        const purchased = orders.some(
          (order: any) =>
            order.status === 'delivered' &&
            order.items.some((item: any) => String(item.book_id) === String(id))
        );

        setHasPurchased(purchased);
      } catch {
        const orders = JSON.parse(localStorage.getItem('lumina_orders') || '[]');
        const purchased = orders.some(
          (order: any) =>
            order.status === 'delivered' &&
            order.items.some((item: any) => String(item.book_id) === String(id))
        );

        setHasPurchased(purchased);
      }
    };

    checkPurchase();
  }, [user, id]);

  useEffect(() => {
    if (!user) {
      setUserReview(null);
      setEditingReview(false);
      return;
    }

    const mine =
      reviews.find(
        (r) =>
          r.user_email === user.email ||
          (user.displayName && r.user_name === user.displayName)
      ) || null;

    setUserReview(mine);
    setEditingReview(false);

    if (mine) {
      setNewReview({ rating: mine.rating, comment: mine.comment });
    } else {
      setNewReview({ rating: 5, comment: '' });
    }
  }, [user, reviews]);

  const isStaff = user?.role === 'staff';
  const wishlistActive = !!id && isInWishlist(id);
  const totalPreviewPages = book?.previewImages?.length || 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return {
      star,
      count,
      percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
    };
  });

  const summary = book?.description
    ? book.description.length > 240
      ? `${book.description.slice(0, 240).trimEnd()}…`
      : book.description
    : '';

  const tabs: { id: TabId; label: string; icon: any; count?: number }[] = [
    { id: 'details', label: 'Details', icon: MessageSquare },
    ...(book?.previewImages?.length
      ? [{ id: 'preview' as TabId, label: 'Preview', icon: BookOpen }]
      : []),
    { id: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
    { id: 'qanda', label: 'Q&A', icon: HelpCircle, count: questions.length },
  ];

  const handleAddToCart = () => {
    if (book) addToCart(book);
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      router.push('/auth');
      return;
    }

    if (!id) return;

    setWishlistLoading(true);
    try {
      const added = await toggleWishlistFromContext(id);
      toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || submitting || !user) return;

    const name = user.displayName?.trim() || user.email?.split('@')[0] || 'Reader';

    if (!hasPurchased) {
      toast.error('You can only review books you have received');
      return;
    }

    setSubmitting(true);

    try {
      if (userReview) {
        await api.put(`/books/${id}/reviews/${userReview.id}`, {
          user_name: name,
          user_email: user.email,
          rating: newReview.rating,
          comment: newReview.comment,
        });
        toast.success('Review updated successfully!');
      } else {
        await api.post(`/books/${id}/reviews`, {
          user_name: name,
          user_email: user.email,
          rating: newReview.rating,
          comment: newReview.comment,
        });
        toast.success('Review submitted!');
      }

      setEditingReview(false);
      setNewReview({ rating: 5, comment: '' });

      const res = await api.get<{ reviews: ApiReview[]; average_rating: number; total: number }>(
        `/books/${id}/reviews`
      );
      setReviews(res.reviews || []);
      setAverageRating(res.average_rating || 0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || submitting || !user) return;

    const name = user.displayName?.trim() || user.email?.split('@')[0] || 'Reader';

    setSubmitting(true);

    try {
      await api.post(`/books/${id}/questions`, {
        user_name: name,
        user_email: user.email,
        question: newQuestion,
      });

      toast.success('Question submitted!');
      setNewQuestion('');

      const res = await api.get<{ questions: ApiQuestion[]; total: number }>(`/books/${id}/questions`);
      setQuestions(res.questions || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center px-4">
        <div className="relative overflow-hidden rounded-[2rem] border border-orange-100/70 bg-white/85 px-10 py-12 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.08),transparent_55%)]" />
          <div className="relative flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-[3px] border-orange-100 border-t-orange-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-orange-500 uppercase">
                Curating Details
              </p>
              <p className="mt-2 text-sm text-gray-500">Preparing an elevated reading experience…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-[68vh] flex-col items-center justify-center px-4 text-center">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100">
          <BookOpen className="h-9 w-9 text-orange-300" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Book not found</h2>
        <p className="mt-3 max-w-md text-sm leading-7 text-gray-500">
          The book you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 hover:shadow-orange-600/30"
        >
          Browse Collection
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    );
  }

  const currentPreviewPage = Math.min(previewPage, Math.max(totalPreviewPages - 1, 0));

  return (
    <div className="relative pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.95),transparent_30%),linear-gradient(to_bottom,#ffffff,#fff7f2_45%,#ffffff)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-gradient-to-b from-orange-50/70 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Link
          href="/shop"
          className="inline-flex items-center gap-3 rounded-full border border-orange-100/70 bg-white/80 px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-gray-500 shadow-sm backdrop-blur-md transition hover:border-orange-200 hover:text-orange-600 hover:shadow-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-500">
            <ArrowLeft className="h-3.5 w-3.5" />
          </span>
          Back to Collection
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left / Cover */}
        <motion.aside
          className="lg:col-span-5 xl:col-span-4"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="sticky top-24 space-y-6">
            <div className="relative overflow-hidden rounded-[2.2rem] border border-orange-100/70 bg-white/85 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.09)] backdrop-blur-xl">
              <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-orange-100/35 blur-3xl" />
              <div className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-amber-100/30 blur-3xl" />

              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    Curated Pick
                  </div>
                  <div className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 ring-1 ring-gray-100">
                    {book.category}
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-orange-200/35 via-orange-100/20 to-transparent blur-2xl opacity-70 transition-opacity duration-700 group-hover:opacity-100" />
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)]">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
                  </div>
                </div>

                {!isStaff && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleAddToCart}
                      className="group flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:from-orange-700 hover:to-orange-600 hover:shadow-orange-600/30 active:scale-[0.99]"
                    >
                      <ShoppingCart className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                      <span>Add to Cart</span>
                      <span className="ml-auto text-orange-100">৳{book.price.toFixed(2)}</span>
                    </button>

                    <button
                      onClick={handleToggleWishlist}
                      disabled={wishlistLoading}
                      className={cn(
                        'flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold transition active:scale-[0.99]',
                        wishlistActive
                          ? 'border-red-100 bg-red-50 text-red-500 hover:bg-red-100/70'
                          : 'border-orange-100 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600'
                      )}
                    >
                      <Heart className={cn('h-[18px] w-[18px]', wishlistActive && 'fill-current')} />
                      <span>{wishlistActive ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
                    </button>
                  </div>
                )}

                {!isStaff && (
                  <div className="mt-6 grid grid-cols-3 gap-2.5">
                    {[
                      { icon: Shield, label: 'Secure' },
                      { icon: Truck, label: 'Fast Delivery' },
                      { icon: Award, label: 'Quality' },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white/80 px-3 py-4 text-center"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!isStaff && (
              <div className="rounded-[2rem] border border-orange-100/70 bg-white/85 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.06)] backdrop-blur-xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-500">Quick Value</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="col-span-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-500">Price</p>
                    <p className="mt-1 text-3xl font-black tracking-tight text-gray-900">
                      ৳{book.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">Stock</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {book.stock} available
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">Sold</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Sparkles className="h-4 w-4 text-orange-500" />
                      {book.purchase_count || 0} copies
                    </p>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">Format</p>
                    <p className="mt-2 text-sm font-semibold text-gray-700">
                      {book.format || 'Paperback'} · {book.language || 'English'} ·{' '}
                      {book.pages ? `${book.pages} pages` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.aside>

        {/* Right / Content */}
        <motion.section
          className="lg:col-span-7 xl:col-span-8 space-y-6"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          {/* Hero Summary */}
          <div className="relative overflow-hidden rounded-[2.2rem] border border-orange-100/70 bg-white/85 p-6 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.07)] backdrop-blur-xl">
            <div className="absolute right-0 top-0 h-36 w-36 translate-x-1/3 -translate-y-1/3 rounded-full bg-orange-100/30 blur-3xl" />

            <div className="relative flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                  {book.category}
                </span>
                <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {book.format || 'Paperback'}
                </span>
                <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {book.language || 'English'}
                </span>
                {!isStaff && (
                  <span
                    className={cn(
                      'rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]',
                      book.stock > 0
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-500'
                    )}
                  >
                    {book.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {book.stock > 0 ? `${book.stock} copies available` : 'Currently unavailable'}
                  </div>

                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-[3.7rem]">
                    {book.title}
                  </h1>

                  <p className="text-lg text-gray-400">
                    by <span className="font-medium text-gray-700">{book.author}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <RatingStars value={averageRating} className="h-4 w-4" />
                    <span className="text-sm font-semibold text-gray-600">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-300">·</span>
                    <span className="text-sm text-gray-500">
                      {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm text-gray-300">·</span>
                    <span className="text-sm font-medium text-emerald-600">
                      {book.purchase_count || 0} sold
                    </span>
                  </div>

                  <div className="rounded-[1.7rem] border border-orange-100 bg-orange-50/55 p-5">
                    <div className="flex items-start gap-3">
                      <Quote className="mt-0.5 h-5 w-5 text-orange-500" />
                      <p className="text-[15px] leading-8 text-gray-600">
                        {summary}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid w-full grid-cols-2 gap-3 xl:w-[320px]">
                  <div className="col-span-2 rounded-[1.6rem] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-500">
                      Price
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">
                      ৳{book.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-[1.4rem] border border-gray-100 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">
                      Rating
                    </p>
                    <p className="mt-2 text-lg font-bold text-gray-800">
                      {averageRating.toFixed(1)}
                    </p>
                    <p className="mt-1 text-[12px] text-gray-400">Premium picks</p>
                  </div>

                  <div className="rounded-[1.4rem] border border-gray-100 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">
                      Reviews
                    </p>
                    <p className="mt-2 text-lg font-bold text-gray-800">{reviews.length}</p>
                    <p className="mt-1 text-[12px] text-gray-400">Reader feedback</p>
                  </div>

                  <div className="col-span-2 rounded-[1.4rem] border border-gray-100 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">
                      Details
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-700">
                      {book.format || 'Paperback'} · {book.language || 'English'} ·{' '}
                      {book.pages ? `${book.pages} pages` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-[1.7rem] border border-gray-100 bg-white/90 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.05)] backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative overflow-hidden rounded-[1.3rem] px-4 py-3.5 text-left transition-all duration-300',
                      active
                        ? 'text-orange-600 shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="premium-tab-pill"
                        className="absolute inset-0 rounded-[1.3rem] bg-gradient-to-br from-orange-50 to-white ring-1 ring-orange-100"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}

                    <span className="relative z-10 flex items-center gap-2">
                      <tab.icon className="h-[15px] w-[15px]" />
                      <span className="text-[13px] font-semibold tracking-wide">{tab.label}</span>

                      {tab.count !== undefined && tab.count > 0 && (
                        <span
                          className={cn(
                            'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold',
                            active ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="rounded-[2rem] border border-gray-100 bg-white/90 p-6 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.05)] backdrop-blur-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="min-h-[340px]"
              >
                {/* Details */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div className="rounded-[1.7rem] border border-orange-100/70 bg-orange-50/40 p-6">
                      <div className="flex items-start gap-3">
                        <Quote className="mt-0.5 h-5 w-5 text-orange-500" />
                        <p className="text-[15px] leading-8 text-gray-600">{book.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {[
                        { label: 'Format', value: book.format || 'Paperback' },
                        { label: 'Language', value: book.language || 'English' },
                        { label: 'Pages', value: book.pages ? String(book.pages) : 'N/A' },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="rounded-[1.4rem] border border-gray-100 bg-white p-5 shadow-sm"
                        >
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">
                            {label}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-gray-700">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview */}
                {activeTab === 'preview' && (
                  <div className="space-y-6">
                    <div className="overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white shadow-[0_15px_40px_rgba(0,0,0,0.04)]">
                      <div className="flex flex-col gap-4 border-b border-gray-50 px-6 py-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Free Preview</p>
                            <p className="text-[11px] text-gray-400">
                              Page {currentPreviewPage + 1} of {totalPreviewPages}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            disabled={currentPreviewPage === 0}
                            onClick={() => setPreviewPage((p) => p - 1)}
                            className="rounded-xl bg-gray-50 p-2.5 text-gray-400 transition hover:bg-orange-50 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>

                          <div className="flex items-center gap-1 px-1">
                            {[...Array(totalPreviewPages)].map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setPreviewPage(i)}
                                className={cn(
                                  'h-1.5 rounded-full transition-all duration-300',
                                  i === currentPreviewPage
                                    ? 'w-6 bg-orange-500'
                                    : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                                )}
                              />
                            ))}
                          </div>

                          <button
                            disabled={currentPreviewPage === totalPreviewPages - 1}
                            onClick={() => setPreviewPage((p) => p + 1)}
                            className="rounded-xl bg-gray-50 p-2.5 text-gray-400 transition hover:bg-orange-50 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex min-h-[320px] items-center justify-center bg-gradient-to-b from-white to-orange-50/30 p-6 md:p-10">
                        {book.previewImages && book.previewImages.length > 0 ? (
                          <motion.img
                            key={currentPreviewPage}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            src={book.previewImages[currentPreviewPage]}
                            alt={`Preview page ${currentPreviewPage + 1}`}
                            className="max-h-[60vh] max-w-full rounded-[1.2rem] object-contain shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <BookOpen className="mx-auto mb-3 h-12 w-12 opacity-50" />
                            <p className="text-sm">No preview images available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isStaff && (
                      <div className="relative overflow-hidden rounded-[1.8rem] border border-orange-100/70 bg-gradient-to-br from-orange-50 via-white to-amber-50/50 p-6 md:p-7">
                        <div className="absolute right-0 top-0 h-36 w-36 translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-100/40 blur-3xl" />
                        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="mb-2 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-orange-500" />
                              <p className="text-sm font-semibold text-orange-800">Enjoying the preview?</p>
                            </div>
                            <p className="text-[13px] text-orange-700/70">
                              Unlock the full experience and continue your reading journey.
                            </p>
                          </div>
                          <button
                            onClick={handleAddToCart}
                            className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-600/15 transition hover:bg-orange-700 hover:shadow-orange-600/25"
                          >
                            Get Full Book
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews */}
                {activeTab === 'reviews' && (
                  <div className="space-y-8">
                    {reviews.length > 0 && (
                      <div className="grid gap-6 rounded-[1.8rem] border border-orange-100/60 bg-gradient-to-br from-orange-50/60 to-white p-6 md:p-7 lg:grid-cols-[260px_1fr]">
                        <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-orange-100 bg-white p-6 text-center shadow-sm">
                          <p className="text-5xl font-black tracking-tight text-gray-900">
                            {averageRating.toFixed(1)}
                          </p>
                          <div className="mt-3">
                            <RatingStars value={averageRating} className="h-4 w-4" />
                          </div>
                          <p className="mt-3 text-xs font-medium text-gray-400">
                            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="space-y-2.5">
                          {ratingDistribution.map(({ star, count, percentage }) => (
                            <div key={star} className="flex items-center gap-3">
                              <span className="w-4 text-right text-xs font-semibold text-gray-400">
                                {star}
                              </span>
                              <Star className="h-3 w-3 fill-gray-300 text-gray-300" />
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{
                                    duration: 0.6,
                                    ease: [0.22, 1, 0.36, 1],
                                    delay: (5 - star) * 0.08,
                                  }}
                                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                                />
                              </div>
                              <span className="w-7 text-xs font-medium text-gray-400">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {user ? (
                      userReview ? (
                        <div className="rounded-[1.8rem] border border-orange-100/70 bg-white p-6 shadow-sm">
                          <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                                <Star className="h-4 w-4 fill-current" />
                              </div>
                              <h3 className="text-[15px] font-semibold text-gray-800">Your Review</h3>
                            </div>

                            <button
                              onClick={() => setEditingReview(!editingReview)}
                              className="text-[13px] font-semibold text-orange-600 transition hover:text-orange-700"
                            >
                              {editingReview ? 'Cancel' : 'Edit'}
                            </button>
                          </div>

                          {editingReview ? (
                            <form onSubmit={handleAddReview} className="space-y-5">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewReview((prev) => ({ ...prev, rating: star }))}
                                    className="transition hover:scale-110"
                                  >
                                    <Star
                                      className={cn(
                                        'h-6 w-6',
                                        newReview.rating >= star
                                          ? 'fill-orange-400 text-orange-400'
                                          : 'fill-gray-200 text-gray-200'
                                      )}
                                    />
                                  </button>
                                ))}
                              </div>

                              <textarea
                                value={newReview.comment}
                                onChange={(e) =>
                                  setNewReview((prev) => ({ ...prev, comment: e.target.value }))
                                }
                                placeholder="Share your thoughts..."
                                required
                                className="min-h-[120px] w-full resize-none rounded-2xl border border-orange-100 bg-white p-4 text-[15px] text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-orange-200 focus:ring-2 focus:ring-orange-100"
                              />

                              <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-600/15 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {submitting ? 'Updating...' : 'Update Review'}
                              </button>
                            </form>
                          ) : (
                            <div className="space-y-3">
                              <RatingStars value={userReview.rating} className="h-4 w-4" />
                              <p className="text-[15px] leading-8 text-gray-600">{userReview.comment}</p>
                              <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                <Clock className="h-3 w-3" />
                                {new Date(userReview.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : hasPurchased ? (
                        <form
                          onSubmit={handleAddReview}
                          className="rounded-[1.8rem] border border-orange-100/70 bg-gradient-to-br from-orange-50/80 to-white p-6 shadow-sm"
                        >
                          <div className="mb-5 flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <h3 className="text-[15px] font-semibold text-gray-800">Write a Review</h3>
                          </div>

                          <div className="mb-4 flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setNewReview((prev) => ({ ...prev, rating: star }))}
                                className="transition hover:scale-110"
                              >
                                <Star
                                  className={cn(
                                    'h-6 w-6',
                                    newReview.rating >= star
                                      ? 'fill-orange-400 text-orange-400'
                                      : 'fill-gray-200 text-gray-200'
                                  )}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm font-medium text-gray-400">
                              {newReview.rating}/5
                            </span>
                          </div>

                          <textarea
                            value={newReview.comment}
                            onChange={(e) =>
                              setNewReview((prev) => ({ ...prev, comment: e.target.value }))
                            }
                            placeholder="Share your experience with this book..."
                            required
                            className="min-h-[120px] w-full resize-none rounded-2xl border border-orange-100 bg-white p-4 text-[15px] text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-orange-200 focus:ring-2 focus:ring-orange-100"
                          />

                          <button
                            type="submit"
                            disabled={submitting}
                            className="mt-5 rounded-2xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-600/15 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {submitting ? 'Posting...' : 'Post Review'}
                          </button>
                        </form>
                      ) : (
                        <div className="rounded-[1.8rem] border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center">
                          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <p className="text-[15px] text-gray-400">
                            You can review this book after receiving your order.
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="rounded-[1.8rem] border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                          <User className="h-5 w-5" />
                        </div>
                        <p className="text-[15px] text-gray-400">Please sign in to write a review.</p>
                        <Link
                          href="/auth"
                          className="mt-3 inline-block text-sm font-semibold text-orange-600 transition hover:text-orange-700"
                        >
                          Sign In →
                        </Link>
                      </div>
                    )}

                    <div className="space-y-4">
                      {reviews.length > 0 ? (
                        reviews.map((review, idx) => (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
                          >
                            <div className="mb-4 flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 text-sm font-bold text-orange-600">
                                  {(review.user_name?.[0] || 'R').toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-[14px] font-semibold text-gray-800">
                                    {review.user_name}
                                  </p>
                                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                                    <Clock className="h-3 w-3" />
                                    {new Date(review.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>

                              <RatingStars value={review.rating} className="h-3 w-3" />
                            </div>
                            <p className="text-[14.5px] leading-8 text-gray-500">{review.comment}</p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="rounded-[1.8rem] border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                            <Star className="h-6 w-6 text-gray-300" />
                          </div>
                          <p className="text-[15px] text-gray-400">
                            No reviews yet. Be the first to share your thoughts!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Q&A */}
                {activeTab === 'qanda' && (
                  <div className="space-y-8">
                    {user && !isStaff ? (
                      <form
                        onSubmit={handleAddQuestion}
                        className="rounded-[1.8rem] border border-blue-100/60 bg-gradient-to-br from-blue-50/40 to-white p-6 shadow-sm"
                      >
                        <div className="mb-4 flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-500">
                            <HelpCircle className="h-4 w-4" />
                          </div>
                          <h3 className="text-[15px] font-semibold text-gray-800">Ask a Question</h3>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row">
                          <input
                            type="text"
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="What would you like to know about this book?"
                            required
                            className="flex-1 rounded-2xl border border-blue-100 bg-white p-4 text-[15px] text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-5 py-4 text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {submitting ? (
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            ) : (
                              <Send className="h-[18px] w-[18px]" />
                            )}
                          </button>
                        </div>
                      </form>
                    ) : !user ? (
                      <div className="rounded-[1.8rem] border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                          <User className="h-5 w-5" />
                        </div>
                        <p className="text-[15px] text-gray-400">Please sign in to ask a question.</p>
                        <Link
                          href="/auth"
                          className="mt-3 inline-block text-sm font-semibold text-orange-600 transition hover:text-orange-700"
                        >
                          Sign In →
                        </Link>
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      {questions.length > 0 ? (
                        questions.map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
                          >
                            <div className="mb-4 flex items-start gap-3.5">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[11px] font-bold text-orange-500">
                                Q
                              </div>
                              <div className="flex-1">
                                <p className="text-[14.5px] font-semibold leading-snug text-gray-800">
                                  {item.question}
                                </p>
                                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-400">
                                  <User className="h-3 w-3" />
                                  {item.user_name}
                                  <span className="text-gray-300">·</span>
                                  <Clock className="h-3 w-3" />
                                  {new Date(item.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>

                            {item.answer ? (
                              <div className="ml-[44px] border-t border-gray-50 pt-4">
                                <div className="flex items-start gap-3.5">
                                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[11px] font-bold text-emerald-500">
                                    A
                                  </div>
                                  <p className="text-[14px] italic leading-8 text-gray-500">
                                    {item.answer}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="ml-[44px] border-t border-gray-50 pt-3">
                                <p className="flex items-center gap-1.5 text-[12px] italic text-gray-300">
                                  <Clock className="h-3 w-3" />
                                  Awaiting response...
                                </p>
                              </div>
                            )}
                          </motion.div>
                        ))
                      ) : (
                        <div className="rounded-[1.8rem] border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                            <HelpCircle className="h-6 w-6 text-gray-300" />
                          </div>
                          <p className="text-[15px] text-gray-400">
                            No questions yet. Curious about something?
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.section>
      </div>
    </div>
  );
}