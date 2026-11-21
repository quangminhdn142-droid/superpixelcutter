import React, { useState } from 'react';
import { Check, Send } from 'lucide-react';

interface PlansAndContactProps {
  onOpenStudio: () => void;
}

export default function PlansAndContact({ onOpenStudio }: PlansAndContactProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [teamNote, setTeamNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Vui lòng nhập tên của bạn hoặc tên studio.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError('Địa chỉ email chưa đúng định dạng.');
      return;
    }

    setSubmitted(true);
  };

  return (
    <section id="pricing" className="border-b border-[#E2E2DC] bg-[#F8F8F6] py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left: 2 Clear Plans */}
          <div className="lg:col-span-7">
            <p className="text-xs font-medium text-[#E54826]">Gói sử dụng công cụ</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#141619]">
              Miễn phí trọn đời trên trình duyệt.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#42464D]">
              Toàn bộ trình cắt sprite, nhận diện khối tự động và xuất ZIP trên{' '}
              <span className="font-medium text-[#141619]">superpixelcutter.com</span> hoạt động
              không giới hạn và không đóng dấu watermark.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col justify-between rounded-xl border border-[#E2E2DC] bg-white p-6">
                <div>
                  <span className="text-xs font-medium text-[#52565E]">
                    Dành cho cá nhân & họa sĩ 2D
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#141619]">
                    Bản Trình Duyệt
                  </h3>
                  <div className="mt-3 font-display text-3xl font-bold text-[#141619] tabular-nums">
                    0 đ
                    <span className="ml-1.5 font-sans text-xs font-normal text-[#52565E]">
                      / không giới hạn
                    </span>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-xs text-[#42464D]">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E54826]" />
                      <span>Tối đa 4096 × 4096 px mỗi ảnh</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E54826]" />
                      <span>Đầy đủ 3 chế độ: Tự động, Lưới, Thủ công</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E54826]" />
                      <span>Xuất PNG, Atlas JSON và tệp nén ZIP</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onOpenStudio}
                  className="mt-6 w-full rounded-lg bg-[#141619] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#2B3036] cursor-pointer"
                >
                  Sử Dụng Ngay Trên Web
                </button>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-[#141619] bg-white p-6">
                <div>
                  <span className="text-xs font-medium text-[#E54826]">
                    Dành cho studio & pipeline CI/CD
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#141619]">
                    Gói Studio CLI
                  </h3>
                  <div className="mt-3 font-display text-3xl font-bold text-[#141619] tabular-nums">
                    690.000 đ
                    <span className="ml-1.5 font-sans text-xs font-normal text-[#52565E]">
                      / giấy phép vĩnh viễn
                    </span>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-xs text-[#42464D]">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E54826]" />
                      <span>Cắt hàng loạt hàng trăm thư mục qua dòng lệnh</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E54826]" />
                      <span>Tích hợp trực tiếp vào GitHub Actions & Godot</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E54826]" />
                      <span>Chạy ngoại tuyến hoàn toàn trên Windows, macOS, Linux</span>
                    </li>
                  </ul>
                </div>

                <a
                  href="#contact-form"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-[#E54826] bg-[#E54826] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#C93A1B]"
                >
                  Đăng Ký Giấy Phép Studio
                </a>
              </div>
            </div>
          </div>

          {/* Right: Validated Lead / Contact Form */}
          <div id="contact-form" className="lg:col-span-5">
            <div className="rounded-xl border border-[#E2E2DC] bg-white p-6 sm:p-7">
              <h3 className="font-display text-xl font-bold text-[#141619]">
                Liên hệ hỗ trợ & cấp phép CLI
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#52565E]">
                Gửi yêu cầu nếu đội ngũ của bạn cần bản cài đặt ngoại tuyến hoặc định dạng xuất
                tọa độ riêng cho engine nội bộ.
              </p>

              {submitted ? (
                <div className="mt-6 rounded-lg border border-[#16A34A]/30 bg-[#16A34A]/8 p-5">
                  <p className="text-sm font-semibold text-[#141619]">
                    Đã tiếp nhận yêu cầu từ {name}.
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#42464D]">
                    Thông tin cài đặt và tài liệu kỹ thuật sẽ được phản hồi tới{' '}
                    <span className="font-mono font-medium text-[#141619]">{email}</span> trong
                    vòng 24 giờ làm việc.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setEmail('');
                      setTeamNote('');
                    }}
                    className="mt-4 text-xs font-semibold text-[#E54826] hover:underline cursor-pointer"
                  >
                    Gửi một yêu cầu khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-medium text-[#141619]">
                      Họ tên hoặc Tên Studio
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Studio Cỏ Mây"
                      className="mt-1.5 w-full rounded-lg border border-[#D4D4CC] bg-[#F8F8F6] px-3.5 py-2 text-sm text-[#141619] placeholder:text-[#8A8F99] focus:border-[#E54826] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-medium text-[#141619]">
                      Email công việc
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@studio.com"
                      className="mt-1.5 w-full rounded-lg border border-[#D4D4CC] bg-[#F8F8F6] px-3.5 py-2 text-sm text-[#141619] placeholder:text-[#8A8F99] focus:border-[#E54826] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-note" className="block text-xs font-medium text-[#141619]">
                      Nhu cầu sử dụng (Tùy chọn)
                    </label>
                    <textarea
                      id="contact-note"
                      rows={3}
                      value={teamNote}
                      onChange={(e) => setTeamNote(e.target.value)}
                      placeholder="Engine đang dùng (Godot, Unity, Phaser) hoặc số lượng thành viên..."
                      className="mt-1.5 w-full rounded-lg border border-[#D4D4CC] bg-[#F8F8F6] px-3.5 py-2 text-sm text-[#141619] placeholder:text-[#8A8F99] focus:border-[#E54826] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-xs font-medium text-[#DC2626]">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#E54826] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C93A1B] cursor-pointer"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Gửi Yêu Cầu Hỗ Trợ</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
