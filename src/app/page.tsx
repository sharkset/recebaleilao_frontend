"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, Bell, CheckCircle, Search, Shield, Zap } from "lucide-react";

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-50/50 via-transparent to-transparent -z-10" />

        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-fade-in">
            <Zap className="w-4 h-4 fill-emerald-500" />
            Mais de 15.000 leilões monitorados em tempo real
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Encontre o seu próximo <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              veículo de leilão
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            A plataforma mais completa para encontrar, filtrar e receber alertas dos melhores leilões do Brasil. Economize até 40% na tabela FIPE.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/search"
              className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-500 hover:scale-105 transition-all flex items-center gap-2"
            >
              Começar a buscar agora
              <ArrowRight className="w-5 h-5" />
            </Link>
            {!session && (
              <Link
                href="/login"
                className="bg-white text-slate-700 px-10 py-4 rounded-2xl font-bold text-lg border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Criar conta gratuita
              </Link>
            )}
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-slate-400 grayscale opacity-70">
            {/* Parceiros/Logos fake ou reais futuramente */}
            <span className="font-bold text-xl tracking-tighter italic">PICELLI</span>
            <span className="font-bold text-xl tracking-tighter italic">SANTANDER</span>
            <span className="font-bold text-xl tracking-tighter italic">BRADESCO</span>
            <span className="font-bold text-xl tracking-tighter italic">SODRE SANTORO</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Por que usar o Receba Leilão?</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Tudo o que você precisa para tomar a melhor decisão de compra em um só lugar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Search className="w-7 h-7" />}
              title="Filtros Inteligentes"
              description="Filtre por marca, modelo, ano, estado e até mesmo pelo valor estimado da tabela FIPE."
            />
            <FeatureCard
              icon={<Bell className="w-7 h-7" />}
              title="Alertas via WhatsApp"
              description="Receba avisos instantâneos sempre que um veículo que você procura entrar em leilão."
            />
            <FeatureCard
              icon={<Shield className="w-7 h-7" />}
              title="Dados Consolidados"
              description="Acessamos centenas de leiloeiros oficiais para garantir que você não perca nenhuma oportunidade."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-900 text-white overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para encontrar sua próxima oportunidade?</h2>
          <p className="text-emerald-100 mb-10 text-lg max-w-xl mx-auto">Junte-se a milhares de compradores que já estão economizando com nossa plataforma.</p>
          <Link
            href="/search"
            className="inline-block bg-white text-emerald-900 px-12 py-4 rounded-2xl font-bold text-xl shadow-2xl hover:bg-emerald-50 transition-all hover:scale-105"
          >
            Ver Leilões Agora
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-800 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
