<template>
  <div class="article-detail-container">
    <el-card shadow="hover" v-if="article">
      <template #header>
        <div class="header-title">
          <span>{{ article.title }}</span>
        </div>
      </template>
      
      <div class="article-meta">
        <span class="author">{{ article.author || '未知作者' }}</span>
        <span class="create-time">{{ formatDate(article.created_at) }}</span>
      </div>
      
      <div class="article-content" v-html="article.content"></div>
      
      <div class="article-actions">
        <el-button @click="backToList">返回列表</el-button>
      </div>
    </el-card>
    
    <div v-else class="loading-container">
      <el-skeleton animated :rows="10" />
    </div>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'ArticleDetail',
  data() {
    return {
      article: null
    }
  },
  created() {
    this.fetchArticleDetail()
  },
  methods: {
    fetchArticleDetail() {
      const { id } = this.$route.params
      if (!id) {
        this.$message.error('文章ID不存在')
        return
      }
      
      // 调用后端API获取文章详情
      request({
        url: `/v1/sys-content/${id}`,
        method: 'get'
      }).then(res => {
        if (res && res.data) {
          this.article = res.data
        }
      }).catch(err => {
        console.error('获取文章详情失败:', err)
        this.$message.error('获取文章详情失败')
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
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.article-meta {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
  font-size: 14px;
  color: #909399;
}

.article-meta .author {
  margin-right: 20px;
}

.article-content {
  margin: 20px 0;
  line-height: 1.8;
  color: #303133;
}

.article-content h1,
.article-content h2,
.article-content h3,
.article-content h4,
.article-content h5,
.article-content h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.article-content h1 {
  font-size: 2em;
}

.article-content h2 {
  font-size: 1.5em;
}

.article-content h3 {
  font-size: 1.25em;
}

.article-content p {
  margin-bottom: 16px;
}

.article-content ul,
.article-content ol {
  margin-bottom: 16px;
  padding-left: 2em;
}

.article-content img {
  max-width: 100%;
  height: auto;
}

.article-content pre {
  margin-bottom: 16px;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
}

.article-content blockquote {
  margin-bottom: 16px;
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
}

.article-actions {
  margin-top: 30px;
  text-align: center;
}

.loading-container {
  padding: 20px;
}
</style>