import { shallowMount } from '@vue/test-utils'
import EnhancedMarkdownEditor from '@/views/sys-tools/enhanced-markdown-editor.vue'

describe('EnhancedMarkdownEditor.vue', () => {
  it('should render correctly', () => {
    const wrapper = shallowMount(EnhancedMarkdownEditor)
    expect(wrapper.exists()).toBe(true)
  })

  it('should have toolbar buttons', () => {
    const wrapper = shallowMount(EnhancedMarkdownEditor)
    const buttons = wrapper.findAll('.toolbar .el-button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should toggle night mode', async () => {
    const wrapper = shallowMount(EnhancedMarkdownEditor)
    const initialMode = wrapper.vm.isNightMode
    await wrapper.vm.toggleNightMode()
    expect(wrapper.vm.isNightMode).toBe(!initialMode)
  })

  it('should parse markdown with syntax highlighting', async () => {
    const wrapper = shallowMount(EnhancedMarkdownEditor)
    // Set some markdown content with code blocks
    wrapper.vm.markdownContent = `
# Test Header

\`\`\`javascript
function test() {
  console.log('Hello World');
}
\`\`\`

\`\`\`python
def test():
    print('Hello World')
\`\`\`
    `
    // Parse the markdown
    await wrapper.vm.parseMarkdown()
    // Check that parsedContent is not empty
    expect(wrapper.vm.parsedContent).not.toBe('')
  })
})