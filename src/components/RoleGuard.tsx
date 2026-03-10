import React from 'react';
import { useRole } from '../hooks/useRole';

interface RoleGuardProps {
    allowedRoles: ('common' | 'pro' | 'affiliate' | 'admin')[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Component to conditionally render children based on user roles.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, fallback = null }) => {
    const { hasRole } = useRole();

    if (!hasRole(allowedRoles)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
