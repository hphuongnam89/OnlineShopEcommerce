import { Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

// Reusable catalog card for product image, price, rating, and link to detail page.
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const isOutOfStock = product.stock === 0;

  const interiorImage = product.images?.length > 1 ? product.images.at(-1) : null;

  return (
    <article className="group bg-white overflow-hidden border border-[#e5e7eb] flex flex-col h-full">
      {/* Image Container */}
      <Link 
        to={`/product/${product.id}`}
        className="relative aspect-square bg-slate-50 flex items-center justify-center p-5 overflow-hidden block cursor-pointer"
      >
        {isOutOfStock ? (
          <span className="absolute top-3 right-3 z-10 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-500 rounded-md">
            Hết hàng
          </span>
        ) : product.badge ? (
          <span className={`absolute top-3 right-3 z-10 px-2.5 py-1 text-[11px] font-semibold text-white rounded-md ${
            product.badge === 'Sale' ? 'bg-[#ab9f1d]' : 'bg-[#2f5f88]'
          }`}>
            {product.badge}
          </span>
        ) : null}
        <img
          src={product.image} 
          alt={product.title}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-contain transition-opacity duration-300 ${interiorImage ? 'group-hover:opacity-0' : ''}`}
        />
        {interiorImage && (
          <img
            src={interiorImage}
            alt={`${product.title} - khoang chứa thiết bị`}
            loading="lazy"
            decoding="async"
            className="absolute inset-5 w-[calc(100%-2.5rem)] h-[calc(100%-2.5rem)] object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-black uppercase text-slate-900 mb-1 line-clamp-2 hover:text-[#cc0000] transition-colors leading-snug">
          <Link to={`/product/${product.id}`}>
            {product.title}
          </Link>
        </h3>
        {product.desc && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
            {product.desc.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
          </p>
        )}
        
        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-4 mt-1">
          <div className="flex text-[#ab9f1d]">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={13} 
                fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} 
                className={i < Math.floor(product.rating) ? 'border-none' : 'text-slate-300'} 
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">({product.reviews})</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex flex-col">
            <span className="text-base font-black text-[#1a1a1a] whitespace-nowrap flex items-center gap-1.5">
              {product.price.toLocaleString('vi-VN')}đ
            </span>
          </div>
          {isOutOfStock ? (
            <button 
              disabled
              className="bg-slate-200 text-slate-400 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-not-allowed"
            >
              Hết hàng
            </button>
          ) : (
            <button 
              onClick={() => addToCart(product)}
              className="bg-[#cc0000] hover:bg-[#a90000] text-white px-3.5 py-2 text-xs font-black uppercase whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart size={13} />
              <span>Thêm</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
