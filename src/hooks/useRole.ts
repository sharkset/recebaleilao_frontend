import { useSession } from 'next-auth/react';

export const useRole = () => {
    const { data: session } = useSession();

    const role = (session?.user as any)?.role || 'common';

    const isPro = role === 'pro' || role === 'admin';
    const isAdmin = role === 'admin';
    const isAffiliate = role === 'affiliate' || role === 'admin';

    const hasRole = (allowedRoles: string[]) => {
        return allowedRoles.includes(role);
    };

    return {
        role,
        isPro,
        isAdmin,
        isAffiliate,
        hasRole
    };
};
