import { useState } from 'react';
import { ArrowDownRight, Scissors } from 'lucide-react';

interface HeroSectionProps {
  onStartCutting: () => void;
}

export default function HeroSection({ onStartCutting }: HeroSectionProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const specs = [
    {
      label: 'Xử lý trình duyệt',
      value: '0 ms độ trễ tải lên',
      detail: 'Ảnh giữ nguyên trên máy cá nhân',
    },
    {
      label: 'Thuật toán nội suy',
      value: 'Nearest-Neighbor',
      detail: 'Cạnh pixel sắc nét, không làm mờ',
    },
    {
      label: 'Chế độ nhận diện',
      value: 'Lưới & Tự tách khối',
      detail: 'Khoanh vùng sprite theo kênh alpha',
    },
    {
      label: 'Định dạng xuất',
      value: 'PNG · JSON · ZIP',
      detail: 'Tương thích Godot, Unity, Phaser',
    },
  ];

  return (
    <section className="border-b border-[#E2E2DC] bg-[#F8F8F6]">
      <div className="mx-auto max-w-[1280px] px-6 py-12 lg:py-16">
        {/* 2-Column Asymmetric Hero Split */}
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#52565E]">
                superpixelcutter.com · Xưởng cắt ảnh điểm ảnh trực tuyến
              </p>

              <h1
                className="mt-4 font-display font-bold tracking-tight text-[#141619] text-balance"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)', lineHeight: 1.08 }}
              >
                Cắt pixel và tách sprite chuẩn xác đến từng điểm ảnh.
              </h1>

              <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-[#42464D]">
                Tải lên sprite sheet, ảnh vật phẩm hoặc tài nguyên đồ họa 2D để cắt lưới đều, tự
                động tách từng khối vật thể, khử nền màu và xuất trọn bộ PNG cùng tệp tọa độ JSON
                ngay trong trình duyệt.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 pt-2">
              <button
                type="button"
                onClick={onStartCutting}
                className="inline-flex items-center gap-2.5 rounded-lg bg-[#E54826] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#C93A1B] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E54826]"
              >
                <Scissors className="h-4 w-4" aria-hidden="true" />
                <span>Bắt Đầu Cắt Ảnh</span>
              </button>

              <a
                href="#capabilities"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#141619] transition-colors duration-150 hover:text-[#E54826] hover:underline hover:underline-offset-4 whitespace-nowrap shrink-0"
              >
                <span>Xem công cụ xử lý</span>
                <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[280px] overflow-hidden rounded-xl border border-[#E2E2DC] bg-[#141619]">
              {!imgFailed ? (
                <img
                  src="/src/assets/images/hero_pixel_cutter_1795249631419.jpg"
                  alt="Bàn cắt kỹ thuật và các mảnh sprite pixel được sắp xếp theo lưới chuẩn xác tại Super Pixel Cutter"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover lg:h-full"
                />
              ) : (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 bg-[#1A1D21] p-8 text-center text-[#E2E2DC]">
                  <Scissors className="h-10 w-10 text-[#E54826]" aria-hidden="true" />
                  <p className="font-display text-lg font-semibold">Super Pixel Cutter Studio</p>
                  <p className="max-w-xs text-xs text-[#9BA1AA]">
                    Bàn cắt lưới điểm ảnh chính xác với công cụ tách khối sprite và khử nền alpha.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Specification Strip below Hero Split */}
        <div className="mt-10 grid grid-cols-1 border-t border-[#E2E2DC] pt-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 gap-6">
          {specs.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#52565E]">{item.label}</span>
              <span className="font-display text-lg font-semibold tracking-tight text-[#141619] tabular-nums">
                {item.value}
              </span>
              <span className="text-xs text-[#6B707A]">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
