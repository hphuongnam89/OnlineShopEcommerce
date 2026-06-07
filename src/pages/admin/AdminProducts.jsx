import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Plus, Edit3, Trash2, Search, Package, AlertCircle } from 'lucide-react';
import CustomModal from '../../components/CustomModal';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Filter and Search states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Form states (Add/Edit Modal)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [editingId, setEditingId] = useState(null);
  
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [weight, setWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [material, setMaterial] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [sku, setSku] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch products using standard products list
      const data = await api.products.getAll();
      setProducts(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.products.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
    }
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setPrice('');
    setStock('');
    setImageUrl('');
    setWeight('');
    setVolume('');
    setMaterial('');
    setDimensions('');
    setSku('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p) => {
    setFormMode('edit');
    setEditingId(p.id);
    setName(p.name || p.title || '');
    setCategoryId(p.category_id || (p.category && typeof p.category === 'object' ? p.category.id : ''));
    setDescription(p.description || p.desc || '');
    setPrice(p.price || '');
    setStock(p.stock || 0);
    setImageUrl(p.imageUrl || p.image || '');
    setWeight(p.weight || '');
    setVolume(p.volume || '');
    setMaterial(p.material || '');
    setDimensions(p.dimensions || '');
    setSku(p.sku || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price || stock === '') {
      setModalConfig({
        isOpen: true,
        title: 'Cảnh báo',
        message: 'Vui lòng điền đầy đủ tên, giá và tồn kho của sản phẩm!',
        type: 'warning'
      });
      return;
    }

    const payload = {
      name: name.trim(),
      categoryId: categoryId ? parseInt(categoryId) : null,
      description: description.trim(),
      price: parseFloat(price),
      stock: parseInt(stock),
      imageUrl: imageUrl.trim() || '/images/thinktanklogo.png',
      weight: weight.trim(),
      volume: volume.trim(),
      material: material.trim(),
      dimensions: dimensions.trim(),
      sku: sku.trim() || `TT-${Date.now()}`
    };

    try {
      if (formMode === 'create') {
        await api.admin.products.create(payload);
        setModalConfig({
          isOpen: true,
          title: 'Thành công',
          message: 'Đã thêm sản phẩm mới thành công!',
          type: 'success'
        });
      } else {
        await api.admin.products.update(editingId, payload);
        setModalConfig({
          isOpen: true,
          title: 'Thành công',
          message: 'Đã cập nhật sản phẩm thành công!',
          type: 'success'
        });
      }
      setIsFormOpen(false);
      fetchProducts();
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Thất bại',
        message: err.message || 'Có lỗi xảy ra khi lưu sản phẩm.',
        type: 'warning'
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      return;
    }

    try {
      await api.admin.products.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setModalConfig({
        isOpen: true,
        title: 'Thành công',
        message: 'Đã xóa sản phẩm thành công khỏi hệ thống!',
        type: 'success'
      });
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Thất bại',
        message: err.message || 'Không thể xóa sản phẩm.',
        type: 'warning'
      });
    }
  };

  // Filter products based on search and selected category
  const filteredProducts = products.filter(p => {
    const pName = (p.name || p.title || '').toLowerCase();
    const pSku = (p.sku || '').toLowerCase();
    const query = search.toLowerCase();
    
    const matchesSearch = pName.includes(query) || pSku.includes(query);
    
    const catId = p.category_id || (p.category && typeof p.category === 'object' ? p.category.id : null);
    const matchesCategory = !selectedCategory || String(catId) === String(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Quản Lý Sản Phẩm</h1>
          <p className="text-slate-400 mt-1">Quản lý kho hàng, giá bán, biến thể và thuộc tính sản phẩm.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center gap-2 text-sm transition-all duration-200 shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Thêm Sản Phẩm</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm hoặc SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[180px]"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Grid or Table list */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">Đang tải danh sách sản phẩm...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-500">Không tìm thấy sản phẩm nào phù hợp.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-900/50">
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Giá bán</th>
                  <th className="px-6 py-4">Tồn kho</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.image || p.imageUrl || '/images/thinktanklogo.png'} 
                          alt={p.name || p.title} 
                          className="w-10 h-10 object-cover rounded-lg bg-slate-800 border border-slate-850"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[280px]">{p.name || p.title}</p>
                          <p className="text-xs text-slate-500 truncate">{p.category && typeof p.category === 'object' ? p.category.name : p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {p.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {p.price?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.stock > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {p.stock} sản phẩm
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all cursor-pointer"
                          title="Sửa sản phẩm"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto pt-24 pb-12">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-bold text-white">
                {formMode === 'create' ? 'Thêm Sản Phẩm Mới' : 'Cập Nhật Sản Phẩm'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên sản phẩm..."
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Danh mục *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">SKU *</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ví dụ: TT-ACCELERATOR"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Giá bán (đ) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="3890000"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Số lượng tồn kho *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">URL Ảnh sản phẩm</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Mô tả sản phẩm</label>
                  <textarea
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả chi tiết sản phẩm..."
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Trọng lượng (Weight)</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Ví dụ: 1500 g"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Thể tích (Volume)</label>
                  <input
                    type="text"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="Ví dụ: 25 L"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Chất liệu (Material)</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Ví dụ: Ballistic Nylon"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Kích thước (Dimensions)</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="Ví dụ: 30 x 45 x 15 cm"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  {formMode === 'create' ? 'Lưu sản phẩm' : 'Cập nhật sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default AdminProducts;
