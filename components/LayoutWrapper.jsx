"use client";

import MainLayout from './MainLayout';
import { AuthProvider } from '@/lib/context/AuthContext';

export default function LayoutWrapper({ children }) {
  return (
    <AuthProvider>
      <MainLayout>{children}</MainLayout>
    </AuthProvider>
  );
}