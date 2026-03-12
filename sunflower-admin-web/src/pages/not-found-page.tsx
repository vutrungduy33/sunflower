import { Link } from 'react-router-dom'
import { Button, Card } from 'tdesign-react'

export function NotFoundPage() {
  return (
    <div className="empty-state">
      <Card className="panel-card">
        <h2>页面不存在</h2>
        <p>当前仅完成 S9 工程骨架，请从工作台继续进入后续阶段。</p>
        <Button theme="primary">
          <Link to="/">返回工作台</Link>
        </Button>
      </Card>
    </div>
  )
}
