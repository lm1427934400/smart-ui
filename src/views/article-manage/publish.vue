<template>
  <div class="publish-article-container">
    <el-card shadow="hover">
      <template #header>
        <div class="header-title">
          <span>发布技术博客</span>
        </div>
      </template>
      
      <el-form ref="articleForm" :model="article" :rules="rules" label-width="100px">
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="article.title" placeholder="请输入文章标题" maxlength="100" show-word-limit></el-input>
        </el-form-item>

        <!-- 文件导入区域 -->
        <el-form-item>
          <el-upload
            class="upload-demo"
            :limit="1"
            :accept="'.md'"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
          >
            <el-button size="small" type="primary">上传Markdown文件</el-button>
            <div class="el-upload__tip">支持 .md 文件上传，最大50MB</div>
          </el-upload>
          <el-button size="small" type="success" @click="handleImportFile" :disabled="!uploadedFile">导入文件内容</el-button>
        </el-form-item>

        <!-- Markdown编辑器工具栏 -->
        <div class="toolbar">
          <el-button-group>
            <el-button size="mini" @click="insertMarkdown('# ', '标题')">标题</el-button>
            <el-button size="mini" @click="insertMarkdown('**', '粗体')">粗体</el-button>
            <el-button size="mini" @click="insertMarkdown('*', '斜体')">斜体</el-button>
            <el-button size="mini" @click="insertMarkdown('> ', '引用')">引用</el-button>
            <el-button size="mini" @click="insertMarkdown('```\n```', '代码块')">代码块</el-button>
            <el-button size="mini" @click="insertMarkdown('[链接文本](链接地址)', '链接')">链接</el-button>
            <el-button size="mini" @click="insertMarkdown('![图片描述](图片地址)', '图片')">图片</el-button>
          </el-button-group>
        </div>
        
        <el-form-item label="文章内容" prop="content">
          <!-- 双栏布局的Markdown编辑器 -->
          <div class="markdown-editor-wrapper">
            <div class="split-container">
              <!-- 编辑区 -->
              <div class="editor-panel">
                <textarea
                  ref="markdownEditor"
                  v-model="article.content"
                  class="markdown-textarea"
                  placeholder="请输入Markdown内容"
                  @input="handleContentChange"
                  @scroll="handleEditorScroll"
                ></textarea>
              </div>
              <!-- 预览区 -->
              <div class="preview-panel">
                <div 
                  class="markdown-preview" 
                  v-html="parsedContent"
                  @scroll="handlePreviewScroll"
                ></div>
              </div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">发布文章</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="downloadMarkdown">下载Markdown</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import request from '@/utils/request'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

