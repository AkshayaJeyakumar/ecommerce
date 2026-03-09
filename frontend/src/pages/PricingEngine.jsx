import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import axios from 'axios'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const COLORS = { purple: '#6c63ff', green: '#10b981', yellow: '#f59e0b', blue: '#0ea5e9', red: '#ef4444' }

export default function PricingEngine() {
    const [products, setProducts] = useState([])
    const [rules, setRules] = useState([])
    const [running, setRunning] = useState(false)
    const [selected, setSelected] = useState(0)

    useEffect(() => {
        axios.get('/api/products').then(r => setProducts(r.data))
        axios.get('/api/pricing/rules').then(r => setRules(r.data))
    }, [])

    async function runSimulation() {
        setRunning(true)
        await axios.post('/api/pricing/simulate')
        const r = await axios.get('/api/products')
        setProducts(r.data)
        setRunning(false)
    }

    async function toggleRule(rule) {
        const updated = { ...rule, active: !rule.active }
        await axios.put(`/api/pricing/rules/${rule.id}`, updated)
        setRules(r => r.map(x => x.id === rule.id ? updated : x))
    }

    const current = products[selected]

    // priceHistory entries can be {price, date} objects (MongoDB) or plain numbers
    const extractPrice = (h) => (typeof h === 'object' && h !== null) ? (h.price ?? 0) : h

    const chartData = current ? {
        labels: current.priceHistory.map((_, i) => `T-${current.priceHistory.length - 1 - i}`).reverse(),
        datasets: [{
            label: 'AI Price (₹)',
            data: current.priceHistory.map(extractPrice),
            borderColor: '#6c63ff',
            backgroundColor: 'rgba(108,99,255,0.08)',
            fill: true, tension: 0.4, pointRadius: 4,
            pointBackgroundColor: '#6c63ff'
        }]
    } : null

    const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

    const getFactorBadge = (p) => {
        const badges = []
        const priceUp = p.aiPrice >= p.basePrice
        if (p.demand > 80 && priceUp) badges.push({ label: 'High Demand ↑', color: '#10b981' })
        if (p.demand > 80 && !priceUp) badges.push({ label: 'Competitor Driven ↓', color: '#f59e0b' })
        if (p.demand < 40) badges.push({ label: 'Low Demand ↓', color: '#ef4444' })
        if ((p.stock || p.inventory || 999) < 20) badges.push({ label: 'Low Stock', color: '#f59e0b' })
        if ((p.sentimentScore || 100) >= 75 && priceUp) badges.push({ label: 'High Sentiment', color: '#0ea5e9' })
        if ((p.sentimentScore || 100) < 50) badges.push({ label: 'Low Sentiment', color: '#f43f5e' })
        if (badges.length === 0) badges.push({ label: priceUp ? 'Moderate Demand' : 'Price Optimised', color: '#6c63ff' })
        return badges
    }

    return (
        <div className="space-y-5">
            {/* Top controls */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-grotesk font-bold text-xl text-white">AI Pricing Engine</h2>
                    <p className="text-sm mt-1" style={{ color: '#4a5580' }}>Real-time algorithmic pricing powered by demand, sentiment & competition</p>
                </div>
                <motion.button onClick={runSimulation} disabled={running}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 6px 20px rgba(108,99,255,0.4)' }}>
                    {running
                        ? <><span className="animate-spin inline-block">⚙️</span> Processing...</>
                        : '🤖 Run AI Price Update'}
                </motion.button>
            </div>

            {/* Algorithm explanation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: '📈', label: 'High Demand', desc: 'Demand > 80%', action: 'Price +8%', color: COLORS.green },
                    { icon: '📉', label: 'Low Demand', desc: 'Demand < 40%', action: 'Price -7%', color: COLORS.red },
                    { icon: '📦', label: 'Low Stock', desc: 'Stock < 20', action: 'Price +5%', color: COLORS.yellow },
                    { icon: '🔍', label: 'Competitor', desc: 'Price >110%', action: 'Match rival', color: COLORS.blue },
                ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="rounded-2xl p-4" style={{ background: '#0f1224', border: `1px solid ${item.color}25` }}>
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <div className="font-semibold text-sm text-white">{item.label}</div>
                        <div className="text-xs mt-1" style={{ color: '#4a5580' }}>{item.desc}</div>
                        <div className="text-xs mt-2 font-bold" style={{ color: item.color }}>{item.action}</div>
                    </motion.div>
                ))}
            </div>

            {/* Product selector + chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Products list */}
                <div className="rounded-2xl p-4" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-semibold text-sm text-white mb-3">Select Product</div>
                    <div className="space-y-2">
                        {products.map((p, i) => {
                            const delta = ((p.aiPrice - p.basePrice) / p.basePrice * 100).toFixed(1)
                            const up = parseFloat(delta) >= 0
                            return (
                                <button key={p.id} onClick={() => setSelected(i)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all"
                                    style={selected === i
                                        ? { background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)' }
                                        : { background: 'rgba(30,34,64,0.3)', border: '1px solid transparent' }}>
                                    <span className="text-xs text-white font-medium truncate flex-1 mr-2">{p.name}</span>
                                    <span className="text-xs font-bold shrink-0"
                                        style={{ color: up ? '#10b981' : '#ef4444' }}>
                                        {up ? '+' : ''}{delta}%
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Price history chart */}
                <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    {current && (
                        <>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="font-grotesk font-bold text-white text-base">{current.name}</div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-xs" style={{ color: '#4a5580' }}>Base: <span className="text-white">{fmt(current.basePrice)}</span></span>
                                        <span className="text-xs" style={{ color: '#4a5580' }}>AI: <span className="font-bold" style={{ color: '#6c63ff' }}>{fmt(current.aiPrice)}</span></span>
                                        <span className="text-xs" style={{ color: '#4a5580' }}>Competitor: <span className="text-white">{fmt(current.competitorPrice)}</span></span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {getFactorBadge(current).map(b => (
                                        <span key={b.label} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                            style={{ background: `${b.color}15`, color: b.color }}>
                                            {b.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ height: 220 }}>
                                <Line data={chartData} options={{
                                    responsive: true, maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { ticks: { color: '#4a5580', font: { size: 10 } }, grid: { color: '#1e2240' } },
                                        y: { ticks: { color: '#4a5580', font: { size: 10 } }, grid: { color: '#1e2240' } }
                                    }
                                }} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Pricing rules */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-bold text-white mb-4">⚙️ Active Pricing Rules</div>
                <div className="space-y-3">
                    {rules.map((rule, i) => (
                        <motion.div key={rule.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-xl"
                            style={{ background: 'rgba(30,34,64,0.3)', border: '1px solid #1e2240' }}>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white">{rule.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                        background: rule.active ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                                        color: rule.active ? '#10b981' : '#6b7280'
                                    }}>
                                        {rule.active ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                                <div className="text-xs mt-1" style={{ color: '#4a5580' }}>{rule.description}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold" style={{ color: rule.direction === 'decrease' ? '#ef4444' : '#10b981' }}>
                                    {rule.direction === 'decrease' ? '-' : '+'}{rule.adjustment}%
                                </span>
                                <button onClick={() => toggleRule(rule)}
                                    className="relative w-11 h-6 rounded-full transition-all duration-300"
                                    style={{ background: rule.active ? '#6c63ff' : '#1e2240' }}>
                                    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow"
                                        style={{ left: rule.active ? '1.25rem' : '0.125rem' }} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
