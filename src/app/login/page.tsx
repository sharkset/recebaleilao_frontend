"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/request-otp', { email });
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao enviar código');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        setLoading(true);
        setError('');
        try {
            const token = otp.join('');
            if (token.length < 6) {
                setError('Digite o código de 6 dígitos');
                return;
            }

            // Note: In NextAuth with custom backend, we'd sign in here.
            // For now, we simulate the logic: verify and redirect to plans.
            await api.post('/auth/verify-otp', { email, token });

            // Redirect to plans page after successful login
            router.push('/plans');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Código inválido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-8 md:p-12 relative overflow-hidden transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-2xl" />

                <button
                    onClick={() => step === 'otp' ? setStep('email') : router.push('/')}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors mb-8 text-sm font-medium group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {step === 'otp' ? 'Voltar para o email' : 'Voltar para o início'}
                </button>

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                        <span className="text-white font-black text-2xl">R</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                        {step === 'email' ? 'Comece agora gratuitamente' : 'Verifique seu email'}
                    </h1>
                    <p className="text-slate-500 whitespace-pre-line">
                        {step === 'email'
                            ? 'Acesse o mapa completo de oportunidades em leilões.'
                            : `Enviamos um código de 6 dígitos para\n ${email}`}
                    </p>
                </div>

                <div className="space-y-6">
                    {step === 'email' ? (
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Digite seu email"
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 text-slate-900"
                                />
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Continuar com Email'}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between gap-2">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { otpRefs.current[i] = el; }}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className="w-12 h-16 text-center text-2xl font-bold bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleVerifyOtp}
                                disabled={loading || otp.some(d => !d)}
                                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verificar Código'}
                            </button>

                            <p className="text-center text-sm text-slate-400">
                                Não recebeu? <button onClick={handleEmailSubmit} className="text-emerald-600 font-bold hover:underline">Reenviar</button>
                            </p>
                        </div>
                    )}

                    {error && <p className="text-red-500 text-center text-sm font-medium">{error}</p>}

                    {step === 'email' && (
                        <>
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">ou</span>
                                </div>
                            </div>

                            <button
                                onClick={() => signIn("google", { callbackUrl: "/search" })}
                                className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                Continuar com Google
                            </button>
                        </>
                    )}
                </div>

                <p className="mt-10 text-center text-xs text-slate-400 leading-relaxed px-4">
                    Ao continuar, você aceita nossos
                    <a href="#" className="text-slate-600 font-bold hover:underline ml-1">Termos</a> e
                    <a href="#" className="text-slate-600 font-bold hover:underline ml-1">Privacidade</a>.
                </p>
            </div>
        </div>
    );
}
