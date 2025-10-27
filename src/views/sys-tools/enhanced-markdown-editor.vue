<template>
  <div class="markdown-editor-container" :class="{ 'night-mode': isNightMode }">
    <div class="toolbar">
      <el-button-group>
        <el-button @click="toggleNightMode" :type="isNightMode ? 'primary' : ''">
          {{ isNightMode ? '日间模式' : '夜间模式' }}
        </el-button>
        <el-button @click="loadSample">加载示例</el-button>
        <el-button @click="clearContent">清空内容</el-button>
        <el-button @click="copyContent" type="primary">复制内容</el-button>
        <el-button @click="downloadMarkdown" type="success">下载</el-button>
      </el-button-group>
      <div class="word-count">
        字数: {{ wordCount }} | 行数: {{ lineCount }}
      </div>
    </div>

    <div class="editor-wrapper">
      <!-- Table of Contents -->
      <div class="toc-container" v-if="toc.length > 0">
        <h3>目录</h3>
        <ul class="toc-list">
          <li 
            v-for="item in toc" 
            :key="item.id" 
            :class="['toc-item', `level-${item.level}`]"
            @click="scrollToHeading(item.id)"
          >
            <span class="toc-number">{{ item.number }}</span>
            <span class="toc-text">{{ item.text }}</span>
          </li>
        </ul>
      </div>

      <!-- Editor and Preview Area -->
      <div class="editor-area">
        <split-pane :min-percent="20" :default-percent="50" split="vertical" class="responsive-split-pane" style="flex: 1;">
          <!-- Editor Panel -->
          <template slot="paneL">
            <div class="editor-panel">
              <div class="panel-header">
                <h3>编辑区</h3>
              </div>
              <textarea
                ref="editor"
                class="markdown-editor"
                v-model="markdownContent"
                @scroll="handleEditorScroll"
                @input="handleInput"
                placeholder="请输入 Markdown 内容..."
              ></textarea>
            </div>
          </template>

          <!-- Preview Panel -->
          <template slot="paneR">
            <div class="preview-panel">
              <div class="panel-header">
                <h3>预览区</h3>
                <el-button 
                  @click="toggleFullscreen" 
                  size="mini"
                  icon="el-icon-full-screen"
                ></el-button>
              </div>
              <div 
                ref="previewContainer" 
                class="markdown-preview"
                @scroll="handlePreviewScroll"
                v-html="parsedContent"
              ></div>
            </div>
          </template>
        </split-pane>
      </div>
    </div>

    <!-- Fullscreen Preview Modal -->
    <el-dialog
      :visible.sync="fullscreenVisible"
      :fullscreen="true"
      :show-close="false"
      class="fullscreen-dialog"
    >
      <div slot="title" class="fullscreen-header">
        <h3>全屏预览</h3>
        <el-button @click="fullscreenVisible = false" icon="el-icon-close"></el-button>
      </div>
      <div 
        ref="fullscreenPreview" 
        class="fullscreen-preview"
        v-html="parsedContent"
      ></div>
    </el-dialog>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it'
import SplitPane from 'vue-splitpane'

