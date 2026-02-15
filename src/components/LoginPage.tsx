import { useState, useEffect, useRef } from 'react'
import './LoginPage.css'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [preloaded, setPreloaded] = useState(true)
  const [active, setActive] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef<number>()
  const usernameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Remove preload class on mount
    setPreloaded(false)

    // Auto-toggle after 2 seconds
    timerRef.current = window.setTimeout(() => {
      setActive(true)
    }, 2000)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleToggle = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    setActive(!active)
    if (!active) {
      setTimeout(() => {
        usernameInputRef.current?.focus()
      }, 100)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Store token in sessionStorage
      sessionStorage.setItem('auth_token', data.token)
      setLoading(false)
      onLogin()
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className={`login--container ${preloaded ? 'preload' : ''} ${active ? 'login--active' : ''} ${error ? 'login--error' : ''}`}>
        <form className="login--form" onSubmit={handleLogin}>
          <div className="login--username-container">
            <label>Username</label>
            <input
              ref={usernameInputRef}
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="login--password-container">
            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="login--error-message">{error}</div>
          )}

          <button
            type="submit"
            className="login--login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="login--spinner"></span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="login--toggle-container" onClick={handleToggle}>
          <small>Hey you,</small>
          <div className="js-toggle-login">Login</div>
          <small>already</small>
        </div>
      </div>
    </div>
  )
}
