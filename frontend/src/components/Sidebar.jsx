import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../App'
import axios from 'axios'

const BASE_NAV = [
    { section: 'Overview' },
    { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    { to: '/products', icon: '📦', label: 'Products' },
    { section: 'AI Engine' },
    { to: '/pricing', icon: '🤖', label: 'AI Pricing Engine' },
    { to: '/simulator', icon: '⚡', label: 'Price Simulator', badge: 'Live' },
    { section: 'Intelligence' },
    { to: '/sentiment', icon: '💬', label: 'Sentiment Analysis' },
    { to: '/competitor', icon: '🔍', label: 'Competitor Tracker' },
    { to: '/analytics', icon: '📊', label: 'Analytics' },
    { section: 'My Account' },
    { to: '/my-dashboard', icon: '👤', label: 'My Dashboard' },
    { section: 'System' },
    { to: '/workflow', icon: '🔄', label: 'Workflow Visualizer' },
    { to: '/admin', icon: '🛡️', label: 'Admin Panel' },
    { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar({ open }) {
    const { user } = useContext(AuthContext)
    const isAdmin = user?.role === 'admin'
    const [pendingOrders, setPendingOrders] = useState(0)
    const [lowStockCount, setLowStockCount] = useState(0)

    // Poll for pending orders + low stock every 30s (admin only)
    useEffect(() => {
        if (!isAdmin) return
        function poll() {
            axios.get('/api/orders/all').then(r => {
                const pending = r.data.filter(o => o.status === 'pending').length
                setPendingOrders(pending)
            }).catch(() => { })
            axios.get('/api/products').then(r => {
                const low = r.data.filter(p => (p.stock || 0) <= 0).length
                setLowStockCount(low)
            }).catch(() => { })
        }
        poll()
        const id = setInterval(poll, 30000)
        return () => clearInterval(id)
    }, [isAdmin])

    // Build nav with dynamic badges for admin
    const nav = BASE_NAV.map(item => {
        if (!isAdmin) return item
        if (item.to === '/admin') {
            const total = pendingOrders + lowStockCount
            return total > 0 ? { ...item, badge: `${total}`, badgeColor: '#ef4444' } : item
        }
        return item
    })

    return (
        <motion.aside
            initial={{ x: -260 }}
            animate={{ x: open ? 0 : -260 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full z-50 flex flex-col"
            style={{ width: 260, background: '#0a0d1a', borderRight: '1px solid #1e2240' }}
        >
            {/* Brand */}
            <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid #1e2240' }}>
                <div className="flex items-center justify-center w-10 h-10 rounded-xl text-xl"
                    style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 0 20px rgba(108,99,255,0.4)' }}>
                    🧠
                </div>
                <div>
                    <div className="font-grotesk font-bold text-sm text-white leading-tight">AI Pricing</div>
                    <div className="text-xs" style={{ color: '#6c63ff' }}>Dynamic Platform</div>
                </div>
            </div>

            {/* Admin order alert banner */}
            {isAdmin && pendingOrders > 0 && (
                <NavLink to="/admin" className="mx-3 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <span className="text-base animate-pulse">🔔</span>
                    <div>
                        <div className="text-xs font-semibold" style={{ color: '#ef4444' }}>
                            {pendingOrders} Order{pendingOrders !== 1 ? 's' : ''} Awaiting!
                        </div>
                        <div className="text-xs" style={{ color: '#4a5580' }}>Tap to manage orders →</div>
                    </div>
                </NavLink>
            )}
            {isAdmin && lowStockCount > 0 && (
                <NavLink to="/admin" className="mx-3 mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                    <span className="text-base">⚠️</span>
                    <div className="text-xs font-semibold" style={{ color: '#f97316' }}>
                        {lowStockCount} Product{lowStockCount !== 1 ? 's' : ''} Out of Stock
                    </div>
                </NavLink>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                {nav.map((item, i) =>
                    item.section ? (
                        <div key={i} className="px-2 pt-4 pb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: '#3a4070' }}>
                            {item.section}
                        </div>
                    ) : (
                        <NavLink key={item.to} to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ` +
                                (isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5')
                            }
                            style={({ isActive }) => isActive ? {
                                background: 'linear-gradient(135deg,rgba(108,99,255,0.2),rgba(90,82,224,0.1))',
                                border: '1px solid rgba(108,99,255,0.25)',
                                color: '#a5b4fc'
                            } : {}}
                        >
                            {({ isActive }) => <>
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3/5 rounded-r" style={{ background: '#6c63ff' }} />
                                )}
                                <span className="text-base">{item.icon}</span>
                                <span className="flex-1">{item.label}</span>
                                {item.badge && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                        style={{
                                            background: item.badgeColor ? `${item.badgeColor}20` : 'rgba(16,185,129,0.15)',
                                            color: item.badgeColor || '#10b981'
                                        }}>
                                        {item.badge}
                                    </span>
                                )}
                            </>}
                        </NavLink>
                    )
                )}
            </nav>

            {/* Footer */}
            <div className="p-3" style={{ borderTop: '1px solid #1e2240' }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#0f1224' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                        AI
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-white">v2.0 Platform</div>
                        <div className="text-xs" style={{ color: '#10b981' }}>● System Online</div>
                    </div>
                </div>
            </div>
        </motion.aside>
    )
}
