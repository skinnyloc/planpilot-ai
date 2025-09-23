import { auth, clerkClient } from '@clerk/nextjs/server';

export async function isAdmin(userId = null) {
  try {
    const { userId: currentUserId } = auth();
    const userIdToCheck = userId || currentUserId;

    if (!userIdToCheck) {
      return false;
    }

    const user = await clerkClient.users.getUser(userIdToCheck);
    const adminEmail = process.env.ADMIN_EMAIL;

    return user.emailAddresses.some(email =>
      email.emailAddress === adminEmail && email.verification?.status === 'verified'
    );
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

export async function requireAdmin() {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Authentication required');
  }

  const isUserAdmin = await isAdmin(userId);

  if (!isUserAdmin) {
    throw new Error('Admin access required');
  }

  return userId;
}