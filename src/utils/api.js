const BASE_URL = import.meta.env.DEV ? 'http://localhost:8080' : '';

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payloadJson = atob(paddedBase64);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

function isJwtExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}

export function clearAuthSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('currentUser');
  window.dispatchEvent(new Event('storage'));
}

export function getValidToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  if (isJwtExpired(token)) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      clearAuthSession();
      return null;
    }
    // Return expired token, allow request to fail and trigger 401 refresh flow
    return token;
  }

  return token;
}

// Shared fetch wrapper that attaches JWT, serializes JSON, and normalizes backend errors.
async function request(endpoint, options = {}) {
  const token = getValidToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(typeof FormData !== 'undefined' && config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
      try {
        const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('token', data.token);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          
          config.headers.Authorization = `Bearer ${data.token}`;
          response = await fetch(`${BASE_URL}${endpoint}`, config);
        } else {
          clearAuthSession();
        }
      } catch {
        clearAuthSession();
      }
    } else {
      clearAuthSession();
    }
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuthSession();
    }
    let errorMessage = 'Đã xảy ra lỗi hệ thống';
    try {
      const errorData = await response.json();
      if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
        errorMessage = errorData.details
          .map(d => d.includes(':') ? d.split(':').slice(1).join(':').trim() : d)
          .join('\n');
      } else {
        errorMessage = errorData.message || errorData.error || errorMessage;
      }
    } catch {
      // Ignore parse errors
    }
    throw new Error(errorMessage);
  }

  // Check if there is content in response
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return null;
}

