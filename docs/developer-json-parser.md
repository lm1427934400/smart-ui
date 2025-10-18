# JSON Parser 开发者文档

## 项目结构

```
src/views/sys-tools/
├── json-parser.vue          # 主组件
└── components/
    ├── JsonTree.vue         # 树形结构容器组件
    └── JsonTreeNode.vue     # 树形节点组件
```

## 组件说明

### JsonParser (主组件)

这是JSON解析器的主要入口组件，负责：

1. 提供用户界面和交互
2. 处理JSON数据的解析、格式化、压缩
3. 管理树形结构的展开/折叠状态
4. 生成统计数据和JSON Schema

#### 主要功能方法

- `parseJson()`: 解析JSON输入，使用原生JSON.parse确保安全性
- `formatJson()`: 格式化JSON数据
- `compressJson()`: 压缩JSON数据
- `calculateDepth()`: 计算对象深度
- `countKeys()`: 统计键值对数量
- `generateSchema()`: 生成JSON Schema

### JsonTree (树形容器组件)

负责渲染整个JSON树形结构：

1. 接收解析后的JSON数据
2. 管理节点展开/折叠状态
3. 传递状态给子组件

### JsonTreeNode (树形节点组件)

递归组件，负责渲染单个节点：

1. 根据数据类型渲染不同样式
2. 处理对象和数组的递归渲染
3. 显示基础类型的值

## 扩展功能

### 添加新的统计信息

在 `computed` 属性中添加新的统计计算方法，然后在模板中显示。

### 添加新的工具功能

在 `methods` 中添加新的功能方法，然后在工具栏中添加对应的按钮。

### 修改样式

所有样式都在组件的 `<style scoped>` 部分定义，可以根据需要进行修改。

## 技术细节

### 安全性

- 使用原生 `JSON.parse()` 而不是 `eval()` 确保安全性
- 对用户输入进行验证和错误处理

### 性能优化

- 使用防抖处理输入事件
- 递归组件使用 `scoped` 样式避免全局污染
- 合理使用 `v-if` 和 `v-show` 控制渲染

### 响应式设计

- 使用 Element UI 的响应式布局
- 支持拖拽调整面板宽度（可扩展）

## 测试

单元测试位于 `tests/unit/components/` 目录下：

- `JsonParser.spec.js`: 主组件测试
- `JsonTree.spec.js`: 树形组件测试

运行测试：
```bash
npm run test:unit tests/unit/components/JsonParser.spec.js
npm run test:unit tests/unit/components/JsonTree.spec.js
```

## 可能的改进

1. **大型JSON文件性能优化**：对于超大JSON文件，可以考虑使用虚拟滚动技术
2. **Web Worker支持**：将解析过程放到Web Worker中避免阻塞UI线程
3. **JSONPath支持**：添加JSONPath查询功能
4. **数据编辑功能**：允许直接在树形结构中编辑值
5. **导出功能**：支持将解析结果导出为不同格式