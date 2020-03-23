<script>
import { Radar, mixins } from 'vue-chartjs'
const { reactiveProp } = mixins

export default {
  extends: Radar,
  mixins: [reactiveProp],

  data() {
    return {
      options: {
        scale: {
          angleLines: {
            display: false
          },
          ticks: {
            beginAtZero: true,
            min: 0,
            step: 1,
          },
        },
      },
    }
  },

  mounted() {
    this.renderChart(this.chartData, this.options)
  },
}
</script>
