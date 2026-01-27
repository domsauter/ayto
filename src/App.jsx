import { useState } from 'react'
import Navbar from './components/navbar'
import Season from './pages/Season'
import Candidates from './pages/Candidates'
import MatchingNight from './pages/MatchingNight'
import TruthBooth from './pages/TruthBooth'
import MyPredictions from './pages/MyPredictions'
import Predictions from './pages/Predictions'

function App() {
  const [page, setPage] = useState('Staffel')

  const handlePage = (page) => {
    setPage(page)
  }

  return (
    <>
      <Navbar handlePage={handlePage} />
      <main>
        {page === 'Staffel' && <Season />}
        {page === 'Kandidaten' && <Candidates />}
        {page === 'Matching Night' && <MatchingNight />}
        {page === 'Truth Booth' && <TruthBooth />}
        {page === 'Meine Predictions' && <MyPredictions />}
        {page === 'Predictions' && <Predictions />}
      </main>
    </>
  )
}

export default App
