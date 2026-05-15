'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Book, Course } from '@/types';
import BookCard from '@/components/BookCard';
import CourseCard from '@/components/CourseCard';
import CourseHero from '@/components/CourseHero';
import CourseBenefits from '@/components/CourseBenefits';
import AnimatedCounter from '@/components/AnimatedCounter';
import {
  ArrowRight,
  BookOpen,
  Truck,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Library,
  Users,
  Star,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { api, ApiBook, mapApiBookToBook, ApiCategory, getBookPlaceholder } from '@/lib/api';
import { useWishlist } from '@/context/WishlistContext';

interface ApiCourse {
  id: number;
  title: string;
  slug: string;
  instructor: string;
  description: string;
  price: string;
  duration_hours: number;
  lessons_count: number;
  level: string;
  category: string;
  image: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  average_rating?: number;
  reviews_count?: number;
  enrolled_count?: number;
}

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [newArrivals, setNewArrivals] = useState<Book[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [courseCategories, setCourseCategories] = useState<{ id: number; name: string; slug: string; count: number; last_course?: { id: number; title: string; image: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_books: 0, total_courses: 0, total_students: 0, book_average_rating: 0, course_average_rating: 0 });
  const { checkWishlist } = useWishlist();

  useEffect(() => {
    Promise.allSettled([
      api.get<{ data: ApiBook[] }>('/books', { featured: 'true' }),
      api.get<{ data: ApiBook[] }>('/books', { sort: 'newest' }),
      api.get<ApiCategory[]>('/categories'), // Note: Backend should return newest book cover per category
      api.get<{ data: ApiCourse[] }>('/courses', { featured: 'true' }),
      api.get<{ data: ApiCourse[] }>('/courses'),
      api.get<{ total_books: number; total_courses: number; total_students: number; book_average_rating: number; course_average_rating: number }>('/stats'),
      api.get<{ id: number; name: string; slug: string; count: number }[]>('/staff/course-categories'),
    ])
      .then((results) => {
        const [featuredRes, allRes, catRes, featuredCoursesRes, allCoursesRes, statsRes, courseCatRes] = results;
        
        const featured = featuredRes.status === 'fulfilled' 
          ? (featuredRes.value.data || []).map(mapApiBookToBook) 
          : [];
          
        const allBooks = allRes.status === 'fulfilled' 
          ? (allRes.value.data || []).map(mapApiBookToBook) 
          : [];
          
        const newArr = allBooks.slice(0, 6);
        
        const featCourses = featuredCoursesRes.status === 'fulfilled' 
          ? (featuredCoursesRes.value.data || []).map((c) => ({
              id: c.id,
              title: c.title,
              slug: c.slug,
              instructor: c.instructor,
              description: c.description,
              price: parseFloat(c.price),
              duration_hours: c.duration_hours,
              lessons_count: c.lessons_count,
              level: c.level,
              category: c.category,
              image: c.image,
              is_featured: c.is_featured,
              average_rating: c.average_rating,
              reviews_count: c.reviews_count,
              enrolled_count: c.enrolled_count,
              createdAt: c.created_at,
            })) 
          : [];
          
        const allCour = allCoursesRes.status === 'fulfilled' 
          ? (allCoursesRes.value.data || []).map((c) => ({
              id: c.id,
              title: c.title,
              slug: c.slug,
              instructor: c.instructor,
              description: c.description,
              price: parseFloat(c.price),
              duration_hours: c.duration_hours,
              lessons_count: c.lessons_count,
              level: c.level,
              category: c.category,
              image: c.image,
              is_featured: c.is_featured,
              average_rating: c.average_rating,
              reviews_count: c.reviews_count,
              enrolled_count: c.enrolled_count,
              createdAt: c.created_at,
            })) 
          : [];

        setFeaturedBooks(featured);
        setNewArrivals(newArr);
        setFeaturedCourses(featCourses);
        setAllCourses(allCour);
        
        // Group books by category and find newest book for each category
        const newestBooksByCategory: Record<string, Book> = {};
        allBooks.forEach(book => {
          if (book.category) {
            if (!newestBooksByCategory[book.category] || 
                new Date(book.createdAt) > new Date(newestBooksByCategory[book.category].createdAt)) {
              newestBooksByCategory[book.category] = book;
            }
          }
        });
        
         // Enhance categories with newest book cover
        const categoriesData = catRes.status === 'fulfilled' ? catRes.value : [];
        const enhancedCategories = (categoriesData || []).map(cat => ({
          ...cat,
          last_book: newestBooksByCategory[cat.name] ? {
            id: Number(newestBooksByCategory[cat.name].id),
            title: newestBooksByCategory[cat.name].title,
            cover_url: newestBooksByCategory[cat.name].coverUrl
          } : undefined
        }));
        
        setCategories(enhancedCategories);

        // Group courses by category and find newest course for each category
        const newestCoursesByCategory: Record<string, Course> = {};
        allCour.forEach(course => {
          if (course.category) {
            if (!newestCoursesByCategory[course.category] || 
                new Date(course.createdAt) > new Date(newestCoursesByCategory[course.category].createdAt)) {
              newestCoursesByCategory[course.category] = course;
            }
          }
        });

        // Enhance course categories with newest course preview
        const courseCategoriesData = courseCatRes.status === 'fulfilled' ? courseCatRes.value : [];
        const enhancedCourseCategories = (courseCategoriesData || []).map(cat => ({
          ...cat,
          last_course: newestCoursesByCategory[cat.slug] ? {
            id: newestCoursesByCategory[cat.slug].id,
            title: newestCoursesByCategory[cat.slug].title,
            image: newestCoursesByCategory[cat.slug].image
          } : undefined
        }));

        setCourseCategories(enhancedCourseCategories);
        
        if (statsRes.status === 'fulfilled' && statsRes.value) {
          setStats(statsRes.value);
        }

        const allBookIds = [...featured, ...newArr].map(b => b.id);
        if (allBookIds.length > 0) {
          checkWishlist(allBookIds);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Seamless ticker: continuously scroll featured book cards leftwards.
  const router = useRouter();

  function SeamlessTicker({ books, speed = 40 }: { books: Book[]; speed?: number }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);

    // Interaction refs
    const isDraggingRef = useRef(false);
    const pointerIdRef = useRef<number | null>(null);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const lastXRef = useRef(0);
    const lastTimeRef = useRef(0);
    const velocityRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track || books.length === 0) return;

      let width = track.scrollWidth / 2;
      let x = 0;
      let last = performance.now();
      lastTimeRef.current = last;

      const step = (now: number) => {
        const dt = now - last;
        last = now;

        if (!isDraggingRef.current) {
          // Auto-scroll when not dragging
          x -= (speed * dt) / 1000;
          // Apply small velocity momentum after drag ends (velocity measured in px/frame)
          if (Math.abs(velocityRef.current) > 0.5) {
            x += velocityRef.current * (dt / 16);
            velocityRef.current *= 0.92; // stronger decay for stability
          } else {
            velocityRef.current = 0;
          }
        }

        // wrap-around logic for duplicated track
        if (x <= -width) x += width;
        if (x >= 0) x -= width;

        track.style.transform = `translateX(${x}px)`;
        rafRef.current = requestAnimationFrame(step);
      };

      const onResize = () => {
        width = track.scrollWidth / 2;
      };

       const onPointerDown = (e: PointerEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        pointerIdRef.current = e.pointerId;
        startXRef.current = e.clientX;
        startYRef.current = e.clientY;
        lastXRef.current = e.clientX;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
        try { container.setPointerCapture(e.pointerId); } catch (err) {}
        track.style.cursor = 'grabbing';
        track.classList.add('pointer-events-none');
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) return;
        const nowMove = performance.now();
        const dtMove = Math.max(1, nowMove - lastTimeRef.current);
        const dx = e.clientX - lastXRef.current;
        lastXRef.current = e.clientX;
        lastTimeRef.current = nowMove;
        // move track by dx
        x += dx;
        // velocity in px/frame approximation
        const v = (dx / dtMove) * 16;
        // clamp velocity to avoid instability
        velocityRef.current = Math.max(-300, Math.min(300, v));
      };

       const onPointerUp = (e: PointerEvent) => {
        if (pointerIdRef.current !== e.pointerId) return;
        // detect tap (small movement & short time)
        const dxTotal = Math.abs(e.clientX - startXRef.current);
        const dyTotal = Math.abs(e.clientY - startYRef.current);
        const timeElapsed = performance.now() - lastTimeRef.current;

        isDraggingRef.current = false;
        pointerIdRef.current = null;
        try { container.releasePointerCapture(e.pointerId); } catch (err) {}
        track.style.cursor = 'grab';
        track.classList.remove('pointer-events-none');

        // Only navigate if it's a click/tap (not a drag)
        if (dxTotal < 6 && dyTotal < 6 && timeElapsed < 500) {
          const el = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
          const anchor = el?.closest && el.closest('a');
          if (anchor) {
            const href = anchor.getAttribute('href');
            if (href) {
              router.push(href);
            }
          }
        }
      };

      window.addEventListener('resize', onResize);
      // attach pointer listeners to container so capture works consistently
      container.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);

      rafRef.current = requestAnimationFrame(step);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.removeEventListener('resize', onResize);
        container.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };
    }, [books, speed]);

    if (!books || books.length === 0) return <div className="h-80 grid place-items-center">No featured books</div>;

    return (
      <div ref={containerRef} className="overflow-hidden" style={{ touchAction: 'pan-y', userSelect: 'none' }}>
        <div ref={trackRef} className="flex items-center gap-6 will-change-transform" style={{ transform: 'translateX(0)', cursor: 'grab' }}>
          {books.concat(books).map((b, i) => (
            <div key={`${b.id}-${i}`} className="flex-shrink-0 w-56">
              <BookCard book={b} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Category ticker: similar seamless ticker for categories
  function CategoryTicker({ cats, speed = 30, router }: { cats: ApiCategory[]; speed?: number; router: any }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const isDraggingRef = useRef(false);
    const pointerIdRef = useRef<number | null>(null);
    const startXRef = useRef(0);
    const lastXRef = useRef(0);
    const lastTimeRef = useRef(0);
    const velocityRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track || !cats || cats.length === 0) return;

      let width = track.scrollWidth / 2;
      let x = 0;
      let last = performance.now();

      const step = (now: number) => {
        const dt = now - last;
        last = now;

        if (!isDraggingRef.current) {
          x -= (speed * dt) / 1000;
          if (Math.abs(velocityRef.current) > 0.5) {
            x += velocityRef.current * (dt / 16);
            velocityRef.current *= 0.92;
          } else {
            velocityRef.current = 0;
          }
        }

        if (x <= -width) x += width;
        if (x >= 0) x -= width;

        track.style.transform = `translateX(${x}px)`;
        rafRef.current = requestAnimationFrame(step);
      };

      const onResize = () => {
        width = track.scrollWidth / 2;
      };

      const onPointerDown = (e: PointerEvent) => {
        isDraggingRef.current = true;
        pointerIdRef.current = e.pointerId;
        startXRef.current = e.clientX;
        lastXRef.current = e.clientX;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
        try { container.setPointerCapture(e.pointerId); } catch (err) {}
        track.style.cursor = 'grabbing';
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) return;
        const nowMove = performance.now();
        const dtMove = Math.max(1, nowMove - lastTimeRef.current);
        const dx = e.clientX - lastXRef.current;
        lastXRef.current = e.clientX;
        lastTimeRef.current = nowMove;
        x += dx;
        const v = (dx / dtMove) * 16;
        velocityRef.current = Math.max(-300, Math.min(300, v));
      };

      const onPointerUp = (e: PointerEvent) => {
        if (pointerIdRef.current !== e.pointerId) return;
        isDraggingRef.current = false;
        pointerIdRef.current = null;
        try { container.releasePointerCapture(e.pointerId); } catch (err) {}
        track.style.cursor = 'grab';
      };

      window.addEventListener('resize', onResize);
      container.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);

      rafRef.current = requestAnimationFrame(step);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.removeEventListener('resize', onResize);
        container.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };
    }, [cats, speed]);

    if (!cats || cats.length === 0) return <div className="h-40 grid place-items-center">No categories</div>;

    return (
      <div ref={containerRef} className="overflow-hidden" style={{ touchAction: 'pan-y', userSelect: 'none' }}>
        <div ref={trackRef} className="flex items-center gap-6 will-change-transform" style={{ transform: 'translateX(0)', cursor: 'grab' }}>
          {cats.concat(cats).map((c, i) => (
             <Link
              key={`${c.id}-${i}`}
              href={`/shop?category=${encodeURIComponent(c.name)}`}
              className="flex-shrink-0 w-56 h-72 rounded-2xl overflow-hidden relative group hover:scale-105 transition-transform shadow-lg cursor-grab active:cursor-grabbing"
              onClick={(e) => e.preventDefault()}
              draggable={false}
            >
              {/* Background Image */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80">
                <img
                  src={c.last_book?.cover_url || getBookPlaceholder(c.name)}
                  alt={c.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              {/* Category Name Tag */}
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1.5 bg-white/95 rounded-full text-xs font-bold text-gray-900 shadow-lg">
                  {c.name}
                </span>
              </div>
              
              {/* Book Count Tag */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-lg">{c.name}</p>
                      <p className="text-white/70 text-sm">{c.books_count || 0} Books</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/shop?category=${encodeURIComponent(c.name)}`);
                      }}
                      className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform hover:bg-orange-600 z-30 cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Course Category ticker: seamless ticker for course categories
  function CourseCategoryTicker({ cats, speed = 30, router }: { 
    cats: { id: number; name: string; slug: string; count: number; last_course?: { id: number; title: string; image: string } }[]; 
    speed?: number; 
    router: any 
  }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const isDraggingRef = useRef(false);
    const pointerIdRef = useRef<number | null>(null);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const lastXRef = useRef(0);
    const lastTimeRef = useRef(0);
    const velocityRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track || !cats || cats.length === 0) return;

      let width = track.scrollWidth / 2;
      let x = 0;
      let last = performance.now();

      const step = (now: number) => {
        const dt = now - last;
        last = now;

        if (!isDraggingRef.current) {
          x -= (speed * dt) / 1000;
          if (Math.abs(velocityRef.current) > 0.5) {
            x += velocityRef.current * (dt / 16);
            velocityRef.current *= 0.92;
          } else {
            velocityRef.current = 0;
          }
        }

        if (x <= -width) x += width;
        if (x >= 0) x -= width;

        track.style.transform = `translateX(${x}px)`;
        rafRef.current = requestAnimationFrame(step);
      };

      const onResize = () => {
        width = track.scrollWidth / 2;
      };

      const onPointerDown = (e: PointerEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        pointerIdRef.current = e.pointerId;
        startXRef.current = e.clientX;
        startYRef.current = e.clientY;
        lastXRef.current = e.clientX;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
        try { container.setPointerCapture(e.pointerId); } catch (err) {}
        track.style.cursor = 'grabbing';
        track.classList.add('pointer-events-none');
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) return;
        const nowMove = performance.now();
        const dtMove = Math.max(1, nowMove - lastTimeRef.current);
        const dx = e.clientX - lastXRef.current;
        lastXRef.current = e.clientX;
        lastTimeRef.current = nowMove;
        x += dx;
        const v = (dx / dtMove) * 16;
        velocityRef.current = Math.max(-300, Math.min(300, v));
      };

      const onPointerUp = (e: PointerEvent) => {
        if (pointerIdRef.current !== e.pointerId) return;
        const dxTotal = Math.abs(e.clientX - startXRef.current);
        const dyTotal = Math.abs(e.clientY - startYRef.current);
        const timeElapsed = performance.now() - lastTimeRef.current;

        isDraggingRef.current = false;
        pointerIdRef.current = null;
        try { container.releasePointerCapture(e.pointerId); } catch (err) {}
        track.style.cursor = 'grab';
        track.classList.remove('pointer-events-none');

        // Only navigate if it's a click/tap (not a drag)
        if (dxTotal < 6 && dyTotal < 6 && timeElapsed < 500) {
          const el = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
          const anchor = el?.closest && el.closest('a');
          if (anchor) {
            const href = anchor.getAttribute('href');
            if (href) {
              router.push(href);
            }
          }
        }
      };

      window.addEventListener('resize', onResize);
      container.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);

      rafRef.current = requestAnimationFrame(step);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.removeEventListener('resize', onResize);
        container.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };
    }, [cats, speed, router]);

    if (!cats || cats.length === 0) return <div className="h-40 grid place-items-center">No course categories</div>;

    return (
      <div ref={containerRef} className="overflow-hidden" style={{ touchAction: 'pan-y', userSelect: 'none' }}>
        <div ref={trackRef} className="flex items-center gap-6 will-change-transform" style={{ transform: 'translateX(0)', cursor: 'grab' }}>
          {cats.concat(cats).map((c, i) => (
            <Link
              key={`${c.id}-${i}`}
              href={`/courses?category=${encodeURIComponent(c.name)}`}
              className="flex-shrink-0 w-56 h-72 rounded-2xl overflow-hidden relative group hover:scale-105 transition-transform shadow-lg cursor-grab active:cursor-grabbing"
              onClick={(e) => e.preventDefault()}
              draggable={false}
            >
              {/* Background Image */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80">
                <img
                  src={c.last_course?.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'}
                  alt={c.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              {/* Category Name Tag */}
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1.5 bg-white/95 rounded-full text-xs font-bold text-gray-900 shadow-lg">
                  {c.name}
                </span>
              </div>
              
              {/* Course Count and Arrow */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-lg">{c.name}</p>
                    <p className="text-white/70 text-sm">{c.count || 0} Courses</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/courses?category=${encodeURIComponent(c.name)}`);
                    }}
                    className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform hover:bg-orange-600 z-30 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-32 pb-20">
      <div className="space-y-8 bg-white/80 backdrop-blur-sm rounded-3xl  p-8">
      {/* ====================================================== START: HERO SECTION ====================================================== */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden rounded-3xl bg-gray-900 text-white p-8 md:p-16 lg:p-24"
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-orange-600/15 to-transparent rounded-full blur-3xl"
          />
        </div>

        {/* Floating icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[BookOpen, GraduationCap, Library, Star].map((Icon, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 6 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
              className="absolute text-orange-400"
              style={{
                top: `${20 + i * 15}%`,
                right: `${10 + i * 20}%`,
              }}
            >
              <Icon className="w-12 h-12" />
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-orange-400 mb-6"
          >
            <Sparkles className="w-3 h-3" />
            <span>Welcome to The English Channel</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-8"
          >
            Learn, Read & <span className="text-orange-500 italic">Grow</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-400 mb-10 leading-relaxed max-w-lg"
          >
            Discover expert-led courses and hand-picked books to accelerate your learning journey.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              href="/courses"
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full font-bold hover:shadow-xl hover:shadow-orange-500/30 transition-all transform hover:scale-105 active:scale-95"
            >
              Explore Courses
            </Link>
            <Link
              href="/shop"
              className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-full font-bold hover:bg-white/20 transition-all border border-white/10"
            >
              Browse Books
            </Link>
          </motion.div>
        </div>
      </motion.section>
      {/* ====================================================== END: HERO SECTION ====================================================== */}

      {/* ====================================================== START: STATS SECTION ====================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 bg-white rounded-3xl shadow-sm p-8 ">
        <AnimatedCounter
          end={stats.total_books}
          suffix="+"
          label="Books Available"
          icon={<Library className="w-8 h-8" />}
        />
        <AnimatedCounter
          end={stats.total_courses}
          suffix="+"
          label="Expert Courses"
          icon={<GraduationCap className="w-8 h-8" />}
        />
        <AnimatedCounter
          end={stats.total_students}
          suffix="+"
          label="Active Students"
          icon={<Users className="w-8 h-8" />}
        />
        <AnimatedCounter
          end={stats.book_average_rating}
          decimals={1}
          label="Book Rating"
          icon={<Star className="w-8 h-8" />}
        />
        <AnimatedCounter
          end={stats.course_average_rating}
          decimals={1}
          label="Course Rating"
          icon={<Star className="w-8 h-8" />}
        />
      </section>
      {/* ====================================================== END: STATS SECTION ====================================================== */}

      {/* ====================================================== START: FEATURED COURSES SECTION ====================================================== */}
      {featuredCourses.length > 0 && (
        <section className="bg-white rounded-3xl shadow-sm p-8 ">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full text-sm font-bold text-orange-600 uppercase tracking-wider mb-4">
                <GraduationCap className="w-4 h-4" />
                Featured Courses
              </div>
              <h2 className="font-serif text-4xl font-bold text-gray-900 mb-2">
                Learn from the <span className="text-orange-600 italic">Best</span>
              </h2>
              <p className="text-gray-500">Hand-picked courses to accelerate your learning.</p>
            </div>
            <Link
              href="/courses"
              className="group flex items-center gap-2 text-sm font-bold text-orange-600 uppercase tracking-widest"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Course Hero - Auto-rotating showcase */}
          <div className="mb-8">
            <CourseHero courses={featuredCourses} />
          </div>

          {/* Course Grid */}
          {featuredCourses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.slice(0, 6).map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </div>
          )}
        </section>
      )}
      {/* ====================================================== END: FEATURED COURSES SECTION ====================================================== */}

      {/* ====================================================== START: COURSE CATEGORIES SECTION ====================================================== */}
      {courseCategories.length > 0 && (
        <section className="bg-white rounded-3xl p-12 border border-gray-100">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full text-sm font-bold text-orange-600 uppercase tracking-wider mb-6">
              <GraduationCap className="w-4 h-4" />
              Browse by Course Category
            </div>
            <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4">Explore Course Categories</h2>
            <p className="text-gray-500">Find your perfect course category and start learning today.</p>
          </div>
          <div>
            <CourseCategoryTicker cats={courseCategories} router={router} />
          </div>
        </section>
      )}
      {/* ====================================================== END: COURSE CATEGORIES SECTION ====================================================== */}

      {/* ====================================================== START: COURSE BENEFITS SECTION ====================================================== */}
      <section className="bg-white rounded-3xl shadow-sm p-12 md:p-16">
        <CourseBenefits />
      </section>
      {/* ====================================================== END: COURSE BENEFITS SECTION ====================================================== */}

      {/* ====================================================== START: FEATURED BOOKS SECTION ====================================================== */}
      <section className="bg-white rounded-3xl shadow-sm p-8 ">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full text-sm font-bold text-orange-600 uppercase tracking-wider mb-4">
              <BookOpen className="w-4 h-4" />
              Featured Books
            </div>
            <h2 className="font-serif text-4xl font-bold text-gray-900 mb-2">
              Editor's <span className="text-orange-600 italic">Picks</span>
            </h2>
            <p className="text-gray-500">Our top recommendations for this month.</p>
          </div>
          <Link
            href="/shop"
            className="group flex items-center gap-2 text-sm font-bold text-orange-600 uppercase tracking-widest"
          >
            <span>Browse All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {featuredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {featuredBooks.slice(0, 10).map((book, index) => (
              <BookCard key={book.id} book={book} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No featured books yet</h3>
            <p className="text-gray-500">Check back soon for our curated selections!</p>
          </div>
        )}
      </section>
      {/* ====================================================== END: FEATURED BOOKS SECTION ====================================================== */}

      {/* ====================================================== START: CATEGORIES SECTION ====================================================== */}
      {categories.length > 0 && (
        <section className="bg-white rounded-3xl p-12 border border-gray-100">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full text-sm font-bold text-orange-600 uppercase tracking-wider mb-6">
              <Sparkles className="w-4 h-4" />
              Browse by Category
            </div>
            <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4">Explore Categories</h2>
            <p className="text-gray-500">Find your favorite genre and dive into a new world.</p>
          </div>
          <div>
            <CategoryTicker cats={categories} router={router} />
          </div>
        </section>
      )}
      {/* ====================================================== END: CATEGORIES SECTION ====================================================== */}

      {/* ====================================================== START: NEW ARRIVALS SECTION ====================================================== */}
      <section className="bg-white rounded-3xl shadow-sm p-8 ">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm font-bold text-blue-600 uppercase tracking-wider mb-4">
              <Sparkles className="w-4 h-4" />
              Just Arrived
            </div>
            <h2 className="font-serif text-4xl font-bold text-gray-900 mb-2">
              New <span className="text-orange-600 italic">Arrivals</span>
            </h2>
            <p className="text-gray-500">Freshly added to our collection.</p>
          </div>
          <Link
            href="/shop"
            className="group flex items-center gap-2 text-sm font-bold text-orange-600 uppercase tracking-widest"
          >
            <span>See All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {newArrivals.map((book, index) => (
              <BookCard key={book.id} book={book} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No new arrivals</h3>
            <p className="text-gray-500">New books will be added soon!</p>
          </div>
        )}
      </section>
      {/* ====================================================== END: NEW ARRIVALS SECTION ====================================================== */}

      {/* ====================================================== START: CTA SECTION ====================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-3xl shadow-sm p-8 ">
        {/* Books CTA */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 p-12 text-white group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <BookOpen className="w-12 h-12 mb-6 opacity-80" />
            <h3 className="font-serif text-3xl font-bold mb-4">Discover Great Books</h3>
            <p className="text-orange-100 mb-8 leading-relaxed">
              Explore our curated collection of literary masterpieces.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-full font-bold hover:shadow-xl transition-all transform hover:scale-105"
            >
              Start Reading
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>

        {/* Courses CTA */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-12 text-white group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <GraduationCap className="w-12 h-12 mb-6 opacity-80" />
            <h3 className="font-serif text-3xl font-bold mb-4">Master New Skills</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Learn from expert instructors with our comprehensive courses.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full font-bold hover:shadow-xl hover:shadow-orange-500/30 transition-all transform hover:scale-105"
            >
              Start Learning
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>
      {/* ====================================================== END: CTA SECTION ====================================================== */}
      </div>
    </div>
  );
}
