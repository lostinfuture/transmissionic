<template>
  <div id="stats">
    <h2 id="title">{{Locale.statistics}}</h2>
    <canvas ref="canvas" width="290" height="150" role="img" :aria-label="Locale.statistics"></canvas>
    <table aria-describedby="title">
      <thead>
        <tr>
          <th scope="col"><span class="visually-hidden">{{ Locale.name }}</span></th>
          <th scope="col">{{Locale.current}}</th>
          <th scope="col">{{Locale.total}}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">{{Locale.downloaded}}</th>
          <td>{{Utils.formatBytes(sessionStats["current-stats"].downloadedBytes,1)}}</td>
          <td>{{Utils.formatBytes(sessionStats["cumulative-stats"].downloadedBytes,1)}}</td>
        </tr>
        <tr>
          <th scope="row">{{Locale.uploaded}}</th>
          <td>{{Utils.formatBytes(sessionStats["current-stats"].uploadedBytes,1)}}</td>
          <td>{{Utils.formatBytes(sessionStats["cumulative-stats"].uploadedBytes,1)}}</td>
        </tr>
        <tr>
          <th scope="row">{{Locale.duration}}</th>
          <td>{{Utils.durationToString(sessionStats["current-stats"].secondsActive*1000)}}</td>
          <td>{{Utils.durationToString(sessionStats["cumulative-stats"].secondsActive*1000)}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  arrowDownOutline,
  arrowUpOutline,
} from 'ionicons/icons';
import { Locale } from "../../services/Locale";
import { Utils } from "../../services/Utils";
import { Chart,registerables  } from "chart.js";
import { TransmissionRPC } from '../../services/TransmissionRPC';
Chart.register(...registerables);

let chart: Chart;
let drawInterval: any;

const chartOptions = {
  responsive: false,
  plugins: {
    legend: {
      position: "bottom" as any,
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        color: "#545b55"
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: Record<string,any>): string {
          return Utils.formatBytes(context.raw,1,true) as string;
        }
      }
    },
  },
  elements: {
    line: {
      borderWidth: 1.5,
      fill:true
    },
    point: {
      radius: 0
    }
  },
  animation: {
    duration: 0
  },
  scales: {
    x: {
      ticks: {
        autoSkip: false,
        maxRotation: 0,
        minRotation: 0,
        color: "#545b55"
      },
      grid: {
        display: false,
      },
      border: {
        display: false
      }
    },
    y: {
      ticks: {
        maxTicksLimit: 4,
        color: "#545b55",
        callback: function(value: string|number) {
          return Utils.formatBytes(parseInt(value.toString()),1,true) as string|number;
        }
      },
      grid: {
        color: "rgba(127,127,127,.15)"
      },
      border: {
        display: false
      }
    }
  }   
};

export default defineComponent({
  name: 'StatsPopover',
  data() {
    const css = getComputedStyle(document.body);
    const token = (name: string, fallback: string) => (css.getPropertyValue(name) || fallback).trim();
    const down = token('--positive', '#1b7a4b');
    const up = token('--info', '#2c5fae');
    chartOptions.scales.y.grid.color = token('--rule', 'rgba(127,127,127,.15)');
    chartOptions.scales.x.ticks.color = token('--muted', '#545b55');
    chartOptions.scales.y.ticks.color = token('--muted', '#545b55');
    chartOptions.plugins.legend.labels.color = token('--muted', '#545b55');
    return {
      data: {
        labels: this.labels(),
        datasets: [
          {
            label: Locale.download,
            data: this.dataset1(),
            borderColor: down,
            backgroundColor: down + "22"
          },
          {
            label: Locale.seed,
            data: this.dataset2(),
            borderColor: up,
            backgroundColor: up + "22"
          }
        ]
      },
      sessionStats:TransmissionRPC.sessionStats
    }
  },
  setup() {
    Utils.pushState();

    return {
      Locale,
      Utils,
      arrowDownOutline,
      arrowUpOutline,
    };
  },
  created() {
    this.$nextTick(() => this.setDrawInterval());
  },
  beforeUnmount() {
    clearInterval(drawInterval);
  },
  methods: {
    setDrawInterval() {
      const canvas = this.$refs.canvas as HTMLCanvasElement;
      chart = new Chart(canvas, {type: 'line',options:chartOptions,data:this.data});
      drawInterval = setInterval(() => this.updateData(),10000);
    },
    updateData() {
      this.data.labels = this.labels();
      this.data.datasets[0].data = this.dataset1();
      this.data.datasets[1].data = this.dataset2();
      this.sessionStats = TransmissionRPC.sessionStats;
      chart.update();
    },
    dataset1(): any {
      return TransmissionRPC.statsHistory.map((values) => values[0] as number);
    },
    dataset2(): any {
      return TransmissionRPC.statsHistory.map((values) => values[1] as number);
    },
    labels() {
      const result=[];
      for (let i = 0; i < TransmissionRPC.statsHistory.length; i++) {
        if(i===0){
          const start = (Date.now()/1000)-(TransmissionRPC.statsHistory.length*10);
          result.push(Utils.secondsToDate(start, false, true));
        }
        else if(i===TransmissionRPC.statsHistory.length-1){
          result.push(Utils.secondsToDate(Date.now()/1000, false, true));
        }
        else {
          result.push("");
        }
      }
      return result;
    }
  }
});
</script>

<style scoped>
#stats {
  padding: 14px 15px 12px;
}

h2 {
  margin: 0 0 10px;
  font-size: var(--fs-section);
  font-weight: 600;
}

canvas {
  display: block;
  margin: 0 auto;
}

table {
  width:100%;
  margin-top: 12px;
  border-collapse: collapse;
  font-size: var(--fs-body);
  font-variant-numeric: tabular-nums;
}

th, td {
  padding: 6px 0 6px 8px;
  text-align: end;
  border-bottom: 1px solid var(--rule);
}

thead th {
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--ink);
}

tbody th {
  text-align: start;
  font-weight: 500;
  color: var(--ink);
  padding-inline-start: 0;
}

tbody tr:last-child th,
tbody tr:last-child td {
  border-bottom: 0;
}
</style>