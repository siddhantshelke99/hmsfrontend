import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Notification {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notification$ = this.notificationSubject.asObservable();

  constructor() {}

  /**
   * Show success notification
   */
  success(title: string, message: string, duration: number = 3000): void {
    this.show({
      type: 'success',
      title,
      message,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Show error notification
   */
  error(title: string, message: string, duration: number = 5000): void {
    this.show({
      type: 'error',
      title,
      message,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Show warning notification
   */
  warning(title: string, message: string, duration: number = 4000): void {
    this.show({
      type: 'warning',
      title,
      message,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Show info notification
   */
  info(title: string, message: string, duration: number = 3000): void {
    this.show({
      type: 'info',
      title,
      message,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Show custom notification
   */
  private show(notification: Notification): void {
    notification.id = this.generateId();
    this.notificationSubject.next(notification);
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notificationSubject.next({
      type: 'info',
      title: '',
      message: '',
      duration: 0
    });
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
