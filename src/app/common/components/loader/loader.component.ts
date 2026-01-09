import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
  @Input() message: string = 'Loading...';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() overlay: boolean = false;

  get spinnerSize(): string {
    switch (this.size) {
      case 'sm': return '2rem';
      case 'lg': return '4rem';
      default: return '3rem';
    }
  }
}
