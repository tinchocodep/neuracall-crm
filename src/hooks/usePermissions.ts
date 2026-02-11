import { useAuth } from '../contexts/AuthContext';

export function usePermissions() {
    const { profile } = useAuth();

    const isFounder = profile?.email === 'tinchocabrera100@gmail.com';
    const isCofounder = profile?.email === 'bautistadiaz93@gmail.com';
    const isAdmin = profile?.role === 'admin';
    const isSupervisor = profile?.role === 'supervisor';
    const isRegularUser = profile?.role === 'member';

    return {
        // Role checks
        isFounder,
        isCofounder,
        isAdmin,
        isSupervisor,
        isRegularUser,

        // Permission checks
        canViewFinancials: isFounder || isCofounder || isAdmin || isSupervisor,
        canViewOwnEarnings: true, // Everyone can see their own earnings
        canViewAllEarnings: isFounder, // Only founder sees all earnings
        canViewTreasury: isFounder || isCofounder || isAdmin || isSupervisor,
        canViewExpenses: isFounder || isCofounder || isAdmin || isSupervisor,
        canManageUsers: isFounder || isAdmin,
        canViewAllClients: isFounder || isCofounder || isAdmin || isSupervisor,
        canViewOwnClients: true,
        canView360: isFounder, // Only founder sees 360 view
        canEditSettings: isFounder || isAdmin,

        // Founder-specific permissions
        canViewFounderEarnings: isFounder,
        canHideFounderData: isFounder,
    };
}
