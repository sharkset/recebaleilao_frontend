"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    User, Settings, CreditCard, MessageSquare, Bell, LogOut,
    Save, Loader2, CheckCircle, Plus, Trash2, ChevronRight,
    Phone, FileText, AlertCircle, Crown, Calendar, Zap, Pencil, Heart
} from "lucide-react";
import api from "@/lib/api";
import FipeSelector from "@/components/FipeSelector";
import InternationalPhoneInput from "@/components/InternationalPhoneInput";
import { isValidPhoneNumber } from "react-phone-number-input";
import { formatCPF, validateCPF, formatPhoneBR, validatePhoneBR, normalizeNumbers } from "@/lib/brazilianUtils";
import { getLotDetailsUrl, getNotificationContent } from "@/lib/notificationUtils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface UserProfile {
    id: string;
    name: string;
    email: string;
    image?: string;
    whatsapp?: string;
    cpf?: string;
    role: string;
    preferences?: {
        receivePromotions: boolean;
        notifyFavorites: boolean;
    };
}

interface WhatsAppAlert {
    _id: string;
    keywords?: string;
    brand?: string;
    vehicleModel?: string; // renamed from model to avoid Mongoose conflict
    model?: string;        // kept for backward compat
    version?: string;
    color?: string;
    minYear?: number;
    maxYear?: number;
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    location?: string;
    notifyWhatsApp: boolean;
    notifyEmail: boolean;
    active: boolean;
    createdAt: string;
}

interface PaymentRecord {
    _id: string;
    plan: string;
    amount: number;
    status: string;
    createdAt: string;
}

interface Favorite {
    _id: string;
    lotId: string;
    auctionId: string;
    marca?: string;
    modelo?: string;
    ano?: string;
    image?: string;
    createdAt: string;
}

type Tab = "conta" | "alertas" | "favoritos" | "preferencias" | "faturamento" | "notificacoes";

// ─── Tab Button ─────────────────────────────────────────────────────────────

