import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Navbar from './components/navbar'
import Season from './pages/Season'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import { useSeason } from './context/SeasonContext'

// Code splitting for better performance
const Candidates = lazy(() => import('./pages/Candidates'))
const MatchingNight = lazy(() => import('./pages/MatchingNight'))
const MatchingBox = lazy(() => import('./pages/MatchingBox'))
const MyPredictions = lazy(() => import('./pages/MyPredictions'))
const Predictions = lazy(() => import('./pages/Predictions'))
const Auth = lazy(() => import('./pages/Auth'))
const Admin = lazy(() => import('./pages/Admin'))

function App() {
  const { loadingSeasons, loadingCurrentSeason, error } = useSeason()

  if (loadingSeasons || loadingCurrentSeason) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Lade Daten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">Error: {error}</div>;
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Season />} />
          <Route path="/candidates" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>}>
              <Candidates />
            </Suspense>
          } />
          <Route path="/matching-night" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>}>
              <MatchingNight />
            </Suspense>
          } />
          <Route path="/matching-box" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>}>
              <MatchingBox />
            </Suspense>
          } />
          <Route path="/my-predictions" element={
            <ProtectedRoute>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>}>
                <MyPredictions />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/predictions" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>}>
              <Predictions />
            </Suspense>
          } />
          <Route path="/auth" element={
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>}>
              <Auth />
            </Suspense>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>}>
                <Admin />
              </Suspense>
            </AdminRoute>
          } />
        </Routes>
      </main>
    </>
  )
}

export default App
