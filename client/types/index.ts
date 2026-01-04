
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface Shop {
  id: string;
  name: string;
  logo: string;
  description: string;
  link: string;
  supportedCountries: string[];
  rating: number;
  reviewCount: number;
  isFavorite: boolean;
  category: string;
  vendorId?: string;
  isApproved?: boolean;
  location?: string;
  city?: string;
  country?: string;
  language?: string;
}

export interface Coupon {
  id: string;
  shopId: string;
  shopName: string;
  code: string;
  description: string;
  discount: string;
  expiryDate: string;
  isExpired: boolean;
}

export interface Offer {
  id: string;
  shopId: string;
  shopName: string;
  title: string;
  description: string;
  discount: string;
  originalPrice?: string;
  salePrice?: string;
  image: string;
  expiryDate?: string;
  isLimited: boolean;
}

export interface Ad {
  id: string;
  title: string;
  image: string;
  linkType: 'external' | 'internal';
  linkUrl: string;
  shopId?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  priority: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: 'male' | 'female';
  country: string;
  city?: string;
  language: string;
  role: 'user' | 'admin' | 'vendor';
  createdAt: string;
  availableRolls?: number;
  totalShares?: number;
  lastShareDate?: string;
}

export interface VendorProfile {
  id: string;
  userId: string;
  shopId?: string;
  rollPackages: RollPackage[];
  availableRolls: number;
  totalRollsUsed: number;
  createdAt: string;
  recentPackages?: RollPackage[];
}

export interface RollPackage {
  id: string;
  vendorId: string;
  packageType: '25' | '50' | '100' | '500';
  price: number;
  rollsIncluded: number;
  bonusRolls: number;
  purchaseDate: string;
  isActive: boolean;
}

export interface ShopRequest {
  id: string;
  vendorId: string;
  name: string;
  logo: string;
  description: string;
  link: string;
  location: string;
  country: string;
  city: string;
  language: string;
  category: string;
  supportedCountries: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface Review {
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface VendorSubscription {
  id: string;
  vendorId: string;
  type: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
}

export interface Roll {
  id: string;
  shopId: string;
  shopName: string;
  shopLogo: string;
  videoUrl: string;
  caption: string;
  category: 'men' | 'women' | 'kids' | 'all';
  likes: number;
  comments: RollComment[];
  commentsCount: number;
  saves: number;
  shares: number;
  createdBy: string;
  createdAt: string;
  isLiked: boolean;
  isSaved: boolean;
  duration: number; // in seconds
}

export interface RollComment {
  id: string;
  rollId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

export interface RollUpload {
  videoUri: string;
  caption: string;
  category: 'men' | 'women' | 'kids' | 'all';
  shopId: string;
  duration?: number;
}

export interface AuthState {
  user: User | null;
  vendorProfile: VendorProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
