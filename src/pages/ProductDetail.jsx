import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import CustomModal from '../components/CustomModal';
import { api } from '../utils/api';
import { Star, Shield, Truck, Sparkles, RefreshCw, ShoppingCart, Minus, Plus, ChevronRight } from 'lucide-react';
import { PRODUCTS } from '../data/products';

const getVariantImage = (variant, product) => {
  const variantImage = variant?.imageUrl || variant?.image_url;
  if (variantImage) return variantImage;
  return product?.image_url || product?.image || '';
};

const getShortDesc = (desc) => {
  if (!desc) return '';
  const cleanText = desc.replace(/<\/?[^>]+(>|$)/g, "");
  return cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText;
};

const getPlainText = (html) => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, '').trim();
};

const getFallbackHighlights = (product) => {
  const specs = product?.specs || {};
  const highlights = [
    {
      title: 'Truy cập thiết bị nhanh',
      description: `${product.title} được thiết kế để thao tác lấy máy ảnh, ống kính và phụ kiện nhanh hơn trong lúc di chuyển hoặc tác nghiệp.`
    },
    specs.dimensions && {
      title: 'Kích thước thực dụng',
      description: `Kích thước ${specs.dimensions} giúp balo giữ form gọn, dễ mang theo khi đi làm, đi chụp ngoại cảnh hoặc di chuyển hằng ngày.`
    },
    specs.material && {
      title: 'Vật liệu bền cho sử dụng thường xuyên',
      description: `Chất liệu ${specs.material} phù hợp với nhu cầu bảo vệ thiết bị và chịu mài mòn khi sử dụng liên tục.`
    },
    specs.weight && {
      title: 'Tối ưu trọng lượng mang vác',
      description: `Trọng lượng khoảng ${specs.weight}, cân bằng giữa độ bảo vệ và sự thoải mái khi đeo lâu.`
    }
  ];

  return highlights.filter(Boolean).slice(0, 4);
};

const getExpandedDescription = (product) => {
  const specs = product?.specs || {};
  const category = product?.category || 'thiết bị máy ảnh';
  return [
    `${product.title} thuộc nhóm ${category.toLowerCase()}, phù hợp cho người dùng cần mang máy ảnh, ống kính và phụ kiện theo cách gọn gàng nhưng vẫn bảo vệ tốt khi di chuyển.`,
    specs.volume
      ? `Dung tích ${specs.volume} cho phép sắp xếp linh hoạt bộ gear chụp ảnh hằng ngày, đồng thời vẫn giữ được form túi cân đối khi mang trên vai.`
      : 'Không gian bên trong được chia ngăn rõ ràng, giúp hạn chế va đập giữa thân máy, ống kính và phụ kiện nhỏ.',
    specs.material
      ? `Vật liệu ${specs.material} giúp tăng độ bền khi sử dụng thường xuyên, đặc biệt trong các chuyến chụp ngoại cảnh hoặc lịch tác nghiệp dài ngày.`
      : 'Thiết kế ưu tiên độ bền, khả năng thao tác nhanh và cảm giác mang thoải mái trong thời gian dài.',
    'Các ngăn phụ hỗ trợ cất pin, thẻ nhớ, cáp, sạc và vật dụng cá nhân, giúp người dùng không phải mở toàn bộ balo mỗi khi cần lấy phụ kiện nhỏ.'
  ];
};

