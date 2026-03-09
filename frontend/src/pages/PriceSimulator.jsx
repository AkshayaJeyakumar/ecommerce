import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

function Slider({ label, value, onChange, min = 0, max = 100, color = '#6c63ff', suffix = '%' }) {
    return (
        <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>{label}</span>
                <span className="text-sm font-bold tabular" style={{ color }}>{value}{suffix}</span>
            </div>
            <div className="relative">
                <input type="range" min={min} max={max} value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, #1e2240 ${value}%, #1e2240 100%)`,
                        outline: 'none'
                    }} />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: '#3a4070' }}>
                <span>{min}{suffix}</span><span>{max}{suffix}</span>
            </div>
        </div>
    )
}

export default function PriceSimulator() {
    const [params, setParams] = useState({ basePrice: 1299, demand: 65, sentiment: 60, inventory: 50, competitorPrice: 1199 })
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState([])

    function set(key, val) { setParams(p => ({ ...p, [key]: val })) }

    async function calculate() {
        setLoading(true)
        const { data } = await axios.post('/api/pricing/calculate', params)
        setResult(data)
        setHistory(h => [{ ...data, ts: new Date().toLocaleTimeString() }, ...h.slice(0, 4)])
        setLoading(false)
    }

    const delta = result ? ((result.aiPrice - result.originalPrice) / result.originalPrice * 100).toFixed(1) : null

    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">⚡ Interactive Price Simulator</h2>
                <p className="text-sm mt-1" style={{ color: '#4a5580' }}>Drag sliders to see how AI recalculates price in real time</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Controls */}
                <div className="rounded-2xl p-6" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-semibold text-white mb-5">Simulation Parameters</div>

                    <Slider label="Customer Demand" value={params.demand} onChange={v => set('demand', v)} color="#6c63ff" />
                    <Slider label="Sentiment Score" value={params.sentiment} onChange={v => set('sentiment', v)} color="#10b981" />
                    <Slider label="Inventory Level" value={params.inventory} onChange={v => set('inventory', v)} color="#f59e0b" />

                    <div className="mb-5">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>Base Price (₹)</span>
                            <span className="text-sm font-bold tabular text-white">₹{params.basePrice.toLocaleString('en-IN')}</span>
                        </div>
                        <input type="number" value={params.basePrice} onChange={e => set('basePrice', +e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                            style={{ background: '#1a1e38', border: '1px solid #1e2240', fontFamily: 'Inter' }} />
                    </div>
                    <div className="mb-5">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>Competitor Price (₹)</span>
                            <span className="text-sm font-bold tabular text-white">₹{params.competitorPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <input type="number" value={params.competitorPrice} onChange={e => set('competitorPrice', +e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                            style={{ background: '#1a1e38', border: '1px solid #1e2240', fontFamily: 'Inter' }} />
                    </div>

                    <motion.button onClick={calculate} disabled={loading}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-xl font-semibold text-sm text-white"
                        style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 6px 25px rgba(108,99,255,0.4)' }}>
                        {loading ? '⏳ Calculating...' : '🤖 Calculate AI Price'}
                    </motion.button>
                </div>

                {/* Result */}
                <div className="flex flex-col gap-5">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div key="result"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="rounded-2xl p-6" style={{ background: '#0f1224', border: '1px solid rgba(108,99,255,0.3)' }}>
                                <div className="text-center mb-6">
                                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5580' }}>AI Computed Price</div>
                                    <motion.div key={result.aiPrice}
                                        initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        className="font-grotesk font-bold text-5xl" style={{ color: '#6c63ff' }}>
                                        ₹{Number(result.aiPrice).toLocaleString('en-IN')}
                                    </motion.div>
                                    <div className={`text-lg font-bold mt-2 ${parseFloat(delta) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {parseFloat(delta) >= 0 ? '▲' : '▼'} {Math.abs(delta)}% from ₹{Number(result.originalPrice).toLocaleString('en-IN')}
                                    </div>
                                </div>

                                {/* Factor breakdown */}
                                <div className="space-y-2">
                                    <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#4a5580' }}>AI Decision Factors</div>
                                    {result.factors.length === 0
                                        ? <div className="text-center py-4 text-sm" style={{ color: '#4a5580' }}>✅ Price is optimal — no adjustments needed</div>
                                        : result.factors.map((f, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                                className="flex items-center justify-between p-3 rounded-xl"
                                                style={{ background: 'rgba(30,34,64,0.4)' }}>
                                                <span className="text-sm text-white">{f.label}</span>
                                                <span className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                                                    style={{
                                                        background: f.color === 'green' ? 'rgba(16,185,129,0.15)' : f.color === 'red' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)',
                                                        color: f.color === 'green' ? '#10b981' : f.color === 'red' ? '#ef4444' : '#f59e0b'
                                                    }}>
                                                    {f.impact}
                                                </span>
                                            </motion.div>
                                        ))
                                    }
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="rounded-2xl p-8 text-center flex-1 flex flex-col items-center justify-center"
                                style={{ background: '#0f1224', border: '1px dashed #1e2240' }}>
                                <div className="text-5xl mb-4">🤖</div>
                                <div className="font-grotesk font-bold text-white mb-2">Ready to Simulate</div>
                                <div className="text-sm" style={{ color: '#4a5580' }}>Adjust the sliders and click "Calculate AI Price" to see the result</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Simulation history */}
                    {history.length > 0 && (
                        <div className="rounded-2xl p-4" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                            <div className="text-sm font-semibold text-white mb-3">📜 Simulation History</div>
                            <div className="space-y-2">
                                {history.map((h, i) => {
                                    const d = ((h.aiPrice - h.originalPrice) / h.originalPrice * 100).toFixed(1)
                                    return (
                                        <div key={i} className="flex items-center justify-between py-1.5"
                                            style={{ borderBottom: '1px solid rgba(30,34,64,0.5)' }}>
                                            <span className="text-xs" style={{ color: '#4a5580' }}>{h.ts}</span>
                                            <span className="text-xs text-slate-400">₹{Number(h.originalPrice).toLocaleString('en-IN')} → <span className="text-white font-semibold">₹{Number(h.aiPrice).toLocaleString('en-IN')}</span></span>
                                            <span className="text-xs font-bold" style={{ color: parseFloat(d) >= 0 ? '#10b981' : '#ef4444' }}>
                                                {parseFloat(d) >= 0 ? '+' : ''}{d}%
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
