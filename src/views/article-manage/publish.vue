<template>
  <div class="publish-article-container">
    <el-card shadow="hover" class="full-width-card">
      <template #header>
        <div class="header-title">
          <span>我的文章</span>
          <div class="header-actions">
            <el-upload
              class="upload-demo"
              :limit="1"
              accept=".md"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileChange"
              action="#"
            >
              <el-button size="small" type="primary" icon="el-icon-upload2">上传Markdown文件</el-button>
            </el-upload>
            <el-button size="small" type="info" icon="el-icon-full-screen" @click="toggleEditorFullscreen">全屏编辑</el-button>
          </div>
        </div>
      </template>
      
      <el-form ref="articleForm" :model="article" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="article.title" placeholder="请输入标题" maxlength="100" show-word-limit></el-input>
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <!-- 使用系统工具中的专业Markdown编辑器组件 -->
          <enhanced-markdown-editor 
            ref="markdownEditor"
            :initial-content="article.content"
            @content-change="handleContentFromEditor"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">发布</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import EnhancedMarkdownEditor from '@/views/sys-tools/enhanced-markdown-editor.vue'
import { publishArticle } from '@/api/article'

export default {
  name: 'PublishArticle',
  components: {
    EnhancedMarkdownEditor
  },
  data() {
    return {
      article: {
        title: '',
        content: ''
      },
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
  methods: {
    // 切换编辑器全屏模式
    toggleEditorFullscreen() {
      if (this.$refs.markdownEditor) {
        this.$refs.markdownEditor.toggleFullscreen()
      }
    },
    
    // 处理从编辑器组件获取内容
    handleContentFromEditor(content) {
      this.article.content = content
    },
    
    // 处理文件上传变化
    handleFileChange(file) {
      console.log('处理上传文件:', file.name)
      
      // 验证文件类型
      const isMd = file.raw && (file.raw.type === 'text/markdown' || file.name.endsWith('.md'))
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
      
      // 直接读取文件内容，无需用户点击导入按钮
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          if (e.target && e.target.result) {
            const content = e.target.result
            this.article.content = content
            
            // 尝试从Front Matter中提取标题等元数据
            this.extractFrontMatter(content)
            
            this.$message.success('文件内容已自动导入')
          } else {
            throw new Error('文件内容为空')
          }
        } catch (error) {
          console.error('处理文件内容时出错:', error)
          this.$message.error('处理文件内容失败')
        }
      }
      reader.onerror = (error) => {
        console.error('读取文件失败:', error)
        this.$message.error('读取文件失败')
      }
      reader.readAsText(file.raw, 'utf-8')
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
          console.log('提交文章数据:', { title: this.article.title, contentLength: this.article.content.length })
          
          // 添加加载状态
          const loadingInstance = this.$loading({
            lock: true,
            text: '正在发布文章...',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.7)'
          })
          
          // 使用已封装的API方法发布文章
          publishArticle({
            title: this.article.title,
            content: this.article.content,
            html_content: '' // 为了匹配数据库字段名，确保数据完整
          })
          .then(res => {
            loadingInstance.close()
            console.log('发布文章API响应:', res)
            
            // 增强响应格式检测 - 检查各种可能的成功响应格式
            const isSuccess = res && (
              res.code === 200 || 
              res.code === 0 || 
              res.success === true || 
              res.status === 'success' || 
              (res.data && res.data.success)
            )
            
            if (isSuccess) {
              console.log('文章发布成功，准备显示成功提示')
              this.$message({
                message: '文章发布成功',
                type: 'success',
                duration: 2000
              })
              // 延迟重置和跳转，确保用户能看到成功提示
              setTimeout(() => {
                this.resetForm()
                // 跳转到我的文章列表
                this.$router.push('/article-manage/my-articles')
              }, 1500)
            } else {
              // 详细的错误信息处理 - 检查各种可能的错误信息字段
              const errorMsg = res?.msg || 
                             res?.message || 
                             res?.error || 
                             (res?.data && (res.data.msg || res.data.message)) || 
                             '文章发布失败'
              console.error('发布失败原因:', errorMsg)
              console.error('完整响应:', res)
              this.$message.error(errorMsg)
            }
          })
          .catch(err => {
            loadingInstance.close()
            console.error('发布文章捕获到错误:', err)
            
            // 更详细的错误类型区分和消息处理
            let errorMsg = '文章发布失败'
            
            if (err.response) {
              // 服务器返回了错误响应
              console.error('响应错误状态:', err.response.status)
              console.error('响应错误数据:', err.response.data)
              
              if (err.response.status === 401) {
                errorMsg = '未授权，请重新登录'
              } else if (err.response.status === 403) {
                errorMsg = '没有权限发布文章'
              } else if (err.response.status === 400) {
                errorMsg = err.response.data?.msg || err.response.data?.message || '请求参数错误'
              } else if (err.response.status === 500) {
                errorMsg = '服务器错误，请稍后重试'
              } else {
                errorMsg = err.response.data?.msg || err.response.data?.message || err.response.statusText || errorMsg
              }
            } else if (err.request) {
              // 请求已发出但没有收到响应
              console.error('网络请求失败详情:', err.request)
              errorMsg = '网络请求失败，请检查网络连接'
            } else {
              // 请求配置出错
              errorMsg = err.message || errorMsg
            }
            
            this.$message.error(errorMsg)
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
    }
  },
}
</script>

<style scoped>
.publish-article-container {
  padding: 20px;
  width: 100%;
  margin: 0 auto;
}

.full-width-card {
  width: 100%;
  max-width: none;
}

.header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 确保编辑器组件有足够的高度 */
:deep(.markdown-editor-container) {
  min-height: 600px;
}
</style>