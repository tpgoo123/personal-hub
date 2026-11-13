import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SiteLayout } from '../components/SiteLayout'

export function NotFound() {
  return (
    <SiteLayout>
      <section className="not-found container">
        <div className="not-found-icon"><Compass size={26}/></div>
        <span className="eyebrow">404 / PAGE NOT FOUND</span>
        <h1>这里暂时没有内容。</h1>
        <p>页面可能已经移动，或者你访问的地址并不存在。</p>
        <Link to="/" className="button-primary"><ArrowLeft size={15}/> 返回首页</Link>
      </section>
    </SiteLayout>
  )
}