function TabButton({ id, active, icon, label, onClick }: {
    id: Tab; active: boolean; icon: React.ReactNode; label: string; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${active
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

function MinhaContaContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<Tab>("conta");

    // Sync active tab with URL
    useEffect(() => {
        const tab = searchParams.get("tab") as Tab;
        if (tab && ["conta", "alertas", "favoritos", "preferencias", "faturamento", "notificacoes"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Profile state
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileForm, setProfileForm] = useState({ name: "", email: "", whatsapp: "", cpf: "", image: "" });
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [profileErrors, setProfileErrors] = useState({ cpf: "", whatsapp: "" });

    // Preferences
    const [preferences, setPreferences] = useState({
        receivePromotions: true,
        notifyFavorites: true
    });
    const [savingPrefs, setSavingPrefs] = useState(false);

    // Alerts
    const [alerts, setAlerts] = useState<WhatsAppAlert[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(false);
    const [showAlertForm, setShowAlertForm] = useState(false);
    const [alertForm, setAlertForm] = useState({
        keywords: "",
        brand: "", model: "", version: "", color: "",
        minYear: "", maxYear: "",
        minPrice: "", maxPrice: "",
        category: "", location: "",
        notifyWhatsApp: true, notifyEmail: false,
    });
    const [savingAlert, setSavingAlert] = useState(false);
    const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

    // Payments
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);

    // Favorites
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);

    // Notifications
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    // ── Auth guard
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // ── Load profile
    useEffect(() => {
        if (session?.user?.email) {
            api.get(`/auth/me?email=${encodeURIComponent(session.user.email)}`)
                .then(res => {
                    const u = res.data.user;
                    setProfile(u);
                    setProfileForm({
                        name: u.name || "",
                        email: u.email || "",
                        whatsapp: u.whatsapp || "",
                        cpf: u.cpf ? formatCPF(u.cpf) : "",
                        image: u.image || ""
                    });
                    setPreferences({
                        receivePromotions: u.preferences?.receivePromotions ?? true,
                        notifyFavorites: u.preferences?.notifyFavorites ?? true
                    });
                })
                .catch(() => { });
        }
    }, [session]);

    // ── Load alerts when tab opens
    useEffect(() => {
        if (activeTab === "alertas" && session?.user?.email) {
            setLoadingAlerts(true);
            api.get(`/watchers?email=${encodeURIComponent(session.user.email)}`)
                .then(res => setAlerts(res.data?.watchers || []))
                .catch(() => setAlerts([]))
                .finally(() => setLoadingAlerts(false));
        }
    }, [activeTab, session]);

    // ── Load favorites when tab opens
    useEffect(() => {
        if (activeTab === "favoritos" && session?.user?.email) {
            setLoadingFavorites(true);
            api.get(`/favorites?email=${encodeURIComponent(session.user.email)}`)
                .then(res => setFavorites(res.data?.favorites || []))
                .catch(() => setFavorites([]))
                .finally(() => setLoadingFavorites(false));
        }
    }, [activeTab, session]);

    // ── Load notifications when tab opens
    useEffect(() => {
        if (activeTab === "notificacoes" && session?.user?.email) {
            setLoadingNotifications(true);
            api.get(`/notifications?email=${encodeURIComponent(session.user.email)}`)
                .then(res => setNotifications(res.data?.notifications || []))
                .catch(() => setNotifications([]))
                .finally(() => setLoadingNotifications(false));
        }
    }, [activeTab, session]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // ── Load payments when tab opens
    useEffect(() => {
        if (activeTab === "faturamento" && session?.user?.email) {
            setLoadingPayments(true);
            api.get(`/payments?email=${encodeURIComponent(session.user.email)}`)
                .then(res => setPayments(res.data?.payments || []))
                .catch(() => setPayments([]))
                .finally(() => setLoadingPayments(false));
        }
    }, [activeTab, session]);

    // ── Save profile
    const handleSaveProfile = async () => {
        if (!session?.user?.email || !profile) return;

        // Validation
        const isCPFValid = !profileForm.cpf || validateCPF(profileForm.cpf);
        const isWhatsappValid = !profileForm.whatsapp || isValidPhoneNumber(profileForm.whatsapp);

        setProfileErrors({
            cpf: isCPFValid ? "" : "CPF inválido",
            whatsapp: isWhatsappValid ? "" : "Número inválido para o país selecionado."
        });

        if (!isCPFValid || !isWhatsappValid) return;

        setSavingProfile(true);
        try {
            const dataToSave = {
                ...profileForm,
                cpf: normalizeNumbers(profileForm.cpf),
                whatsapp: profileForm.whatsapp // Already E.164 from InternationalPhoneInput
            };
            // Pass the original email as identifier and the form data (which includes the new email)
            await api.put("/auth/me", { currentEmail: profile.email, ...dataToSave });
            setProfileSuccess(true);
            window.dispatchEvent(new Event('profileUpdated'));
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch { }
        finally { setSavingProfile(false); }
    };

    // ── Save preferences
    const handleSavePrefs = async () => {
        if (!session?.user?.email) return;
        setSavingPrefs(true);
        try {
            await api.put("/auth/me", { email: session.user.email, preferences });
        } catch { }
        finally { setSavingPrefs(false); }
    };

    // ── Start editing alert
    const handleEditAlert = (alert: WhatsAppAlert) => {
        setEditingAlertId(alert._id);
        setAlertForm({
            keywords: alert.keywords || "",
            brand: alert.brand || "",
            model: alert.vehicleModel || "",
            version: alert.version || "",
            color: alert.color || "",
            minYear: alert.minYear ? String(alert.minYear) : "",
            maxYear: alert.maxYear ? String(alert.maxYear) : "",
            minPrice: alert.minPrice ? String(alert.minPrice) : "",
            maxPrice: alert.maxPrice ? String(alert.maxPrice) : "",
            category: alert.category || "",
            location: alert.location || "",
            notifyWhatsApp: alert.notifyWhatsApp,
            notifyEmail: alert.notifyEmail,
        });
        setShowAlertForm(true);
    };

    // ── Create OR update alert
    const handleCreateAlert = async () => {
        if (!session?.user?.email) return;
        setSavingAlert(true);
        const payload = {
            email: session.user.email,
            keywords: alertForm.keywords || undefined,
            brand: alertForm.brand || undefined,
            vehicleModel: alertForm.model || undefined, // Changed to vehicleModel for API
            version: alertForm.version || undefined,
            color: alertForm.color || undefined,
            minYear: alertForm.minYear ? Number(alertForm.minYear) : undefined,
            maxYear: alertForm.maxYear ? Number(alertForm.maxYear) : undefined,
            minPrice: alertForm.minPrice ? Number(alertForm.minPrice) : undefined,
            maxPrice: alertForm.maxPrice ? Number(alertForm.maxPrice) : undefined,
            category: alertForm.category || undefined,
            location: alertForm.location || undefined,
            notifyWhatsApp: alertForm.notifyWhatsApp,
            notifyEmail: alertForm.notifyEmail,
        };
        try {
            if (editingAlertId) {
                await api.put(`/watchers/${editingAlertId}`, payload);
            } else {
                await api.post("/watchers", payload);
            }
            setAlertForm({
                keywords: "", brand: "", model: "", version: "", color: "",
                minYear: "", maxYear: "", minPrice: "", maxPrice: "",
                category: "", location: "", notifyWhatsApp: true, notifyEmail: false,
            });
            setEditingAlertId(null);
            setShowAlertForm(false);
            const res = await api.get(`/watchers?email=${encodeURIComponent(session.user.email)}`);
            setAlerts(res.data?.watchers || []);
        } catch { }
        finally { setSavingAlert(false); }
    };

    // ── Delete alert
    const handleDeleteAlert = async (id: string) => {
        try {
            await api.delete(`/watchers/${id}`);
            setAlerts(prev => prev.filter(a => a._id !== id));
        } catch { }
    };

    // ── Delete favorite
    const handleDeleteFavorite = async (id: string) => {
        try {
            await api.delete(`/favorites/${id}`);
            setFavorites(prev => prev.filter(f => f._id !== id));
        } catch { }
    };

    // ── Clear all favorites
    const handleClearAllFavorites = async () => {
        if (!session?.user?.email) return;
        if (!confirm("Tem certeza que deseja remover todos os favoritos?")) return;
        try {
            await api.delete(`/favorites?email=${encodeURIComponent(session.user.email)}`);
            setFavorites([]);
        } catch { }
    };

    if (status === "loading" || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    const initials = profile.name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || "?";

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Header */}
            <div className="bg-white border-b border-slate-100">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center gap-5">
                        {profile.image ? (
                            <img src={profile.image} alt={profile.name} className="w-16 h-16 rounded-2xl object-cover ring-4 ring-emerald-100" />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-black text-2xl ring-4 ring-emerald-100">
                                {initials}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">{profile.name}</h1>
                            <p className="text-slate-400 text-sm">{profile.email}</p>
                            <span className="inline-flex items-center gap-1 mt-1 bg-amber-100 text-amber-700 text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                                <Crown className="w-3 h-3" /> Plano Gratuito
                            </span>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="ml-auto flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors text-sm font-bold"
                        >
                            <LogOut className="w-4 h-4" /> Sair
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
                        <TabButton id="conta" active={activeTab === "conta"} icon={<User className="w-4 h-4" />} label="Minha Conta" onClick={() => setActiveTab("conta")} />
                        <TabButton id="alertas" active={activeTab === "alertas"} icon={<MessageSquare className="w-4 h-4" />} label="Alertas WhatsApp" onClick={() => setActiveTab("alertas")} />
                        <TabButton id="favoritos" active={activeTab === "favoritos"} icon={<Heart className="w-4 h-4" />} label="Favoritos" onClick={() => setActiveTab("favoritos")} />
                        <TabButton id="notificacoes" active={activeTab === "notificacoes"} icon={<Bell className="w-4 h-4" />} label="Notificações" onClick={() => setActiveTab("notificacoes")} />
                        <TabButton id="preferencias" active={activeTab === "preferencias"} icon={<Settings className="w-4 h-4" />} label="Preferências" onClick={() => setActiveTab("preferencias")} />
                        <TabButton id="faturamento" active={activeTab === "faturamento"} icon={<CreditCard className="w-4 h-4" />} label="Faturamento" onClick={() => setActiveTab("faturamento")} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8 max-w-2xl">

                {/* ─── Minha Conta ─── */}
                {activeTab === "conta" && (
                    <div className="bg-white rounded-3xl shadow-sm shadow-slate-100 border border-slate-100 p-6 space-y-5">
                        <h2 className="text-lg font-black text-slate-900">Dados da conta</h2>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="Seu nome completo"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                                    readOnly={!!profile?.email}
                                    className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium focus:outline-none transition-all ${profile?.email ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                                    placeholder="seu@email.com"
                                />
                            </div>
                            {profile?.email && <p className="text-[10px] text-slate-400 ml-1">O e-mail não pode ser alterado após o preenchimento.</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CPF <span className="text-red-500">*</span></label>
                            <p className="text-xs text-slate-400">Usado para emissão de nota fiscal</p>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={profileForm.cpf}
                                    onChange={e => setProfileForm(p => ({ ...p, cpf: formatCPF(e.target.value) }))}
                                    readOnly={!!profile?.cpf}
                                    className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-800 font-medium focus:outline-none transition-all ${profile?.cpf ? 'opacity-60 cursor-not-allowed bg-slate-100 border-slate-200' : profileErrors.cpf ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                />
                            </div>
                            {profile?.cpf ? (
                                <p className="text-[10px] text-slate-400 ml-1">O CPF não pode ser alterado após o preenchimento.</p>
                            ) : profileErrors.cpf && (
                                <p className="text-[10px] text-red-500 font-bold ml-1">{profileErrors.cpf}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp <span className="text-red-500">*</span></label>
                            <p className="text-xs text-slate-400">Para receber alertas de leilão em tempo real</p>
                            <InternationalPhoneInput
                                value={profileForm.whatsapp}
                                onChange={val => setProfileForm(p => ({ ...p, whatsapp: val || "" }))}
                                error={profileErrors.whatsapp}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Foto do perfil</label>
                            <p className="text-xs text-slate-400">Insira a URL de uma imagem para o seu perfil</p>
                            <div className="relative">
                                <Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={profileForm.image || ""}
                                    onChange={e => setProfileForm(p => ({ ...p, image: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="https://exemplo.com/sua-foto.jpg"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                            >
                                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : profileSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {profileSuccess ? "Salvo!" : "Salvar alterações"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Alertas WhatsApp ─── */}
                {activeTab === "alertas" && (
                    <div className="space-y-4">
                        {/* Info card */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                            <Zap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-emerald-900">Como funcionam os alertas</p>
                                <p className="text-xs text-emerald-700 mt-0.5">Você recebe uma mensagem no WhatsApp assim que um leilão que corresponde aos seus critérios aparecer.</p>
                            </div>
                        </div>

                        {/* Alert list */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-slate-50">
                                <h2 className="font-black text-slate-900">Meus alertas</h2>
                                <button
                                    onClick={() => { setEditingAlertId(null); setAlertForm({ keywords: "", brand: "", model: "", version: "", color: "", minYear: "", maxYear: "", minPrice: "", maxPrice: "", category: "", location: "", notifyWhatsApp: true, notifyEmail: false }); setShowAlertForm(v => !v); }}
                                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-sm"
                                >
                                    <Plus className="w-4 h-4" /> Novo alerta
                                </button>
                            </div>

                            {/* New alert form */}
                            {showAlertForm && (
                                <div className="p-5 border-b border-slate-50 bg-slate-50 space-y-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {editingAlertId ? 'Editar alerta' : 'Novo alerta'}
                                    </p>

                                    {/* Keywords */}
                                    <input
                                        value={alertForm.keywords}
                                        onChange={e => setAlertForm(p => ({ ...p, keywords: e.target.value }))}
                                        placeholder="Palavras-chave (ex: Honda Civic, SUV, Toyota)"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all"
                                    />

                                    {/* Marca / Modelo via FIPE API */}
                                    <FipeSelector
                                        vehicleType="carros"
                                        brandValue={alertForm.brand}
                                        modelValue={alertForm.model}
                                        onBrandChange={v => setAlertForm(p => ({ ...p, brand: v }))}
                                        onModelChange={v => setAlertForm(p => ({ ...p, model: v }))}
                                    />

                                    {/* Versão */}
                                    <input value={alertForm.version} onChange={e => setAlertForm(p => ({ ...p, version: e.target.value }))} placeholder="Versão (ex: 1.0 EX, LX, Touring)" className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all" />

                                    {/* Cor / Localização */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <input value={alertForm.color} onChange={e => setAlertForm(p => ({ ...p, color: e.target.value }))} placeholder="Cor (ex: Prata)" className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                                        <input value={alertForm.location} onChange={e => setAlertForm(p => ({ ...p, location: e.target.value }))} placeholder="Localização (ex: SP)" className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                                    </div>

                                    {/* Preço min / max */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                                            <input value={alertForm.minPrice} onChange={e => setAlertForm(p => ({ ...p, minPrice: e.target.value }))} type="number" placeholder="Preço mínimo" className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                                            <input value={alertForm.maxPrice} onChange={e => setAlertForm(p => ({ ...p, maxPrice: e.target.value }))} type="number" placeholder="Preço máximo" className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                                        </div>
                                    </div>

                                    {/* Ano min / max */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <input value={alertForm.minYear} onChange={e => setAlertForm(p => ({ ...p, minYear: e.target.value }))} type="number" placeholder="Ano mínimo (ex: 2010)" className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                                        <input value={alertForm.maxYear} onChange={e => setAlertForm(p => ({ ...p, maxYear: e.target.value }))} type="number" placeholder="Ano máximo (ex: 2024)" className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                                    </div>

                                    {/* Canais de notificação */}
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Receber alerta via</p>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div
                                                onClick={() => setAlertForm(p => ({ ...p, notifyWhatsApp: !p.notifyWhatsApp }))}
                                                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${alertForm.notifyWhatsApp ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${alertForm.notifyWhatsApp ? 'translate-x-4' : ''}`} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">WhatsApp</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div
                                                onClick={() => setAlertForm(p => ({ ...p, notifyEmail: !p.notifyEmail }))}
                                                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${alertForm.notifyEmail ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${alertForm.notifyEmail ? 'translate-x-4' : ''}`} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">Email</span>
                                        </label>
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={handleCreateAlert}
                                            disabled={savingAlert || (!alertForm.keywords && !alertForm.brand && !alertForm.model)}
                                            className="flex items-center gap-2 bg-emerald-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl disabled:opacity-50 transition-all"
                                        >
                                            {savingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            {editingAlertId ? 'Salvar alterações' : 'Criar alerta'}
                                        </button>
                                        <button onClick={() => { setShowAlertForm(false); setEditingAlertId(null); }} className="text-slate-400 font-bold text-sm px-4 py-2.5 hover:text-slate-600 transition-colors">
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Alert items */}
                            {loadingAlerts ? (
                                <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                            ) : alerts.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium text-sm">Nenhum alerta criado ainda.</p>
                                    <p className="text-xs text-slate-300 mt-1">Crie seu primeiro alerta acima!</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-50">
                                    {alerts.map(alert => {
                                        const title = [alert.brand, alert.model, alert.version].filter(Boolean).join(' ') || alert.keywords || 'Alerta sem título';
                                        const tags = [
                                            alert.color && alert.color,
                                            alert.minYear && alert.maxYear ? `${alert.minYear}–${alert.maxYear}` : alert.minYear ? `A partir de ${alert.minYear}` : alert.maxYear ? `Até ${alert.maxYear}` : null,
                                            alert.minPrice && alert.maxPrice ? `R$ ${alert.minPrice.toLocaleString('pt-BR')}–${alert.maxPrice.toLocaleString('pt-BR')}` : alert.maxPrice ? `Até R$ ${alert.maxPrice.toLocaleString('pt-BR')}` : alert.minPrice ? `De R$ ${alert.minPrice.toLocaleString('pt-BR')}` : null,
                                            alert.location,
                                        ].filter(Boolean);
                                        return (
                                            <li key={alert._id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                                                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 text-sm truncate">{title}</p>
                                                    {tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {tags.map((t, i) => (
                                                                <span key={i} className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">{t}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {alert.notifyWhatsApp && <span className="text-[10px] text-emerald-600 font-bold">📱 WhatsApp</span>}
                                                        {alert.notifyEmail && <span className="text-[10px] text-blue-600 font-bold">✉️ Email</span>}
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 mt-1 ${alert.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {alert.active ? 'Ativo' : 'Pausado'}
                                                </span>
                                                <button onClick={() => handleDeleteAlert(alert._id)} className="text-slate-300 hover:text-red-400 transition-colors mt-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleEditAlert(alert)} className="text-slate-300 hover:text-emerald-500 transition-colors mt-1">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {!profile.whatsapp && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-amber-900">WhatsApp não configurado</p>
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        Configure seu WhatsApp na aba <strong>Minha Conta</strong> para receber alertas.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Favoritos ─── */}
                {activeTab === "favoritos" && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <h2 className="font-black text-slate-900 text-lg">Meus Favoritos</h2>
                                    <p className="text-xs text-slate-400">Lotes que você salvou para acompanhar</p>
                                </div>
                                {favorites.length > 0 && (
                                    <button
                                        onClick={handleClearAllFavorites}
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Limpar tudo
                                    </button>
                                )}
                            </div>

                            {loadingFavorites ? (
                                <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                            ) : favorites.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Heart className="w-8 h-8 text-pink-400" />
                                    </div>
                                    <p className="text-slate-500 font-bold">Nenhum favorito ainda</p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Salve lotes interessantes clicando no ícone de coração nos resultados da busca.</p>
                                    <button
                                        onClick={() => router.push('/search')}
                                        className="mt-6 text-emerald-500 text-sm font-black hover:underline"
                                    >
                                        Explorar leilões
                                    </button>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-50">
                                    {favorites.map(fav => (
                                        <li key={fav._id} className="p-4 hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                                    {fav.image ? (
                                                        <img
                                                            src={fav.image}
                                                            alt={fav.modelo}
                                                            className="w-full h-full object-cover"
                                                            referrerPolicy="no-referrer"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/f3f4f6/aaa?text=Lote';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                                            <Heart className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 text-sm truncate uppercase">
                                                        {fav.marca ? `${fav.marca} ${fav.modelo}` : `Lote ID: ${fav.lotId}`}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {fav.ano && <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded-full">{fav.ano}</span>}
                                                        <p className="text-[10px] text-slate-400">Adicionado em {new Date(fav.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDeleteFavorite(fav._id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                        title="Remover favorito"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/lots/${fav.auctionId || '0'}/${fav.lotId}`)}
                                                        className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── Notificações ─── */}
                {activeTab === "notificacoes" && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <h2 className="font-black text-slate-900 text-lg">Notificações</h2>
                                    <p className="text-xs text-slate-400">Histórico de alertas e atividades</p>
                                </div>
                            </div>

                            {loadingNotifications ? (
                                <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                            ) : notifications.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Bell className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <p className="text-slate-500 font-bold">Nenhuma notificação</p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Você será notificado aqui sobre leilões e mudanças na sua conta.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-50">
                                    {notifications.map(n => {
                                        const link = getLotDetailsUrl(n);
                                        const { isAlert, lotTitle, subtext } = getNotificationContent(n);

                                        return (
                                            <li
                                                key={n._id}
                                                className={`p-5 hover:bg-slate-50 transition-colors cursor-pointer group flex items-start gap-4 ${!n.read ? 'bg-emerald-50/30' : ''}`}
                                                onClick={() => {
                                                    if (!n.read) handleMarkAsRead(n._id);
                                                    if (link) {
                                                        if (link.startsWith('http')) {
                                                            window.open(link, '_blank');
                                                        } else {
                                                            router.push(link);
                                                        }
                                                    }
                                                }}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Bell className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className={`text-sm font-bold ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {new Date(n.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    {isAlert && lotTitle ? (
                                                        <div className="mt-1">
                                                            <p className="text-sm text-emerald-600 font-black hover:underline decoration-emerald-600/30 underline-offset-2">
                                                                {lotTitle}
                                                            </p>
                                                            {subtext && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{subtext}</p>}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                                    )}
                                                </div>
                                                {!n.read && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── Preferências ─── */}
                {activeTab === "preferencias" && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
                        <h2 className="text-lg font-black text-slate-900">Preferências de comunicação</h2>

                        <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50">
                            <div className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Promoções e Novidades</p>
                                    <p className="text-xs text-slate-400">Receba ofertas e novos recursos por email</p>
                                </div>
                                <div
                                    onClick={() => setPreferences(p => ({ ...p, receivePromotions: !p.receivePromotions }))}
                                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${preferences.receivePromotions ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences.receivePromotions ? 'translate-x-5' : ''}`} />
                                </div>
                            </div>

                            <div className="flex items-start justify-between p-4">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-slate-800">Notificar favoritos</p>
                                        <div className="group relative">
                                            <AlertCircle className="w-3.5 h-3.5 text-slate-300 cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl leading-relaxed">
                                                <p className="font-bold border-b border-white/10 pb-1 mb-1">Como funcionam os lembretes:</p>
                                                <ul className="list-disc pl-3 mt-1 space-y-1">
                                                    <li>Enviamos alertas 72h, 48h e 6h antes do início do leilão.</li>
                                                    <li>Você recebe por Email e WhatsApp.</li>
                                                    <li>Lotes expirados ou removidos não geram alertas.</li>
                                                    <li>Você pode desativar a qualquer momento aqui.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">Alertas automáticos 72h, 48h e 6h antes do leilão dos seus lotes salvos</p>
                                </div>
                                <div
                                    onClick={() => setPreferences(p => ({ ...p, notifyFavorites: !p.notifyFavorites }))}
                                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${preferences.notifyFavorites ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences.notifyFavorites ? 'translate-x-5' : ''}`} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleSavePrefs}
                                disabled={savingPrefs}
                                className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white font-bold px-6 py-3 rounded-2xl transition-all hover:bg-slate-800 disabled:opacity-50"
                            >
                                {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar preferências
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Faturamento ─── */}
                {activeTab === "faturamento" && (
                    <div className="space-y-4">
                        {/* Current plan */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <h2 className="text-lg font-black text-slate-900 mb-4">Plano atual</h2>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <Crown className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900">Plano Gratuito</p>
                                    <p className="text-xs text-slate-400">Acesso básico à plataforma</p>
                                </div>
                                <a
                                    href="/plans"
                                    className="ml-auto flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-sm"
                                >
                                    Fazer upgrade <ChevronRight className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        {/* Payment history */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-50">
                                <h2 className="font-black text-slate-900">Histórico de pagamentos</h2>
                            </div>

                            {loadingPayments ? (
                                <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                            ) : payments.length === 0 ? (
                                <div className="p-10 text-center">
                                    <CreditCard className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium text-sm">Nenhum pagamento encontrado.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-50">
                                                <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Plano</th>
                                                <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Valor</th>
                                                <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                                                <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Data</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {payments.map(p => (
                                                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-4 font-bold text-slate-800">{p.plan}</td>
                                                    <td className="px-5 py-4 text-slate-600">R$ {(p.amount / 100).toFixed(2)}</td>
                                                    <td className="px-5 py-4">
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${p.status === 'authorized' || p.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-400 text-xs">
                                                        {new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MinhaContaPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>}>
            <MinhaContaContent />
        </Suspense>
    );
}
