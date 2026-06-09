/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// Hook used by product, cart, and navbar components to access shared cart state.
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart provider persists cart items in localStorage so reloads do not lose the cart.
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cartItems');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const addToCart = (product, qty = 1) => {
    if (product.stock === 0) {
      showToast(`Sản phẩm ${product.title} đã hết hàng!`);
      return false;
    }

    let success = true;
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      const targetQty = currentQty + qty;
      const stockLimit = product.stock !== undefined ? product.stock : 999;

      if (targetQty > stockLimit) {
        showToast(`Chỉ còn tối đa ${stockLimit} sản phẩm trong kho!`);
        success = false;
        if (existingItem) {
          return prevItems.map((item) =>
            item.id === product.id ? { ...item, quantity: stockLimit } : item
          );
        } else {
          return [...prevItems, { ...product, quantity: stockLimit }];
        }
      }

      showToast(existingItem 
        ? `Đã tăng số lượng ${product.title} trong giỏ hàng!` 
        : `Đã thêm ${product.title} vào giỏ hàng!`
      );
      
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: targetQty } : item
        );
      }
      return [...prevItems, { ...product, quantity: qty }];
    });
    return success;
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) => {
      const item = prevItems.find((i) => i.id === productId);
      if (item) {
        const stock = item.stock !== undefined ? item.stock : 999;
        if (quantity > stock) {
          showToast(`Chỉ còn tối đa ${stock} sản phẩm trong kho!`);
          return prevItems.map((i) => (i.id === productId ? { ...i, quantity: stock } : i));
        }
      }
      return prevItems.map((i) => (i.id === productId ? { ...i, quantity } : i));
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // unique item count (not sum of quantities)
  const cartCount = cartItems.length;
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
      {/* Dynamic Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in border border-slate-800 transition-all duration-300">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></div>
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};
