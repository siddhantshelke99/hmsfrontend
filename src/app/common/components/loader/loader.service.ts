import { Injectable } from '@angular/core';

export interface LoaderState {
  show: boolean;
  message?: string;
  overlay?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loaderState: LoaderState = {
    show: false,
    message: 'Loading...',
    overlay: false
  };

  /**
   * Show loader
   */
  show(message: string = 'Loading...', overlay: boolean = false): void {
    this.loaderState = {
      show: true,
      message,
      overlay
    };
  }

  /**
   * Hide loader
   */
  hide(): void {
    this.loaderState = {
      show: false,
      message: '',
      overlay: false
    };
  }

  /**
   * Get current loader state
   */
  getState(): LoaderState {
    return this.loaderState;
  }

  /**
   * Check if loader is visible
   */
  isVisible(): boolean {
    return this.loaderState.show;
  }
}
