import type {
  ApiResponse,
  Category,
  Product,
  ProductListQuery,
  Message,
  Favorite,
} from '../../shared/types';

const BASE = '';

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const text = await res.text();
  let data: ApiResponse<T>;
  try {
    data = text ? JSON.parse(text) : { success: false, message: '空响应' };
  } catch {
    data = { success: false, message: text || '解析失败' };
  }
  if (!res.ok && !data.success) {
    return data;
  }
  return data;
}

export const categoriesApi = {
  list: () => request<Category[]>('/api/categories'),
  create: (payload: { name: string; icon?: string; sort?: number }) =>
    request<Category>('/api/categories', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<{ name: string; icon: string; sort: number }>) =>
    request<Category>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => request<void>(`/api/categories/${id}`, { method: 'DELETE' }),
};

export const productsApi = {
  list: (q: ProductListQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    const query = params.toString();
    return request<Product[]>(`/api/products${query ? `?${query}` : ''}`);
  },
  detail: (id: number) => request<Product>(`/api/products/${id}`),
  create: (payload: Partial<Product> & { title: string; price: number }) =>
    request<Product>('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateStatus: (id: number, status: 'on' | 'off' | 'violation') =>
    request<void>(`/api/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  remove: (id: number) => request<void>(`/api/products/${id}`, { method: 'DELETE' }),
};

export const messagesApi = {
  list: (productId: number, user?: string, since?: string) => {
    const params = new URLSearchParams();
    if (user) params.append('user', user);
    if (since) params.append('since', since);
    const query = params.toString();
    return request<Message[]>(`/api/messages/product/${productId}${query ? `?${query}` : ''}`);
  },
  send: (payload: { productId: number; sender: string; content: string }) =>
    request<Message>('/api/messages', { method: 'POST', body: JSON.stringify(payload) }),
  remove: (id: number) => request<void>(`/api/messages/${id}`, { method: 'DELETE' }),
};

export const favoritesApi = {
  list: (userId: string) => request<Favorite[]>(`/api/favorites/${userId}`),
  check: (userId: string, productId: number) =>
    request<boolean>(`/api/favorites/${userId}/check/${productId}`),
  toggle: (payload: { productId: number; userId: string }) =>
    request<{ favorited: boolean; id?: number }>('/api/favorites', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  remove: (userId: string, productId: number) =>
    request<void>(`/api/favorites/${userId}/${productId}`, { method: 'DELETE' }),
};

export const uploadApi = {
  image: async (file: File): Promise<ApiResponse<{ url: string; filename: string; originalName: string }>> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload/image', { method: 'POST', body: form });
    return res.json();
  },
  images: async (files: File[]): Promise<ApiResponse<Array<{ url: string; filename: string; originalName: string }>>> => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const res = await fetch('/api/upload/images', { method: 'POST', body: form });
    return res.json();
  },
};
