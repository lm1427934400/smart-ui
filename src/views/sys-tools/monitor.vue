<template>
  <div class="tech-monitor">
    <BasicLayout>
      <template #wrapper>
        <!-- Add circuit board background pattern -->
        <div class="circuit-board-bg"></div>
        
        <!-- Add 3D starfield animation background -->
        <div class="starfield-bg">
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
        </div>
        
        <el-row :gutter="20" class="mb15">
          <!-- CPU Metric Card -->
          <el-col :sm="24" :md="8">
            <el-card class="tech-card cockpit-card metric-card" shadow="always">
              <div slot="header" class="cockpit-header metric-header">
                <span>CPU使用率</span>
              </div>
              <div class="metric-content">
                <div class="gauge-chart-large" id="cpuGauge"></div>
                <div class="metric-value-display">{{ info.cpu ? info.cpu.percent : 0 }}%</div>
              </div>
            </el-card>
          </el-col>

          <!-- Memory Metric Card -->
          <el-col :sm="24" :md="8">
            <el-card class="tech-card cockpit-card metric-card" shadow="always">
              <div slot="header" class="cockpit-header metric-header">
                <span>内存使用率</span>
              </div>
              <div class="metric-content">
                <div class="gauge-chart-large" id="memoryGauge"></div>
                <div class="metric-value-display">{{ info.mem ? info.mem.percent : 0 }}%</div>
              </div>
            </el-card>
          </el-col>

          <!-- Disk Metric Card -->
          <el-col :sm="24" :md="8">
            <el-card class="tech-card cockpit-card metric-card" shadow="always">
              <div slot="header" class="cockpit-header metric-header">
                <span>硬盘使用率</span>
              </div>
              <div class="metric-content">
                <div class="gauge-chart-large" id="diskGauge"></div>
                <div class="metric-value-display">{{ info.disk ? info.disk.percent : 0 }}%</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Solar System Animation Card - Full Width -->
        <el-row :gutter="20" class="mb15">
          <el-col :span="24">
            <el-card class="tech-card cockpit-card solar-system-card" shadow="always">
              <div slot="header" class="cockpit-header">
                <span>系统状态</span>
              </div>
              <div class="solar-system-container-full">
                <div class="solar-system-full">
                  <!-- Central Star -->
                  <div class="sun-full">
                    <div class="sun-core-full"></div>
                    <div class="sun-rays-full"></div>
                  </div>
                  <!-- Orbiting Planets -->
                  <div class="orbit-full orbit-1">
                    <div class="planet-full planet-1"></div>
                  </div>
                  <div class="orbit-full orbit-2">
                    <div class="planet-full planet-2"></div>
                  </div>
                  <div class="orbit-full orbit-3">
                    <div class="planet-full planet-3"></div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Historical Charts Card - Full Width -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card class="tech-card cockpit-card chart-card" shadow="always">
              <div slot="header" class="cockpit-header">
                <span>历史监控数据 (1小时)</span>
              </div>
              <div class="chart-container cockpit-charts full-width-container">
                <div id="cpu-chart" class="chart-wrapper full-size-chart" />
                <div id="memory-chart" class="chart-wrapper full-size-chart" />
                <div id="disk-chart" class="chart-wrapper full-size-chart" />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </template>
    </BasicLayout>
  </div>
</template>

<script>
import Cell from '@/components/Cell/index'
import {
  getServer
} from '@/api/monitor/server'
import echarts from 'echarts'

