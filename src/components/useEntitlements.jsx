import { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@/api/entities';

export function useEntitlements() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [entitlements, setEntitlements] = useState({
        plan: 'Free',
        status: 'inactive',
        canGenerate: false,
        canExport: false
    });
    const pollingRef = useRef(null);

    const updateEntitlements = useCallback((userData) => {
        const plan = userData?.plan || 'Free';
        const status = userData?.status || 'inactive';
        const isPro = plan === 'Pro' && status === 'active';
        
        setEntitlements({
            plan,
            status,
            canGenerate: isPro,
            canExport: isPro
        });
    }, []);

    const fetchUser = useCallback(async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            updateEntitlements(currentUser);
            return currentUser;
        } catch (error) {
            console.log('User not authenticated');
            setUser(null);
            updateEntitlements(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [updateEntitlements]);

    const startPolling = useCallback(() => {
        // Poll for user updates every 10 seconds for 5 minutes after PayPal redirect
        let pollCount = 0;
        const maxPolls = 30; // 5 minutes at 10-second intervals

        pollingRef.current = setInterval(async () => {
            pollCount++;
            const userData = await fetchUser();
            
            // Stop polling if user becomes Pro or we've reached max polls
            if ((userData?.plan === 'Pro' && userData?.status === 'active') || pollCount >= maxPolls) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        }, 10000);
    }, [fetchUser]);

    useEffect(() => {
        fetchUser();

        // Check if we're returning from PayPal (look for success indicators in URL)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('paypal_success') || urlParams.get('subscription_id')) {
            startPolling();
        }

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, [fetchUser, startPolling]);

    return {
        user,
        loading,
        entitlements,
        isPro: entitlements.canGenerate, // Backward compatibility
        plan: entitlements.plan,
        status: entitlements.status,
        refreshUser: fetchUser
    };
}