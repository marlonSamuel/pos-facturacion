import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const COLORS = ['#1890ff', '#52c41a', '#722ed1', '#faad14', '#ff4d4f'];
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

interface Props {
  data: any[];
  height?: number;
  bars: { dataKey: string; name: string; color: string }[];
}

export const ReportCharts = ({ data, height = 300, bars }: Props) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      <XAxis dataKey="mes" tickFormatter={(v: number) => MONTHS[v - 1] || ''} tick={{ fontSize: 12 }} />
      <YAxis tickFormatter={(v: number) => `Q${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
      <Tooltip formatter={(value: any) => [`Q${Number(value).toFixed(2)}`, '']} />
      {bars.map((b, i) => (
        <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} radius={[4,4,0,0]} maxBarSize={20}>
          {data.map((_: any, j: number) => <Cell key={j} fill={b.color || COLORS[i % COLORS.length]} />)}
        </Bar>
      ))}
    </BarChart>
  </ResponsiveContainer>
);
