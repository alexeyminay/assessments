const SIZE = 300
const CX = SIZE / 2
const CY = SIZE / 2
const R = 95
const LABEL_R = R + 26

function angle(i: number, n: number) {
  return -Math.PI / 2 + (2 * Math.PI * i) / n
}

function pt(a: number, r: number): string {
  return `${(CX + r * Math.cos(a)).toFixed(2)},${(CY + r * Math.sin(a)).toFixed(2)}`
}

function xy(a: number, r: number): [number, number] {
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
}

function truncate(s: string, max = 15) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

interface RadarChartProps {
  labels: string[]
  values: number[]  // 0-1
}

export function RadarChart({ labels, values }: RadarChartProps) {
  const n = labels.length
  if (n < 2) return null

  const angles = Array.from({ length: n }, (_, i) => angle(i, n))
  const grids  = [0.25, 0.5, 0.75, 1.0]

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      {/* Grid polygons */}
      {grids.map(level => (
        <polygon
          key={level}
          points={angles.map(a => pt(a, R * level)).join(' ')}
          fill="none"
          stroke={level === 1 ? '#d1d5db' : '#e5e7eb'}
          strokeWidth={level === 1 ? 1.5 : 1}
        />
      ))}

      {/* Axis lines */}
      {angles.map((a, i) => {
        const [x, y] = xy(a, R)
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />
      })}

      {/* Value polygon */}
      <polygon
        points={angles.map((a, i) => pt(a, R * Math.max(0.015, values[i]))).join(' ')}
        fill="rgba(17,17,17,0.10)"
        stroke="#111111"
        strokeWidth="1.5"
      />

      {/* Value dots */}
      {angles.map((a, i) => {
        const [x, y] = xy(a, R * Math.max(0.015, values[i]))
        return <circle key={i} cx={x} cy={y} r="3" fill="#111111" />
      })}

      {/* Labels */}
      {angles.map((a, i) => {
        const [lx, ly] = xy(a, LABEL_R)
        const anchor   = lx < CX - 6 ? 'end' : lx > CX + 6 ? 'start' : 'middle'
        const baseline = ly < CY - 6 ? 'auto' : ly > CY + 6 ? 'hanging' : 'middle'
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            fontSize="10.5"
            fontWeight="500"
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
