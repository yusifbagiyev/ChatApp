import { useContext } from 'react'
import { AuthContext, AuthProvider } from './context/AuthContext'
import Login from './pages/Login'

function AppContent() {
  const { user, isLoading } = useContext(AuthContext)

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6366F1', fontSize: '18px' }}>Loading...</div>
  }

  if (!user) {
    return <Login />
  }

  return <div>Welcome, {user.displayName || user.email}!</div>
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App