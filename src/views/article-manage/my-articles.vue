<template>
  <div class="my-articles-container">
    <el-card shadow="hover">
      <template #header>
        <div class="header-title">
          <span>我的文章</span>
          <el-button type="primary" @click="goPublish">发布新文章</el-button>
        </div>
      </template>
      
      <div class="search-box">
        <el-input v-model="searchKeyword" placeholder="搜索文章标题" prefix-icon="el-icon-search" style="width: 300px;">
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
      
      <el-table :data="articleList" style="width: 100%">
        <el-table-column prop="title" label="文章标题" min-width="300">
          <template #default="{ row }">
            <el-button type="text" @click="viewArticle(row.id)">{{ row.title }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editArticle(row.id)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteArticle(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
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
import { getCurrentUserArticles, deleteArticle } from '@/api/article'

export default {
  name: 'MyArticles',
  data() {
    return {
      articleList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      searchKeyword: ''
    }
  },
  created() {
    this.fetchMyArticles()
  },
  methods: {
    fetchMyArticles() {
      // 调用后端API获取当前用户的文章列表
      getCurrentUserArticles({
        pageSize: this.pageSize,
        pageIndex: this.currentPage,
        title: this.searchKeyword || undefined
      }).then(res => {
        if (res && res.code === 200) {
          this.articleList = res.data?.list || []
          this.total = res.data?.total || 0
        }
      }).catch(err => {
        console.error('获取文章列表失败:', err)
        this.$message.error('获取文章列表失败')
      })
    },
    
    viewArticle(id) {
      // 跳转到前台文章详情页
      this.$router.push(`/articles/detail/${id}`)
    },
    
    goPublish() {
      this.$router.push('/article-manage/publish')
    },
    
    editArticle(id) {
      // 跳转到编辑页面
      this.$router.push(`/article-manage/edit/${id}`)
    },
    
    deleteArticle(id) {
      this.$confirm('确定要删除这篇文章吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用删除文章API
        deleteArticle([id]).then(res => {
            if (res && res.code === 200) {
              this.$message.success('文章删除成功')
              this.fetchMyArticles() // 重新获取文章列表
            } else {
              this.$message.error(res?.msg || '文章删除失败')
            }
        }).catch(err => {
          console.error('删除文章失败:', err)
          this.$message.error('文章删除失败')
        })
      }).catch(() => {
        // 取消删除
      })
    },
    
    handleSearch() {
      this.currentPage = 1
      this.fetchMyArticles()
    },
    
    handlePageChange(page) {
      this.currentPage = page
      this.fetchMyArticles()
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
.my-articles-container {
  padding: 20px;
}

.header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  margin: 16px 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>