export default {
  name: 'EnhancedMarkdownEditor',
  components: {
    SplitPane
  },
  data() {
    return {
      markdownContent: '',
      parsedContent: '',
      isNightMode: false,
      fullscreenVisible: false,
      toc: [],
      debounceTimer: null,
      lastEditorScrollTop: 0,
      lastPreviewScrollTop: 0,
      isSyncing: false
    }
  },
  computed: {
    wordCount() {
      return this.markdownContent.replace(/\s/g, '').length
    },
    lineCount() {
      return this.markdownContent.split('\n').length
    }
  },
  methods: {
    handleInput() {
      // Debounce the parsing to improve performance
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.parseMarkdown()
      }, 300)
    },
    
    parseMarkdown() {
      // Custom highlight function to handle mermaid code blocks
      const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        highlight: (str, lang) => {
          if (lang && lang === 'mermaid') {
            // Generate unique ID for mermaid code block
            const id = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
            return `<div class="mermaid" data-mermaid-id="${id}">${str}</div>`
          }
          
          // Handle other code blocks with syntax highlighting
          if (lang) {
            try {
              // Use the existing highlight.js installation
              const hljs = require('highlight.js')
              if (hljs.getLanguage(lang)) {
                return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
              }
            } catch (__) {
              // If language is not supported, fall back to plain text
            }
          }
          
          // Default: escape HTML and wrap in code tag
          return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
        }
      })
      
      // Parse markdown content
      let htmlContent = md.render(this.markdownContent)
      
      // Generate table of contents
      this.generateTOC(htmlContent)
      
      this.parsedContent = htmlContent
      
      // Render mermaid diagrams after DOM update
      this.$nextTick(() => {
        this.renderMermaid()
        this.addCopyButtons()
      })
      
      // Save to localStorage
      this.saveToLocalStorage()
    },
    
    generateTOC(htmlContent) {
      // Create temporary DOM element to parse HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      
      // Find all heading elements
      const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const toc = []
      
      // Track heading counts for numbering
      const headingCounts = [0, 0, 0, 0, 0, 0]
      
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1))
        const text = heading.textContent.trim()
        
        // Update heading counts
        headingCounts[level - 1]++
        // Reset lower level counts
        for (let i = level; i < 6; i++) {
          headingCounts[i] = 0
        }
        
        // Generate hierarchical number (e.g., 1.1.2)
        const number = headingCounts.slice(0, level).join('.')
        
        // Add ID to heading if it doesn't have one
        if (!heading.id) {
          heading.id = `heading-${index}`
        }
        
        toc.push({
          id: heading.id,
          level: level,
          text: text,
          number: number
        })
      })
      
      this.toc = toc
    },
    
    renderMermaid() {
      // Dynamically load mermaid if not already loaded
      if (typeof window.mermaid === 'undefined') {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
        script.onload = () => {
          this.initMermaid()
        }
        document.head.appendChild(script)
      } else {
        this.initMermaid()
      }
    },
    
    initMermaid() {
      // Initialize mermaid
      window.mermaid.initialize({
        startOnLoad: false,
        theme: this.isNightMode ? 'dark' : 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true
        }
      })
      
      // Find all mermaid elements
      const mermaidElements = this.$refs.previewContainer.querySelectorAll('.mermaid')
      
      // Render each mermaid diagram
      mermaidElements.forEach((element) => {
        const id = element.getAttribute('data-mermaid-id') || 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        element.setAttribute('id', id)
        
        try {
          window.mermaid.run({
            nodes: [element]
          })
        } catch (error) {
          console.error('Mermaid rendering error:', error)
          element.innerHTML = `<pre>Error rendering diagram: ${error.message}</pre>`
        }
      })
      
      // Also render in fullscreen preview if visible
      if (this.fullscreenVisible && this.$refs.fullscreenPreview) {
        const fullscreenMermaidElements = this.$refs.fullscreenPreview.querySelectorAll('.mermaid')
        fullscreenMermaidElements.forEach((element) => {
          const id = element.getAttribute('data-mermaid-id') || 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
          element.setAttribute('id', id)
          
          try {
            window.mermaid.run({
              nodes: [element]
            })
          } catch (error) {
            console.error('Mermaid rendering error:', error)
            element.innerHTML = `<pre>Error rendering diagram: ${error.message}</pre>`
          }
        })
      }
    },
    
    addCopyButtons() {
      // Add copy buttons to code blocks
      const codeBlocks = this.$refs.previewContainer.querySelectorAll('pre.hljs')
      codeBlocks.forEach(block => {
        if (!block.querySelector('.copy-btn')) {
          const button = document.createElement('button')
          button.className = 'copy-btn'
          button.textContent = '复制'
          button.onclick = () => {
            const code = block.querySelector('code').innerText
            navigator.clipboard.writeText(code).then(() => {
              this.$message.success('代码已复制到剪贴板')
            }).catch(err => {
              this.$message.error('复制失败: ' + err)
            })
          }
          block.appendChild(button)
        }
      })
    },
    
    scrollToHeading(id) {
      const element = this.$refs.previewContainer.querySelector(`#${id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
    
    handleEditorScroll(e) {
      if (this.isSyncing) return
      
      this.isSyncing = true
      this.lastEditorScrollTop = e.target.scrollTop
      
      // Calculate scroll percentage
      const scrollPercentage = e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight)
      
      // Apply to preview
      if (this.$refs.previewContainer) {
        this.$refs.previewContainer.scrollTop = scrollPercentage * (this.$refs.previewContainer.scrollHeight - this.$refs.previewContainer.clientHeight)
      }
      
      setTimeout(() => {
        this.isSyncing = false
      }, 50)
    },
    
    handlePreviewScroll(e) {
      if (this.isSyncing) return
      
      this.isSyncing = true
      this.lastPreviewScrollTop = e.target.scrollTop
      
      // Calculate scroll percentage
      const scrollPercentage = e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight)
      
      // Apply to editor
      if (this.$refs.editor) {
        this.$refs.editor.scrollTop = scrollPercentage * (this.$refs.editor.scrollHeight - this.$refs.editor.clientHeight)
      }
      
      setTimeout(() => {
        this.isSyncing = false
      }, 50)
    },
    
    toggleNightMode() {
      this.isNightMode = !this.isNightMode
      // Re-render mermaid with new theme
      this.$nextTick(() => {
        this.renderMermaid()
      })
    },
    
    toggleFullscreen() {
      this.fullscreenVisible = true
      this.$nextTick(() => {
        this.renderMermaid()
      })
    },
    
    loadSample() {
      this.markdownContent = `# 智能运维平台文档

## 系统架构概述

本系统基于微服务架构设计，包含以下几个核心模块：

### 核心服务模块

\`\`\`mermaid
graph TD
    A[API网关] --> B[认证授权服务]
    A --> C[用户管理服务]
    A --> D[设备管理服务]
    A --> E[任务调度服务]
    A --> F[数据统计服务]
    B --> G[(MySQL数据库)]
    C --> G
    D --> G
    E --> G
    F --> H[(Redis缓存)]
    F --> I[(Elasticsearch)]
\`\`\`

### 业务流程

\`\`\`mermaid
sequenceDiagram
    participant U as 用户
    participant G as API网关
    participant A as 认证服务
    participant D as 设备服务
    participant DB as 数据库
    
    U->>G: 登录请求
    G->>A: 验证凭证
    A->>DB: 查询用户信息
    DB-->>A: 返回用户数据
    A-->>G: 验证结果
    G-->>U: 登录成功
    
    U->>G: 获取设备列表
    G->>D: 查询设备
    D->>DB: 查询设备数据
    DB-->>D: 返回设备列表
    D-->>G: 设备数据
    G-->>U: 返回设备列表
\`\`\`

## 部署方案

### Kubernetes部署架构

\`\`\`mermaid
graph LR
    A[Kubernetes集群] --> B[Ingress控制器]
    B --> C[负载均衡器]
    C --> D[API服务Pods]
    C --> E[Web前端Pods]
    C --> F[数据库Pods]
    D --> G[外部数据库]
    D --> H[消息队列]
\`\`\`

## API接口规范

### 用户认证接口

#### 登录接口

- **URL**: \`/api/v1/auth/login\`
- **Method**: \`POST\`
- **Description**: 用户登录认证

\`\`\`javascript
// 请求示例
{
  "username": "admin",
  "password": "123456"
}

// 响应示例
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": 1,
      "username": "admin",
      "roles": ["admin"]
    }
  }
\`\`\`

### 设备管理接口

#### 获取设备列表

- **URL**: \`/api/v1/devices\`
- **Method**: \`GET\`
- **Description**: 获取所有设备信息

\`\`\`python
# Python SDK 示例
import requests

def get_devices(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get("/api/v1/devices", headers=headers)
    return response.json()
\`\`\`

## 监控告警配置

### 告警规则设置

\`\`\`mermaid
graph LR
    A[监控指标] --> B{阈值判断}
    B -->|超过阈值| C[触发告警]
    B -->|正常范围| D[继续监控]
    C --> E[发送通知]
    E --> F[邮件通知]
    E --> G[短信通知]
    E --> H[微信通知]
\`\`\`

## 故障处理流程

### 网络故障处理

\`\`\`mermaid
flowchart TD
    A[网络异常] --> B{是否能ping通网关}
    B -->|是| C{DNS解析是否正常}
    B -->|否| D[检查物理连接]
    C -->|是| E[检查防火墙设置]
    C -->|否| F[检查DNS配置]
    D --> G[联系网络管理员]
    E --> H[调整防火墙规则]
    F --> I[修正DNS配置]
\`\`\`

## 配置示例

### Nginx配置

\`\`\`nginx
server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
\`\`\`

### 数据库配置

\`\`\`sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, email) VALUES 
('admin', 'hashed_password', 'admin@example.com');
\`\`\`
`
    },
    clearContent() {
      this.markdownContent = ''
      this.parseMarkdown()
    },
    copyContent() {
      navigator.clipboard.writeText(this.markdownContent).then(() => {
        this.$message.success('内容已复制到剪贴板')
      }).catch(err => {
        this.$message.error('复制失败: ' + err)
      })
    },
    downloadMarkdown() {
      const blob = new Blob([this.markdownContent], { type: 'text/markdown;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'document.md'
      link.click()
      URL.revokeObjectURL(link.href)
    },
    saveToLocalStorage() {
      try {
        localStorage.setItem('markdown-content', this.markdownContent)
      } catch (e) {
        console.error('Failed to save to localStorage:', e)
      }
    },
    loadFromLocalStorage() {
      try {
        const savedContent = localStorage.getItem('markdown-content')
        if (savedContent) {
          this.markdownContent = savedContent
          this.parseMarkdown()
        } else {
          this.loadSample()
        }
      } catch (e) {
        console.error('Failed to load from localStorage:', e)
        this.loadSample()
      }
    }
  },
  mounted: function() {
    // Load content from localStorage or sample
    this.loadFromLocalStorage()
  },
  beforeDestroy: function() {
    // Save content before leaving
    this.saveToLocalStorage()
  }
}
</script>

<style lang="scss" scoped>
.markdown-editor-container {
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  color: #303133;
  transition: background-color 0.3s, color 0.3s;
  min-height: 0;
  box-sizing: border-box;
  
  &.night-mode {
      background-color: #1e1e1e;
      color: #e0e0e0;
      height: 100%;
      box-sizing: border-box;
      
      .toolbar {
        background-color: #2d2d2d;
        border-bottom: 1px solid #3f3f3f;
        
        .el-button {
          background-color: #3f3f3f;
          border-color: #555;
          color: #e0e0e0;
        }
      }
      
      .toc-container {
        background-color: #252526;
        border-right: 1px solid #3f3f3f;
        height: 100%;
        box-sizing: border-box;
        
        h3 {
          color: #e0e0e0;
        }
        
        .toc-item {
          &:hover {
            background-color: #3a3a3a;
          }
          
          &.active {
            background-color: #094771;
          }
        }
      }
      
      .editor-panel,
      .preview-panel {
        background-color: #1e1e1e;
        height: 100% !important;
        min-height: 0;
        box-sizing: border-box;
        
        .panel-header {
          background-color: #252526;
          border-bottom: 1px solid #3f3f3f;
          
          h3 {
            color: #e0e0e0;
          }
        }
      }
      
      .markdown-editor {
        background-color: #1e1e1e;
        color: #e0e0e0;
        border: 1px solid #3f3f3f;
        height: 100% !important;
      }
      
      .markdown-preview {
        background-color: #1e1e1e;
        color: #e0e0e0;
        height: 100%;
        box-sizing: border-box;
      }
      
      .fullscreen-preview {
        background-color: #1e1e1e;
        color: #e0e0e0;
      }
      
      .editor-wrapper,
      .editor-area {
        min-height: 0;
      }
      
      /* 夜间模式下split-pane的样式 */
      .responsive-split-pane {
        background-color: #1e1e1e;
        height: 100%;
      }
      
      .responsive-split-pane >>> .el-split-pane__pane {
        background-color: #1e1e1e;
      }
      
      .responsive-split-pane >>> .el-split-pane__splitter {
        background-color: #3f3f3f;
      }
      
      .responsive-split-pane >>> .el-split-pane__splitter:hover {
        background-color: #5a5a5a;
      }
    }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  
  .word-count {
    font-size: 14px;
    color: #606266;
  }
}

.editor-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-wrap: wrap;
  min-height: 0;
  height: 100%;
}

