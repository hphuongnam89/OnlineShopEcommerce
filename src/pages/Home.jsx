import { useState, useEffect } from 'react';
import { ShieldCheck, Wrench, Compass, Star, ChevronLeft, ChevronRight, Quote, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { PRODUCTS } from '../data/products';

const HERO_SLIDES = [
  {
    id: 1,
    image: 'https://cdn.hstatic.net/products/200001063950/airport-commuter-hero-right-gear_efc274eecf1244988944ec59e8f5eda5.jpg',
    tagline: 'Thiết bị bảo vệ máy ảnh cho người làm nghề',
    title: 'Balomayanh - Balo & Túi Máy Ảnh',
    desc: 'Balo, vali và túi máy ảnh dành cho nhiếp ảnh gia cần di chuyển nhiều, bảo vệ thiết bị tốt và thao tác nhanh tại hiện trường.',
    cta: 'Khám phá sản phẩm'
  },
  {
    id: 2,
    image: 'https://cdn.hstatic.net/products/200001063950/airport-accelerator-hero-right-gear_b0c0130d5eb3477298dd80e48e6c2d07.jpg',
    tagline: 'Dòng Airport cho chuyến bay và lịch tác nghiệp dài',
    title: 'Vali và balo camera chuyên nghiệp',
    desc: 'Tối ưu khoang chứa, kích thước xách tay và độ bền khi di chuyển liên tục giữa studio, sân bay và địa điểm chụp.',
    cta: 'Xem dòng Vali kéo'
  }
];

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Hoàng Nam',
    role: 'Nhiếp ảnh gia Báo chí / Photojournalist',
    rating: 5,
    comment: 'Chiếc Airport Accelerator đã cùng tôi đi qua 15 quốc gia, trải qua bao mùa mưa bão mà máy ảnh bên trong vẫn khô ráo, an toàn tuyệt đối. Khóa kéo YKK vô cùng bền bỉ.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 2,
    name: 'Minh Thư',
    role: 'Nhiếp ảnh gia Phong cảnh / Landscape Photographer',
    rating: 5,
    comment: 'Balo Airport Commuter phân bổ trọng lực rất tốt. Đeo cả bộ gear máy ảnh và ống kính hơn 10kg đi bộ đường rừng cả ngày mà vai vẫn không bị đau mỏi.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
  },
  {
    id: 3,
    name: 'Khánh Duy',
    role: 'Quay phim Thương mại / Commercial Director',
    rating: 5,
    comment: 'Vali Tripod Manager và các túi Cable Management là cứu cánh cho ekip của tôi trong các buổi quay xa. Mọi thứ được sắp xếp cực kỳ ngăn nắp và chuyên nghiệp.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120'
  }
];

