export type MarketDayStatus = "open" | "closed" | "completed";
export type OrderStatus = "pending" | "confirmed" | "packed" | "ready" | "delivered";
export type DeliveryType = "pickup" | "delivery" | "courier";

export interface MarketDay {
  id: string;
  date: string; // ISO string
  deadline: string; // ISO string
  status: MarketDayStatus;
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // kg, pieces, bags, etc.
  estimatedPrice?: number;
  notes?: string;
}

export interface Order {
  id: string;
  marketDayId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  uid?: string; // if they signed in with Google
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  deliveryFee: number;
  items: OrderItem[];
  orderStatus: OrderStatus;
  paymentConfirmed: boolean;
  totalEstimate: number;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  defaultUnit: string;
  category?: string;
}

export interface MasterShoppingItem {
  name: string;
  unit: string;
  totalQuantity: number;
  orders: { orderId: string; customerName: string; quantity: number }[];
}