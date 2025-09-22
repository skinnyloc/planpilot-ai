import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

export function useEntitlements() {
    const { user: clerkUser, isLoaded } = useUser();
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
        // Check for demo mode first
        if (typeof window !== 'undefined') {
            const demoPlan = localStorage.getItem('demo_user_plan');
            const demoStatus = localStorage.getItem('demo_user_status');
            const demoPaidFeatures = localStorage.getItem('demo_paid_features');

            if (demoPlan || demoStatus || demoPaidFeatures) {
                const isDemoProUser = (demoPlan === 'pro' && demoStatus === 'active') || demoPaidFeatures === 'true';

                setEntitlements({
                    plan: isDemoProUser ? 'Pro' : 'Free',
                    status: isDemoProUser ? 'active' : 'inactive',
                    canGenerate: isDemoProUser,
                    canExport: isDemoProUser
                });
                return;
            }
        }

        // Production mode - use actual user data
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
            // Wait for Clerk to load
            if (!isLoaded) {
                return null;
            }

            // In demo mode, don't try to fetch from Supabase - just use demo data
            if (typeof window !== 'undefined') {
                const demoPlan = localStorage.getItem('demo_user_plan');
                const demoStatus = localStorage.getItem('demo_user_status');
                const demoPaidFeatures = localStorage.getItem('demo_paid_features');

                if (demoPlan || demoStatus || demoPaidFeatures) {
                    const demoUser = {
                        plan: demoPlan === 'pro' || demoPaidFeatures === 'true' ? 'Pro' : 'Free',
                        status: demoStatus === 'active' || demoPaidFeatures === 'true' ? 'active' : 'inactive',
                        demo: true
                    };
                    setUser(demoUser);
                    updateEntitlements(demoUser);
                    return demoUser;
                }
            }

            // If user is not signed in with Clerk, return null
            if (!clerkUser) {
                setUser(null);
                updateEntitlements(null);
                return null;
            }

            // Production mode - use Clerk user data with Supabase integration
            // For now, we'll create a basic user object from Clerk data
            // In the future, you can integrate with Supabase to store user plans/subscriptions
            const userData = {
                id: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                plan: 'Free', // Default plan - can be updated from Supabase
                status: 'inactive', // Default status - can be updated from Supabase
                clerk: true
            };

            setUser(userData);
            updateEntitlements(userData);
            return userData;
        } catch (error) {
            console.log('User fetch failed:', error.message);
            setUser(null);
            updateEntitlements(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [clerkUser, isLoaded, updateEntitlements]);

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
        // Only fetch user when Clerk has loaded
        if (isLoaded) {
            fetchUser();
        }

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
    }, [isLoaded, fetchUser, startPolling]);

    return {
        user,
        loading: loading || !isLoaded,
        entitlements,
        isPro: entitlements.canGenerate, // Backward compatibility
        plan: entitlements.plan,
        status: entitlements.status,
        refreshUser: fetchUser
    };
}