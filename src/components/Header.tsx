"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu, Search, User, LogOut, Settings, LayoutDashboard, Car, Calendar, Bell, Calculator, Heart, CreditCard, ChevronDown, MessageSquare, X } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
    const { data: session } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

    // Sync search value with URL params
    useEffect(() => {
        setSearchValue(searchParams.get('search') || '');
    }, [searchParams]);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // When searching from the header, we typically want a fresh global search
        // unless we want to keep filters. For now, let's keep it simple and just set search.
        const params = new URLSearchParams();
        if (searchValue) {
            params.set('search', searchValue);
        }
        params.set('page', '1');

        console.log('Pushing search:', params.toString());
        router.push(`/search?${params.toString()}`);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
            <div className="container mx-auto px-4">
                <div className="flex h-20 items-center justify-between gap-4 lg:gap-8">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 lg:gap-3 group shrink-0">
                        <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white font-black text-lg lg:text-xl shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform">
                            R
                        </div>
                        <span className="hidden sm:inline text-xl lg:text-2xl font-black text-slate-900 tracking-tight">Receba<span className="text-emerald-500">Leilão</span></span>
                    </Link>

                    {/* Desktop Search Bar (Bring a Trailer Style) */}
                    <div className="hidden md:flex flex-1 max-w-[800px] justify-center">
                        <form
                            onSubmit={handleSearch}
                            className="relative w-full group"
                        >
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Buscar marca, modelo, categoria ou qualquer coisa..."
                                className="w-full h-12 pl-4 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </form>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 lg:gap-6 shrink-0">
                        <nav className="hidden xl:flex items-center gap-6 text-sm font-bold text-slate-500 uppercase tracking-widest mr-2">
                            <Link href="/search" className="hover:text-emerald-500 transition-colors">Leilões</Link>
                            <Link href="/plans" className="hover:text-emerald-500 transition-colors">Planos</Link>
                        </nav>

                        <div className="hidden sm:flex items-center gap-4 text-slate-400">
                            <Bell className="w-5 h-5 cursor-pointer hover:text-emerald-500 transition-colors" />
                        </div>

                        {session ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 p-1 pl-3 lg:pl-4 bg-slate-50 border border-slate-100 rounded-full hover:bg-slate-100 transition-all"
                                >
                                    <div className="hidden lg:flex flex-col items-end mr-1">
                                        <span className="text-xs font-black text-slate-900">{session.user?.name}</span>
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase">Assinar Pro</span>
                                    </div>
                                    {session.user?.image ? (
                                        <img src={session.user.image} alt="User" className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white shadow-sm" />
                                    ) : (
                                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm text-xs lg:text-sm">
                                            {session.user?.name?.[0].toUpperCase()}
                                        </div>
                                    )}
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl">
                                                {session.user?.name?.[0].toUpperCase()}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-black text-slate-900 truncate">{session.user?.name}</span>
                                                <span className="text-xs text-slate-400 truncate">{session.user?.email}</span>
                                            </div>
                                            <button className="ml-auto p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                                <Settings className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>

                                        <div className="p-2">
                                            <MenuLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} title="Início" />
                                            <MenuLink href="/search" icon={<Search className="w-4 h-4" />} title="Buscar" />

                                            <div className="my-2 border-t border-slate-50" />

                                            <MenuLink href="#" icon={<LayoutDashboard className="w-4 h-4" />} title="Dashboard" badge="Em breve" badgeColor="bg-amber-100 text-amber-600" />
                                            <MenuLink href="/search" icon={<Car className="w-4 h-4" />} title="Leilões" premium />
                                            <MenuLink href="#" icon={<Calendar className="w-4 h-4" />} title="Calendário" premium />
                                            <MenuLink href="/watchers" icon={<MessageSquare className="w-4 h-4" />} title="Notificações" premium />
                                            <MenuLink href="#" icon={<Calculator className="w-4 h-4" />} title="Calculadora" premium />
                                            <MenuLink href="#" icon={<Heart className="w-4 h-4" />} title="Favoritos" />
                                            <MenuLink href="/plans" icon={<CreditCard className="w-4 h-4" />} title="Planos" badge="Assine já" badgeColor="bg-violet-100 text-violet-600" />

                                            <div className="my-2 border-t border-slate-50" />

                                            <button
                                                onClick={() => signOut()}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 font-bold hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sair
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="hidden sm:block text-slate-500 font-bold hover:text-emerald-500 transition-colors"
                                >
                                    Entrar
                                </Link>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 lg:px-6 py-2 lg:py-3 text-xs lg:text-sm font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-400 hover:scale-105 transition-all"
                                >
                                    Criar Conta
                                </Link>
                            </div>
                        )}
                        <button className="md:hidden p-2 text-slate-600 hover:text-emerald-500">
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                <div className="md:hidden pb-4">
                    <form
                        onSubmit={handleSearch}
                        className="relative w-full"
                    >
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Buscar no Receba Leilão..."
                            className="w-full h-11 pl-4 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </header>
    );
}

function MenuLink({ href, icon, title, premium, badge, badgeColor }: { href: string, icon: React.ReactNode, title: string, premium?: boolean, badge?: string, badgeColor?: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 font-bold hover:bg-emerald-50 hover:text-emerald-600 transition-all group"
        >
            <div className="text-slate-400 group-hover:text-emerald-500 transition-colors">
                {icon}
            </div>
            <span className="flex-1">{title}</span>
            {premium && (
                <span className="bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Premium</span>
            )}
            {badge && (
                <span className={`${badgeColor} text-[8px] px-2 py-0.5 rounded-full font-black uppercase whitespace-nowrap`}>{badge}</span>
            )}
        </Link>
    );
}
