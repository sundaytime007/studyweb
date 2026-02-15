import { useState, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import Dashboard from './components/Dashboard'
import AIPptGenerator from './components/AIPptGenerator'
import VideoExtractor from './components/VideoExtractor'
import TempDrive from './components/TempDrive'
import MusicPlayer from './components/MusicPlayer'
import LoginPage from './components/LoginPage'

type Page = 'dashboard' | 'ai-ppt-generator' | 'video-extractor' | 'temp-drive' | 'music-player'

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const verifyAuth = async () => {
      const token = sessionStorage.getItem('auth_token')
      if (!token) {
        setIsAuthenticated(false)
        return
      }

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          sessionStorage.removeItem('auth_token')
          setIsAuthenticated(false)
        }
      } catch {
        sessionStorage.removeItem('auth_token')
        setIsAuthenticated(false)
      }
    }

    verifyAuth()
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  // Show nothing while checking auth
  if (isAuthenticated === null) {
    return null
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <LoginPage onLogin={handleLogin} />
      </ThemeProvider>
    )
  }

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
      {page === 'music-player' && (
        <MusicPlayer onBack={() => setPage('dashboard')} />
      )}
    </ThemeProvider>
  )
}

export default App
