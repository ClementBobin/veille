import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

type StatCardProps = {
  label: string
  value: number
  icon: string
  color: string
  href: string
}

export function StatCard({ label, value, icon, color, href }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
        <CardContent>
          <div className="text-xl mb-3">{icon}</div>
          <div className={`text-3xl font-bold ${color}`}>{value}</div>
          <div className="text-xs text-zinc-500 mt-1">{label}</div>
        </CardContent>
      </Card>
    </Link>
  )
}