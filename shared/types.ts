export type ProductStatus = 'on' | 'off' | 'violation';

export interface Category {
  id: number;
  name: string;
  icon?: string;
  sort: number;
  createdAt: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  categoryName?: string;
  images: string[];
  contact: string;
  seller: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  productId: number;
  sender: string;
  content: string;
  createdAt: string;
  isMine?: boolean;
}

export interface Favorite {
  id: number;
  productId: number;
  userId: string;
  createdAt: string;
  product?: Product;
}

export type SortBy = 'latest' | 'price_asc' | 'price_desc';

export interface ProductListQuery {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  status?: ProductStatus;
  page?: number;
  pageSize?: number;
  sortBy?: SortBy;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
}

export interface ModerationResult {
  isViolation: boolean;
  matchedKeywords: string[];
  suggestion: string;
}
