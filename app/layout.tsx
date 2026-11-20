import type { Metadata } from 'next';
import { SkipLink } from '@/components/ui/SkipLink';
import { Header } from '@/components/ui/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'AeroSakhi — Urban Air Intelligence & Smog Mitigation Platform',
  description:
    'Location-calibrated air quality intelligence, low-emission daily routines, and pediatric-to-senior respiratory defense protocols during winter smog seasons.',
  keywords: [
    'air quality index',
    'urban smog mitigation',
    'PM2.5 exposure defense',
    'indoor air purification',
    'low emission routines',
    'AeroSakhi',
    'clean living alternative',
    'WHO air quality guidelines',
  ],
  authors: [{ name: 'AeroSakhi Research Initiative' }],
  openGraph: {
    title: 'AeroSakhi — Urban Air Intelligence & Smog Mitigation Platform',
    description:
      'Location-calibrated air quality intelligence, low-emission routines, and respiratory defense.',
    type: 'website',
    locale: 'en_US',
    siteName: 'AeroSakhi',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SkipLink />
        <Header />
        {children}
        <footer className="footer">
          <div className="container">
            <div className="footer-inner">
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                  AeroSakhi Environmental Intelligence
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  Public Health Smog Mitigation Initiative • Calibrated against WHO & US EPA particulate benchmarks
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Informational advisory only • Not a substitute for primary clinical diagnosis</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
