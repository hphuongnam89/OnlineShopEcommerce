import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import CustomModal from '../components/CustomModal';
import { api } from '../utils/api';
import { Star, Shield, Truck, Sparkles, RefreshCw, ShoppingCart, Minus, Plus, ChevronRight } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Custom alert modal state
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const openModal = (title, message, type = 'info') => {
    setModalConfig({ isOpen: true, title, message, type });
  };
  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  // Reviews states
  const [reviewName, setReviewName] = useState(() => {
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

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const foundProduct = await api.products.getOne(id);
        setProduct(foundProduct);
        setQuantity(1); // reset quantity
        
        if (foundProduct) {
          setActiveImage(foundProduct.image_url || foundProduct.image);
          
          if (foundProduct.variants && foundProduct.variants.length > 0) {
            setSelectedVariant(foundProduct.variants[0]);
          } else {
            setSelectedVariant(null);
          }

          // Fetch reviews from API
          try {
            const reviewsData = await api.reviews.getByProduct(id);
            setProductReviews(reviewsData || []);
          } catch (error) {
            console.error('Lỗi tải reviews:', error);
            setProductReviews([]);
          }

          // Fetch related products
          if (foundProduct.category_id || foundProduct.category) {
            try {
              const relatedPage = await api.products.getPage({
                page: 0,
                limit: 4,
                categoryId: foundProduct.category_id || undefined,
                sort: 'rating_desc',
              });
              const related = relatedPage.items
                .filter((p) => p.id !== foundProduct.id)
                .slice(0, 3);
              setRelatedProducts(related);
            } catch (error) {
              console.error('Lỗi tải sản phẩm liên quan:', error);
              setRelatedProducts([]);
            }
          }
        }
      } catch (error) {
        console.error('Lỗi tải chi tiết sản phẩm:', error);
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

  const incrementQty = () => setQuantity((q) => (q < currentStock ? q + 1 : q));
  const decrementQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    const cartItem = {
      id: selectedVariant ? `${product.id}_${selectedVariant.id}` : String(product.id),
      productId: product.id,
      variantId: selectedVariant ? selectedVariant.id : null,
      variantName: selectedVariant ? selectedVariant.name : '',
      title: product.title,
      price: selectedVariant ? selectedVariant.price : product.price,
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
                <div className="text-2xl font-black text-[#2f5f88] mb-6 bg-[#f4f7fa] w-fit px-6 py-3 rounded-lg border border-[#c9dced] font-heading">
                  {(selectedVariant ? selectedVariant.price : product.price).toLocaleString('vi-VN')}đ
                </div>

                {/* Product Variants Selector */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mb-6">
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

                {/* Description */}
                <p className="text-slate-600 leading-relaxed mb-6 text-sm font-sans">{product.desc}</p>

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
                {product.specs && (
                  <div className="border border-slate-100 rounded-xl p-5 mb-6">
                    <h3 className="font-bold font-heading text-slate-800 mb-3.5 text-xs uppercase tracking-wider">Thông số cơ bản</h3>
                    <div className="grid grid-cols-1 gap-y-2.5 text-xs font-sans">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Dung tích:</span>
                        <span className="font-bold text-slate-800 font-mono">{product.specs.volume}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Kích thước:</span>
                        <span className="font-bold text-slate-800 font-mono">{product.specs.dimensions}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Trọng lượng:</span>
                        <span className="font-bold text-slate-800 font-mono">{product.specs.weight}</span>
                      </div>
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

        {/* Key Product Features */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 md:p-10 mb-16">
          <h2 className="text-xl font-black font-heading text-slate-800 mb-8 border-l-3 border-[#2f5f88] pl-4 uppercase tracking-tight">ĐẶC ĐIỂM NỔI BẬT CỦA SẢN PHẨM</h2>
          
          <div className="space-y-10 font-sans">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3">Chất liệu cao cấp chống mài mòn & chống nước</h3>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Được chế tạo từ vải nylon chống thấm nước 1680D Ballistic siêu bền, kết hợp khóa kéo YKK RC Fuse cao cấp nổi tiếng toàn cầu, giúp bảo vệ tối đa các thiết bị đắt tiền bên trong khỏi mọi tác động của thời tiết và ngoại lực. Thiết kế khóa thông minh hỗ trợ móc khóa số giúp nâng cao an ninh khi đi sân bay.
                </p>
              </div>
              <div className="bg-[#f8f8f8] p-6 rounded-xl border border-slate-100 flex items-center justify-center aspect-video overflow-hidden">
                <img src={product.images?.[1] || product.image} alt="Vật liệu cao cấp" className="w-full h-full object-contain hover:scale-103 transition-transform duration-500" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2">
                <h3 className="text-base font-bold text-slate-800 mb-3">Cách phân chia ngăn thông minh, tùy chỉnh linh hoạt</h3>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Các vách ngăn đệm mút dày sử dụng công nghệ chống sốc EVA cao cấp, có thể tháo rời và sắp xếp lại linh hoạt theo ý muốn. Thiết kế tối ưu hóa sức chứa giúp bạn mang theo đầy đủ thân máy chuyên nghiệp, ống kính zoom lớn, laptop chuyên dụng cùng nhiều phụ kiện dây cáp kèm theo được cố định chắc chắn.
                </p>
              </div>
              <div className="bg-[#f8f8f8] p-6 rounded-xl border border-slate-100 flex items-center justify-center aspect-video overflow-hidden md:order-1">
                <img src={product.images?.[2] || product.image} alt="Phân chia ngăn thông minh" className="w-full h-full object-contain hover:scale-103 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Reviews and Q&A Section */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 md:p-10 mb-16">
          <h2 className="text-xl font-black font-heading text-slate-800 mb-8 border-l-3 border-[#2f5f88] pl-4 uppercase tracking-tight">ĐÁNH GIÁ KHÁCH HÀNG & NHẬN XÉT</h2>
          
          <div className="grid md:grid-cols-3 gap-8 pb-8 border-b border-slate-100 mb-8 items-center">
            {/* Visual stars summary */}
            <div className="text-center md:border-r border-slate-100 py-4">
              <div className="text-5xl font-black text-[#2f5f88] mb-2 font-heading">{product.rating}</div>
              <div className="flex justify-center text-[#ab9f1d] mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} className={i < Math.floor(product.rating) ? 'border-none' : 'text-slate-200'} />
                ))}
              </div>
              <div className="text-xs text-slate-400 font-sans">{product.reviews} đánh giá thực tế</div>
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

          {/* Q&A Comments */}
          <div className="space-y-6">
            {productReviews.map((rev) => (
              <div key={rev.id} className="bg-[#f8f8f8] p-5 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-xs font-heading uppercase">{rev.name}</span>
                  <span className="text-[10px] text-slate-400 font-sans">{rev.date}</span>
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
                      <strong className="text-xs text-slate-800 font-heading">Quản trị viên Think Tank</strong>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      {rev.adminResponse}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Review Submission Form */}
          <div className="mt-10 pt-8 border-t border-slate-100">
            <h3 className="text-sm font-bold font-heading text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-[#2f5f88]" />
              Viết đánh giá của bạn
            </h3>
            
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
                  openModal('Lỗi', error.message || 'Không thể gửi đánh giá. Vui lòng đăng nhập tài khoản khách hàng!', 'warning');
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
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    className="w-full bg-[#f8f8f8] border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2f5f88] text-slate-750 text-xs"
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
                  <tr className="border-b border-slate-100">
                    <td className="py-3 font-semibold text-slate-500 w-1/3">Dung tích</td>
                    <td className="py-3 text-slate-800 font-bold font-mono">{product.specs.volume}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 font-semibold text-slate-500">Kích thước</td>
                    <td className="py-3 text-slate-800 font-bold font-mono">{product.specs.dimensions}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 font-semibold text-slate-500">Trọng lượng</td>
                    <td className="py-3 text-slate-800 font-bold font-mono">{product.specs.weight}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 font-semibold text-slate-500">Thời gian bảo hành</td>
                    <td className="py-3 text-slate-800 font-medium">{product.specs.warranty}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 font-semibold text-slate-500">Chất liệu chính</td>
                    <td className="py-3 text-slate-800 font-medium leading-relaxed">{product.specs.material}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 font-semibold text-slate-500">Loại khóa kéo</td>
                    <td className="py-3 text-slate-800 font-medium">YKK RC Fuse chống mài mòn chuẩn quân đội</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 font-semibold text-slate-500">Vật liệu lót bên trong</td>
                    <td className="py-3 text-slate-800 font-medium">Vải sợi nhỏ Velex mềm, có khả năng bám dính Velcro cực tốt</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 font-semibold text-slate-500">Ngăn Laptop</td>
                    <td className="py-3 text-slate-800 font-medium">Ngăn chống sốc riêng biệt chứa vừa Laptop lên đến 16 inch</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-500">Phụ kiện đi kèm</td>
                    <td className="py-3 text-slate-800 font-medium">Áo mưa phủ chống nước (Rain cover), Dây đeo chân máy chuyên dụng, Vách ngăn đệm mút EVA tháo lắp linh hoạt.</td>
                  </tr>
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
