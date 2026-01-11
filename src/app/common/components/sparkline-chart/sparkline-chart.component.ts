import { Component, Input } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexChart, ApexStroke } from 'ng-apexcharts';

@Component({
  selector: 'app-sparkline-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  template: `
    <div id="sparkline">
      <apx-chart
        [series]="[{ data: series }]"
        [chart]="chartOptions.chart"
        [stroke]="chartOptions.stroke"
        [tooltip]="chartOptions.tooltip">
      </apx-chart>
    </div>
  `
})
export class SparklineChartComponent {
  @Input() series: number[] = [];
  @Input() height: number = 50;

  chartOptions = {
    chart: {
      type: 'line' as ApexChart['type'],
      height: this.height,
      sparkline: { enabled: true }
    },
    stroke: { curve: 'smooth' as ApexStroke['curve'] },
    tooltip: { enabled: false }
  };
}