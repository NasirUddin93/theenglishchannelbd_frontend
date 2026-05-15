'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, BookOpen, GraduationCap, Youtube, Bell, Facebook, Instagram, Linkedin, Quote, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function About() {
  const [email, setEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 30);
    launchDate.setHours(9, 0, 0, 0);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address to stay updated.');
      return;
    }
    toast.success(`Thank you! We'll notify ${email} as soon as we launch. Together, let's build a developed Bangladesh through English.`);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-hidden relative">
      {/* Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto px-6 py-12 lg:py-20 relative z-10">
        
        {/* Header section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 mb-2">The English Channel BD</h1>
          <p className="text-gray-500 font-medium tracking-wide uppercase text-sm md:text-base">Principal Md. Tafazzal Hussain — Official Learning Platform</p>
        </motion.div>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-bold shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            Upcoming Launch · 2026
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-serif font-bold leading-tight"
          >
            Your journey to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 font-extrabold block mt-2">English Excellence</span> starts here
          </motion.h2>

          {/* Professor Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl"
          >
            <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full overflow-hidden border-4 border-white shadow-md mb-4">
               {/* Fixed missing import or using simple div placeholder since no image URL provided */}
               <div className="w-full h-full bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-white text-3xl font-serif font-bold">MH</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Md. Tafazzal Hussain</h3>
            <p className="text-orange-600 font-medium mb-4">B.A 1st Div. 3rd Place | M.A in English (Lang), University of Dhaka</p>
            
            <div className="relative inline-block mx-auto max-w-xl">
              <Quote className="absolute -top-4 -left-6 w-8 h-8 text-orange-200" />
              <p className="text-xl md:text-2xl font-serif text-gray-700 italic">
                “Learning English to achieve the dreams of a developed Bangladesh”
              </p>
            </div>
            
            <p className="mt-6 text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Books, live courses, and exclusive video lectures — all in one place. We're preparing something extraordinary for you.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <a href="tel:+880171187112411" className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 shadow-sm rounded-full text-gray-700 font-semibold hover:border-orange-300 hover:text-orange-600 transition-all">
                <Phone className="w-4 h-4 text-orange-500" />
                01787-112411
              </a>
              <a href="mailto:mdtafazzalhussain1965@gmail.com" className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 shadow-sm rounded-full text-gray-700 font-semibold hover:border-orange-300 hover:text-orange-600 transition-all">
                <Mail className="w-4 h-4 text-orange-500" />
                mdtafazzalhussain1965@gmail.com
              </a>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { icon: BookOpen, text: "5+ Best-selling Books", color: "from-blue-500 to-cyan-400", bg: "bg-blue-50" },
              { icon: GraduationCap, text: "Live & Self-paced Courses", color: "from-emerald-500 to-green-400", bg: "bg-emerald-50" },
              { icon: Youtube, text: "Free Video Lecture Series", color: "from-red-500 to-rose-400", bg: "bg-red-50" }
            ].map((f, i) => (
              <div key={i} className={`p-6 ${f.bg} rounded-3xl border border-white/50 shadow-sm flex items-center justify-center gap-4 hover:-translate-y-1 transition-transform`}>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-lg`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-gray-800">{f.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Countdown timer */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-8"
          >
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Mins', value: timeLeft.minutes },
                { label: 'Secs', value: timeLeft.seconds }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-20 h-24 md:w-24 md:h-28 bg-white border border-gray-100 shadow-xl rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-bold font-mono text-gray-900 mb-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 pointer-events-none"></div>
                    <div className="absolute top-1/2 left-0 w-full h-px bg-gray-100/50 pointer-events-none"></div>
                    {item.value.toString().padStart(2, '0')}
                  </div>
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Registration / notify area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-xl mx-auto pt-8"
          >
            <form onSubmit={handleNotify} className="relative flex items-center shadow-2xl rounded-full bg-white border border-gray-200 overflow-hidden focus-within:ring-4 focus-within:ring-orange-500/20 focus-within:border-orange-400 transition-all">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to get launch updates" 
                className="w-full px-8 py-5 outline-none text-gray-700 bg-transparent flex-1"
              />
              <button type="submit" className="absolute right-2 px-6 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-orange-600 transition-colors flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notify me
              </button>
            </form>
            <p className="mt-4 text-sm font-medium text-gray-500">✨ Be the first to know about early-bird offers, free lecture access & book pre-orders.</p>
          </motion.div>

          {/* Social Links */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="pt-12 flex justify-center gap-6"
          >
            {[
              { icon: Facebook, href: "#" },
              { icon: Youtube, href: "#" },
              { icon: Instagram, href: "#" },
              { icon: Linkedin, href: "#" }
            ].map((social, i) => (
              <a key={i} href={social.href} className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm hover:scale-110">
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
