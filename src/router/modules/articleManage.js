/** 文章管理路由模块 **/

import Layout from '@/layout'

/**
 * 文章管理模块路由配置
 * 包含文章发布和文章管理功能
 */
const articleManage = {
  path: '/article-manage',
  component: Layout,
  redirect: '/article-manage/publish',
  name: 'ArticleManage',
  meta: {
    title: '文章管理',
    icon: 'edit',
    roles: ['author']
  },
  children: [
    {
      path: 'publish',
      component: () => import('@/views/article-manage/publish'),
      name: 'PublishArticle',
      meta: { title: '发布文章', icon: 'edit', roles: ['author'] }
    },
    {
      path: 'my-articles',
      component: () => import('@/views/article-manage/my-articles.vue'),
      name: 'MyArticles',
      meta: { title: '我的文章', icon: 'documentation', roles: ['author'] }
    }
  ]
}

export default articleManage