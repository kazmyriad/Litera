import { html, css, LitElement, type TemplateResult } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import '../components/SearchBar.jsx';
import '../components/CommunityCard.jsx';
import '../components/CommunityContainer.jsx';
import '../components/JoinButton.jsx';
import {
  getCommunityById,
  getMembership,
  joinCommunity,
  leaveCommunity,
  updateCommunity,
  deleteCommunity,
  getCurrentUser,
  fetchCommunityBooks,
  setCommunityCurrentBook,
  fetchBooks,
  type Community,
  type MembershipStatus,
  type CommunityBooks,
  type BookRecord,
} from '../Services.js';

@customElement('community-detail-page')
export class CommunityDetailPage extends LitElement {
  @property({ type: Number }) communityId = 0;

  @state() private community: Community | null = null;
  @state() private membership: MembershipStatus = { isMember: false, role: null };
  @state() private loading = true;
  @state() private editMode = false;
  @state() private showDeleteConfirm = false;
  @state() private communityBooks: CommunityBooks = { current: null, previous: [] };
  @state() private showBookPicker = false;
  @state() private allBooks: BookRecord[] = [];
  @state() private bookSearchQuery = '';
  @state() private selectedBookId: number | null = null;
  @state() private settingBook = false;

  // Edit form values — set in openEdit() before editMode toggles to true
  private editName = '';
  private editDescription = '';
  private editVisibility: 'public' | 'private' = 'public';
  private editColorScheme = 'default';
  private editThumbnailUrl = '';

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      height: 100%;
      background: var(--color-5);
      color: var(--color-text-dark);
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    .page {
      max-width: 1080px;
      margin: 40px auto 64px;
      background: #f7f5f1;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .hero img {
      display: block;
      width: 100%;
      height: 420px;
      object-fit: cover;
    }

    .hero-placeholder {
      display: block;
      width: 100%;
      height: 420px;
      background: linear-gradient(135deg, var(--color-4), var(--color-5));
    }

    .content {
      padding: 36px 42px 48px;
    }

