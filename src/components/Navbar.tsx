import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenStudio: () => void;
}

export default function Navbar({ onOpenStudio }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '#studio', label: 'Trình Cắt' },
    { href: '#capabilities', label: 'Tính Năng' },
    { href: '#workflow', label: 'Quy Trình' },
    { href: '#pricing', label: 'Gói Công Cụ' },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E2DC] bg-[#F8F8F6]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-8 px-6">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#"
          className="font-display text-lg font-bold tracking-tight text-[#141619] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E54826]"
        >
          superpixelcutter.com
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[#52565E]"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#141619] hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E54826]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenStudio}
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[#E54826] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#C93A1B] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E54826]"
          >
            Mở Studio Cắt
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E2DC] bg-white text-[#141619] md:hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-[#E54826]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#E2E2DC] bg-[#F8F8F6] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className="py-1.5 text-sm font-medium text-[#141619] hover:text-[#E54826]"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenStudio();
              }}
              className="mt-2 w-full rounded-lg bg-[#E54826] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Mở Studio Cắt
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