export default {
  name: 'Monitor',
  components: {
    Cell
  },
  data() {
    return {
      info: {},
      customColors: [
        { color: '#13ce66', percentage: 20 },
        { color: '#1890ff', percentage: 40 },
        { color: '#e6a23c', percentage: 60 },
        { color: '#1989fa', percentage: 80 },
        { color: '#F56C6C', percentage: 100 }
      ],
      timer: null,
      chartTimer: null,
      // Historical data storage
      historyData: {
        timestamps: [],
        cpu: [],
        memory: [],
        disk: []
      },
      // Chart instances
      charts: {
        cpu: null,
        memory: null,
        disk: null,
        cpuGauge: null,
        memoryGauge: null,
        diskGauge: null
      },
      // System status
      isSystemActive: true
    }
  },
  created() {
    this.getServerInfo()
    this.timer = setInterval(() => {
      this.getServerInfo()
    }, 5000)
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.initCharts()
        this.initGaugeCharts()
      }, 100)
    })

    window.addEventListener('resize', this.resizeCharts)
  },
  beforeDestroy() {
    clearInterval(this.timer)
    if (this.chartTimer) clearInterval(this.chartTimer)
    this.timer = null
    window.removeEventListener('resize', this.resizeCharts)
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.dispose()
      }
    })
  },
  methods: {
    getServerInfo() {
      getServer().then(ret => {
        if (ret.code === 200) {
          this.info = ret
          this.updateHistoryData()
          this.updateGaugeCharts()
          // Update system status based on metrics
          this.isSystemActive = this.info.cpu && this.info.mem && this.info.disk;
        }
      })
    },

    updateHistoryData() {
      if (!this.info.cpu || !this.info.mem || !this.info.disk) return

      const now = new Date()
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

      this.historyData.timestamps.push(timeString)
      this.historyData.cpu.push(this.info.cpu.percent)
      this.historyData.memory.push(this.info.mem.percent)
      this.historyData.disk.push(this.info.disk.percent)

      const maxPoints = 120
      if (this.historyData.timestamps.length > maxPoints) {
        this.historyData.timestamps.shift()
        this.historyData.cpu.shift()
        this.historyData.memory.shift()
        this.historyData.disk.shift()
      }

      this.updateCharts()
    },

    initCharts() {
      const cpuChartEl = document.getElementById('cpu-chart')
      const memoryChartEl = document.getElementById('memory-chart')
      const diskChartEl = document.getElementById('disk-chart')

      if (!cpuChartEl || !memoryChartEl || !diskChartEl) {
        console.warn('Chart elements not found, retrying in 500ms...')
        setTimeout(() => {
          this.initCharts()
        }, 500)
        return
      }

      this.charts.cpu = echarts.init(cpuChartEl)
      this.charts.memory = echarts.init(memoryChartEl)
      this.charts.disk = echarts.init(diskChartEl)

      const baseOption = {
        backgroundColor: 'transparent',
        grid: {
          top: 40,
          left: '5%',
          right: '5%',
          bottom: 30,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: [],
          axisLine: {
            lineStyle: {
              color: '#00ffff'
            }
          },
          axisLabel: {
            color: '#00ffff',
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100,
          axisLine: {
            lineStyle: {
              color: '#00ffff'
            }
          },
          axisLabel: {
            color: '#00ffff',
            fontSize: 10,
            formatter: '{value}%'
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(0, 255, 255, 0.2)',
              type: 'dashed'
            }
          }
        },
        series: [{
          data: [],
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 3,
          lineStyle: {
            width: 2,
            color: '#00ffff'
          },
          areaStyle: {
            opacity: 0.1,
            color: '#00ffff'
          }
        }],
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 20, 40, 0.9)',
          borderColor: '#00ffff',
          borderWidth: 1,
          textStyle: {
            color: '#00ffff',
            fontSize: 12
          },
          formatter: (params) => {
            if (params && params.length > 0) {
              const param = params[0]
              return `${param.name}<br/>${param.seriesName}: ${param.value}%`
            }
            return ''
          }
        },
        animationDuration: 1000
      }

      this.charts.cpu.setOption({
        ...baseOption,
        color: ['#00ffff'],
        series: [{
          ...baseOption.series[0],
          name: 'CPU使用率'
        }],
        title: {
          text: 'CPU使用率 (%)',
          textStyle: {
            color: '#00ffff',
            fontSize: 14,
            fontWeight: 'normal'
          },
          left: 'center',
          top: 10
        }
      })

      this.charts.memory.setOption({
        ...baseOption,
        color: ['#00ffaa'],
        series: [{
          ...baseOption.series[0],
          name: '内存使用率'
        }],
        title: {
          text: '内存使用率 (%)',
          textStyle: {
            color: '#00ffaa',
            fontSize: 14,
            fontWeight: 'normal'
          },
          left: 'center',
          top: 10
        }
      })

      this.charts.disk.setOption({
        ...baseOption,
        color: ['#ffaa00'],
        series: [{
          ...baseOption.series[0],
          name: '硬盘使用率'
        }],
        title: {
          text: '硬盘使用率 (%)',
          textStyle: {
            color: '#ffaa00',
            fontSize: 14,
            fontWeight: 'normal'
          },
          left: 'center',
          top: 10
        }
      })

      this.updateCharts()
    },

    updateCharts() {
      if (!this.charts.cpu || !this.charts.memory || !this.charts.disk) return

      try {
        this.charts.cpu.setOption({
          xAxis: {
            data: this.historyData.timestamps
          },
          series: [{
            data: this.historyData.cpu
          }]
        })

        this.charts.memory.setOption({
          xAxis: {
            data: this.historyData.timestamps
          },
          series: [{
            data: this.historyData.memory
          }]
        })

        this.charts.disk.setOption({
          xAxis: {
            data: this.historyData.timestamps
          },
          series: [{
            data: this.historyData.disk
          }]
        })
      } catch (error) {
        console.error('Error updating charts:', error)
      }
    },

    // Initialize gauge charts
    initGaugeCharts() {
      const cpuGaugeEl = document.getElementById('cpuGauge')
      const memoryGaugeEl = document.getElementById('memoryGauge')
      const diskGaugeEl = document.getElementById('diskGauge')

      if (!cpuGaugeEl || !memoryGaugeEl || !diskGaugeEl) {
        console.warn('Gauge elements not found, retrying in 500ms...')
        setTimeout(() => {
          this.initGaugeCharts()
        }, 500)
        return
      }

      this.charts.cpuGauge = echarts.init(cpuGaugeEl)
      this.charts.memoryGauge = echarts.init(memoryGaugeEl)
      this.charts.diskGauge = echarts.init(diskGaugeEl)

      // Set initial gauge options
      this.setGaugeOptions(this.charts.cpuGauge, 'CPU', 0, '#00ffff')
      this.setGaugeOptions(this.charts.memoryGauge, '内存', 0, '#00ffaa')
      this.setGaugeOptions(this.charts.diskGauge, '硬盘', 0, '#ffaa00')
    },

    // Set gauge options
    setGaugeOptions(chart, name, value, color) {
      const option = {
        series: [{
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 8,
              color: [
                [0.2, '#13ce66'],
                [0.4, '#00aaff'],
                [0.6, '#00aaff'],
                [0.8, '#ffaa00'],
                [1, '#F56C6C']
              ]
            }
          },
          pointer: {
            width: 5,
            length: '70%',
            itemStyle: {
              color: color
            }
          },
          axisTick: {
            show: false
          },
          splitLine: {
            distance: -10,
            length: 12,
            lineStyle: {
              color: '#00ffff'
            }
          },
          axisLabel: {
            distance: 12,
            color: '#00ffff',
            fontSize: 10
          },
          detail: {
            show: false
          },
          title: {
            show: false
          },
          data: [{
            value: value,
            name: name
          }]
        }]
      }

      chart.setOption(option)
    },

    // Update gauge charts with current data
    updateGaugeCharts() {
      if (!this.charts.cpuGauge || !this.charts.memoryGauge || !this.charts.diskGauge) return

      try {
        if (this.info.cpu) {
          this.charts.cpuGauge.setOption({
            series: [{
              data: [{
                value: this.info.cpu.percent,
                name: 'CPU'
              }]
            }]
          })
        }

        if (this.info.mem) {
          this.charts.memoryGauge.setOption({
            series: [{
              data: [{
                value: this.info.mem.percent,
                name: '内存'
              }]
            }]
          })
        }

        if (this.info.disk) {
          this.charts.diskGauge.setOption({
            series: [{
              data: [{
                value: this.info.disk.percent,
                name: '硬盘'
              }]
            }]
          })
        }
      } catch (error) {
        console.error('Error updating gauge charts:', error)
      }
    },

    resizeCharts() {
      Object.values(this.charts).forEach(chart => {
        if (chart) {
          chart.resize()
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.tech-monitor {
  background: #0a0e17;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Circuit board background pattern */
.circuit-board-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 100, 150, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 100, 150, 0.05) 1px, transparent 1px);
  background-size: 30px 30px;
  z-index: 1; /* Lower z-index to appear behind stars */
}

/* 3D Starfield Animation */
.starfield-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0; /* Behind circuit board */
  overflow: hidden;
}

.star {
  position: absolute;
  background-color: #fff;
  border-radius: 50%;
  animation: twinkle var(--duration, 5s) infinite ease-in-out;
  opacity: var(--opacity, 0.5);
}

.star:nth-child(1) {
  top: 10%;
  left: 20%;
  width: 2px;
  height: 2px;
  --duration: 4s;
  --opacity: 0.8;
  animation-delay: 0s;
}

.star:nth-child(2) {
  top: 25%;
  left: 15%;
  width: 1px;
  height: 1px;
  --duration: 6s;
  --opacity: 0.6;
  animation-delay: 1s;
}

.star:nth-child(3) {
  top: 40%;
  left: 75%;
  width: 3px;
  height: 3px;
  --duration: 5s;
  --opacity: 0.9;
  animation-delay: 0.5s;
}

.star:nth-child(4) {
  top: 60%;
  left: 40%;
  width: 1px;
  height: 1px;
  --duration: 7s;
  --opacity: 0.4;
  animation-delay: 2s;
}

.star:nth-child(5) {
  top: 75%;
  left: 85%;
  width: 2px;
  height: 2px;
  --duration: 3s;
  --opacity: 0.7;
  animation-delay: 1.5s;
}

.star:nth-child(6) {
  top: 15%;
  left: 60%;
  width: 1px;
  height: 1px;
  --duration: 8s;
  --opacity: 0.5;
  animation-delay: 3s;
}

.star:nth-child(7) {
  top: 35%;
  left: 30%;
  width: 2px;
  height: 2px;
  --duration: 4.5s;
  --opacity: 0.6;
  animation-delay: 0.8s;
}

.star:nth-child(8) {
  top: 55%;
  left: 90%;
  width: 1px;
  height: 1px;
  --duration: 5.5s;
  --opacity: 0.3;
  animation-delay: 2.5s;
}

.star:nth-child(9) {
  top: 80%;
  left: 25%;
  width: 3px;
  height: 3px;
  --duration: 6.5s;
  --opacity: 0.8;
  animation-delay: 1.2s;
}

.star:nth-child(10) {
  top: 20%;
  left: 50%;
  width: 1px;
  height: 1px;
  --duration: 7.5s;
  --opacity: 0.4;
  animation-delay: 3.5s;
}

.star:nth-child(11) {
  top: 45%;
  left: 5%;
  width: 2px;
  height: 2px;
  --duration: 4s;
  --opacity: 0.7;
  animation-delay: 0.3s;
}

.star:nth-child(12) {
  top: 70%;
  left: 70%;
  width: 1px;
  height: 1px;
  --duration: 5s;
  --opacity: 0.5;
  animation-delay: 1.8s;
}

.star:nth-child(13) {
  top: 30%;
  left: 95%;
  width: 3px;
  height: 3px;
  --duration: 6s;
  --opacity: 0.9;
  animation-delay: 0.7s;
}

.star:nth-child(14) {
  top: 65%;
  left: 10%;
  width: 1px;
  height: 1px;
  --duration: 7s;
  --opacity: 0.3;
  animation-delay: 2.2s;
}

.star:nth-child(15) {
  top: 85%;
  left: 55%;
  width: 2px;
  height: 2px;
  --duration: 3.5s;
  --opacity: 0.6;
  animation-delay: 1.7s;
}

.star:nth-child(16) {
  top: 5%;
  left: 80%;
  width: 1px;
  height: 1px;
  --duration: 8s;
  --opacity: 0.4;
  animation-delay: 3.2s;
}

.star:nth-child(17) {
  top: 50%;
  left: 45%;
  width: 2px;
  height: 2px;
  --duration: 4.5s;
  --opacity: 0.7;
  animation-delay: 0.9s;
}

.star:nth-child(18) {
  top: 75%;
  left: 35%;
  width: 1px;
  height: 1px;
  --duration: 5.5s;
  --opacity: 0.5;
  animation-delay: 2.7s;
}

.star:nth-child(19) {
  top: 25%;
  left: 65%;
  width: 3px;
  height: 3px;
  --duration: 6.5s;
  --opacity: 0.8;
  animation-delay: 1.3s;
}

.star:nth-child(20) {
  top: 55%;
  left: 15%;
  width: 1px;
  height: 1px;
  --duration: 7.5s;
  --opacity: 0.3;
  animation-delay: 3.7s;
}

@keyframes twinkle {
  0%, 100% {
    opacity: var(--opacity, 0.5);
    transform: scale(1);
  }
  50% {
    opacity: calc(var(--opacity, 0.5) * 0.3);
    transform: scale(0.8);
  }
}

/* Cockpit card styling - Transparent version */
.cockpit-card {
  border-radius: 15px;
  box-shadow: 0 0 20px rgba(0, 150, 255, 0.3), 
              inset 0 0 20px rgba(0, 100, 200, 0.1);
  border: 1px solid rgba(0, 200, 255, 0.2);
  background: transparent; /* Transparent background */
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  z-index: 2;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, 
                rgba(0, 200, 255, 0.1), 
                rgba(0, 100, 255, 0.1), 
                rgba(0, 200, 255, 0.1));
    z-index: -1;
    border-radius: 17px;
  }
}

