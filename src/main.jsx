import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import { EventProvider } from './context/EventContext.jsx'
import { UploadProvider } from './context/UploadContext.jsx'
import { AnalyticsProvider } from './context/AnalyticsContext'
import AppLayout from './components/AppLayout'
import AuthPage from './pages/AuthPage'
import EventSearchPage from './pages/EventSearchPage'
import EventDetailsPage from './pages/EventDetailsPage'
import ImageSelectionPage from './pages/ImageSelectionPage'
import CropAndOrderPage from './pages/CropAndOrderPage'
import CaptionSelectionPage from './pages/CaptionSelectionPage'
import PreviewPage from './pages/PreviewPage'
import AboutPage from './pages/AboutPage'
import InstagramConnect from './components/instagram/InstagramConnect'
import InstagramAuthCallback from './pages/InstagramAuthCallback'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AnalyticsDashboard from './pages/AnalyticsDashboard'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UploadProvider>
      <EventProvider>
        <AnalyticsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                {/* Public routes */}
                <Route index element={<EventSearchPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="login" element={<AuthPage />} />
                <Route path="signup" element={<AuthPage />} />
                <Route path="instagram/auth" element={<InstagramAuthCallback />} />
                
                {/* Protected routes */}
                <Route path="analytics" element={
                  <ProtectedRoute>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                } />
                <Route path="events" element={
                  <ProtectedRoute>
                    <EventSearchPage />
                  </ProtectedRoute>
                } />
                <Route path="events/:id" element={
                  <ProtectedRoute>
                    <EventDetailsPage />
                  </ProtectedRoute>
                } />
                <Route path="image-selection" element={
                  <ProtectedRoute>
                    <ImageSelectionPage />
                  </ProtectedRoute>
                } />
                <Route path="crop-and-order" element={
                  <ProtectedRoute>
                    <CropAndOrderPage />
                  </ProtectedRoute>
                } />
                <Route path="caption-selection" element={
                  <ProtectedRoute>
                    <CaptionSelectionPage />
                  </ProtectedRoute>
                } />
                <Route path="preview" element={
                  <ProtectedRoute>
                    <PreviewPage />
                  </ProtectedRoute>
                } />
                <Route path="instagram/connect" element={
                  <ProtectedRoute>
                    <InstagramConnect />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all route redirects to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AnalyticsProvider>
      </EventProvider>
    </UploadProvider>
  </React.StrictMode>
) 