<template>
  <div class="json-tree">
    <json-tree-node
      v-if="data !== null"
      :data="data"
      key-name="$"
      path="$"
      :expanded="expanded"
      @toggle="toggleNode"
      @node-click="$emit('node-click', $event)"
    />
  </div>
</template>

<script>
import JsonTreeNode from './JsonTreeNode.vue'

export default {
  name: 'JsonTree',
  components: {
    JsonTreeNode
  },
  props: {
    data: {
      type: [Object, Array, String, Number, Boolean],
      default: null
    },
    expanded: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    isExpanded(path) {
      return this.expanded.includes(path)
    },
    toggleNode(path) {
      const index = this.expanded.indexOf(path)
      let newExpanded = []
      if (index > -1) {
        // Remove from expanded
        newExpanded = [...this.expanded]
        newExpanded.splice(index, 1)
      } else {
        // Add to expanded
        newExpanded = [...this.expanded, path]
      }
      this.$emit('update:expanded', newExpanded)
    }
  }
}
</script>

<style scoped>
.json-tree {
  font-family: 'Consolas', monospace;
  font-size: 14px;
}
</style>