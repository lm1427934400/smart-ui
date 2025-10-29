<template>
  <div class="my-articles-container">
    <el-card shadow="hover">
      <template #header>
        <div class="header-title">
          <span>我的文章</span>
          <div class="header-actions">
            <el-button type="primary" @click="goPublish">发布新文章</el-button>
            <el-button type="success" @click="createDirectory">创建目录</el-button>
            <el-button type="info" @click="refreshList">刷新列表</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和过滤区域 -->
      <div class="filter-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索标题"
          clearable
          prefix-icon="el-icon-search"
          style="width: 300px; margin-right: 15px"
          @input="handleSearch"
        ></el-input>
        
        <el-select v-model="typeFilter" placeholder="筛选类型" clearable style="width: 150px; margin-right: 15px">
          <el-option label="全部" value=""></el-option>
          <el-option label="文章" value="article"></el-option>
          <el-option label="目录" value="directory"></el-option>
        </el-select>
        
        <el-popconfirm
          title="是否展开全部"
          confirm-button-text="确定"
          cancel-button-text="取消"
          @confirm="expandAll"
        >
          <el-button slot="reference" type="text">展开全部</el-button>
        </el-popconfirm>
        
        <el-popconfirm
          title="是否折叠全部"
          confirm-button-text="确定"
          cancel-button-text="取消"
          @confirm="collapseAll"
        >
          <el-button slot="reference" type="text">折叠全部</el-button>
        </el-popconfirm>
      </div>
      
      <div v-if="loading" style="text-align: center; padding: 40px;">
        <el-loading text="加载中..." />
      </div>
      
      <div v-else-if="filteredTreeData && filteredTreeData.length > 0">
        <el-tree
          ref="articleTree"
          :data="filteredTreeData"
          :props="defaultProps"
          :expand-on-click-node="false"
          node-key="id"
          default-expand-all
          @node-click="handleNodeClick"
          @node-contextmenu="showContextMenu"
          style="margin-top: 20px; max-height: 600px; overflow-y: auto"
        >
          <template #default="{ node, data }">
            <div class="node-content-wrapper">
              <span class="tree-node-content">
                <!-- 展开/折叠图标 -->
                <span class="expand-icon" v-if="!node.isLeaf" @click.stop="toggleNodeExpand(node)">
                  <i :class="node.expanded ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"></i>
                </span>
                <span class="expand-icon-placeholder" v-else></span>
                
                <!-- 类型图标 -->
                <span class="type-icon">
                  <i :class="data.type === 'directory' ? 'el-icon-folder' : 'el-icon-document'"></i>
                </span>
                
                <!-- 标题 -->
                <span class="node-title" :class="{ 'directory-title': data.type === 'directory' }">
                  {{ node.label }}
                  <span v-if="data.type === 'directory' && data.children && data.children.length > 0" class="child-count">({{ countChildren(data) }})</span>
                </span>
                
                <!-- 元信息 -->
                <span class="node-meta" v-if="data.type !== 'directory'">
                  创建时间: {{ formatDate(data.created_at) }}
                  <span class="view-count">浏览: {{ data.view_count || 0 }}</span>
                </span>
              </span>
              
              <!-- 操作按钮 -->
              <span class="node-actions">
                <el-button
                  size="mini"
                  type="primary"
                  plain
                  v-if="data.type !== 'directory'"
                  @click.stop="viewArticle(data.id)"
                >
                  查看
                </el-button>
                <el-button size="mini" type="success" plain @click.stop="editNode(data)">
                  {{ data.type === 'directory' ? '编辑目录' : '编辑' }}
                </el-button>
                <el-button size="mini" type="info" plain @click.stop="addChildNode(data)">
                  {{ data.type === 'directory' ? '添加文章' : '添加子项' }}
                </el-button>
                <el-button size="mini" type="danger" plain @click.stop="deleteNode(data)">
                  删除
                </el-button>
              </span>
            </div>
          </template>
        </el-tree>
      </div>
      
      <div v-else class="empty-state">
        <el-empty description="暂无文章数据" />
      </div>
    </el-card>
    
    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
    >
      <div v-if="selectedNode && selectedNode.type !== 'directory'" class="menu-item" @click="viewArticle(selectedNode.id)">查看文章</div>
      <div class="menu-item" @click="editNode(selectedNode)">{{ selectedNode && selectedNode.type === 'directory' ? '编辑目录' : '编辑文章' }}</div>
      <div class="menu-item" @click="addChildNode(selectedNode)">添加子项</div>
      <div class="menu-item danger" @click="deleteNode(selectedNode)">删除</div>
    </div>
    
    <!-- 创建/编辑目录对话框 -->
    <el-dialog
      :title="directoryDialogTitle"
      :visible.sync="directoryDialogVisible"
      width="400px"
    >
      <el-form :model="directoryForm" :rules="directoryRules" ref="directoryForm">
        <el-form-item label="目录名称" prop="name">
          <el-input v-model="directoryForm.name" placeholder="请输入目录名称"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="directoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDirectory">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { fetchMyArticles, deleteArticleById } from '@/api/article'

