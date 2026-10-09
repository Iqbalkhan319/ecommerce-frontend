// Shared API contract types. These mirror the response envelopes and DTOs published by
// the backend services and are the single definition used by both applications.

export interface ApiMeta {
  [key: string]: unknown;
}

export interface PageMeta extends ApiMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  requestId: string;
  timestamp: string;
  details?: unknown;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export type PrincipalType = 'ADMIN' | 'CUSTOMER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  type: PrincipalType;
  status: AccountStatus;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: string;
}

export interface AuthSession {
  user: AuthenticatedUser;
  tokens: TokenPair;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  isPrimary: boolean;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  price: string;
  compareAtPrice: string | null;
  costPrice?: string | null;
  currency: string;
  stockQuantity: number;
  lowStockThreshold: number;
  inStock: boolean;
  isLowStock: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  weightGrams: number | null;
  category: CategorySummary;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  position?: number;
  isActive?: boolean;
  imageUrl: string | null;
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartLine {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  imageUrl: string | null;
  available: boolean;
  stockQuantity: number;
}

export interface Cart {
  id: string;
  revision: number;
  items: CartLine[];
  itemCount: number;
  estimatedSubtotal: string;
  currency: string;
  checkoutReady: boolean;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  imageUrl: string | null;
}

export interface OrderStatusEvent {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByEmail: string | null;
  reason: string | null;
  createdAt: string;
}

export interface OrderInvoice {
  id: string;
  invoiceNumber: string;
  status: 'PENDING' | 'GENERATED' | 'FAILED';
  available: boolean;
  generatedAt: string | null;
}

export interface Address {
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  phone?: string | null;
}

export interface SavedAddress extends Address {
  id: string;
  label: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  status: OrderStatus;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  currency: string;
  itemCount: number;
  shippingAddress: Address;
  billingAddress: Address | null;
  customerNote: string | null;
  internalNote?: string | null;
  rejectionReason: string | null;
  items: OrderItem[];
  history: OrderStatusEvent[];
  invoice: OrderInvoice | null;
  placedAt: string;
  confirmedAt: string | null;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  phone: string | null;
  marketingOptIn: boolean;
  addresses: SavedAddress[];
}

export interface AdminAccount {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  type: PrincipalType;
  status: AccountStatus;
  isSuperAdmin: boolean;
  roles: string[];
  permissions?: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CustomerAccount extends AdminAccount {
  orderCount: number;
  lifetimeValue: string | null;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorType: string;
  action: string;
  resource: string;
  resourceId: string | null;
  requestId: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface DashboardSummary {
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    rejected: number;
    cancelled: number;
  };
  revenue: { lifetime: string; last30Days: string; currency: string };
  catalogue: {
    activeProducts: number;
    draftProducts: number;
    outOfStock: number;
    lowStock: number;
    categories: number;
  };
  customers: { total: number; administrators: number };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    grandTotal: string;
    status: OrderStatus;
    placedAt: string;
  }>;
  topProducts: Array<{ productId: string; name: string; sku: string; unitsSold: number; revenue: string }>;
  salesTrend: Array<{ period: string; orders: number; netRevenue: string }>;
  stockAlerts: Array<{
    productId: string;
    sku: string;
    name: string;
    stockQuantity: number;
    lowStockThreshold: number;
    stockState: StockState;
  }>;
}

export type StockState = 'IN_STOCK' | 'LOW' | 'OUT_OF_STOCK';

export type StockMovementReason =
  | 'INITIAL'
  | 'SALE'
  | 'RELEASE'
  | 'RESTOCK'
  | 'RETURN'
  | 'DAMAGE'
  | 'LOSS'
  | 'CORRECTION';

export interface StockLevel {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  category: CategorySummary;
  stockQuantity: number;
  lowStockThreshold: number;
  stockState: StockState;
  price: string;
  costPrice: string | null;
  retailValue: string;
  costValue: string | null;
  unitsSold30d: number;
  lastMovementAt: string | null;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  reason: StockMovementReason;
  delta: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost: string | null;
  orderId: string | null;
  orderNumber: string | null;
  actorEmail: string | null;
  note: string | null;
  createdAt: string;
}

export interface InventorySummary {
  trackedProducts: number;
  unitsOnHand: number;
  outOfStock: number;
  lowStock: number;
  healthy: number;
  productsMissingCost: number;
  retailValue: string;
  costValue: string;
  currency: string;
  unitsSold30d: number;
  unitsReceived30d: number;
}

export interface MovementReasonOption {
  code: StockMovementReason;
  label: string;
}

export type ReportGranularity = 'day' | 'week' | 'month';

export interface ReportWindow {
  from: string;
  to: string;
  currency: string;
  revenueStatuses: OrderStatus[];
}

export interface SalesBucket {
  period: string;
  periodStart: string;
  orders: number;
  units: number;
  netRevenue: string;
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  averageOrderValue: string;
}

export interface SalesReport {
  window: ReportWindow;
  granularity: ReportGranularity;
  buckets: SalesBucket[];
  totals: {
    orders: number;
    units: number;
    netRevenue: string;
    subtotal: string;
    discount: string;
    shipping: string;
    tax: string;
    averageOrderValue: string;
    uniqueCustomers: number;
  };
  previous: { orders: number; netRevenue: string; changePercent: string | null };
}

export interface ProductPerformanceRow {
  productId: string;
  sku: string;
  name: string;
  categoryName: string | null;
  unitsSold: number;
  orders: number;
  revenue: string;
  cost: string | null;
  grossProfit: string | null;
  marginPercent: string | null;
  stockQuantity: number;
}

export interface CategoryPerformanceRow {
  categoryId: string;
  name: string;
  productsSold: number;
  unitsSold: number;
  orders: number;
  revenue: string;
  revenueShare: string;
}

export interface CustomerReportRow {
  customerId: string;
  customerName: string;
  customerEmail: string;
  orders: number;
  units: number;
  revenue: string;
  averageOrderValue: string;
  firstOrderAt: string;
  lastOrderAt: string;
  isNewCustomer: boolean;
}

export interface OrderFunnelReport {
  window: ReportWindow;
  byStatus: Array<{ status: OrderStatus; orders: number; value: string; share: string }>;
  totals: { placed: number; confirmed: number; rejected: number; cancelled: number; delivered: number };
  confirmationRate: string;
  attritionRate: string;
  medianHoursToConfirm: string | null;
  medianHoursToDeliver: string | null;
  rejectionReasons: Array<{ reason: string; orders: number }>;
}

export interface InventoryReportRow {
  productId: string;
  sku: string;
  name: string;
  categoryName: string;
  status: string;
  stockQuantity: number;
  lowStockThreshold: number;
  stockState: StockState;
  price: string;
  costPrice: string | null;
  retailValue: string;
  costValue: string | null;
  unitsSold: number;
  daysOfCover: string | null;
  lastMovementAt: string | null;
}

export interface InventoryReport {
  window: ReportWindow;
  totals: {
    products: number;
    unitsOnHand: number;
    retailValue: string;
    costValue: string;
    outOfStock: number;
    lowStock: number;
    productsMissingCost: number;
  };
  rows: InventoryReportRow[];
}

export interface ReportRows<T> {
  window: ReportWindow;
  rows: T[];
}

export const PERMISSION_CODES = [
  'product:read', 'product:create', 'product:update', 'product:delete',
  'category:read', 'category:create', 'category:update', 'category:delete',
  'order:read', 'order:update', 'order:confirm', 'order:reject',
  'customer:read', 'customer:update', 'customer:delete',
  'admin:read', 'admin:create', 'admin:update', 'admin:delete',
  'role:read', 'role:create', 'role:update', 'role:delete',
  'inventory:read', 'inventory:adjust',
  'report:read', 'report:export',
  'permission:read', 'invoice:read', 'audit:read', 'dashboard:read',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];
