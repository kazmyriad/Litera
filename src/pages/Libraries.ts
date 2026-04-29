import { html, css, type TemplateResult, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import '../components/SearchBar.jsx';
import '../components/CommunityContainer.jsx';
import '../components/BookCard.jsx';
import '../components/Breadcrumb.jsx';
import {
    getCurrentUser,
    fetchBooks,
    fetchFavorites,
    fetchPopularBooks,
    addFavorite,
    removeFavorite,
    fetchCommunityCurrentReads,
    fetchUserShelves,
    createUserShelf,
    type BookRecord,
    type CommunityRead,
    type UserShelf,
} from "../Services.js";

@customElement('libraries-page')
export class LibrariesPage extends LitElement {
    @state() private books: BookRecord[] = [];
    @state() private popularBooks: BookRecord[] = [];
    @state() private favoriteIds: Set<number> = new Set();
    @state() private communityReads: CommunityRead[] = [];
    @state() private userShelves: UserShelf[] = [];
    @state() private loading = true;
    @state() private searchQuery = '';
    @state() private activeFilters: string[] = [];

    // Shelf creator state
    @state() private showShelfCreator = false;
    @state() private shelfName = '';
    @state() private shelfSelectedIds: Set<number> = new Set();
    @state() private shelfSearchQuery = '';
    @state() private creatingShelf = false;
    @state() private shelfError = '';

    static styles = css`
        :host { display: block; }

        .page-content {
            max-width: 100%;
            margin: 0 auto;
            padding: 0 96px;
            justify-items: center;
            text-align: center;
        }

        div.banner {
            background-color: var(--color-5);
                text-align: center;
                color: white;
                width: fit-content;
                margin: 24px auto;
                padding: 0 64px;
        }

        .search-wrap {
            display: flex;
            justify-content: center;
            margin: 24px 0;
        }

        .section { margin: 24px 0; }

        .section-heading {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 12px;
            color: var(--color-text-dark);
        }

        .community-read-label {
            font-size: 0.75rem;
            color: #666;
            font-style: italic;
            margin-top: 4px;
            text-align: center;
        }

        .community-read-wrap {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
        }

        /* Shelf creator overlay */
        .overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 200;
        }

        .modal {
            background: white;
            border-radius: 12px;
            padding: 32px;
            width: 580px;
            max-width: 92vw;
            max-height: 90vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        .modal h2 { margin: 0 0 20px; font-size: 1.4rem; }

        .form-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 16px;
        }

        .form-field label { font-weight: 600; font-size: 0.9rem; }

        .form-field input {
            padding: 9px 12px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 0.95rem;
            font-family: inherit;
        }

        .form-field input:focus { outline: none; border-color: var(--color-4); }

        .picker-search {
            width: 100%;
            padding: 9px 12px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 0.95rem;
            font-family: inherit;
            margin-bottom: 8px;
        }
        .picker-search:focus { outline: none; border-color: var(--color-4); }

        .book-picker-list {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 12px;
        }

        .book-picker-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background 120ms;
            user-select: none;
        }
        .book-picker-item:last-child { border-bottom: none; }
        .book-picker-item:hover { background: #f5f5f5; }
        .book-picker-item.selected { background: rgba(100,109,74,0.1); }

        .book-picker-thumb {
            width: 36px;
            height: 52px;
            object-fit: cover;
            border-radius: 3px;
            flex-shrink: 0;
            background: #ddd;
        }

        .book-picker-info { flex: 1; min-width: 0; }
        .book-picker-title {
            font-weight: 600;
            font-size: 0.88rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .book-picker-author { font-size: 0.78rem; color: #666; }

        .fav-badge {
            font-size: 0.7rem;
            background: var(--color-1);
            color: white;
            border-radius: 4px;
            padding: 1px 5px;
            margin-left: 6px;
            flex-shrink: 0;
        }

        .check-icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid #ccc;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            color: white;
            transition: all 120ms;
        }
        .book-picker-item.selected .check-icon {
            background: var(--color-4);
            border-color: var(--color-4);
        }

        .section-label {
            padding: 6px 14px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #888;
            background: #fafafa;
            border-bottom: 1px solid #f0f0f0;
        }

        .selected-count {
            font-size: 0.85rem;
            color: var(--color-4);
            font-weight: 600;
            margin-bottom: 16px;
        }

        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 4px;
        }

        .btn-cancel {
            background: #e0e0e0;
            color: #333;
            padding: 10px 24px;
            border-radius: 8px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
        }

        .btn-save {
            background: var(--color-4);
            color: white;
            padding: 10px 24px;
            border-radius: 8px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
        }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-create-shelf {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 8px;
            padding: 10px 20px;
            background: var(--color-5);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
        }
        .btn-create-shelf:hover { opacity: 0.85; }

        .shelf-error { color: #c0392b; font-size: 0.85rem; margin-bottom: 8px; }

        .empty-state { color: #999; font-style: italic; padding: 8px 0; font-size: 0.9rem; }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.loadAll();
        this.addEventListener('favorite-toggle', this.handleFavoriteToggle as unknown as EventListener);
        this.addEventListener('search-changed', this.handleSearchChanged as unknown as EventListener);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.removeEventListener('favorite-toggle', this.handleFavoriteToggle as unknown as EventListener);
        this.removeEventListener('search-changed', this.handleSearchChanged as unknown as EventListener);
    }

    private async loadAll() {
        try {
            const user = getCurrentUser();
            const baseLoads: Promise<void>[] = [
                fetchBooks().then(b => { this.books = b; }),
                fetchPopularBooks().then(p => { this.popularBooks = p; }),
            ];
            if (user) {
                baseLoads.push(
                    Promise.all([
                        fetchFavorites(user.id),
                        fetchCommunityCurrentReads(user.id),
                        fetchUserShelves(user.id),
                    ]).then(([ids, communityReads, userShelves]) => {
                        this.favoriteIds = new Set(ids);
                        this.communityReads = communityReads;
                        this.userShelves = userShelves;
                    })
                );
            }
            await Promise.all(baseLoads);
        } catch (e) {
            console.error('Failed to load library data', e);
        } finally {
            this.loading = false;
        }
    }

    private handleSearchChanged = (e: Event) => {
        const { query, filters } = (e as CustomEvent).detail;
        this.searchQuery = query;
        this.activeFilters = filters;
    };

    private filterAndSortBooks(books: BookRecord[]): BookRecord[] {
        const q = this.searchQuery.toLowerCase();
        let result = q
            ? books.filter(b =>
                b.title.toLowerCase().includes(q) ||
                b.authors.toLowerCase().includes(q) ||
                (b.description ?? '').toLowerCase().includes(q) ||
                (b.categories ?? '').toLowerCase().includes(q)
              )
            : books;
        if (this.activeFilters.includes('A-Z'))
            result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        if (this.activeFilters.includes('Popular'))
            result = [...result].sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0));
        if (this.activeFilters.includes('Recently Updated'))
            result = [...result].sort((a, b) => (b.published_year ?? 0) - (a.published_year ?? 0));
        return result;
    }

    private handleFavoriteToggle = async (e: Event) => {
        const { bookId, favorite } = (e as CustomEvent).detail;
        if (!bookId || !getCurrentUser()) return;
        try {
            if (favorite) {
                await addFavorite(bookId);
                this.favoriteIds = new Set([...this.favoriteIds, bookId]);
            } else {
                await removeFavorite(bookId);
                const next = new Set(this.favoriteIds);
                next.delete(bookId);
                this.favoriteIds = next;
            }
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    };

    private renderBookCard(book: BookRecord): TemplateResult {
        return html`<book-card
            title="${book.title}"
            author="${book.authors}"
            thumbnail="${book.thumbnail ?? ''}"
            description="${book.description ?? ''}"
            .bookId=${book.id}
            .favorite=${this.favoriteIds.has(book.id)}
        ></book-card>`;
    }

    // ── Shelf creator ──────────────────────────────────────────────

    private openShelfCreator() {
        this.shelfName = '';
        this.shelfSelectedIds = new Set();
        this.shelfSearchQuery = '';
        this.shelfError = '';
        this.showShelfCreator = true;
    }

    private toggleShelfBook(id: number) {
        const next = new Set(this.shelfSelectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        this.shelfSelectedIds = next;
    }

    private async handleCreateShelf() {
        if (!this.shelfName.trim()) { this.shelfError = 'Shelf name is required.'; return; }
        this.creatingShelf = true;
        this.shelfError = '';
        try {
            const shelf = await createUserShelf(this.shelfName.trim(), [...this.shelfSelectedIds]);
            // Attach the selected book objects so the shelf renders immediately
            shelf.books = this.books.filter(b => this.shelfSelectedIds.has(b.id));
            this.userShelves = [...this.userShelves, shelf];
            this.showShelfCreator = false;
        } catch (e) {
            this.shelfError = e instanceof Error ? e.message : 'Failed to create shelf.';
        } finally {
            this.creatingShelf = false;
        }
    }

    private renderShelfCreatorModal(): TemplateResult {
        const q = this.shelfSearchQuery.toLowerCase();
        const favBooks = this.books.filter(b => this.favoriteIds.has(b.id));
        const otherBooks = this.books.filter(b => !this.favoriteIds.has(b.id));

        const filterFn = (b: BookRecord) =>
            !q || b.title.toLowerCase().includes(q) || b.authors.toLowerCase().includes(q);

        const filteredFavs = favBooks.filter(filterFn);
        const filteredOthers = otherBooks.filter(filterFn);
        const showFavSection = filteredFavs.length > 0;
        const showOtherSection = filteredOthers.length > 0;

        const bookRow = (b: BookRecord, isFav: boolean) => html`
            <div
                class="book-picker-item ${this.shelfSelectedIds.has(b.id) ? 'selected' : ''}"
                @click=${() => this.toggleShelfBook(b.id)}
            >
                <div class="check-icon">${this.shelfSelectedIds.has(b.id) ? '✓' : ''}</div>
                ${b.thumbnail
                    ? html`<img class="book-picker-thumb" src="${b.thumbnail}" alt="${b.title}" />`
                    : html`<div class="book-picker-thumb"></div>`}
                <div class="book-picker-info">
                    <div class="book-picker-title">
                        ${b.title}
                        ${isFav ? html`<span class="fav-badge">♥ Favorite</span>` : null}
                    </div>
                    <div class="book-picker-author">${b.authors}</div>
                </div>
            </div>
        `;

        return html`
            <div class="overlay" @click=${(e: Event) => { if (e.target === e.currentTarget) this.showShelfCreator = false; }}>
                <div class="modal">
                    <h2>Create New Shelf</h2>

                    <div class="form-field">
                        <label>Shelf Name <span style="color:#c0392b">*</span></label>
                        <input
                            .value=${this.shelfName}
                            placeholder="e.g. Summer Reads, Must-Reads..."
                            @input=${(e: Event) => { this.shelfName = (e.target as HTMLInputElement).value; }}
                        />
                    </div>

                    <input
                        class="picker-search"
                        type="text"
                        placeholder="Search books to add..."
                        .value=${this.shelfSearchQuery}
                        @input=${(e: Event) => { this.shelfSearchQuery = (e.target as HTMLInputElement).value; }}
                    />

                    <div class="book-picker-list">
                        ${showFavSection ? html`
                            <div class="section-label">♥ Your Favorites</div>
                            ${filteredFavs.slice(0, 50).map(b => bookRow(b, true))}
                        ` : null}
                        ${showOtherSection ? html`
                            ${showFavSection ? html`<div class="section-label">All Books</div>` : null}
                            ${filteredOthers.slice(0, 50).map(b => bookRow(b, false))}
                        ` : null}
                        ${!showFavSection && !showOtherSection
                            ? html`<div style="padding:16px;color:#999;text-align:center;">No books found.</div>`
                            : null}
                    </div>

                    <div class="selected-count">
                        ${this.shelfSelectedIds.size === 0
                            ? 'No books selected yet'
                            : `${this.shelfSelectedIds.size} book${this.shelfSelectedIds.size === 1 ? '' : 's'} selected`}
                    </div>

                    ${this.shelfError ? html`<p class="shelf-error">${this.shelfError}</p>` : null}

                    <div class="modal-actions">
                        <button class="btn-cancel" @click=${() => { this.showShelfCreator = false; }}>Cancel</button>
                        <button
                            class="btn-save"
                            ?disabled=${this.creatingShelf}
                            @click=${this.handleCreateShelf.bind(this)}
                        >${this.creatingShelf ? 'Creating...' : 'Create Shelf'}</button>
                    </div>
                </div>
            </div>
        `;
    }

    render(): TemplateResult {
        const user = getCurrentUser();
        const isAuthenticated = !!user;
        const isFiltering = this.searchQuery.trim() !== '' || this.activeFilters.length > 0;
        const filteredBooks = this.filterAndSortBooks(this.books);
        const favoriteBooks = this.books.filter(b => this.favoriteIds.has(b.id));

        return html`
            ${this.showShelfCreator ? this.renderShelfCreatorModal() : null}

            <bread-crumb></bread-crumb>

            <div class="banner">
                <h1 style="padding: 24px 0;">Libraries</h1>
            </div>

            <div class="search-wrap">
                <search-bar></search-bar>
            </div>

            <div class="page-content">
                ${isFiltering ? html`
                    <div class="section">
                        <div class="section-heading">Search Results</div>
                        <community-container>
                            ${this.loading
                                ? html`<p>Loading...</p>`
                                : filteredBooks.length
                                    ? filteredBooks.map(b => this.renderBookCard(b))
                                    : html`<p class="empty-state">No books match your search.</p>`}
                        </community-container>
                    </div>
                ` : html`
                    <div class="section">
                        <div class="section-heading">Popular Reads</div>
                        <community-container>
                            ${this.loading
                                ? html`<p>Loading...</p>`
                                : this.popularBooks.length
                                    ? this.popularBooks.map(b => this.renderBookCard(b))
                                    : html`<p class="empty-state">No popular reads yet.</p>`}
                        </community-container>
                    </div>

                    ${isAuthenticated ? html`
                        <div class="section">
                            <div class="section-heading">My Community Reads</div>
                            <community-container>
                                ${this.communityReads.length
                                    ? this.communityReads.map(cr => html`
                                        <div class="community-read-wrap">
                                            ${this.renderBookCard(cr.book)}
                                            <div class="community-read-label">${cr.communityName}</div>
                                        </div>
                                      `)
                                    : html`<p class="empty-state">No communities have a current read set yet.</p>`}
                            </community-container>
                        </div>

                        <div class="section">
                            <div class="section-heading">Favorites</div>
                            <community-container>
                                ${favoriteBooks.length
                                    ? favoriteBooks.map(b => this.renderBookCard(b))
                                    : html`<p class="empty-state">No favorites yet — click the heart on any book!</p>`}
                            </community-container>
                        </div>

                        ${this.userShelves.map(shelf => html`
                            <div class="section">
                                <div class="section-heading">${shelf.name}</div>
                                <community-container>
                                    ${shelf.books.length
                                        ? shelf.books.map(b => this.renderBookCard(b))
                                        : html`<p class="empty-state">No books on this shelf yet.</p>`}
                                </community-container>
                            </div>
                        `)}

                        <div class="section">
                            <button class="btn-create-shelf" @click=${this.openShelfCreator.bind(this)}>
                                + Create New Shelf
                            </button>
                        </div>
                    ` : null}
                `}
            </div>
        `;
    }
}

export default LibrariesPage;
