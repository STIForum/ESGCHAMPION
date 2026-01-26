import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components'

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <Navbar />
      <main className="auth-main">
        <Outlet />
      </main>
    </div>
  )
}
