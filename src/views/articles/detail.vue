<template>
  <div class="article-detail-container" :class="{ 'night-mode': isNightMode }">
    <!-- 左侧固定目录栏 -->
    <div class="sidebar-container">
      <div class="sidebar-header">
        <h3>文章目录</h3>
        <el-button 
          icon="el-icon-menu-fold" 
          size="mini" 
          @click="toggleSidebar" 
          class="toggle-sidebar-btn"
          :title="isSidebarCollapsed ? '展开目录' : '收起目录'"
        ></el-button>
      </div>
      <div class="toc-scroll-container" v-if="toc.length > 0">
        <ul class="toc-list">
          <li 
            v-for="item in toc" 
            :key="item.id" 
            :class="[
              'toc-item', 
              `level-${item.level}`,
              { 'active': activeHeadingId === item.id }
            ]"
            @click="scrollToHeading(item.id)"
          >
            <span class="toc-number">{{ item.number }}</span>
            <span class="toc-text">{{ item.text }}</span>
          </li>
        </ul>
      </div>
      <div class="empty-toc" v-else>
        <p>暂无目录</p>
      </div>
    </div>
    
    <!-- 右侧主内容区 -->
    <div class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <el-card shadow="hover" v-if="article">
        <template #header>
          <div class="header-title">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="header-actions">
              <el-button 
                @click="toggleNightMode" 
                :type="isNightMode ? 'primary' : ''" 
                size="small"
                icon="el-icon-moon"
              >
                {{ isNightMode ? '日间模式' : '夜间模式' }}
              </el-button>
              <el-button 
                @click="toggleFullscreen" 
                size="small"
                icon="el-icon-full-screen"
              >
                全屏预览
              </el-button>
            </div>
          </div>
        </template>
        
        <div class="article-meta">
          <span class="author">作者: {{ article.author || '未知作者' }}</span>
          <span class="create-time">发布时间: {{ formatDate(article.created_at) }}</span>
          <span class="read-count">阅读: {{ article.read_count || 0 }}</span>
        </div>
        
        <!-- 增强的Markdown预览 -->
        <div 
          ref="previewContainer" 
          class="markdown-preview" 
          :class="{ 'night-mode': isNightMode }"
          v-html="parsedContent"
          @scroll="handleContentScroll"
        ></div>
        
        <div class="article-actions">
          <el-button @click="backToList" icon="el-icon-arrow-left">返回列表</el-button>
        </div>
      </el-card>
      
      <div v-else class="loading-container">
        <el-skeleton animated :rows="10" />
      </div>
      
      <!-- 全屏预览弹窗 -->
      <el-dialog
        :visible.sync="fullscreenVisible"
        :fullscreen="true"
        :show-close="false"
        class="fullscreen-dialog"
      >
        <div slot="title" class="fullscreen-header">
          <h3>{{ article && article.title ? article.title : '全屏预览' }}</h3>
          <div class="fullscreen-header-actions">
            <el-button 
              @click="toggleNightMode" 
              :type="isNightMode ? 'primary' : ''" 
              size="small"
              icon="el-icon-moon"
            ></el-button>
            <el-button @click="fullscreenVisible = false" icon="el-icon-close"></el-button>
          </div>
        </div>
        <div 
          ref="fullscreenPreview" 
          class="fullscreen-preview"
          :class="{ 'night-mode': isNightMode }"
          v-html="parsedContent"
        ></div>
      </el-dialog>
      
      <!-- Mermaid加载中提示 -->
      <div v-if="isLoadingMermaid" class="mermaid-loading">
        <el-loading text="加载流程图中..." />
      </div>
    </div>
  </div>
</template>

<script>
import { getArticleDetail } from '@/api/article'
import { previewMarkdown } from '@/api/article'
import MarkdownIt from 'markdown-it'

