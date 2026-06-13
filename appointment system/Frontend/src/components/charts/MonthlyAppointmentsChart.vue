<template>
  <section class="surface-card chart-card">
    <h3>{{ title }}</h3>
    <Bar :data="chartData" :options="chartOptions" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, BarElement, CategoryScale, Legend, LinearScale, Tooltip } from 'chart.js'

const props = withDefaults(
  defineProps<{
    title: string
    labels: string[]
    values: number[]
    /** Etiqueta del dataset (tooltips de Chart.js) */
    datasetLabel?: string
  }>(),
  { datasetLabel: 'Citas' },
)

ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip)

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.datasetLabel,
      data: props.values,
      borderRadius: 8,
      backgroundColor: '#1d7fa8',
    },
  ],
}))

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },
}
</script>

<style scoped>
.chart-card {
  padding: 18px;
}
h3 {
  margin: 0 0 12px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 600;
}
</style>
