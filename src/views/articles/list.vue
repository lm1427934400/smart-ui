<template>
  <div class="article-list-container">
    <div class="search-box">
      <el-input v-model="searchKeyword" placeholder="搜索文章标题" prefix-icon="el-icon-search" style="width: 300px;">
        <template #append>
          <el-button @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>
    
    <el-card shadow="hover" class="article-list">
      <template #header>
        <div class="header-title">
          <span>文章列表</span>
        </div>
      </template>
      
      <div class="article-items">
        <div v-for="article in articles" :key="article.id" class="article-item" @click="viewArticle(article.id)">
          <h3 class="article-title">{{ article.title }}</h3>
          <div class="article-meta">
            <span class="author">{{ article.author || '未知作者' }}</span>
            <span class="create-time">{{ formatDate(article.created_at) }}</span>
          </div>
          <p class="article-summary">{{ truncateContent(article.content, 100) }}</p>
        </div>
      </div>
      
      <div class="pagination" v-if="total > pageSize">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        ></el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'ArticleList',
  data() {
    return {
      articles: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      searchKeyword: ''
    }
  },
  created() {
    this.fetchArticles()
  },
  methods: {
    fetchArticles() {
      // 调用后端API获取文章列表
      request({
        url: '/v1/sys-content',
        method: 'get',
        params: {
          pageSize: this.pageSize,
          pageIndex: this.currentPage,
          title: this.searchKeyword || undefined
        }
      }).then(res => {
        if (res && res.data) {
          this.articles = res.data.list || []
          this.total = res.data.total || 0
        }
      }).catch(err => {
        console.error('获取文章列表失败:', err)
        this.$message.error('获取文章列表失败')
      })
    },
    
    viewArticle(id) {
      this.$router.push(`/articles/detail/${id}`)
    },
    
    handleSearch() {
      this.currentPage = 1
      this.fetchArticles()
    },
    
    handlePageChange(page) {
      this.currentPage = page
      this.fetchArticles()
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    
    truncateContent(content, length) {
      if (!content) return ''
      // 移除HTML标签
      const plainText = content.replace(/<[^>]*>/g, '')
      return plainText.length > length ? plainText.substring(0, length) + '...' : plainText
    }
  }
}
</script>

<style scoped>
.article-list-container {
  padding: 20px;
}

.search-box {
  margin-bottom: 20px;
}

.article-list {
  width: 100%;
}

.header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.article-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.article-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.article-title {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 18px;
}

.article-meta {
  margin-bottom: 10px;
  font-size: 14px;
  color: #909399;
}

.article-meta .author {
  margin-right: 20px;
}

.article-summary {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>