import React, { useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const today = new Date().toISOString().slice(0, 10)
const STORAGE_KEY = 'wellbeing-tracker-records-v1'

const metricConfig = {
  water: { label: '喝水量', chartKey: '喝水量', kind: 'number', placeholder: '例如：今天上午喝得多，晚上偏少。' },
  food: { label: '吃饭内容', chartKey: '吃饭内容', kind: 'score', placeholder: '例如：三餐较规律，晚餐吃得少一些。' },
  body: { label: '身体情况', chartKey: '身体情况', kind: 'score', placeholder: '例如：今天有点累，肩颈发紧，整体还能接受。' },
  mood: { label: '情绪', chartKey: '情绪', kind: 'score', placeholder: '例如：整体平稳，下午有点烦躁，晚上恢复了。' },
  exercise: { label: '运动', chartKey: '运动', kind: 'score', placeholder: '例如：散步 40 分钟，强度不高，但有活动开。' },
}

const metricKeys = Object.keys(metricConfig)

const sampleEntry = {
  id: 1,
  date: today,
  waterAmount: '1500',
  waterScore: 7,
  waterNote: '今天喝水比较稳定，下午稍微少一点。',
  foodNote: '早餐鸡蛋牛奶，午餐米饭青菜鸡肉，晚餐较清淡。',
  foodScore: 8,
  bodyNote: '整体正常，下午有一点疲劳。',
  bodyScore: 6,
  moodNote: '心情平稳，没有明显波动。',
  moodScore: 7,
  exerciseNote: '晚饭后散步 30 分钟。',
  exerciseScore: 5,
}

function readStoredEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [sampleEntry]
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : [sampleEntry]
  } catch {
    return [sampleEntry]
  }
}

function ScoreSelector({ value, onChange }) {
  return (
    <div className="score-grid">
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          type="button"
          className={value === i ? 'score-btn active' : 'score-btn'}
          onClick={() => onChange(i)}
        >
          {i}
        </button>
      ))}
    </div>
  )
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="summary-card">
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
      {hint ? <div className="summary-hint">{hint}</div> : null}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="section-card">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