.toc-container {
  width: 250px;
  background-color: #fafafa;
  border-right: 1px solid #ebeef5;
  padding: 15px;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
  
  h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #303133;
  }
  
  .toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .toc-item {
    padding: 8px 10px;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    
    &:hover {
      background-color: #ecf5ff;
    }
    
    &.level-1 {
      font-weight: bold;
      padding-left: 10px;
    }
    
    &.level-2 {
      padding-left: 25px;
    }
    
    &.level-3 {
      padding-left: 40px;
    }
    
    .toc-number {
      margin-right: 8px;
      color: #409eff;
      font-weight: bold;
    }
    
    .toc-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0; /* 防止flex子元素溢出 */
  min-height: 0;
  height: 100%;
}

.editor-panel,
.preview-panel {
  display: flex;
  flex-direction: column;
  height: 100% !important;
  min-height: 0;
  background-color: #ffffff;
  box-sizing: border-box;
}
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #dcdfe6;
    
    h3 {
      margin: 0;
      color: #303133;
    }
  }

.markdown-editor {
  flex: 1;
  width: 100%;
  min-height: 0;
  height: 100% !important;
  padding: 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  resize: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  background-color: #ffffff;
  color: #303133;
  box-sizing: border-box;
  overflow-y: auto;
}

.markdown-editor:focus {
  border-color: #409eff;
}

