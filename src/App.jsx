import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { Toaster } from "@/components/ui/toaster"
import RootLayout from "../app/layout.jsx"

// Import all pages
import HomePage from "../app/page.jsx"
import DashboardPage from "../app/dashboard/page.jsx"
import BusinessIdeaPage from "../app/business-idea/page.jsx"
import BusinessPlansPage from "../app/business-plans/page.jsx"
import GrantsPage from "../app/grants/page.jsx"
import GrantProposalsPage from "../app/grant-proposals/page.jsx"
import CreditGuidePage from "../app/credit-guide/page.jsx"
// import DocumentsPage from "../app/documents/page.jsx" // Temporarily disabled
import PricingPage from "../app/pricing/page.jsx"
import ProfilePage from "../app/profile/page.jsx"
import TestPage from "../app/test/page.jsx"
import DebugPage from "../app/debug/page.jsx"
import PaymentSuccessPage from "../app/payment/success/page.jsx"

// Import authentication pages
import SignInPage from "../app/sign-in/page.jsx"
import SignUpPage from "../app/sign-up/page.jsx"

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>
        <RootLayout>
          {children}
        </RootLayout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

// Public Route Wrapper (for auth pages)
function PublicRoute({ children }) {
  return (
    <>
      <SignedOut>
        {children}
      </SignedOut>
      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>
    </>
  )
}

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public authentication routes */}
          <Route path="/sign-in" element={
            <PublicRoute>
              <SignInPage />
            </PublicRoute>
          } />
          <Route path="/sign-up" element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          } />
          {/* Public pages - anyone can view */}
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/debug" element={<DebugPage />} />

          {/* Protected routes - require authentication */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/business-idea" element={
            <ProtectedRoute>
              <BusinessIdeaPage />
            </ProtectedRoute>
          } />
          <Route path="/business-plans" element={
            <ProtectedRoute>
              <BusinessPlansPage />
            </ProtectedRoute>
          } />
          <Route path="/grants" element={
            <ProtectedRoute>
              <GrantsPage />
            </ProtectedRoute>
          } />
          <Route path="/grant-proposals" element={
            <ProtectedRoute>
              <GrantProposalsPage />
            </ProtectedRoute>
          } />
          <Route path="/credit-guide" element={
            <ProtectedRoute>
              <CreditGuidePage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
      <Toaster />
    </>
  )
}

export default App 