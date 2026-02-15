import { useState, FormEvent } from 'react'
import './LoginPage.css'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const togglePasswordVisibility = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e: FormEvent) => {
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
        setError(data.error || '登录失败')
        setLoading(false)
        return
      }

      sessionStorage.setItem('auth_token', data.token)
      setLoading(false)
      onLogin()
    } catch (err) {
      setError('网络错误，请重试。')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <section>
        <div className="box">
          <div className="square" style={{ '--i': 0 } as React.CSSProperties}></div>
          <div className="square" style={{ '--i': 1 } as React.CSSProperties}></div>
          <div className="square" style={{ '--i': 2 } as React.CSSProperties}></div>
          <div className="square" style={{ '--i': 3 } as React.CSSProperties}></div>
          <div className="square" style={{ '--i': 4 } as React.CSSProperties}></div>
          <div className="square" style={{ '--i': 5 } as React.CSSProperties}></div>

          <div className="container">
            <div className="form">
              <h2>登录 StudyWeb</h2>
              <form onSubmit={handleSubmit}>
                <div className="inputBx">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <span>用户名</span>
                </div>

                <div className="inputBx password">
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span>密码</span>
                  <a
                    href="#"
                    className={`password-control ${showPassword ? 'view' : ''}`}
                    onClick={togglePasswordVisibility}
                  ></a>
                </div>

                {error && (
                  <div className="error-message">{error}</div>
                )}

                <div className="inputBx">
                  <input
                    type="submit"
                    value={loading ? '登录中...' : '登录'}
                    disabled={loading}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
