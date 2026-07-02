import {
  Camera,
  Check,
  ChevronRight,
  Droplets,
  Laptop,
  LockKeyhole,
  Plane,
  RotateCcw,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Weight,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const PRODUCT = {
  id: 'airport-advantage-xt-landing',
  title: 'AIRPORT ADVANTAGE™ XT',
  price: 6990000,
  stock: 12,
  category: 'Camera Backpacks',
  image:
    'https://cdn.hstatic.net/products/200001063950/airport-accelerator-hero-right-gear_b0c0130d5eb3477298dd80e48e6c2d07.jpg',
};

const IMAGES = {
  closed:
    'https://cdn.hstatic.net/products/200001063950/airport-accelerator-harness_6b913a34a10448b2bfb782bc5fa20e06.jpg',
  loaded:
    'https://cdn.hstatic.net/products/200001063950/airport-accelerator-41l-canon-r3-400-28-kit_dbe8420c46d6483184976e8b3025ace8.jpg',
  empty:
    'https://cdn.hstatic.net/products/200001063950/airport-accelerator-41l-empty_86638c2521014ab19c9eed2ea9a0ff39.jpg',
  harness:
    'https://cdn.hstatic.net/products/200001063950/airport-accelerator-padded-belt-detail_5aa03b9371c2409fb5c45fb010fa13f9.jpg',
  action:
    'https://cdn.hstatic.net/products/200001063950/airport_backpack_v3_sales_sheet-055-edit_9cfe78eda7ad4cd793dee5fa13a27edb.jpg',
};

const price = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
}).format(PRODUCT.price);