    .top-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 32px;
      align-items: start;
      margin-bottom: 32px;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
    }

    .community-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
    }

    .member-count {
      color: #5b5b5b;
      font-style: italic;
      font-weight: 600;
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 1.7rem;
      font-weight: 700;
      margin: 0 0 14px;
    }

    .subheading {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 22px 0 12px;
    }

    .current-book {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 18px;
      background: linear-gradient(90deg, #252c24, #1e2520);
      border-radius: 10px;
      overflow: hidden;
      color: white;
      min-height: 150px;
      max-width: 460px;
    }

    .current-book img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .current-book-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 18px 18px 18px 0;
    }

    .current-book-title {
      font-size: 1.85rem;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .current-book-author {
      font-size: 1.4rem;
      font-style: italic;
      font-weight: 600;
    }

    .moderators-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 8px 0 18px;
    }

    .moderators {
      display: flex;
      gap: 28px;
      margin-bottom: 28px;
    }

    .moderator {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-style: italic;
      color: #333;
    }

    .avatar {
      width: 42px;
      height: 42px;
      border-radius: 999px;
      background: #d9d9d9;
      flex-shrink: 0;
    }

    .previous-reads {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .book-thumb {
      width: 84px;
    }

    .book-thumb img {
      width: 84px;
      height: 122px;
      object-fit: cover;
      display: block;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
    }

    .book-thumb span {
      display: block;
      margin-top: 6px;
      font-size: 0.72rem;
      line-height: 1.2;
      color: #444;
    }

    .schedule {
      margin-top: 8px;
    }

    .meeting-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-top: 14px;
    }

    .meeting-card {
      border: 2px solid #72785f;
      background: white;
      min-height: 180px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .meeting-head {
      background: var(--color-4);
      color: white;
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.95rem;
      font-weight: 700;
    }

    .meeting-body {
      padding: 14px 12px 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
    }

    .meeting-topic {
      font-size: 0.98rem;
      line-height: 1.25;
      color: #2a2a2a;
      margin-bottom: 18px;
    }

    .meeting-button {
      align-self: center;
      background: #8f005f;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 22px;
      font-weight: 700;
      cursor: pointer;
    }

    .chat {
      margin-top: 58px;
    }

    .chat-list {
      margin-top: 14px;
      border: 1px solid #c9c9c9;
      border-bottom: none;
    }

    .chat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #e7e7e7;
      border-bottom: 1px solid #9f9f9f;
      padding: 18px 20px;
      font-size: 1rem;
      font-weight: 700;
    }

    .chevron {
      font-size: 1rem;
      color: #333;
    }

    /* Action button */
    .action-btn {
      padding: 8px 20px;
      border-radius: 8px;
      border: none;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .btn-join { background: var(--color-4); color: white; }
    .btn-leave { background: white; color: var(--color-4); border: 2px solid var(--color-4); }
    .btn-edit { background: var(--color-5); color: white; }
    .action-btn:hover { opacity: 0.85; }

    /* Modals */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .modal {
      background: white;
      border-radius: 12px;
      padding: 32px;
      width: 540px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal h2 { margin: 0 0 24px; }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }

    .form-field label { font-weight: 600; font-size: 0.9rem; }

    .form-field input,
    .form-field select,
    .form-field textarea {
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #ccc;
      font-size: 0.95rem;
    }

    .form-field textarea { resize: vertical; min-height: 80px; }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .btn-save {
      background: var(--color-4);
      color: white;
      padding: 10px 24px;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-cancel {
      background: #e0e0e0;
      color: #333;
      padding: 10px 24px;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-delete {
      background: #c0392b;
      color: white;
      padding: 10px 0;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-top: 24px;
    }

    .btn-confirm-delete {
      background: #c0392b;
      color: white;
      padding: 10px 24px;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
    }

    .delete-warning { color: #c0392b; font-weight: 600; margin-bottom: 8px; }

    .btn-set-book {
      margin-top: 12px;
      background: var(--color-4);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-set-book:hover { opacity: 0.85; }

    .book-picker-list {
      max-height: 340px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-top: 10px;
    }

    .book-picker-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background 120ms;
    }
    .book-picker-item:last-child { border-bottom: none; }
    .book-picker-item:hover { background: #f5f5f5; }
    .book-picker-item.selected { background: rgba(100,109,74,0.12); }

    .book-picker-thumb {
      width: 36px;
      height: 52px;
      object-fit: cover;
      border-radius: 3px;
      flex-shrink: 0;
      background: #ddd;
    }

    .book-picker-info { flex: 1; min-width: 0; }
    .book-picker-title { font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .book-picker-author { font-size: 0.8rem; color: #666; }

    .picker-search {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-size: 0.95rem;
      margin-bottom: 4px;
    }
    .picker-search:focus { outline: none; border-color: var(--color-4); }

    .no-current-book {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.08);
      border-radius: 10px;
      color: rgba(255,255,255,0.6);
      font-style: italic;
      min-height: 80px;
      max-width: 460px;
      padding: 18px;
      font-size: 0.9rem;
    }

    @media (max-width: 900px) {
      .page {
        margin: 20px 16px 40px;
      }

      .hero img {
        height: 280px;
      }

      .content {
        padding: 24px 20px 32px;
      }

      .top-grid {
        grid-template-columns: 1fr;
      }

      .meeting-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .current-book {
        max-width: 100%;
      }
    }

    @media (max-width: 560px) {
      .meeting-grid {
        grid-template-columns: 1fr;
      }

      .current-book {
        grid-template-columns: 96px 1fr;
      }

      .current-book-title {
        font-size: 1.3rem;
      }

      .current-book-author {
        font-size: 1rem;
      }

      .book-thumb {
        width: 72px;
      }

      .book-thumb img {
        width: 72px;
        height: 106px;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.load();
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('communityId')) this.load();
  }

  private async load() {
    if (!this.communityId) return;
    this.loading = true;
    try {
      const [community, membership, communityBooks] = await Promise.all([
        getCommunityById(this.communityId),
        getMembership(this.communityId),
        fetchCommunityBooks(this.communityId),
      ]);
      this.community = community;
      this.membership = membership;
      this.communityBooks = communityBooks;
    } catch (e) {
      console.error('Failed to load community', e);
    } finally {
      this.loading = false;
    }
  }

  private async openBookPicker() {
    if (this.allBooks.length === 0) {
      try {
        this.allBooks = await fetchBooks();
      } catch (e) {
        console.error('Failed to load books', e);
      }
    }
    this.bookSearchQuery = '';
    this.selectedBookId = null;
    this.showBookPicker = true;
  }

  private async handleSetCurrentBook() {
    if (!this.community || this.selectedBookId === null) return;
    this.settingBook = true;
    try {
      await setCommunityCurrentBook(this.community.id, this.selectedBookId);
      this.communityBooks = await fetchCommunityBooks(this.community.id);
      this.showBookPicker = false;
    } catch (e) {
      console.error('Failed to set current book', e);
    } finally {
      this.settingBook = false;
    }
  }

  private openEdit() {
    if (!this.community) return;
    this.editName = this.community.name;
    this.editDescription = this.community.description;
    this.editVisibility = this.community.visibility;
    this.editColorScheme = this.community.colorScheme || 'default';
    this.editThumbnailUrl = this.community.thumbnailUrl || '';
    this.editMode = true;
  }

  private async handleSave() {
    if (!this.community) return;
    try {
      this.community = await updateCommunity(this.community.id, {
        name: this.editName,
        description: this.editDescription,
        visibility: this.editVisibility,
        colorScheme: this.editColorScheme,
        thumbnailUrl: this.editThumbnailUrl,
        categories: this.community.categories,
        rules: this.community.rules,
        ownerId: this.community.ownerId,
      });
      this.editMode = false;
    } catch (e) {
      console.error('Failed to update community', e);
    }
  }

  private async handleJoinLeave() {
    if (!this.community) return;
    try {
      if (this.membership.isMember) {
        await leaveCommunity(this.community.id);
        this.membership = { isMember: false, role: null };
      } else {
        const result = await joinCommunity(this.community.id);
        this.membership = { isMember: true, role: result.membership.community_role };
      }
    } catch (e) {
      console.error('Failed to join/leave community', e);
    }
  }

  private async handleDelete() {
    if (!this.community) return;
    try {
      await deleteCommunity(this.community.id);
      window.location.hash = '#/communities';
    } catch (e) {
      console.error('Failed to delete community', e);
    }
  }

  private renderActionButton(): TemplateResult {
    const user = getCurrentUser();
    if (!user || !this.community) return html``;

    const isAdmin = this.membership.role === 'admin' || user.id === this.community.ownerId;
    if (isAdmin) {
      return html`
        <button class="action-btn btn-edit" @click=${this.openEdit.bind(this)}>Edit Community</button>
      `;
    }

    return html`
      <button
        class="action-btn ${this.membership.isMember ? 'btn-leave' : 'btn-join'}"
        @click=${this.handleJoinLeave.bind(this)}
      >${this.membership.isMember ? 'Leave' : 'Join'}</button>
    `;
  }

  private isAdmin(): boolean {
    const user = getCurrentUser();
    if (!user || !this.community) return false;
    return this.membership.role === 'admin' || user.id === this.community.ownerId;
  }

  private renderBookPickerModal(): TemplateResult {
    const q = this.bookSearchQuery.toLowerCase();
    const filtered = q
      ? this.allBooks.filter(b =>
          b.title.toLowerCase().includes(q) || b.authors.toLowerCase().includes(q)
        )
      : this.allBooks;

    return html`
      <div class="overlay">
        <div class="modal">
          <h2>Set Current Book</h2>
          <input
            class="picker-search"
            type="text"
            placeholder="Search by title or author..."
            .value=${this.bookSearchQuery}
            @input=${(e: Event) => { this.bookSearchQuery = (e.target as HTMLInputElement).value; }}
          />
          <div class="book-picker-list">
            ${filtered.slice(0, 60).map(b => html`
              <div
                class="book-picker-item ${this.selectedBookId === b.id ? 'selected' : ''}"
                @click=${() => { this.selectedBookId = b.id; }}
              >
                ${b.thumbnail
                  ? html`<img class="book-picker-thumb" src="${b.thumbnail}" alt="${b.title}" />`
                  : html`<div class="book-picker-thumb"></div>`}
                <div class="book-picker-info">
                  <div class="book-picker-title">${b.title}</div>
                  <div class="book-picker-author">${b.authors}</div>
                </div>
              </div>
            `)}
            ${filtered.length === 0 ? html`<div style="padding:16px;color:#999;text-align:center;">No books found.</div>` : null}
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click=${() => { this.showBookPicker = false; }}>Cancel</button>
            <button
              class="btn-save"
              ?disabled=${this.selectedBookId === null || this.settingBook}
              @click=${this.handleSetCurrentBook.bind(this)}
            >${this.settingBook ? 'Saving...' : 'Set as Current Read'}</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderEditModal(): TemplateResult {
    return html`
      <div class="overlay">
        <div class="modal">
          <h2>Edit Community</h2>

          <div class="form-field">
            <label>Name</label>
            <input .value=${this.editName} @input=${(e: Event) => { this.editName = (e.target as HTMLInputElement).value; }} />
          </div>

          <div class="form-field">
            <label>Description</label>
            <textarea @input=${(e: Event) => { this.editDescription = (e.target as HTMLTextAreaElement).value; }}>${this.editDescription}</textarea>
          </div>

          <div class="form-field">
            <label>Visibility</label>
            <select @change=${(e: Event) => { this.editVisibility = (e.target as HTMLSelectElement).value as 'public' | 'private'; }}>
              <option value="public" ?selected=${this.editVisibility === 'public'}>Public</option>
              <option value="private" ?selected=${this.editVisibility === 'private'}>Private</option>
            </select>
          </div>

          <div class="form-field">
            <label>Color Scheme</label>
            <select @change=${(e: Event) => { this.editColorScheme = (e.target as HTMLSelectElement).value; }}>
              <option value="default" ?selected=${this.editColorScheme === 'default'}>Default</option>
              <option value="dark" ?selected=${this.editColorScheme === 'dark'}>Dark</option>
              <option value="ocean" ?selected=${this.editColorScheme === 'ocean'}>Ocean</option>
              <option value="forest" ?selected=${this.editColorScheme === 'forest'}>Forest</option>
              <option value="sunset" ?selected=${this.editColorScheme === 'sunset'}>Sunset</option>
            </select>
          </div>

          <div class="form-field">
            <label>Thumbnail URL</label>
            <input .value=${this.editThumbnailUrl} @input=${(e: Event) => { this.editThumbnailUrl = (e.target as HTMLInputElement).value; }} />
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" @click=${() => { this.editMode = false; }}>Cancel</button>
            <button class="btn-save" @click=${this.handleSave.bind(this)}>Save Changes</button>
          </div>

          <button class="btn-delete" @click=${() => { this.editMode = false; this.showDeleteConfirm = true; }}>
            Delete Community
          </button>
        </div>
      </div>
    `;
  }

  private renderDeleteConfirm(): TemplateResult {
    const name = this.community?.name ?? 'this community';
    return html`
      <div class="overlay">
        <div class="modal">
          <h2>Delete Community</h2>
          <p class="delete-warning">This action cannot be undone.</p>
          <p>Are you sure you want to permanently delete <strong>${name}</strong>?</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click=${() => { this.showDeleteConfirm = false; }}>Cancel</button>
            <button class="btn-confirm-delete" @click=${this.handleDelete.bind(this)}>Yes, Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  render(): TemplateResult {
    if (this.loading) {
      return html`<div style="padding:48px;text-align:center;">Loading...</div>`;
    }
    if (!this.community) {
      return html`<div style="padding:48px;text-align:center;">Community not found.</div>`;
    }

    const c = this.community;

    return html`
      ${this.editMode ? this.renderEditModal() : null}
      ${this.showDeleteConfirm ? this.renderDeleteConfirm() : null}
      ${this.showBookPicker ? this.renderBookPickerModal() : null}

      <main class="page">
        <section class="hero">
          ${c.thumbnailUrl
            ? html`<img src="${c.thumbnailUrl}" alt="${c.name} banner" />`
            : html`<div class="hero-placeholder"></div>`
          }
        </section>

        <section class="content">
          <div class="top-grid">
            <div>
              <div class="title-row">
                <h1 class="community-title">${c.name}</h1>
                ${this.renderActionButton()}
              </div>
              <div class="member-count">${c.description}</div>

              <div class="subheading">Currently Reading:</div>
              ${this.communityBooks.current ? html`
                <div class="current-book">
                  ${this.communityBooks.current.thumbnail
                    ? html`<img src="${this.communityBooks.current.thumbnail}" alt="${this.communityBooks.current.title} cover" />`
                    : html`<div style="width:120px;background:#555;"></div>`}
                  <div class="current-book-info">
                    <div class="current-book-title">${this.communityBooks.current.title}</div>
                    <div class="current-book-author">by ${this.communityBooks.current.authors}</div>
                  </div>
                </div>
              ` : html`
                <div class="no-current-book">No current read set yet.</div>
              `}
              ${this.isAdmin() ? html`
                <button class="btn-set-book" @click=${this.openBookPicker.bind(this)}>
                  ${this.communityBooks.current ? 'Change Current Book' : 'Set Current Book'}
                </button>
              ` : null}
            </div>

            <div>
              <div class="moderators-title">Moderated by:</div>
              <div class="moderators">
                <div class="moderator">
                  <div class="avatar"></div>
                  <span>${c.owner ?? 'Unknown'}</span>
                </div>
              </div>

              <div class="subheading">Previous Reads:</div>
              <div class="previous-reads">
                ${this.communityBooks.previous.length
                  ? this.communityBooks.previous.map(b => html`
                      <div class="book-thumb">
                        ${b.thumbnail
                          ? html`<img src="${b.thumbnail}" alt="${b.title} cover" />`
                          : html`<div style="width:84px;height:122px;background:#ccc;border-radius:3px;"></div>`}
                        <span>${b.title}</span>
                      </div>
                    `)
                  : html`<p style="color:#888;font-size:0.85rem;font-style:italic;">No previous reads yet.</p>`}
              </div>
            </div>
          </div>

          <section class="schedule">
            <h2 class="section-title">Meeting Schedule:</h2>
            <div class="meeting-grid">
              ${[
                "Chapter 1 Discussion",
                "Chapter 2 Discussion",
                "Chapter 3 Discussion",
                "Chapter 4 Discussion",
              ].map(
                (meeting) => html`
                  <article class="meeting-card">
                    <div class="meeting-head">
                      <span>Monday</span>
                      <span>4/6</span>
                    </div>
                    <div class="meeting-body">
                      <div class="meeting-topic">${meeting}</div>
                      <button class="meeting-button">Join</button>
                    </div>
                  </article>
                `
              )}
            </div>
          </section>

          <section class="chat">
            <h2 class="section-title">Chat</h2>
            <div class="chat-list">
              ${[
                "#Chapter 1 Discussion",
                "#Chapter 2 Discussion",
                "#Chapter 3 Discussion",
              ].map(
                (channel) => html`
                  <div class="chat-row">
                    <span>${channel}</span>
                    <span class="chevron">˅</span>
                  </div>
                `
              )}
            </div>
          </section>
        </section>
      </main>
    `;
  }
}

export default CommunityDetailPage;
