import { useContext, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { AuthContext } from '../App'

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'warning', title: 'Price Alert', msg: '4K Monitor demand surged 91%', time: '2m ago' },
        { id: 2, type: 'success', title: 'AI Update', msg: 'Fitness Watch price optimized', time: '15m ago' },
        { id: 3, type: 'info', title: 'New Review', msg: 'Positive sentiment on Earbuds', time: '1h ago' },
    ])

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#050711' }}>
            <Sidebar open={sidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: sidebarOpen ? 260 : 0, transition: 'margin 0.3s ease' }}>
                <Header onMenuClick={() => setSidebarOpen(o => !o)} notifications={notifications} setNotifications={setNotifications} />
                <main className="flex-1 overflow-y-auto p-6" style={{ background: '#050711' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
