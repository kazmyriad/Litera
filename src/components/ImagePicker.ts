import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? '';

@customElement('image-picker')
export class ImagePicker extends LitElement {
  /** Current image URL (can be set by parent to show an existing image). */
  @property({ type: String }) value = '';

  @state() private mode: 'url' | 'upload' = 'url';
  @state() private preview = '';
  @state() private uploading = false;
  @state() private error = '';

  connectedCallback() {
    super.connectedCallback();
    this.preview = this.value;
  }

  static styles = css`
    :host { display: block; }

    .tabs {
      display: flex;
      margin-bottom: 8px;
    }

    .tab {
      flex: 1;
      padding: 6px 0;
      border: 1px solid #ccc;
      background: #f5f5f5;
      cursor: pointer;
      font-size: 0.85rem;
      transition: background 0.15s;
    }
    .tab:first-child { border-radius: 6px 0 0 6px; }
    .tab:last-child  { border-radius: 0 6px 6px 0; border-left: none; }
    .tab.active {
      background: var(--color-4, #6b7c5c);
      color: white;
      border-color: var(--color-4, #6b7c5c);
    }

    input[type='text'] {
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #ccc;
      font-size: 0.9rem;
      width: 100%;
      box-sizing: border-box;
    }

    .drop-zone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 18px 12px;
      text-align: center;
      cursor: pointer;
      background: #fafafa;
      transition: border-color 0.15s;
    }
    .drop-zone:hover { border-color: var(--color-4, #6b7c5c); }
    .drop-zone p { margin: 4px 0; }
    .drop-zone .hint { font-size: 0.78rem; color: #999; }

    input[type='file'] { display: none; }

    .preview-wrap { margin-top: 10px; }
    .preview-wrap img {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid #ddd;
    }

    .status { margin-top: 4px; font-size: 0.82rem; }
    .status.uploading { color: #666; }
    .status.error     { color: #c0392b; }
  `;

  private dispatch(value: string) {
    this.preview = value;
    this.dispatchEvent(new CustomEvent('image-changed', {
      detail: { value },
      bubbles: true,
      composed: true,
    }));
  }

  private onUrlInput(e: Event) {
    this.dispatch((e.target as HTMLInputElement).value);
  }

  private async onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploading = true;
    this.error = '';

    try {
      const body = new FormData();
      body.append('image', file);

      const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body });
      const text = await res.text();
      if (!res.ok) {
        const msg = (() => { try { return JSON.parse(text).error; } catch { return text; } })();
        throw new Error(msg || `Upload failed (${res.status})`);
      }
      const { url } = JSON.parse(text);
      this.dispatch(url);
    } catch (err) {
      this.error = (err as Error).message || 'Upload failed';
    } finally {
      this.uploading = false;
    }
  }

  private openFilePicker() {
    this.shadowRoot?.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  }

  render() {
    return html`
      <div class="tabs">
        <button class="tab ${this.mode === 'url' ? 'active' : ''}"
          @click=${() => { this.mode = 'url'; }}>Paste URL</button>
        <button class="tab ${this.mode === 'upload' ? 'active' : ''}"
          @click=${() => { this.mode = 'upload'; }}>Upload File</button>
      </div>

      ${this.mode === 'url' ? html`
        <input
          type="text"
          placeholder="https://example.com/image.jpg"
          .value=${this.value}
          @input=${this.onUrlInput}
        />
      ` : html`
        <div class="drop-zone" @click=${this.openFilePicker}>
          <p>Click to select an image</p>
          <p class="hint">JPG, PNG, GIF, WebP &mdash; max 5 MB</p>
        </div>
        <input type="file" accept="image/*" @change=${this.onFileChange} />
        ${this.uploading ? html`<p class="status uploading">Uploading&hellip;</p>` : ''}
        ${this.error     ? html`<p class="status error">${this.error}</p>`        : ''}
      `}

      ${this.preview ? html`
        <div class="preview-wrap">
          <img src=${this.preview} alt="Preview" />
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'image-picker': ImagePicker;
  }
}
