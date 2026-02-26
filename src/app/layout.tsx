import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { clsx } from 'clsx';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RecebaLeilão - Encontre seu próximo veículo',
  description: 'Sistema de busca e monitoramento de leilões de veículos.',
};

import { Suspense } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={clsx(inter.className, 'flex min-h-screen flex-col bg-gray-50')}>
        <AuthProvider>
          <Suspense fallback={<div className="h-20 bg-white border-b border-slate-100" />}>
            <Header />
          </Suspense>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
