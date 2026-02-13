import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import Dashboard from './components/Dashboard'
import AIPptGenerator from './components/AIPptGenerator'
import VideoExtractor from './components/VideoExtractor'
import TempDrive from './components/TempDrive'

type Page = 'dashboard' | 'ai-ppt-generator' | 'video-extractor' | 'temp-drive'

function App() {
  const [page, setPage] = useState<Page>('dashboard')

  return (
    <ThemeProvider>
      {page === 'dashboard' && (
        <Dashboard onNavigate={(id) => setPage(id as Page)} />
      )}
      {page === 'ai-ppt-generator' && (
        <AIPptGenerator onBack={() => setPage('dashboard')} />
      )}
      {page === 'video-extractor' && (
        <VideoExtractor onBack={() => setPage('dashboard')} />
      )}
      {page === 'temp-drive' && (
        <TempDrive onBack={() => setPage('dashboard')} />
      )}
    </ThemeProvider>
  )
}

export default App
