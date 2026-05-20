"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Check,
  Package,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  defaultPrice?: number;
  available: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { label: "Vegetables", emoji: "🥬" },
  { label: "Tubers", emoji: "🥔" },
  { label: "Meat", emoji: "🥩" },
  { label: "Fruits", emoji: "🍊" },
  { label: "Fish & Seafood", emoji: "🐟" },
  { label: "Processed Foods", emoji: "🛒" },
  { label: "Grains", emoji: "🌾" },
];

const UNITS = [
  "kg",
  "g",
  "pieces",
  "bags",
  "bunches",
  "litres",
  "cups",
  "wraps",
  "tubers",
  "crates",
  "packs",
];

const BLANK_FORM = {
  name: "",
  category: "Vegetables",
  unit: "kg",
  defaultPrice: "",
  available: true,
};

// ── Seed data (first-time setup) ───────────────────────────────────────────

const SEED_PRODUCTS: Omit<Product, "id" | "createdAt">[] = [
  // Vegetables
  {
    name: "Cabbage (White)",
    category: "Vegetables",
    unit: "pieces",
    available: true,
  },
  {
    name: "Cabbage (Purple)",
    category: "Vegetables",
    unit: "pieces",
    available: true,
  },
  { name: "Tomato", category: "Vegetables", unit: "kg", available: true },
  { name: "Pepper", category: "Vegetables", unit: "kg", available: true },
  { name: "Red Onion", category: "Vegetables", unit: "kg", available: true },
  { name: "Carrot", category: "Vegetables", unit: "kg", available: true },
  {
    name: "Spring Onion",
    category: "Vegetables",
    unit: "bunches",
    available: true,
  },
  { name: "Broccoli", category: "Vegetables", unit: "pieces", available: true },
  {
    name: "Cauliflower",
    category: "Vegetables",
    unit: "pieces",
    available: true,
  },
  { name: "Cucumber", category: "Vegetables", unit: "pieces", available: true },
  { name: "Celery", category: "Vegetables", unit: "bunches", available: true },
  { name: "Bell Pepper", category: "Vegetables", unit: "kg", available: true },
  { name: "Banana", category: "Vegetables", unit: "bunches", available: true },
  { name: "Plantain", category: "Vegetables", unit: "pieces", available: true },
  // Tubers
  { name: "Potato", category: "Tubers", unit: "kg", available: true },
  { name: "Yam", category: "Tubers", unit: "tubers", available: true },
  // Meat
  { name: "Cow Meat", category: "Meat", unit: "kg", available: true },
  { name: "Goat Meat", category: "Meat", unit: "kg", available: true },
  { name: "Snail", category: "Meat", unit: "pieces", available: true },
  { name: "Pig Meat", category: "Meat", unit: "kg", available: true },
  // Fruits
  { name: "Orange", category: "Fruits", unit: "pieces", available: true },
  { name: "Pineapple", category: "Fruits", unit: "pieces", available: true },
  { name: "Apple", category: "Fruits", unit: "kg", available: true },
  { name: "Pear", category: "Fruits", unit: "pieces", available: true },
  { name: "Grapes", category: "Fruits", unit: "kg", available: true },
  { name: "Strawberry", category: "Fruits", unit: "packs", available: true },
  // Fish & Seafood
  {
    name: "Titus Fish",
    category: "Fish & Seafood",
    unit: "kg",
    available: true,
  },
  {
    name: "Croaker Fish",
    category: "Fish & Seafood",
    unit: "kg",
    available: true,
  },
  {
    name: "Red Snapper",
    category: "Fish & Seafood",
    unit: "kg",
    available: true,
  },
  {
    name: "Kote Fish",
    category: "Fish & Seafood",
    unit: "kg",
    available: true,
  },
  { name: "Shrimps", category: "Fish & Seafood", unit: "kg", available: true },
  { name: "Prawns", category: "Fish & Seafood", unit: "kg", available: true },
  // Processed Foods
  {
    name: "Semolina",
    category: "Processed Foods",
    unit: "kg",
    available: true,
  },
  {
    name: "Groundnut Oil",
    category: "Processed Foods",
    unit: "litres",
    available: true,
  },
  {
    name: "Soya Seed Oil",
    category: "Processed Foods",
    unit: "litres",
    available: true,
  },
  {
    name: "Nsukka Native Palm Oil",
    category: "Processed Foods",
    unit: "litres",
    available: true,
  },
  {
    name: "Crayfish",
    category: "Processed Foods",
    unit: "kg",
    available: true,
  },
  { name: "Abacha", category: "Processed Foods", unit: "kg", available: true },
  // Grains
  { name: "Rice", category: "Grains", unit: "kg", available: true },
  { name: "Beans", category: "Grains", unit: "kg", available: true },
  { name: "Fiofio", category: "Grains", unit: "kg", available: true },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Real-time listener
  useEffect(() => {
    const q = query(
      collection(db, "products"),
      orderBy("category"),
      orderBy("name"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
    });
    return () => unsub();
  }, []);

  function openCreate() {
    setEditingProduct(null);
    setForm(BLANK_FORM);
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      defaultPrice: product.defaultPrice?.toString() ?? "",
      available: product.available,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        defaultPrice: form.defaultPrice ? parseFloat(form.defaultPrice) : null,
        available: form.available,
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), data);
      } else {
        await addDoc(collection(db, "products"), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (e) {
      console.error(e);
    }
    setDeletingId(null);
  }

  async function toggleAvailable(product: Product) {
    await updateDoc(doc(db, "products", product.id), {
      available: !product.available,
    });
  }

  async function seedProducts() {
    if (products.length > 0) return;
    setSeeding(true);
    try {
      await Promise.all(
        SEED_PRODUCTS.map((p) =>
          addDoc(collection(db, "products"), {
            ...p,
            createdAt: new Date().toISOString(),
          }),
        ),
      );
    } catch (e) {
      console.error(e);
    }
    setSeeding(false);
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  const allCategories = ["All", ...CATEGORIES.map((c) => c.label)];
  const filtered =
    activeCategory === "All" ? products : (
      products.filter((p) => p.category === activeCategory)
    );

  const categoryEmoji = (cat: string) =>
    CATEGORIES.find((c) => c.label === cat)?.emoji ?? "🛒";

  const stats = {
    total: products.length,
    available: products.filter((p) => p.available).length,
    withPrice: products.filter((p) => p.defaultPrice).length,
  };

  return (
    <main className="min-h-dvh bg-[#0a1a0a] text-white">
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-green-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full opacity-10 blur-3xl" />
      </div>
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 transition text-white/40 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.div>
            </Link>
            <div>
              <h1 className="font-black text-sm sm:text-base leading-none">
                Products
              </h1>
              <p className="text-white/30 text-xs mt-0.5">
                Manage your catalog
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {products.length === 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={seedProducts}
                disabled={seeding}
                className="text-xs text-white/40 border border-white/10 hover:border-white/20 px-3 py-2 rounded-xl transition hover:text-white/60"
              >
                {seeding ? "Seeding…" : "Seed defaults"}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-black font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition shadow-lg shadow-green-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </motion.button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, emoji: "📦" },
            { label: "Available", value: stats.available, emoji: "✅" },
            { label: "With Price", value: stats.withPrice, emoji: "💰" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-3 sm:p-4"
            >
              <div className="text-xl mb-1">{s.emoji}</div>
              <div className="text-lg sm:text-xl font-black">{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none -mx-4 px-4">
          {allCategories.map((cat) => {
            const count =
              cat === "All" ?
                products.length
              : products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                  activeCategory === cat ?
                    "bg-green-500 border-green-500 text-black"
                  : "bg-white/3 border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
                }`}
              >
                {cat !== "All" && <span>{categoryEmoji(cat)}</span>}
                {cat}
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activeCategory === cat ?
                      "bg-black/10 text-black/60"
                    : "bg-white/5 text-white/30"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 ?
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <Package className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No products yet</p>
            {products.length === 0 && (
              <p className="text-white/20 text-xs mt-1">
                Tap &quot;Seed defaults&quot; to load all JulesMarket items
                automatically
              </p>
            )}
          </div>
        : <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all duration-200 ${
                    product.available ?
                      "bg-white/3 border-white/8"
                    : "bg-white/1.5 border-white/5 opacity-50"
                  }`}
                >
                  {/* Category emoji */}
                  <span className="text-xl shrink-0">
                    {categoryEmoji(product.category)}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{product.name}</p>
                      {!product.available && (
                        <span className="text-[10px] bg-white/5 text-white/30 border border-white/10 px-1.5 py-0.5 rounded-full">
                          unavailable
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-white/30">
                        {product.category}
                      </span>
                      <span className="text-white/10">·</span>
                      <span className="text-xs text-white/30">
                        {product.unit}
                      </span>
                      {product.defaultPrice && (
                        <>
                          <span className="text-white/10">·</span>
                          <span className="text-xs text-green-400/70 font-semibold">
                            ₦{product.defaultPrice.toLocaleString()}/
                            {product.unit}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Available toggle */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleAvailable(product)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition text-xs ${
                        product.available ?
                          "bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20"
                        : "bg-white/5 border border-white/10 text-white/20 hover:text-white/40"
                      }`}
                      title={
                        product.available ? "Mark unavailable" : (
                          "Mark available"
                        )
                      }
                    >
                      <Check className="w-3.5 h-3.5" />
                    </motion.button>

                    {/* Edit */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEdit(product)}
                      className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white/70 hover:border-white/20 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </motion.button>

                    {/* Delete */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        }
      </div>

      {/* ── Add / Edit Modal ── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
              className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:px-4"
            >
              <div className="bg-[#0f1f0f] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
                <div className="flex justify-center mb-4 sm:hidden">
                  <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-black text-base">
                    {editingProduct ? "✏️ Edit Product" : "➕ New Product"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white/30 hover:text-white/60 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Name */}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-medium">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="e.g. Tomato"
                      className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-medium">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, category: e.target.value }))
                        }
                        className="w-full appearance-none bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none scheme-dark cursor-pointer pr-8"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.label} value={c.label}>
                            {c.emoji} {c.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    </div>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-medium">
                      Unit
                    </label>
                    <div className="relative">
                      <select
                        value={form.unit}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, unit: e.target.value }))
                        }
                        className="w-full appearance-none bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none scheme-dark cursor-pointer pr-8"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    </div>
                  </div>

                  {/* Default price */}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block font-medium">
                      Default Price (₦){" "}
                      <span className="text-white/20">
                        — optional, per {form.unit}
                      </span>
                    </label>
                    <input
                      type="number"
                      value={form.defaultPrice}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, defaultPrice: e.target.value }))
                      }
                      placeholder="e.g. 1500"
                      min="0"
                      className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
                    />
                  </div>

                  {/* Available toggle */}
                  <div className="flex items-center justify-between bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">Available</p>
                      <p className="text-xs text-white/30">
                        Show this item to customers
                      </p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        setForm((f) => ({ ...f, available: !f.available }))
                      }
                      className={`w-12 h-6 rounded-full border transition-all duration-200 relative ${
                        form.available ?
                          "bg-green-500 border-green-500"
                        : "bg-white/10 border-white/20"
                      }`}
                    >
                      <motion.div
                        animate={{ x: form.available ? 24 : 2 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }}
                        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                      />
                    </motion.button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white/60 text-sm transition"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={saving || !form.name.trim()}
                    className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition disabled:opacity-40 shadow-lg shadow-green-500/20"
                  >
                    {saving ?
                      "Saving…"
                    : editingProduct ?
                      "Save changes"
                    : "Add product"}
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
