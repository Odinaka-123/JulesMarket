"use client";

import { useState, useEffect } from "react";
import { motion} from "framer-motion";
import { db } from "@/lib/firebase/client";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { MarketDay } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, ShoppingBasket} from "lucide-react";

const CATEGORIES = [
  { emoji: "🥬", label: "Vegetables", items: "Tomato, Pepper, Cabbage, Carrot…" },
  { emoji: "🍊", label: "Fruits", items: "Orange, Pineapple, Apple, Grapes…" },
  { emoji: "🥩", label: "Meat", items: "Cow, Goat, Snail, Pig…" },
  { emoji: "🐟", label: "Fish & Seafood", items: "Titus, Croaker, Snapper, Shrimps…" },
  { emoji: "🌾", label: "Grains", items: "Rice, Beans, Fiofio…" },
  { emoji: "🥔", label: "Tubers", items: "Yam, Potato…" },
  { emoji: "🛒", label: "Processed Foods", items: "Palm Oil, Crayfish, Semolina…" },
];

const TERMS = [
  "Payment validates your order",
  "Prices are non-negotiable once posted",
  "Late bookings move to the next schedule",
  "Delivery is not free",
  "No exchange once slots are finalised",
  "Unique requests go through DM",
];

const floatingEmojis = [
  { emoji: "🥬", x: "8%", y: "18%", delay: 0, dur: 3.4 },
  { emoji: "🍅", x: "88%", y: "12%", delay: 0.5, dur: 2.9 },
  { emoji: "🥕", x: "5%", y: "72%", delay: 0.9, dur: 3.6 },
  { emoji: "🌽", x: "91%", y: "68%", delay: 0.3, dur: 3.1 },
  { emoji: "🍋", x: "15%", y: "88%", delay: 1.1, dur: 2.7 },
  { emoji: "🧅", x: "80%", y: "85%", delay: 0.7, dur: 3.3 },
  { emoji: "🍍", x: "75%", y: "35%", delay: 1.3, dur: 2.8 },
  { emoji: "🥦", x: "20%", y: "50%", delay: 0.4, dur: 3.0 },
];

