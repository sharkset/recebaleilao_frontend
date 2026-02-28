"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { Loader2, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();

    const sendCode = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true); setError('');
        try {
            await api.post('/auth/request-otp', { email });
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao enviar o código');
        } finally { setLoading(false); }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const n = [...otp]; n[index] = value.slice(-1); setOtp(n);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0)
            otpRefs.current[index - 1]?.focus();
    };

    const handleVerify = async () => {
        const token = otp.join('');
        if (token.length < 6) { setError('Digite o código completo'); return; }
        setLoading(true); setError('');
        try {
            const result = await signIn('email-otp', { email, token, redirect: false });
            if (result?.error) { setError('Código inválido ou expirado.'); return; }
            router.push('/minha-conta'); router.refresh();
        } catch { setError('Erro interno.'); }
        finally { setLoading(false); }
    };

    /* ─── Shared input style ─── */
    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 12px',
        background: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: 4,
        fontSize: 14,
        color: '#111827',
        outline: 'none',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    };

    const btnPrimary: React.CSSProperties = {
        width: '100%',
        padding: '10px 16px',
        background: '#16a34a',
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    };

    return (
        <div style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            background: '#e8e4db',
        }}>
            {/* ══ LEFT PANEL ══════════════════════════════════════════════ */}
            <div style={{
                width: '50%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',         /* clips OTP inputs from leaking */
                background: '#e8e4db',
                padding: '32px 56px',
                boxSizing: 'border-box',
            }}>
                {/* Logo */}
                <Link href="/" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                    flexShrink: 0,
                }}>
                    <span style={{
                        width: 20, height: 20,
                        background: '#16a34a',
                        borderRadius: 3,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 900, fontSize: 11,
                    }}>R</span>
                    RecebaLeilão
                </Link>

                {/* Spacer — pushes form to ~28% from top (like Retool) */}
                <div style={{ height: '18%', flexShrink: 0 }} />

                {/* Form block — max 320px, normal flow */}
                <div style={{ maxWidth: 320, flexShrink: 0 }}>
                    {step === 'email' ? (
                        <>
                            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1.2, marginBottom: 24, marginTop: 0 }}>
                                Bem-vindo de volta.<br />
                                <span style={{ color: '#6b7280' }}>Entre na sua conta abaixo.</span>
                            </h1>

                            {/* Google */}
                            <button
                                onClick={() => signIn("google", { callbackUrl: "/minha-conta" })}
                                style={{
                                    ...inputStyle,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    cursor: 'pointer', color: '#374151', fontWeight: 500,
                                    marginBottom: 16,
                                }}
                            >
                                <img src="https://www.google.com/favicon.ico" alt="" style={{ width: 16, height: 16 }} />
                                Entrar com Google
                            </button>

                            {/* OR */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.12)' }} />
                                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ou</span>
                                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.12)' }} />
                            </div>

                            {/* Email + button */}
                            <form onSubmit={sendCode} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input
                                    type="email" required autoFocus
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="nome@empresa.com"
                                    style={inputStyle}
                                />
                                <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
                                    {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : 'Enviar código de acesso'}
                                </button>
                            </form>

                            {error && <p style={{ marginTop: 8, color: '#ef4444', fontSize: 12 }}>{error}</p>}
                        </>
                    ) : (
                        <>
                            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1.2, marginBottom: 8, marginTop: 0 }}>
                                Verifique seu email.
                            </h1>
                            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                                Código enviado para <strong style={{ color: '#374151' }}>{email}</strong>
                            </p>

                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i} ref={el => { otpRefs.current[i] = el; }}
                                        type="text" inputMode="numeric" maxLength={1}
                                        value={digit} autoFocus={i === 0}
                                        onChange={e => handleOtpChange(i, e.target.value)}
                                        onKeyDown={e => handleKeyDown(i, e)}
                                        style={{
                                            flex: '0 0 42px', width: 42, height: 48,
                                            textAlign: 'center', fontSize: 20, fontWeight: 700,
                                            background: '#fff', border: '1px solid #d1d5db', borderRadius: 4,
                                            outline: 'none', color: '#111827',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                        }}
                                    />
                                ))}
                            </div>

                            <button onClick={handleVerify} disabled={loading || otp.some(d => !d)} style={{ ...btnPrimary, opacity: (loading || otp.some(d => !d)) ? 0.5 : 1, marginBottom: 12 }}>
                                {loading ? <Loader2 style={{ width: 16, height: 16 }} /> : <><CheckCircle style={{ width: 14, height: 14 }} /> Verificar e entrar</>}
                            </button>

                            {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>{error}</p>}

                            <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                                <button onClick={() => sendCode()} style={{ color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Reenviar</button>
                                <span style={{ color: '#d1d5db' }}>·</span>
                                <button onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(''); }} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Outro email</button>
                            </div>
                        </>
                    )}
                </div>

                {/* Legal — pushed to bottom */}
                <div style={{ marginTop: 'auto' }}>
                    <p style={{ fontSize: 11, color: '#16a34a', marginBottom: 4 }}>
                        <a href="mailto:suporte@recebaleilao.com.br" style={{ color: 'inherit' }}>Precisa de ajuda? Fale conosco</a>
                    </p>
                    <p style={{ fontSize: 11, color: '#9ca3af' }}>
                        Ao continuar, você concorda com nossa{' '}
                        <a href="#" style={{ color: '#9ca3af' }}>Política de Privacidade</a>.
                    </p>
                </div>
            </div>

            {/* ══ RIGHT PANEL — hidden on mobile ══════════════════════════ */}
            <div style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column' }}
                className="hidden lg:flex">
                {/* Door image — top 63% */}
                <div style={{ height: '63%', overflow: 'hidden' }}>
                    <img src="/login-door.jpg" alt="Acesso" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                </div>
                {/* Trust logos — white, bottom 37% */}
                <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 48px' }}>
                    <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>
                        Leiloeiros na plataforma
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 32px' }}>
                        {['PICELLI', 'SANTANDER', 'BRADESCO', 'SODRÉ SANTORO', 'FINAUTO', 'ZUCATO'].map(b => (
                            <span key={b} style={{ color: '#9ca3af', fontSize: 13, fontWeight: 700 }}>{b}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
