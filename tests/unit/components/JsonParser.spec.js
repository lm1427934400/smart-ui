import { shallowMount } from '@vue/test-utils'
import JsonParser from '@/views/sys-tools/json-parser.vue'

describe('JsonParser.vue', () => {
  it('should render correctly', () => {
    const wrapper = shallowMount(JsonParser)
    expect(wrapper.exists()).toBe(true)
  })

  it('should parse valid JSON correctly', async () => {
    const wrapper = shallowMount(JsonParser)
    const testJson = '{"name": "test", "value": 123}'
    
    wrapper.setData({ jsonInput: testJson })
    wrapper.vm.parseJson()
    
    expect(wrapper.vm.parseError).toBe('')
    expect(wrapper.vm.jsonData).toEqual({ name: 'test', value: 123 })
  })

  it('should show error for invalid JSON', async () => {
    const wrapper = shallowMount(JsonParser)
    const invalidJson = '{"name": test}' // Missing quotes around value
    
    wrapper.setData({ jsonInput: invalidJson })
    wrapper.vm.parseJson()
    
    expect(wrapper.vm.parseError).not.toBe('')
    expect(wrapper.vm.jsonData).toBe(null)
  })

  it('should format JSON correctly', async () => {
    const wrapper = shallowMount(JsonParser)
    const compactJson = '{"name":"test","value":123}'
    const formattedJson = '{\n  "name": "test",\n  "value": 123\n}'
    
    wrapper.setData({ jsonInput: compactJson })
    wrapper.vm.formatJson()
    
    expect(wrapper.vm.jsonInput).toBe(formattedJson)
  })

  it('should compress JSON correctly', async () => {
    const wrapper = shallowMount(JsonParser)
    const formattedJson = '{\n  "name": "test",\n  "value": 123\n}'
    const compactJson = '{"name":"test","value":123}'
    
    wrapper.setData({ jsonInput: formattedJson })
    wrapper.vm.compressJson()
    
    expect(wrapper.vm.jsonInput).toBe(compactJson)
  })
})