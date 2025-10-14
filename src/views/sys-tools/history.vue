<template>
  <div class="history-monitor-container">
    <BasicLayout>
      <template #wrapper>
        <el-card class="history-monitor-card">
          <div slot="header" class="clearfix">
            <span class="header-title">历史监控曲线</span>
            <el-button style="float: right; padding: 3px 0" type="text" @click="refreshData">刷新</el-button>
          </div>
          
          <div class="time-selector">
            <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
              <el-radio-button label="1h">最近1小时</el-radio-button>
              <el-radio-button label="6h">最近6小时</el-radio-button>
              <el-radio-button label="24h">最近24小时</el-radio-button>
            </el-radio-group>
          </div>
          
          <div class="chart-container">
            <el-row :gutter="20">
              <el-col :span="24">
                <div class="chart-wrapper">
                  <div ref="cpuChart" class="chart"></div>
                </div>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="chart-wrapper">
                  <div ref="memoryChart" class="chart"></div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="chart-wrapper">
                  <div ref="diskChart" class="chart"></div>
                </div>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="chart-wrapper">
                  <div ref="networkInChart" class="chart"></div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="chart-wrapper">
                  <div ref="networkOutChart" class="chart"></div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </template>
    </BasicLayout>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { getServer } from '@/api/monitor/server'

