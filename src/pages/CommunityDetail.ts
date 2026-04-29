import { html, css, LitElement, type TemplateResult } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { customElement, state, property, query } from 'lit/decorators.js';
import '../components/SearchBar.jsx';
import '../components/CommunityCard.jsx';
import '../components/CommunityContainer.jsx';
import '../components/JoinButton.jsx';
import '../components/successAnimation.jsx';
import '../components/ForumThread.js';
import '../components/AddMembersModal.js';
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
  finishCurrentBook,
  fetchBooks,
  createBook,
  fetchCommunityThreads,
  createForumThread,
  type Community,
  type MembershipStatus,
  type CommunityBooks,
  type BookRecord,
  type ForumThread,
} from '../Services.js';

const SCHEMES: Record<string, { deep: string; mid: string; light: string; textLight: string; textDark: string }> = {
  default: { deep: '#414833', mid: '#646d4a', light: '#ece0d5', textLight: '#fbfff4', textDark: '#2d2a26' },
  dark:    { deep: '#1c1c1e', mid: '#3a3a3c', light: '#d1d1d6', textLight: '#f5f5f7', textDark: '#1c1c1e' },
  ocean:   { deep: '#0d2137', mid: '#1a4a6e', light: '#cde8f5', textLight: '#e8f4fd', textDark: '#0d2137' },
  forest:  { deep: '#1e3a2f', mid: '#2d6a4f', light: '#d8f3dc', textLight: '#f0fdf4', textDark: '#1e3a2f' },
  sunset:  { deep: '#4a1942', mid: '#a0522d', light: '#fde8e0', textLight: '#fdf4f0', textDark: '#3d1a18' },
};

@customElement('community-detail-page')
export class CommunityDetailPage extends LitElement {
  @property({ type: Number }) communityId = 0;
  @query('success-animation') private successAnim!: any;

  @state() private community: Community | null = null;
  @state() private membership: MembershipStatus = { isMember: false, role: null };
  @state() private loading = true;
  @state() private editMode = false;
  @state() private showDeleteConfirm = false;
  @state() private showAddMembersModal = false;
  @state() private communityBooks: CommunityBooks = { current: null, previous: [] };
  @state() private showBookPicker = false;
  @state() private allBooks: BookRecord[] = [];
  @state() private bookSearchQuery = '';
  @state() private selectedBookId: number | null = null;
  @state() private settingBook = false;
  @state() private finishingBook = false;
  @state() private showAddBookForm = false;
  @state() private addBookTitle = '';
  @state() private addBookAuthors = '';
  @state() private addBookIsbn = '';
  @state() private addBookThumbnail = '';
  @state() private addBookYear = '';
  @state() private addingBook = false;
  @state() private addBookError = '';

  // Forum state
  @state() private threads: ForumThread[] = [];
  @state() private newThreadTitle = '';
  @state() private showNewThread = false;
  @state() private creatingThread = false;

  // Edit form values — set in openEdit() before editMode toggles to true
  private editName = '';
  private editDescription = '';
  private editVisibility: 'public' | 'private' = 'public';
  private editColorScheme = 'default';
  private editThumbnailUrl = '';

