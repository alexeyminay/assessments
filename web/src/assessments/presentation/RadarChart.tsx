// Wide SVG so all axis labels fit inside the viewport without overflow
const W = 380
const H = 290
const CX = 188
const CY = 145
const R  = 84
const LABEL_R = 112

export interface RadarColor {
  fill:   string
  stroke: string
  dot:    string
}

export const RADAR_COLORS: RadarColor[] = [
  { fill: 'rgba(147,197,253,0.28)', stroke: '#3b82f6', dot: '#3b82f6' },
  { fill: 'rgba(134,239,172,0.28)', stroke: '#16a34a', dot: '#16a34a' },
  { fill: 'rgba(196,181,253,0.28)', stroke: '#7c3aed', dot: '#7c3aed' },
  { fill: 'rgba(253,164,175,0.28)', stroke: '#e11d48', dot: '#e11d48' },
  { fill: 'rgba(251,191, 36,0.28)', stroke: '#d97706', dot: '#d97706' },
  { fill: 'rgba( 45,212,191,0.28)', stroke: '#0d9488', dot: '#0d9488' },
]

function angle(i: number, n: number) {
  return -Math.PI / 2 + (2 * Math.PI * i) / n
}

function pt(a: number, r: number): string {
  return `${(CX + r * Math.cos(a)).toFixed(2)},${(CY + r * Math.sin(a)).toFixed(2)}`
}

function xy(a: number, r: number): [number, number] {
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
}

function truncate(s: string, max = 13) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

interface RadarChartProps {
  labels: string[]
  values: number[]    // 0–1
  color:  RadarColor
}

export function RadarChart({ labels, values, color }: RadarChartProps) {
  const n = labels.length
  if (n < 2) return null

  const angles = Array.from({ length: n }, (_, i) => angle(i, n))
  const outerPoints = angles.map(a => pt(a, R)).join(' ')

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ flexShrink: 0, display: 'block' }}
    >
      {/* White background for the radar area */}
      <polygon points={outerPoints} fill="rgba(255,255,255,0.95)" />

      {/* Dashed inner grid rings at 25 / 50 / 75 % */}
      {[0.25, 0.5, 0.75].map(level => (
        <polygon
          key={level}
          points={angles.map(a => pt(a, R * level)).join(' ')}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="0.75"
          strokeDasharray="3,3"
        />
      ))}

      {/* Solid outer boundary */}
      <polygon
        points={outerPoints}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.75"
      />

      {/* Axis lines */}
      {angles.map((a, i) => {
        const [x, y] = xy(a, R)
        return (
          <line key={i} x1={CX} y1={CY} x2={x} y2={y}
            stroke="#e5e7eb" strokeWidth="0.75" />
        )
      })}

      {/* Value polygon */}
      <polygon
        points={angles.map((a, i) => pt(a, R * Math.max(0.02, values[i]))).join(' ')}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Value dots */}
      {angles.map((a, i) => {
        const [x, y] = xy(a, R * Math.max(0.02, values[i]))
        return (
          <circle key={i} cx={x} cy={y} r="4"
            fill={color.dot}
            stroke="#fff"
            strokeWidth="1.5"
          />
        )
      })}

      {/* Axis labels — inside SVG viewport */}
      {angles.map((a, i) => {
        const [lx, ly] = xy(a, LABEL_R)
        const anchor   = lx < CX - 8 ? 'end' : lx > CX + 8 ? 'start' : 'middle'
        const baseline = ly < CY - 8 ? 'auto' : ly > CY + 8 ? 'hanging' : 'middle'
        return (
          <text key={i}
            x={lx} y={ly}
            fontSize="10" fontWeight="600"
            fill="#374151"
            textAnchor={anchor}
            dominantBaseline={baseline}
          >
            {truncate(labels[i])}
          </text>
        )
      })}
    </svg>
  )
}