export default {
  name: 'PublishArticle',
  data() {
    return {
      article: {
        title: '',
        content: ''
      },
      parsedContent: '',
      uploadedFile: null,
      md: null,
      isSyncing: false,
      syncTimer: null,
      rules: {
        title: [
          { required: true, message: '请输入文章标题', trigger: 'blur' },
          { min: 5, max: 100, message: '标题长度在 5 到 100 个字符', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入文章内容', trigger: 'blur' },
          { min: 10, message: '文章内容至少 10 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    // 初始化markdown-it实例
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str, lang) => {
        if (lang && lang === 'mermaid') {
          // 为mermaid代码块生成唯一ID
          const id = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
          return `<div class="mermaid" data-mermaid-id="${id}">${str}</div>`
        }
        
        // 处理其他代码块的语法高亮
        if (lang) {
          try {
            if (hljs.getLanguage(lang)) {
              return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
            }
          } catch (__) {
            // 如果语言不支持，回退到纯文本
          }
        }
        
        // 默认：转义HTML并包装在code标签中
        return `<pre class="hljs"><code>${this.md.utils.escapeHtml(str)}</code></pre>`
      }
    })
  },
  methods: {
    // 处理Markdown内容变化，实现实时预览
    handleContentChange() {
      // 防抖处理，延迟不超过300ms
      if (this.syncTimer) {
        clearTimeout(this.syncTimer)
      }
      this.syncTimer = setTimeout(() => {
        this.parseMarkdown()
      }, 200)
    },
    
    // 解析Markdown内容
    parseMarkdown() {
      if (!this.article.content) {
        this.parsedContent = ''
        return
      }
      
      let htmlContent = this.md.render(this.article.content)
      this.parsedContent = htmlContent
      
      // 渲染mermaid图表
      this.$nextTick(() => {
        this.renderMermaid()
        this.addCopyButtons()
      })
    },
    
    // 渲染mermaid图表
    renderMermaid() {
      if (window.mermaid) {
        window.mermaid.init(undefined, '.mermaid')
      }
    },
    
    // 添加复制按钮到代码块
    addCopyButtons() {
      const codeBlocks = document.querySelectorAll('.preview-panel pre code')
      codeBlocks.forEach((block) => {
        const pre = block.parentNode
        if (pre.querySelector('.copy-btn')) return
        
        const button = document.createElement('button')
        button.className = 'copy-btn'
        button.textContent = '复制'
        button.onclick = () => {
          navigator.clipboard.writeText(block.textContent).then(() => {
            this.$message.success('代码已复制到剪贴板')
          }).catch(() => {
            this.$message.error('复制失败')
          })
        }
        pre.appendChild(button)
      })
    },
    
    // 插入Markdown语法
    insertMarkdown(syntax, placeholder) {
      const textarea = this.$refs.markdownEditor
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = this.article.content.substring(start, end)
      
      // 如果有选中的文本，使用它作为占位符内容
      const content = selectedText || placeholder
      
      // 插入语法和内容
      if (syntax.includes('\n```') && syntax.includes('```')) {
        // 特殊处理代码块
        const before = this.article.content.substring(0, start)
        const after = this.article.content.substring(end)
        this.article.content = before + syntax + after
        
        // 将光标放在代码块中间
        const newCursorPos = start + 4
        setTimeout(() => {
          textarea.selectionStart = newCursorPos
          textarea.selectionEnd = newCursorPos
          textarea.focus()
        }, 0)
      } else if (syntax.includes('**') || syntax.includes('*')) {
        // 处理粗体和斜体
        const before = this.article.content.substring(0, start)
        const after = this.article.content.substring(end)
        this.article.content = before + syntax + content + syntax + after
        
        setTimeout(() => {
          textarea.selectionStart = start + syntax.length
          textarea.selectionEnd = start + syntax.length + content.length
          textarea.focus()
        }, 0)
      } else {
        // 处理其他语法
        const before = this.article.content.substring(0, start)
        const after = this.article.content.substring(end)
        this.article.content = before + syntax + content + after
        
        setTimeout(() => {
          textarea.selectionStart = start + syntax.length
          textarea.selectionEnd = start + syntax.length + content.length
          textarea.focus()
        }, 0)
      }
      
      // 触发内容更新和预览
      this.handleContentChange()
    },
    
    // 处理编辑器滚动
    handleEditorScroll(event) {
      if (this.isSyncing) return
      this.isSyncing = true
      
      const editor = event.target
      const preview = this.$el.querySelector('.markdown-preview')
      
      const scrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
      const newScrollTop = scrollRatio * (preview.scrollHeight - preview.clientHeight)
      
      preview.scrollTop = newScrollTop
      
      setTimeout(() => {
        this.isSyncing = false
      }, 50)
    },
    
    // 处理预览区滚动
    handlePreviewScroll(event) {
      if (this.isSyncing) return
      this.isSyncing = true
      
      const preview = event.target
      const editor = this.$refs.markdownEditor
      
      const scrollRatio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
      const newScrollTop = scrollRatio * (editor.scrollHeight - editor.clientHeight)
      
      editor.scrollTop = newScrollTop
      
      setTimeout(() => {
        this.isSyncing = false
      }, 50)
    },
    
    // 处理文件上传变化
    handleFileChange(file) {
      // 验证文件类型
      const isMd = file.raw.type === 'text/markdown' || file.name.endsWith('.md')
      if (!isMd) {
        this.$message.error('请上传 .md 格式的文件')
        return false
      }
      
      // 验证文件大小（50MB）
      const isLt50M = file.size / 1024 / 1024 < 50
      if (!isLt50M) {
        this.$message.error('上传文件大小不能超过50MB')
        return false
      }
      
      this.uploadedFile = file.raw
      this.$message.success('文件已选择，点击导入按钮加载内容')
    },
    
    // 导入文件内容
    handleImportFile() {
      if (!this.uploadedFile) {
        this.$message.error('请先选择要导入的文件')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result
        this.article.content = content
        
        // 尝试从Front Matter中提取标题等元数据
        this.extractFrontMatter(content)
        
        // 触发内容更新和预览
        this.handleContentChange()
        this.$message.success('文件内容已导入')
      }
      reader.onerror = () => {
        this.$message.error('读取文件失败')
      }
      reader.readAsText(this.uploadedFile)
    },
    
    // 从Front Matter中提取元数据
    extractFrontMatter(content) {
      const frontMatterRegex = /^---\s*([\s\S]*?)\s*---/m
      const match = frontMatterRegex.exec(content)
      
      if (match && match[1]) {
        const frontMatter = match[1]
        const lines = frontMatter.split('\n')
        
        lines.forEach(line => {
          const [key, value] = line.split(':').map(part => part.trim())
          if (key && value) {
            // 移除引号
            const cleanValue = value.replace(/^["']|['"]$/g, '')
            if (key === 'title' && !this.article.title) {
              this.article.title = cleanValue
            }
            // 可以根据需要提取更多元数据
          }
        })
      }
    },
    
    // 下载Markdown内容
    downloadMarkdown() {
      const blob = new Blob([this.article.content], { type: 'text/markdown;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${this.article.title || '未命名文章'}.md`
      link.click()
      URL.revokeObjectURL(link.href)
    },
    
    // 提交表单
    submitForm() {
      this.$refs.articleForm.validate((valid) => {
        if (valid) {
          // 创建FormData对象用于文件上传
          const formData = new FormData()
          formData.append('title', this.article.title)
          formData.append('content', this.article.content)
          
          // 如果有上传的文件，也添加到FormData中
          if (this.uploadedFile) {
            formData.append('file', this.uploadedFile)
          }
          
          // 调用后端API发布文章，使用multipart/form-data格式
          request({
            url: '/v1/sys-content',
            method: 'post',
            data: formData,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then(res => {
            if (res && res.code === 0) {
              this.$message.success('文章发布成功')
              this.resetForm()
              // 跳转到我的文章列表
              this.$router.push('/article-manage/my-articles')
            } else {
              this.$message.error(res.message || '文章发布失败')
            }
          }).catch(err => {
            console.error('发布文章失败:', err)
            this.$message.error('文章发布失败')
          })
        } else {
          console.log('表单验证失败')
          return false
        }
      })
    },
    
    // 重置表单
    resetForm() {
      this.$refs.articleForm.resetFields()
      this.parsedContent = ''
      this.uploadedFile = null
    }
  },
  mounted() {
    // 初始化预览
    this.parseMarkdown()
    
    // 添加拖拽支持
    const container = this.$el.querySelector('.markdown-editor-wrapper')
    container.addEventListener('dragover', (e) => {
      e.preventDefault()
      container.classList.add('drag-over')
    })
    
    container.addEventListener('dragleave', () => {
      container.classList.remove('drag-over')
    })
    
    container.addEventListener('drop', (e) => {
      e.preventDefault()
      container.classList.remove('drag-over')
      
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0]
        // 模拟文件选择
        if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
          this.uploadedFile = file
          this.handleImportFile()
        } else {
          this.$message.error('请上传 .md 格式的文件')
        }
      }
    })
  }
}
</script>

<style scoped>
.publish-article-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar {
  margin: 10px 0;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.markdown-editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  height: 600px;
  transition: all 0.3s;
}

.markdown-editor-wrapper.drag-over {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.split-container {
  display: flex;
  height: 100%;
}

.editor-panel {
  flex: 1;
  border-right: 1px solid #dcdfe6;
  position: relative;
}

.preview-panel {
  flex: 1;
  overflow-y: auto;
  background-color: #ffffff;
}

.markdown-textarea {
  width: 100%;
  height: 100%;
  padding: 15px;
  border: none;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  outline: none;
}

.markdown-preview {
  padding: 15px;
  overflow-y: auto;
  height: 100%;
}

/* Markdown样式 */
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  margin-top: 20px;
  margin-bottom: 10px;
  font-weight: 600;
}

.markdown-preview :deep(h1) {
  font-size: 24px;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 8px;
}

.markdown-preview :deep(h2) {
  font-size: 20px;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 8px;
}

.markdown-preview :deep(h3) {
  font-size: 16px;
}

.markdown-preview :deep(p) {
  margin-bottom: 16px;
  line-height: 1.6;
}

.markdown-preview :deep(pre) {
  position: relative;
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  margin-bottom: 16px;
}

.markdown-preview :deep(code) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.markdown-preview :deep(pre code) {
  padding: 0;
  background-color: transparent;
  border-radius: 0;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  padding: 0 1em;
  color: #6a737d;
  margin-bottom: 16px;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.markdown-preview :deep(table th),
.markdown-preview :deep(table td) {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

.markdown-preview :deep(table th) {
  font-weight: 600;
  background-color: #f6f8fa;
}

/* 复制按钮样式 */
.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #f6f8fa;
  border: 1px solid #d1d5da;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.markdown-preview :deep(pre:hover .copy-btn) {
  opacity: 1;
}

.copy-btn:hover {
  background-color: #f3f4f6;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .split-container {
    flex-direction: column;
  }
  
  .editor-panel,
  .preview-panel {
    flex: none;
    height: 50%;
  }
  
  .editor-panel {
    border-right: none;
    border-bottom: 1px solid #dcdfe6;
  }
}
</style>