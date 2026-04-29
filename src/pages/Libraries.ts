import { html, css, type TemplateResult, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import '../components/SearchBar.jsx';
import '../components/CommunityContainer.jsx';
import '../components/BookCard.jsx';
import '../components/Breadcrumb.jsx';
import { getCurrentUser, fetchBooks, fetchFavorites, addFavorite, removeFavorite, type BookRecord } from "../Services.js";

@customElement('libraries-page')
export class LibrariesPage extends LitElement {
    @state() private books: BookRecord[] = [];
    @state() private favoriteIds: Set<number> = new Set();
    @state() private loading = true;
    @state() private searchQuery = '';
    @state() private activeFilters: string[] = [];

    connectedCallback(): void {
        super.connectedCallback();
        this.loadBooks();
        this.addEventListener('favorite-toggle', this.handleFavoriteToggle as unknown as EventListener);
        this.addEventListener('search-changed', this.handleSearchChanged as unknown as EventListener);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.removeEventListener('favorite-toggle', this.handleFavoriteToggle as unknown as EventListener);
        this.removeEventListener('search-changed', this.handleSearchChanged as unknown as EventListener);
    }

    private async loadBooks() {
        try {
            this.books = await fetchBooks();
            const user = getCurrentUser();
            if (user) {
                const ids = await fetchFavorites(user.id);
                this.favoriteIds = new Set(ids);
            }
        } catch (e) {
            console.error('Failed to load books', e);
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

        if (this.activeFilters.includes('A-Z')) {
            result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        }
        if (this.activeFilters.includes('Popular')) {
            result = [...result].sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0));
        }
        if (this.activeFilters.includes('Recently Updated')) {
            result = [...result].sort((a, b) => (b.published_year ?? 0) - (a.published_year ?? 0));
        }
        return result;
    }

    private handleFavoriteToggle = async (e: Event) => {
        const { bookId, favorite } = (e as CustomEvent).detail;
        if (!bookId) return;
        if (!getCurrentUser()) return;

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

    render(): TemplateResult {
        const user = getCurrentUser();
        const isAuthenticated = !!user;
        const filteredBooks = this.filterAndSortBooks(this.books);
        const favoriteBooks = this.filterAndSortBooks(this.books.filter(b => this.favoriteIds.has(b.id)));

        const styles = css`
            :host {
                display: block;
            }
            div.banner {
                background-color: var(--color-5);
                margin: 24px;
                text-align: center;
                color: white;
                width: fit-content;
                justify-self: center;
            }
            div.content {
                justify-self: center;
            }
            div.my-communities, div.popular-communities {
                margin: 24px;
                gap: 24px;
            }
        `;

        return html`
        <bread-crumb></bread-crumb>
        <style>${styles}</style>
        <div class="banner">
            <h1 style="padding: 24px 64px;">Libraries</h1>
        </div>
        <div class="content">
            <search-bar></search-bar>
            <div>
                <h3>Popular Reads</h3>
                <community-container>
                    ${this.loading
                        ? html`<p>Loading...</p>`
                        : filteredBooks.length
                            ? filteredBooks.map(b => this.renderBookCard(b))
                            : html`<p style="color:#999; padding:8px 0;">No books match your search.</p>`}
                </community-container>
            </div>
            ${isAuthenticated ? html`
                <div class="community-reads">
                    <h3>My Community Reads</h3>
                    <community-container>
                        ${this.filterAndSortBooks(this.books.slice(0, 3)).map(b => this.renderBookCard(b))}
                    </community-container>
                </div>
                <div class="favorites">
                    <h3>Favorites</h3>
                    <community-container>
                        ${favoriteBooks.length
                            ? favoriteBooks.map(b => this.renderBookCard(b))
                            : html`<p style="color:#999; padding:8px 0;">No favorites yet — click the heart on any book!</p>`}
                    </community-container>
                </div>
                <div class="user-shelf">
                    <h3>User-Defined-Shelf</h3>
                    <community-container>
                        ${this.filterAndSortBooks(this.books.slice(0, 2)).map(b => this.renderBookCard(b))}
                    </community-container>
                </div>
            ` : null}
        </div>
        `;
    }
}

export default LibrariesPage;
