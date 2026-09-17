import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1400px] mx-auto p-5 fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
