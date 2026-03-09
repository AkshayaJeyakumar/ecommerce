import { useContext, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../App'

const titles = {
    '/dashboard': { title: 'Dashboard', sub: 'AI pricing overview & analytics' },
    '/products': { title: 'Products', sub: 'Manage your product catalog' },
    '/pricing': { title: 'AI Pricing Engine', sub: 'Automated dynamic pricing algorithms' },
    '/simulator': { title: 'Price Simulator', sub: 'Interactive AI pricing demo' },
    '/sentiment': { title: 'Sentiment Analysis', sub: 'Customer review intelligence' },
    '/competitor': { title: 'Competitor Tracker', sub: 'Market price comparison' },
    '/analytics': { title: 'Analytics', sub: 'Performance metrics & trends' },
    '/workflow': { title: 'Workflow Visualizer', sub: 'AI system pipeline diagram' },
    '/admin': { title: 'Admin Panel', sub: 'System configuration & rules' },
    '/settings': { title: 'Settings', sub: 'Preferences & configuration' },
}

export default function Header({ onMenuClick, notifications, setNotifications }) {
    const { user, logout } = useContext(AuthContext)
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [showNotifs, setShowNotifs] = useState(false)
    const [showUser, setShowUser] = useState(false)
    const info = titles[pathname] || { title: 'Dashboard', sub: '' }
    const unread = notifications.length

    function handleLogout() { logout(); navigate('/login') }

    function dismissNotif(id) {
        setNotifications(n => n.filter(x => x.id !== id))
    }

    const typeStyle = { warning: '#f59e0b', success: '#10b981', info: '#6c63ff', danger: '#ef4444' }

    return (
        <header className="flex items-center justify-between px-6 z-40 shrink-0"
            style={{
                height: 64, background: 'rgba(10,13,26,0.9)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #1e2240'
            }}>
            {/* Left */}
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
                    style={{ border: '1px solid #1e2240', color: '#6b7280', fontSize: 18 }}>
                    ☰
                </button>
                <div>
                    <h1 className="font-grotesk font-bold text-white text-base leading-tight">{info.title}</h1>
                    <p className="text-xs" style={{ color: '#4a5580' }}>{info.sub}</p>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3 relative">
                {/* AI Status pill */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AI Engine Active
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button onClick={() => { setShowNotifs(o => !o); setShowUser(false) }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 relative"
                        style={{ border: '1px solid #1e2240', fontSize: 16, color: '#6b7280' }}>
                        🔔
                        {unread > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
                        )}
                    </button>
                    <AnimatePresence>
                        {showNotifs && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden z-50"
                                style={{ background: '#0f1224', border: '1px solid #1e2240', top: '100%' }}>
                                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1e2240' }}>
                                    <span className="text-sm font-semibold text-white">Notifications</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,99,255,0.2)', color: '#a5b4fc' }}>{unread}</span>
                                </div>
                                {notifications.length === 0
                                    ? <div className="p-4 text-center text-sm text-slate-500">All caught up!</div>
                                    : notifications.map(n => (
                                        <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-all"
                                            style={{ borderBottom: '1px solid rgba(30,34,64,0.5)' }}>
                                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: typeStyle[n.type] || '#6c63ff' }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-white">{n.title}</div>
                                                <div className="text-xs text-slate-400 truncate">{n.msg}</div>
                                                <div className="text-xs mt-0.5" style={{ color: '#3a4070' }}>{n.time}</div>
                                            </div>
                                            <button onClick={() => dismissNotif(n.id)} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>
                                        </div>
                                    ))
                                }
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* User menu */}
                <div className="relative">
                    <button onClick={() => { setShowUser(o => !o); setShowNotifs(false) }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:bg-white/5"
                        style={{ border: '1px solid #1e2240' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                            {user?.name?.[0] || user?.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm text-white hidden md:block">{user?.name || user?.username}</span>
                        <span className="text-xs text-slate-500">▾</span>
                    </button>
                    <AnimatePresence>
                        {showUser && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden z-50"
                                style={{ background: '#0f1224', border: '1px solid #1e2240', top: '100%' }}>
                                <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e2240' }}>
                                    <div className="text-xs font-semibold text-white">{user?.name}</div>
                                    <div className="text-xs" style={{ color: '#6c63ff' }}>{user?.role}</div>
                                </div>
                                <button onClick={() => navigate('/settings')}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                    ⚙️ Settings
                                </button>
                                <button onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-all"
                                    style={{ color: '#ef4444' }}>
                                    🚪 Sign Out
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    )
}
