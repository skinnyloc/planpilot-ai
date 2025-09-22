import { useState, useEffect } from 'react';
import { useUser as useClerkUser } from '@clerk/nextjs';

/**
 * User hook for business ideas integration
 * Uses Clerk authentication instead of base44
 */
export function useUser() {
  const { isLoaded, isSignedIn, user: clerkUser } = useClerkUser();
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // Wait for Clerk to load
        if (!isLoaded) {
          return;
        }

        // Check for demo mode first
        if (typeof window !== 'undefined') {
          const demoPlan = localStorage.getItem('demo_user_plan');
          const demoStatus = localStorage.getItem('demo_user_status');
          const demoPaidFeatures = localStorage.getItem('demo_paid_features');

          if (demoPlan || demoStatus || demoPaidFeatures) {
            // In demo mode, use a fixed demo user ID
            const demoUserId = 'demo-user-123';
            const demoUser = {
              id: demoUserId,
              email: 'demo@example.com',
              username: 'demo-user',
              plan: demoPlan === 'pro' || demoPaidFeatures === 'true' ? 'Pro' : 'Free',
              status: demoStatus === 'active' || demoPaidFeatures === 'true' ? 'active' : 'inactive',
              demo: true
            };

            setUser(demoUser);
            setUserId(demoUserId);
            setLoading(false);
            return;
          }
        }

        // Use Clerk authentication
        if (isSignedIn && clerkUser) {
          const userData = {
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress,
            username: clerkUser.username || clerkUser.firstName || 'User',
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            plan: 'Free', // Default plan, can be upgraded
            status: 'active',
            demo: false
          };

          setUser(userData);
          setUserId(clerkUser.id);
        } else {
          // Fallback to demo mode if not signed in
          const fallbackUserId = 'demo-user-fallback';
          const fallbackUser = {
            id: fallbackUserId,
            email: 'demo@example.com',
            username: 'demo-user',
            plan: 'Free',
            status: 'active',
            demo: true,
            fallback: true
          };
          setUser(fallbackUser);
          setUserId(fallbackUserId);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err.message);
        setUser(null);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isLoaded, isSignedIn, clerkUser]);

  return {
    user,
    userId,
    loading,
    error,
    isAuthenticated: !!userId,
    isDemo: user?.demo === true,
    isClerkAuthenticated: isSignedIn
  };
}