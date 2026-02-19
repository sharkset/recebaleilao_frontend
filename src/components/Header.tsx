import Link from 'next/link';
import { Menu, Search } from 'lucide-react';

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                        R
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">Receba<span className="text-emerald-600">Leilão</span></span>
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                    <Link href="/" className="hover:text-emerald-600 transition-colors">Buscar Leilões</Link>
                    <Link href="/watchers" className="hover:text-emerald-600 transition-colors">Criar Alerta</Link>
                    <Link href="#" className="hover:text-emerald-600 transition-colors">Sobre</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <button className="md:hidden p-2 text-gray-600 hover:text-emerald-600">
                        <Menu className="h-6 w-6" />
                    </button>
                    <Link href="/watchers" className="hidden md:inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all">
                        Criar Alerta
                    </Link>
                </div>
            </div>
        </header>
    );
}