const COPY = {
  en: {
    utility: ['Free shipping on orders over $50', 'Limited lifetime warranty'],
    nav: ['What fits', 'Field details', 'Tech specs'],
    field: 'Field tested / Carry-on ready',
    new: 'New',
    series: 'Professional series',
    review: '4.9/5 based on 124 reviews',
    intro: 'Maximum carry-on capacity for two pro bodies, long glass and a complete location kit—without advertising what is inside.',
    color: 'Black / 41L',
    stock: 'In stock',
    add: 'Add to cart',
    benefits: ['Free shipping', '30-day returns', 'Lifetime warranty'],
    fitsEyebrow: 'Loadout capacity',
    fitsTitle: 'What fits',
    fitsIntro: 'Configured for working photojournalists, sports shooters and production crews who cannot leave backup gear behind.',
    fits: [
      '2 gripped DSLRs or mirrorless bodies with lenses attached',
      '5–8 standard lenses, including a detached 600mm f/4',
      'Up to a 17-inch laptop plus a 10-inch tablet',
      'Speedlights, radio triggers, batteries, cards and field audio',
      'Tripod or monopod secured with reinforced side straps',
    ],
    features: [
      ['Carry-on profile', 'Built to meet most international airline carry-on requirements.'],
      ['Secure in transit', 'Lockable YKK® zippers and integrated security cable protect the kit.'],
      ['Weather ready', 'DWR-treated shell plus a seam-sealed rain cover for severe conditions.'],
      ['Production access', 'Full clamshell opening keeps every body and lens immediately visible.'],
    ],
    systemEyebrow: 'Inside the system',
    systemTitle: 'Built around the assignment',
    cards: [
      ['Full production loadout', '2 bodies / 7 lenses'],
      ['Configurable dividers', 'Closed-cell protection'],
      ['Load-bearing harness', 'All-day carry'],
    ],
    hover: 'Hover: loaded view',
    specsEyebrow: 'Measured, not guessed',
    specsTitle: 'Technical specs',
    specsNote: 'Measurements are approximate and may vary slightly due to production tolerances.',
    specs: ['Exterior dimensions', 'Interior dimensions', 'Weight', 'Capacity'],
    materials: 'Materials & hardware',
    materialsCopy: 'Exterior: durable water-repellent (DWR) coating, YKK® RC Fuse abrasion-resistant zippers, 420D velocity nylon and 1680D ballistic nylon. Interior: closed-cell foam, PE board reinforcement and soft brushed polyester lining.',
    warranty: 'Warranty & care',
    warrantyCopy: 'Limited lifetime warranty. Spot clean with mild soap and cool water; air dry fully before storage. Do not machine wash.',
    reviews: '124 verified field reviews',
    quote: '“The divider system swallows two R3 bodies, a 400mm and everything needed for a full sideline assignment. Nothing shifts in transit.”',
    author: 'Daniel M. — Sports photojournalist',
    tagline: 'Gear for working photographers.',
    footerLinks: ['Support', 'Track order', 'All gear'],
    copyright: '© 2026 Think Tank Photo. Built for the assignment.',
  },
  vi: {
    utility: ['Miễn phí vận chuyển cho đơn trên $50', 'Bảo hành trọn đời có giới hạn'],
    nav: ['Đựng được gì', 'Chi tiết thực địa', 'Thông số'],
    field: 'Đã kiểm nghiệm thực địa / Chuẩn hành lý xách tay',
    new: 'Mới',
    series: 'Dòng chuyên nghiệp',
    review: '4.9/5 từ 124 đánh giá',
    intro: 'Sức chứa xách tay tối đa cho hai thân máy chuyên nghiệp, ống kính tele và trọn bộ thiết bị tác nghiệp—với thiết kế kín đáo.',
    color: 'Đen / 41L',
    stock: 'Còn hàng',
    add: 'Thêm vào giỏ',
    benefits: ['Miễn phí vận chuyển', 'Đổi trả 30 ngày', 'Bảo hành trọn đời'],
    fitsEyebrow: 'Sức chứa thiết bị',
    fitsTitle: 'Đựng được gì',
    fitsIntro: 'Cấu hình dành cho phóng viên ảnh, nhiếp ảnh gia thể thao và ê-kíp sản xuất cần mang đầy đủ thiết bị dự phòng.',
    fits: [
      '2 thân DSLR hoặc mirrorless có grip, gắn sẵn ống kính',
      '5–8 ống kính tiêu chuẩn, gồm 600mm f/4 tháo rời',
      'Laptop đến 17 inch cùng máy tính bảng 10 inch',
      'Đèn speedlight, bộ kích sóng, pin, thẻ nhớ và thiết bị âm thanh',
      'Tripod hoặc monopod cố định bằng đai hông gia cường',
    ],
    features: [
      ['Chuẩn xách tay', 'Thiết kế đáp ứng quy định hành lý xách tay của phần lớn hãng bay quốc tế.'],
      ['An toàn khi di chuyển', 'Khóa kéo YKK® có thể khóa cùng cáp an ninh tích hợp bảo vệ thiết bị.'],
      ['Sẵn sàng trước thời tiết', 'Vỏ phủ DWR và áo mưa ép kín đường may cho điều kiện khắc nghiệt.'],
      ['Truy cập nhanh', 'Nắp mở toàn phần giúp nhìn thấy và lấy ngay mọi thân máy, ống kính.'],
    ],
    systemEyebrow: 'Bên trong hệ thống',
    systemTitle: 'Thiết kế xoay quanh nhiệm vụ',
    cards: [
      ['Bộ thiết bị tác nghiệp đầy đủ', '2 thân máy / 7 ống kính'],
      ['Vách ngăn tùy biến', 'Bảo vệ bằng mút ô kín'],
      ['Hệ đai chịu tải', 'Thoải mái cả ngày'],
    ],
    hover: 'Di chuột: xem bên trong',
    specsEyebrow: 'Thông số thực tế',
    specsTitle: 'Thông số kỹ thuật',
    specsNote: 'Kích thước mang tính gần đúng và có thể chênh lệch nhẹ do dung sai sản xuất.',
    specs: ['Kích thước ngoài', 'Kích thước trong', 'Trọng lượng', 'Sức chứa'],
    materials: 'Vật liệu & phụ kiện',
    materialsCopy: 'Bên ngoài: phủ chống thấm DWR, khóa kéo YKK® RC Fuse chống mài mòn, nylon velocity 420D và nylon ballistic 1680D. Bên trong: mút ô kín, tấm PE gia cường và lớp lót polyester mềm.',
    warranty: 'Bảo hành & bảo quản',
    warrantyCopy: 'Bảo hành trọn đời có giới hạn. Vệ sinh tại chỗ bằng xà phòng dịu nhẹ và nước mát; phơi khô hoàn toàn trước khi cất. Không giặt máy.',
    reviews: '124 đánh giá tác nghiệp đã xác minh',
    quote: '“Hệ vách ngăn chứa gọn hai thân R3, ống 400mm và mọi thiết bị cần cho cả buổi chụp sân vận động. Không có gì xê dịch khi di chuyển.”',
    author: 'Daniel M. — Phóng viên ảnh thể thao',
    tagline: 'Thiết bị dành cho nhiếp ảnh gia chuyên nghiệp.',
    footerLinks: ['Hỗ trợ', 'Theo dõi đơn', 'Tất cả sản phẩm'],
    copyright: '© 2026 Think Tank Photo. Sẵn sàng cho mọi nhiệm vụ.',
  },
} as const;

