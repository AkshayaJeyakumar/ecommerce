import { useState, useContext, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AuthContext } from '../App'

export default function Settings() {
    const { user } = useContext(AuthContext)
    const [aiParams, setAiParams] = useState({
        demandThresholdHigh: 80,
        demandThresholdLow: 40,
        maxPriceIncrease: 15,
        maxPriceDecrease: 20,
        competitorMargin: 10,
        updateFrequency: 'hourly',
    })
    const [saved, setSaved] = useState(false)
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

    useEffect(() => {
        localStorage.setItem('theme', theme)

        function applyTheme(isLight) {
            if (isLight) {
                document.documentElement.classList.add('light-mode')
                document.body.classList.add('light-mode')
                document.body.style.background = ''
            } else {
                document.documentElement.classList.remove('light-mode')
                document.body.classList.remove('light-mode')
                document.body.style.background = ''
            }
        }

        if (theme === 'light') {
            applyTheme(true)
        } else if (theme === 'dark') {
            applyTheme(false)
        } else {
            // auto — follow system preference
            const mq = window.matchMedia('(prefers-color-scheme: light)')
            applyTheme(mq.matches)
            const handler = e => applyTheme(e.matches)
            mq.addEventListener('change', handler)
            return () => mq.removeEventListener('change', handler)
        }
    }, [theme])

    function save() {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    return (
        <div className="space-y-5 max-w-3xl">
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">Settings</h2>
                <p className="text-sm mt-1" style={{ color: '#4a5580' }}>Configure AI parameters, preferences, and system options</p>
            </div>

            {/* Profile */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-semibold text-white mb-4">👤 Profile</div>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
                        style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                        {user?.name?.[0] || 'A'}
                    </div>
                    <div>
                        <div className="font-semibold text-white">{user?.name || user?.username}</div>
                        <div className="text-sm" style={{ color: '#6c63ff' }}>{user?.role} · {user?.segment} Segment</div>
                        <div className="text-xs mt-1" style={{ color: '#4a5580' }}>Adaptive AI Pricing Platform v2.0</div>
                    </div>
                </div>
            </div>

            {/* 🎨 Theme Section */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-semibold text-white mb-1">🎨 Appearance</div>
                <p className="text-xs mb-4" style={{ color: '#4a5580' }}>Choose your preferred interface theme</p>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'dark', label: 'Dark Mode', icon: '🌙', desc: 'Easy on eyes' },
                        { id: 'light', label: 'Light Mode', icon: '☀️', desc: 'Bright & clean' },
                        { id: 'auto', label: 'Auto', icon: '⚙️', desc: 'Follows system' },
                    ].map(t => (
                        <motion.button key={t.id} onClick={() => setTheme(t.id)}
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="flex flex-col items-center gap-2 py-5 px-3 rounded-2xl transition-all"
                            style={{
                                background: theme === t.id ? 'rgba(108,99,255,0.15)' : 'rgba(30,34,64,0.3)',
                                border: `2px solid ${theme === t.id ? '#6c63ff' : '#1e2240'}`
                            }}>
                            <span className="text-3xl">{t.icon}</span>
                            <span className="text-sm font-semibold" style={{ color: theme === t.id ? '#6c63ff' : 'white' }}>{t.label}</span>
                            <span className="text-xs" style={{ color: '#4a5580' }}>{t.desc}</span>
                            {theme === t.id && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                                    ✓ Active
                                </span>
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* AI Parameters */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-semibold text-white mb-4">🤖 AI Pricing Parameters</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: 'High Demand Threshold (%)', key: 'demandThresholdHigh' },
                        { label: 'Low Demand Threshold (%)', key: 'demandThresholdLow' },
                        { label: 'Max Price Increase (%)', key: 'maxPriceIncrease' },
                        { label: 'Max Price Decrease (%)', key: 'maxPriceDecrease' },
                        { label: 'Competitor Margin (%)', key: 'competitorMargin' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>{f.label}</label>
                            <input type="number" value={aiParams[f.key]}
                                onChange={e => setAiParams(p => ({ ...p, [f.key]: +e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                style={{ background: '#1a1e38', border: '1px solid #1e2240', fontFamily: 'Inter' }}
                                onFocus={e => e.target.style.borderColor = '#6c63ff'}
                                onBlur={e => e.target.style.borderColor = '#1e2240'} />
                        </div>
                    ))}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>Update Frequency</label>
                        <select value={aiParams.updateFrequency}
                            onChange={e => setAiParams(p => ({ ...p, updateFrequency: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                            style={{ background: '#1a1e38', border: '1px solid #1e2240', fontFamily: 'Inter' }}>
                            {['realtime', 'minutely', 'hourly', 'daily'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Notification preferences */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-semibold text-white mb-4">🔔 Notification Preferences</div>
                <NotifPrefs />
            </div>

            {/* System Info */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-semibold text-white mb-4">ℹ️ System Information</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                        ['Platform', 'Adaptive AI Pricing v2.0'],
                        ['Stack', 'React + Node.js + Express'],
                        ['AI Model', 'Dynamic Pricing Algorithm v3'],
                        ['Database', 'MongoDB (Mongoose)'],
                        ['Frontend', 'Vite + TailwindCSS v4'],
                        ['Charts', 'Chart.js + React Chart.js 2'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between p-3 rounded-xl" style={{ background: 'rgba(30,34,64,0.3)' }}>
                            <span style={{ color: '#4a5580' }}>{k}</span>
                            <span className="font-medium text-white text-right text-xs">{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save btn */}
            <div className="flex gap-3">
                <motion.button onClick={save} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 6px 20px rgba(108,99,255,0.4)' }}>
                    {saved ? '✅ Settings Saved!' : '💾 Save Settings'}
                </motion.button>
                <button className="px-6 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(30,34,64,0.4)', color: '#6b7280', border: '1px solid #1e2240' }}>
                    Reset Defaults
                </button>
            </div>
        </div>
    )
}

// Separate component to avoid useState-in-loop
function NotifPrefs() {
    const prefs = [
        { label: 'Price drop alerts', defaultOn: true },
        { label: 'Demand spike alerts', defaultOn: true },
        { label: 'Competitor price changes', defaultOn: true },
        { label: 'Low stock warnings', defaultOn: false },
        { label: 'AI simulation results', defaultOn: true },
    ]
    const [states, setStates] = useState(prefs.map(p => p.defaultOn))
    return (
        <div className="space-y-3">
            {prefs.map((pref, i) => (
                <div key={pref.label} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid rgba(30,34,64,0.5)' }}>
                    <span className="text-sm text-slate-300">{pref.label}</span>
                    <button onClick={() => setStates(s => { const n = [...s]; n[i] = !n[i]; return n })}
                        className="relative w-11 h-6 rounded-full transition-all duration-300"
                        style={{ background: states[i] ? '#6c63ff' : '#1e2240' }}>
                        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow"
                            style={{ left: states[i] ? '1.25rem' : '0.125rem' }} />
                    </button>
                </div>
            ))}
        </div>
    )
}
