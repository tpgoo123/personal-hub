import type { SiteData } from '../types'

export const seedData: SiteData = {
  profile: {
    name: '丁大帅哥',
    role: 'AI Engineer & Developer',
    tagline: '把想法变成作品，把过程留给时间。',
    bio: '关注人工智能、计算机视觉、推荐系统与智能应用开发。喜欢把研究问题拆解成可验证的实验，也喜欢把想法做成真正能用的产品。',
    location: 'China',
    email: '',
    github: '',
    scholar: '',
    avatar_url: '',
    avatar_mark: 'TP',
    focus: 'AI · Computer Vision · Recommendation',
    about_heading: '对复杂问题保持耐心，对新鲜事物保持好奇。',
    about_detail: '我喜欢在研究与实践之间建立连接：从阅读论文、提出假设，到编写代码、验证结果，再把有价值的过程整理成可复用的知识与作品。',
    hero_tags: ['AI Research', 'Engineering', 'Curiosity'],
    status: 'Currently exploring AI & intelligent systems',
  },
  projects: [
    {
      id: 'p1', title: 'TireYOLO · 轮胎文字检测与识别', slug: 'tire-yolo', category: 'Computer Vision',
      summary: '面向轮胎胎侧复杂场景的文字定位、曲面矫正与 OCR 识别。',
      description: '围绕低对比度、细长字符和曲面畸变等问题，组合目标检测、TPS 文本矫正与 OCR 识别流程，并关注模型轻量化与推理效率。',
      tech_stack: ['YOLOv8', 'PaddleOCR', 'OpenCV', 'TPS'], highlights: ['检测、矫正与识别流程集成', '剪枝与 FP16 推理优化'],
      cover_url: '', github_url: '', demo_url: '', featured: true, is_published: true, sort_order: 1,
    },
    {
      id: 'p2', title: 'After-sales Service Agent', slug: 'after-sales-agent', category: 'AI Agent',
      summary: '基于 LangGraph 与 RAG 的电商售后问答与流程协同助手。',
      description: '通过多节点工作流组织问题分流、知识检索、订单查询、人工审批与回答审核，探索面向真实业务流程的 Agent 应用。',
      tech_stack: ['Python', 'LangGraph', 'RAG', 'Chroma', 'SQLite'], highlights: ['多节点流程编排', '向量检索与重排', '订单查询工具接入'],
      cover_url: '', github_url: '', demo_url: '', featured: true, is_published: true, sort_order: 2,
    },
    {
      id: 'p3', title: 'Temporal Action Detection', slug: 'temporal-action-detection', category: 'Video Understanding',
      summary: '面向短时关键行为的时序动作检测与边界定位优化。',
      description: '基于 ActionFormer 研究多尺度局部感受野与边界定位细化，重点关注短动作识别和高 tIoU 阈值下的定位质量。',
      tech_stack: ['PyTorch', 'ActionFormer', 'OpenTAD', 'THUMOS14'], highlights: ['多尺度局部感受野', '边界二次校正', '短动作分桶评测'],
      cover_url: '', github_url: '', demo_url: '', featured: true, is_published: true, sort_order: 3,
    },
    {
      id: 'p4', title: 'GUIDE · Federated Course Recommendation', slug: 'guide-federated-rec', category: 'Recommendation',
      summary: '融合全局知识与本地偏好的隐私保护联邦课程推荐框架。',
      description: '围绕非 IID 用户行为下的个性化推荐，探索本地偏好保持、全局知识聚合与动态融合机制。',
      tech_stack: ['PyTorch', 'Federated Learning', 'Recommendation', 'MOOCCube'], highlights: ['全局与本地双参数建模', '动态门控融合', '隐私扰动评估'],
      cover_url: '', github_url: '', demo_url: '', featured: true, is_published: true, sort_order: 4,
    },
    {
      id: 'p5', title: 'Multimodal Remote Sensing Clustering', slug: 'multimodal-rs-clustering', category: 'Remote Sensing',
      summary: '面向多源遥感数据的双结构感知锚图聚类方法。',
      description: '研究高光谱、SAR、DSM 与 LiDAR 等多模态数据的区域结构表达、锚图学习和协同聚类。',
      tech_stack: ['MATLAB', 'Anchor Graph', 'Subspace Clustering', 'Remote Sensing'], highlights: ['光谱与空间双结构引导', '多模态共识表示', '多数据集实验评估'],
      cover_url: '', github_url: '', demo_url: '', featured: false, is_published: true, sort_order: 5,
    },
  ],
  publications: [
    {
      id: 'r1', title: 'Robust Subspace Clustering for Unsupervised Hyperspectral Band Selection', venue: 'AIPMV 2026', year: '2026', status: 'Accepted', authors: '',
      abstract: '围绕无监督高光谱波段选择中的冗余与噪声问题，研究鲁棒子空间聚类方法。', paper_url: '', doi: '', tags: ['Hyperspectral', 'Band Selection', 'Subspace Clustering'], is_published: true, sort_order: 1,
    },
    {
      id: 'r2', title: 'Dual Subspace Meets Consistency: Hyperspectral Band Selection via Spectral-Spatial Learning', venue: 'IEEE Transactions on Geoscience and Remote Sensing', year: '2026', status: 'Major Revision', authors: '',
      abstract: '结合光谱与空间信息开展高光谱波段选择研究。', paper_url: '', doi: '', tags: ['Hyperspectral', 'Spectral-Spatial Learning'], is_published: true, sort_order: 2,
    },
    {
      id: 'r3', title: 'Dual Structure-Aware Anchor Graph Learning for Multimodal Remote Sensing Image Clustering', venue: 'Under Review', year: '2026', status: 'Submitted', authors: '',
      abstract: '通过双结构感知机制引导多模态遥感图像的锚图学习与聚类。', paper_url: '', doi: '', tags: ['Multimodal', 'Anchor Graph', 'Clustering'], is_published: true, sort_order: 3,
    },
  ],
  posts: [
    {
      id: 'b1', title: '把研究过程沉淀为可复用的工程资产', slug: 'research-to-engineering',
      excerpt: '从问题拆解、实验记录到代码组织，记录一些关于科研与工程实践的思考。',
      content: '这里可以记录完整的技术文章、实验笔记和复盘内容。进入管理后台后，可以继续编辑正文并发布。',
      category: '思考与记录', cover_url: '', tags: ['Research', 'Engineering'], is_published: true, published_at: '2026-10-20',
    },
    {
      id: 'b2', title: '构建一个可追踪的 AI Agent 工作流', slug: 'building-agent-workflow',
      excerpt: '从节点职责、状态传递、工具调用到异常处理，梳理 Agent 应用的工程化要点。',
      content: '这里可以补充 Agent 项目的架构设计、实现过程和经验总结。',
      category: 'AI Engineering', cover_url: '', tags: ['LangGraph', 'RAG'], is_published: true, published_at: '2026-09-12',
    },
  ],
  lifeEntries: [
    { id: 'l1', title: '运动与健康', category: 'Fitness', date_label: 'ROUTINE', description: '保持规律运动，记录一点点进步。', cover_url: '', is_published: true, sort_order: 1 },
    { id: 'l2', title: '阅读与学习', category: 'Reading', date_label: 'LEARNING', description: '持续输入，也持续输出。', cover_url: '', is_published: true, sort_order: 2 },
    { id: 'l3', title: '游戏与灵感', category: 'Games', date_label: 'PLAY & EXPLORE', description: '在另一个世界里探索不同的可能。', cover_url: '', is_published: true, sort_order: 3 },
  ],
  timeline: [
    { id: 't1', date_label: '2026', title: '持续探索 AI 与智能系统', description: '围绕时序动作检测、联邦推荐、多模态遥感与 AI Agent 开展研究和实践。', kind: 'Research', is_published: true, sort_order: 1 },
    { id: 't2', date_label: '2025 — 2026', title: '工程实践与项目开发', description: '参与视觉检测、OCR 识别和智能客服 Agent 等项目实践。', kind: 'Engineering', is_published: true, sort_order: 2 },
    { id: 't3', date_label: 'Graduate Study', title: '计算机相关专业研究生阶段', description: '在算法研究、论文写作与系统开发之间持续积累。', kind: 'Education', is_published: true, sort_order: 3 },
  ],
}
