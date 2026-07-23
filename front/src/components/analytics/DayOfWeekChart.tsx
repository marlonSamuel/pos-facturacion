import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#ff4d4f', '#13c2c2', '#eb2f96'];

interface Props {
  data: { dia: string; ventas: number; documentos: number }[];
}

const f = (v: number) => `Q${v.toFixed(2)}`;

export const DayOfWeekChart = ({ data }: Props) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Q${(v / 1000).toFixed(0)}k`} />
      <Tooltip formatter={(value: any) => [f(value), 'Ventas']} />
      <Bar dataKey="ventas" radius={[3, 3, 0, 0]} maxBarSize={30}>
        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);
