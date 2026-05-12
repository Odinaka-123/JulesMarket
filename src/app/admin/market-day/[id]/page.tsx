"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/client";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { MarketDay, Order, MasterShoppingItem } from "@/types";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft,
  ShoppingBasket,
  ClipboardList,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Tab = "orders" | "shopping-list";

const statusFlow: Order["orderStatus"][] = [
  "pending",
  "confirmed",
  "packed",
  "ready",
  "delivered",
];

const statusConfig: Record<
  Order["orderStatus"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    icon: <Clock className="w-3 h-3" />,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  packed: {
    label: "Packed",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    icon: <Package className="w-3 h-3" />,
  },
  ready: {
    label: "Ready",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: <ShoppingBasket className="w-3 h-3" />,
  },
  delivered: {
    label: "Delivered",
    color: "bg-white/5 text-white/40 border-white/10",
    icon: <Truck className="w-3 h-3" />,
  },
};

function buildMasterList(orders: Order[]): MasterShoppingItem[] {
  const map = new Map<string, MasterShoppingItem>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = `${item.name.toLowerCase()}__${item.unit}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.totalQuantity += item.quantity;
        existing.orders.push({
          orderId: order.id,
          customerName: order.customerName,
          quantity: item.quantity,
        });
      } else {
        map.set(key, {
          name: item.name,
          unit: item.unit,
          totalQuantity: item.quantity,
          orders: [
            {
              orderId: order.id,
              customerName: order.customerName,
              quantity: item.quantity,
            },
          ],
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default function MarketDayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [marketDay, setMarketDay] = useState<MarketDay | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<Tab>("orders");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [marketDayStatus, setMarketDayStatus] = useState<
    MarketDay["status"] | null
  >(null);

  useEffect(() => {
    async function fetchMarketDay() {
      const snap = await getDoc(doc(db, "market_days", id));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as MarketDay;
        setMarketDay(data);
        setMarketDayStatus(data.status);
      }
    }
    fetchMarketDay();
  }, [id]);

  useEffect(() => {
    const q = query(
      collection(db, "market_days", id, "orders"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
    });
    return () => unsub();
  }, [id]);

  async function updateOrderStatus(
    orderId: string,
    field: "orderStatus" | "paymentConfirmed" | "deliveryFee",
    value: string | boolean | number,
  ) {
    setUpdatingOrder(orderId);
    await updateDoc(doc(db, "market_days", id, "orders", orderId), {
      [field]: value,
    });
    setUpdatingOrder(null);
  }

  async function updateMarketDayStatus(status: MarketDay["status"]) {
    await updateDoc(doc(db, "market_days", id), { status });
    setMarketDayStatus(status);
    setMarketDay((d) => (d ? { ...d, status } : d));
  }

  function copyShoppingList() {
    const list = buildMasterList(orders);
    const text =
      `🛒 JulesMarket Shopping List\n` +
      `📅 ${marketDay ? new Date(marketDay.date).toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric" }) : ""}\n\n` +
      list.map((i) => `• ${i.name} — ${i.totalQuantity} ${i.unit}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyOrderLink() {
    navigator.clipboard.writeText(`${window.location.origin}/order/${id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  const masterList = buildMasterList(orders);
  const confirmedPayments = orders.filter((o) => o.paymentConfirmed).length;
  const pendingPayments = orders.filter((o) => !o.paymentConfirmed).length;
  const totalRevenue = orders
    .filter((o) => o.paymentConfirmed)
    .reduce((sum, o) => sum + o.totalEstimate + o.deliveryFee, 0);

  const marketDayStatusStyle: Record<MarketDay["status"], string> = {
    open: "bg-green-500/10 text-green-400 border-green-500/20",
    closed: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    completed: "bg-white/5 text-white/40 border-white/10",
  };

  return (
    <main className="min-h-dvh bg-[#0a1a0a] text-white">
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-green-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full opacity-10 blur-3xl" />
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/dashboard">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 transition text-white/40 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.div>
            </Link>
            <div className="min-w-0">
              <h1 className="font-black text-sm sm:text-base truncate">
                {marketDay ?
                  new Date(marketDay.date).toLocaleDateString("en-NG", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : "Loading..."}
              </h1>
              {marketDay && (
                <p className="text-white/30 text-xs truncate">
                  Deadline:{" "}
                  {new Date(marketDay.deadline).toLocaleString("en-NG", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Right side: copy link + status */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Copy order link button — always visible */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={copyOrderLink}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all duration-200 ${
                copiedLink
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">Copy link</span>
                </>
              )}
            </motion.button>

            {/* Status badge + selector */}
            {marketDayStatus && (
              <>
                <span
                  className={`text-xs border px-2.5 py-1 rounded-full font-medium hidden sm:inline-flex items-center gap-1 ${marketDayStatusStyle[marketDayStatus]}`}
                >
                  {marketDayStatus === "open" ?
                    "🟢 Open"
                  : marketDayStatus === "closed" ?
                    "🟡 Closed"
                  : "✅ Done"}
                </span>
                <select
                  value={marketDayStatus}
                  onChange={(e) =>
                    updateMarketDayStatus(e.target.value as MarketDay["status"])
                  }
                  className="bg-white/5 border border-white/10 text-white text-xs rounded-xl px-2 py-1.5 outline-none [color-scheme:dark] cursor-pointer hover:border-green-500/30 transition"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="completed">Completed</option>
                </select>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
          {[
            { label: "Total Orders", value: orders.length, emoji: "📦" },
            { label: "Paid", value: confirmedPayments, emoji: "✅" },
            { label: "Unpaid", value: pendingPayments, emoji: "⏳" },
            {
              label: "Revenue",
              value: `₦${totalRevenue.toLocaleString()}`,
              emoji: "💰",
            },
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

        {/* Tabs */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-5">
          <button
            onClick={() => setTab("orders")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
              tab === "orders" ?
                "bg-green-500 text-black shadow"
              : "text-white/40 hover:text-white/60"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setTab("shopping-list")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
              tab === "shopping-list" ?
                "bg-green-500 text-black shadow"
              : "text-white/40 hover:text-white/60"
            }`}
          >
            <ShoppingBasket className="w-4 h-4" />
            Shopping List ({masterList.length})
          </button>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === "orders" ?
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {orders.length === 0 ?
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-white/40 text-sm">No orders yet</p>
                  <p className="text-white/20 text-xs mt-1">
                    Share the order link with your customers
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={copyOrderLink}
                    className={`mt-4 flex items-center gap-2 text-xs font-semibold border px-4 py-2 rounded-xl transition mx-auto ${
                      copiedLink
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "border-green-500/30 text-green-400 hover:bg-green-500/5"
                    }`}
                  >
                    {copiedLink ? (
                      <><Check className="w-3.5 h-3.5" /> Copied!</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copy order link</>
                    )}
                  </motion.button>
                </div>
              : <div className="space-y-3">
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden"
                    >
                      {/* Order header */}
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() =>
                          setExpandedOrder(
                            expandedOrder === order.id ? null : order.id,
                          )
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm sm:text-base">
                                {order.customerName}
                              </p>
                              <span
                                className={`text-xs border px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
                                  statusConfig[order.orderStatus].color
                                }`}
                              >
                                {statusConfig[order.orderStatus].icon}
                                {statusConfig[order.orderStatus].label}
                              </span>
                              {order.paymentConfirmed ?
                                <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                                  ✅ Paid
                                </span>
                              : <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                                  ⏳ Unpaid
                                </span>
                              }
                            </div>
                            <p className="text-white/40 text-xs mt-1">
                              📞 {order.customerPhone} ·{" "}
                              {order.deliveryType === "pickup" ?
                                "🏃 Pickup"
                              : order.deliveryType === "delivery" ?
                                "🚗 Delivery"
                              : "📦 Courier"}{" "}
                              · {order.items.length} item
                              {order.items.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-white/60">
                              ₦
                              {(
                                order.totalEstimate + order.deliveryFee
                              ).toLocaleString()}
                            </span>
                            {expandedOrder === order.id ?
                              <ChevronUp className="w-4 h-4 text-white/30" />
                            : <ChevronDown className="w-4 h-4 text-white/30" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.25,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
                              {/* Items */}
                              <div>
                                <p className="text-xs text-white/30 mb-2 font-medium uppercase tracking-wide">
                                  Items
                                </p>
                                <div className="space-y-1.5">
                                  {order.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between bg-white/3 rounded-xl px-3 py-2"
                                    >
                                      <span className="text-sm text-white/80">
                                        {item.name}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs text-white/40">
                                          {item.quantity} {item.unit}
                                        </span>
                                        {item.estimatedPrice ?
                                          <span className="text-xs text-white/50">
                                            ₦
                                            {item.estimatedPrice.toLocaleString()}
                                          </span>
                                        : null}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Delivery address */}
                              {order.deliveryAddress && (
                                <div>
                                  <p className="text-xs text-white/30 mb-1 font-medium uppercase tracking-wide">
                                    Delivery Address
                                  </p>
                                  <p className="text-sm text-white/60 bg-white/3 rounded-xl px-3 py-2">
                                    📍 {order.deliveryAddress}
                                  </p>
                                </div>
                              )}

                              {/* Notes */}
                              {order.notes && (
                                <div>
                                  <p className="text-xs text-white/30 mb-1 font-medium uppercase tracking-wide">
                                    Notes
                                  </p>
                                  <p className="text-sm text-white/60 bg-white/3 rounded-xl px-3 py-2">
                                    📝 {order.notes}
                                  </p>
                                </div>
                              )}

                              {/* Controls */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Order status */}
                                <div>
                                  <p className="text-xs text-white/30 mb-1.5 font-medium">
                                    Order Status
                                  </p>
                                  <select
                                    value={order.orderStatus}
                                    disabled={updatingOrder === order.id}
                                    onChange={(e) =>
                                      updateOrderStatus(
                                        order.id,
                                        "orderStatus",
                                        e.target.value as Order["orderStatus"],
                                      )
                                    }
                                    className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 outline-none [color-scheme:dark] cursor-pointer hover:border-green-500/30 transition"
                                  >
                                    {statusFlow.map((s) => (
                                      <option key={s} value={s}>
                                        {statusConfig[s].label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Payment */}
                                <div>
                                  <p className="text-xs text-white/30 mb-1.5 font-medium">
                                    Payment
                                  </p>
                                  <button
                                    disabled={updatingOrder === order.id}
                                    onClick={() =>
                                      updateOrderStatus(
                                        order.id,
                                        "paymentConfirmed",
                                        !order.paymentConfirmed,
                                      )
                                    }
                                    className={`w-full text-xs font-semibold py-2.5 px-3 rounded-xl border transition ${
                                      order.paymentConfirmed ?
                                        "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                                      : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                    }`}
                                  >
                                    {order.paymentConfirmed ?
                                      "✅ Confirmed"
                                    : "⏳ Mark Paid"}
                                  </button>
                                </div>

                                {/* Delivery fee */}
                                <div>
                                  <p className="text-xs text-white/30 mb-1.5 font-medium">
                                    Delivery Fee (₦)
                                  </p>
                                  <input
                                    type="number"
                                    defaultValue={order.deliveryFee}
                                    onBlur={(e) =>
                                      updateOrderStatus(
                                        order.id,
                                        "deliveryFee",
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-full bg-white/5 border border-white/10 focus:border-green-500/50 rounded-xl px-3 py-2.5 text-white text-xs outline-none transition"
                                    placeholder="0"
                                  />
                                </div>
                              </div>

                              {/* Total */}
                              <div className="flex items-center justify-between bg-green-500/5 border border-green-500/10 rounded-xl px-4 py-3">
                                <span className="text-xs text-white/40">
                                  Total
                                </span>
                                <span className="font-black text-green-400">
                                  ₦
                                  {(
                                    order.totalEstimate + order.deliveryFee
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              }
            </motion.div>
          : <motion.div
              key="shopping-list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {masterList.length === 0 ?
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                  <div className="text-4xl mb-3">🧺</div>
                  <p className="text-white/40 text-sm">No items yet</p>
                  <p className="text-white/20 text-xs mt-1">
                    Items appear here once customers place orders
                  </p>
                </div>
              : <div>
                  {/* Copy shopping list button */}
                  <div className="flex justify-end mb-4">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={copyShoppingList}
                      className="flex items-center gap-2 text-xs font-semibold border border-green-500/30 text-green-400 hover:bg-green-500/5 px-4 py-2.5 rounded-xl transition"
                    >
                      {copied ?
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      : <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy List
                        </>
                      }
                    </motion.button>
                  </div>

                  <div className="space-y-2">
                    {masterList.map((item, i) => (
                      <motion.div
                        key={`${item.name}-${item.unit}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-white/3 border border-white/8 rounded-2xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-sm sm:text-base capitalize">
                            {item.name}
                          </p>
                          <span className="text-sm font-black text-green-400">
                            {item.totalQuantity} {item.unit}
                          </span>
                        </div>
                        {/* Breakdown */}
                        <div className="flex flex-wrap gap-1.5">
                          {item.orders.map((o) => (
                            <span
                              key={o.orderId}
                              className="text-xs bg-white/5 border border-white/8 text-white/40 px-2 py-0.5 rounded-full"
                            >
                              {o.customerName}: {o.quantity} {item.unit}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              }
            </motion.div>
          }
        </AnimatePresence>
      </div>
    </main>
  );
}