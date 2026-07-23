import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Props {
  data: { dia: string; actual: number; anterior: number }[];
}

const f = (v: number) => `Q${v.toFixed(2)}`;

export const DailyComparisonChart = ({ data }: Props) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Q${(v / 1000).toFixed(0)}k`} />
      <Tooltip formatter={(value: any, name: any) => [f(value), name === 'actual' ? 'Este período' : 'Período anterior']} />
      <Bar dataKey="anterior" fill="#d9d9d9" radius={[3, 3, 0, 0]} maxBarSize={20} name="anterior" />
      <Bar dataKey="actual" fill="#1677ff" radius={[3, 3, 0, 0]} maxBarSize={20} name="actual" />
    </BarChart>
  </ResponsiveContainer>
);
