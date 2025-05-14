import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import { EventProvider } from './context/EventContext.jsx'
import { UploadProvider } from './context/UploadContext.jsx'
import AppLayout from './components/AppLayout'
import EventSearchPage from './pages/EventSearchPage'
import EventDetailsPage from './pages/EventDetailsPage'
import ImageSelectionPage from './pages/ImageSelectionPage'
import CropAndOrderPage from './pages/CropAndOrderPage'
import CaptionSelectionPage from './pages/CaptionSelectionPage'
import PreviewPage from './pages/PreviewPage'
import AboutPage from './pages/AboutPage'
import GlowDemo from './pages/GlowDemo'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UploadProvider>
      <EventProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              {/* Home route - EventSearchPage */}
              <Route index element={<EventSearchPage />} />
              
              {/* Add routes for other pages */}
              <Route path="events" element={<EventSearchPage />} />
              <Route path="events/:id" element={<EventDetailsPage />} />
              <Route path="image-selection" element={<ImageSelectionPage />} />
              <Route path="crop-and-order" element={<CropAndOrderPage />} />
              <Route path="caption-selection" element={<CaptionSelectionPage />} />
              <Route path="preview" element={<PreviewPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="demo" element={<GlowDemo />} />
              
              {/* Catch-all route redirects to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </EventProvider>
    </UploadProvider>
  </React.StrictMode>
) 