const SectionTitle = ({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) => (
  <div className="mb-8 border-l-4 border-[#cc0000] pl-4">
    <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[#cc0000]">{eyebrow}</p>
    <h2 className="text-3xl font-black uppercase leading-none text-[#1a1a1a] md:text-4xl">{children}</h2>
  </div>
);

const CrossfadeCard = ({
  title,
  label,
  front,
  back,
  hoverLabel,
}: {
  title: string;
  label: string;
  front: string;
  back: string;
  hoverLabel: string;
}) => (
  <article className="group border border-[#e5e7eb] bg-white">
    <div className="relative aspect-[4/3] overflow-hidden bg-[#f4f4f4]">
      <img src={front} alt={`${title}, exterior view`} className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0" />
      <img src={back} alt={`${title}, loaded interior`} className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="absolute left-0 top-0 bg-[#cc0000] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white">
        {hoverLabel}
      </span>
    </div>
    <div className="border-t border-[#e5e7eb] p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">{label}</p>
      <h3 className="mt-1 text-lg font-black uppercase text-[#1a1a1a]">{title}</h3>
    </div>
  </article>
);

const Feature = ({ icon: Icon, title, copy }: { icon: typeof Camera; title: string; copy: string }) => (
  <div className="border-l border-[#3a3a3a] px-5 py-3 first:border-l-0">
    <Icon className="mb-3 text-[#d13205]" size={24} strokeWidth={1.8} />
    <h3 className="text-sm font-black uppercase text-white">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-[#bdbdbd]">{copy}</p>
  </div>
);

export default function AirportAdvantageLanding() {
  const { addToCart } = useCart();
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  const copy = COPY[language];

  return (
    <div className="min-h-screen bg-white font-['Roboto','Helvetica_Neue',Arial,sans-serif] text-[#1a1a1a]">
      <div className="bg-black px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white sm:text-xs">
        {copy.utility[0]} <span className="mx-2 text-[#737373]">|</span> {copy.utility[1]}
      </div>

      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link to="/" className="text-lg font-black uppercase tracking-tight">
            Think Tank <span className="text-[#cc0000]">Photo</span>
          </Link>
          <nav className="hidden items-center gap-8 text-xs font-bold uppercase md:flex" aria-label="Product navigation">
            <a href="#what-fits" className="hover:text-[#cc0000]">{copy.nav[0]}</a>
            <a href="#field-details" className="hover:text-[#cc0000]">{copy.nav[1]}</a>
            <a href="#specs" className="hover:text-[#cc0000]">{copy.nav[2]}</a>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex border border-[#1a1a1a]" aria-label="Language">
              {(['en', 'vi'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  aria-pressed={language === lang}
                  className={`h-8 px-3 text-[10px] font-black uppercase ${language === lang ? 'bg-[#1a1a1a] text-white' : 'bg-white text-[#1a1a1a]'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <Link to="/cart" className="flex items-center gap-2 text-xs font-black uppercase">
              <ShoppingCart size={18} /> <span className="hidden sm:inline">{language === 'vi' ? 'Giỏ hàng' : 'Cart'}</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="grid min-h-[690px] border-b border-[#e5e7eb] lg:grid-cols-[55%_45%]">
          <div className="relative min-h-[460px] overflow-hidden bg-[#ececec] lg:min-h-full">
            <img src={IMAGES.action} alt="Airport Advantage XT camera backpack in field use" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
            <div className="absolute bottom-5 left-5 border-l-2 border-[#cc0000] pl-3 text-xs font-bold uppercase tracking-widest text-white">
              {copy.field}
            </div>
          </div>

          <div className="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-14">
            <div className="mb-6 flex items-center gap-3">
              <span className="bg-[#cc0000] px-3 py-1.5 text-[11px] font-black uppercase text-white">{copy.new}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#6b7280]">{copy.series}</span>
            </div>
            <h1 className="max-w-xl text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] md:text-6xl xl:text-7xl">
              Airport Advantage™ XT
            </h1>
            <div className="mt-6 flex items-center gap-3 border-y border-[#e5e7eb] py-4">
              <div className="flex text-[#cc0000]" aria-label="4.9 out of 5 stars">
                {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={16} fill="currentColor" />)}
              </div>
              <a href="#reviews" className="text-sm font-bold underline underline-offset-4">{copy.review}</a>
            </div>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#4b5563]">
              {copy.intro}
            </p>
            <div className="mt-8 flex items-end justify-between border-t border-[#1a1a1a] pt-5">
              <div>
                <p className="text-xs font-bold uppercase text-[#6b7280]">{copy.color}</p>
                <p className="mt-1 text-2xl font-black">{price}</p>
              </div>
              <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#236b38]"><span className="h-2 w-2 bg-[#236b38]" /> {copy.stock}</span>
            </div>
            <button onClick={() => addToCart(PRODUCT)} className="mt-6 flex h-14 w-full items-center justify-center gap-3 bg-[#cc0000] px-6 text-sm font-black uppercase tracking-wider text-white hover:bg-[#a90000]">
              <ShoppingCart size={19} /> {copy.add}
            </button>
            <div className="mt-5 grid grid-cols-3 divide-x divide-[#e5e7eb] border-y border-[#e5e7eb] py-4 text-center text-[10px] font-bold uppercase text-[#4b5563]">
              <span><Truck className="mx-auto mb-2" size={19} />{copy.benefits[0]}</span>
              <span><RotateCcw className="mx-auto mb-2" size={19} />{copy.benefits[1]}</span>
              <span><ShieldCheck className="mx-auto mb-2" size={19} />{copy.benefits[2]}</span>
            </div>
          </div>
        </section>

        <aside className="sticky top-0 z-40 border-y border-[#333] bg-[#1a1a1a] text-white">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-10">
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase md:text-sm">{PRODUCT.title}</p>
              <p className="text-xs text-[#bdbdbd]">{price}</p>
            </div>
            <button onClick={() => addToCart(PRODUCT)} className="ml-5 h-10 shrink-0 bg-[#cc0000] px-5 text-xs font-black uppercase hover:bg-[#a90000] md:px-8">
              {copy.add}
            </button>
          </div>
        </aside>

        <section id="what-fits" className="border-b border-[#e5e7eb] px-5 py-20 lg:px-10">
          <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[40%_60%]">
            <div>
              <SectionTitle eyebrow={copy.fitsEyebrow}>{copy.fitsTitle}</SectionTitle>
              <p className="max-w-md text-base leading-7 text-[#4b5563]">
                {copy.fitsIntro}
              </p>
            </div>
            <div className="border-t-4 border-[#1a1a1a]">
              {copy.fits.map((item) => (
                <div key={item} className="flex gap-4 border-b border-[#e5e7eb] py-5 text-sm font-bold leading-6 md:text-base">
                  <Check className="mt-0.5 shrink-0 text-[#cc0000]" size={20} strokeWidth={3} /> {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#1a1a1a] px-5 py-16 lg:px-10">
          <div className="mx-auto grid max-w-[1320px] divide-y divide-[#3a3a3a] md:grid-cols-4 md:divide-x md:divide-y-0">
            {[Plane, LockKeyhole, Droplets, Camera].map((Icon, index) => (
              <Feature key={copy.features[index][0]} icon={Icon} title={copy.features[index][0]} copy={copy.features[index][1]} />
            ))}
          </div>
        </section>

        <section id="field-details" className="px-5 py-20 lg:px-10">
          <div className="mx-auto max-w-[1320px]">
            <SectionTitle eyebrow={copy.systemEyebrow}>{copy.systemTitle}</SectionTitle>
            <div className="grid gap-px bg-[#e5e7eb] md:grid-cols-3">
              <CrossfadeCard title={copy.cards[0][0]} label={copy.cards[0][1]} front={PRODUCT.image} back={IMAGES.loaded} hoverLabel={copy.hover} />
              <CrossfadeCard title={copy.cards[1][0]} label={copy.cards[1][1]} front={IMAGES.closed} back={IMAGES.empty} hoverLabel={copy.hover} />
              <CrossfadeCard title={copy.cards[2][0]} label={copy.cards[2][1]} front={IMAGES.harness} back={IMAGES.loaded} hoverLabel={copy.hover} />
            </div>
          </div>
        </section>

        <section id="specs" className="border-y border-[#333] bg-[#1a1a1a] px-5 py-20 text-white lg:px-10">
          <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[34%_66%]">
            <div>
              <SectionTitle eyebrow={copy.specsEyebrow}>{copy.specsTitle}</SectionTitle>
              <p className="max-w-sm text-sm leading-6 text-[#bdbdbd]">{copy.specsNote}</p>
            </div>
            <div className="border-t border-[#555]">
              {[
                [Ruler, copy.specs[0], '33 × 47.8 × 17.3 cm'],
                [Laptop, copy.specs[1], '31.8 × 45.7 × 16.5 cm'],
                [Weight, copy.specs[2], language === 'vi' ? '2,5 kg, gồm vách ngăn' : '2.5 kg, including dividers'],
                [Camera, copy.specs[3], language === 'vi' ? '41 L / ngăn laptop 17 inch' : '41 L / 17-inch laptop compartment'],
              ].map(([Icon, label, value]) => {
                const RowIcon = Icon as typeof Camera;
                return (
                  <div key={label as string} className="grid grid-cols-[36px_1fr] gap-3 border-b border-[#444] py-5 md:grid-cols-[40px_38%_1fr]">
                    <RowIcon size={20} className="text-[#d13205]" />
                    <dt className="text-xs font-black uppercase tracking-wider text-[#bdbdbd]">{label as string}</dt>
                    <dd className="col-start-2 text-sm font-bold md:col-start-3">{value as string}</dd>
                  </div>
                );
              })}
              <details className="group border-b border-[#444]">
                <summary className="flex cursor-pointer list-none items-center justify-between py-6 text-sm font-black uppercase">
                  {copy.materials} <ChevronRight className="transition-transform group-open:rotate-90" size={20} />
                </summary>
                <p className="pb-7 text-sm leading-7 text-[#bdbdbd]">
                  {copy.materialsCopy}
                </p>
              </details>
              <details className="group border-b border-[#444]">
                <summary className="flex cursor-pointer list-none items-center justify-between py-6 text-sm font-black uppercase">
                  {copy.warranty} <ChevronRight className="transition-transform group-open:rotate-90" size={20} />
                </summary>
                <p className="pb-7 text-sm leading-7 text-[#bdbdbd]">
                  {copy.warrantyCopy}
                </p>
              </details>
            </div>
          </div>
        </section>

        <section id="reviews" className="grid border-b border-[#e5e7eb] md:grid-cols-[36%_64%]">
          <div className="flex flex-col justify-center bg-[#f2f2f2] p-10 md:p-16">
            <p className="text-6xl font-black">4.9</p>
            <div className="my-4 flex text-[#cc0000]">{[0, 1, 2, 3, 4].map((star) => <Star key={star} fill="currentColor" size={18} />)}</div>
            <p className="text-xs font-bold uppercase tracking-wider">{copy.reviews}</p>
          </div>
          <blockquote className="flex flex-col justify-center border-l border-[#e5e7eb] p-10 md:p-16">
            <p className="text-xl font-bold leading-8 md:text-2xl">{copy.quote}</p>
            <footer className="mt-6 text-xs font-black uppercase tracking-wider text-[#6b7280]">{copy.author}</footer>
          </blockquote>
        </section>
      </main>

      <footer className="bg-black px-5 py-12 text-white lg:px-10">
        <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-8 border-b border-[#333] pb-10 md:flex-row md:items-end">
          <div>
            <p className="text-xl font-black uppercase">Think Tank <span className="text-[#cc0000]">Photo</span></p>
            <p className="mt-3 text-xs uppercase tracking-wider text-[#9ca3af]">{copy.tagline}</p>
          </div>
          <div className="flex gap-6 text-xs font-bold uppercase text-[#d1d5db]">
            <Link to="/contact">{copy.footerLinks[0]}</Link><Link to="/track-order">{copy.footerLinks[1]}</Link><Link to="/products">{copy.footerLinks[2]}</Link>
          </div>
        </div>
        <p className="mx-auto max-w-[1320px] pt-6 text-[10px] uppercase text-[#737373]">{copy.copyright}</p>
      </footer>
    </div>
  );
}
