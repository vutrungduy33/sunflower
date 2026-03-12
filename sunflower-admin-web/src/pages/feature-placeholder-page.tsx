import { Card, Tag } from 'tdesign-react'

interface FeaturePlaceholderPageProps {
  title: string
  stage: string
  summary: string
  bulletPoints: string[]
}

export function FeaturePlaceholderPage({
  title,
  stage,
  summary,
  bulletPoints,
}: FeaturePlaceholderPageProps) {
  return (
    <div className="page-stack">
      <Card className="panel-card placeholder-card">
        <div className="placeholder-card__head">
          <Tag theme="warning" variant="light-outline">
            {stage}
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