  static styles = css`
    :host {
      display: block;
      background: var(--cs-deep, #414833);
      color: var(--color-text-dark);
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }

    br {
      height: 48px;
    }
    .page {
      justify-self: center;
      max-width: 85%;
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
      background: linear-gradient(135deg, var(--cs-mid, #646d4a), var(--cs-deep, #414833));
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
      background: linear-gradient(90deg, var(--cs-deep, #252c24), var(--cs-mid, #1e2520));
      border-radius: 10px;
      overflow: hidden;
      color: var(--cs-text-light, white);
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
      object-fit: cover;
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
      border: 2px solid var(--cs-mid, #646d4a);
      background: white;
      min-height: 180px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .meeting-head {
      background: var(--cs-mid, #646d4a);
      color: var(--cs-text-light, white);
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
      background: var(--cs-mid, #646d4a);
      color: var(--cs-text-light, white);
      border: none;
      border-radius: 8px;
      padding: 10px 22px;
      font-weight: 700;
      cursor: pointer;
    }

    .forum {
      margin-top: 58px;
    }

    .forum-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .forum-list {
      border: 1px solid #c9c9c9;
      border-bottom: none;
      border-radius: 4px 4px 0 0;
      overflow: hidden;
    }

    .forum-empty {
      padding: 24px;
      text-align: center;
      color: #999;
      font-style: italic;
      font-size: 0.9rem;
      background: #fafafa;
      border: 1px solid #c9c9c9;
    }

    .btn-new-thread {
      background: var(--cs-mid, #646d4a);
      color: var(--cs-text-light, #fbfff4);
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-new-thread:hover { opacity: 0.85; }

    .new-thread-form {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
      align-items: center;
    }

    .new-thread-form input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-size: 0.95rem;
      font-family: inherit;
    }
    .new-thread-form input:focus { outline: none; border-color: var(--cs-mid, #646d4a); }

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

    .btn-join { background: var(--cs-mid, #646d4a); color: var(--cs-text-light, white); }
    .btn-leave { background: white; color: var(--cs-mid, #646d4a); border: 2px solid var(--cs-mid, #646d4a); }
    .btn-edit { background: var(--cs-deep, #414833); color: var(--cs-text-light, white); }
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
      background: var(--cs-mid, #646d4a);
      color: var(--cs-text-light, white);
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

    .admin-book-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    .btn-set-book {
      background: var(--cs-mid, #646d4a);
      color: var(--cs-text-light, white);
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-set-book:hover { opacity: 0.85; }

    .btn-finish-book {
      background: var(--cs-mid, #646d4a);
      color: var(--cs-text-light, white);
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-finish-book:hover { opacity: 0.85; }
    .btn-finish-book:disabled { opacity: 0.5; cursor: not-allowed; }

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

    .empty-search {
      padding: 20px 16px;
      text-align: center;
      color: #888;
    }

    .empty-search p { margin: 0 0 12px; font-size: 0.9rem; }

    .btn-add-book {
      background: var(--cs-mid, #646d4a);
      color: var(--cs-text-light, white);
      border: none;
      border-radius: 8px;
      padding: 9px 20px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-add-book:hover { opacity: 0.85; }

    .add-book-form { margin-top: 4px; }

    .add-book-back {
      background: none;
      border: none;
      color: var(--color-4);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0 0 14px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .add-book-back:hover { text-decoration: underline; }

    .add-book-error {
      color: #c0392b;
      font-size: 0.85rem;
      margin: 8px 0 0;
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
    this._applyScheme();
  }

  private _applyScheme() {
    const s = SCHEMES[this.community?.colorScheme ?? 'default'] ?? SCHEMES['default'];
    this.style.setProperty('--cs-deep', s.deep);
    this.style.setProperty('--cs-mid', s.mid);
    this.style.setProperty('--cs-light', s.light);
    this.style.setProperty('--cs-text-light', s.textLight);
    this.style.setProperty('--cs-text-dark', s.textDark);
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
    try {
      this.threads = await fetchCommunityThreads(this.communityId);
    } catch (e) {
      console.warn('Forum threads unavailable (table may not exist yet)', e);
    }
  }

  private async handleCreateThread() {
    if (!this.newThreadTitle.trim() || !this.community) return;
    this.creatingThread = true;
    try {
      const thread = await createForumThread(this.community.id, this.newThreadTitle.trim());
      this.threads = [thread, ...this.threads];
      this.newThreadTitle = '';
      this.showNewThread = false;
    } catch (e) {
      console.error('Failed to create thread', e);
    } finally {
      this.creatingThread = false;
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
    this.showAddBookForm = false;
    this.addBookTitle = '';
    this.addBookAuthors = '';
    this.addBookIsbn = '';
    this.addBookThumbnail = '';
    this.addBookYear = '';
    this.addBookError = '';
    this.showBookPicker = true;
  }

  private async handleAddBook() {
    if (!this.addBookTitle.trim() || !this.addBookAuthors.trim()) {
      this.addBookError = 'Title and Author are required.';
      return;
    }
    this.addingBook = true;
    this.addBookError = '';
    try {
      const newBook = await createBook({
        title: this.addBookTitle.trim(),
        authors: this.addBookAuthors.trim(),
        isbn13: this.addBookIsbn.trim() || undefined,
        thumbnail: this.addBookThumbnail.trim() || undefined,
        published_year: this.addBookYear ? Number(this.addBookYear) : undefined,
      });
      this.allBooks = [...this.allBooks, newBook];
      this.selectedBookId = newBook.id;
      this.showAddBookForm = false;
      this.bookSearchQuery = newBook.title;
    } catch (e) {
      this.addBookError = e instanceof Error ? e.message : 'Failed to add book.';
    } finally {
      this.addingBook = false;
    }
  }

  private async handleFinishBook() {
    if (!this.community) return;
    this.finishingBook = true;
    try {
      await finishCurrentBook(this.community.id);
      this.communityBooks = await fetchCommunityBooks(this.community.id);
    } catch (e) {
      console.error('Failed to finish book', e);
    } finally {
      this.finishingBook = false;
    }
  }

  private async handleSetCurrentBook() {
    if (!this.community || this.selectedBookId === null) return;
    this.settingBook = true;
    try {
      await setCommunityCurrentBook(this.community.id, this.selectedBookId);
      this.communityBooks = await fetchCommunityBooks(this.community.id);
      this.showBookPicker = false;
      await this.updateComplete;
      this.successAnim?.play();
    } catch (e) {
      console.error('Failed to set current book', e);
    } finally {
      this.settingBook = false;
    }
  }

  private joinMeeting() {
    window.open("https://meet.google.com/zqt-duff-gwi", "_blank", "noopener,noreferrer");
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
        <div style="display: flex; gap: 10px; align-items: center;">
          ${this.community.visibility === 'private' ? html`
            <button class="action-btn btn-edit" @click=${() => { this.showAddMembersModal = true; }}>
              Add Members
            </button>
          ` : ''}
          <button class="action-btn btn-edit" @click=${this.openEdit.bind(this)}>Edit Community</button>
        </div>
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

    const pickerContent = this.showAddBookForm
      ? html`
          <div class="add-book-form">
            <button class="add-book-back" @click=${() => { this.showAddBookForm = false; this.addBookError = ''; }}>
              ← Back to search
            </button>
            <div class="form-field">
              <label>Title <span style="color:#c0392b">*</span></label>
              <input .value=${this.addBookTitle} @input=${(e: Event) => { this.addBookTitle = (e.target as HTMLInputElement).value; }} placeholder="e.g. The Great Gatsby" />
            </div>
            <div class="form-field">
              <label>Author(s) <span style="color:#c0392b">*</span></label>
              <input .value=${this.addBookAuthors} @input=${(e: Event) => { this.addBookAuthors = (e.target as HTMLInputElement).value; }} placeholder="e.g. F. Scott Fitzgerald" />
            </div>
            <div class="form-field">
              <label>ISBN-13 <span style="color:#999;font-weight:400;">(optional)</span></label>
              <input .value=${this.addBookIsbn} @input=${(e: Event) => { this.addBookIsbn = (e.target as HTMLInputElement).value; }} placeholder="13-digit ISBN" maxlength="13" />
            </div>
            <div class="form-field">
              <label>Thumbnail URL <span style="color:#999;font-weight:400;">(optional)</span></label>
              <input .value=${this.addBookThumbnail} @input=${(e: Event) => { this.addBookThumbnail = (e.target as HTMLInputElement).value; }} placeholder="https://..." />
            </div>
            <div class="form-field">
              <label>Published Year <span style="color:#999;font-weight:400;">(optional)</span></label>
              <input type="number" .value=${this.addBookYear} @input=${(e: Event) => { this.addBookYear = (e.target as HTMLInputElement).value; }} placeholder="e.g. 1925" min="1000" max="2100" />
            </div>
            ${this.addBookError ? html`<p class="add-book-error">${this.addBookError}</p>` : null}
          </div>
        `
      : html`
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
            ${filtered.length === 0 ? html`
              <div class="empty-search">
                <p>No books found for "${this.bookSearchQuery}".</p>
                <button class="btn-add-book" @click=${() => { this.showAddBookForm = true; }}>
                  + Add Book
                </button>
              </div>
            ` : null}
          </div>
        `;

    return html`
      <div class="overlay">
        <div class="modal">
          <h2>${this.showAddBookForm ? 'Add a New Book' : 'Set Current Book'}</h2>
          ${pickerContent}
          <div class="modal-actions">
            <button class="btn-cancel" @click=${() => { this.showBookPicker = false; }}>Cancel</button>
            ${this.showAddBookForm ? html`
              <button
                class="btn-save"
                ?disabled=${this.addingBook}
                @click=${this.handleAddBook.bind(this)}
              >${this.addingBook ? 'Adding...' : 'Add Book'}</button>
            ` : html`
              <button
                class="btn-save"
                ?disabled=${this.selectedBookId === null || this.settingBook}
                @click=${this.handleSetCurrentBook.bind(this)}
              >${this.settingBook ? 'Saving...' : 'Set as Current Read'}</button>
            `}
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

