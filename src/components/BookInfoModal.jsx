import { html, css, LitElement } from 'lit';

class BookInfoModal extends LitElement {
  static get tag() {
    return 'book-info-modal';
  }

  static get properties() {
    return {
      book: { type: Object },
      shelves: { type: Array },
    };
  }

  constructor() {
    super();
    this.book = null;
    this.shelves = [];
  }

  static get styles() {
    return css`
      :host { display: block; }

      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 16px;
        box-sizing: border-box;
      }

      .modal {
        background: white;
        border-radius: 14px;
        padding: 28px;
        width: 560px;
        max-width: 100%;
        max-height: 88vh;
        overflow-y: auto;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
        position: relative;
      }

      .close-btn {
        position: absolute;
        top: 14px;
        right: 16px;
        background: transparent;
        border: none;
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
        color: #888;
        padding: 4px 8px;
        border-radius: 6px;
        transition: background 100ms, color 100ms;
      }
      .close-btn:hover { background: #f0f0f0; color: #333; }

      .book-layout {
        display: flex;
        gap: 20px;
        margin-bottom: 22px;
        padding-right: 28px;
      }

      .book-cover { flex-shrink: 0; }

      .book-cover img {
        width: 110px;
        height: 160px;
        object-fit: cover;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
      }

      .no-cover {
        width: 110px;
        height: 160px;
        background: #ece0d5;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 2.5rem;
        color: #a58a64;
      }
      .no-cover p {
        font-size: 0.9rem;
        padding: 0 6px;
      }

      .book-details { flex: 1; min-width: 0; }

      .book-title {
        margin: 0 0 5px;
        font-size: 1.25rem;
        font-weight: 700;
        color: #1a1a1a;
        line-height: 1.3;
      }

      .book-author {
        margin: 0 0 10px;
        color: #666;
        font-size: 0.9rem;
      }

      .book-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
      }

      .meta-chip {
        background: #ece0d5;
        color: #5c4a30;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 0.76rem;
        font-weight: 500;
      }

      .book-description {
        margin: 0;
        font-size: 0.86rem;
        color: #444;
        line-height: 1.6;
        max-height: 90px;
        overflow-y: auto;
      }

      .divider {
        border: none;
        border-top: 1px solid #efefef;
        margin: 0 0 18px;
      }

      .shelves-heading {
        margin: 0 0 10px;
        font-size: 0.78rem;
        font-weight: 700;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .shelves-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .shelf-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 7px 14px;
        border-radius: 20px;
        border: 1.5px solid #ccc;
        background: white;
        color: #444;
        font-size: 0.86rem;
        font-weight: 500;
        cursor: pointer;
        transition: border-color 120ms, color 120ms, background 120ms;
      }
      .shelf-btn:hover {
        border-color: #646d4a;
        color: #646d4a;
        background: rgba(100, 109, 74, 0.06);
      }
      .shelf-btn.added {
        background: #646d4a;
        border-color: #646d4a;
        color: white;
      }
      .shelf-btn.added:hover {
        background: #4e5538;
        border-color: #4e5538;
      }

      .no-shelves {
        color: #999;
        font-size: 0.88rem;
        font-style: italic;
      }
    `;
  }

  _close() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  _toggleShelf(shelf) {
    if (!this.book) return;
    const bookId = this.book.id;
    const hasBook = shelf.books.some(b => b.id === bookId);
    this.dispatchEvent(new CustomEvent('shelf-toggle', {
      bubbles: true,
      composed: true,
      detail: { shelf, book: this.book, bookId, add: !hasBook },
    }));
  }

  render() {
    if (!this.book) return html``;
    const book = this.book;

    return html`
      <div class="overlay" @click=${(e) => { if (e.target === e.currentTarget) this._close(); }}>
        <div class="modal">
          <button class="close-btn" @click=${() => this._close()} aria-label="Close">×</button>

          <div class="book-layout">
            <div class="book-cover">
              ${book.thumbnail
                ? html`<img src="${book.thumbnail}" alt="${book.title}" />`
                : html`<div class="no-cover"><p>( ˶°ㅁ°) !! No Cover!</p></div>`}
            </div>
            <div class="book-details">
              <h2 class="book-title">${book.title}</h2>
              ${book.authors ? html`<p class="book-author">by ${book.authors}</p>` : ''}
              <div class="book-meta">
                ${book.published_year ? html`<span class="meta-chip">${book.published_year}</span>` : ''}
                ${book.average_rating ? html`<span class="meta-chip">★ ${Number(book.average_rating).toFixed(1)}</span>` : ''}
                ${book.categories ? html`<span class="meta-chip">${book.categories.split(',')[0].trim()}</span>` : ''}
              </div>
              ${book.description ? html`<p class="book-description">${book.description}</p>` : ''}
            </div>
          </div>

          <hr class="divider" />

          <div class="shelves-section">
            <p class="shelves-heading">Add to Shelf</p>
            ${this.shelves.length === 0
              ? html`<p class="no-shelves">No shelves yet — create one from the Libraries page!</p>`
              : html`
                <div class="shelves-list">
                  ${this.shelves.map(shelf => {
                    const hasBook = shelf.books.some(b => b.id === book.id);
                    return html`
                      <button
                        class="shelf-btn ${hasBook ? 'added' : ''}"
                        @click=${() => this._toggleShelf(shelf)}
                      >${hasBook ? '✓' : '+'} ${shelf.name}</button>
                    `;
                  })}
                </div>
              `}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define(BookInfoModal.tag, BookInfoModal);
