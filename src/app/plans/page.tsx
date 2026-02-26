"use client";

import { useState } from "react";
import { CheckCircle, ShieldCheck, Zap, Laptop, Calendar, MessageSquare, CreditCard, QrCode, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import api from "@/lib/api";

export default function PlansPage() {
    const { data: session } = useSession();
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'mp'>('pix');
    const [selectedPlan, setSelectedPlan] = useState('30_days');
    const [loading, setLoading] = useState(false);

    const plans = [
        { id: '7_days', title: 'Plano + 7 dias', desc: '7 dias de acesso', price: 39.9, oldPrice: 'R$ 79,80', discount: '50% OFF' },
        { id: '30_days', title: 'Plano + 30 dias', desc: '30 dias de acesso', price: 74.9, oldPrice: 'R$ 149,80', discount: '50% OFF', recommended: true },
        { id: '90_days', title: 'Plano + 90 dias', desc: '90 dias de acesso', price: 189.7, oldPrice: 'R$ 379,40', discount: '50% OFF' },
        { id: '365_days', title: 'Plano + 365 dias', desc: '365 dias de acesso', price: 499.7, oldPrice: 'R$ 999,40', discount: '50% OFF' },
    ];

    const handleCheckout = async () => {
        if (!session?.user) {
            window.location.href = '/login';
            return;
        }

        setLoading(true);
        try {
            const plan = plans.find(p => p.id === selectedPlan);
            const response = await api.post('/payments/checkout', {
                userId: (session.user as any).id, // Ensuring we get the ID
                planId: selectedPlan,
                title: plan?.title,
                price: plan?.price
            });

            if (response.data.initPoint) {
                window.location.href = response.data.initPoint;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Erro ao iniciar pagamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header / Tabs */}
            <div className="container mx-auto px-4 pt-12 text-center">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Escolha Seu Plano</h1>
                <p className="text-slate-500 mb-10">Teste grátis por 7 dias. Sem compromisso, cancele quando quiser.</p>

                <div className="max-w-xl mx-auto flex bg-slate-100 p-1 rounded-2xl mb-12">
                    <button
                        onClick={() => setPaymentMethod('pix')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${paymentMethod === 'pix' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <QrCode className="w-5 h-5" />
                        Pix
                    </button>
                    <button
                        onClick={() => setPaymentMethod('mp')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${paymentMethod === 'mp' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CreditCard className="w-5 h-5" />
                        Mercado Pago
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full ml-1 font-black">7 dias grátis</span>
                    </button>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagamento Único</h2>
                    <p className="text-sm text-slate-400">Acesso completo: Leiloeiros, Filtros Avançados, WhatsApp, Calendário e Suporte</p>
                </div>

                {/* Plans List */}
                <div className="max-w-2xl mx-auto space-y-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`relative flex items-center justify-between p-6 border-2 rounded-3xl cursor-pointer transition-all ${selectedPlan === plan.id ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 hover:border-emerald-200 bg-slate-50/50'}`}
                        >
                            <div className="flex items-center gap-4 text-left">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlan === plan.id ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                                    {selectedPlan === plan.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-slate-800 text-lg">{plan.title}</h3>
                                        {plan.recommended && (
                                            <span className="bg-emerald-500 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-wider">Recomendado</span>
                                        )}
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">{plan.desc}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end mb-1">
                                    <span className="text-slate-300 line-through text-xs font-bold">{plan.oldPrice}</span>
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-lg font-black">{plan.discount}</span>
                                </div>
                                <div className="flex items-baseline gap-1 justify-end">
                                    <span className="text-slate-900 text-2xl font-black">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pagamento Único</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="max-w-2xl mx-auto mt-10">
                    <div className="flex bg-white border border-slate-100 rounded-2xl p-2 mb-6">
                        <input
                            type="text"
                            placeholder="Cupom de desconto"
                            className="flex-1 px-4 py-2 bg-transparent outline-none text-slate-600 font-medium"
                        />
                        <button className="px-6 py-2 text-slate-500 font-bold hover:text-emerald-600 transition-colors">Aplicar</button>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full bg-emerald-500 text-white py-5 rounded-3xl font-black text-xl shadow-2xl shadow-emerald-200 hover:bg-emerald-400 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Continuar para Pagamento'}
                        <CheckCircle className="w-6 h-6" />
                    </button>

                    <div className="mt-8 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                            <ShieldCheck className="w-5 h-5" />
                            Pagamento 100% Seguro e Criptografado
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium max-w-sm">
                            Purplebrick Tecnologia LTDA - CNPJ: 48.406.827/0001-26
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
