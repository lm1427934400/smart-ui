#!/usr/bin/env node
const { spawn } = require('child_process');

// 设置环境变量
process.env.SASS_SILENCE_DEPRECATIONS = '1';

// 启动 vue-cli-service serve
const vueCli = spawn('vue-cli-service', ['serve'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

// 过滤输出中的 Sass 弃用警告
function filterSassWarnings(data) {
  return data
    .toString()
    .split('\n')
    .filter(line => {
      // 过滤掉 legacy-js-api 和 import 弃用警告
      return !line.includes('Deprecation Warning [legacy-js-api]') && 
             !line.includes('Deprecation Warning [import]');
    })
    .join('\n');
}

// 处理标准输出
vueCli.stdout.on('data', (data) => {
  const filtered = filterSassWarnings(data);
  if (filtered) {
    process.stdout.write(filtered);
  }
});

// 处理标准错误
vueCli.stderr.on('data', (data) => {
  const filtered = filterSassWarnings(data);
  if (filtered) {
    process.stderr.write(filtered);
  }
});

// 处理子进程退出
vueCli.on('close', (code) => {
  process.exit(code);
});
