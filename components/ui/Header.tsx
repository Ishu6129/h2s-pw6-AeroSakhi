'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Overview' },
    { href: '/assistant', label: 'Air Advisory' },
    { href: '/dashboard', label: 'Routine Analysis' },
  ] as const;

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="header-brand" aria-label="AeroSakhi home">
          <div className="brand-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
              <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
              <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
            </svg>
          </div>
          <div className="header-logo">
            Aero<span>Sakhi</span>
          </div>
          <div className="live-pill" aria-label="Air intelligence status">
            <span className="pulse-dot" aria-hidden="true" />
            <span>Telemetry Online</span>
          </div>
        </Link>

        <nav aria-label="Main navigation">
          <ul className="header-nav">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`nav-link ${pathname === link.href ? 'nav-link-active' : ''}`}
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
