import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../App'
import axios from 'axios'

const ADMIN_NAV = [
    { section: 'OVERVIEW' },
    { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    { to: '/products', icon: '📦', label: 'Products' },
    { section: 'AI ENGINE' },
    { to: '/pricing', icon: '🤖', label: 'AI Pricing Engine' },
    { to: '/simulator', icon: '⚡', label: 'Price Simulator', badge: 'Live' },
    { section: 'INTELLIGENCE' },
    { to: '/sentiment', icon: '💬', label: 'Sentiment Analysis' },
    { to: '/competitor', icon: '🔍', label: 'Competitor Tracker' },
    { section: 'ANALYTICS' },
    { to: '/analytics', icon: '📊', label: 'Revenue Analytics' },
    { section: 'MANAGEMENT' },
    { to: '/admin', icon: '🛡️', label: 'Admin Panel', dynamicBadge: 'orders' },
    { to: '/admin/users', icon: '👥', label: 'User Management' },
    { section: 'SYSTEM' },
    { to: '/workflow', icon: '🔄', label: 'Workflow Visualizer' },
    { to: '/settings', icon: '⚙️', label: 'System Settings' },
]

const USER_NAV = [
    { section: 'OVERVIEW' },
    { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    { to: '/products', icon: '🛍️', label: 'Browse Products' },
    { section: 'CART' },
    { to: '/my-cart', icon: '🛒', label: 'My Cart', dynamicBadge: 'cart' },
    { section: 'REVIEWS' },
    { to: '/my-reviews', icon: '⭐', label: 'My Reviews' },
    { section: 'AI FEATURES' },
    { to: '/alerts', icon: '🔔', label: 'Price Drop Alerts' },
    { to: '/recommendations', icon: '✨', label: 'For You' },
    { section: 'ACCOUNT' },
    { to: '/my-dashboard', icon: '📋', label: 'My Dashboard' },
    { to: '/profile', icon: '🧑', label: 'Profile & Settings' },
]


export default function Sidebar({ open }) {
    const { user } = useContext(AuthContext)
    const isAdmin = user?.role === 'admin'
    const [pendingOrders, setPendingOrders] = useState(0)
    const [lowStockCount, setLowStockCount] = useState(0)

    useEffect(() => {
        if (!isAdmin) return
        function poll() {
            axios.get('/api/orders/all').then(r => {
                setPendingOrders(r.data.filter(o => o.status === 'pending').length)
            }).catch(() => { })
            axios.get('/api/products').then(r => {
                setLowStockCount(r.data.filter(p => (p.stock || 0) <= 0).length)
            }).catch(() => { })
        }
        poll()
        const id = setInterval(poll, 30000)
        return () => clearInterval(id)
    }, [isAdmin])

    const nav = isAdmin ? ADMIN_NAV : USER_NAV

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
                    <div className="text-xs" style={{ color: isAdmin ? '#ef4444' : '#6c63ff' }}>
                        {isAdmin ? '🛡 Admin Dashboard' : '🛍 Customer Portal'}
                    </div>
                </div>
            </div>

            {/* Admin alerts */}
            {isAdmin && pendingOrders > 0 && (
                <NavLink to="/admin" className="mx-3 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <span className="text-base animate-pulse">🔔</span>
                    <div>
                        <div className="text-xs font-semibold" style={{ color: '#ef4444' }}>
                            {pendingOrders} Pending Order{pendingOrders !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs" style={{ color: '#4a5580' }}>Tap to manage →</div>
                    </div>
                </NavLink>
            )}
            {isAdmin && lowStockCount > 0 && (
                <NavLink to="/admin" className="mx-3 mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                    <span>⚠️</span>
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
                        <NavLink key={`${item.to}-${i}`} to={item.to}
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
                                        style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                        {item.badge}
                                    </span>
                                )}
                                {item.dynamicBadge === 'orders' && pendingOrders > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                                        {pendingOrders}
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
                        style={{ background: isAdmin ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-white truncate max-w-[140px]">{user?.name || 'User'}</div>
                        <div className="text-xs capitalize" style={{ color: isAdmin ? '#ef4444' : '#6c63ff' }}>
                            ● {isAdmin ? 'Administrator' : 'Customer'}
                        </div>
                    </div>
                </div>
            </div>
        </motion.aside>
    )
}
