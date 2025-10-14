<template>
  <div ref="earthContainer" class="earth-container" />
</template>

<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default {
  name: 'Earth',
  mounted() {
    this.init()
    this.animate()
    window.addEventListener('resize', this.onWindowResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowResize)
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  },
  methods: {
    init() {
      // 场景
      this.scene = new THREE.Scene()
      
      // 深空背景
      this.createDeepSpaceBackground()
      
      // 相机
      this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
      this.camera.position.z = 3
      
      // 渲染器
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.renderer.setPixelRatio(window.devicePixelRatio)
      this.$refs.earthContainer.appendChild(this.renderer.domElement)
      
      // 控制器
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableDamping = true
      this.controls.dampingFactor = 0.05
      this.controls.rotateSpeed = 0.5
      this.controls.enableZoom = false
      this.controls.enablePan = false
      
      // 添加光源
      this.createLights()
      
      // 创建地球
      this.createEarth()
      
      // 创建大气层
      this.createAtmosphere()
      
      // 创建动态数据流
      this.createDataFlows()
      
      // 创建轨道环
      this.createOrbitRings()
      
      // 创建浮动信息面板
      this.createFloatingPanels()
    },
    
    createDeepSpaceBackground() {
      // 创建深空背景
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      const ctx = canvas.getContext('2d')
      
      // 深空渐变
      const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512)
      gradient.addColorStop(0, '#0a0a2a')
      gradient.addColorStop(0.5, '#0a1a3a')
      gradient.addColorStop(1, '#000011')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 1024, 1024)
      
      // 添加星星
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 1024
        const y = Math.random() * 1024
        const radius = Math.random() * 1.5
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // 添加一些彩色星星（青色和洋红点缀）
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 1024
        const y = Math.random() * 1024
        const radius = Math.random() * 2
        ctx.fillStyle = Math.random() > 0.5 ? '#00ffff' : '#ff00ff'
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }
      
      const backgroundTexture = new THREE.CanvasTexture(canvas)
      this.scene.background = backgroundTexture
    },
    
    createLights() {
      // 环境光
      const ambientLight = new THREE.AmbientLight(0x333366, 0.5)
      this.scene.add(ambientLight)
      
      // 方向光
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
      directionalLight.position.set(5, 3, 5)
      this.scene.add(directionalLight)
      
      // 点光源增强效果
      const pointLight1 = new THREE.PointLight(0x00ffff, 0.5, 100)
      pointLight1.position.set(3, 2, 4)
      this.scene.add(pointLight1)
      
      const pointLight2 = new THREE.PointLight(0xff00ff, 0.3, 100)
      pointLight2.position.set(-4, -2, -3)
      this.scene.add(pointLight2)
    },
    
    createEarth() {
      // 地球几何体
      const geometry = new THREE.SphereGeometry(1, 128, 128)
      
      // 创建地球纹理
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      
      // 创建地球表面纹理
      const gradient = ctx.createLinearGradient(0, 0, 1024, 512)
      gradient.addColorStop(0, '#1e3a8a')
      gradient.addColorStop(0.3, '#2563eb')
      gradient.addColorStop(0.7, '#3b82f6')
      gradient.addColorStop(1, '#1e40af')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 1024, 512)
      
      // 添加大陆形状
      ctx.fillStyle = '#0ea5e9'
      ctx.beginPath()
      ctx.ellipse(200, 150, 120, 80, 0, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.beginPath()
      ctx.ellipse(600, 200, 150, 100, 0, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.beginPath()
      ctx.ellipse(800, 300, 100, 70, 0, 0, Math.PI * 2)
      ctx.fill()
      
      const texture = new THREE.CanvasTexture(canvas)
      
      // 地球材质
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        specular: 0x333366,
        shininess: 15,
        bumpScale: 0.05
      })
      
      // 创建地球网格
      this.earth = new THREE.Mesh(geometry, material)
      this.scene.add(this.earth)
    },
    
    createAtmosphere() {
      // 创建大气层效果
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        specular: 0x00ffff,
        shininess: 0,
        emissive: 0x00ffff,
        emissiveIntensity: 0.2
      })
      
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.05, 128, 128),
        atmosphereMaterial
      )
      
      this.scene.add(atmosphere)
      this.atmosphere = atmosphere
    },
    
    createDataFlows() {
      // 创建动态数据流（航线、网络链路等）
      this.dataFlows = []
      
      // 创建多个数据流
      for (let i = 0; i < 15; i++) {
        this.createDataFlow()
      }
    },
    
    createDataFlow() {
      // 创建单个数据流
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        ),
        new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3
        ),
        new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        )
      ])
      
      const points = curve.getPoints(50)
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      
      // 随机选择颜色（青色或洋红）
      const color = Math.random() > 0.5 ? 0x00ffff : 0xff00ff
      const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        linewidth: 2
      })
      
      const line = new THREE.Line(geometry, material)
      this.scene.add(line)
      
      // 添加动态效果
      const flow = {
        line: line,
        curve: curve,
        progress: 0,
        speed: 0.005 + Math.random() * 0.01
      }
      
      this.dataFlows.push(flow)
      
      // 创建移动的光点
      const pointGeometry = new THREE.SphereGeometry(0.02, 16, 16)
      const pointMaterial = new THREE.MeshBasicMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 1
      })
      
      const point = new THREE.Mesh(pointGeometry, pointMaterial)
      this.scene.add(point)
      
      flow.point = point
    },
    
    createOrbitRings() {
      // 创建多个轨道环
      const ringCount = 3
      for (let i = 0; i < ringCount; i++) {
        const radius = 1.8 + i * 0.4
        const ringGeometry = new THREE.RingGeometry(radius, radius + 0.02, 128)
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0x00ffff : 0xff00ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.2 + i * 0.1
        })
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial)
        ring.rotation.x = Math.PI / 2
        ring.rotation.z = Math.random() * Math.PI
        this.scene.add(ring)
      }
    },
    
    createFloatingPanels() {
      // 创建浮动信息面板
      this.floatingPanels = []
      
      // 创建几个浮动面板
      for (let i = 0; i < 5; i++) {
        this.createFloatingPanel(i)
      }
    },
    
    createFloatingPanel(index) {
      // 创建单个浮动面板
      const width = 0.3
      const height = 0.2
      
      const panelGeometry = new THREE.PlaneGeometry(width, height)
      const panelMaterial = new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? 0x00ffff : 0xff00ff,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      })
      
      const panel = new THREE.Mesh(panelGeometry, panelMaterial)
      
      // 随机位置
      panel.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      )
      
      // 确保面板不在地球内部
      if (panel.position.length() < 1.5) {
        panel.position.normalize().multiplyScalar(1.5)
      }
      
      this.scene.add(panel)
      
      // 添加边框
      const borderGeometry = new THREE.RingGeometry(
        Math.max(width, height) / 2 - 0.01,
        Math.max(width, height) / 2,
        64
      )
      const borderMaterial = new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? 0x00ffff : 0xff00ff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
      
      const border = new THREE.Mesh(borderGeometry, borderMaterial)
      border.position.copy(panel.position)
      this.scene.add(border)
      
      // 添加动态效果
      const floatingPanel = {
        panel: panel,
        border: border,
        phase: Math.random() * Math.PI * 2,
        amplitude: 0.1 + Math.random() * 0.2,
        frequency: 0.5 + Math.random() * 1.5
      }
      
      this.floatingPanels.push(floatingPanel)
    },
    
    animate() {
      this.animationId = requestAnimationFrame(this.animate)
      
      // 地球自转
      if (this.earth) {
        this.earth.rotation.y += 0.002
      }
      
      // 大气层效果
      if (this.atmosphere) {
        this.atmosphere.rotation.y += 0.002
      }
      
      // 更新数据流
      this.updateDataFlows()
      
      // 更新浮动面板
      this.updateFloatingPanels()
      
      // 更新控制器
      this.controls.update()
      
      // 渲染场景
      this.renderer.render(this.scene, this.camera)
    },
    
    updateDataFlows() {
      // 更新数据流动画
      for (let i = 0; i < this.dataFlows.length; i++) {
        const flow = this.dataFlows[i]
        flow.progress += flow.speed
        
        if (flow.progress > 1) {
          flow.progress = 0
        }
        
        // 更新光点位置
        if (flow.point && flow.curve) {
          const point = flow.curve.getPoint(flow.progress)
          if (point) {
            flow.point.position.copy(point)
          }
        }
      }
    },
    
    updateFloatingPanels() {
      // 更新浮动面板动画
      const time = Date.now() * 0.001
      for (let i = 0; i < this.floatingPanels.length; i++) {
        const panel = this.floatingPanels[i]
        panel.phase += 0.01
        panel.panel.position.y += Math.sin(panel.phase) * 0.001
        panel.border.position.copy(panel.panel.position)
      }
    },
    
    onWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    }
  }
}
</script>

<style scoped>
.earth-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>