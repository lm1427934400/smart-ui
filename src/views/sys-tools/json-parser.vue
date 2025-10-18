<template>
  <div class="json-parser-container">
    <div class="header">
      <h2>JSON在线解析器</h2>
      <p>实时解析、验证和可视化JSON数据</p>
    </div>

    <el-row :gutter="20" class="main-content">
      <!-- 左侧输入区域 -->
      <el-col :span="12" class="input-panel">
        <div class="panel-header">
          <h3>JSON输入</h3>
          <div class="actions">
            <el-button size="mini" @click="formatJson">格式化</el-button>
            <el-button size="mini" @click="compressJson">压缩</el-button>
            <el-button size="mini" @click="toggleStrictMode">
              {{ strictMode ? '关闭严格模式' : '开启严格模式' }}
            </el-button>
            <el-button size="mini" @click="generateSample">生成示例数据</el-button>
            <el-button size="mini" @click="clearInput">清空</el-button>
          </div>
        </div>
        <el-input
          type="textarea"
          v-model="jsonInput"
          placeholder="请输入JSON数据..."
          :rows="20"
          @input="handleInput"
        ></el-input>
        <div v-if="parseError" class="error-message">
          <i class="el-icon-error"></i>
          {{ parseError }}
        </div>
      </el-col>

      <!-- 右侧树形展示区域 -->
      <el-col :span="12" class="tree-panel">
        <div class="panel-header">
          <h3>树形结构</h3>
          <div class="actions">
            <el-button size="mini" @click="expandAll">展开全部</el-button>
            <el-button size="mini" @click="collapseAll">折叠全部</el-button>
          </div>
        </div>
        <div class="tree-container" v-loading="loading">
          <json-tree
            v-if="jsonData"
            :data="jsonData"
            :expanded.sync="expandedKeys"
            @node-click="handleNodeClick"
          />
          <div v-else class="empty-placeholder">
            <i class="el-icon-document"></i>
            <p>请输入有效的JSON数据</p>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import Clipboard from 'clipboard'
import JsonTree from './components/JsonTree.vue'

export default {
  name: 'JsonParser',
  components: {
    JsonTree
  },
  data() {
    return {
      jsonInput: '',
      jsonData: null,
      parseError: '',
      loading: false,
      expandedKeys: [],
      strictMode: true,
      debounceTimer: null
    }
  },
  computed: {
  },
  methods: {
    handleInput() {
      // 防抖处理
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.parseJson()
      }, 500)
    },
    parseJson() {
      if (!this.jsonInput.trim()) {
        this.jsonData = null
        this.parseError = ''
        return
      }

      try {
        this.loading = true
        // 使用JSON.parse进行安全解析
        const parsed = JSON.parse(this.jsonInput)
        this.jsonData = parsed
        this.parseError = ''
        
        // 默认展开第一层
        this.expandedKeys = this.getAllKeys(parsed, 1)
      } catch (error) {
        // 提取具体的错误信息和位置
        const message = error.message
        this.parseError = message
        this.jsonData = null
      } finally {
        this.loading = false
      }
    },
    formatJson() {
      if (!this.jsonInput.trim()) return
      
      try {
        const parsed = JSON.parse(this.jsonInput)
        this.jsonInput = JSON.stringify(parsed, null, 2)
      } catch (error) {
        this.$message.error('无效的JSON格式')
      }
    },
    compressJson() {
      if (!this.jsonInput.trim()) return
      
      try {
        const parsed = JSON.parse(this.jsonInput)
        this.jsonInput = JSON.stringify(parsed)
      } catch (error) {
        this.$message.error('无效的JSON格式')
      }
    },
    clearInput() {
      this.jsonInput = ''
      this.jsonData = null
      this.parseError = ''
    },
    expandAll() {
      if (this.jsonData) {
        this.expandedKeys = this.getAllKeys(this.jsonData)
      }
    },
    collapseAll() {
      this.expandedKeys = []
    },




    getAllKeys(obj, maxDepth = null, currentDepth = 0, prefix = '') {
      const keys = []
      
      if (maxDepth !== null && currentDepth >= maxDepth) return keys
      if (obj === null || typeof obj !== 'object') return keys
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const key = `${prefix}[${index}]`
          keys.push(key)
          if (typeof item === 'object' && item !== null) {
            keys.push(...this.getAllKeys(item, maxDepth, currentDepth + 1, key))
          }
        })
      } else {
        Object.keys(obj).forEach(key => {
          const fullKey = prefix ? `${prefix}.${key}` : key
          keys.push(fullKey)
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys.push(...this.getAllKeys(obj[key], maxDepth, currentDepth + 1, fullKey))
          }
        })
      }
      
      return keys
    },
    handleNodeClick(path) {
      // 节点点击事件，可以实现高亮对应的JSON文本等功能
      console.log('Node clicked:', path)
    },

    toggleStrictMode() {
      this.strictMode = !this.strictMode
      this.$message.info(`已${this.strictMode ? '开启' : '关闭'}严格模式`)
    },
    generateSample() {
      this.jsonInput = `{
  "name": "张三",
  "age": 25,
  "isStudent": false,
  "address": {
    "street": "中山路123号",
    "city": "北京",
    "zipcode": "100000"
  },
  "hobbies": ["读书", "游泳", "编程"],
  "education": [
    {
      "degree": "学士",
      "major": "计算机科学",
      "school": "清华大学",
      "graduationYear": 2020
    }
  ],
  "contact": {
    "email": "zhangsan@example.com",
    "phone": "13800138000"
  }
}`
      this.parseJson()
    }
  },
  mounted() {
    // 组件挂载后可以加载一些示例数据
    // this.generateSample()
  }
}
</script>

<style scoped>
.json-parser-container {
  padding: 20px;
  background-color: #0a1929;
  min-height: calc(100vh - 84px);
  color: #e0e0e0;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  color: #00d4ff;
  margin-bottom: 10px;
}

.header p {
  color: #aaa;
}

.main-content {
  height: calc(100vh - 180px);
  min-height: 500px;
  display: flex;
  flex-direction: row;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #1e3a5c;
}

.panel-header h3 {
  margin: 0;
  color: #00d4ff;
}

.actions .el-button {
  margin-left: 10px;
}

.input-panel,
.tree-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.input-panel {
  display: flex;
  flex-direction: column;
}

.input-panel .el-textarea {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.input-panel .el-textarea__inner {
  flex: 1;
}

.input-panel ::v-deep .el-textarea__inner {
  background-color: #1a2c42;
  color: #e0e0e0;
  border: 1px solid #1e3a5c;
  height: 100% !important;
  font-family: 'Consolas', monospace;
  flex: 1;
  min-height: 300px;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  background-color: #1a2c42;
  border: 1px solid #1e3a5c;
  border-radius: 4px;
  padding: 10px;
  min-height: 300px;
  height: 100%;
}

.empty-placeholder {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-placeholder i {
  font-size: 48px;
  margin-bottom: 10px;
  color: #1e3a5c;
}



.error-message {
  color: #ff4d4f;
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(255, 77, 79, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 77, 79, 0.3);
  flex-shrink: 0;
}

/* 滚动条样式 */
.tree-container::-webkit-scrollbar {
  width: 6px;
}

.tree-container::-webkit-scrollbar-track {
  background: #0d1b2a;
}

.tree-container::-webkit-scrollbar-thumb {
  background: #1e3a5c;
  border-radius: 3px;
}

.tree-container::-webkit-scrollbar-thumb:hover {
  background: #00d4ff;
}
</style>