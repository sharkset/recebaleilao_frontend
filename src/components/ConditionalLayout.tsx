"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthRoute = AUTH_ROUTES.some(r => pathname?.startsWith(r));

    if (isAuthRoute) {
        return <>{children}</>;
    }

    return (
        <>
            <Suspense fallback={<div className="h-20 bg-white border-b border-slate-100" />}>
                <Header />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Footer />
        </>
    );
}