// Storefront landing page with hero carousel, category blocks, best sellers, and testimonials.
const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts] = useState(() => {
    const saved = localStorage.getItem('products');
    const prods = saved ? JSON.parse(saved) : PRODUCTS;
    return [
      prods.find(p => p.id === 1074426353), // Airport Accelerator 41L
      prods.find(p => p.id === 1074426169), // Airport Commuter 31L
      prods.find(p => p.id === 1072184928)  // Airport Advantage Black
    ].filter(Boolean);
  });
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 8000);

    const testimonialTimer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    
    return () => {
      clearInterval(slideTimer);
      clearInterval(testimonialTimer);
    };
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc] text-[#171717]">
      {/* Hero Section - Full Width Banner Slider */}
      <section className="relative w-full overflow-hidden pt-[108px] bg-slate-950">
        <div className="relative w-full aspect-[1920/820] min-h-[420px] sm:min-h-[500px]">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Dark Overlay for premium contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent z-10" />
              <img 
                src={slide.image} 
                alt={slide.title} 
                className="w-full h-full object-cover object-center"
              />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 z-20 flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-xl md:max-w-2xl text-white space-y-4 sm:space-y-6">
                    <span className="inline-block text-[#d6c95a] text-xs sm:text-sm font-semibold">
                      {slide.tagline}
                    </span>
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-lg max-w-lg font-sans leading-relaxed">
                      {slide.desc}
                    </p>
                    <div className="pt-2 sm:pt-4">
                      <Link 
                        to="/products"
                        className="inline-flex items-center gap-2 bg-[#2f5f88] hover:bg-[#23323f] text-white text-sm font-semibold px-5 sm:px-6 py-3 rounded-lg shadow-sm transition-colors duration-200"
                      >
                        <span>{slide.cta}</span>
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Left/Right Buttons */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-[#2f5f88] text-white p-2.5 sm:p-3 rounded-lg z-30 cursor-pointer transition-all border border-white/10 active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-[#2f5f88] text-white p-2.5 sm:p-3 rounded-lg z-30 cursor-pointer transition-all border border-white/10 active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Slider Indicators (Dots) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === index ? 'bg-[#2f5f88] w-8' : 'bg-white/40 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Visual Collections/Categories Grid Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#2f5f88] text-sm font-semibold">Mua theo nhu cầu sử dụng</span>
            <h2 className="text-3xl font-semibold text-[#171717] mt-2">Dòng sản phẩm chính</h2>
            <div className="w-12 h-0.5 bg-[#2f5f88] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category 1: Rollers */}
            <div className="group relative h-[420px] rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col justify-end p-8 bg-slate-50">
              <div className="absolute inset-0 p-6 flex items-center justify-center">
                <img 
                  src="https://cdn.hstatic.net/products/200001063950/imgi_10_vali-may-anh-think-tank-airport-advantage_-black-1_fe7d8554a50d4eeaadcec12852503925.jpg" 
                  alt="Rollers" 
                  className="w-4/5 h-4/5 object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/35 to-transparent z-10" />
              <div className="relative z-20 text-white space-y-2">
                <h3 className="text-xl font-semibold">Vali kéo máy ảnh</h3>
                <p className="text-xs text-slate-300 font-sans line-clamp-2">Vali kéo bánh xe chịu lực, chuyên dụng cho di chuyển đường dài và bảo vệ bộ gear lớn.</p>
                <Link 
                  to="/products?category=Vali Máy Ảnh" 
                  className="inline-flex items-center gap-1 text-[#d6c95a] hover:text-white text-xs font-semibold transition-colors pt-2"
                >
                  <span>Xem sản phẩm</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Category 2: Backpacks */}
            <div className="group relative h-[420px] rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col justify-end p-8 bg-slate-50">
              <div className="absolute inset-0 p-6 flex items-center justify-center">
                <img 
                  src="https://cdn.hstatic.net/products/200001063950/airport-accelerator-hero-right-gear_b0c0130d5eb3477298dd80e48e6c2d07.jpg" 
                  alt="Backpacks" 
                  className="w-4/5 h-4/5 object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/35 to-transparent z-10" />
              <div className="relative z-20 text-white space-y-2">
                <h3 className="text-xl font-semibold">Balo chuyên nghiệp</h3>
                <p className="text-xs text-slate-300 font-sans line-clamp-2">Thiết kế công thái học đệm dày, phân bổ trọng lực tối ưu, thoải mái đeo tác nghiệp cả ngày dài.</p>
                <Link 
                  to="/products?category=Balo Máy Ảnh" 
                  className="inline-flex items-center gap-1 text-[#d6c95a] hover:text-white text-xs font-semibold transition-colors pt-2"
                >
                  <span>Xem sản phẩm</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Category 3: Bags & Accessories */}
            <div className="group relative h-[420px] rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col justify-end p-8 bg-slate-50">
              <div className="absolute inset-0 p-6 flex items-center justify-center">
                <img 
                  src="https://cdn.hstatic.net/products/200001063950/0c95b172-3f1e-47bd-a639-e3d01c001236_4437b45b666247a0a89b2080a158f854.jpg" 
                  alt="Accessories" 
                  className="w-4/5 h-4/5 object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/35 to-transparent z-10" />
              <div className="relative z-20 text-white space-y-2">
                <h3 className="text-xl font-semibold">Túi và phụ kiện</h3>
                <p className="text-xs text-slate-300 font-sans line-clamp-2">Bao đựng ống kính, túi quản lý cáp sạc, bao chống sốc laptop được thiết kế cực kỳ thông minh.</p>
                <Link 
                  to="/products?category=Túi Máy Ảnh" 
                  className="inline-flex items-center gap-1 text-[#d6c95a] hover:text-white text-xs font-semibold transition-colors pt-2"
                >
                  <span>Xem sản phẩm</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Category 4: Tripods & Monopods */}
            <div className="group relative h-[420px] rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col justify-end p-8 bg-slate-50">
              <div className="absolute inset-0 p-6 flex items-center justify-center">
                <img 
                  src="https://cdn.hstatic.net/products/200001063950/kit-manfrotto-befree_advanced-mkbfrta4fb-bh_11926e33e78c4ced9b4dff3740c474a5.jpeg" 
                  alt="Tripods" 
                  className="w-4/5 h-4/5 object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/35 to-transparent z-10" />
              <div className="relative z-20 text-white space-y-2">
                <h3 className="text-xl font-semibold">Chân máy ảnh</h3>
                <p className="text-xs text-slate-300 font-sans line-clamp-2">Chân máy quay, chân máy ảnh, đầu bi và đầu dầu chuyên nghiệp chính hãng chống rung hình ảnh tuyệt đối.</p>
                <Link 
                  to="/products?category=Chân Máy Ảnh" 
                  className="inline-flex items-center gap-1 text-[#d6c95a] hover:text-white text-xs font-semibold transition-colors pt-2"
                >
                  <span>Xem sản phẩm</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Technical Details Section - Designed for the Venturing Observer */}
      <section className="py-24 bg-[#f8f8f8] border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Story text */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[#2f5f88] text-sm font-semibold block">Thiết kế từ nhu cầu tác nghiệp thật</span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#171717] leading-tight">
                Chi tiết nhỏ tạo nên khác biệt khi đi chụp
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed font-sans">
                Các sản phẩm tại Balomayanh được tạo ra bởi sự hợp tác chặt chẽ của các nhà thiết kế công nghiệp chuyên nghiệp và các nhiếp ảnh gia báo chí thực thụ. Mọi chi tiết nhỏ, từ cách sắp xếp ngăn đựng thẻ nhớ cho tới độ trơn trượt của khóa kéo, đều xuất phát từ trải nghiệm thực tế tại hiện trường tác nghiệp khắc nghiệt.
              </p>
              <div className="pt-2">
                <Link 
                  to="/about"
                  className="inline-flex items-center gap-2 text-[#2f5f88] hover:text-[#23323f] text-sm font-semibold transition-colors"
                >
                  <span>Xem thêm về chúng tôi</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Spec Cards */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex gap-4">
                <div className="text-[#2f5f88] shrink-0">
                  <ShieldCheck size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase font-heading text-slate-800">1680D Ballistic Nylon</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">Vải dù cao cấp chuẩn quân sự chống mài mòn, chống rách và có phủ DWR kháng nước hoàn hảo.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex gap-4">
                <div className="text-[#2f5f88] shrink-0">
                  <Wrench size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase font-heading text-slate-800">Khóa kéo YKK RC Fuse</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">Hệ thống khóa kéo cao cấp chịu lực căng cực đại, chống bám bụi và có tích hợp lỗ luồn khóa số.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex gap-4">
                <div className="text-[#2f5f88] shrink-0">
                  <Compass size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase font-heading text-slate-800">Mút ĐệmPE Chống Sốc</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">Vách chia đệm PE (closed-cell foam) gia cố bằng nhựa tổng hợp giữ khuôn balo đứng vững chãi.</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex gap-4">
                <div className="text-[#2f5f88] shrink-0">
                  <Heart size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase font-heading text-slate-800">Chuẩn Xách Tay Máy Bay</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">Thiết kế kích thước tuân thủ nghiêm ngặt tiêu chuẩn hành lý carry-on của các hãng bay quốc tế.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#2f5f88] text-sm font-semibold">Được chọn nhiều</span>
            <h2 className="text-3xl font-semibold text-[#171717] mt-2">Sản phẩm bán chạy</h2>
            <div className="w-12 h-0.5 bg-[#2f5f88] mx-auto mt-4" />
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Link 
              to="/products"
              className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 hover:border-[#2f5f88] hover:text-[#2f5f88] px-6 py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer bg-white"
            >
              <span>Xem toàn bộ danh mục</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Customer Testimonials Section */}
      <section className="py-20 bg-[#23323f] text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-10">
            <span className="text-[#d6c95a] text-sm font-semibold">Khách hàng sử dụng thực tế</span>
            <h2 className="text-2xl sm:text-3xl font-semibold mt-2">Ý kiến khách hàng</h2>
            <div className="w-12 h-0.5 bg-[#2f5f88] mx-auto mt-3" />
          </div>

          <div className="relative min-h-[260px] flex flex-col items-center justify-center text-center">
            {TESTIMONIALS.map((test, index) => (
              <div
                key={test.id}
                className={`w-full transition-all duration-700 absolute ${
                  activeTestimonial === index 
                    ? 'opacity-100 translate-x-0 relative z-10 scale-100' 
                    : 'opacity-0 translate-x-12 z-0 scale-95 pointer-events-none'
                }`}
              >
                <div className="text-slate-400 mb-6 flex justify-center">
                  <Quote size={48} className="opacity-20 text-[#2f5f88]" />
                </div>
                <p className="text-sm sm:text-lg text-slate-200 italic leading-relaxed max-w-2xl mx-auto px-4 font-sans">
                  "{test.comment}"
                </p>
                <div className="flex justify-center text-[#ab9f1d] gap-1 my-4">
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" className="border-none" />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <img 
                    src={test.avatar} 
                    alt={test.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#2f5f88]"
                  />
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold uppercase font-heading text-white">{test.name}</h4>
                    <p className="text-[10px] text-slate-400 font-sans">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2.5 mt-8">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                  activeTestimonial === index ? 'bg-[#ab9f1d] scale-125' : 'bg-slate-500 hover:bg-slate-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Community Lifestyle Photo Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#2f5f88] text-sm font-semibold">Cộng đồng Balomayanh</span>
            <h2 className="text-3xl font-semibold text-[#171717] mt-2">Khoảnh khắc tác nghiệp</h2>
            <div className="w-12 h-0.5 bg-[#2f5f88] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden shadow-xs border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=400" 
                alt="Photographer taking pictures in mountain" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-[#171717]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white">
                <Quote size={20} className="text-white" />
              </div>
            </div>
            <div className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden shadow-xs border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400" 
                alt="Camera and photography gear layout" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-[#171717]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white">
                <Quote size={20} className="text-white" />
              </div>
            </div>
            <div className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden shadow-xs border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&q=80&w=400" 
                alt="Reporter holding a professional lens" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-[#171717]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white">
                <Quote size={20} className="text-white" />
              </div>
            </div>
            <div className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden shadow-xs border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=400" 
                alt="Photographer taking pictures in sunset forest" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-[#171717]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white">
                <Quote size={20} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
