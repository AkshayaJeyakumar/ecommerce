import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend, Filler } from 'chart.js'
import axios from 'axios'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend, Filler)

const chartDefaults = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#6b7280', font: { size: 11 } } } } }

function StatCard({ icon, label, value, sub, color, delay }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ background: `${color}20` }}>
                {icon}
            </div>
            <div className="font-grotesk font-bold text-2xl text-white tabular">{value}</div>
            <div className="text-xs mt-1" style={{ color: '#4a5580' }}>{label}</div>
            <div className="text-xs mt-2 font-semibold" style={{ color }}>{sub}</div>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" style={{ background: color, transform: 'translate(30%,-30%)' }} />
        </motion.div>
    )
}

export default function Dashboard() {
    const [analytics, setAnalytics] = useState(null)
    const [products, setProducts] = useState([])
    const [aiRunning, setAiRunning] = useState(false)

    useEffect(() => {
        axios.get('/api/analytics').then(r => setAnalytics(r.data))
        axios.get('/api/products').then(r => setProducts(r.data))
    }, [])

    async function runAI() {
        setAiRunning(true)
        await axios.post('/api/pricing/simulate')
        const r = await axios.get('/api/products')
        setProducts(r.data)
        setAiRunning(false)
    }

    const weeks = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const revenueData = {
        labels: weeks,
        datasets: [{
            label: 'Revenue (₹)',
            data: analytics?.weeklyRevenue || [],
            fill: true,
            borderColor: '#6c63ff',
            backgroundColor: 'rgba(108,99,255,0.08)',
            tension: 0.4,
            pointBackgroundColor: '#6c63ff',
            pointRadius: 4,
        }]
    }

    const demandData = {
        labels: months,
        datasets: [{
            label: 'Demand %',
            data: analytics?.demandTrend || [],
            fill: true,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.08)',
            tension: 0.4,
            pointRadius: 3,
        }]
    }

    const categoryData = {
        labels: Object.keys(analytics?.revenueByCategory || {}),
        datasets: [{
            data: Object.values(analytics?.revenueByCategory || {}),
            backgroundColor: ['#6c63ff', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'],
            borderWidth: 0,
        }]
    }

    const avgDemand = products.length ? Math.round(products.reduce((s, p) => s + p.demand, 0) / products.length) : 0
    const avgSentiment = products.length ? Math.round(products.reduce((s, p) => s + (p.sentimentScore || p.sentiment || 0), 0) / products.length) : 0

    return (
        <div>
            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="font-grotesk font-bold text-xl text-white">Platform Overview</h2>
                    <p className="text-sm mt-1" style={{ color: '#4a5580' }}>March 2026 · AI-powered pricing dashboard</p>
                </div>
                <div className="text-right">
                    <motion.button onClick={runAI} disabled={aiRunning}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 6px 20px rgba(108,99,255,0.35)' }}>
                        {aiRunning ? <><span className="animate-spin">⚙️</span> Running AI...</> : '🤖 Run AI Simulation'}
                    </motion.button>
                    <p className="text-xs mt-1.5" style={{ color: '#4a5580' }}>
                        Recalculates all product prices using demand, sentiment &amp; competitor data
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon="📦" label="Total Products" value={products.length} sub="↑ 2 added this week" color="#6c63ff" delay={0} />
                <StatCard icon="💰" label="Total Revenue" value="₹11.28L" sub="↑ 18.4% vs last week" color="#10b981" delay={0.06} />
                <StatCard icon="📈" label="Avg Demand" value={`${avgDemand}%`} sub="↑ High across Electronics" color="#f59e0b" delay={0.12} />
                <StatCard icon="💬" label="Sentiment Score" value={`${avgSentiment}%`} sub="↑ Mostly Positive" color="#0ea5e9" delay={0.18} />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
                <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-grotesk font-bold text-white">Revenue Trend</span>
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>This Week</span>
                    </div>
                    <div style={{ height: 200 }}><Line data={revenueData} options={{ ...chartDefaults, scales: { x: { ticks: { color: '#4a5580' }, grid: { color: '#1e2240' } }, y: { ticks: { color: '#4a5580' }, grid: { color: '#1e2240' } } } }} /></div>
                </div>
                <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-bold text-white mb-4">Revenue by Category</div>
                    <div style={{ height: 200 }}><Doughnut data={categoryData} options={{ ...chartDefaults, cutout: '70%' }} /></div>
                </div>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-bold text-white mb-4">Demand Forecast (12 months)</div>
                    <div style={{ height: 180 }}><Line data={demandData} options={{ ...chartDefaults, scales: { x: { ticks: { color: '#4a5580' }, grid: { color: '#1e2240' } }, y: { ticks: { color: '#4a5580' }, grid: { color: '#1e2240' } } } }} /></div>
                </div>

                {/* Product price table */}
                <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-bold text-white mb-4">Live AI Prices</div>
                    <div className="space-y-2">
                        {products.slice(0, 5).map(p => {
                            const delta = ((p.aiPrice - p.basePrice) / p.basePrice * 100).toFixed(1)
                            const up = parseFloat(delta) >= 0
                            return (
                                <div key={p.id} className="flex items-center justify-between py-2"
                                    style={{ borderBottom: '1px solid rgba(30,34,64,0.5)' }}>
                                    <span className="text-sm text-slate-300 truncate flex-1">{p.name}</span>
                                    <span className="text-sm font-semibold text-white mr-3">₹{Number(p.aiPrice).toLocaleString('en-IN')}</span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: up ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                                            color: up ? '#10b981' : '#ef4444'
                                        }}>
                                        {up ? '+' : ''}{delta}%
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* AI Activity feed */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-bold text-white mb-4">🤖 AI Activity Feed</div>
                <div className="space-y-3">
                    {[
                        { icon: '📈', msg: '4K Gaming Monitor price increased +8% due to high demand (91%)', t: 'Just now', c: '#6c63ff' },
                        { icon: '💬', msg: 'Positive sentiment surge on Noise Cancelling Earbuds — price adjusted +3%', t: '3m ago', c: '#10b981' },
                        { icon: '🔍', msg: 'Competitor TechZone dropped Fitness Watch to ₹14,999 — AI matched', t: '12m ago', c: '#f59e0b' },
                        { icon: '📉', msg: 'Mechanical Keyboard low demand — AI applied -7% discount', t: '28m ago', c: '#ef4444' },
                    ].map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                            className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(30,34,64,0.3)' }}>
                            <span className="text-lg">{item.icon}</span>
                            <div className="flex-1">
                                <div className="text-sm text-slate-300">{item.msg}</div>
                                <div className="text-xs mt-1" style={{ color: '#4a5580' }}>{item.t}</div>
                            </div>
                            <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: item.c }} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
