"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu, Search, User, LogOut, Settings, LayoutDashboard, Car, Calendar, Bell, Calculator, Heart, CreditCard, ChevronDown, MessageSquare, X } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { getLotDetailsUrl, getNotificationContent } from '@/lib/notificationUtils';

export default function Header() {
    const { data: session } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        if (isMenuOpen || isNotificationsOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isMenuOpen, isNotificationsOpen]);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

    const [userImage, setUserImage] = useState<string | null>(null);

    // Fetch user profile for latest image
    const fetchProfile = useCallback(() => {
        if (session?.user?.email) {
            import('@/lib/api').then(m => {
                m.default.get(`/auth/me?email=${encodeURIComponent(session.user!.email!)}`)
                    .then(res => {
                        const img = res.data?.user?.image;
                        if (img) setUserImage(img);
                    })
                    .catch(() => { });
            });
        }
    }, [session]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        window.addEventListener('profileUpdated', fetchProfile);
        return () => window.removeEventListener('profileUpdated', fetchProfile);
    }, [fetchProfile]);

    // Fetch notifications
    useEffect(() => {
        if (session?.user?.email) {
            import('@/lib/api').then(m => {
                m.default.get(`/notifications?email=${encodeURIComponent(session.user!.email!)}`)
                    .then(res => setNotifications(res.data?.notifications || []))
                    .catch(() => { });
            });
        }
    }, [session]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAllAsRead = async () => {
        if (!session?.user?.email) return;
        try {
            const api = (await import('@/lib/api')).default;
            await api.post('/notifications/read-all', { email: session.user.email });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            const api = (await import('@/lib/api')).default;
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

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
                            {session && (
                                <Link href="/minha-conta?tab=alertas" className="hover:text-emerald-500 transition-colors">Alertas</Link>
                            )}
                        </nav>

                        {session && (
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-400 hover:text-emerald-500"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {isNotificationsOpen && (
                                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 z-50">
                                        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-900">Notificações</span>
                                                {unreadCount > 0 && (
                                                    <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{unreadCount}</span>
                                                )}
                                            </div>
                                            {unreadCount > 0 && (
                                                <button onClick={handleMarkAllAsRead} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider">Lidas</button>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-10 text-center">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                        <Bell className="w-6 h-6 text-slate-200" />
                                                    </div>
                                                    <p className="text-slate-400 text-sm font-medium">Nenhuma notificação</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-50">
                                                    {notifications.map((n) => {
                                                        const link = getLotDetailsUrl(n);
                                                        const { isAlert, lotTitle } = getNotificationContent(n);

                                                        return (
                                                            <div
                                                                key={n._id}
                                                                onClick={() => {
                                                                    if (!n.read) handleMarkAsRead(n._id);
                                                                    if (link) {
                                                                        setIsNotificationsOpen(false);
                                                                        if (link.startsWith('http')) {
                                                                            window.open(link, '_blank');
                                                                        } else {
                                                                            router.push(link);
                                                                        }
                                                                    }
                                                                }}
                                                                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                                            >
                                                                <div className="flex gap-3">
                                                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : 'bg-emerald-500'}`} />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-slate-800 text-sm">{n.title}</p>
                                                                        {isAlert && lotTitle ? (
                                                                            <p className="text-xs text-emerald-600 font-bold mt-1 hover:underline decoration-emerald-600/30 underline-offset-2">
                                                                                {lotTitle}
                                                                            </p>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                                        )}
                                                                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                                                                            {new Date(n.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <div className="p-4 bg-slate-50 border-t border-slate-100 italic text-center text-xs font-bold">
                                                <Link
                                                    href="/minha-conta?tab=notificacoes"
                                                    onClick={() => setIsNotificationsOpen(false)}
                                                    className="text-emerald-600 hover:text-emerald-700"
                                                >
                                                    Ver todas
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {session ? (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 p-1 pl-3 lg:pl-4 bg-slate-50 border border-slate-100 rounded-full hover:bg-slate-100 transition-all"
                                >
                                    <div className="hidden lg:flex flex-col items-end mr-1">
                                        <span className="text-xs font-black text-slate-900">{session.user?.name}</span>
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase">Assinar Pro</span>
                                    </div>
                                    {userImage ? (
                                        <img
                                            src={userImage}
                                            alt="User"
                                            className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white shadow-sm object-cover"
                                            onError={() => setUserImage(null)}
                                        />
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
                                            {userImage ? (
                                                <img
                                                    src={userImage}
                                                    alt="User"
                                                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                                                    onError={() => setUserImage(null)}
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl">
                                                    {session.user?.name?.[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-black text-slate-900 truncate">{session.user?.name}</span>
                                                <span className="text-xs text-slate-400 truncate">{session.user?.email}</span>
                                            </div>
                                            <button className="ml-auto p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors" onClick={() => router.push('/minha-conta')}>
                                                <Settings className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>

                                        <div className="p-2">
                                            <MenuLink href="/minha-conta" icon={<User className="w-4 h-4" />} title="Minha Conta" />

                                            <div className="my-2 border-t border-slate-50" />

                                            <MenuLink href="/search" icon={<Car className="w-4 h-4" />} title="Leilões" premium />
                                            <MenuLink href="/minha-conta?tab=alertas" icon={<Bell className="w-4 h-4" />} title="Alertas" />
                                            <MenuLink href="/calendar" icon={<Calendar className="w-4 h-4" />} title="Calendário" premium />
                                            <MenuLink href="/minha-conta?tab=favoritos" icon={<Heart className="w-4 h-4" />} title="Favoritos" />


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
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-4 lg:px-6 py-2 lg:py-3 text-xs lg:text-sm font-bold text-slate-700 transition-all"
                            >
                                Entrar
                            </Link>
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