// Product detail page for gallery, variant selection, cart action, specs, and verified reviews.
const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  // Custom states for detail layout and checks
  const [activeTab, setActiveTab] = useState('description');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canReview, setCanReview] = useState(false);

  // Custom alert modal state
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // B2B EXPANSION
  const userStr = localStorage.getItem('currentUser');
  const userObj = userStr ? JSON.parse(userStr) : null;
  const isDealer = userObj && userObj.role === 'ROLE_DEALER';
  const openModal = (title, message, type = 'info') => {
    setModalConfig({ isOpen: true, title, message, type });
  };
  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  // Reviews states
  const [reviewName] = useState(() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      return currentUser ? currentUser.fullName : '';
    } catch {
      return '';
    }
  });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [productReviews, setProductReviews] = useState([]);

  // Helper colors
  const getColorHex = (colorName) => {
    if (!colorName) return '#ffffff';
    const name = colorName.toLowerCase();
    if (name.includes('pewter') || name.includes('grey') || name.includes('xám')) return '#808080';
    if (name.includes('green') || name.includes('xanh lá')) return '#2e7d32';
    if (name.includes('blue') || name.includes('xanh dương')) return '#1565c0';
    if (name.includes('black') || name.includes('đen')) return '#1a1a1a';
    if (name.includes('red') || name.includes('đỏ')) return '#c62828';
    if (name.includes('gold') || name.includes('vàng')) return '#efa929';
    if (name.includes('yellow')) return '#fbc02d';
    if (name.includes('white') || name.includes('trắng')) return '#ffffff';
    if (name.includes('orange') || name.includes('cam')) return '#ef6c00';
    if (name.includes('brown') || name.includes('nâu')) return '#5d4037';
    if (name.includes('pink') || name.includes('hồng')) return '#ec407a';
    return '#eceff1';
  };

  const isSizeExistForColor = (size, color) => {
    if (!product?.variants) return false;
    return product.variants.some(v => v.color === color && v.size === size);
  };

  const getStockForCombination = (color, size) => {
    if (!product?.variants) return 0;
    const v = product.variants.find(vr => vr.color === color && vr.size === size);
    return v ? v.stock : 0;
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    if (!product?.variants) return;
    const availableVariants = product.variants.filter(v => v.color === color);
    const hasSameSize = availableVariants.find(v => v.size === selectedSize);
    if (hasSameSize) {
      setSelectedVariant(hasSameSize);
      setActiveImage(getVariantImage(hasSameSize, product));
    } else {
      const fallbackVariant = availableVariants.find(v => v.stock > 0) || availableVariants[0];
      if (fallbackVariant) {
        setSelectedSize(fallbackVariant.size || '');
        setSelectedVariant(fallbackVariant);
        setActiveImage(getVariantImage(fallbackVariant, product));
      }
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    if (!product?.variants) return;
    const availableVariants = product.variants.filter(v => v.size === size);
    const hasSameColor = availableVariants.find(v => v.color === selectedColor);
    if (hasSameColor) {
      setSelectedVariant(hasSameColor);
      setActiveImage(getVariantImage(hasSameColor, product));
    } else {
      const fallbackVariant = availableVariants.find(v => v.stock > 0) || availableVariants[0];
      if (fallbackVariant) {
        setSelectedColor(fallbackVariant.color || '');
        setSelectedVariant(fallbackVariant);
        setActiveImage(getVariantImage(fallbackVariant, product));
      }
    }
  };

  const uniqueColors = product?.variants
    ? Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)))
    : [];
  const uniqueSizes = product?.variants
    ? Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean)))
    : [];

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const foundProduct = await api.products.getOne(id);
        const localProduct = PRODUCTS.find((item) => String(item.id) === String(id));
        const mergedProduct = localProduct
          ? {
              ...localProduct,
              ...foundProduct,
              desc: foundProduct.desc || localProduct.desc,
              image: foundProduct.image || foundProduct.image_url || localProduct.image,
              images: foundProduct.images?.length ? foundProduct.images : localProduct.images,
              highlights: foundProduct.highlights?.length ? foundProduct.highlights : localProduct.highlights,
              specs: {
                ...(localProduct.specs || {}),
                ...(foundProduct.specs || {})
              },
              variants: foundProduct.variants?.length ? foundProduct.variants : localProduct.variants
            }
          : foundProduct;

        setProduct(mergedProduct);
        setQuantity(1); // reset quantity
        
        if (mergedProduct) {
          setActiveImage(mergedProduct.image_url || mergedProduct.image);
          
          if (mergedProduct.variants && mergedProduct.variants.length > 0) {
            const defaultVar = mergedProduct.variants.find(v => v.stock > 0) || mergedProduct.variants[0];
            setSelectedVariant(defaultVar);
            setSelectedColor(defaultVar.color || '');
            setSelectedSize(defaultVar.size || '');
            setActiveImage(getVariantImage(defaultVar, mergedProduct));
          } else {
            setSelectedVariant(null);
            setSelectedColor('');
            setSelectedSize('');
            setActiveImage(getVariantImage(null, mergedProduct));
          }

          // Fetch reviews from API
          try {
            const reviewsData = await api.reviews.getByProduct(id);
            setProductReviews(reviewsData || []);
          } catch {
            setProductReviews([]);
          }

          // Check login and purchase status for reviews
          const token = localStorage.getItem('token');
          if (token) {
            setIsLoggedIn(true);
            try {
              const checkRes = await api.reviews.checkPurchase(id);
              setCanReview(checkRes?.purchased || false);
            } catch {
              setCanReview(false);
            }
          } else {
            setIsLoggedIn(false);
            setCanReview(false);
          }

          // Fetch related products
          if (mergedProduct.category_id || mergedProduct.category) {
            try {
              const relatedPage = await api.products.getPage({
                page: 0,
                limit: 4,
                categoryId: mergedProduct.category_id || undefined,
                sort: 'rating_desc',
              });
              const related = relatedPage.items
                .filter((p) => p.id !== mergedProduct.id)
                .slice(0, 3);
              setRelatedProducts(related);
            } catch {
              setRelatedProducts([]);
            }
          }
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-40 pb-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2f5f88] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <h2 className="text-xl font-bold font-heading text-slate-900 mb-4 uppercase">Không tìm thấy sản phẩm</h2>
        <Link to="/products" className="text-[#2f5f88] font-bold font-heading hover:underline uppercase text-xs tracking-wider">
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const descriptionImages = (product.images || []).filter(Boolean).slice(1, 7);
  const displayHighlights = product.highlights && product.highlights.length > 0
    ? product.highlights
    : getFallbackHighlights(product);
  const hasRichDescription = product.desc && getPlainText(product.desc).length > 0;
  const shouldExpandDescription = getPlainText(product.desc).endsWith('...');

  const incrementQty = () => setQuantity((q) => (q < currentStock ? q + 1 : q));
  const decrementQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    const cartItem = {
      id: selectedVariant ? `${product.id}_${selectedVariant.id}` : String(product.id),
      productId: product.id,
      variantId: selectedVariant ? selectedVariant.id : null,
      variantName: selectedVariant 
        ? (selectedVariant.name || `${selectedVariant.color || ''}${selectedVariant.color && selectedVariant.size ? ' / ' : ''}${selectedVariant.size || ''}`) 
        : '',
      title: product.title,
      price: (selectedVariant ? selectedVariant.price : product.price) * (isDealer ? 0.8 : 1),
      image: product.image_url || product.image,
      stock: currentStock,
      category: product.category,
    };
    
    addToCart(cartItem, quantity);
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen pt-[108px] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-8 mt-6">
          <Link to="/" className="hover:text-[#2f5f88] transition-colors uppercase font-bold font-heading tracking-wider">Trang chủ</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-[#2f5f88] transition-colors uppercase font-bold font-heading tracking-wider">Sản phẩm</Link>
          <ChevronRight size={12} />
          <span className="text-slate-600 font-medium truncate font-sans">{product.title}</span>
        </div>

        {/* Main Product Section */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden p-6 md:p-10 mb-16">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Left side - Product Image & Gallery */}
            <div className="space-y-4">
              <div className="aspect-square bg-[#f8f8f8] rounded-xl border border-slate-100 flex items-center justify-center p-8 relative overflow-hidden group">
                {product.badge && (
                  <span className={`absolute top-6 left-6 z-10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white rounded-md ${
                    product.badge === 'Sale' ? 'bg-[#ab9f1d]' : 'bg-[#2f5f88]'
                  }`}>
                    {product.badge}
                  </span>
                )}
                <img 
                  src={activeImage || product.image} 
                  alt={product.title} 
                  className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-550" 
                />
              </div>
              
              {/* Thumbnails Gallery */}
              {product.images && product.images.length > 0 && (
                <div className="grid grid-cols-5 gap-2.5">
                  {product.images.slice(0, 10).map((imgUrl, index) => (
                    <button
                      key={index}
                      onMouseEnter={() => setActiveImage(imgUrl)}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`aspect-square rounded-lg border overflow-hidden bg-[#f8f8f8] p-1.5 cursor-pointer transition-all ${
                        activeImage === imgUrl ? 'border-[#2f5f88] ring-2 ring-[#c9dced]' : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`${product.title} thumbnail ${index + 1}`} 
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right side - Product Info */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-[#2f5f88] uppercase tracking-widest font-heading">{product.category}</span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 mt-2 mb-4 leading-tight font-heading uppercase tracking-tight">{product.title}</h1>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-6 mt-2">
                  <div className="flex text-[#ab9f1d]">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} 
                        className={i < Math.floor(product.rating) ? 'border-none' : 'text-slate-200'} 
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700 font-sans">{product.rating} / 5.0</span>
                  <span className="text-xs text-slate-400 font-sans">({product.reviews} đánh giá)</span>
                </div>

                {/* Price */}
                <div className="mb-6 bg-[#f4f7fa] w-fit px-6 py-3 rounded-lg border border-[#c9dced] flex flex-col">
                  {isDealer && (
                    <span className="text-sm text-slate-400 line-through mb-1 font-semibold">
                      {(selectedVariant ? selectedVariant.price : product.price).toLocaleString('vi-VN')}đ
                    </span>
                  )}
                  <span className="text-2xl font-black text-[#2f5f88] font-heading flex items-center gap-2">
                    {((selectedVariant ? selectedVariant.price : product.price) * (isDealer ? 0.8 : 1)).toLocaleString('vi-VN')}đ
                    {isDealer && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold uppercase tracking-wider font-sans">B2B GIÁ SỈ</span>}
                  </span>
                </div>

                {/* Product Variants Selector */}
                {product.variants && product.variants.length > 1 && (
                  <div className="space-y-4 mb-6">
                    {/* Color Selector */}
                    {uniqueColors.length > 0 && (
                      <div>
                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest font-heading block mb-2">
                          Màu Sắc: <span className="text-slate-500 font-sans font-semibold normal-case">{selectedColor}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueColors.map((color) => {
                            const isSelected = selectedColor === color;
                            const isAvailable = product.variants.some(v => v.color === color && v.stock > 0);
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => handleColorSelect(color)}
                                className={`px-4 py-2.5 text-xs font-bold font-heading rounded-lg border transition-all cursor-pointer flex items-center gap-2 ${
                                  isSelected
                                    ? 'bg-[#2f5f88] text-white border-[#2f5f88] shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                } ${!isAvailable ? 'opacity-60' : ''}`}
                              >
                                <span 
                                  className="w-3 h-3 rounded-full border border-slate-350/50 flex-shrink-0"
                                  style={{ backgroundColor: getColorHex(color) }}
                                />
                                <span>{color}</span>
                                {!isAvailable && <span className="text-[9px] font-sans font-normal opacity-75">(Hết hàng)</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Size Selector */}
                    {uniqueSizes.length > 0 && !(uniqueSizes.length === 1 && uniqueSizes[0] === 'Standard') && (
                      <div>
                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest font-heading block mb-2">
                          Kích Thước: <span className="text-slate-500 font-sans font-semibold normal-case">{selectedSize}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueSizes.map((size) => {
                            const isSelected = selectedSize === size;
                            const exists = isSizeExistForColor(size, selectedColor);
                            const stockCount = exists ? getStockForCombination(selectedColor, size) : 0;
                            const isOutOfStock = exists && stockCount === 0;

                            return (
                              <button
                                key={size}
                                type="button"
                                disabled={!exists}
                                onClick={() => exists && handleSizeSelect(size)}
                                className={`px-4 py-2.5 text-xs font-bold font-heading rounded-lg border transition-all ${
                                  isSelected
                                    ? 'bg-[#2f5f88] text-white border-[#2f5f88] shadow-sm cursor-pointer'
                                    : !exists
                                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                                      : isOutOfStock
                                        ? 'bg-white text-slate-400 border-dashed border-slate-200 hover:border-slate-355 cursor-pointer'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span>{size}</span>
                                {exists && isOutOfStock && <span className="text-[9px] font-sans font-normal ml-1 opacity-75">(Hết)</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Fallback Selector for legacy/unstructured variants */}
                    {uniqueColors.length === 0 && uniqueSizes.length === 0 && (
                      <div>
                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest font-heading block mb-2">Chọn Phiên Bản</label>
                        <div className="flex flex-wrap gap-2">
                          {product.variants.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVariant(v)}
                              className={`px-4 py-2.5 text-xs font-bold font-heading rounded-lg border transition-all cursor-pointer ${
                                selectedVariant?.id === v.id
                                  ? 'bg-[#2f5f88] text-white border-[#2f5f88] shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {v.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <p className="text-slate-600 leading-relaxed mb-6 text-sm font-sans">{getShortDesc(product.desc)}</p>

                {/* Special Promotions Box */}
                <div className="bg-[#fffcf5] border border-[#f0e6c5] rounded-xl p-5 mb-6 shadow-2xs">
                  <div className="flex items-center gap-2 text-[#ab9f1d] font-bold text-xs uppercase tracking-widest mb-3 pb-2 border-b border-[#f0e6c5]/50 font-heading">
                    <Sparkles size={15} />
                    CHƯƠNG TRÌNH KHUYẾN MÃI
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 leading-relaxed font-sans">
                    <li className="flex items-start gap-2">
                      <span className="bg-[#ab9f1d] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">1</span>
                      <span>Nhập mã <strong className="text-[#ab9f1d] font-bold">THINKTANK30</strong> giảm ngay 30% giá trị đơn hàng khi thanh toán.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-[#ab9f1d] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">2</span>
                      <span>Miễn phí giao hàng nhanh toàn quốc cho mọi sản phẩm.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-[#ab9f1d] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">3</span>
                      <span>Tặng kèm 1 áo che mưa chống nước cao cấp trị giá 350.000đ.</span>
                    </li>
                  </ul>
                </div>

                {/* Store Availability */}
                <div className="bg-[#fcfcfc] border border-slate-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-[10px] uppercase tracking-wider mb-2.5 font-heading">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Tình trạng Showroom
                  </div>
                  <div className="space-y-2 text-xs text-slate-500 font-sans">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span>Showroom Quận 1, TP.HCM:</span>
                      <span className="font-bold text-green-600">Còn hàng</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Showroom Cầu Giấy, Hà Nội:</span>
                      <span className="font-bold text-green-600">Còn hàng (Có mẫu trải nghiệm)</span>
                    </div>
                  </div>
                </div>

                {/* Specifications Summary */}
                {product.specs && (product.specs.volume || product.specs.dimensions || product.specs.weight) && (
                  <div className="border border-slate-100 rounded-xl p-5 mb-6">
                    <h3 className="font-bold font-heading text-slate-800 mb-3.5 text-xs uppercase tracking-wider">Thông số cơ bản</h3>
                    <div className="grid grid-cols-1 gap-y-2.5 text-xs font-sans">
                      {product.specs.volume && (
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-500">Dung tích:</span>
                          <span className="font-bold text-slate-800 font-mono">{product.specs.volume}</span>
                        </div>
                      )}
                      {product.specs.dimensions && (
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-500">Kích thước:</span>
                          <span className="font-bold text-slate-800 font-mono">{product.specs.dimensions}</span>
                        </div>
                      )}
                      {product.specs.weight && (
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-500">Trọng lượng:</span>
                          <span className="font-bold text-slate-800 font-mono">{product.specs.weight}</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setIsSpecsModalOpen(true)}
                      className="w-full text-center border border-slate-200 hover:border-[#2f5f88] hover:text-[#2f5f88] text-slate-700 py-2.5 rounded-lg font-bold font-heading text-[10px] uppercase tracking-wider transition-colors cursor-pointer mt-3 bg-white block"
                    >
                      Xem thông số đầy đủ
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between border border-slate-200 rounded-lg p-2 w-full sm:w-36 bg-white">
                    <button 
                      onClick={decrementQty}
                      disabled={product.stock === 0}
                      className="p-1.5 hover:bg-slate-100 rounded transition-colors cursor-pointer text-slate-600 disabled:opacity-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold text-slate-900 w-10 text-center font-mono">{product.stock === 0 ? 0 : quantity}</span>
                    <button 
                      onClick={incrementQty}
                      disabled={product.stock === 0 || quantity >= product.stock}
                      className="p-1.5 hover:bg-slate-100 rounded transition-colors cursor-pointer text-slate-600 disabled:opacity-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Add to cart */}
                  <button 
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`flex-grow py-3.5 px-6 rounded-lg font-bold font-heading text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      product.stock === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        : 'bg-[#2f5f88] hover:bg-[#23323f] text-white shadow-xs'
                    }`}
                  >
                    <ShoppingCart size={16} />
                    {product.stock === 0 ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG'}
                  </button>
                </div>

                {/* Installment options - Sleek outlined boxes */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => openModal('Mua trả góp 0%', 'Chức năng Trả góp 0% qua công ty tài chính đang được liên kết. Vui lòng liên hệ hotline để được hướng dẫn!', 'info')}
                    className="border border-slate-200 hover:border-[#2f5f88] hover:bg-slate-50 py-2.5 px-4 rounded-lg text-center cursor-pointer transition-all"
                  >
                    <div className="text-[10px] font-bold font-heading uppercase text-slate-800 tracking-wider">MUA TRẢ GÓP 0%</div>
                    <div className="text-[9px] text-slate-400 font-sans mt-0.5">Duyệt hồ sơ nhanh online</div>
                  </button>
                  <button 
                    onClick={() => openModal('Trả góp qua thẻ', 'Chức năng Trả góp qua thẻ tín dụng đang được liên kết. Hỗ trợ thẻ Visa, Master, JCB của 25 ngân hàng.', 'info')}
                    className="border border-slate-200 hover:border-[#2f5f88] hover:bg-slate-50 py-2.5 px-4 rounded-lg text-center cursor-pointer transition-all"
                  >
                    <div className="text-[10px] font-bold font-heading uppercase text-slate-800 tracking-wider">TRẢ GÓP QUA THẺ</div>
                    <div className="text-[9px] text-slate-400 font-sans mt-0.5">Visa, Mastercard, JCB</div>
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400 font-sans">
                  <div className="flex flex-col items-center gap-1.5">
                    <Shield size={18} className="text-[#2f5f88]" />
                    <span className="font-semibold text-slate-700">100% Chính Hãng</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <Truck size={18} className="text-[#2f5f88]" />
                    <span className="font-semibold text-slate-700">Giao Hàng Miễn Phí</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <RefreshCw size={18} className="text-[#2f5f88]" />
                    <span className="font-semibold text-slate-700">7 Ngày Đổi Trả</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Detail Tabs Section */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs mb-16 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-slate-100 bg-[#f8f9fa]">
            {[
              { id: 'description', label: 'Mô tả sản phẩm' },
              { id: 'specs', label: 'Thông số kỹ thuật' },
              { id: 'reviews', label: `Đánh giá (${productReviews.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 md:px-10 py-4 font-black font-heading text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#2f5f88] text-[#2f5f88] bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Body */}
          <div className="p-6 md:p-10 font-sans">
            {/* Tab 1: Description & Highlights */}
            {activeTab === 'description' && (
              <div className="space-y-10 animate-in fade-in duration-200">
                {/* Rich Description */}
                {hasRichDescription && (
                  <div className="max-w-4xl">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Tổng quan sản phẩm</h3>
                    <div
                      className="prose max-w-none text-slate-600 text-sm leading-7 prose-slate"
                      dangerouslySetInnerHTML={{ __html: product.desc }}
                    />
                    {shouldExpandDescription && (
                      <div className="mt-5 grid gap-3 text-sm leading-7 text-slate-600">
                        {getExpandedDescription(product).map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {descriptionImages.length > 0 && (
                  <div className="pt-8 border-t border-slate-100">
                    <div className="flex items-end justify-between gap-4 mb-5">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Hình ảnh chi tiết</h3>
                        <p className="text-sm text-slate-500 mt-1">Một vài góc nhìn thực tế về bố cục ngăn chứa, mặt lưng và phụ kiện đi kèm.</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {descriptionImages.map((imgUrl, index) => (
                        <button
                          key={imgUrl}
                          type="button"
                          onClick={() => {
                            setActiveImage(imgUrl);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="group bg-slate-50 rounded-xl border border-slate-200 p-4 aspect-[4/3] overflow-hidden cursor-pointer hover:border-[#2f5f88] transition-colors"
                        >
                          <img
                            src={imgUrl}
                            alt={`${product.title} - hình chi tiết ${index + 1}`}
                            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {displayHighlights.length > 0 && (
                  <div className="pt-8 border-t border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900 mb-5">Điểm nổi bật</h3>
                    <div className="grid md:grid-cols-2 gap-5">
                      {displayHighlights.map((hl, idx) => (
                        <div key={`${hl.title}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-5">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">{hl.title}</h4>
                            <p className="text-slate-600 leading-relaxed text-sm">
                              {hl.description}
                            </p>
                          </div>
                          {hl.imageUrl && (
                            <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-center aspect-video overflow-hidden">
                              <img src={hl.imageUrl} alt={hl.title} className="w-full h-full object-contain hover:scale-[1.03] transition-transform duration-300" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Technical Specifications */}
            {activeTab === 'specs' && (
              <div className="animate-in fade-in duration-200">
                <h3 className="text-sm font-bold font-heading text-slate-800 mb-6 uppercase tracking-wider border-l-3 border-[#2f5f88] pl-3">Thông số kỹ thuật chi tiết</h3>
                <div className="max-w-2xl border border-slate-100 rounded-xl overflow-hidden text-xs text-slate-700">
                  <table className="w-full border-collapse">
                    <tbody>
                      {product.specs?.volume && (
                        <tr className="border-b border-slate-100 bg-white">
                          <td className="py-3 px-4 font-semibold text-slate-500 w-1/3">Dung tích</td>
                          <td className="py-3 px-4 text-slate-800 font-bold font-mono">{product.specs.volume}</td>
                        </tr>
                      )}
                      {product.specs?.dimensions && (
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-500">Kích thước</td>
                          <td className="py-3 px-4 text-slate-800 font-bold font-mono">{product.specs.dimensions}</td>
                        </tr>
                      )}
                      {product.specs?.weight && (
                        <tr className="border-b border-slate-100 bg-white">
                          <td className="py-3 px-4 font-semibold text-slate-500">Trọng lượng</td>
                          <td className="py-3 px-4 text-slate-800 font-bold font-mono">{product.specs.weight}</td>
                        </tr>
                      )}
                      {product.specs?.material && (
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-500">Chất liệu chính</td>
                          <td className="py-3 px-4 text-slate-800 font-medium leading-relaxed">{product.specs.material}</td>
                        </tr>
                      )}
                      {product.specs?.warranty && (
                        <tr className="bg-white">
                          <td className="py-3 px-4 font-semibold text-slate-500">Thời gian bảo hành</td>
                          <td className="py-3 px-4 text-slate-800 font-medium">{product.specs.warranty}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-10 animate-in fade-in duration-200">
                {/* Visual stars summary */}
                <div className="grid md:grid-cols-3 gap-8 pb-8 border-b border-slate-100 items-center">
                  <div className="text-center md:border-r border-slate-100 py-4">
                    <div className="text-5xl font-black text-[#2f5f88] mb-2 font-heading">{product.rating}</div>
                    <div className="flex justify-center text-[#ab9f1d] mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={18} fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} className={i < Math.floor(product.rating) ? 'border-none' : 'text-slate-200'} />
                      ))}
                    </div>
                    <div className="text-xs text-slate-400 font-sans">{productReviews.length} đánh giá thực tế</div>
                  </div>
                  
                  {/* Stars breakdown */}
                  <div className="md:col-span-2 space-y-2 text-xs font-sans">
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-slate-500 font-semibold text-right">5 sao</span>
                      <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2f5f88] rounded-full w-[85%]"></div>
                      </div>
                      <span className="w-8 text-left text-slate-500 font-semibold">85%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-slate-500 font-semibold text-right">4 sao</span>
                      <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2f5f88] rounded-full w-[10%]"></div>
                      </div>
                      <span className="w-8 text-left text-slate-500 font-semibold">10%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-slate-500 font-semibold text-right">3 sao</span>
                      <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2f5f88] rounded-full w-[5%]"></div>
                      </div>
                      <span className="w-8 text-left text-slate-500 font-semibold">5%</span>
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {productReviews.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-sans">
                      Chưa có đánh giá nào cho sản phẩm này. Hãy mua hàng và để lại nhận xét đầu tiên!
                    </div>
                  ) : (
                    productReviews.map((rev) => (
                      <div key={rev.id} className="bg-[#f8f8f8] p-5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs font-heading uppercase">{rev.name || rev.user?.fullName}</span>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-sans">
                              ✓ Đã mua hàng
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans">{rev.date || (rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN') : '')}</span>
                        </div>
                        <div className="flex text-[#ab9f1d] mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              fill={i < rev.rating ? 'currentColor' : 'none'} 
                              className={i < rev.rating ? 'border-none' : 'text-slate-200'} 
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          {rev.comment}
                        </p>
                        
                        {/* Admin response */}
                        {rev.adminResponse && (
                          <div className="mt-4 bg-white border border-slate-100 p-4 rounded-lg ml-4 relative">
                            <div className="absolute left-4 -top-2 w-3 h-3 bg-white border-t border-l border-slate-100 transform rotate-45"></div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="bg-[#2f5f88] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded font-heading">QTV</span>
                              <strong className="text-xs text-slate-800 font-heading">Quản trị viên Balomayanh</strong>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-sans">
                              {rev.adminResponse}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Review Submission Form & verified checks */}
                <div className="mt-10 pt-8 border-t border-slate-100">
                  <h3 className="text-sm font-bold font-heading text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={16} className="text-[#2f5f88]" />
                    Viết đánh giá của bạn
                  </h3>

                  {!isLoggedIn ? (
                    <div className="bg-[#fcfcfa] border border-[#f0e6c5] rounded-xl p-6 text-center font-sans">
                      <p className="text-xs text-slate-600 mb-4">Vui lòng đăng nhập tài khoản của bạn để viết đánh giá sản phẩm.</p>
                      <Link 
                        to="/login" 
                        className="inline-block bg-[#2f5f88] hover:bg-[#23323f] text-white font-bold font-heading text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-lg transition-colors"
                      >
                        Đăng Nhập Ngay
                      </Link>
                    </div>
                  ) : !canReview ? (
                    <div className="bg-[#f5f8fa] border border-blue-200 rounded-xl p-5 text-slate-600 font-sans text-xs leading-relaxed">
                      💡 <strong>Chỉ những khách hàng đã mua sản phẩm này và nhận hàng thành công (Đơn hàng ở trạng thái Giao hàng thành công) mới có thể gửi đánh giá.</strong>
                    </div>
                  ) : (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!reviewComment.trim()) {
                          openModal('Cảnh báo', 'Vui lòng nhập nội dung đánh giá!', 'warning');
                          return;
                        }

                        try {
                          const ratingVal = Number(reviewRating);
                          const commentVal = reviewComment.trim();
                          await api.reviews.create(product.id, ratingVal, commentVal);

                          // Reload product detail to update rating stats
                          const updatedProduct = await api.products.getOne(product.id);
                          setProduct(updatedProduct);

                          // Reload reviews list
                          const reviewsData = await api.reviews.getByProduct(product.id);
                          setProductReviews(reviewsData || []);

                          setReviewComment('');
                          setReviewRating(5);
                          openModal('Thành công', 'Cảm ơn bạn đã gửi đánh giá! Nhận xét của bạn đã được ghi nhận thành công.', 'success');
                        } catch (error) {
                          openModal('Lỗi', error.message || 'Không thể gửi đánh giá.', 'warning');
                        }
                      }} 
                      className="space-y-4 font-sans"
                    >
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500">Họ và Tên *</label>
                          <input
                            type="text"
                            required
                            disabled
                            value={reviewName}
                            className="w-full bg-[#f1f1f1] border border-slate-200 rounded-lg px-4 py-2.5 text-slate-500 text-xs focus:outline-none cursor-not-allowed"
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500">Đánh giá sao *</label>
                          <div className="flex gap-1.5 py-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="text-[#ab9f1d] hover:scale-110 transition-transform cursor-pointer"
                              >
                                <Star
                                  size={20}
                                  fill={star <= reviewRating ? 'currentColor' : 'none'}
                                  className={star <= reviewRating ? 'border-none' : 'text-slate-200'}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">Nhận xét của bạn *</label>
                        <textarea
                          required
                          rows={3}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Chia sẻ nhận xét thực tế về chất liệu, độ bền và tính năng của sản phẩm..."
                          className="w-full bg-[#f8f8f8] border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2f5f88] text-slate-750 text-xs"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="bg-[#2f5f88] hover:bg-[#23323f] text-white font-bold font-heading text-xs uppercase tracking-widest px-6 py-3 rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        Gửi Đánh Giá
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-black font-heading text-slate-800 mb-8 border-l-3 border-[#2f5f88] pl-4 uppercase tracking-tight">SẢN PHẨM TƯƠNG TỰ</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Specifications Full Modal */}
      {isSpecsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#f8f8f8]">
              <h3 className="font-black font-heading text-slate-800 text-sm uppercase tracking-wider">Thông số kỹ thuật chi tiết</h3>
              <button 
                onClick={() => setIsSpecsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 font-sans">
              <table className="w-full border-collapse">
                <tbody>
                  {product.specs.volume && (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 font-semibold text-slate-500 w-1/3">Dung tích</td>
                      <td className="py-3 text-slate-800 font-bold font-mono">{product.specs.volume}</td>
                    </tr>
                  )}
                  {product.specs.dimensions && (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 font-semibold text-slate-500">Kích thước</td>
                      <td className="py-3 text-slate-800 font-bold font-mono">{product.specs.dimensions}</td>
                    </tr>
                  )}
                  {product.specs.weight && (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 font-semibold text-slate-500">Trọng lượng</td>
                      <td className="py-3 text-slate-800 font-bold font-mono">{product.specs.weight}</td>
                    </tr>
                  )}
                  {product.specs.material && (
                    <tr className="border-b border-slate-100">
                      <td className="py-3 font-semibold text-slate-500">Chất liệu chính</td>
                      <td className="py-3 text-slate-800 font-medium leading-relaxed">{product.specs.material}</td>
                    </tr>
                  )}
                  {product.specs.warranty && (
                    <tr>
                      <td className="py-3 font-semibold text-slate-500">Thời gian bảo hành</td>
                      <td className="py-3 text-slate-800 font-medium">{product.specs.warranty}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-[#f8f8f8] text-right">
              <button 
                onClick={() => setIsSpecsModalOpen(false)}
                className="bg-[#2f5f88] hover:bg-[#23323f] text-white font-bold font-heading text-xs uppercase tracking-widest px-6 py-2 rounded-lg cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      <CustomModal 
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default ProductDetail;
