import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../App'
import axios from 'axios'

function Blob({ style }) {
    return <div className="absolute rounded-full blur-3xl opacity-30 pointer-events-none" style={style} />
}

export default function Login() {
    const { login } = useContext(AuthContext)
    const navigate = useNavigate()

    const [tab, setTab] = useState('login')  // 'login' | 'register'
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    function set(k, v) { setForm(p => ({ ...p, [k]: v })); setError('') }

    function fillDemo(email, pw) { setForm(f => ({ ...f, email, password: pw })); setTab('login') }

    async function submit(e) {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            if (tab === 'register') {
                if (!form.name || !form.email || !form.password) throw new Error('All fields required')
                const { data } = await axios.post('/api/auth/register', { name: form.name, email: form.email, password: form.password })
                login(data.user, data.token); navigate('/dashboard')
            } else {
                if (!form.email || !form.password) throw new Error('Email and password required')
                const { data } = await axios.post('/api/auth/login', { email: form.email, password: form.password })
                if (!data.success) throw new Error(data.message)
                login(data.user, data.token); navigate('/dashboard')
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Cannot connect to server. Is the backend running?')
        } finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #050714 0%, #0a0f2e 50%, #060b20 100%)' }}>
            <Blob style={{ width: 500, height: 500, top: '-10%', left: '-10%', background: '#6c63ff' }} />
            <Blob style={{ width: 400, height: 400, bottom: '-10%', right: '-5%', background: '#0ea5e9' }} />
            <Blob style={{ width: 300, height: 300, top: '40%', left: '40%', background: '#10b981' }} />

            <motion.div initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6 }} className="relative z-10 w-full max-w-md mx-4">

                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl"
                        style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 0 40px rgba(108,99,255,0.5)' }}>
                        🤖
                    </motion.div>
                    <h1 className="font-grotesk font-bold text-3xl text-white">AI Dynamic Pricing</h1>
                    <p className="mt-1 text-sm" style={{ color: '#4a5580' }}>Adaptive Intelligence Platform</p>
                </div>

                {/* Card */}
                <div className="rounded-3xl p-8" style={{ background: 'rgba(15,18,36,0.85)', border: '1px solid rgba(108,99,255,0.2)', backdropFilter: 'blur(24px)' }}>
                    {/* Tabs */}
                    <div className="flex mb-6 p-1 rounded-xl" style={{ background: '#1a1e38' }}>
                        {['login', 'register'].map(t => (
                            <button key={t} onClick={() => { setTab(t); setError('') }}
                                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                                style={tab === t ? { background: '#6c63ff', color: 'white' } : { color: '#4a5580' }}>
                                {t === 'login' ? '🔐 Login' : '📝 Register'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            {tab === 'register' && (
                                <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>Full Name</label>
                                    <div className="flex items-center rounded-xl px-4 py-3" style={{ background: '#1a1e38', border: '1px solid #1e2240' }}>
                                        <span className="mr-3">👤</span>
                                        <input type="text" placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)}
                                            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>Email</label>
                            <div className="flex items-center rounded-xl px-4 py-3" style={{ background: '#1a1e38', border: '1px solid #1e2240' }}>
                                <span className="mr-3">📧</span>
                                <input type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)}
                                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>Password</label>
                            <div className="flex items-center rounded-xl px-4 py-3" style={{ background: '#1a1e38', border: '1px solid #1e2240' }}>
                                <span className="mr-3">🔑</span>
                                <input type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)}
                                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600" />
                            </div>
                        </div>



                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="rounded-xl p-3 text-sm text-center" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e' }}>
                                    ✗ {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button type="submit" disabled={loading}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white mt-2"
                            style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 8px 30px rgba(108,99,255,0.5)' }}>
                            {loading ? '⏳ Please wait...' : tab === 'login' ? '🚀 Sign In to Dashboard' : '🎉 Create Account'}
                        </motion.button>
                    </form>
                </div>

                <p className="text-center text-xs mt-4" style={{ color: '#2d3459' }}>
                    Adaptive AI Dynamic Pricing Platform © 2026
                </p>
            </motion.div>
        </div>
    )
}