export default {
  name: 'HistoryMonitor',
  data() {
    return {
      timeRange: '1h',
      charts: {},
      chartData: {
        timestamps: [],
        cpu: [],
        memory: [],
        disk: [],
        networkIn: [],
        networkOut: []
      },
      timer: null
    }
  },
  mounted() {
    this.initCharts()
    this.loadData()
    // 每30秒更新一次数据
    this.timer = setInterval(() => {
      this.loadData()
    }, 30000)
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
    this.disposeCharts()
  },
  methods: {
    initCharts() {
      this.charts.cpuChart = echarts.init(this.$refs.cpuChart)
      this.charts.memoryChart = echarts.init(this.$refs.memoryChart)
      this.charts.diskChart = echarts.init(this.$refs.diskChart)
      this.charts.networkInChart = echarts.init(this.$refs.networkInChart)
      this.charts.networkOutChart = echarts.init(this.$refs.networkOutChart)
      
      this.setChartOptions()
    },
    
    setChartOptions() {
      const baseOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [{
          data: [],
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2
          }
        }],
        grid: {
          left: '5%',
          right: '5%',
          bottom: '15%',
          top: '15%'
        }
      }
      
      // CPU使用率图表
      this.charts.cpuChart.setOption({
        ...baseOption,
        title: {
          text: 'CPU使用率 (%)',
          textStyle: {
            color: '#409EFF',
            fontSize: 14
          }
        },
        yAxis: {
          ...baseOption.yAxis,
          axisLabel: {
            formatter: '{value} %'
          }
        },
        series: [{
          ...baseOption.series[0],
          itemStyle: {
            color: '#409EFF'
          }
        }]
      })
      
      // 内存使用率图表
      this.charts.memoryChart.setOption({
        ...baseOption,
        title: {
          text: '内存使用率 (%)',
          textStyle: {
            color: '#67C23A',
            fontSize: 14
          }
        },
        yAxis: {
          ...baseOption.yAxis,
          axisLabel: {
            formatter: '{value} %'
          }
        },
        series: [{
          ...baseOption.series[0],
          itemStyle: {
            color: '#67C23A'
          }
        }]
      })
      
      // 硬盘使用率图表
      this.charts.diskChart.setOption({
        ...baseOption,
        title: {
          text: '硬盘使用率 (%)',
          textStyle: {
            color: '#E6A23C',
            fontSize: 14
          }
        },
        yAxis: {
          ...baseOption.yAxis,
          axisLabel: {
            formatter: '{value} %'
          }
        },
        series: [{
          ...baseOption.series[0],
          itemStyle: {
            color: '#E6A23C'
          }
        }]
      })
      
      // 网络下载流量图表
      this.charts.networkInChart.setOption({
        ...baseOption,
        title: {
          text: '网络下载 (KB)',
          textStyle: {
            color: '#F56C6C',
            fontSize: 14
          }
        },
        yAxis: {
          ...baseOption.yAxis,
          axisLabel: {
            formatter: '{value} KB'
          }
        },
        series: [{
          ...baseOption.series[0],
          itemStyle: {
            color: '#F56C6C'
          }
        }]
      })
      
      // 网络上传流量图表
      this.charts.networkOutChart.setOption({
        ...baseOption,
        title: {
          text: '网络上传 (KB)',
          textStyle: {
            color: '#909399',
            fontSize: 14
          }
        },
        yAxis: {
          ...baseOption.yAxis,
          axisLabel: {
            formatter: '{value} KB'
          }
        },
        series: [{
          ...baseOption.series[0],
          itemStyle: {
            color: '#909399'
          }
        }]
      })
    },
    
    loadData() {
      getServer().then(ret => {
        if (ret.code === 200) {
          // 添加当前数据点
          const now = new Date().toLocaleTimeString()
          this.chartData.timestamps.push(now)
          this.chartData.cpu.push(ret.cpu.percent)
          this.chartData.memory.push(ret.mem.percent)
          this.chartData.disk.push(ret.disk.percent)
          this.chartData.networkIn.push(parseFloat(ret.net.in))
          this.chartData.networkOut.push(parseFloat(ret.net.out))
          
          // 限制数据点数量，避免图表过于拥挤
          const maxPoints = this.getMaxPoints()
          if (this.chartData.timestamps.length > maxPoints) {
            this.chartData.timestamps.shift()
            this.chartData.cpu.shift()
            this.chartData.memory.shift()
            this.chartData.disk.shift()
            this.chartData.networkIn.shift()
            this.chartData.networkOut.shift()
          }
          
          // 更新图表
          this.updateCharts()
        }
      })
    },
    
    getMaxPoints() {
      switch (this.timeRange) {
        case '1h': return 120 // 每30秒一个点，2分钟一个点显示，最多显示120个点
        case '6h': return 120
        case '24h': return 120
        default: return 120
      }
    },
    
    updateCharts() {
      this.charts.cpuChart.setOption({
        xAxis: {
          data: this.chartData.timestamps
        },
        series: [{
          data: this.chartData.cpu
        }]
      })
      
      this.charts.memoryChart.setOption({
        xAxis: {
          data: this.chartData.timestamps
        },
        series: [{
          data: this.chartData.memory
        }]
      })
      
      this.charts.diskChart.setOption({
        xAxis: {
          data: this.chartData.timestamps
        },
        series: [{
          data: this.chartData.disk
        }]
      })
      
      this.charts.networkInChart.setOption({
        xAxis: {
          data: this.chartData.timestamps
        },
        series: [{
          data: this.chartData.networkIn
        }]
      })
      
      this.charts.networkOutChart.setOption({
        xAxis: {
          data: this.chartData.timestamps
        },
        series: [{
          data: this.chartData.networkOut
        }]
      })
    },
    
    handleTimeRangeChange() {
      // 清空现有数据
      this.chartData.timestamps = []
      this.chartData.cpu = []
      this.chartData.memory = []
      this.chartData.disk = []
      this.chartData.networkIn = []
      this.chartData.networkOut = []
      
      // 重新加载数据
      this.loadData()
    },
    
    refreshData() {
      this.loadData()
    },
    
    disposeCharts() {
      Object.values(this.charts).forEach(chart => {
        if (chart) {
          chart.dispose()
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.history-monitor-container {
  .history-monitor-card {
    .header-title {
      font-size: 18px;
      font-weight: bold;
      color: #303133;
    }
    
    .time-selector {
      margin: 20px 0;
      text-align: center;
    }
    
    .chart-container {
      .chart-wrapper {
        margin-bottom: 20px;
        padding: 10px;
        background: #f5f7fa;
        border-radius: 4px;
        
        .chart {
          width: 100%;
          height: 300px;
        }
      }
    }
  }
}
</style>