export default {
  name: 'ArticleDetail',
  props: {
    // 支持通过props直接传入markdown内容
    markdownContent: {
      type: String,
      default: ''
    },
    // 是否是独立预览模式
    standalone: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      article: null,
      parsedContent: '',
      isNightMode: false,
      fullscreenVisible: false,
      toc: [],
      activeHeadingId: '',
      isSidebarCollapsed: false,
      isLoadingMermaid: false,
      debounceTimer: null,
      mermaidLoaded: false,
      // 用于存储所有标题元素的位置信息
      headingPositions: []
    }
  },
  provide() {
    return {
      markdownState: {
        isNightMode: this.isNightMode,
        toc: this.toc,
        activeHeadingId: this.activeHeadingId
      }
    }
  },
  created() {
    // 如果提供了markdownContent，则直接预览
    if (this.markdownContent) {
      this.previewMarkdownContent(this.markdownContent)
    } else {
      this.fetchArticleDetail()
    }
  },
  mounted() {
    // 监听窗口滚动事件，用于高亮当前目录项
    window.addEventListener('scroll', this.handleScroll)
    // 监听窗口大小变化，响应式调整布局
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('resize', this.handleResize)
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  },
  watch: {
    // 监听夜间模式变化，重新渲染Mermaid图表
    isNightMode(newVal) {
      if (this.mermaidLoaded) {
        this.$nextTick(() => {
          this.renderMermaid()
        })
      }
    }
  },
  methods: {
    fetchArticleDetail() {
      const { id } = this.$route.params
      if (!id && !this.standalone) {
        this.$message.error('文章ID不存在')
        return
      }
      
      if (this.standalone) return
      
      // 调用后端API获取文章详情
      getArticleDetail(id).then(res => {
        if (res && res.code === 200) {
          this.article = res.data
          this.previewMarkdownContent(this.article.content)
        }
      }).catch(err => {
        console.error('获取文章详情失败:', err)
        this.$message.error('获取文章详情失败')
      })
    },
    
    // 预览Markdown内容
    async previewMarkdownContent(content) {
      try {
        // 优先使用后端API预览
        if (!this.standalone) {
          const res = await previewMarkdown({ content })
          if (res && res.code === 200) {
            this.parsedContent = res.data?.html || ''
            this.$nextTick(() => this.processContent())
            return
          }
        }
        
        // 如果API调用失败或独立模式，使用本地解析
        this.parseMarkdownLocally(content)
      } catch (error) {
        console.error('预览Markdown失败:', error)
        // 失败时使用本地解析作为兜底
        this.parseMarkdownLocally(content)
      }
    },
    
    // 本地解析Markdown
    parseMarkdownLocally(content) {
      // 自定义 highlight 函数处理代码块，包括mermaid
      const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        highlight: (str, lang) => {
          if (lang && lang === 'mermaid') {
            // 为mermaid代码块生成唯一ID
            const id = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
            return `<div class="mermaid" data-mermaid-id="${id}">${str}</div>`
          }
          
          // 其他代码块的语法高亮
          if (lang) {
            try {
              const hljs = require('highlight.js')
              if (hljs.getLanguage(lang)) {
                return `<pre class="hljs"><code class="language-${lang}">${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
              }
            } catch (__) {
              // 语言不支持时，回退到纯文本
            }
          }
          
          // 默认：转义HTML并包装在code标签中
          return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
        }
      })
      
      // 解析Markdown内容
      this.parsedContent = md.render(content)
      
      // 处理解析后的内容
      this.$nextTick(() => this.processContent())
    },
    
    // 处理解析后的内容
    processContent() {
      // 生成目录（使用防抖优化）
      this.debounceGenerateTOC()
      
      // 渲染Mermaid和添加复制按钮
      this.$nextTick(() => {
        this.renderMermaid()
        this.addCopyButtons()
      })
    },
    
    // 生成目录（带防抖）
    debounceGenerateTOC() {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.generateTOC()
      }, 100)
    },
    
    // 生成目录
    generateTOC() {
      this.toc = []
      this.headingPositions = []
      
      if (!this.$refs.previewContainer) return
      
      const headings = this.$refs.previewContainer.querySelectorAll('h1, h2, h3, h4, h5, h6')
      let counters = [0, 0, 0, 0, 0, 0]
      
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.replace('H', '')) - 1
        
        // 重置该级别以下的计数器
        for (let i = level + 1; i < counters.length; i++) {
          counters[i] = 0
        }
        
        // 增加当前级别的计数器
        counters[level]++
        
        // 生成编号
        const number = counters.slice(0, level + 1).join('.')
        
        // 为标题添加ID
        const id = `heading-${index}`
        heading.setAttribute('id', id)
        
        // 存储标题信息
        this.toc.push({
          id,
          level: level + 1,
          text: heading.textContent.trim(),
          number
        })
        
        // 存储标题位置信息，用于滚动高亮
        this.headingPositions.push({
          id,
          top: heading.offsetTop
        })
      })
    },
    
    // 滚动到指定标题
    scrollToHeading(id) {
      const element = document.getElementById(id)
      if (element) {
        // 计算滚动位置，考虑顶部偏移
        const offset = 100
        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        })
        
        // 移动端时自动收起目录
        if (window.innerWidth <= 768) {
          this.isSidebarCollapsed = true
        }
      }
    },
    
    // 渲染Mermaid图表
    renderMermaid() {
      if (!this.$refs.previewContainer && !this.$refs.fullscreenPreview) return
      
      // 检查是否有mermaid代码块需要渲染
      const hasMermaidBlocks = 
        (this.$refs.previewContainer && this.$refs.previewContainer.querySelector('.mermaid')) ||
        (this.$refs.fullscreenPreview && this.$refs.fullscreenPreview.querySelector('.mermaid'))
      
      if (!hasMermaidBlocks) return
      
      // 显示加载状态
      this.isLoadingMermaid = true
      
      // 动态加载Mermaid
      if (typeof window.mermaid === 'undefined') {
        // 动态加载mermaid CDN
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
        script.onload = () => {
          this.mermaidLoaded = true
          this.initMermaid()
          this.isLoadingMermaid = false
        }
        script.onerror = () => {
          console.error('Failed to load Mermaid.js')
          this.isLoadingMermaid = false
        }
        document.head.appendChild(script)
      } else {
        this.mermaidLoaded = true
        this.initMermaid()
        this.isLoadingMermaid = false
      }
    },
    
    // 初始化Mermaid配置
    initMermaid() {
      if (typeof window.mermaid === 'undefined') return
      
      // 根据当前主题初始化mermaid
      window.mermaid.initialize({
        startOnLoad: false,
        theme: this.isNightMode ? 'dark' : 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true
        },
        sequence: {
          useMaxWidth: true
        },
        gantt: {
          useMaxWidth: true
        }
      })
      
      // 处理预览容器中的Mermaid
      if (this.$refs.previewContainer) {
        const mermaidElements = this.$refs.previewContainer.querySelectorAll('.mermaid')
        this.renderMermaidElements(mermaidElements)
      }
      
      // 处理全屏预览中的Mermaid
      if (this.$refs.fullscreenPreview) {
        const fullscreenMermaidElements = this.$refs.fullscreenPreview.querySelectorAll('.mermaid')
        this.renderMermaidElements(fullscreenMermaidElements)
      }
    },
    
    // 渲染Mermaid元素
    renderMermaidElements(elements) {
      if (typeof window.mermaid === 'undefined') return
      
      elements.forEach((element) => {
        // 为每个图表添加缩放控件容器
        if (!element.parentNode.querySelector('.mermaid-controls')) {
          const controlsContainer = document.createElement('div')
          controlsContainer.className = 'mermaid-controls'
          controlsContainer.innerHTML = `
            <button class="mermaid-zoom-in" title="放大">+</button>
            <button class="mermaid-zoom-out" title="缩小">-</button>
            <button class="mermaid-reset" title="重置">↺</button>
          `
          element.parentNode.insertBefore(controlsContainer, element)
          
          // 添加缩放事件监听
          const zoomInBtn = controlsContainer.querySelector('.mermaid-zoom-in')
          const zoomOutBtn = controlsContainer.querySelector('.mermaid-zoom-out')
          const resetBtn = controlsContainer.querySelector('.mermaid-reset')
          
          let scale = 1
          zoomInBtn.addEventListener('click', () => {
            scale += 0.1
            element.style.transform = `scale(${scale})`
            element.style.transformOrigin = 'top center'
          })
          
          zoomOutBtn.addEventListener('click', () => {
            if (scale > 0.5) {
              scale -= 0.1
              element.style.transform = `scale(${scale})`
              element.style.transformOrigin = 'top center'
            }
          })
          
          resetBtn.addEventListener('click', () => {
            scale = 1
            element.style.transform = ''
          })
        }
        
        try {
          // 为图表添加交互性（点击节点高亮）
          element.setAttribute('data-click', 'highlight')
          
          window.mermaid.run({
            nodes: [element]
          })
        } catch (error) {
          console.error('Mermaid rendering error:', error)
          element.innerHTML = `<pre>Error rendering diagram: ${error.message}</pre>`
        }
      })
      
      // 添加点击节点高亮的全局事件委托
      this.addMermaidInteractivity()
    },
    
    // 添加Mermaid交互性
    addMermaidInteractivity() {
      document.addEventListener('click', (e) => {
        // 查找被点击的节点是否是Mermaid图表的一部分
        const node = e.target.closest('.node, .actor, .activity, .task')
        if (node) {
          // 移除其他节点的高亮
          document.querySelectorAll('.mermaid .node.highlighted, .mermaid .actor.highlighted, .mermaid .activity.highlighted, .mermaid .task.highlighted').forEach(el => {
            el.classList.remove('highlighted')
          })
          // 高亮当前节点
          node.classList.add('highlighted')
        }
      })
    },
    
    // 添加代码块复制按钮
    addCopyButtons() {
      const codeBlocks = document.querySelectorAll('.markdown-preview pre.hljs, .fullscreen-preview pre.hljs')
      
      codeBlocks.forEach(block => {
        if (!block.querySelector('.copy-button')) {
          // 获取代码语言
          const codeElement = block.querySelector('code')
          const lang = codeElement.className.replace('language-', '')
          
          // 创建复制按钮
          const button = document.createElement('button')
          button.className = 'copy-button'
          button.textContent = '复制'
          button.onclick = () => {
            navigator.clipboard.writeText(codeElement.textContent)
              .then(() => {
                const originalText = button.textContent
                button.textContent = '已复制!'
                setTimeout(() => {
                  button.textContent = originalText
                }, 2000)
              })
              .catch(err => {
                console.error('复制失败:', err)
              })
          }
          
          // 创建语言标签
          if (lang && lang !== 'code') {
            const langTag = document.createElement('span')
            langTag.className = 'code-lang-tag'
            langTag.textContent = lang
            block.appendChild(langTag)
          }
          
          block.appendChild(button)
        }
      })
    },
    
    // 切换夜间模式
    toggleNightMode() {
      this.isNightMode = !this.isNightMode
      // 存储用户偏好
      localStorage.setItem('markdown-night-mode', this.isNightMode)
    },
    
    // 切换全屏预览
    toggleFullscreen() {
      this.fullscreenVisible = true
      this.$nextTick(() => {
        // 重新渲染Mermaid和添加复制按钮
        this.renderMermaid()
        this.addCopyButtons()
      })
    },
    
    // 切换侧边栏
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed
    },
    
    // 处理内容区域滚动
    handleContentScroll() {
      this.updateActiveHeading()
    },
    
    // 处理窗口滚动
    handleScroll() {
      this.updateActiveHeading()
    },
    
    // 更新当前活跃的标题
    updateActiveHeading() {
      if (!this.headingPositions.length) return
      
      const scrollPosition = window.scrollY + 150 // 顶部偏移
      
      // 找到当前滚动位置对应的标题
      for (let i = this.headingPositions.length - 1; i >= 0; i--) {
        if (scrollPosition >= this.headingPositions[i].top) {
          this.activeHeadingId = this.headingPositions[i].id
          return
        }
      }
      
      // 滚动到顶部时，清空活跃标题
      this.activeHeadingId = ''
    },
    
    // 处理窗口大小变化
    handleResize() {
      // 移动端自动收起侧边栏
      if (window.innerWidth <= 768) {
        this.isSidebarCollapsed = true
      }
      // 重新计算标题位置
      this.$nextTick(() => {
        this.generateTOC()
      })
    },
    
    backToList() {
      this.$router.push('/articles/list')
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.article-detail-container {
  min-height: 100vh;
  display: flex;
  background-color: #f5f7fa;
  transition: background-color 0.3s ease;
}

.article-detail-container.night-mode {
  background-color: #1a1a1a;
}

/* 侧边栏样式 */
.sidebar-container {
  width: 300px;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  z-index: 100;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.sidebar-container.night-mode {
  background-color: #282c34;
  border-right-color: #3e4451;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fafafa;
}

.sidebar-header.night-mode {
  background-color: #21252b;
  border-bottom-color: #3e4451;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.sidebar-header.night-mode h3 {
  color: #abb2bf;
}

.toggle-sidebar-btn {
  color: #909399;
}

.toggle-sidebar-btn:hover {
  color: #409eff;
}

.toc-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 自定义滚动条 */
.toc-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.toc-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.toc-scroll-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.toc-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.toc-scroll-container.night-mode::-webkit-scrollbar-track {
  background: #21252b;
}

.toc-scroll-container.night-mode::-webkit-scrollbar-thumb {
  background: #5c6370;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin-bottom: 8px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.toc-item:hover {
  background-color: #e6f7ff;
  color: #1890ff;
  transform: translateX(4px);
}

.toc-item.active {
  background-color: #1890ff;
  color: #fff;
  font-weight: 500;
}

.toc-item.active:hover {
  background-color: #409eff;
}

.sidebar-container.night-mode .toc-item {
  color: #abb2bf;
}

.sidebar-container.night-mode .toc-item:hover {
  background-color: #2c313c;
  color: #61afef;
}

.sidebar-container.night-mode .toc-item.active {
  background-color: #61afef;
  color: #fff;
}

.toc-number {
  font-size: 12px;
  color: #909399;
  margin-right: 8px;
  min-width: 40px;
  text-align: right;
  opacity: 0.8;
}

.toc-item.active .toc-number {
  color: rgba(255, 255, 255, 0.8);
}

.sidebar-container.night-mode .toc-number {
  color: #5c6370;
}

.toc-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-1 .toc-text {
  font-weight: 600;
}

.level-2 {
  padding-left: 16px;
}

.level-3 {
  padding-left: 32px;
}

.level-4 {
  padding-left: 48px;
  font-size: 13px;
}

.level-5 {
  padding-left: 64px;
  font-size: 13px;
}

.level-6 {
  padding-left: 80px;
  font-size: 13px;
}

.empty-toc {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
}

.sidebar-container.night-mode .empty-toc {
  color: #5c6370;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  margin-left: 300px;
  transition: margin-left 0.3s ease;
  padding: 20px;
}

.main-content.sidebar-collapsed {
  margin-left: 0;
}

/* 文章卡片样式 */
.el-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  max-width: 1000px;
  margin: 0 auto;
}

.article-detail-container.night-mode .el-card {
  background-color: #282c34;
  border-color: #3e4451;
}

.header-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.article-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.4;
  flex: 1;
}

.article-detail-container.night-mode .article-title {
  color: #e6e6e6;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  margin-left: 20px;
}

/* 文章元数据 */
.article-meta {
  margin: 20px 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 14px;
  color: #909399;
}

.article-detail-container.night-mode .article-meta {
  border-bottom-color: #3e4451;
  color: #8b949e;
}

/* 增强的Markdown预览样式 */
.markdown-preview {
  padding: 20px 0;
  line-height: 1.8;
  color: #303133;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  transition: all 0.3s ease;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

/* 夜间模式样式 */
.markdown-preview.night-mode {
  color: #d4d4d4;
}

/* 代码块样式增强 */
.markdown-preview pre {
  margin-bottom: 20px;
  padding: 16px;
  overflow: auto;
  font-size: 14px;
  line-height: 1.6;
  background-color: #f6f8fa;
  border-radius: 6px;
  position: relative;
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
  border: 1px solid #e1e4e8;
}

.markdown-preview.night-mode pre {
  background-color: #2d2d2d;
  border-color: #3e4451;
}

/* 代码语言标签 */
.code-lang-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: #409eff;
  color: white;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-family: inherit;
}

.markdown-preview.night-mode .code-lang-tag {
  background-color: #61afef;
}

/* 复制按钮样式增强 */
.copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #f6f8fa;
  color: #586069;
  border: 1px solid #d1d5da;
  border-radius: 3px;
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  font-family: inherit;
}

.markdown-preview pre:hover .copy-button {
  opacity: 1;
}

.copy-button:hover {
  background-color: #fff;
  color: #24292e;
  border-color: #bbb;
}

.markdown-preview.night-mode .copy-button {
  background-color: #3e4451;
  color: #d4d4d4;
  border-color: #555;
}

.markdown-preview.night-mode .copy-button:hover {
  background-color: #444;
  color: #fff;
  border-color: #666;
}

/* Mermaid图表样式增强 */
.markdown-preview .mermaid {
  margin: 24px 0;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  text-align: center;
  position: relative;
  overflow: auto;
}

.markdown-preview.night-mode .mermaid {
  background-color: #21252b;
  border-color: #3e4451;
}

/* Mermaid控制按钮 */
.mermaid-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  z-index: 10;
}

.mermaid-controls button {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid #d1d5da;
  background-color: #fff;
  color: #586069;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.mermaid-controls button:hover {
  background-color: #f6f8fa;
  border-color: #bbb;
}

.markdown-preview.night-mode .mermaid-controls button {
  background-color: #282c34;
  border-color: #555;
  color: #d4d4d4;
}

.markdown-preview.night-mode .mermaid-controls button:hover {
  background-color: #3e4451;
  border-color: #666;
}

/* Mermaid节点高亮样式 */
.mermaid .node.highlighted,
.mermaid .actor.highlighted,
.mermaid .activity.highlighted,
.mermaid .task.highlighted {
  fill: #1890ff !important;
  stroke: #409eff !important;
  color: #fff !important;
}

.markdown-preview.night-mode .mermaid .node.highlighted,
.markdown-preview.night-mode .mermaid .actor.highlighted,
.markdown-preview.night-mode .mermaid .activity.highlighted,
.markdown-preview.night-mode .mermaid .task.highlighted {
  fill: #61afef !important;
  stroke: #88ccee !important;
}

/* 标准Markdown元素样式 */
.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3,
.markdown-preview h4,
.markdown-preview h5,
.markdown-preview h6 {
  margin-top: 30px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.3;
  color: #303133;
  scroll-margin-top: 100px;
}

.markdown-preview.night-mode h1,
.markdown-preview.night-mode h2,
.markdown-preview.night-mode h3,
.markdown-preview.night-mode h4,
.markdown-preview.night-mode h5,
.markdown-preview.night-mode h6 {
  color: #ffffff;
}

.markdown-preview h1 {}
.markdown-preview h2 {}
.markdown-preview h3 {}

.markdown-preview p {
  margin-bottom: 16px;
}

.markdown-preview ul,
.markdown-preview ol {
  margin-bottom: 16px;
  padding-left: 2em;
}

.markdown-preview img {
  max-width: 100%;
  height: auto;
  margin: 16px auto;
  border-radius: 6px;
  display: block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markdown-preview blockquote {
  margin-bottom: 16px;
  padding: 12px 20px;
  color: #6a737d;
  border-left: 4px solid #409eff;
  background-color: #f0f7ff;
  border-radius: 0 4px 4px 0;
}

.markdown-preview.night-mode blockquote {
  color: #a0a0a0;
  background-color: #2c313c;
  border-left-color: #61afef;
}

.markdown-preview table {
  display: block;
  width: 100%;
  overflow: auto;
  border-spacing: 0;
  border-collapse: collapse;
  margin-bottom: 16px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.markdown-preview table th,
.markdown-preview table td {
  padding: 12px 15px;
  border: 1px solid #e4e7ed;
  text-align: left;
}

.markdown-preview.night-mode table th,
.markdown-preview.night-mode table td {
  border-color: #3e4451;
}

.markdown-preview table th {
  font-weight: 600;
  background-color: #f6f8fa;
  color: #303133;
}

.markdown-preview.night-mode table th {
  background-color: #3e4451;
  color: #abb2bf;
}

.markdown-preview table tr:nth-child(even) {
  background-color: #fafafa;
}

.markdown-preview.night-mode table tr:nth-child(even) {
  background-color: #2c313c;
}

/* 链接样式 */
.markdown-preview a {
  color: #0366d6;
  text-decoration: none;
  border-bottom: 1px dotted #0366d6;
  transition: all 0.2s ease;
}

.markdown-preview a:hover {
  color: #0056b3;
  border-bottom-style: solid;
}

.markdown-preview.night-mode a {
  color: #58a6ff;
  border-bottom-color: #58a6ff;
}

.markdown-preview.night-mode a:hover {
  color: #85b7ff;
}

/* 分隔线样式 */
.markdown-preview hr {
  height: 0.2em;
  padding: 0;
  margin: 30px 0;
  background-color: #e1e4e8;
  border: 0;
  border-radius: 0.1em;
}

.markdown-preview.night-mode hr {
  background-color: #3e4451;
}

/* 代码行内样式 */
.markdown-preview code {
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  color: #e65100;
}

.markdown-preview.night-mode code {
  background-color: #3e4451;
  color: #e5c07b;
}

/* 全屏预览样式 */
.fullscreen-preview {
  padding: 30px;
  line-height: 1.8;
  color: #303133;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.fullscreen-preview.night-mode {
  background-color: #1e1e1e;
  color: #d4d4d4;
}

.fullscreen-dialog .el-dialog__body {
  padding: 0;
}

.fullscreen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background-color: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.fullscreen-preview.night-mode .fullscreen-header {
  background-color: #21252b;
  border-bottom-color: #3e4451;
}

.fullscreen-header h3 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.fullscreen-preview.night-mode .fullscreen-header h3 {
  color: #abb2bf;
}

.fullscreen-header-actions {
  display: flex;
  gap: 10px;
}

/* 文章操作按钮 */
.article-actions {
  margin-top: 40px;
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid #e4e7ed;
}

.article-detail-container.night-mode .article-actions {
  border-top-color: #3e4451;
}

/* 加载状态 */
.loading-container {
  padding: 40px;
  max-width: 1000px;
  margin: 0 auto;
}

.mermaid-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar-container {
    width: 280px;
  }
  
  .main-content {
    margin-left: 280px;
  }
}

@media (max-width: 768px) {
  .sidebar-container {
    transform: translateX(-100%);
  }
  
  .sidebar-container:not(.collapsed) {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    padding: 10px;
  }
  
  .header-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
    margin-left: 0;
  }
  
  .article-title {
    font-size: 24px;
  }
  
  .article-meta {
    flex-direction: column;
    gap: 10px;
  }
  
  .markdown-preview {
    max-height: none;
    padding: 15px 0;
  }
  
  .toc-item {
    padding: 8px;
  }
  
  .level-2 { padding-left: 10px; }
  .level-3 { padding-left: 20px; }
  .level-4 { padding-left: 30px; }
  .level-5 { padding-left: 40px; }
  .level-6 { padding-left: 50px; }
}
</style>