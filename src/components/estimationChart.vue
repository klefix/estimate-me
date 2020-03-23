<script>
import { Bar, mixins } from 'vue-chartjs'
const { reactiveProp } = mixins

export default {
  extends: Bar,
  mixins: [reactiveProp],

  data() {
    return {
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                min: 0,
                stepSize: 1,
                maxTicksLimit: 10,
              },
            }
          ]
        },
      },
    }
  },

  mounted() {
    this.renderChart(this.chartData, this.options)
  },
}
</script>
