<template>
  <div class="app-container">
    <div class="markdown-container">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="editor-container">
            <h3>Markdown 编辑器</h3>
            <el-input
              type="textarea"
              v-model="markdownContent"
              placeholder="请输入 Markdown 内容，支持流程图语法"
              :rows="20"
              class="markdown-editor"
            ></el-input>
            <div class="editor-actions">
              <el-button type="primary" @click="parseMarkdown">解析 Markdown</el-button>
              <el-button @click="loadSample">加载示例</el-button>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="preview-container">
            <h3>预览</h3>
            <div class="markdown-preview" ref="previewContainer" v-html="parsedContent"></div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it'

export default {
  name: 'MarkdownParser',
  data() {
    return {
      markdownContent: '',
      parsedContent: ''
    }
  },
  methods: {
    parseMarkdown() {
      // 自定义 highlight 函数来处理 mermaid 代码块
      const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        highlight: (str, lang) => {
          if (lang && lang === 'mermaid') {
            // 为 mermaid 代码块生成唯一的 ID
            const id = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            return `<div class="mermaid" data-mermaid-id="${id}">${str}</div>`;
          }
          return ''; // 其他语言不处理
        }
      });

      // 解析 Markdown 内容
      let htmlContent = md.render(this.markdownContent);
      
      this.parsedContent = htmlContent;
      
      // 在下次 DOM 更新后渲染 mermaid 图表
      this.$nextTick(() => {
        this.renderMermaid();
      });
    },
    
    renderMermaid() {
      // 使用 CDN 方式加载 mermaid
      if (typeof window.mermaid === 'undefined') {
        // 动态加载 mermaid CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        script.onload = () => {
          this.initMermaid();
        };
        document.head.appendChild(script);
      } else {
        this.initMermaid();
      }
    },
    
    initMermaid() {
      // 初始化 mermaid
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true
        }
      });
      
      // 查找所有 mermaid 图表容器
      const mermaidElements = this.$refs.previewContainer.querySelectorAll('.mermaid');
      
      // 为每个图表生成唯一 ID 并渲染
      mermaidElements.forEach((element) => {
        const id = element.getAttribute('data-mermaid-id') || 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        element.setAttribute('id', id);
        
        try {
          // 渲染 mermaid 图表
          window.mermaid.run({
            nodes: [element]
          });
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          element.innerHTML = `<pre>Error rendering diagram: ${error.message}</pre>`;
        }
      });
    },
    
    loadSample() {
      this.markdownContent = `# Markdown 流程图示例

## 基本流程图

\`\`\`mermaid
graph TD
    A[main分支] -->|创建功能分支| B(feature/xxx)
    B -->|开发完成| C[合并请求MR到qa分支]
    C -->|CI/CD测试通过| D[部署到测试环境]
    D -->|测试通过| E[创建pre-production分支]
    E -->|预发布验证| F[创建production分支]
    F -->|正式发布| G[部署到生产环境]
    G -->|发现生产BUG| H(hotfix/xxx)
    H -->|修复后合并到main| A
    H -->|同步到pre-production| E
\`\`\`

## 序列图示例

\`\`\`mermaid
sequenceDiagram
    participant 用户
    participant 系统
    participant 数据库
    
    用户->>系统: 登录请求
    系统->>数据库: 验证用户信息
    数据库-->>系统: 返回验证结果
    系统-->>用户: 登录成功/失败
\`\`\`

## 甘特图示例

\`\`\`mermaid
gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD
    section 设计阶段
    需求分析      :done, des1, 2023-01-01, 2023-01-10
    系统设计      :active, des2, 2023-01-11, 2023-01-20
    section 开发阶段
    前端开发      :2023-01-21, 2023-02-10
    后端开发      :2023-01-21, 2023-02-15
    section 测试阶段
    系统测试      :2023-02-16, 2023-02-28
\`\`\``;
    }
  },
  
  mounted() {
    // 页面加载时加载示例内容
    this.loadSample();
  }
}
</script>

<style lang="scss" scoped>
.markdown-container {
  padding: 20px;
}

.editor-container,
.preview-container {
  height: 100%;
}

.markdown-editor {
  margin-bottom: 15px;
}

.editor-actions {
  text-align: right;
}

.markdown-preview {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  min-height: 500px;
  background-color: #fff;
}

.markdown-preview ::v-deep h1,
.markdown-preview ::v-deep h2,
.markdown-preview ::v-deep h3 {
  color: #303133;
  margin-bottom: 15px;
}

.markdown-preview ::v-deep p {
  line-height: 1.6;
  margin-bottom: 10px;
}

.markdown-preview ::v-deep code {
  background-color: #f5f7fa;
  padding: 2px 4px;
  border-radius: 4px;
  color: #e65100;
}

.markdown-preview ::v-deep pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
}

.markdown-preview ::v-deep pre code {
  background-color: transparent;
  padding: 0;
  color: #303133;
}

.markdown-preview ::v-deep table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 15px;
}

.markdown-preview ::v-deep table th,
.markdown-preview ::v-deep table td {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
}

.markdown-preview ::v-deep table th {
  background-color: #f5f7fa;
  font-weight: bold;
}

.markdown-preview ::v-deep blockquote {
  border-left: 4px solid #409eff;
  padding: 0 15px;
  margin: 0 0 15px;
  color: #606266;
}

.markdown-preview ::v-deep ul,
.markdown-preview ::v-deep ol {
  margin-bottom: 15px;
  padding-left: 30px;
}

.markdown-preview ::v-deep .mermaid-code {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
  font-family: monospace;
}
</style>