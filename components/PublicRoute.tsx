import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../services/storeContext';
import { UserRole } from '../types';

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useStore();

    if (user) {
        if (user.role === UserRole.PRODUCER) {
            return <Navigate to="/producer/dashboard" replace />;
        }
        // Default for Client or Admin
        return <Navigate to="/market/producers" replace />;
    }

    return <>{children}</>;
};
