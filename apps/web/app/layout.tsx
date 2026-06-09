import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { LanguageProvider } from '../components/LanguageProvider';
import { ThemeProvider } from '../components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Polytech медиа архив',
  description: 'Колледждің мақалалар, телесюжеттер және фото іс-шаралар бойынша цифрлық мұрағаты',
  applicationName: 'Polytech медиа архив',
  icons: {
    icon: '/assets/LOGO_NEW.png',
    shortcut: '/assets/LOGO_NEW.png',
    apple: '/assets/LOGO_NEW.png'
  },
  openGraph: {
    title: 'Polytech медиа архив',
    description: 'Колледждің мақалалар, телесюжеттер және фото іс-шаралар бойынша цифрлық мұрағаты'
  },
  twitter: {
    card: 'summary',
    title: 'Polytech медиа архив',
    description: 'Колледждің мақалалар, телесюжеттер және фото іс-шаралар бойынша цифрлық мұрағаты'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const key = 'polytech-media-archive-theme';
                  const stored = localStorage.getItem(key);
                  const theme = stored === 'dark' ? 'dark' : 'light';
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (_) {
                  document.documentElement.dataset.theme = 'light';
                }
              })();
            `
          }}
        />
      </head>
      <body className="min-h-screen font-[var(--font-manrope)] text-slate-900">
        <ThemeProvider>
          <LanguageProvider>
            <div className="flex min-h-screen flex-col">
              <Suspense fallback={<header className="h-24 border-b border-slate-200/80 bg-white/95" />}>
                <SiteHeader />
              </Suspense>
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
