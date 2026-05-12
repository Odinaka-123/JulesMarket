"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/client";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { MarketDay, Order, OrderItem, Product, DeliveryType } from "@/types";
import { use } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  Loader2,
  ShoppingBasket,
  MapPin,
  User,
  Phone,
  FileText,
  Check,
  Package,
  Truck,
  ArrowRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ItemDraft {
  tempId: string;
  name: string;
  quantity: string;
  unit: string;
  notes: string;
  estimatedPrice: string;
}

const UNITS = ["kg", "g", "pieces", "bags", "bunches", "litres", "cups", "wraps", "tubers", "crates", "packs", "others"];

const DELIVERY_OPTIONS: { value: DeliveryType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "pickup",
    label: "I'll pick up",
    desc: "Come collect your order",
    icon: <ShoppingBasket className="w-4 h-4" />,
  },
  {
    value: "delivery",
    label: "Deliver to me",
    desc: "Via Bolt, Uber or InDrive",
    icon: <Truck className="w-4 h-4" />,
  },
  {
    value: "courier",
    label: "Send courier",
    desc: "I'll send my own dispatch",
    icon: <Package className="w-4 h-4" />,
  },
];

function generateTempId() {
  return Math.random().toString(36).slice(2, 9);
}

function blankItem(): ItemDraft {
  return { tempId: generateTempId(), name: "", quantity: "", unit: "kg", notes: "", estimatedPrice: "" };
}

// ─── Suggestion pill ─────────────────────────────────────────────────────────

function SuggestionPill({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      type="button"
      className="shrink-0 text-xs bg-white/5 border border-white/10 hover:border-green-500/40 hover:bg-green-500/5 text-white/50 hover:text-green-400 px-3 py-1.5 rounded-full transition-all duration-150"
    >
      + {name}
    </motion.button>
  );
}

