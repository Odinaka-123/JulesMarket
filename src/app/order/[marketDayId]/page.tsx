"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/client";
import {
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { MarketDay, Order, OrderItem, DeliveryType } from "@/types";
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
  Minus,
  Search,
  X,
} from "lucide-react";

// ── Static catalog fallback ────────────────────────────────────────────────

const STATIC_CATALOG: {
  category: string;
  emoji: string;
  items: { name: string; unit: string }[];
}[] = [
  {
    category: "Vegetables",
    emoji: "🥬",
    items: [
      { name: "Cabbage (White)", unit: "pieces" },
      { name: "Cabbage (Purple)", unit: "pieces" },
      { name: "Tomato", unit: "kg" },
      { name: "Pepper", unit: "kg" },
      { name: "Red Onion", unit: "kg" },
      { name: "Carrot", unit: "kg" },
      { name: "Spring Onion", unit: "bunches" },
      { name: "Broccoli", unit: "pieces" },
      { name: "Cauliflower", unit: "pieces" },
      { name: "Cucumber", unit: "pieces" },
      { name: "Celery", unit: "bunches" },
      { name: "Bell Pepper", unit: "kg" },
      { name: "Banana", unit: "bunches" },
      { name: "Plantain", unit: "pieces" },
    ],
  },
  {
    category: "Tubers",
    emoji: "🥔",
    items: [
      { name: "Potato", unit: "kg" },
      { name: "Yam", unit: "tubers" },
    ],
  },
  {
    category: "Meat",
    emoji: "🥩",
    items: [
      { name: "Cow Meat", unit: "kg" },
      { name: "Goat Meat", unit: "kg" },
      { name: "Snail", unit: "pieces" },
      { name: "Pig Meat", unit: "kg" },
    ],
  },
  {
    category: "Fruits",
    emoji: "🍊",
    items: [
      { name: "Orange", unit: "pieces" },
      { name: "Pineapple", unit: "pieces" },
      { name: "Apple", unit: "kg" },
      { name: "Pear", unit: "pieces" },
      { name: "Grapes", unit: "kg" },
      { name: "Strawberry", unit: "packs" },
    ],
  },
  {
    category: "Fish & Seafood",
    emoji: "🐟",
    items: [
      { name: "Titus Fish", unit: "kg" },
      { name: "Croaker Fish", unit: "kg" },
      { name: "Red Snapper", unit: "kg" },
      { name: "Kote Fish", unit: "kg" },
      { name: "Shrimps", unit: "kg" },
      { name: "Prawns", unit: "kg" },
    ],
  },
  {
    category: "Processed Foods",
    emoji: "🛒",
    items: [
      { name: "Semolina", unit: "kg" },
      { name: "Groundnut Oil", unit: "litres" },
      { name: "Soya Seed Oil", unit: "litres" },
      { name: "Nsukka Native Palm Oil", unit: "litres" },
      { name: "Crayfish", unit: "kg" },
      { name: "Abacha", unit: "kg" },
    ],
  },
  {
    category: "Grains",
    emoji: "🌾",
    items: [
      { name: "Rice", unit: "kg" },
      { name: "Beans", unit: "kg" },
      { name: "Fiofio", unit: "kg" },
    ],
  },
];

// ── Types ──────────────────────────────────────────────────────────────────

interface CatalogItem {
  id?: string;
  name: string;
  unit: string;
  available: boolean;
  category: string;
  emoji: string;
}

interface CartItem {
  tempId: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string;
  isCustom: boolean;
  budget?: number;
}

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

const DELIVERY_OPTIONS: {
  value: DeliveryType;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "pickup",
    label: "I'll pick up",
    desc: "Collect at our location",
    icon: <ShoppingBasket className="w-4 h-4" />,
  },
  {
    value: "delivery",
    label: "Deliver to me",
    desc: "Via Bolt / Uber / InDrive",
    icon: <Truck className="w-4 h-4" />,
  },
  {
    value: "courier",
    label: "Send courier",
    desc: "I'll send my own dispatch",
    icon: <Package className="w-4 h-4" />,
  },
];

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Product Card ───────────────────────────────────────────────────────────