.cockpit-header {
  background: linear-gradient(90deg, rgba(0, 40, 80, 0.7) 0%, rgba(0, 80, 120, 0.7) 100%);
  color: #00ffff;
  border-radius: 14px 14px 0 0;
  padding: 15px 20px;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 200, 255, 0.3);
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  letter-spacing: 1px; /* Added letter spacing for tech feel */
  
  span {
    color: #00ffff;
    letter-spacing: 1px;
    font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  }
}

.metric-header {
  background: linear-gradient(90deg, rgba(0, 30, 60, 0.8) 0%, rgba(0, 60, 100, 0.8) 100%);
}

.metric-content {
  padding: 15px;
  text-align: center;
  height: calc(100% - 55px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.gauge-chart-large {
  width: 100%;
  height: 220px; /* Increased height for better visibility */
  margin: 0 auto;
  flex: 1;
  min-height: 220px;
}

.metric-value-display {
  color: #00ffff;
  font-size: 28px; /* Increased font size */
  font-weight: bold;
  margin: 15px 0 5px 0;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.7); /* Enhanced glow effect */
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  letter-spacing: 1px; /* Added letter spacing for tech feel */
}

/* Full Width Solar System Animation */
.solar-system-container-full {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px; /* Larger height for full-width display */
  width: 100%;
  padding: 20px 0;
}

.solar-system-full {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100%;
}

.sun-full {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffaa00, #ff5500);
  box-shadow: 0 0 30px #ffaa00, 0 0 60px rgba(255, 170, 0, 0.5);
  z-index: 2;
}

.sun-core-full {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 15px #ffffff;
}

.sun-rays-full {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 170, 0, 0.3), transparent 70%);
  animation: pulse 3s infinite ease-in-out;
}