// Download helper used by admin Excel report exports.
async function downloadFile(endpoint, filename) {
  const token = getValidToken();
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const response = await fetch(`${BASE_URL}${endpoint}`, { headers });
  if (!response.ok) {
    throw new Error('Đã xảy ra lỗi khi tải file báo cáo');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Normalize backend product shape into the frontend product model used by pages/components.
function mapProduct(p) {
  if (!p) return p;

  let parsedHighlights = [];
  if (p.highlights) {
    try {
      parsedHighlights = typeof p.highlights === 'string' ? JSON.parse(p.highlights) : p.highlights;
    } catch {
      parsedHighlights = [];
    }
  }

  return {
    ...p,
    title: p.title || p.name,
    desc: p.desc || p.description,
    image: p.image || p.imageUrl,
    category: p.category && typeof p.category === 'object' ? p.category.name : p.category,
    rating: p.rating !== undefined ? p.rating : (p.averageRating || 0),
    reviews: p.reviews !== undefined ? p.reviews : (p.reviewCount || 0),
    category_id: p.category_id || (p.category && typeof p.category === 'object' ? p.category.id : null),
    specs: p.specs || {
      volume: p.volume || '',
      weight: p.weight || '',
      material: p.material || '',
      dimensions: p.dimensions || '',
      warranty: p.warranty || '12 tháng chính hãng'
    },
    highlights: parsedHighlights
  };
}

// Normalize Spring Page responses while preserving pagination metadata.
function mapProductPageResponse(res) {
  return {
    items: Array.isArray(res?.content) ? res.content.map(mapProduct) : [],
    page: res?.number ?? 0,
    totalPages: res?.totalPages ?? 0,
    totalItems: res?.totalElements ?? 0,
  };
}

// Translate UI sort labels into backend sort query values.
function mapSortToBackend(sortBy) {
  switch (sortBy) {
    case 'Giá: Thấp đến Cao':
      return 'price_asc';
    case 'Giá: Cao xuống Thấp':
      return 'price_desc';
    case 'Bán chạy nhất':
      return 'rating_desc';
    default:
      return 'created_at_desc';
  }
}

// Central API client grouped by customer-facing and admin-facing modules.
export const api = {
  // Auth API
  auth: {
    login: (email, password) => 
      request('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      }),
    register: (email, password, fullName, phone) => 
      request('/api/auth/register', {
        method: 'POST',
        body: { email, password, fullName, phone },
      }),
  },

  // Customer Profile
  profile: {
    get: () => request('/api/profile'),
    update: (data) => request('/api/profile', { method: 'PUT', body: data }),
  },

  // Products & Categories
  products: {
    getAll: async (params = {}) => {
      const items = [];
      let page = 0;
      let totalPages = 1;
      while (page < totalPages) {
        const result = await api.products.getPage({ ...params, page, limit: 100 });
        items.push(...result.items);
        totalPages = result.totalPages;
        page += 1;
      }
      return items;
    },
    getPage: async (params = {}) => {
      const query = new URLSearchParams();
      const finalParams = { page: 0, limit: 20, ...params };
      Object.entries(finalParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      const queryString = query.toString();
      const res = await request(`/api/products${queryString ? `?${queryString}` : ''}`);
      return mapProductPageResponse(res);
    },
    getOne: async (id) => {
      const res = await request(`/api/products/${id}`);
      return mapProduct(res);
    },
    getCategories: () => request('/api/categories'),
    mapSortToBackend,
  },

  // Reviews
  reviews: {
    getByProduct: (productId) => request(`/api/reviews/product/${productId}`),
    checkPurchase: (productId) => request(`/api/reviews/check-purchase?productId=${productId}`),
    create: (productId, rating, comment) => 
      request('/api/reviews', {
        method: 'POST',
        body: { productId, rating, comment },
      }),
  },

  // Orders
  orders: {
    create: (orderData) => 
      request('/api/orders', {
        method: 'POST',
        body: orderData,
      }),
    getMyOrders: () => request('/api/orders/my-orders'),
    track: (orderId, phone) => request(`/api/orders/track?orderId=${encodeURIComponent(orderId)}&phone=${encodeURIComponent(phone)}`),
  },

  // Admin APIs
  admin: {
    products: {
      create: (data) => request('/api/admin/products', { method: 'POST', body: data }),
      update: (id, data) => request(`/api/admin/products/${id}`, { method: 'PUT', body: data }),
      delete: (id) => request(`/api/admin/products/${id}`, { method: 'DELETE' }),
    },
    customers: {
      getAll: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, val);
          }
        });
        const q = query.toString();
        return request(`/api/admin/customers${q ? `?${q}` : ''}`);
      },
      create: (data) => request('/api/admin/customers', { method: 'POST', body: data }),
      update: (id, data) => request(`/api/admin/customers/${id}`, { method: 'PUT', body: data }),
      delete: (id) => request(`/api/admin/customers/${id}`, { method: 'DELETE' }),
    },
    orders: {
      getAll: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, val);
          }
        });
        const q = query.toString();
        return request(`/api/admin/orders${q ? `?${q}` : ''}`);
      },
      create: (data) => request('/api/admin/orders', { method: 'POST', body: data }),
      update: (id, data) => request(`/api/admin/orders/${id}`, { method: 'PUT', body: data }),
      updateStatus: (id, status) => request(`/api/admin/orders/${id}/status`, { method: 'PUT', body: { status } }),
      delete: (id) => request(`/api/admin/orders/${id}`, { method: 'DELETE' }),
    },
    reviews: {
      getAll: () => request('/api/admin/reviews'),
      delete: (id) => request(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
    },
    media: {
      uploadImage: (file, oldUrl = '') => {
        const formData = new FormData();
        formData.append('file', file);
        if (oldUrl) {
          formData.append('oldUrl', oldUrl);
        }
        return request('/api/admin/uploads', {
          method: 'POST',
          body: formData,
        });
      },
    },
    reports: {
      getRevenue: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, val);
          }
        });
        const q = query.toString();
        return request(`/api/admin/reports/revenue${q ? `?${q}` : ''}`);
      },
      getCustomerReport: () => request('/api/admin/reports/customers'),
      downloadOrders: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, val);
          }
        });
        return downloadFile(`/api/admin/reports/export/orders?${query.toString()}`, 'orders-report.xlsx');
      },
      downloadCustomers: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, val);
          }
        });
        return downloadFile(`/api/admin/reports/export/customers?${query.toString()}`, 'customers-report.xlsx');
      }
    }
  }
};
