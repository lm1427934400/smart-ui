import { shallowMount } from '@vue/test-utils'
import JsonTree from '@/views/sys-tools/components/JsonTree.vue'
import JsonTreeNode from '@/views/sys-tools/components/JsonTreeNode.vue'

// Mock the JsonTreeNode component since it's recursive
jest.mock('@/views/sys-tools/components/JsonTreeNode.vue', () => ({
  name: 'JsonTreeNode',
  render(h) {
    return h('div', 'JsonTreeNode')
  }
}))

describe('JsonTree.vue', () => {
  it('should render correctly with data', () => {
    const wrapper = shallowMount(JsonTree, {
      propsData: {
        data: { name: 'test' }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should not render JsonTreeNode when data is null', () => {
    const wrapper = shallowMount(JsonTree, {
      propsData: {
        data: null
      }
    })
    expect(wrapper.findComponent(JsonTreeNode).exists()).toBe(false)
  })

  it('should render JsonTreeNode when data is provided', () => {
    const wrapper = shallowMount(JsonTree, {
      propsData: {
        data: { name: 'test' }
      }
    })
    expect(wrapper.findComponent(JsonTreeNode).exists()).toBe(true)
  })

  it('should emit update:expanded when toggleNode is called', () => {
    const wrapper = shallowMount(JsonTree, {
      propsData: {
        data: { name: 'test' },
        expanded: ['$']
      }
    })
    
    wrapper.vm.toggleNode('$')
    expect(wrapper.emitted('update:expanded')).toBeTruthy()
  })
})