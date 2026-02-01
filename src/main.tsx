import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

import AppProviders from './components/layout/AppProviders';

// Layout
import MainLayout from './layouts/MainLayout';

import ScrollToTop from './components/layout/ScrollToTop';
import PageLoader from './components/ui/PageLoader';

// Pages - Eager loading for Home (LCP)
import HomePage from './pages/HomePage';

// Pages - Lazy loading for others
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminAffiliatesPage = lazy(() => import('./pages/admin/AffiliatesPage'));
const AffiliateDashboardPage = lazy(() => import('./pages/affiliate/DashboardPage'));
import ProtectedRoute from './components/ProtectedRoute';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProviders>
        <ScrollToTop />
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/produto/:slug" element={
              <Suspense fallback={<PageLoader />}>
                <ProductPage />
              </Suspense>
            } />
            <Route path="/categoria/:slug" element={
              <Suspense fallback={<PageLoader />}>
                <CategoryPage />
              </Suspense>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <DashboardPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <Suspense fallback={<PageLoader />}>
                <CheckoutPage />
              </Suspense>
            } />
            <Route path="/404" element={
              <Suspense fallback={<PageLoader />}>
                <NotFoundPage />
              </Suspense>
            } />
            <Route path="*" element={
              <Suspense fallback={<PageLoader />}>
                <NotFoundPage />
              </Suspense>
            } />

            {/* Affiliate System */}
            <Route path="/admin/afiliados" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <AdminAffiliatesPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/painel-parceiro" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <AffiliateDashboardPage />
                </Suspense>
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AppProviders>
    </BrowserRouter>
  </StrictMode>
)