.orbit-full {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(0, 200, 255, 0.2);
  border-radius: 50%;
}

.orbit-1 {
  width: 80%;
  height: 80%;
  animation: rotateOrbit 20s linear infinite;
}

.orbit-2 {
  width: 60%;
  height: 60%;
  animation: rotateOrbit 30s linear infinite reverse;
}

.orbit-3 {
  width: 40%;
  height: 40%;
  animation: rotateOrbit 40s linear infinite;
}

.planet-full {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  box-shadow: 0 0 10px;
}

.planet-1 {
  width: 25px;
  height: 25px;
  background: radial-gradient(circle, #00aaff, #0066cc);
  box-shadow: 0 0 15px #00aaff;
}

.planet-2 {
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, #00ffaa, #00aa66);
  box-shadow: 0 0 12px #00ffaa;
}

.planet-3 {
  width: 15px;
  height: 15px;
  background: radial-gradient(circle, #ff00aa, #aa0066);
  box-shadow: 0 0 10px #ff00aa;
}

@keyframes rotateOrbit {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.7;
  }
}

.chart-card {
  height: 100%;
  margin-top: 20px;

  ::v-deep .el-card__body {
    padding: 15px;
  }
}

.cockpit-charts {
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding: 15px 0;
}

.full-width-container {
  width: 100%;
  padding: 0;
}

.full-size-chart {
  height: 200px;
  width: 100%;
  border: 1px solid rgba(0, 150, 200, 0.2);
  border-radius: 10px;
  background: rgba(5, 15, 30, 0.4);
  box-shadow: inset 0 0 15px rgba(0, 100, 200, 0.1);
  margin: 0;
}

.mb15 {
  margin-bottom: 15px;
}
</style>
