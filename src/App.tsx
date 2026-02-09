import { ThemeProvider } from './context/ThemeContext'
import Dashboard from './components/Dashboard'
import CustomCursor from './components/CustomCursor'

function App() {
  return (
    <ThemeProvider>
      <CustomCursor />
      <Dashboard />
    </ThemeProvider>
  )
}

export default App