export default {
  name: 'MyArticles',
  data() {
    return {
      articleList: [],
      searchKeyword: '',
      typeFilter: '',
      loading: false,
      defaultProps: {
        children: 'children',
        label: 'title'
      },
      // 右键菜单相关
      contextMenuVisible: false,
      contextMenuX: 0,
      contextMenuY: 0,
      selectedNode: null,
      // 目录对话框
      directoryDialogVisible: false,
      directoryDialogTitle: '创建目录',
      directoryForm: {
        name: '',
        parentId: null
      },
      directoryRules: {
        name: [
          { required: true, message: '请输入目录名称', trigger: 'blur' },
          { min: 1, max: 100, message: '目录名称长度在 1 到 100 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    filteredTreeData() {
      let filtered = this.articleList
      
      // 按类型过滤
      if (this.typeFilter) {
        const filterByType = (nodes) => {
          return nodes
            .filter(node => node.type === this.typeFilter)
            .map(node => {
              const filteredNode = { ...node }
              if (node.children && node.children.length > 0) {
                filteredNode.children = filterByType(node.children)
              }
              return filteredNode
            })
            .filter(node => {
              // 如果是目录且有子节点，即使类型不匹配也保留
              return node.type === this.typeFilter || (node.children && node.children.length > 0)
            })
        }
        filtered = filterByType(filtered)
      }
      
      if (!this.searchKeyword) {
        return filtered
      }
      
      // 搜索功能：过滤树形数据
      const filterNode = (node) => {
        if (node.title && node.title.toLowerCase().includes(this.searchKeyword.toLowerCase())) {
          return true
        }
        if (node.children && node.children.length > 0) {
          const filteredChildren = node.children.filter(child => filterNode(child))
          return filteredChildren.length > 0
        }
        return false
      }
      
      // 深拷贝原始数据以避免修改原数据
      const deepClone = (arr) => {
        return arr.map(item => {
          const clone = { ...item }
          if (clone.children && clone.children.length > 0) {
            clone.children = deepClone(clone.children)
          }
          return clone
        })
      }
      
      const clonedData = deepClone(filtered)
      return clonedData.filter(node => filterNode(node))
    }
  },
  mounted() {
    this.fetchArticles()
    // 添加全局点击事件监听，用于关闭右键菜单
    document.addEventListener('click', this.closeContextMenu)
  },
  beforeDestroy() {
    // 移除事件监听
    document.removeEventListener('click', this.closeContextMenu)
  },
  methods: {
    async fetchArticles() {
      this.loading = true
      try {
        // 调用API获取当前用户的文章列表（支持树形结构）
        const response = await fetchMyArticles()
        // 兼容不同的响应格式
        if (response && (response.code === 200 || response.success)) {
          // 后端返回的是包含list属性的分页对象
          this.articleList = response.data && response.data.list ? response.data.list : []
        } else {
          this.$message.error('获取文章列表失败')
          this.articleList = []
        }
      } catch (error) {
        console.error('获取文章列表错误:', error)
        this.$message.error('网络错误，请稍后重试')
        this.articleList = []
      } finally {
        this.loading = false
      }
    },
    
    refreshList() {
      this.fetchArticles()
      this.$message.success('列表已刷新')
    },
    
    handleSearch() {
      // 搜索输入时的处理，使用computed属性已经自动过滤
      console.log('搜索关键词:', this.searchKeyword)
    },
    
    handleNodeClick(data, node) {
      if (data.type !== 'directory') {
        this.viewArticle(data.id)
      } else {
        // 对于目录节点，切换展开/折叠状态
        this.toggleNodeExpand(node)
      }
    },
    
    toggleNodeExpand(node) {
      node.expanded = !node.expanded
    },
    
    expandAll() {
      if (this.$refs.articleTree) {
        this.$refs.articleTree.setCheckedKeys([])
        this.$refs.articleTree.setCurrentKey(null)
        this.$refs.articleTree.expandAll()
      }
    },
    
    collapseAll() {
      if (this.$refs.articleTree) {
        this.$refs.articleTree.setCheckedKeys([])
        this.$refs.articleTree.setCurrentKey(null)
        this.$refs.articleTree.collapseAll()
      }
    },
    
    // 显示右键菜单
    showContextMenu(data, node, event) {
      event.preventDefault()
      event.stopPropagation()
      
      this.selectedNode = data
      this.contextMenuX = event.clientX
      this.contextMenuY = event.clientY
      this.contextMenuVisible = true
    },
    
    // 关闭右键菜单
    closeContextMenu() {
      this.contextMenuVisible = false
    },
    
    goPublish() {
      this.$router.push('/article-manage/publish')
    },
    
    viewArticle(id) {
      this.closeContextMenu()
      this.$router.push(`/articles/detail/${id}`)
    },
    
    editNode(node) {
      this.closeContextMenu()
      if (node.type === 'directory') {
        // 编辑目录
        this.directoryDialogTitle = '编辑目录'
        this.directoryForm.name = node.title
        this.directoryForm.parentId = node.parent_id
        this.directoryDialogVisible = true
      } else {
        // 编辑文章
        this.$router.push(`/article-manage/edit/${node.id}`)
      }
    },
    
    addChildNode(node) {
      this.closeContextMenu()
      if (node.type === 'directory') {
        // 在目录下添加文章
        this.$router.push({
          path: '/article-manage/publish',
          query: { parentId: node.id }
        })
      } else {
        // 提示创建目录
        this.$message.info('请先创建目录，然后在目录下添加文章')
      }
    },
    
    // 创建根目录
    createDirectory() {
      this.directoryDialogTitle = '创建目录'
      this.directoryForm.name = ''
      this.directoryForm.parentId = null
      this.directoryDialogVisible = true
    },
    
    // 保存目录
    async saveDirectory() {
      this.$refs.directoryForm.validate(async (valid) => {
        if (valid) {
          try {
            // 这里需要实现创建/更新目录的API调用
            // 模拟成功
            this.$message.success('目录' + (this.directoryDialogTitle.includes('创建') ? '创建' : '更新') + '成功')
            this.directoryDialogVisible = false
            this.fetchArticles() // 刷新列表
          } catch (error) {
            console.error('保存目录失败:', error)
            this.$message.error('保存目录失败')
          }
        }
      })
    },
    
    async deleteNode(node) {
      this.closeContextMenu()
      
      try {
        const confirmMessage = node.type === 'directory' 
          ? `确定要删除目录"${node.title}"吗？此操作将删除该目录下的所有内容。`
          : `确定要删除"${node.title}"吗？`
          
        await this.$confirm(confirmMessage, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await deleteArticleById(node.id)
        // 兼容不同的响应格式
        if (response && (response.code === 200 || response.success)) {
          this.$message.success('删除成功')
          // 重新获取文章列表
          this.fetchArticles()
        } else {
          this.$message.error(response?.msg || response?.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除错误:', error)
          this.$message.error('删除失败，请稍后重试')
        }
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN')
    },
    
    // 计算子节点数量
    countChildren(node) {
      if (!node.children || node.children.length === 0) {
        return 0
      }
      let count = node.children.length
      // 递归计算子节点中的文章数量
      node.children.forEach(child => {
        if (child.type === 'directory') {
          count += this.countChildren(child)
        }
      })
      return count
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
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.node-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 0;
  transition: background-color 0.3s;
}

.node-content-wrapper:hover {
  background-color: #f5f7fa;
}

.tree-node-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.expand-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 5px;
  font-size: 12px;
  color: #606266;
  transition: color 0.3s;
}

.expand-icon:hover {
  color: #409eff;
}

.expand-icon-placeholder {
  width: 20px;
  margin-right: 5px;
}

.type-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
  font-size: 16px;
}

.type-icon .el-icon-folder {
  color: #e6a23c;
}

.type-icon .el-icon-document {
  color: #409eff;
}

.node-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 5px;
  line-height: 28px;
}

.directory-title {
  font-weight: bold;
  color: #e6a23c;
}

.child-count {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
  margin-left: 5px;
}

.node-meta {
  margin-left: 15px;
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 15px;
}

.view-count {
  font-weight: 500;
}

.node-actions {
  display: flex;
  gap: 5px;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.node-content-wrapper:hover .node-actions {
  opacity: 1;
}

.empty-state {
  padding: 60px 0;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  min-width: 120px;
  z-index: 1000;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-item.danger {
  color: #f56c6c;
}

.menu-item.danger:hover {
  background-color: #fef0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .my-articles-container {
    padding: 10px;
  }
  
  .header-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-section .el-input,
  .filter-section .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .node-content-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .node-actions {
    justify-content: flex-end;
    opacity: 1;
  }
  
  .tree-node-content {
    overflow: hidden;
  }
  
  .node-meta {
    flex-direction: column;
    gap: 5px;
    margin-left: 45px;
  }
}
</style>