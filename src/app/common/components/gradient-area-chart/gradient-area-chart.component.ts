import { Component, Input } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexChart, ApexStroke } from 'ng-apexcharts';

@Component({
  selector: 'app-gradient-area-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  template: `
    <div id="chart">
      <apx-chart
        [series]="series"
        [chart]="chartOptions.chart"
        [xaxis]="chartOptions.xaxis"
        [colors]="chartOptions.colors"
        [dataLabels]="chartOptions.dataLabels"
        [stroke]="chartOptions.stroke">
      </apx-chart>
    </div>
  `
})
export class GradientAreaChartComponent {
  @Input() title: string = '';
  @Input() series: any[] = [];
  @Input() categories: string[] = [];

  chartOptions = {
    chart: {
      type: 'area' as ApexChart['type'],
      height: 350,
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' as ApexStroke['curve'] },
    xaxis: { categories: this.categories },
    colors: ['#006aff']
  };
}