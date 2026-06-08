import { Card, Tag } from '@/app/admin-components'

interface FeaturePlaceholderPageProps {
  title: string
  label: string
  summary: string
  bulletPoints: string[]
}

export function FeaturePlaceholderPage({
  title,
  label,
  summary,
  bulletPoints,
}: FeaturePlaceholderPageProps) {
  return (
    <div className="page-stack">
      <Card className="panel-card placeholder-card">
        <div className="placeholder-card__head">
          <Tag theme="primary" variant="light-outline">
            {label}
          </Tag>
          <h3>{title}</h3>
          <p>{summary}</p>
        </div>
        <ul className="bullet-list">
          {bulletPoints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