function ProductCard({
  item,
  cartQty,
  cartBudget,
  onAdd,
  onDecrement,
}: {
  item: CatalogItem;
  cartQty: number;
  cartBudget?: number;
  onAdd: (budget: number) => void;
  onDecrement: () => void;
}) {
  const [budgeting, setBudgeting] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handlePlusClick() {
    if (cartQty > 0) {
      // Already in cart — just increment qty without re-asking budget
      onAdd(cartBudget ?? 0);
    } else {
      setBudgeting(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleConfirm() {
    const val = parseFloat(budgetInput);
    if (!budgetInput || isNaN(val) || val <= 0) return;
    onAdd(val);
    setBudgetInput("");
    setBudgeting(false);
  }

  function handleCancel() {
    setBudgetInput("");
    setBudgeting(false);
  }

  return (
    <motion.div
      layout
      className={`rounded-2xl border transition-all duration-200 ${
        cartQty > 0 ?
          "bg-green-500/8 border-green-500/30"
        : "bg-white/3 border-white/8 hover:border-white/15"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="min-w-0 flex-1 mr-3">
          <p className="text-sm font-semibold text-white leading-tight">
            {item.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-white/30">{item.unit}</p>
            {cartQty > 0 && cartBudget ?
              <p className="text-xs text-green-400/70 font-semibold">
                Budget: ₦{cartBudget.toLocaleString()}
              </p>
            : null}
          </div>
        </div>

        {cartQty === 0 ?
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handlePlusClick}
            className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        : <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onDecrement}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition"
            >
              <Minus className="w-3 h-3" />
            </motion.button>
            <span className="text-sm font-black text-green-400 w-5 text-center tabular-nums">
              {cartQty}
            </span>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handlePlusClick}
              className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition"
            >
              <Plus className="w-3 h-3" />
            </motion.button>
          </div>
        }
      </div>

      {/* Inline budget input */}
      <AnimatePresence>
        {budgeting && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                  ₦
                </span>
                <input
                  ref={inputRef}
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirm();
                    if (e.key === "Escape") handleCancel();
                  }}
                  placeholder="Your budget"
                  className="w-full bg-white/5 border border-white/15 focus:border-green-500/50 rounded-xl pl-8 pr-3 py-2 text-white text-sm outline-none transition placeholder:text-white/20"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleConfirm}
                disabled={!budgetInput || parseFloat(budgetInput) <= 0}
                className="w-9 h-9 rounded-xl bg-green-500 disabled:opacity-30 flex items-center justify-center text-black shrink-0"
              >
                <Check className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleCancel}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 shrink-0"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function OrderPage({
  params,
}: {
  params: Promise<{ marketDayId: string }>;
}) {
  const { marketDayId } = use(params);

  const [marketDay, setMarketDay] = useState<MarketDay | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  // catalog
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");

  // cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // custom item
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customUnit, setCustomUnit] = useState("kg");
  const [customNotes, setCustomNotes] = useState("");
  const [customBudget, setCustomBudget] = useState("");

  // checkout
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // ── Load market day ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "market_days", marketDayId));
        if (!snap.exists()) {
          setNotFound(true);
          setPageLoading(false);
          return;
        }
        const data = { id: snap.id, ...snap.data() } as MarketDay;
        setMarketDay(data);
        if (data.status !== "open" || new Date(data.deadline) < new Date()) {
          setIsClosed(true);
        }
      } catch {
        setNotFound(true);
      }
      setPageLoading(false);
    }
    load();
  }, [marketDayId]);

  // ── Load catalog ─────────────────────────────────────────────────────────
  // Priority: market-day-specific overrides → global products → static fallback
  useEffect(() => {
    async function loadCatalog() {
      try {
        // 1. Try market-day product overrides first
        const overridesSnap = await getDocs(
          collection(db, "market_days", marketDayId, "product_overrides"),
        );

        // 2. Get global products
        const globalSnap = await getDocs(
          query(
            collection(db, "products"),
            orderBy("category"),
            orderBy("name"),
          ),
        );

        const overridesMap = new Map<string, { available: boolean }>();
        overridesSnap.docs.forEach((d) => {
          const data = d.data();
          overridesMap.set(d.id, {
            available: data.available ?? true,
          });
        });

        if (!globalSnap.empty) {
          // Build catalog from Firestore products, auto-deleting duplicates
          const seen = new Map<string, string>(); // key → first doc id
          const toDelete: string[] = [];

          const items: CatalogItem[] = [];
          globalSnap.docs.forEach((d) => {
            const data = d.data();
            const key = `${data.category}-${data.name}`;
            if (seen.has(key)) {
              // Duplicate — queue for deletion, skip it
              toDelete.push(d.id);
              return;
            }
            seen.set(key, d.id);
            const override = overridesMap.get(d.id);
            const cat = STATIC_CATALOG.find(
              (c) => c.category === data.category,
            );
            items.push({
              id: d.id,
              name: data.name,
              unit: data.unit,
              available: override?.available ?? true,
              category: data.category,
              emoji: cat?.emoji ?? "🛒",
            });
          });

          // Fire-and-forget delete duplicates from Firestore
          if (toDelete.length > 0) {
            console.log(
              `Auto-deleting ${toDelete.length} duplicate product(s):`,
              toDelete,
            );
            toDelete.forEach((id) =>
              deleteDoc(doc(db, "products", id)).catch(console.error),
            );
          }

          setCatalog(items);
          // Set first available category
          const firstCat = [...new Set(items.map((i) => i.category))][0];
          setActiveCategory(firstCat ?? "");
        } else {
          // Fallback to static catalog
          const items: CatalogItem[] = STATIC_CATALOG.flatMap((cat) =>
            cat.items.map((item) => ({
              ...item,
              available: true,
              category: cat.category,
              emoji: cat.emoji,
            })),
          );
          setCatalog(items);
          setActiveCategory(STATIC_CATALOG[0].category);
        }
      } catch (e) {
        console.error(e);
        // Static fallback on error
        const items: CatalogItem[] = STATIC_CATALOG.flatMap((cat) =>
          cat.items.map((item) => ({
            ...item,
            available: true,
            category: cat.category,
            emoji: cat.emoji,
          })),
        );
        setCatalog(items);
        setActiveCategory(STATIC_CATALOG[0].category);
      }
    }
    loadCatalog();
  }, [marketDayId]);

  // ── Cart helpers ─────────────────────────────────────────────────────────

  function getQty(name: string) {
    return cart.find((c) => c.name === name)?.quantity ?? 0;
  }

  function increment(
    name: string,
    unit: string,
    budget?: number,
    isCustom = false,
  ) {
    setCart((prev) => {
      const existing = prev.find((c) => c.name === name);
      if (existing)
        return prev.map((c) =>
          c.name === name ? { ...c, quantity: c.quantity + 1 } : c,
        );
      return [
        ...prev,
        {
          tempId: genId(),
          name,
          quantity: 1,
          unit,
          notes: "",
          isCustom,
          budget,
        },
      ];
    });
  }

  function decrement(name: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.name === name);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((c) => c.name !== name);
      return prev.map((c) =>
        c.name === name ? { ...c, quantity: c.quantity - 1 } : c,
      );
    });
  }

  function removeFromCart(tempId: string) {
    setCart((prev) => prev.filter((c) => c.tempId !== tempId));
  }

  function addCustomItem() {
    if (!customName.trim() || !customQty || !customBudget) return;
    setCart((prev) => [
      ...prev,
      {
        tempId: genId(),
        name: customName.trim(),
        quantity: parseFloat(customQty),
        unit: customUnit,
        notes: customNotes.trim(),
        isCustom: true,
        budget: parseFloat(customBudget),
      },
    ]);
    setCustomName("");
    setCustomQty("1");
    setCustomUnit("kg");
    setCustomNotes("");
    setCustomBudget("");
    setShowCustomModal(false);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setError("");
    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!customerPhone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (cart.length === 0) {
      setError("Please select at least one item.");
      return;
    }
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    setSubmitting(true);
    try {
      const items: OrderItem[] = cart.map((c, i) => ({
        id: `item_${i}`,
        name: c.name,
        quantity: c.quantity,
        unit: c.unit,
        notes: c.notes || undefined,
        budget: c.budget,
      }));

      const totalEstimate = cart.reduce((sum, c) => sum + (c.budget ?? 0), 0);

      // Build order payload — strip undefined fields Firestore rejects
      const rawOrder = {
        marketDayId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        deliveryType,
        deliveryAddress: deliveryAddress.trim() || undefined,
        deliveryFee: 0,
        items: items.map((item) =>
          Object.fromEntries(
            Object.entries(item).filter(([, v]) => v !== undefined),
          ),
        ),
        orderStatus: "pending",
        paymentConfirmed: false,
        totalEstimate,
        notes: orderNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      const orderData = Object.fromEntries(
        Object.entries(rawOrder).filter(([, v]) => v !== undefined),
      ) as Omit<Order, "id">;

      const ref = await addDoc(
        collection(db, "market_days", marketDayId, "orders"),
        orderData,
      );
      setOrderId(ref.id);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const categories = [...new Set(catalog.map((i) => i.category))];
  const categoryEmoji = (cat: string) =>
    STATIC_CATALOG.find((c) => c.category === cat)?.emoji ?? "🛒";

  const activeItems = catalog.filter(
    (i) => i.category === activeCategory && i.available,
  );

  const searchResults =
    search.trim().length > 1 ?
      catalog.filter(
        (i) =>
          i.available && i.name.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  const totalCartItems = cart.reduce((s, c) => s + c.quantity, 0);
  const totalBudget = cart.reduce((s, c) => s + (c.budget ?? 0), 0);

  // ── States ────────────────────────────────────────────────────────────────

  if (pageLoading)
    return (
      <main className="min-h-dvh bg-[#0a1a0a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
      </main>
    );

  if (notFound)
    return (
      <main className="min-h-dvh bg-[#0a1a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🥬</div>
          <h1 className="text-white font-black text-xl mb-2">Page not found</h1>
          <p className="text-white/40 text-sm">
            This order link doesn&apos;t exist or has expired.
          </p>
        </div>
      </main>
    );

  if (isClosed)
    return (
      <main className="min-h-dvh bg-[#0a1a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-white font-black text-xl mb-2">Orders closed</h1>
          <p className="text-white/40 text-sm">
            The deadline for this market day has passed.
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

  if (submitted)
    return (
      <main className="min-h-dvh bg-[#0a1a0a] flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
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
          <h1 className="text-white font-black text-2xl mb-2">
            Order placed! 🎉
          </h1>
          <p className="text-white/50 text-sm mb-6">
            Hey <span className="text-white/80">{customerName}</span>, your
            order has been sent to Jules. You&apos;ll hear back once it&apos;s
            confirmed.
          </p>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 text-left mb-4 space-y-2">
            <p className="text-xs text-white/30 font-semibold uppercase tracking-wide mb-3">
              Your order
            </p>
            {cart.map((item) => (
              <div
                key={item.tempId}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-white/70">{item.name}</span>
                <span className="text-xs text-white/40">
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
            <div className="border-t border-white/5 pt-2 mt-2 flex items-center justify-between">
              <span className="text-xs text-white/30">Delivery</span>
              <span className="text-xs text-white/50">
                {deliveryType === "pickup" ?
                  "🏃 Pickup"
                : deliveryType === "delivery" ?
                  "🚗 Delivery"
                : "📦 Courier"}
              </span>
            </div>
            {totalBudget > 0 && (
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-xs text-white/30">Total budget</span>
                <span className="text-xs font-black text-green-400">
                  ₦{totalBudget.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <p className="text-white/20 text-xs">
            Order ID:{" "}
            <span className="font-mono text-white/30">
              {orderId?.slice(0, 8).toUpperCase()}
            </span>
          </p>
        </motion.div>
      </main>
    );

  // ── Main UI ───────────────────────────────────────────────────────────────

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

      {/* Sticky header */}
      <div className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl top-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">🛒</span>
            <div className="min-w-0">
              <p className="font-black text-sm leading-none">
                Jules<span className="text-green-400">Market</span>
              </p>
              <p className="text-white/30 text-xs mt-0.5 truncate">
                {marketDay &&
                  new Date(marketDay.date).toLocaleDateString("en-NG", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block text-right">
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
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-2 rounded-xl text-xs font-bold hover:bg-green-500/20 transition"
            >
              <ShoppingBasket className="w-4 h-4" />
              <span>Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 text-black text-[10px] font-black rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {marketDay?.notes && (
          <div className="max-w-2xl mx-auto px-4 pb-2">
            <p className="text-xs text-yellow-400/70 bg-yellow-500/5 border border-yellow-500/15 rounded-xl px-3 py-2">
              📝 {marketDay.notes}
            </p>
          </div>
        )}

        {/* Search */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full bg-white/5 border border-white/10 focus:border-green-500/40 rounded-xl pl-10 pr-10 py-2.5 text-white text-sm outline-none transition placeholder:text-white/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-32">
        {/* Search results */}
        <AnimatePresence>
          {search.trim().length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pt-4"
            >
              {searchResults.length === 0 ?
                <div className="text-center py-12">
                  <p className="text-white/30 text-sm">
                    No results for &quot;{search}&quot;
                  </p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setShowCustomModal(true);
                    }}
                    className="mt-3 text-xs text-green-400 border border-green-500/30 px-4 py-2 rounded-xl hover:bg-green-500/5 transition"
                  >
                    + Add as custom item
                  </button>
                </div>
              : <div className="grid gap-2">
                  {searchResults.map((item) => (
                    <ProductCard
                      key={item.id ?? `${item.category}-${item.name}`}
                      item={item}
                      cartQty={getQty(item.name)}
                      cartBudget={
                        cart.find((c) => c.name === item.name)?.budget
                      }
                      onAdd={(budget) =>
                        increment(item.name, item.unit, budget)
                      }
                      onDecrement={() => decrement(item.name)}
                    />
                  ))}
                </div>
              }
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs + grid */}
        {!search.trim() && (
          <>
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto py-4 scrollbar-none -mx-4 px-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                    activeCategory === cat ?
                      "bg-green-500 border-green-500 text-black"
                    : "bg-white/3 border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  <span>{categoryEmoji(cat)}</span>
                  {cat}
                  {/* cart count badge for category */}
                  {(() => {
                    const count = cart.filter((c) =>
                      catalog.find(
                        (ci) => ci.name === c.name && ci.category === cat,
                      ),
                    ).length;
                    return count > 0 ?
                        <span className="bg-green-500 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                          {count}
                        </span>
                      : null;
                  })()}
                </button>
              ))}
            </div>

            {/* Items list */}
            <div className="grid gap-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="grid gap-2"
                >
                  {activeItems.map((item) => (
                    <ProductCard
                      key={item.id ?? `${item.category}-${item.name}`}
                      item={item}
                      cartQty={getQty(item.name)}
                      cartBudget={
                        cart.find((c) => c.name === item.name)?.budget
                      }
                      onAdd={(budget) =>
                        increment(item.name, item.unit, budget)
                      }
                      onDecrement={() => decrement(item.name)}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Custom item CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCustomModal(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 border border-dashed border-white/15 hover:border-green-500/30 hover:bg-green-500/3 text-white/30 hover:text-green-400 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Can&apos;t find what you need? Add a custom item
            </motion.button>
          </>
        )}
      </div>

      {/* Sticky bottom bar */}
      {cart.length > 0 && !showCart && !showCheckout && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-[#0a1a0a]/90 backdrop-blur-xl border-t border-white/5 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCart(true)}
              className="w-full flex items-center justify-between bg-green-500 hover:bg-green-400 text-black font-black py-4 px-5 rounded-2xl text-sm transition-colors shadow-xl shadow-green-500/20"
            >
              <span className="bg-black/10 text-black/70 font-black text-xs px-2 py-1 rounded-lg">
                {cart.length}
              </span>
              <span>View Cart</span>
              <span className="text-black/60 font-bold">
                {totalBudget > 0 ?
                  `₦${totalBudget.toLocaleString()}`
                : `${totalCartItems} item${totalCartItems !== 1 ? "s" : ""}`}
              </span>
            </motion.button>
          </div>
        </div>
      )}

      {/* ── Cart Sheet ── */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
              className="fixed inset-x-0 bottom-0 z-40 max-h-[88dvh] flex flex-col bg-[#0f1f0f] border-t border-white/10 rounded-t-3xl"
            >
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-white/5">
                <h2 className="font-black text-base">Your Cart 🛒</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-white/30 hover:text-white/60 transition w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
                {cart.length === 0 ?
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🧺</div>
                    <p className="text-white/30 text-sm">Your cart is empty</p>
                  </div>
                : <>
                    <AnimatePresence>
                      {cart.map((item) => (
                        <motion.div
                          key={item.tempId}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0 }}
                          className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-2xl px-4 py-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-white/30">
                                {item.unit}
                              </p>
                              {item.budget && (
                                <p className="text-xs text-green-400/70">
                                  Budget: ₦{item.budget.toLocaleString()}
                                </p>
                              )}
                              {item.isCustom && (
                                <span className="text-[10px] text-white/20 border border-white/10 px-1.5 py-0.5 rounded-full">
                                  custom
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => decrement(item.name)}
                              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-black w-5 text-center tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                increment(item.name, item.unit, item.budget)
                              }
                              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.tempId)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <button
                      onClick={() => {
                        setShowCart(false);
                        setShowCustomModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 border border-dashed border-white/10 hover:border-green-500/30 text-white/20 hover:text-green-400 py-3 rounded-2xl text-xs font-medium transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add custom item
                    </button>
                  </>
                }
              </div>

              {cart.length > 0 && (
                <div className="px-4 py-4 border-t border-white/5 shrink-0 space-y-3">
                  {totalBudget > 0 && (
                    <div className="flex items-center justify-between bg-green-500/5 border border-green-500/10 rounded-xl px-4 py-3">
                      <span className="text-xs text-white/40">
                        Total budget
                      </span>
                      <span className="font-black text-green-400">
                        ₦{totalBudget.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-white/20 text-center">
                    + delivery fee set by Jules after confirmation
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-black py-4 rounded-2xl text-sm transition-colors shadow-xl shadow-green-500/20"
                  >
                    Checkout <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Checkout Sheet ── */}
      <AnimatePresence>
        {showCheckout && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30"
              onClick={() => setShowCheckout(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
              className="fixed inset-x-0 bottom-0 z-40 max-h-[95dvh] flex flex-col bg-[#0f1f0f] border-t border-white/10 rounded-t-3xl"
            >
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowCheckout(false);
                      setShowCart(true);
                    }}
                    className="text-white/30 hover:text-white/60 transition w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 text-base"
                  >
                    ←
                  </button>
                  <h2 className="font-black text-base">Your Details</h2>
                </div>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-white/30 hover:text-white/60 transition w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5">
                {/* Contact */}
                <section>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Contact info
                  </h3>
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full name *"
                      className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
                    />
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
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
                </section>

                {/* Delivery */}
                <section>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Delivery method
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {DELIVERY_OPTIONS.map((opt) => (
                      <motion.button
                        key={opt.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDeliveryType(opt.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200 ${
                          deliveryType === opt.value ?
                            "bg-green-500/10 border-green-500/40 text-green-400"
                          : "bg-white/3 border-white/8 text-white/40 hover:text-white/60 hover:border-white/15"
                        }`}
                      >
                        {opt.icon}
                        <span className="text-xs font-semibold leading-tight">
                          {opt.label}
                        </span>
                        <span className="text-[10px] opacity-60 leading-tight hidden sm:block">
                          {opt.desc}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {deliveryType === "delivery" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-2.5"
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
                </section>

                {/* Notes */}
                <section>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Notes for Jules
                  </h3>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Please get the freshest tomatoes, avoid overripe ones…"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition resize-none placeholder:text-white/20"
                  />
                </section>

                {/* Order summary */}
                <section>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">
                    Order summary ({cart.length} items)
                  </h3>
                  <div className="bg-white/3 border border-white/8 rounded-2xl p-3 space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.tempId}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-white/70">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/40">
                            {item.quantity} {item.unit}
                          </span>
                          {item.budget && (
                            <span className="text-xs text-green-400/70 font-semibold">
                              Budget: ₦{item.budget.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {totalBudget > 0 && (
                      <div className="border-t border-white/5 pt-2 flex items-center justify-between">
                        <span className="text-xs text-white/30">
                          Total budget
                        </span>
                        <span className="text-sm font-black text-green-400">
                          ₦{totalBudget.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Terms reminder */}
                <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-2xl px-4 py-3">
                  <p className="text-xs text-yellow-400/70 leading-relaxed">
                    💳 <strong>Payment validates your order.</strong> Jules will
                    contact you with bank details after confirming. Delivery fee
                    is added separately.
                  </p>
                </div>
              </div>

              <div className="px-4 py-4 border-t border-white/5 shrink-0 space-y-2">
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
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
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-black py-4 rounded-2xl text-sm transition-colors shadow-xl shadow-green-500/20"
                >
                  {submitting ?
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Placing
                      order…
                    </>
                  : <>
                      Place order <ArrowRight className="w-4 h-4" />
                    </>
                  }
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Custom Item Modal ── */}
      <AnimatePresence>
        {showCustomModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setShowCustomModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-[#0f1f0f] border-t border-white/10 rounded-t-3xl px-4 pb-8 pt-4"
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-base">✍️ Custom Item</h2>
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="text-white/30 hover:text-white/60 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Item name *"
                  className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    placeholder="Quantity"
                    min="0.1"
                    step="0.1"
                    className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
                  />
                  <div className="relative">
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="w-full appearance-none bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none scheme-dark cursor-pointer pr-8"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                    ₦
                  </span>
                  <input
                    type="number"
                    value={customBudget}
                    onChange={(e) => setCustomBudget(e.target.value)}
                    placeholder="Your budget *"
                    className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl pl-8 pr-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
                  />
                </div>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder:text-white/20"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white/60 transition"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={addCustomItem}
                  disabled={!customName.trim() || !customQty || !customBudget}
                  className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition disabled:opacity-40 shadow-lg shadow-green-500/20"
                >
                  Add to cart
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
