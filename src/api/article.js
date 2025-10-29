import request from '@/utils/request'

// 文章相关API接口定义

/**
 * 发布文章
 * @param {Object} data - 文章数据
 * @returns {Promise}
 */
export function publishArticle(data) {
  return request({
    url: '/v1/article',
    method: 'post',
    data
  })
}

/**
 * 获取文章列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getArticleList(params) {
  return request({
    url: '/v1/article',
    method: 'get',
    params
  })
}

/**
 * 获取文章详情
 * @param {number} id - 文章ID
 * @returns {Promise}
 */
export function getArticleDetail(id) {
  return request({
    url: `/v1/article/detail/${id}`,
    method: 'get'
  })
}

/**
 * 更新文章
 * @param {number} id - 文章ID
 * @param {Object} data - 文章数据
 * @returns {Promise}
 */
export function updateArticle(data) {
  return request({
    url: '/v1/article/update',
    method: 'post',
    data
  })
}

/**
 * 删除文章
 * @param {number} id - 文章ID
 * @returns {Promise}
 */
export function deleteArticle(data) {
  return request({
    url: '/v1/article/delete',
    method: 'post',
    data
  })
}

/**
 * 批量删除文章
 * @param {Array} ids - 文章ID数组
 * @returns {Promise}
 */
export function batchDeleteArticles(ids) {
  return request({
    url: '/v1/article/delete',
    method: 'post',
    data: { ids }
  })
}

/**
 * 获取当前用户的文章列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getCurrentUserArticles(params) {
  return request({
    url: '/v1/article/current-user',
    method: 'get',
    params
  })
}

/**
 * 预览Markdown内容
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function previewMarkdown(params) {
  return request({
    url: '/v1/article/preview',
    method: 'get',
    params
  })
}

/**
 * 获取当前用户的文章列表（树形结构）
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function fetchMyArticles(params = {}) {
  return request({
    url: '/v1/article/current-user',
    method: 'get',
    params
  })
}

/**
 * 删除指定ID的文章
 * @param {number} id - 文章ID
 * @returns {Promise}
 */
export function deleteArticleById(id) {
  return request({
    url: '/v1/article/delete',
    method: 'post',
    data: [id] // 后端DeleteArticle方法期望接收ID数组
  })
}