.markdown-preview {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background-color: #ffffff;
  color: #303133;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  word-break: break-word;
  overflow-wrap: break-word;
}
  
  ::v-deep {
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    
    h1 {
      font-size: 2em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #eaecef;
    }
    
    h2 {
      font-size: 1.5em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #eaecef;
    }
    
    h3 {
      font-size: 1.25em;
    }
    
    p {
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    
    a {
      color: #409eff;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(27, 31, 35, 0.05);
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
    
    pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      position: relative;
      
      &.hljs {
        background-color: #f6f8fa;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        
        code {
          padding: 0;
          margin: 0;
          font-size: 100%;
          background-color: transparent;
          border: 0;
        }
      }
      
      code {
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        background-color: rgba(27, 31, 35, 0.05);
        border-radius: 3px;
        font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
      }
      
      .copy-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 12px;
        
        &:hover {
          background-color: #e0e0e0;
        }
      }
    }
    
    blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
      margin: 0 0 16px;
    }
    
    ul, ol {
      padding-left: 2em;
      margin-top: 0;
      margin-bottom: 16px;
    }
    
    li {
      margin-bottom: 8px;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
      
      th, td {
        padding: 6px 13px;
        border: 1px solid #dfe2e5;
      }
      
      th {
        background-color: #f6f8fa;
        font-weight: 600;
      }
      
      tr:nth-child(2n) {
        background-color: #f6f8fa;
      }
    }
    
    hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: #e1e4e8;
      border: 0;
    }
    
    .mermaid {
      text-align: center;
      margin: 16px 0;
      padding: 10px;
      background-color: #f6f8fa;
      border-radius: 3px;
    }
  }

