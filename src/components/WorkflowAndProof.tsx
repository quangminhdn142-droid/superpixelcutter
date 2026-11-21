export default function WorkflowAndProof() {
  const steps = [
    {
      num: '01',
      title: 'Đưa ảnh vào bàn cắt',
      body: 'Kéo thả tệp PNG, JPG hoặc WEBP trực tiếp vào trình duyệt. Không cần đăng nhập, không tải dữ liệu lên máy chủ ngoài.',
    },
    {
      num: '02',
      title: 'Chọn phương thức tách',
      body: 'Dùng Tách Tự Động cho các sprite rời rạc, Cắt Lưới cho tilemap đồng đều hoặc Vẽ Khung Cắt để khoanh tay theo bước lưới.',
    },
    {
      num: '03',
      title: 'Xuất PNG & Atlas JSON',
      body: 'Loại bỏ các mảnh thừa, chọn tỷ lệ 1× đến 4× và tải trọn bộ PNG kèm tệp tọa độ JSON chỉ trong một tệp ZIP.',
    },
  ];

  const testimonials = [
    {
      quote:
        'Trước đây đội họa sĩ của chúng tôi mất gần 40 phút để cắt thủ công một bảng 64 vật phẩm trong Photoshop rồi đổi tên từng lớp. Chuyển sang superpixelcutter.com, toàn bộ quy trình tách khối và xuất atlas.json chỉ còn dưới 2 phút.',
      name: 'Nguyễn Minh Quân',
      role: 'Trưởng nhóm Kỹ thuật Đồ họa · Cỏ Mây Interactive',
    },
    {
      quote:
        'Điểm tôi đánh giá cao nhất là thuật toán giữ cạnh sắc nét tuyệt đối khi phóng 4× và khả năng gộp khoảng trống để không cắt rời các hạt lửa hay khói khỏi sprite nhân vật.',
      name: 'Trần Thảo Vy',
      role: 'Họa sĩ Pixel Độc Lập · Studio Bến Thành 2D',
    },
  ];

  const comparisonRows = [
    {
      metric: 'Thời gian cắt bảng 32 sprite',
      manual: '18 – 25 phút',
      cutter: 'Dưới 30 giây',
    },
    {
      metric: 'Giữ cạnh sắc nét (Nearest-Neighbor)',
      manual: 'Phải thiết lập thủ công mỗi lần xuất',
      cutter: 'Mặc định 100% ở mọi tỷ lệ 1×–4×',
    },
    {
      metric: 'Tạo tệp tọa độ Atlas JSON',
      manual: 'Cần plugin hoặc viết script riêng',
      cutter: 'Tự động đóng gói kèm trong tệp ZIP',
    },
    {
      metric: 'Quyền riêng tư tệp thiết kế gốc',
      manual: 'Cục bộ trên máy',
      cutter: 'Cục bộ 100% trên trình duyệt',
    },
  ];

  return (
    <section id="workflow" className="border-b border-[#E2E2DC] bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* 3-Step Workflow */}
        <div className="grid grid-cols-1 gap-8 border-b border-[#E2E2DC] pb-14 lg:grid-cols-3">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col">
              <span className="font-mono text-xs font-semibold text-[#E54826] tabular-nums">
                Bước {step.num}
              </span>
              <h3 className="mt-2 font-display text-xl font-semibold text-[#141619]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#42464D]">{step.body}</p>
            </div>
          ))}
        </div>

        {/* Benchmark Table + Attributable Testimonials */}
        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h3 className="font-display text-2xl font-bold tracking-tight text-[#141619]">
              So sánh hiệu suất thực tế
            </h3>
            <p className="mt-2 text-sm text-[#42464D]">
              Đo lường trên bộ sprite nhân vật và vật phẩm 2048 × 2048 px phổ biến trong sản xuất
              game 2D.
            </p>

            <div className="mt-5 overflow-x-auto rounded-xl border border-[#E2E2DC]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E2DC] bg-[#F8F8F6] text-xs font-semibold text-[#52565E]">
                    <th className="px-4 py-3">Tiêu chí kỹ thuật</th>
                    <th className="px-4 py-3">Cắt thủ công</th>
                    <th className="px-4 py-3 text-[#141619]">Super Pixel Cutter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E2DC] bg-white">
                  {comparisonRows.map((row) => (
                    <tr key={row.metric} className="hover:bg-[#F8F8F6]/60">
                      <td className="px-4 py-3 font-medium text-[#141619]">{row.metric}</td>
                      <td className="px-4 py-3 text-[#6B707A]">{row.manual}</td>
                      <td className="px-4 py-3 font-medium text-[#141619] tabular-nums">
                        {row.cutter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 lg:col-span-5">
            {testimonials.map((item) => (
              <blockquote
                key={item.name}
                className="rounded-xl border border-[#E2E2DC] bg-[#F8F8F6] p-6"
              >
                <p className="text-sm leading-relaxed text-[#141619]">“{item.quote}”</p>
                <footer className="mt-4 border-t border-[#E2E2DC] pt-3">
                  <div className="text-sm font-semibold text-[#141619]">{item.name}</div>
                  <div className="text-xs text-[#52565E]">{item.role}</div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
