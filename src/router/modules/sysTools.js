/** 系统工具路由模块 **/

import Layout from '@/layout'

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
    }
  ]
}

export default sysTools