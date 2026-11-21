export default function Footer() {
  return (
    <footer className="bg-white py-10">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <a
            href="#"
            className="font-display text-base font-bold tracking-tight text-[#141619]"
          >
            superpixelcutter.com
          </a>
          <p className="mt-1 text-xs text-[#6B707A]">
            © 2026 Super Pixel Cutter. Xưởng cắt sprite và xử lý đồ họa điểm ảnh trên trình duyệt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#52565E]">
          <a href="#studio" className="hover:text-[#141619]">
            Trình Cắt
          </a>
          <a href="#capabilities" className="hover:text-[#141619]">
            Tính Năng
          </a>
          <a href="#workflow" className="hover:text-[#141619]">
            Quy Trình
          </a>
          <a href="#pricing" className="hover:text-[#141619]">
            Gói Công Cụ
          </a>
          <a href="mailto:hello@superpixelcutter.com" className="font-mono text-[#141619] hover:text-[#E54826]">
            hello@superpixelcutter.com
          </a>
        </div>
      </div>
    </footer>
  );
}