export default function App() {
  const [entries, setEntries] = useState(() => readStoredEntries())
  const [tab, setTab] = useState('record')
  const [selectedMetric, setSelectedMetric] = useState('mood')
  const [form, setForm] = useState({
    date: today,
    waterAmount: '',
    waterScore: 5,
    waterNote: '',
    foodNote: '',
    foodScore: 5,
    bodyNote: '',
    bodyScore: 5,
    moodNote: '',
    moodScore: 5,
    exerciseNote: '',
    exerciseScore: 5,
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [entries]
  )

  const averages = useMemo(() => {
    if (!entries.length) {
      return { water: 0, food: 0, body: 0, mood: 0, exercise: 0 }
    }
    return {
      water: Math.round(entries.reduce((sum, e) => sum + Number(e.waterAmount || 0), 0) / entries.length),
      food: (entries.reduce((sum, e) => sum + Number(e.foodScore || 0), 0) / entries.length).toFixed(1),
      body: (entries.reduce((sum, e) => sum + Number(e.bodyScore || 0), 0) / entries.length).toFixed(1),
      mood: (entries.reduce((sum, e) => sum + Number(e.moodScore || 0), 0) / entries.length).toFixed(1),
      exercise: (entries.reduce((sum, e) => sum + Number(e.exerciseScore || 0), 0) / entries.length).toFixed(1),
    }
  }, [entries])

  const trendData = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((entry) => ({
        date: entry.date.slice(5),
        喝水量: Number(entry.waterAmount || 0),
        吃饭内容: Number(entry.foodScore || 0),
        身体情况: Number(entry.bodyScore || 0),
        情绪: Number(entry.moodScore || 0),
        运动: Number(entry.exerciseScore || 0),
      }))
  }, [entries])

  const saveEntry = () => {
    const newEntry = {
      ...form,
      id: Date.now(),
      waterScore: Number(form.waterScore),
      foodScore: Number(form.foodScore),
      bodyScore: Number(form.bodyScore),
      moodScore: Number(form.moodScore),
      exerciseScore: Number(form.exerciseScore),
    }
    setEntries((prev) => [newEntry, ...prev])
    setForm({
      date: today,
      waterAmount: '',
      waterScore: 5,
      waterNote: '',
      foodNote: '',
      foodScore: 5,
      bodyNote: '',
      bodyScore: 5,
      moodNote: '',
      moodScore: 5,
      exerciseNote: '',
      exerciseScore: 5,
    })
    setTab('history')
  }

  const removeEntry = (id) => {
    setEntries((prev) => prev.filter((item) => item.id !== id))
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wellbeing-data-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (Array.isArray(parsed)) setEntries(parsed)
      } catch {
        alert('导入失败：文件格式不正确')
      }
    }
    reader.readAsText(file)
  }

  const selectedMetricLabel = metricConfig[selectedMetric].label
  const selectedDataKey = metricConfig[selectedMetric].chartKey

  return (
    <div className="app-shell">
      <div className="phone-wrap">
        <header className="hero-card">
          <div>
            <p className="eyebrow">极简每日自我记录</p>
            <h1>每日状态表</h1>
            <p className="hero-text">
              只记录 5 个核心项目：喝水量、吃饭内容、身体情况、情绪、运动。每项都可以写描述并打 0–10 分。
            </p>
          </div>
        </header>

        <div className="summary-grid">
          <SummaryCard label="总天数" value={entries.length} />
          <SummaryCard label="平均喝水" value={`${averages.water} ml`} />
          <SummaryCard label="平均情绪" value={averages.mood} hint="0–10 分" />
          <SummaryCard label="平均运动" value={averages.exercise} hint="0–10 分" />
        </div>

        <div className="tab-bar">
          <button className={tab === 'record' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('record')}>每日填写</button>
          <button className={tab === 'history' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('history')}>历史记录</button>
          <button className={tab === 'trend' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('trend')}>分类变化</button>
        </div>

        {tab === 'record' && (
          <div className="stack">
            <Section title="日期">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Section>

            <Section title="喝水量">
              <label>喝了多少水（ml）</label>
              <input
                type="number"
                placeholder="例如 1500"
                value={form.waterAmount}
                onChange={(e) => setForm({ ...form, waterAmount: e.target.value })}
              />
              <label>自我描述</label>
              <textarea
                placeholder={metricConfig.water.placeholder}
                value={form.waterNote}
                onChange={(e) => setForm({ ...form, waterNote: e.target.value })}
              />
              <label>评分（0–10）</label>
              <ScoreSelector value={form.waterScore} onChange={(v) => setForm({ ...form, waterScore: v })} />
            </Section>

            <Section title="吃饭内容">
              <label>自我描述</label>
              <textarea
                placeholder={metricConfig.food.placeholder}
                value={form.foodNote}
                onChange={(e) => setForm({ ...form, foodNote: e.target.value })}
              />
              <label>评分（0–10）</label>
              <ScoreSelector value={form.foodScore} onChange={(v) => setForm({ ...form, foodScore: v })} />
            </Section>

            <Section title="身体情况">
              <label>自我描述</label>
              <textarea
                placeholder={metricConfig.body.placeholder}
                value={form.bodyNote}
                onChange={(e) => setForm({ ...form, bodyNote: e.target.value })}
              />
              <label>评分（0–10）</label>
              <ScoreSelector value={form.bodyScore} onChange={(v) => setForm({ ...form, bodyScore: v })} />
            </Section>

            <Section title="情绪">
              <label>自我描述</label>
              <textarea
                placeholder={metricConfig.mood.placeholder}
                value={form.moodNote}
                onChange={(e) => setForm({ ...form, moodNote: e.target.value })}
              />
              <label>评分（0–10）</label>
              <ScoreSelector value={form.moodScore} onChange={(v) => setForm({ ...form, moodScore: v })} />
            </Section>

            <Section title="运动">
              <label>自我描述</label>
              <textarea
                placeholder={metricConfig.exercise.placeholder}
                value={form.exerciseNote}
                onChange={(e) => setForm({ ...form, exerciseNote: e.target.value })}
              />
              <label>评分（0–10）</label>
              <ScoreSelector value={form.exerciseScore} onChange={(v) => setForm({ ...form, exerciseScore: v })} />
            </Section>

            <button className="primary-btn" onClick={saveEntry}>保存这一天</button>
          </div>
        )}

        {tab === 'history' && (
          <div className="stack">
            <div className="toolbar">
              <button className="secondary-btn" onClick={exportData}>导出数据</button>
              <label className="secondary-btn file-btn">
                导入数据
                <input type="file" accept="application/json" onChange={importData} />
              </label>
            </div>
            {sortedEntries.map((entry) => (
              <article className="entry-card" key={entry.id}>
                <div className="entry-header">
                  <h3>{entry.date}</h3>
                  <button className="danger-btn" onClick={() => removeEntry(entry.id)}>删除</button>
                </div>
                <div className="entry-block"><strong>喝水量</strong><span>{entry.waterAmount || 0} ml · {entry.waterScore}/10</span><p>{entry.waterNote || '暂无描述'}</p></div>
                <div className="entry-block"><strong>吃饭内容</strong><span>{entry.foodScore}/10</span><p>{entry.foodNote || '暂无描述'}</p></div>
                <div className="entry-block"><strong>身体情况</strong><span>{entry.bodyScore}/10</span><p>{entry.bodyNote || '暂无描述'}</p></div>
                <div className="entry-block"><strong>情绪</strong><span>{entry.moodScore}/10</span><p>{entry.moodNote || '暂无描述'}</p></div>
                <div className="entry-block"><strong>运动</strong><span>{entry.exerciseScore}/10</span><p>{entry.exerciseNote || '暂无描述'}</p></div>
              </article>
            ))}
          </div>
        )}

        {tab === 'trend' && (
          <div className="stack">
            <section className="section-card">
              <h3>按单项查看长期变化</h3>
              <div className="metric-switcher">
                {metricKeys.map((key) => (
                  <button
                    key={key}
                    className={selectedMetric === key ? 'metric-btn active' : 'metric-btn'}
                    onClick={() => setSelectedMetric(key)}
                  >
                    {metricConfig[key].label}
                  </button>
                ))}
              </div>
              <div className="chart-card">
                <div className="chart-title">当前查看：{selectedMetricLabel}</div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={selectedMetric === 'water' ? [0, 'auto'] : [0, 10]} />
                      <Tooltip />
                      <Line type="monotone" dataKey={selectedDataKey} strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {sortedEntries.map((entry) => {
              const scoreMap = {
                water: entry.waterScore,
                food: entry.foodScore,
                body: entry.bodyScore,
                mood: entry.moodScore,
                exercise: entry.exerciseScore,
              }
              const noteMap = {
                water: `${entry.waterAmount || 0} ml · ${entry.waterNote || ''}`,
                food: entry.foodNote,
                body: entry.bodyNote,
                mood: entry.moodNote,
                exercise: entry.exerciseNote,
              }
              return (
                <article className="entry-card compact" key={entry.id}>
                  <div className="entry-header">
                    <h3>{entry.date}</h3>
                    <span className="badge">{scoreMap[selectedMetric]}/10</span>
                  </div>
                  <p>{noteMap[selectedMetric] || '暂无描述'}</p>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
