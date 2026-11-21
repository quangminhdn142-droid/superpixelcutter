import { Grid3X3, Layers, Pipette, FileCode2 } from 'lucide-react';

export default function CapabilitiesSection() {
  return (
    <section id="capabilities" className="border-b border-[#E2E2DC] bg-[#F8F8F6] py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#E54826]">Kiến trúc xử lý điểm ảnh</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#141619] text-balance sm:text-4xl">
            Bốn công cụ cốt lõi thay thế thao tác cắt tay thủ công.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#42464D]">
            Mọi phép tính đều chạy trực tiếp trên HTML5 Canvas 2D với thuật toán Nearest-Neighbor,
            đảm bảo từng điểm ảnh giữ nguyên giá trị RGBA gốc.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Card 01: Wide Span 2 */}
          <article className="flex flex-col justify-between rounded-xl border border-[#E2E2DC] bg-white p-7 lg:col-span-2">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-xl font-semibold text-[#141619]">
                  01. Tự Động Nhận Diện & Khoanh Vùng Vật Thể
                </h3>
                <Layers className="h-5 w-5 shrink-0 text-[#E54826]" aria-hidden="true" />
              </div>
              <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-[#42464D]">
                Thuật toán quét liên thông điểm ảnh (Connected-Component Labeling) tự động phát hiện
                từng nhân vật, vũ khí hoặc đạo cụ nằm rải rác trên bảng ảnh lớn. Hỗ trợ khoảng gộp
                linh hoạt để giữ các hạt hiệu ứng bay xung quanh nằm chung một khung cắt.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#E2E2DC] pt-5 sm:grid-cols-3">
              <div>
                <span className="block text-xs text-[#6B707A]">Khoảng gộp chi tiết</span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-[#141619] tabular-nums">
                  2 px – 40 px
                </span>
              </div>
              <div>
                <span className="block text-xs text-[#6B707A]">Lọc nhiễu tối thiểu</span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-[#141619] tabular-nums">
                  8 px – 96 px
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-xs text-[#6B707A]">Thứ tự đánh số</span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-[#141619]">
                  Trái sang phải
                </span>
              </div>
            </div>
          </article>

          {/* Card 02: Span 1 */}
          <article className="flex flex-col justify-between rounded-xl border border-[#E2E2DC] bg-white p-7">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-xl font-semibold text-[#141619]">
                  02. Cắt Lưới Tilemap
                </h3>
                <Grid3X3 className="h-5 w-5 shrink-0 text-[#E54826]" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#42464D]">
                Chia ảnh theo số cột và số hàng hoặc theo kích thước ô cố định (16×16, 32×32,
                64×64). Tùy chỉnh độ lệch lề (Offset), khoảng hở (Spacing) và tự động bỏ qua các ô
                trống hoàn toàn.
              </p>
            </div>

            <div className="mt-6 border-t border-[#E2E2DC] pt-4 font-mono text-xs text-[#52565E] tabular-nums">
              16×16 · 32×32 · 64×64 · Tùy biến
            </div>
          </article>

          {/* Card 03: Span 1 */}
          <article className="flex flex-col justify-between rounded-xl border border-[#E2E2DC] bg-white p-7">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-xl font-semibold text-[#141619]">
                  03. Khử Nền & Pixel Hóa
                </h3>
                <Pipette className="h-5 w-5 shrink-0 text-[#E54826]" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#42464D]">
                Chấm trực tiếp màu nền trên ảnh để tách kênh Alpha trong suốt chỉ với một lần nhấn.
                Kết hợp thanh trượt Pixel hóa để chuyển ảnh chụp thông thường thành đồ họa điểm ảnh
                sắc nét.
              </p>
            </div>

            <div className="mt-6 border-t border-[#E2E2DC] pt-4 font-mono text-xs text-[#52565E] tabular-nums">
              Dung sai RGB 2 – 100 · Khối 1 – 20 px
            </div>
          </article>

          {/* Card 04: Wide Span 2 */}
          <article className="flex flex-col justify-between rounded-xl border border-[#E2E2DC] bg-white p-7 lg:col-span-2">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-xl font-semibold text-[#141619]">
                  04. Đóng Gói ZIP & Tọa Độ Atlas JSON Chuẩn Game Engine
                </h3>
                <FileCode2 className="h-5 w-5 shrink-0 text-[#E54826]" aria-hidden="true" />
              </div>
              <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[#42464D]">
                Xuất từng mảnh PNG riêng lẻ hoặc tải toàn bộ bộ sprite đã chọn thành một tệp nén ZIP
                duy nhất kèm tệp bản đồ tọa độ <span className="font-mono text-[#141619]">atlas.json</span>.
                Hỗ trợ phóng đại 2× hoặc 4× theo thuật toán giữ cạnh vuông góc để đưa thẳng vào
                Godot, Unity, Phaser hay Figma.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#E2E2DC] pt-5 sm:grid-cols-3">
              <div>
                <span className="block text-xs text-[#6B707A]">Đóng gói trực tiếp</span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-[#141619]">
                  PNG + ZIP + JSON
                </span>
              </div>
              <div>
                <span className="block text-xs text-[#6B707A]">Phóng đại không mờ</span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-[#141619] tabular-nums">
                  1× · 2× · 4×
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-xs text-[#6B707A]">Bảo mật dữ liệu</span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-[#141619]">
                  Không gửi lên máy chủ
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
