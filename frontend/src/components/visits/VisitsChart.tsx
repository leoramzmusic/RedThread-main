import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface DailyStat {
  date: string;
  count: number;
}

interface VisitsChartProps {
  data: DailyStat[];
}

export default function VisitsChart({ data }: VisitsChartProps) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => format(new Date(v), 'd/M')}
          tick={{ fontSize: 11 }}
          interval={1}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip
          labelFormatter={(label: any) => format(new Date(String(label)), 'dd/MM/yyyy')}
          formatter={(value) => [`${value} visitas`, 'Visitas']}
        />
        <Bar dataKey="count" fill="#3498DB" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
