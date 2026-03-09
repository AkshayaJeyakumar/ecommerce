import { useState } from 'react'
import { motion } from 'framer-motion'

const steps = [
    { id: 1, icon: '🛒', label: 'Customer Request', sub: 'User visits product page', color: '#6c63ff' },
    { id: 2, icon: '📡', label: 'Data Collection', sub: 'Gather demand, reviews, inventory', color: '#0ea5e9' },
    { id: 3, icon: '💬', label: 'Sentiment Analysis', sub: 'NLP classifies reviews', color: '#f59e0b' },
    { id: 4, icon: '📊', label: 'Demand Analysis', sub: 'Evaluate purchase patterns', color: '#10b981' },
    { id: 5, icon: '🤖', label: 'AI Computation', sub: 'Algorithm calculates optimal price', color: '#6c63ff' },
    { id: 6, icon: '✅', label: 'Price Update', sub: 'Database price is updated', color: '#10b981' },
    { id: 7, icon: '🏷️', label: 'Display to Customer', sub: 'Customer sees AI-adjusted price', color: '#f43f5e' },
]

const futureModules = [
    { icon: '🔮', title: 'AI Demand Prediction', desc: 'Uses historical sales and seasonal data to forecast demand 30 days ahead with 94% accuracy.', status: 'Q2 2026', color: '#6c63ff' },
    { icon: '📦', title: 'AI Inventory Forecasting', desc: 'Predicts stock depletion and auto-triggers reorder points to prevent stockouts.', status: 'Q3 2026', color: '#0ea5e9' },
    { icon: '🕵️', title: 'AI Competitor Intelligence', desc: 'Crawls competitor sites in real-time to detect price changes and adjust strategy instantly.', status: 'Q4 2026', color: '#10b981' },
]

export default function Workflow() {
    const [activeStep, setActiveStep] = useState(null)
    const [running, setRunning] = useState(false)
    const [completed, setCompleted] = useState([])

    async function runAnimation() {
        setRunning(true)
        setCompleted([])
        setActiveStep(null)
        for (let i = 0; i < steps.length; i++) {
            setActiveStep(steps[i].id)
            await new Promise(r => setTimeout(r, 700))
            setCompleted(c => [...c, steps[i].id])
        }
        setActiveStep(null)
        setRunning(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-grotesk font-bold text-xl text-white">Workflow Visualizer</h2>
                    <p className="text-sm mt-1" style={{ color: '#4a5580' }}>End-to-end AI pricing system pipeline</p>
                </div>
                <motion.button onClick={runAnimation} disabled={running}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 6px 20px rgba(108,99,255,0.4)' }}>
                    {running
                        ? <><span className="animate-spin inline-block">⚙️</span> Simulating...</>
                        : '▶ Animate AI Workflow'}
                </motion.button>
            </div>

            {/* Vertical flow on mobile, horizontal on desktop */}
            <div className="rounded-2xl p-6" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-semibold text-white mb-6 text-center">AI Dynamic Pricing System Pipeline</div>

                {/* Desktop: horizontal */}
                <div className="hidden lg:flex items-center justify-between overflow-x-auto pb-2">
                    {steps.map((step, i) => (
                        <div key={step.id} className="flex items-center">
                            {/* Step */}
                            <motion.div
                                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                                className="flex flex-col items-center gap-2 cursor-pointer"
                                style={{ minWidth: 110 }}>
                                <motion.div
                                    animate={activeStep === step.id ? { scale: 1.2, boxShadow: `0 0 30px ${step.color}60` }
                                        : completed.includes(step.id) ? { scale: 1.05 } : { scale: 1 }}
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all"
                                    style={{
                                        background: completed.includes(step.id) ? `${step.color}25` : activeStep === step.id ? `${step.color}30` : '#1e2240',
                                        border: `2px solid ${completed.includes(step.id) || activeStep === step.id ? step.color : '#2e3254'}`
                                    }}>
                                    {completed.includes(step.id) ? '✅' : step.icon}
                                </motion.div>
                                <div className="text-center">
                                    <div className="text-xs font-semibold text-white leading-tight">{step.label}</div>
                                    <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>{step.sub}</div>
                                </div>
                                <div className="text-xs font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: `${step.color}15`, color: step.color }}>
                                    Step {step.id}
                                </div>
                            </motion.div>

                            {/* Arrow */}
                            {i < steps.length - 1 && (
                                <motion.div className="flex items-center mx-1"
                                    animate={completed.length > i ? { opacity: 1 } : { opacity: 0.2 }}>
                                    <div className="h-0.5 w-8" style={{ background: completed.length > i ? step.color : '#2e3254' }} />
                                    <div className="text-xs" style={{ color: completed.length > i ? step.color : '#2e3254' }}>▶</div>
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Mobile: vertical */}
                <div className="flex lg:hidden flex-col items-center gap-0">
                    {steps.map((step, i) => (
                        <div key={step.id} className="flex flex-col items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-4 w-full max-w-xs p-3 rounded-xl"
                                style={{
                                    background: completed.includes(step.id) ? `${step.color}10` : 'rgba(30,34,64,0.3)',
                                    border: `1px solid ${completed.includes(step.id) ? step.color : '#1e2240'}`
                                }}>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                                    style={{ background: `${step.color}20` }}>
                                    {completed.includes(step.id) ? '✅' : step.icon}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">{step.label}</div>
                                    <div className="text-xs" style={{ color: '#4a5580' }}>{step.sub}</div>
                                </div>
                            </motion.div>
                            {i < steps.length - 1 && (
                                <div className="flex flex-col items-center py-1">
                                    <motion.div className="w-0.5 h-6" style={{ background: completed.length > i ? step.color : '#2e3254' }}
                                        animate={completed.length > i ? { opacity: 1 } : { opacity: 0.3 }} />
                                    <div style={{ color: completed.length > i ? step.color : '#2e3254', fontSize: 10 }}>▼</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Segments explanation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { title: 'Input Layer', icon: '📥', items: ['Customer browsing data', 'Purchase history', 'Review sentiment', 'Competitor prices'], color: '#0ea5e9' },
                    { title: 'AI Engine', icon: '🧠', items: ['Demand scoring (ML)', 'Sentiment NLP', 'Price elasticity model', 'Revenue optimizer'], color: '#6c63ff' },
                    { title: 'Output Layer', icon: '📤', items: ['Optimal price computed', 'Database updated', 'Customer shown new price', 'Revenue maximized'], color: '#10b981' },
                ].map((box, i) => (
                    <motion.div key={box.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}
                        className="rounded-2xl p-5" style={{ background: '#0f1224', border: `1px solid ${box.color}30` }}>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">{box.icon}</span>
                            <span className="font-grotesk font-bold text-white">{box.title}</span>
                        </div>
                        <ul className="space-y-2">
                            {box.items.map(item => (
                                <li key={item} className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: box.color }} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>

            {/* Future AI Modules */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-bold text-white mb-4">🚀 Future AI Modules (Roadmap)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {futureModules.map((m, i) => (
                        <motion.div key={m.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="p-4 rounded-xl relative overflow-hidden"
                            style={{ background: `${m.color}08`, border: `1px solid ${m.color}25` }}>
                            <div className="text-2xl mb-2">{m.icon}</div>
                            <div className="font-semibold text-sm text-white mb-1">{m.title}</div>
                            <div className="text-xs leading-relaxed mb-3" style={{ color: '#94a3b8' }}>{m.desc}</div>
                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                                style={{ background: `${m.color}15`, color: m.color }}>
                                🗓 {m.status}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
