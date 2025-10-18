<template>
  <div class="json-tree-node">
    <div 
      v-if="isObject || isArray" 
      class="node-header"
      @click="handleToggle"
    >
      <span class="toggle-icon">
        <i :class="isNodeExpanded ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"></i>
      </span>
      <span class="key" :title="path">{{ keyName }}:</span>
      <span class="type-info">
        {{ isArray ? 'Array[' + data.length + ']' : 'Object{' + Object.keys(data).length + '}' }}
      </span>
    </div>
    
    <div v-else class="leaf-node">
      <span class="key">{{ keyName }}:</span>
      <span 
        class="value" 
        :class="valueType"
        :title="String(data)"
      >
        {{ formattedValue }}
      </span>
    </div>
    
    <div v-if="isNodeExpanded && (isObject || isArray)" class="children">
      <template v-for="(value, key) in data">
        <json-tree-node
          :data="value"
          :key-name="getKey(key)"
          :path="getPath(key)"
          :expanded="expanded"
          @toggle="$emit('toggle', $event)"
          @node-click="$emit('node-click', $event)"
          :key="getKey(key)"
        />
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JsonTreeNode',
  props: {
    data: {
      type: [Object, Array, String, Number, Boolean],
      default: null
    },
    keyName: {
      type: String,
      default: ''
    },
    path: {
      type: String,
      default: ''
    },
    expanded: {
      type: [Boolean, Array],
      default: false
    }
  },
  emits: ['toggle', 'node-click'],
  computed: {
    isObject() {
      return this.data !== null && typeof this.data === 'object' && !Array.isArray(this.data)
    },
    isArray() {
      return Array.isArray(this.data)
    },
    valueType() {
      if (this.data === null) return 'null'
      return typeof this.data
    },
    formattedValue() {
      if (this.data === null) return 'null'
      if (typeof this.data === 'string') return `"${this.data}"`
      if (typeof this.data === 'boolean') return this.data.toString()
      return this.data
    },
    isNodeExpanded() {
      // For root node, expanded is passed as array from parent
      // For child nodes, we check if current path is in the expanded array
      if (Array.isArray(this.expanded)) {
        return this.expanded.includes(this.path)
      } else {
        return this.expanded
      }
    }
  },
  methods: {
    handleToggle() {
      if (this.isObject || this.isArray) {
        this.$emit('toggle', this.path)
      }
    },
    getPath(key) {
      if (this.isArray) {
        return `${this.path}[${key}]`
      } else {
        return this.path ? `${this.path}.${key}` : key
      }
    },
    getKey(key) {
      if (this.isArray) {
        return `[${key}]`
      } else {
        return key
      }
    }
  }
}
</script>

<style scoped>
.json-tree-node {
  margin-left: 15px;
}

.node-header {
  cursor: pointer;
  padding: 2px 0;
  display: flex;
  align-items: center;
  user-select: none;
}

.node-header:hover {
  background-color: rgba(0, 212, 255, 0.1);
}

.toggle-icon {
  width: 16px;
  color: #00d4ff;
  margin-right: 4px;
}

.key {
  color: #ff9800;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-info {
  color: #9e9e9e;
  font-size: 12px;
}

.leaf-node {
  padding: 2px 0;
  display: flex;
}

.value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.value.string {
  color: #4caf50;
}

.value.number {
  color: #2196f3;
}

.value.boolean {
  color: #9c27b0;
}

.value.null {
  color: #9e9e9e;
}

.children {
  margin-left: 15px;
  border-left: 1px dashed #1e3a5c;
  padding-left: 10px;
}
</style>