// ─── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  index,
  onChange,
  onRemove,
  suggestions,
}: {
  item: ItemDraft;
  index: number;
  onChange: (id: string, field: keyof ItemDraft, value: string) => void;
  onRemove: (id: string) => void;
  suggestions: Product[];
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filtered = item.name.length > 0
    ? suggestions.filter((p) => p.name.toLowerCase().includes(item.name.toLowerCase())).slice(0, 5)
    : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-3"
    >
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/30 uppercase tracking-wide">
          Item {index + 1}
        </span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(item.tempId)}
          type="button"
          className="w-7 h-7 flex items-center justify-center rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Name + autocomplete */}
      <div className="relative">
        <input
          type="text"
          value={item.name}
          onChange={(e) => {
            onChange(item.tempId, "name", e.target.value);
            setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Item name (e.g. Tomatoes)"
          className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition placeholder:text-white/20"
        />
        <AnimatePresence>
          {showSuggestions && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute z-20 top-full mt-1 w-full bg-[#0f1f0f] border border-white/10 rounded-xl overflow-hidden shadow-xl"
            >
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => {
                    onChange(item.tempId, "name", p.name);
                    onChange(item.tempId, "unit", p.defaultUnit);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition flex items-center justify-between"
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-white/30">{p.defaultUnit}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quantity + Unit */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onChange(item.tempId, "quantity", e.target.value)}
          placeholder="Qty"
          min="0"
          className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition placeholder:text-white/20"
        />
        <div className="relative">
          <select
            value={item.unit}
            onChange={(e) => onChange(item.tempId, "unit", e.target.value)}
            className="w-full appearance-none bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition scheme-dark cursor-pointer pr-8"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* Notes (optional) */}
      <input
        type="text"
        value={item.notes}
        onChange={(e) => onChange(item.tempId, "notes", e.target.value)}
        placeholder="Notes (optional — e.g. ripe, seedless…)"
        className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition placeholder:text-white/20"
      />
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrderPage({
  params,
}: {
  params: Promise<{ marketDayId: string }>;
}) {
  const { marketDayId } = use(params);

  const [marketDay, setMarketDay] = useState<MarketDay | null>(null);
  const [loadingMarketDay, setLoadingMarketDay] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([blankItem()]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Fetch market day
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "market_days", marketDayId));
        if (!snap.exists()) { setNotFound(true); setLoadingMarketDay(false); return; }
        const data = { id: snap.id, ...snap.data() } as MarketDay;
        setMarketDay(data);
        if (data.status !== "open") setIsClosed(true);
        // Check if deadline passed
        if (new Date(data.deadline) < new Date()) setIsClosed(true);
      } catch {
        setNotFound(true);
      }
      setLoadingMarketDay(false);
    }
    load();
  }, [marketDayId]);

  // Fetch products for suggestions
  useEffect(() => {
    async function loadProducts() {
      try {
        const snap = await getDocs(query(collection(db, "products"), orderBy("name")));
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
      } catch { /* products are optional */ }
    }
    loadProducts();
  }, []);

  function addItem() {
    setItems((prev) => [...prev, blankItem()]);
  }

  function removeItem(tempId: string) {
    setItems((prev) => prev.length > 1 ? prev.filter((i) => i.tempId !== tempId) : prev);
  }

  function updateItem(tempId: string, field: keyof ItemDraft, value: string) {
    setItems((prev) => prev.map((i) => i.tempId === tempId ? { ...i, [field]: value } : i));
  }

  function addSuggestedItem(product: Product) {
    // Fill the last blank item's name, or add a new one
    const lastBlank = items.findIndex((i) => i.name === "");
    if (lastBlank !== -1) {
      updateItem(items[lastBlank].tempId, "name", product.name);
      updateItem(items[lastBlank].tempId, "unit", product.defaultUnit);
    } else {
      setItems((prev) => [...prev, { ...blankItem(), name: product.name, unit: product.defaultUnit }]);
    }
  }

  async function handleSubmit() {
    setError("");

    // Validate
    if (!customerName.trim()) { setError("Please enter your name."); return; }
    if (!customerPhone.trim()) { setError("Please enter your phone number."); return; }
    const validItems = items.filter((i) => i.name.trim() && i.quantity);
    if (validItems.length === 0) { setError("Add at least one item."); return; }
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      setError("Please enter your delivery address."); return;
    }

    setSubmitting(true);
    try {
      const orderItems: Omit<OrderItem, "id">[] = validItems.map((i) => ({
        name: i.name.trim(),
        quantity: parseFloat(i.quantity),
        unit: i.unit,
        notes: i.notes.trim() || undefined,
        estimatedPrice: i.estimatedPrice ? parseFloat(i.estimatedPrice) : undefined,
      }));

      const orderData: Omit<Order, "id"> = {
        marketDayId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        deliveryType,
        deliveryAddress: deliveryAddress.trim() || undefined,
        deliveryFee: 0, // admin sets this
        items: orderItems.map((item, idx) => ({ ...item, id: `item_${idx}` })),
        orderStatus: "pending",
        paymentConfirmed: false,
        totalEstimate: 0, // admin fills in
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const ref = await addDoc(
        collection(db, "market_days", marketDayId, "orders"),
        orderData
      );
      setOrderId(ref.id);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingMarketDay) {
    return (
      <main className="min-h-dvh bg-[#0a1a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
      </main>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <main className="min-h-dvh bg-[#0a1a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🥬</div>
          <h1 className="text-white font-black text-xl mb-2">Page not found</h1>
          <p className="text-white/40 text-sm">This order link doesn&apos;t exist or has expired.</p>
        </div>
      </main>
    );
  }

  // ── Closed ────────────────────────────────────────────────────────────────
  if (isClosed) {
    return (
      <main className="min-h-dvh bg-[#0a1a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-white font-black text-xl mb-2">Orders closed</h1>
          <p className="text-white/40 text-sm">
            The deadline for this market day has passed. Orders are no longer being accepted.
          </p>
          {marketDay && (
            <p className="text-white/20 text-xs mt-3">
              Was for{" "}
              {new Date(marketDay.date).toLocaleDateString("en-NG", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      </main>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="min-h-dvh bg-[#0a1a0a] flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-600 rounded-full opacity-15 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500 rounded-full opacity-10 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-sm text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-9 h-9 text-green-400" />
          </motion.div>
          <h1 className="text-white font-black text-2xl mb-2">Order placed! 🎉</h1>
          <p className="text-white/50 text-sm mb-6">
            Hey <span className="text-white/80">{customerName}</span>, your order has been sent to Jules. You&apos;ll hear back once it&apos;s confirmed.
          </p>

          {/* Order summary */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 text-left mb-6 space-y-2">
            <p className="text-xs text-white/30 font-semibold uppercase tracking-wide mb-3">Your order</p>
            {items.filter((i) => i.name && i.quantity).map((item) => (
              <div key={item.tempId} className="flex items-center justify-between">
                <span className="text-sm text-white/70">{item.name}</span>
                <span className="text-xs text-white/40">{item.quantity} {item.unit}</span>
              </div>
            ))}
            <div className="border-t border-white/5 pt-2 mt-2 flex items-center justify-between">
              <span className="text-xs text-white/30">Delivery</span>
              <span className="text-xs text-white/50 capitalize">
                {deliveryType === "pickup" ? "🏃 Pickup" : deliveryType === "delivery" ? "🚗 Delivery" : "📦 Courier"}
              </span>
            </div>
          </div>

          <p className="text-white/20 text-xs">
            Order ID: <span className="font-mono text-white/30">{orderId?.slice(0, 8).toUpperCase()}</span>
          </p>
        </motion.div>
      </main>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
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

      {/* Header */}
      <div className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🛒</span>
            <div>
              <p className="font-black text-sm leading-none">
                Jules<span className="text-green-400">Market</span>
              </p>
              <p className="text-white/30 text-xs mt-0.5">
                {marketDay &&
                  new Date(marketDay.date).toLocaleDateString("en-NG", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/20">Deadline</p>
            <p className="text-xs text-yellow-400 font-semibold">
              {marketDay &&
                new Date(marketDay.deadline).toLocaleString("en-NG", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 space-y-6 pb-32">

        {/* Market day notes */}
        {marketDay?.notes && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl px-4 py-3"
          >
            <p className="text-xs text-yellow-400/80">📝 {marketDay.notes}</p>
          </motion.div>
        )}

        {/* Section: Your details */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h2 className="font-bold text-sm text-white/60 mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            Your details
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Full name *"
              className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
            />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm select-none">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone number *"
                className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl pl-11 pr-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
              />
            </div>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
            />
          </div>
        </motion.section>

        {/* Section: Delivery type */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-bold text-sm text-white/60 mb-3 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            How do you want it?
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {DELIVERY_OPTIONS.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setDeliveryType(opt.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200 ${
                  deliveryType === opt.value
                    ? "bg-green-500/10 border-green-500/40 text-green-400"
                    : "bg-white/3 border-white/8 text-white/40 hover:text-white/60 hover:border-white/15"
                }`}
              >
                {opt.icon}
                <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                <span className="text-[10px] leading-tight opacity-60">{opt.desc}</span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {deliveryType === "delivery" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden mt-3"
              >
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Delivery address *"
                  className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Section: Items */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-bold text-sm text-white/60 mb-3 flex items-center gap-2">
            <ShoppingBasket className="w-3.5 h-3.5" />
            What do you need?
          </h2>

          {/* Product suggestions */}
          {products.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-white/20 mb-2">Quick add:</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {products.slice(0, 10).map((p) => (
                  <SuggestionPill key={p.id} name={p.name} onClick={() => addSuggestedItem(p)} />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item, index) => (
                <ItemRow
                  key={item.tempId}
                  item={item}
                  index={index}
                  onChange={updateItem}
                  onRemove={removeItem}
                  suggestions={products}
                />
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={addItem}
            className="mt-3 w-full flex items-center justify-center gap-2 border border-dashed border-white/15 hover:border-green-500/30 hover:bg-green-500/3 text-white/30 hover:text-green-400 py-3 rounded-2xl text-sm font-medium transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add another item
          </motion.button>
        </motion.section>

        {/* Section: Order notes */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-bold text-sm text-white/60 mb-3 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            Any notes for Jules?
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Please get the freshest tomatoes, avoid overripe ones…"
            rows={3}
            className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition resize-none placeholder:text-white/20"
          />
        </motion.section>

      </div>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-[#0a1a0a]/90 backdrop-blur-xl border-t border-white/5 px-4 py-4">
        <div className="max-w-lg mx-auto space-y-2">
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400 text-center"
              >
                ⚠️ {error}
              </motion.p>
            )}
          </AnimatePresence>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-2xl text-sm transition-colors shadow-xl shadow-green-500/20"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Placing order…
              </>
            ) : (
              <>
                Place order
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
          <p className="text-center text-white/15 text-xs">
            You&apos;ll be contacted by Jules to confirm & arrange payment
          </p>
        </div>
      </div>
    </main>
  );
}