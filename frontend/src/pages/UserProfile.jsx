import { useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../App'
import { useNavigate } from 'react-router-dom'

export default function UserProfile() {
    const { user, logout } = useContext(AuthContext)
    const navigate = useNavigate()
    const [addresses, setAddresses] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user_addresses') || '[]') } catch { return [] }
    })
    const [showAddForm, setShowAddForm] = useState(false)
    const [newAddr, setNewAddr] = useState({ label: 'Home', street: '', city: '', state: '', pincode: '' })
    const [saved, setSaved] = useState(false)
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

    function saveAddress() {
        if (!newAddr.street || !newAddr.city) return
        const updated = [...addresses, { ...newAddr, id: Date.now() }]
        setAddresses(updated)
        localStorage.setItem('user_addresses', JSON.stringify(updated))
        setNewAddr({ label: 'Home', street: '', city: '', state: '', pincode: '' })
        setShowAddForm(false)
    }

    function removeAddress(id) {
        const updated = addresses.filter(a => a.id !== id)
        setAddresses(updated)
        localStorage.setItem('user_addresses', JSON.stringify(updated))
    }

    function applyTheme(t) {
        setTheme(t)
        localStorage.setItem('theme', t)
        if (t === 'light') {
            document.documentElement.classList.add('light-mode')
            document.body.classList.add('light-mode')
        } else {
            document.documentElement.classList.remove('light-mode')
            document.body.classList.remove('light-mode')
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const inp = { background: '#1a1e38', border: '1px solid #1e2240', fontFamily: 'Inter' }
    const lbl = { color: '#4a5580' }

    return (
        <div className="space-y-5 max-w-2xl">
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">Profile & Settings</h2>
                <p className="text-sm mt-1" style={lbl}>Manage your account, addresses, and preferences</p>
            </div>

            {/* Profile */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-semibold text-white mb-4">My Profile</div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
                        style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="font-semibold text-white">{user?.name}</div>
                        <div className="text-sm" style={lbl}>{user?.email}</div>
                        <span className="text-xs px-2 py-0.5 rounded-full inline-block mt-1"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            Verified Customer
                        </span>
                    </div>
                </div>
            </div>

            {/* Theme */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-semibold text-white mb-4">Appearance</div>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'dark', label: 'Dark', icon: '🌙' },
                        { id: 'light', label: 'Light', icon: '☀️' },
                        { id: 'auto', label: 'Auto', icon: '⚙️' },
                    ].map(t => (
                        <motion.button key={t.id} onClick={() => applyTheme(t.id)}
                            whileTap={{ scale: 0.96 }}
                            className="flex flex-col items-center gap-2 py-4 rounded-2xl"
                            style={{
                                background: theme === t.id ? 'rgba(108,99,255,0.15)' : 'rgba(30,34,64,0.3)',
                                border: `2px solid ${theme === t.id ? '#6c63ff' : '#1e2240'}`
                            }}>
                            <span className="text-2xl">{t.icon}</span>
                            <span className="text-sm font-semibold" style={{ color: theme === t.id ? '#6c63ff' : 'white' }}>{t.label}</span>
                            {theme === t.id && (
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Active</span>
                            )}
                        </motion.button>
                    ))}
                </div>
                {saved && <p className="mt-2 text-xs text-center" style={{ color: '#10b981' }}>Saved!</p>}
            </div>

            {/* Addresses */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="font-grotesk font-semibold text-white">Saved Addresses</div>
                    <button onClick={() => setShowAddForm(s => !s)}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                        {showAddForm ? 'Cancel' : '+ Add'}
                    </button>
                </div>
                <AnimatePresence>
                    {showAddForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mb-4 overflow-hidden">
                            <div className="space-y-2 p-4 rounded-xl" style={{ background: 'rgba(30,34,64,0.4)' }}>
                                {[
                                    { key: 'label', ph: 'Home / Work / Other' },
                                    { key: 'street', ph: '12 MG Road, Apt 4B' },
                                    { key: 'city', ph: 'Bengaluru' },
                                    { key: 'state', ph: 'Karnataka' },
                                    { key: 'pincode', ph: '560001' },
                                ].map(f => (
                                    <input key={f.key} value={newAddr[f.key]} placeholder={f.ph}
                                        onChange={e => setNewAddr(a => ({ ...a, [f.key]: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                                        style={inp} />
                                ))}
                                <button onClick={saveAddress}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                                    style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {addresses.length === 0
                    ? <div className="text-center py-6 text-slate-500 text-sm">No saved addresses.</div>
                    : addresses.map(a => (
                        <div key={a.id} className="flex items-start justify-between p-3 rounded-xl mb-2"
                            style={{ background: 'rgba(30,34,64,0.3)', border: '1px solid #1e2240' }}>
                            <div>
                                <div className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-1"
                                    style={{ background: 'rgba(108,99,255,0.1)', color: '#6c63ff' }}>{a.label}</div>
                                <div className="text-sm text-white">{a.street}</div>
                                <div className="text-xs mt-0.5" style={lbl}>{a.city}, {a.state} – {a.pincode}</div>
                            </div>
                            <button onClick={() => removeAddress(a.id)}
                                className="text-xs px-2 py-1 rounded-lg"
                                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>Remove</button>
                        </div>
                    ))
                }
            </div>


            {/* Logout */}

            <button onClick={() => { logout(); navigate('/login') }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                Sign Out
            </button>
        </div>
    )
}
