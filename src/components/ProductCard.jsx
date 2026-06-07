import { Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const isOutOfStock = product.stock === 0;

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 border border-slate-100 flex flex-col h-full">
      {/* Image Container */}
      <Link 
        to={`/product/${product.id}`}
        className="relative aspect-square bg-[#f8f8f8] flex items-center justify-center p-6 overflow-hidden block cursor-pointer"
      >
        {isOutOfStock ? (
          <span className="absolute top-4 right-4 z-10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white bg-slate-500 rounded-md">
            Hết Hàng
          </span>
        ) : product.badge ? (
          <span className={`absolute top-4 right-4 z-10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white rounded-md ${
            product.badge === 'Sale' ? 'bg-[#ab9f1d]' : 'bg-[#2f5f88]'
          }`}>
            {product.badge}
          </span>
        ) : null}
        <img 
          src={product.image} 
          alt={product.title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-sm font-bold font-heading text-slate-800 mb-1 line-clamp-2 hover:text-[#2f5f88] transition-colors leading-tight">
          <Link to={`/product/${product.id}`}>
            {product.title}
          </Link>
        </h3>
        {product.desc && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed font-sans">
            {product.desc}
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
          <span className="text-[10px] text-slate-400 font-sans font-medium">({product.reviews} đánh giá)</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-base font-black text-[#2f5f88] whitespace-nowrap font-heading">
            {product.price.toLocaleString('vi-VN')}đ
          </span>
          {isOutOfStock ? (
            <button 
              disabled
              className="bg-slate-200 text-slate-400 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap cursor-not-allowed"
            >
              Hết hàng
            </button>
          ) : (
            <button 
              onClick={() => addToCart(product)}
              className="bg-[#2f5f88] hover:bg-[#23323f] text-white px-4 py-2 rounded-lg text-xs font-black font-heading uppercase tracking-wider whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShoppingCart size={13} />
              <span>Thêm nhanh</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
