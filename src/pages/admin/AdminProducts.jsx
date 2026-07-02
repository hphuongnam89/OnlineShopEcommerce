import { useCallback, useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Plus, Edit3, Trash2, Search, AlertCircle, Info } from 'lucide-react';
import CustomModal from '../../components/CustomModal';

// Admin product management page for CRUD, variants, specs, highlights, and image uploads.
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
  
  // Tab control in Form Modal
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'pricing', 'attributes', 'images'

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
  const [formVariants, setFormVariants] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [genColors, setGenColors] = useState('');
  const [genSizes, setGenSizes] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleAddVariantRow = () => {
    setFormVariants(prev => [
      ...prev,
      {
        id: null,
        sku: `${sku || 'TT'}-VAR-${Date.now()}-${prev.length}`,
        name: '',
        price: price || '',
        stock: 0,
        color: '',
        size: '',
        imageUrl: ''
      }
    ]);
  };

  const handleRemoveVariantRow = (index) => {
    setFormVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVariantField = (index, field, value) => {
    setFormVariants(prev => prev.map((v, i) => {
      if (i !== index) return v;
      
      let val = value;
      if (field === 'price') val = value === '' ? '' : parseFloat(value);
      if (field === 'stock') val = value === '' ? '' : parseInt(value);
      
      const updated = { ...v, [field]: val };
      if (field === 'color' || field === 'size') {
        const c = field === 'color' ? val : (v.color || '');
        const s = field === 'size' ? val : (v.size || '');
        updated.name = `${c}${c && s ? ' / ' : ''}${s}`;
      }
      return updated;
    }));
  };

  const handleGenerateVariants = () => {
    if (!genColors.trim() && !genSizes.trim()) {
      setModalConfig({
        isOpen: true,
        title: 'Cảnh báo',
        message: 'Vui lòng nhập ít nhất một màu sắc hoặc kích thước để tạo!',
        type: 'warning'
      });
      return;
    }

    const colorsArr = genColors.split(',')
      .map(c => c.trim())
      .filter(Boolean);
    const sizesArr = genSizes.split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const generated = [];
    const baseSku = sku.trim() || 'TT';

    const slugifyForSku = (str) => {
      if (!str) return '';
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .toUpperCase();
    };

    if (colorsArr.length > 0 && sizesArr.length > 0) {
      colorsArr.forEach(c => {
        sizesArr.forEach(s => {
          const varSku = `${baseSku}-${slugifyForSku(c)}-${slugifyForSku(s)}`;
            generated.push({
              id: null,
              sku: varSku,
              name: `${c} / ${s}`,
              price: price ? parseFloat(price) : 0,
              stock: 0,
              color: c,
              size: s,
              imageUrl: ''
            });
        });
      });
    } else if (colorsArr.length > 0) {
      colorsArr.forEach(c => {
        const varSku = `${baseSku}-${slugifyForSku(c)}`;
            generated.push({
              id: null,
              sku: varSku,
              name: c,
              price: price ? parseFloat(price) : 0,
              stock: 0,
              color: c,
              size: 'Standard',
              imageUrl: ''
            });
      });
    } else if (sizesArr.length > 0) {
      sizesArr.forEach(s => {
        const varSku = `${baseSku}-${slugifyForSku(s)}`;
            generated.push({
              id: null,
              sku: varSku,
              name: s,
              price: price ? parseFloat(price) : 0,
              stock: 0,
              color: 'Standard',
              size: s,
              imageUrl: ''
            });
      });
    }

    setFormVariants(prev => {
      const merged = [...prev];
      generated.forEach(g => {
        const exists = merged.some(m => m.color === g.color && m.size === g.size);
        if (!exists) {
          merged.push(g);
        }
      });
      return merged;
    });

    setModalConfig({
      isOpen: true,
      title: 'Tạo thành công',
      message: `Đã tạo thêm ${generated.length} tổ hợp biến thể! Hãy điền giá bán và tồn kho tương ứng.`,
      type: 'success'
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const result = await api.admin.media.uploadImage(file, imageUrl);
      if (result?.url) {
        setImageUrl(result.url);
        setModalConfig({
          isOpen: true,
          title: 'Tải ảnh thành công',
          message: 'Ảnh đã được tải lên và gắn vào sản phẩm.',
          type: 'success'
        });
      } else {
        throw new Error('Không nhận được đường dẫn ảnh từ server.');
      }
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Tải ảnh thất bại',
        message: err.message || 'Không thể tải ảnh lên.',
        type: 'warning'
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleVariantImageUpload = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const currentUrl = formVariants[index]?.imageUrl || '';
      const result = await api.admin.media.uploadImage(file, currentUrl);
      if (!result?.url) throw new Error('Không nhận được đường dẫn ảnh từ server.');
      setFormVariants((prev) => prev.map((v, i) => (i === index ? { ...v, imageUrl: result.url } : v)));
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Tải ảnh thất bại',
        message: err.message || 'Không thể tải ảnh lên.',
        type: 'warning'
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleHighlightImageUpload = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const currentUrl = highlights[index]?.imageUrl || '';
      const result = await api.admin.media.uploadImage(file, currentUrl);
      if (!result?.url) throw new Error('Không nhận được đường dẫn ảnh từ server.');
      setHighlights((prev) => prev.map((h, i) => (i === index ? { ...h, imageUrl: result.url } : h)));
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Tải ảnh thất bại',
        message: err.message || 'Không thể tải ảnh lên.',
        type: 'warning'
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.products.getAll();
      setProducts(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.products.getCategories();
      setCategories(data || []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchProducts();
      void fetchCategories();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProducts, fetchCategories]);

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setActiveTab('general');
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
    setFormVariants([]);
    setHighlights([]);
    setGenColors('');
    setGenSizes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p) => {
    setFormMode('edit');
    setEditingId(p.id);
    setActiveTab('general');
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
    setFormVariants(p.variants || []);
    setHighlights(p.highlights ? (typeof p.highlights === 'string' ? JSON.parse(p.highlights) : p.highlights) : []);
    setGenColors('');
    setGenSizes('');
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
      imageUrl: imageUrl.trim() || '/images/balomayanh-logo.png',
      weight: weight.trim(),
      volume: volume.trim(),
      material: material.trim(),
      dimensions: dimensions.trim(),
      sku: sku.trim() || `TT-${Date.now()}`,
      highlights: JSON.stringify(highlights),
      variants: formVariants.map(v => ({
        id: v.id || null,
        sku: v.sku || `TT-VAR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: v.name || `${v.color || ''}${v.color && v.size ? ' / ' : ''}${v.size || ''}`,
        price: parseFloat(v.price || price || 0),
        stock: parseInt(v.stock === '' ? 0 : v.stock),
        color: v.color || null,
        size: v.size || null,
        imageUrl: v.imageUrl || ''
      }))
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
    
    const catId = p.category_id || (p.category && typeof p.category === 'object' ? p.category.id : p.category);
    const matchesCategory = !selectedCategory || String(catId) === String(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  if (isFormOpen) {
    return (
      <div className="space-y-6 font-sans pb-10 animate-in fade-in duration-200">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
          <div>
            <nav className="mb-2" aria-label="breadcrumb">
              <ol className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <li><a href="#!" className="hover:text-slate-600 transition-colors">Admin</a></li>
                <li>/</li>
                <li><a href="#!" onClick={() => setIsFormOpen(false)} className="hover:text-slate-600 transition-colors">Sản phẩm</a></li>
                <li>/</li>
                <li className="text-slate-600">{formMode === 'create' ? 'Thêm mới' : 'Chỉnh sửa'}</li>
              </ol>
            </nav>
            <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading uppercase">
              {formMode === 'create' ? 'Thêm Sản Phẩm Mới' : 'Cập Nhật Sản Phẩm'}
            </h1>
            <p className="text-slate-500 text-xs mt-1">Cấu hình thông tin chi tiết, giá bán, tồn kho, đặc điểm nổi bật và biến thể của sản phẩm.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              Lưu sản phẩm
            </button>
          </div>
        </div>

        {/* 2-Column Main Form Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Column (Left - 2/3 width) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Title & Basic Info */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Thông Tin Cơ Bản</h3>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên sản phẩm..."
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">SKU *</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ví dụ: TT-ACCELERATOR"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Danh mục *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-bold"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">Mô Tả Sản Phẩm</h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDescription(description + '<h3>Tiêu đề mới</h3>')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-650 text-[9px] px-2 py-1 rounded-md border border-slate-200 cursor-pointer font-bold transition-colors"
                  >
                    + Tiêu đề
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescription(description + '<p>Đoạn văn mới...</p>')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-650 text-[9px] px-2 py-1 rounded-md border border-slate-200 cursor-pointer font-bold transition-colors"
                  >
                    + Đoạn văn
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescription(description + '<strong>chữ đậm</strong>')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-650 text-[9px] px-2 py-1 rounded-md border border-slate-200 cursor-pointer font-bold transition-colors"
                  >
                    + Chữ đậm
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescription(description + '\n<div class="aspect-video my-4">\n  <iframe class="w-full h-full" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>\n</div>\n')}
                    className="bg-blue-50 text-blue-650 hover:bg-blue-100 text-[9px] px-2 py-1 rounded-md border border-blue-200/30 font-bold cursor-pointer transition-colors"
                  >
                    + Nhúng YouTube Video
                  </button>
                </div>
              </div>
              <textarea
                rows="8"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết về sản phẩm. Sử dụng các thẻ HTML như <h3>, <p>, <strong>..."
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-y font-mono"
              />
            </div>

            {/* Display Images */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Hình Ảnh Sản Phẩm</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Đường dẫn ảnh chính (URL)</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Nhập đường dẫn hình ảnh chính (URL)..."
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-sm">
                    {isUploadingImage ? 'Đang tải...' : 'Chọn tệp để tải lên'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Tệp ảnh sẽ được lưu vào backend và tự điền vào ô URL.
                  </p>
                </div>

                {/* Dropzone mockup */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  {imageUrl ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hình ảnh bìa hiển thị</p>
                      <img
                        src={imageUrl}
                        alt="Xem trước"
                        className="w-32 h-32 object-contain bg-white rounded-xl border border-slate-200 shadow-xs"
                        onError={(e) => { e.target.src = '/images/balomayanh-logo.png'; }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <p className="text-xs text-slate-500 font-semibold">Nhập URL ảnh phía trên hoặc kéo thả tệp tại đây (Giả lập)</p>
                      <p className="text-[10px] text-slate-400 font-medium">Độ phân giải khuyến nghị: 1000 x 1000 pixels</p>
                      <div className="inline-block px-3.5 py-1.5 bg-white border border-slate-200 text-slate-650 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-slate-50 shadow-2xs">Chọn tệp</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Specs & Highlights (Sub-tab card) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-3 overflow-x-auto">
                {[
                  { id: 'pricing_stock', label: 'Giá & Kho hàng' },
                  { id: 'specs', label: 'Thông số kỹ thuật' },
                  { id: 'highlights', label: 'Đặc điểm nổi bật' }
                ].map(tab => {
                  const isTabActive = 
                    (tab.id === 'pricing_stock' && (activeTab === 'pricing' || activeTab === 'general' || activeTab === 'images' || activeTab === 'variants')) ||
                    (tab.id === 'specs' && activeTab === 'attributes') ||
                    (tab.id === 'highlights' && activeTab === 'highlights');
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id === 'pricing_stock' ? 'pricing' : (tab.id === 'specs' ? 'attributes' : 'highlights'))}
                      className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer -mb-px ${
                        isTabActive 
                          ? 'border-blue-600 text-blue-600 font-extrabold' 
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-6">
                {/* Specs pricing & stock */}
                {(!['attributes', 'highlights'].includes(activeTab)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Giá bán lẻ chính thức (đ) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="3890000"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tổng số lượng tồn kho *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="10"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* Specs details */}
                {activeTab === 'attributes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Trọng lượng (Weight)</label>
                      <input
                        type="text"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="Ví dụ: 1500 g"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Thể tích (Volume)</label>
                      <input
                        type="text"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        placeholder="Ví dụ: 25 L"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Chất liệu (Material)</label>
                      <input
                        type="text"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        placeholder="Ví dụ: Ballistic Nylon"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Kích thước (Dimensions)</label>
                      <input
                        type="text"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        placeholder="Ví dụ: 30 x 45 x 15 cm"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Specs highlights */}
                {activeTab === 'highlights' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="text-slate-800 text-xs font-bold uppercase tracking-wider">Danh sách Đặc điểm nổi bật</h4>
                        <p className="text-slate-500 text-[10px] mt-0.5 font-semibold">Cấu hình các điểm vượt trội của sản phẩm có ảnh minh họa đi kèm.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHighlights([...highlights, { title: '', description: '', imageUrl: '' }])}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
                      >
                        + Thêm đặc điểm
                      </button>
                    </div>

                    {highlights.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                        Chưa cấu hình đặc điểm nổi bật nào. Bấm nút phía trên để thêm mới!
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                        {highlights.map((hl, index) => (
                          <div key={index} className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 space-y-3 relative">
                            <button
                              type="button"
                              onClick={() => setHighlights(highlights.filter((_, i) => i !== index))}
                              className="absolute top-3 right-3 text-rose-600 hover:text-rose-800 font-bold text-xs p-1"
                              title="Xóa đặc điểm này"
                            >
                              ✕
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Tiêu đề đặc điểm *</label>
                                <input
                                  type="text"
                                  required
                                  value={hl.title || ''}
                                  onChange={(e) => {
                                    const updated = [...highlights];
                                    updated[index].title = e.target.value;
                                    setHighlights(updated);
                                  }}
                                  placeholder="Ví dụ: Khóa kéo YKK chống trộm"
                                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">URL Hình ảnh minh họa *</label>
                                <input
                                  type="text"
                                  required
                                  value={hl.imageUrl || ''}
                                  onChange={(e) => {
                                    const updated = [...highlights];
                                    updated[index].imageUrl = e.target.value;
                                    setHighlights(updated);
                                  }}
                                  placeholder="https://..."
                                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-mono"
                                />
                                <div className="mt-2">
                                  <label className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider cursor-pointer">
                                    {isUploadingImage ? 'Đang tải...' : 'Tải ảnh'}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleHighlightImageUpload(index, e)}
                                      className="hidden"
                                      disabled={isUploadingImage}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Nội dung chi tiết *</label>
                              <textarea
                                rows="2"
                                required
                                value={hl.description || ''}
                                onChange={(e) => {
                                    const updated = [...highlights];
                                    updated[index].description = e.target.value;
                                    setHighlights(updated);
                                }}
                                placeholder="Mô tả cụ thể về tính năng..."
                                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-y"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column (Right - 1/3 width) */}
          <div className="space-y-6">
            {/* Classification Card */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Phân Loại Hàng Hóa</h3>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Danh mục chính *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-extrabold"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Chọn đúng danh mục để hiển thị tối ưu trên giao diện cửa hàng trực tuyến.</p>
              </div>
            </div>

            {/* Variants Card */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Biến Thể Sản Phẩm</h3>
              
              {/* Matrix generator inputs */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
                  <Info size={13} />
                  <span>Trình tạo tự động</span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Màu sắc (cách bằng dấu phẩy)</label>
                    <input
                      type="text"
                      value={genColors}
                      onChange={(e) => setGenColors(e.target.value)}
                      placeholder="Ví dụ: Đen, Ghi, Xanh"
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Kích thước (cách bằng dấu phẩy)</label>
                    <input
                      type="text"
                      value={genSizes}
                      onChange={(e) => setGenSizes(e.target.value)}
                      placeholder="Ví dụ: S, M, L"
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateVariants}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl transition-all cursor-pointer shadow-xs mt-1"
                >
                  Tạo biến thể tự động
                </button>
              </div>

              {/* Active variants grid/list */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">Danh sách biến thể ({formVariants.length})</label>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-[10px] text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    + Thêm thủ công
                  </button>
                </div>

                {formVariants.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold">
                    Chưa có biến thể nào được tạo.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {formVariants.map((v, idx) => (
                      <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2 relative animate-in fade-in duration-100">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="absolute top-2 right-2 text-rose-600 hover:text-rose-800 text-[10px] font-bold p-1 cursor-pointer"
                          title="Xóa biến thể"
                        >
                          ✕
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-400 text-[8px] font-bold uppercase">Màu sắc</label>
                            <input
                              type="text"
                              value={v.color || ''}
                              onChange={(e) => handleUpdateVariantField(idx, 'color', e.target.value)}
                              placeholder="Màu sắc"
                              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-[11px] focus:outline-none font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[8px] font-bold uppercase">Kích thước</label>
                            <input
                              type="text"
                              value={v.size || ''}
                              onChange={(e) => handleUpdateVariantField(idx, 'size', e.target.value)}
                              placeholder="Kích thước"
                              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-[11px] focus:outline-none font-semibold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-slate-400 text-[8px] font-bold uppercase">Mã SKU</label>
                          <input
                            type="text"
                            value={v.sku || ''}
                            onChange={(e) => handleUpdateVariantField(idx, 'sku', e.target.value)}
                            placeholder="SKU"
                            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-[11px] focus:outline-none font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-slate-400 text-[8px] font-bold uppercase">Ảnh biến thể</label>
                          <input
                            type="text"
                            value={v.imageUrl || ''}
                            onChange={(e) => handleUpdateVariantField(idx, 'imageUrl', e.target.value)}
                            placeholder="URL ảnh"
                            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-[11px] focus:outline-none font-mono"
                          />
                          <label className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[8px] font-bold uppercase tracking-wider cursor-pointer mt-1">
                            {isUploadingImage ? 'Đang tải...' : 'Tải ảnh'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleVariantImageUpload(idx, e)}
                              className="hidden"
                              disabled={isUploadingImage}
                            />
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-400 text-[8px] font-bold uppercase">Giá bán (đ)</label>
                            <input
                              type="number"
                              value={v.price === 0 ? '0' : (v.price || '')}
                              onChange={(e) => handleUpdateVariantField(idx, 'price', e.target.value)}
                              placeholder="Giá"
                              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-[11px] focus:outline-none font-mono font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[8px] font-bold uppercase">Tồn kho</label>
                            <input
                              type="number"
                              value={v.stock === 0 ? '0' : (v.stock || '')}
                              onChange={(e) => handleUpdateVariantField(idx, 'stock', e.target.value)}
                              placeholder="Tồn kho"
                              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-[11px] focus:outline-none font-mono font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Foot Control Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/60 mt-8">
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            Lưu sản phẩm
          </button>
        </div>

        <CustomModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading uppercase">Quản Lý Sản Phẩm</h1>
          <p className="text-slate-500 text-xs mt-1">Quản lý kho hàng, SKU, danh mục và các thông số biến thể sản phẩm.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all duration-200 cursor-pointer shadow-sm"
        >
          <Plus size={14} />
          <span>Thêm Sản Phẩm</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm hoặc SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder-slate-400 font-medium"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold min-w-[180px]"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Product List Table */}
      <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden animate-in fade-in duration-200">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Đang tải danh sách sản phẩm...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">Không tìm thấy sản phẩm nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Giá bán</th>
                  <th className="px-6 py-4">Tồn kho</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650 text-xs font-semibold">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.image || p.imageUrl || '/images/balomayanh-logo.png'} 
                          alt={p.name || p.title} 
                          className="w-10 h-10 object-cover rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0"
                          onError={(e) => { e.target.src = '/images/balomayanh-logo.png'; }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate max-w-[280px]">{p.name || p.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{p.category && typeof p.category === 'object' ? p.category.name : p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {p.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800 text-sm">
                      {p.price?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        p.stock > 3 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                          : p.stock > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                      }`}>
                        {p.stock > 0 ? `${p.stock} sản phẩm` : 'Hết hàng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="Sửa sản phẩm"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 size={14} />
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
