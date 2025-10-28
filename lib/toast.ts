// Simple toast utility
// This is a lightweight implementation without external dependencies

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom';
}

class ToastManager {
  private container: HTMLDivElement | null = null;

  private ensureContainer(): HTMLDivElement {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private show(message: string, type: ToastType, options: ToastOptions = {}): void {
    const container = this.ensureContainer();
    const duration = options.duration || 3000;

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${this.getBackgroundColor(type)};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-size: 14px;
      max-width: 350px;
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    toast.innerHTML = `
      <span>${this.getIcon(type)}</span>
      <span>${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Remove after duration
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        container.removeChild(toast);
      }, 300);
    }, duration);
  }

  private getBackgroundColor(type: ToastType): string {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  }

  private getIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  success(message: string, options?: ToastOptions): void {
    this.show(message, 'success', options);
  }

  error(message: string, options?: ToastOptions): void {
    this.show(message, 'error', options);
  }

  warning(message: string, options?: ToastOptions): void {
    this.show(message, 'warning', options);
  }

  info(message: string, options?: ToastOptions): void {
    this.show(message, 'info', options);
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Export singleton instance
export const toast = new ToastManager();