  private renderAddMembersModal(): TemplateResult {
    return html`
      <add-members-modal 
        .communityId=${this.communityId}
        @done=${() => { this.showAddMembersModal = false; }}
      ></add-members-modal>
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
      <success-animation></success-animation>
      ${this.editMode ? this.renderEditModal() : null}
      ${this.showDeleteConfirm ? this.renderDeleteConfirm() : null}
      ${this.showAddMembersModal ? this.renderAddMembersModal() : null}
      ${this.showBookPicker ? this.renderBookPickerModal() : null}

      <br>
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
                <div class="admin-book-actions">
                  <button class="btn-set-book" @click=${this.openBookPicker.bind(this)}>
                    ${this.communityBooks.current ? 'Change Current Book' : 'Set Current Book'}
                  </button>
                  ${this.communityBooks.current ? html`
                    <button
                      class="btn-finish-book"
                      ?disabled=${this.finishingBook}
                      @click=${this.handleFinishBook.bind(this)}
                    >${this.finishingBook ? 'Finishing...' : 'Finish Book'}</button>
                  ` : null}
                </div>
              ` : null}
            </div>

            <div>
              <div class="moderators-title">Moderated by:</div>
              <div class="moderators">
                <div class="moderator" style="cursor:pointer" @click=${() => { window.location.hash = `/user/${c.ownerId}`; }}>
                  ${c.ownerAvatarUrl
                    ? html`<img class="avatar" src="${c.ownerAvatarUrl}" alt=${ifDefined(c.owner)} />`
                    : html`<div class="avatar"></div>`}
                  <span style="text-decoration:underline">@${c.owner ?? 'Unknown'}</span>
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
                      <button class="meeting-button" @click=${() => this.joinMeeting()}>
                        Join
                      </button>
                    </div>
                  </article>
                `
              )}
            </div>
          </section>

          <section class="forum">
            <div class="forum-header">
              <h2 class="section-title" style="margin:0;">Discussions</h2>
              ${getCurrentUser() ? html`
                <button class="btn-new-thread" @click=${() => { this.showNewThread = !this.showNewThread; }}>
                  + New Thread
                </button>
              ` : null}
            </div>

            ${this.showNewThread ? html`
              <div class="new-thread-form">
                <input
                  type="text"
                  placeholder="Thread title…"
                  .value=${this.newThreadTitle}
                  @input=${(e: Event) => { this.newThreadTitle = (e.target as HTMLInputElement).value; }}
                  @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.handleCreateThread(); }}
                />
                <button
                  class="btn-new-thread"
                  ?disabled=${!this.newThreadTitle.trim() || this.creatingThread}
                  @click=${this.handleCreateThread.bind(this)}
                >${this.creatingThread ? 'Creating…' : 'Create'}</button>
                <button
                  class="btn-cancel"
                  @click=${() => { this.showNewThread = false; this.newThreadTitle = ''; }}
                >Cancel</button>
              </div>
            ` : null}

            ${this.threads.length ? html`
              <div class="forum-list">
                ${this.threads.map(t => html`
                  <forum-thread
                    .threadId=${t.id}
                    .title=${t.title}
                    .postCount=${Number(t.post_count)}
                    .isAdmin=${this.isAdmin()}
                  ></forum-thread>
                `)}
              </div>
            ` : html`
              <div class="forum-empty">No discussions yet — start one!</div>
            `}
          </section>
        </section>
      </main>
      <br>
    `;
  }
}

export default CommunityDetailPage;