export default function HomePage() {
  const router = useRouter();
  const [activeMarketDay, setActiveMarketDay] = useState<MarketDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function fetchActiveDay() {
      try {
        const q = query(
          collection(db, "market_days"),
          where("status", "==", "open"),
          orderBy("date", "asc"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as MarketDay;
          // Only set if deadline hasn't passed
          if (new Date(data.deadline) > new Date()) {
            setActiveMarketDay(data);
            // Auto-redirect after short delay so hero is seen briefly
            setTimeout(() => {
              setRedirecting(true);
              setTimeout(() => router.push(`/order/${data.id}`), 800);
            }, 2200);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchActiveDay();
  }, [router]);

  return (
    <main className="min-h-dvh bg-[#0a1a0a] text-white overflow-x-hidden">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-48 w-125 h-125 bg-green-700 rounded-full opacity-[0.12] blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-emerald-500 rounded-full opacity-[0.08] blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 w-100 h-100 bg-green-600 rounded-full opacity-[0.10] blur-3xl" />
      </div>

      {/* Grid */}
      <div
        className="fixed inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating emojis */}
      <div className="fixed inset-0 pointer-events-none hidden sm:block">
        {floatingEmojis.map((item, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl select-none"
            style={{ left: item.x, top: item.y }}
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: item.dur, delay: item.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="opacity-[0.15]">{item.emoji}</span>
          </motion.div>
        ))}
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 border-b border-white/5 bg-black/10 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <span className="font-black text-lg tracking-tight">
              Jules<span className="text-green-400">Market</span>
            </span>
          </div>
          <Link href="/login">
            <span className="text-xs text-white/30 hover:text-white/60 transition px-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10">
              Admin →
            </span>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20 text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-2 rounded-full mb-6"
        >
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Best Price & Quality Near You
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-5"
        >
          Fresh from the{" "}
          <span className="relative inline-block">
            <span className="text-green-400">market</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-1 left-0 right-0 h-0.5 bg-green-400/40 origin-left"
            />
          </span>
          ,<br />
          straight to your door
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/40 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8"
        >
          Skip the stress of visiting markets. Buy in bulk with our community,
          save on transport, and get quality foodstuffs delivered.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          {loading ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3.5 rounded-2xl text-white/30 text-sm">
              <div className="w-4 h-4 border-2 border-white/20 border-t-green-400 rounded-full animate-spin" />
              Checking market days…
            </div>
          ) : activeMarketDay ? (
            <motion.div
              animate={redirecting ? { scale: 0.97, opacity: 0.7 } : {}}
              className="w-full sm:w-auto"
            >
              <Link href={`/order/${activeMarketDay.id}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-black px-8 py-4 rounded-2xl text-sm transition-colors shadow-2xl shadow-green-500/25 cursor-pointer"
                >
                  {redirecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Taking you there…
                    </>
                  ) : (
                    <>
                      <ShoppingBasket className="w-4 h-4" />
                      Order Now — Market Day Active
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.div>
              </Link>
              <p className="text-white/30 text-xs mt-2 text-center">
                📅 {new Date(activeMarketDay.date).toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric" })}
                {" · "}
                🕐 Deadline {new Date(activeMarketDay.deadline).toLocaleString("en-NG", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
              </p>
            </motion.div>
          ) : (
            <div className="bg-white/3 border border-white/10 rounded-2xl px-6 py-4 text-center">
              <p className="text-white/40 text-sm">No active market day right now</p>
              <p className="text-white/20 text-xs mt-1">Join the group to get notified when the next one opens 👇</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* ── What we offer ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-black mb-2">What we offer</h2>
          <p className="text-white/30 text-sm">Fresh, quality foodstuffs sourced directly from traders & farmers</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="bg-white/3 border border-white/8 hover:border-green-500/30 hover:bg-green-500/5 rounded-2xl p-4 transition-all duration-200 group"
            >
              <div className="text-2xl mb-2">{cat.emoji}</div>
              <p className="font-bold text-sm text-white mb-1">{cat.label}</p>
              <p className="text-white/25 text-xs leading-relaxed line-clamp-2">{cat.items}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-black mb-2">How it works</h2>
          <p className="text-white/30 text-sm">Three simple steps to fresh groceries</p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { step: "01", title: "Wait for the announcement", desc: "Jules posts a market day notification with the date and deadline. Join the WhatsApp group to get notified.", emoji: "📢" },
            { step: "02", title: "Place your order", desc: "Browse available items, select what you need with quantities, and submit before the deadline.", emoji: "📝" },
            { step: "03", title: "Pay & receive", desc: "Confirm payment via bank transfer. Pick up at our location or arrange delivery via Bolt/Uber/InDrive.", emoji: "✅" },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-5 relative overflow-hidden"
            >
              <span className="absolute top-3 right-4 text-5xl font-black text-white/4 leading-none select-none">{s.step}</span>
              <div className="text-2xl mb-3">{s.emoji}</div>
              <h3 className="font-bold text-sm text-white mb-2">{s.title}</h3>
              <p className="text-white/30 text-xs leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Terms ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white/3 border border-white/8 rounded-3xl p-6 sm:p-8"
        >
          <h2 className="text-xl sm:text-2xl font-black mb-5">Our terms are simple ☑️</h2>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {TERMS.map((term, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-start gap-2.5"
              >
                <span className="text-green-400 mt-0.5 shrink-0 text-sm">☑️</span>
                <p className="text-white/50 text-sm">{term}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Location ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-green-500/5 border border-green-500/15 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="font-bold text-sm text-white/60 uppercase tracking-wide mb-1">Our Location</p>
            <p className="font-black text-white text-base sm:text-lg leading-snug">
              35 Bode Fapounda Street (Formally Alor)
            </p>
            <p className="text-white/40 text-sm mt-0.5">
              Off Alhaji Agbeke Street, Marcity Bus Stop, Ago
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-6 px-4 text-center">
        <p className="text-white/20 text-xs">
          © 2026 JulesMarket · Fresh from the market 🥬 · Ago, Lagos
        </p>
      </footer>
    </main>
  );
}