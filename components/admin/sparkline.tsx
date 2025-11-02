'use client';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ data, width = 200, height = 40, color = '#3b82f6' }: SparklineProps) {
  if (!data || data.length === 0) return null;

  // Ensure all values are numbers
  const numericData = data.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (numericData.length === 0) return null;

  const min = Math.min(...numericData);
  const max = Math.max(...numericData);
  const range = max - min || 1;

  const points = numericData.map((value, index) => {
    const x = numericData.length > 1 ? (index / (numericData.length - 1)) * width : width / 2;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  if (!points) return null;

  return (
    <svg width={width} height={height} className="overflow-visible" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

