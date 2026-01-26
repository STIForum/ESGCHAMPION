import { Outlet } from 'react-router-dom'
import { Navbar, Footer, Sidebar, MobileMenu } from '@/components'

interface MainLayoutProps {
  showSidebar?: boolean
}

export function MainLayout({ showSidebar = false }: MainLayoutProps) {
  return (
    <div className="app-layout">
      <Navbar />
      <MobileMenu />
      
      {showSidebar ? (
        <div className="dashboard-layout">
          <Sidebar />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      ) : (
        <main>
          <Outlet />
        </main>
      )}
      
      <Footer />
    </div>
  )
}
