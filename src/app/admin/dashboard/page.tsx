"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { MarketDay } from "@/types";
import Link from "next/link";

export default function DashboardPage() {
  const [marketDays, setMarketDays] = useState<MarketDay[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ date: "", deadline: "", notes: "" });

  useEffect(() => {
    const q = query(collection(db, "market_days"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMarketDays(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MarketDay)));
    });
    return () => unsub();
  }, []);

  async function handleCreate() {
    if (!form.date || !form.deadline) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "market_days"), {
        date: form.date,
        deadline: form.deadline,
        notes: form.notes,
        status: "open",
        createdAt: Timestamp.now().toDate().toISOString(),
      });
      setShowCreateModal(false);
      setForm({ date: "", deadline: "", notes: "" });
    } catch (e) {
      console.error(e);
    }
    setCreating(false);
  }

  async function handleSignOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/login";
  }

  const total = marketDays.length;
  const open = marketDays.filter((d) => d.status === "open").length;
  const closed = marketDays.filter((d) => d.status === "closed").length;
  const completed = marketDays.filter((d) => d.status === "completed").length;

  const statusStyle: Record<string, string> = {
    open: "bg-green-500/10 text-green-400 border-green-500/20",
    closed: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    completed: "bg-white/5 text-white/40 border-white/10",
  };

  const statusLabel: Record<string, string> = {
    open: "🟢 Open",
    closed: "🟡 Closed",
    completed: "✅ Done",
  };

  return (
    <main className="min-h-dvh bg-[#0a1a0a] text-white">

      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 sm:w-96 sm:h-96 bg-green-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 sm:w-96 sm:h-96 bg-emerald-500 rounded-full opacity-10 blur-3xl" />
      </div>

      {/* Grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🛒</span>
            <span className="font-black text-base sm:text-lg">
              Jules<span className="text-green-400">Market</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:flex text-xs text-white/30 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full items-center gap-1">
              🔐 Admin
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs text-white/40 hover:text-red-400 transition px-3 py-1.5 rounded-xl hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-black mb-1">
            Dashboard 👋
          </h1>
          <p className="text-white/40 text-xs sm:text-sm">
            Manage your market days and track orders
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8"
        >
          {[
            { label: "Total Days", value: total, emoji: "📅" },
            { label: "Open", value: open, emoji: "🟢" },
            { label: "Closed", value: closed, emoji: "🟡" },
            { label: "Completed", value: completed, emoji: "✅" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.05 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-3 sm:p-4"
            >
              <div className="text-xl sm:text-2xl mb-1.5">{s.emoji}</div>
              <div className="text-xl sm:text-2xl font-black">{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Market Days header row */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base sm:text-lg">Market Days</h2>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-colors shadow-lg shadow-green-500/20"
          >
            <span className="text-sm sm:text-base">+</span>
            <span className="hidden xs:inline">New</span> Market Day
          </motion.button>
        </div>

        {/* Empty state */}
        {marketDays.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 sm:py-24 border border-dashed border-white/10 rounded-2xl"
          >
            <div className="text-4xl sm:text-5xl mb-3">🥬</div>
            <p className="text-white/40 text-sm">No market days yet</p>
            <p className="text-white/20 text-xs mt-1">
              Tap the button above to create your first one
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {marketDays.map((day, i) => (
                <motion.div
                  key={day.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/admin/market-day/${day.id}`}>
                    <div className="bg-white/3 border border-white/8 hover:border-green-500/40 hover:bg-white/5 active:scale-[0.98] rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer group">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs border px-2.5 py-1 rounded-full font-medium ${statusStyle[day.status]}`}>
                          {statusLabel[day.status]}
                        </span>
                        <span className="text-white/20 group-hover:text-green-400 transition-colors text-base">
                          →
                        </span>
                      </div>
                      <p className="font-bold text-white text-sm sm:text-base leading-snug">
                        {new Date(day.date).toLocaleDateString("en-NG", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        🕐 Deadline:{" "}
                        {new Date(day.deadline).toLocaleString("en-NG", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {day.notes && (
                        <p className="text-white/25 text-xs mt-2 line-clamp-1">
                          📝 {day.notes}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
              className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:px-4"
            >
              <div className="bg-[#0f1f0f] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
                {/* Handle bar for mobile */}
                <div className="flex justify-center mb-4 sm:hidden">
                  <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>

                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-base sm:text-lg">
                    📅 New Market Day
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-white/30 hover:text-white/60 transition w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Market Date */}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-medium">
                      Market Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition [color-scheme:dark] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Order Deadline */}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-medium">
                      Order Deadline
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={form.deadline}
                        onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition [color-scheme:dark] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-medium">
                      Notes <span className="text-white/20">(optional)</span>
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="e.g. Ogbete main market, bring cash..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition resize-none placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white/60 text-sm transition"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreate}
                    disabled={creating || !form.date || !form.deadline}
                    className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
                  >
                    {creating ? "Creating..." : "Create 🛒"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}