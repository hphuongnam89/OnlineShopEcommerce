import { Target, Lightbulb, Heart, Globe } from 'lucide-react';

const About = () => {
  return (
    <div className="bg-white min-h-screen pt-28">
      {/* Hero Section */}
      <section className="bg-slate-50 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Về Think Tank</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">Hành trình của chúng tôi bắt đầu từ niềm đam mê nhiếp ảnh và khao khát bảo vệ những thiết bị quý giá nhất.</p>
      </section>

      {/* Story Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Chúng Tôi Là Ai?</h2>
            <p className="text-lg text-slate-600 mb-4 leading-relaxed">
              Think Tank là thương hiệu hàng đầu trong lĩnh vực cung cấp các giải pháp bảo vệ thiết bị quang học chuyên dụng. Với hơn 15 năm kinh nghiệm, chúng tôi hiểu rõ những nhu cầu và thách thức mà các nhiếp ảnh gia phải đối mặt hàng ngày.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Mỗi sản phẩm của Think Tank được thiết kế với sự tỉ mỉ, sử dụng những vật liệu chất lượng cao nhất để đảm bảo an toàn tối đa cho các thiết bị quý giá của bạn, cho dù bạn đang ở studio hay trên đỉnh núi.
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-100 rounded-3xl transform translate-x-4 translate-y-4 -z-10"></div>
            <img src="/images/AirportCommuter.jpg" alt="Về Chúng Tôi" className="rounded-3xl shadow-lg w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Giá Trị Cốt Lõi</h2>
            <p className="text-slate-400">Những nguyên tắc hướng dẫn chúng tôi trong mọi quyết định</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-800 p-8 rounded-2xl text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Chất Lượng</h3>
              <p className="text-slate-400 text-sm">Vật liệu và công nghệ tốt nhất cho sản phẩm bền bỉ.</p>
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Sáng Tạo</h3>
              <p className="text-slate-400 text-sm">Nghiên cứu sâu sắc và cải tiến liên tục.</p>
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Đam Mê</h3>
              <p className="text-slate-400 text-sm">Yêu thích những gì chúng tôi làm mỗi ngày.</p>
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Bền Vững</h3>
              <p className="text-slate-400 text-sm">Cam kết sản xuất thân thiện với môi trường.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
            <div className="text-center px-4">
              <h3 className="text-4xl font-extrabold text-blue-600 mb-2">15+</h3>
              <p className="text-slate-600 font-medium">Năm Kinh Nghiệm</p>
            </div>
            <div className="text-center px-4">
              <h3 className="text-4xl font-extrabold text-blue-600 mb-2">100K+</h3>
              <p className="text-slate-600 font-medium">Khách Hàng</p>
            </div>
            <div className="text-center px-4">
              <h3 className="text-4xl font-extrabold text-blue-600 mb-2">50+</h3>
              <p className="text-slate-600 font-medium">Sản Phẩm</p>
            </div>
            <div className="text-center px-4">
              <h3 className="text-4xl font-extrabold text-blue-600 mb-2">30+</h3>
              <p className="text-slate-600 font-medium">Quốc Gia</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
