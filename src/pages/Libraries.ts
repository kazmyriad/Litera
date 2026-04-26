import { html, css, type TemplateResult, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import '../components/SearchBar.jsx';
import '../components/CommunityContainer.jsx';
import '../components/BookCard.jsx';
import '../components/Breadcrumb.jsx';
import { getCurrentUser, fetchBooks, type BookRecord } from "../Services.js";

@customElement('libraries-page')
export class LibrariesPage extends LitElement {
    @state() private books: BookRecord[] = [];
    @state() private loading = true;

    connectedCallback(): void {
        super.connectedCallback();
        this.loadBooks();
    }

    private async loadBooks() {
        try {
            this.books = await fetchBooks();
        } catch (e) {
            console.error('Failed to load books', e);
        } finally {
            this.loading = false;
        }
    }

    private renderBookCard(book: BookRecord): TemplateResult {
        return html`<book-card
            title="${book.title}"
            author="${book.authors}"
            thumbnail="${book.thumbnail ?? ''}"
            description="${book.description ?? ''}"
        ></book-card>`;
    }

    render(): TemplateResult {
        const user = getCurrentUser();
        const isAuthenticated = !!user;

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
                        : this.books.map(b => this.renderBookCard(b))}
                </community-container>
            </div>
            ${isAuthenticated ? html`
                <div class="community-reads">
                    <h3>My Community Reads</h3>
                    <community-container>
                        ${this.books.slice(0, 3).map(b => this.renderBookCard(b))}
                    </community-container>
                </div>
                <div class="favorites">
                    <h3>Favorites</h3>
                    <community-container>
                        ${this.books.slice(0, 2).map(b => this.renderBookCard(b))}
                    </community-container>
                </div>
                <div class="user-shelf">
                    <h3>User-Defined-Shelf</h3>
                    <community-container>
                        ${this.books.slice(0, 2).map(b => this.renderBookCard(b))}
                    </community-container>
                </div>
            ` : null}
        </div>
        `;
    }
}

export default LibrariesPage;
