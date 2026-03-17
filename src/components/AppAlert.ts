import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export type AppAlertType = 'success' | 'error' | 'info' | 'warning';

@customElement('app-alert')
export class AppAlert extends LitElement {
  @property({ type: String }) type: AppAlertType = 'info';
  @property({ type: String }) message = '';
  @property({ type: Boolean, reflect: true }) open = false;

  private timeoutId: number | null = null;

  static styles = css`
    :host {
      position: fixed;
      left: 50%;
      top: 24px;
      transform: translateX(-50%) translateY(-10px);
      z-index: 9999;
      width: min(520px, calc(100% - 32px));
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
      opacity: 0;
    }

    :host([open]) {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(-50%) translateY(0);
    }

    .badge {
      border-radius: 12px;
      padding: 14px 16px;
      box-shadow: 0 6px 26px rgba(0,0,0,0.12);
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;
      font-size: 0.95rem;
      line-height: 1.2;
      border: 1px solid transparent;
      color: var(--alert-text, #111);
      background: var(--alert-bg, #f2f5fe);
    }

    .badge.success { background: #d5f0dc; border-color: #7ccf9b; color: #1b5a31; }
    .badge.error { background: #ffe2e2; border-color: #f08080; color: #7a1b20; }
    .badge.info { background: #e8f0ff; border-color: #6ea6f6; color: #1a3d7f; }
    .badge.warning { background: #fff3cd; border-color: #f3c962; color: #704b13; }

    .message { flex: 1; }

    button.close {
      background: transparent;
      border: none;
      color: inherit;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    button.close:hover { opacity: 0.7; }
  `;

  render() {
    return html`
      <div class="badge ${this.type}">
        <div class="message">${this.message}</div>
        <button class="close" @click=${this._onClose} aria-label="Dismiss">✕</button>
      </div>
    `;
  }

  show(message: string, type: AppAlertType = 'info', autoClose = true, delay = 3500) {
    this.message = message;
    this.type = type;
    this.open = true;

    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }

    if (autoClose) {
      this.timeoutId = window.setTimeout(() => this._onClose(), delay);
    }

    return this;
  }

  _onClose() {
    if (!this.open) return;
    this.open = false;
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }
}
