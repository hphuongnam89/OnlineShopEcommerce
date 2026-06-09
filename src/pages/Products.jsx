import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { SlidersHorizontal, Search, RotateCcw } from 'lucide-react';
import { api } from '../utils/api';

const PRICE_BRACKETS = [
  'Dưới 1 Triệu',
  '1 Triệu - 5 Triệu',
  '5 Triệu - 10 Triệu',
  'Trên 10 Triệu',
];

const PRICE_FILTERS = {
  'Dưới 1 Triệu': { maxPrice: 1000000 },
  '1 Triệu - 5 Triệu': { minPrice: 1000000, maxPrice: 5000000 },
  '5 Triệu - 10 Triệu': { minPrice: 5000000, maxPrice: 10000000 },
  'Trên 10 Triệu': { minPrice: 10000000 },
};

// Product listing page that loads catalog data from backend with search, filters, sort, and pagination.
const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category') || '';

  const [productsList, setProductsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [selectedCategories, setSelectedCategories] = useState(categoryFromUrl ? [categoryFromUrl] : []);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [sortBy, setSortBy] = useState('Mới nhất');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [categoryReady, setCategoryReady] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryResult = await api.products.getCategories();
        setCategories(categoryResult || []);
      } catch {
        setCategories([]);
      } finally {
        setCategoryReady(true);
      }
    };

    fetchCategories();
  }, []);

  const selectedCategoryId = useMemo(() => {
    if (selectedCategories.length === 0 || categories.length === 0) return undefined;
    return categories.find((category) => category.name === selectedCategories[0])?.id;
  }, [categories, selectedCategories]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productResult = await api.products.getPage({
          page: currentPage - 1,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          categoryId: selectedCategoryId,
          sort: api.products.mapSortToBackend(sortBy),
          ...(selectedPrices.length > 0 ? PRICE_FILTERS[selectedPrices[0]] : {}),
        });

        setProductsList(productResult.items);
        setTotalItems(productResult.totalItems);
      } catch {
        setProductsList([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    if (categoryReady) {
      fetchData();
    }
  }, [categoryReady, currentPage, itemsPerPage, searchQuery, selectedCategoryId, selectedPrices, sortBy]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / itemsPerPage)), [totalItems, itemsPerPage]);

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedPrices([]);
    setSearchQuery('');
    setSortBy('Mới nhất');
    setCurrentPage(1);
    setSearchParams({});
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]));
    setCurrentPage(1);
  };

  const togglePrice = (priceBracket) => {
    setSelectedPrices((prev) => (prev.includes(priceBracket) ? prev.filter((item) => item !== priceBracket) : [priceBracket]));
    setCurrentPage(1);
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i += 1) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen pt-[108px] pb-20">
      <div className="bg-[#23323f] text-white py-12 px-4 relative">
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto space-y-3">
          <span className="text-[#d6c95a] text-sm font-semibold">
            Catalog Think Tank
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold">
            Sản phẩm máy ảnh chuyên dụng
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Lọc nhanh theo dòng sản phẩm, mức giá và nhu cầu di chuyển để tìm đúng balo, vali hoặc phụ kiện cho bộ gear của bạn.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 flex flex-col lg:flex-row gap-8">
        <button
          onClick={() => setIsFilterOpen((open) => !open)}
          className="lg:hidden flex items-center justify-center gap-2 bg-white border border-slate-200 py-3 rounded-lg font-semibold text-sm text-slate-700 transition-colors"
        >
          <SlidersHorizontal size={18} />
          {isFilterOpen ? 'Ẩn bộ lọc' : 'Hiển thị bộ lọc'}
        </button>

        <aside className={`${isFilterOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 shrink-0`}>
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 sticky top-28 space-y-6 shadow-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#2f5f88]" />
                Bộ lọc
              </h3>
              {(selectedCategories.length > 0 || selectedPrices.length > 0 || searchQuery !== '') && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-rose-500 font-semibold flex items-center gap-1 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <RotateCcw size={10} />
                  Đặt lại
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-3">Danh mục</h4>
                <div className="space-y-2">
                  {['Balo Máy Ảnh', 'Túi Máy Ảnh', 'Vali Máy Ảnh'].map((item) => {
                    const inputId = `category-${item.toLowerCase().replaceAll(' ', '-')}`;
                    return (
                    <label key={item} htmlFor={inputId} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        id={inputId}
                        name="category"
                        type="checkbox"
                        value={item}
                        checked={selectedCategories.includes(item)}
                        onChange={() => toggleCategory(item)}
                        className="w-4.5 h-4.5 rounded border-slate-300 text-[#2f5f88] focus:ring-[#2f5f88] cursor-pointer"
                      />
                      <span className={`text-xs transition-colors ${selectedCategories.includes(item) ? 'text-[#2f5f88] font-bold' : 'text-slate-600 group-hover:text-[#2f5f88]'}`}>{item}</span>
                    </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-800 mb-3">Mức giá</h4>
                <div className="space-y-2">
                  {PRICE_BRACKETS.map((item) => {
                    const inputId = `price-${item.toLowerCase().replaceAll(' ', '-').replaceAll('ư', 'u').replaceAll('ệ', 'e')}`;
                    return (
                    <label key={item} htmlFor={inputId} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        id={inputId}
                        name="price"
                        type="checkbox"
                        value={item}
                        checked={selectedPrices.includes(item)}
                        onChange={() => togglePrice(item)}
                        className="w-4.5 h-4.5 rounded border-slate-300 text-[#2f5f88] focus:ring-[#2f5f88] cursor-pointer"
                      />
                      <span className={`text-xs transition-colors ${selectedPrices.includes(item) ? 'text-[#2f5f88] font-bold' : 'text-slate-600 group-hover:text-[#2f5f88]'}`}>{item}</span>
                    </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="relative mb-6">
            <input
              id="catalog-search"
              name="catalogSearch"
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên hoặc tính năng..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-[#2f5f88] text-slate-700 shadow-xs text-sm"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
            <p className="text-xs text-slate-500 font-sans font-medium">
              Hiển thị{' '}
              <span className="text-slate-800 font-bold">
                {startItem}–{endItem}
              </span>{' '}
              trên tổng số{' '}
              <span className="text-slate-400 font-bold">{totalItems}</span> sản phẩm
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-sans hidden sm:inline">Hiển thị:</span>
                <div className="flex gap-1">
                  {[20, 50, 100].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setItemsPerPage(n);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        itemsPerPage === n
                          ? 'bg-[#2f5f88] text-white border-[#2f5f88]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-[#2f5f88] hover:text-[#2f5f88]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2f5f88] text-xs font-semibold cursor-pointer"
              >
                <option>Mới nhất</option>
                <option>Giá: Thấp đến Cao</option>
                <option>Giá: Cao xuống Thấp</option>
                <option>Bán chạy nhất</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2f5f88] rounded-full animate-spin" />
            </div>
          ) : productsList.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {productsList.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-16 text-center border border-slate-100 shadow-xs">
              <p className="text-slate-500 font-bold text-sm mb-4 font-heading uppercase">Không tìm thấy sản phẩm nào</p>
              <button
                onClick={resetFilters}
                className="text-xs font-black text-[#2f5f88] hover:text-[#23323f] transition-colors inline-flex items-center gap-1.5 cursor-pointer font-heading uppercase tracking-wider"
              >
                <RotateCcw size={12} />
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-16 flex-wrap">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors cursor-pointer"
              >
                &lt;
              </button>
              {getPageNumbers().map((page, idx) => (
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg border text-sm font-bold transition-colors cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#2f5f88] border-[#2f5f88] text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors cursor-pointer"
              >
                &gt;
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
