/** 系统工具路由模块 **/

import Layout from '@/layout'

/**
 * 系统工具模块路由配置
 * 包含监控、历史记录、Markdown解析和专业Markdown编辑器等功能
 */
const sysTools = {
  path: '/sys-tools',
  component: Layout,
  redirect: '/sys-tools/monitor',
  name: 'SysTools',
  meta: {
    title: '系统工具',
    icon: 'el-icon-s-tools',
    noCache: true
  },
  children: [
    {
      path: 'monitor',
      component: () => import('@/views/sys-tools/monitor.vue'),
      name: 'ServerMonitor',
      meta: { title: '服务监控', icon: 'el-icon-monitor' }
    },
    {
      path: 'history',
      component: () => import('@/views/sys-tools/history.vue'),
      name: 'HistoryMonitor',
      meta: { title: '历史监控', icon: 'el-icon-data-line' }
    },
    {
      path: 'markdown-parser',
      component: () => import('@/views/sys-tools/markdown-parser.vue'),
      name: 'MarkdownParser',
      meta: { title: 'Markdown解析', icon: 'el-icon-document' }
    },
    {
      path: 'enhanced-markdown-editor',
      component: () => import('@/views/sys-tools/enhanced-markdown-editor.vue'),
      name: 'EnhancedMarkdownEditor',
      meta: { title: '专业Markdown编辑器', icon: 'el-icon-edit' }
    }
  ]
}

export default sysTools