"use client";

import { useState } from 'react';
import api from '@/lib/api';
import { Bell, CheckCircle, Loader2, Lock } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';

export default function WatcherPage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        phoneNumber: '',
        marca: '',
        modelo: '',
        ano: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            await api.post('/watchers', {
                phoneNumber: formData.phoneNumber,
                filters: {
                    marca: formData.marca,
                    modelo: formData.modelo,
                    ano: formData.ano
                }
            });
            setSuccess(true);
            setFormData({ phoneNumber: '', marca: '', modelo: '', ano: '' });
        } catch (error) {
            console.error('Error creating watcher:', error);
            alert('Erro ao criar alerta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-20 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-6">
                    <Lock className="h-8 w-8 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Você precisa estar logado para criar e gerenciar alertas de leilão via WhatsApp.
                </p>
                <button
                    onClick={() => signIn('google')}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition-all"
                >
                    Entrar com Google
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <div className="text-center mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4">
                    <Bell className="h-6 w-6 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Criar Alerta de Leilão</h1>
                <p className="mt-2 text-gray-600">
                    Receba notificações no WhatsApp assim que encontrarmos um veículo com as características que você procura.
                </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                {success ? (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Alerta Criado!</h3>
                        <p className="text-gray-500 mt-2">Você será notificado assim que encontrarmos correspondências.</p>
                        <button
                            onClick={() => setSuccess(false)}
                            className="mt-6 text-emerald-600 font-medium hover:underline"
                        >
                            Criar novo alerta
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                                WhatsApp (DDD + Número)
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                id="phoneNumber"
                                required
                                placeholder="Ex: 11999999999"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label htmlFor="marca" className="block text-sm font-medium text-gray-700">
                                    Marca
                                </label>
                                <select
                                    name="marca"
                                    id="marca"
                                    value={formData.marca}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">Qualquer</option>
                                    <option value="FIAT">Fiat</option>
                                    <option value="HONDA">Honda</option>
                                    <option value="CHEVROLET">Chevrolet</option>
                                    <option value="VOLKSWAGEN">Volkswagen</option>
                                    <option value="TOYOTA">Toyota</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">
                                    Modelo (Opcional)
                                </label>
                                <input
                                    type="text"
                                    name="modelo"
                                    id="modelo"
                                    placeholder="Ex: Onix"
                                    value={formData.modelo}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="ano" className="block text-sm font-medium text-gray-700">
                                Ano Mínimo
                            </label>
                            <input
                                type="number"
                                name="ano"
                                id="ano"
                                placeholder="Ex: 2020"
                                value={formData.ano}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar Alerta'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
