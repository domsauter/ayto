import { Routes, Route } from 'react-router-dom'
import Navbar from './components/navbar'
import Season from './pages/Season'
import Candidates from './pages/Candidates'
import MatchingNight from './pages/MatchingNight'
import MatchingBox from './pages/MatchingBox'
import MyPredictions from './pages/MyPredictions'
import Predictions from './pages/Predictions'
import Auth from './pages/Auth'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Admin from './pages/Admin'
import { useSeason } from './context/SeasonContext' // Import useSeason

function App() {
  const { loadingSeasons, loadingCurrentSeason, error } = useSeason(); // Get loading and error states

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
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/matching-night" element={<MatchingNight />} />
          <Route path="/matching-box" element={<MatchingBox />} />
          <Route path="/my-predictions" element={
            <ProtectedRoute>
              <MyPredictions />
            </ProtectedRoute>
          } />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
        </Routes>
      </main>
    </>
  )
}

export default App
