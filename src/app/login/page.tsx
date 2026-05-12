"use client";

import { auth } from "@/lib/firebase/client";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";

const ADMIN_EMAIL = "ezurikeodinaka@gmail.com";

const floatingItems = [
  { emoji: "🥬", x: "5%", y: "12%", delay: 0, duration: 3.2 },
  { emoji: "🍅", x: "85%", y: "8%", delay: 0.4, duration: 2.8 },
  { emoji: "🥕", x: "3%", y: "65%", delay: 0.8, duration: 3.5 },
  { emoji: "🌽", x: "88%", y: "60%", delay: 0.2, duration: 3.0 },
  { emoji: "🍋", x: "12%", y: "85%", delay: 1.0, duration: 2.6 },
  { emoji: "🧅", x: "78%", y: "82%", delay: 0.6, duration: 3.3 },
  { emoji: "🥦", x: "72%", y: "25%", delay: 1.2, duration: 2.9 },
  { emoji: "🍠", x: "18%", y: "42%", delay: 0.3, duration: 3.1 },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<"google" | "email">("google");

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.email !== ADMIN_EMAIL) {
        await auth.signOut();
        setError("Access denied. This login is for the admin only.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      const data = await res.json();
      console.log("Session response:", res.status, data);

      if (res.ok) {
        window.location.href = "/admin/dashboard";
      } else {
        setError(`Session error: ${data.error || res.status}`);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleEmailSignIn() {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      if (user.email !== ADMIN_EMAIL) {
        await auth.signOut();
        setError("Access denied. This login is for the admin only.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (res.ok) {
        window.location.href = "/admin/dashboard";
      } else {
        setError("Session error. Please try again.");
        setLoading(false);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password"
      ) {
        setError("Wrong email or password.");
      } else if (code === "auth/user-not-found") {
        setError("No account found with that email.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-[#0a1a0a] px-4 py-10">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 sm:w-96 sm:h-96 bg-green-600 rounded-full opacity-15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 sm:w-96 sm:h-96 bg-emerald-500 rounded-full opacity-15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 sm:w-175 sm:h-175 bg-green-700 rounded-full opacity-5 blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating items */}
      <div className="hidden sm:block">
        {floatingItems.map((item, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl sm:text-3xl select-none pointer-events-none"
            style={{ left: item.x, top: item.y }}
            animate={{ y: [0, -14, 0] }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="opacity-20">{item.emoji}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm sm:max-w-md"
      >
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.15,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex justify-center mb-5"
          >
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/40">
                <span className="text-3xl sm:text-4xl">🛒</span>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-1 rounded-2xl border border-green-500/20 border-dashed"
              />
            </div>
          </motion.div>

          {/* Heading */}
          <div className="text-center mb-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Jules<span className="text-green-400">Market</span>
            </h1>
            <p className="text-white/40 text-xs sm:text-sm mt-1">
              Fresh finds, delivered to your door 🌿
            </p>
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-full">
              🔐 Admin Portal
            </span>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-5">
            <button
              onClick={() => {
                setTab("google");
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                tab === "google" ?
                  "bg-green-500 text-black shadow"
                : "text-white/40 hover:text-white/60"
              }`}
            >
              {/* Google icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill={tab === "google" ? "#000" : "#4285F4"}
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill={tab === "google" ? "#000" : "#34A853"}
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill={tab === "google" ? "#000" : "#FBBC05"}
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill={tab === "google" ? "#000" : "#EA4335"}
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              onClick={() => {
                setTab("email");
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                tab === "email" ?
                  "bg-green-500 text-black shadow"
                : "text-white/40 hover:text-white/60"
              }`}
            >
              <Mail className="w-4 h-4 shrink-0" />
              Email
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {tab === "google" ?
              <motion.div
                key="google"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3.5 sm:py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg shadow-black/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ?
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  : <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  }
                  {loading ? "Signing in..." : "Continue with Google"}
                </motion.button>
              </motion.div>
            : <motion.div
                key="email"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                    className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleEmailSignIn()
                      }
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition p-1"
                    >
                      {showPassword ?
                        <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleEmailSignIn}
                  disabled={loading || !email || !password}
                  className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 mt-1"
                >
                  {loading ?
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </span>
                  : "Sign in →"}
                </motion.button>
              </motion.div>
            }
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4 sm:my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/20 text-xs">not the admin?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Customer CTA */}
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 border border-green-500/30 hover:border-green-500/60 hover:bg-green-500/5 text-green-400 font-medium py-3 sm:py-3.5 px-6 rounded-2xl transition-all duration-200 cursor-pointer text-sm"
            >
              <span>🛍️</span>
              Place an order
            </motion.div>
          </Link>
        </div>

        <p className="text-center text-white/20 text-xs mt-5">
          © 2026 JulesMarket · Fresh from the market 🥬
        </p>
      </motion.div>
    </main>
  );
}
