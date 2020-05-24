<script>
import { Bar, mixins } from 'vue-chartjs'
const { reactiveProp } = mixins

export default {
  extends: Bar,
  mixins: [reactiveProp],

  mounted() {
    const style = getComputedStyle(document.getElementById('app'));
    const globalGridLineColor = style.getPropertyValue('--GLOBAL_GRID_LINE_COLOR')

    this.renderChart(this.chartData, {
      scales: {
        yAxes: [
          {
            ticks: {
              min: 0,
              stepSize: 1,
              maxTicksLimit: 10,
              fontColor: globalGridLineColor,
            },
            gridLines: {
              color: globalGridLineColor,
              zeroLineColor: globalGridLineColor,
            }
          }
        ],
        xAxes: [
          {
            ticks: {
              fontColor: globalGridLineColor,
            },
            gridLines: {
              color: globalGridLineColor,
              zeroLineColor: globalGridLineColor,
            }
          }
        ],
      },
      legend: {
        labels: {
          fontColor: globalGridLineColor,
        }
      },
    })
  },
}
</script>