.fullscreen-dialog {
  ::v-deep .el-dialog {
    margin: 0;
    height: 100%;
    background-color: #ffffff;
    
    &.night-mode {
      background-color: #1e1e1e;
      
      .fullscreen-header {
        background-color: #252526;
        border-bottom: 1px solid #3f3f3f;
      }
      
      .fullscreen-preview {
        background-color: #1e1e1e;
        color: #e0e0e0;
      }
    }
  }
  
  ::v-deep .el-dialog__header {
    display: none;
  }
  
  ::v-deep .el-dialog__body {
    padding: 0;
    height: 100%;
  }
}

.fullscreen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  
  h3 {
    margin: 0;
    color: #303133;
  }
  
  .el-button {
    padding: 8px 12px;
  }
}

.fullscreen-preview {
  height: calc(100vh - 60px);
  overflow-y: auto;
  padding: 20px;
  background-color: #ffffff;
  color: #303133;
  
  ::v-deep {
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    
    h1 {
      font-size: 2em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #eaecef;
    }
    
    h2 {
      font-size: 1.5em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #eaecef;
    }
    
    h3 {
      font-size: 1.25em;
    }
    
    p {
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    
    a {
      color: #409eff;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(27, 31, 35, 0.05);
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
    
    pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      position: relative;
      
      &.hljs {
        background-color: #f6f8fa;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        
        code {
          padding: 0;
          margin: 0;
          font-size: 100%;
          background-color: transparent;
          border: 0;
        }
      }
      
      code {
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        background-color: rgba(27, 31, 35, 0.05);
        border-radius: 3px;
        font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
      }
    }
    
    blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
      margin: 0 0 16px;
    }
    
    ul, ol {
      padding-left: 2em;
      margin-top: 0;
      margin-bottom: 16px;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
      
      th, td {
        padding: 6px 13px;
        border: 1px solid #dfe2e5;
      }
      
      th {
        background-color: #f6f8fa;
        font-weight: 600;
      }
      
      tr:nth-child(2n) {
        background-color: #f6f8fa;
      }
    }
    
    .mermaid {
      text-align: center;
      margin: 16px 0;
      padding: 10px;
      background-color: #f6f8fa;
      border-radius: 3px;
    }
  }
}

