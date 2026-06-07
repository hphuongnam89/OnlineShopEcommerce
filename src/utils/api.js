const BASE_URL = import.meta.env.DEV ? 'http://localhost:8080' : '';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = 'Đã xảy ra lỗi hệ thống';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
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

async function downloadFile(endpoint, filename) {
  const token = localStorage.getItem('token');
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

function mapProduct(p) {
  if (!p) return p;
  return {
    ...p,
    title: p.title || p.name,
    desc: p.desc || p.description,
    image: p.image || p.imageUrl,
    category: p.category && typeof p.category === 'object' ? p.category.name : p.category,
    rating: p.rating !== undefined ? p.rating : (p.averageRating || 0),
    reviews: p.reviews !== undefined ? p.reviews : (p.reviewCount || 0),
    category_id: p.category_id || (p.category && typeof p.category === 'object' ? p.category.id : null),
  };
}

function mapProductPageResponse(res) {
  return {
    items: Array.isArray(res?.content) ? res.content.map(mapProduct) : [],
    page: res?.number ?? 0,
    totalPages: res?.totalPages ?? 0,
    totalItems: res?.totalElements ?? 0,
  };
}

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

  // Products & Categories
  products: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams();
      const finalParams = { page: 0, limit: 20, ...params };
      Object.entries(finalParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      const queryString = query.toString();
      const res = await request(`/api/products${queryString ? `?${queryString}` : ''}`);
      const page = mapProductPageResponse(res);
      return page.items;
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
    reports: {
      getRevenue: () => request('/api/admin/reports/revenue'),
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
