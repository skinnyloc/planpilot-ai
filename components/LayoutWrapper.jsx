"use client";

import MainLayout from './MainLayout';


export default function LayoutWrapper({ children }) {
  // NO AUTHENTICATION - EVERYONE CAN ACCESS THE SITE
  return <MainLayout>{children}</MainLayout>;
}