@media (max-width: 768px) {
  .toc-container {
    display: none;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .toolbar {
    .el-button-group {
      flex-wrap: wrap;
      
      .el-button {
        flex: 1;
        margin-bottom: 5px;
      }
    }
  }
}

.responsive-split-pane {
  display: flex;
  flex: 1 !important;
  min-height: 0;
  height: 100% !important;
  width: 100%;
}

/* 确保split-pane的子面板正确显示 */
.responsive-split-pane >>> .el-split-pane__pane {
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100% !important;
  width: 100% !important;
}

/* 处理split-pane的slider */
.responsive-split-pane >>> .el-split-pane__splitter {
  transition: all 0.3s ease;
}

.responsive-split-pane >>> .el-split-pane__splitter:hover {
  background-color: #409eff;
}

/* 中等屏幕尺寸响应式调整 */
@media (max-width: 1024px) {
  .toc-container {
    width: 200px;
  }
  
  .responsive-split-pane >>> .el-split-pane__splitter {
    width: 6px;
  }
}

/* 小屏幕特殊处理，确保编辑区和预览区正常显示 */
@media (max-width: 768px) {
  .markdown-editor-container {
    height: calc(100vh - 100px);
  }
  
  .editor-panel,
  .preview-panel {
    min-height: 300px;
  }
  
  .markdown-editor,
  .markdown-preview {
    padding: 10px;
    font-size: 13px;
  }
}

/* 平板设备优化 */
@media (max-width: 992px) {
  .responsive-split-pane {
    /* 平板设备上调整分割比例 */
    --split-percent: 50%;
  }
}

/* 响应式布局优化 */
  /* 确保在所有屏幕尺寸下都能正确显示 */
  @media screen and (max-width: 992px) {
    .markdown-editor-container {
      height: calc(100vh - 120px);
    }
  }
  
  @media screen and (max-width: 768px) {
    .markdown-editor-container {
      height: calc(100vh - 140px);
    }
    
    .editor-wrapper {
      flex-direction: column;
      min-height: 0;
    }
    
    .editor-area {
      order: 1;
      min-height: 0;
    }
    
    .toc-container {
      order: 2;
      width: 100% !important;
      height: auto !important;
      max-height: 30vh;
      border-right: none;
      border-top: 1px solid #ebeef5;
    }
  }
  
  @media screen and (max-width: 640px) {
    .responsive-split-pane {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    
    .responsive-split-pane >>> .el-split-pane__pane {
      min-height: 250px;
      height: auto;
      flex-shrink: 0;
    }
    
    .markdown-editor,
    .markdown-preview {
      min-height: 250px;
      font-size: 14px;
      padding: 12px;
    }
    
    /* 移动设备上简化split-pane的处理 */
    .responsive-split-pane >>> .el-split-pane__splitter {
      display: none;
    }
  }
</style>