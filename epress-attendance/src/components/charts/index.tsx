import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS = ['#10367D', '#74B4D9', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

const tooltipStyle = {
  contentStyle: {
    background: '#fff',
    border: '1px solid #E8E8E8',
    borderRadius: '12px',
    boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.08)',
    fontSize: '13px',
  },
};

export function CustomLineChart({ data, lines, height = 300 }: {
  data: any[];
  lines: { key: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CustomBarChart({ data, bars, height = 300 }: {
  data: any[];
  bars: { key: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CustomPieChart({ data, height = 300 }: {
  data: { name: string; value: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CustomAreaChart({ data, areas, height = 300 }: {
  data: any[];
  areas: { key: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        {areas.map((a) => (
          <Area key={a.key} type="monotone" dataKey={a.key} stroke={a.color} fill={a.color} fillOpacity={0.1} strokeWidth={2} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
