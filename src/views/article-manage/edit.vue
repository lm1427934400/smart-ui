<template>
  <div class="edit-article-container">
    <el-card shadow="hover">
      <template #header>
        <div class="header-title">
          <span>编辑文章</span>
        </div>
      </template>
      
      <el-form :model="article" label-width="80px" class="article-form">
        <el-form-item label="文章标题" prop="title" :rules="[{ required: true, message: '请输入文章标题', trigger: 'blur' }]">
          <el-input v-model="article.title" placeholder="请输入文章标题" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="文章内容" prop="content" :rules="[{ required: true, message: '请输入文章内容', trigger: 'blur' }]">
          <EnhancedMarkdownEditor 
            v-model="article.content" 
            :height="500" 
            :show-toolbar="true"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">保存修改</el-button>
          <el-button @click="cancelEdit">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { getArticleDetail, updateArticle } from '@/api/article'
import EnhancedMarkdownEditor from '@/views/sys-tools/enhanced-markdown-editor.vue'

export default {
  name: 'EditArticle',
  components: {
    EnhancedMarkdownEditor
  },
  data() {
    return {
      article: {
        id: '',
        title: '',
        content: ''
      },
      loading: false
    }
  },
  created() {
    const { id } = this.$route.params
    if (id) {
      this.article.id = id
      this.fetchArticleDetail()
    } else {
      this.$message.error('文章ID不存在')
      this.$router.push('/article-manage/my-articles')
    }
  },
  methods: {
    fetchArticleDetail() {
      this.loading = true
      getArticleDetail(this.article.id)
        .then(res => {
          if (res && res.code === 200) {
            this.article = res.data
          } else {
            this.$message.error(res?.msg || '获取文章详情失败')
            this.$router.push('/article-manage/my-articles')
          }
        })
        .catch(err => {
          console.error('获取文章详情失败:', err)
          this.$message.error('获取文章详情失败')
          this.$router.push('/article-manage/my-articles')
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    submitForm() {
      // 表单验证
      if (!this.article.title.trim()) {
        this.$message.error('请输入文章标题')
        return
      }
      
      if (!this.article.content.trim()) {
        this.$message.error('请输入文章内容')
        return
      }
      
      this.loading = true
      
      // 准备提交的数据，包含ID
      const formData = {
        id: this.article.id,
        title: this.article.title,
        content: this.article.content
      }
      
      // 调用更新文章API
      updateArticle(formData)
        .then(res => {
          if (res && res.code === 200) {
            this.$message.success('文章更新成功')
            this.$router.push('/article-manage/my-articles')
          } else {
            this.$message.error(res?.msg || '文章更新失败')
          }
        })
        .catch(err => {
          console.error('更新文章失败:', err)
          this.$message.error('文章更新失败')
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    cancelEdit() {
      this.$router.push('/article-manage/my-articles')
    }
  }
}
</script>

<style scoped>
.edit-article-container {
  padding: 20px;
}

.header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-form {
  margin-top: 20px;
}
</style>
