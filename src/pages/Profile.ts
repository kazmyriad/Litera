//this is where we would write the frontend for profile
// ---- also where we would likely require having logged in + fetched specific user data
import { html, css, type TemplateResult, LitElement } from "lit";
import { until } from 'lit/directives/until.js';
import { customElement, state } from "lit/decorators.js";
import '../components/CommunityCard.jsx';
import '../components/CommunityContainer.jsx';
import '../components/BookCard.jsx';
import '../components/Breadcrumb.jsx';
import '../components/ProfileTag.jsx';
import EditIcon from '../images/Edit.svg';
import {
    getCurrentUser, fetchUserById, fetchCommunities, fetchBooks,
    fetchFavorites, addFavorite, removeFavorite,
    type Community, type BookRecord
} from "../Services";

@customElement('profile-page')
export class ProfilePage extends LitElement {
    @state() private communities: Community[] = [];
    @state() private books: BookRecord[] = [];
    @state() private favoriteIds: Set<number> = new Set();
    @state() private loading = true;

    connectedCallback(): void {
        super.connectedCallback();
        this.loadData();
        this.addEventListener('favorite-toggle', this.handleFavoriteToggle as unknown as EventListener);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.removeEventListener('favorite-toggle', this.handleFavoriteToggle as unknown as EventListener);
    }

    private async loadData() {
        try {
            const user = getCurrentUser();
            const results = await Promise.all([
                fetchCommunities(),
                fetchBooks(),
                user ? fetchFavorites(user.id) : Promise.resolve([] as number[]),
            ]);
            this.communities = results[0];
            this.books = results[1];
            this.favoriteIds = new Set(results[2]);
        } catch (e) {
            console.error('Failed to load profile data', e);
        } finally {
            this.loading = false;
        }
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

    private renderCommunityCard(community: Community): TemplateResult {
        return html`
          <div style="cursor:pointer" @click=${() => { window.location.hash = `#/community-detail/${community.id}`; }}>
            <community-card name="${community.name}" description="${community.description}" thumbnail="${community.thumbnailUrl || ''}"></community-card>
          </div>`;
    }

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

        if (!user) {
            return html`<p>Please log in to view your profile.</p>`;
        }

        const userPromise = fetchUserById(user.id);
        const myCommunities = this.communities.filter(c => c.ownerId === user.id);
        const favoriteBooks = this.books.filter(b => this.favoriteIds.has(b.id));

        const styles = css`
            :host{
                display: block;
                background-color: var(--color-3);
            }
            
            #card {
                margin: 48px;
                border-radius: 8px;
            }
            .banner, .personal-info, .lists {
                display: flex;
                background-color: white;
                border-bottom: 1px solid #ccc;
                border-radius: 8px;
                padding: 16px;
                gap: 24px;
                margin-bottom: 16px;
            }
            .personal-info {
                justify-content: space-between;
            }
            .info {
                display: flex;
                flex-wrap: wrap;
                gap: 24px;
            }
            p.form-label {
                font-weight: lighter;
                    color: #666;
                font-size: 0.8em;
            }
            .lists {
                flex-direction: column;
            }
            img#profileImg {
                max-width: 100px;
                height: 100px;
                border-radius: 100%;
            }
            #card button {
                background: #a9bb72;
                border: none;
                padding: 6px 8px;
                height: fit-content;
                border-radius: 4px;
            }
            #card button:hover {
                cursor: pointer;
                opacity: 0.7;
            }
        `;

        const bannerTemplate = until(
            userPromise.then(user => {
                const fullName = user.full_name ?? `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim();
                return html`
                    <div class="profile-names">
                        <h4>@${user.username ?? 'Unknown'}</h4>
                        <h5>${fullName || 'No name available'}</h5>
                    </div>
                `;
            }),
            html`<div>Loading profile...</div>`
        );

        const personalInfoTemplate = until(
            userPromise.then(user => {
                const firstName = user.firstname ?? '';
                const lastName = user.lastname ?? '';
                const dob = user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A';
                const email = user.email ?? '';
                return html`
                    <div class="info">
                        <div>
                            <p class="form-label">First Name</p>
                            <p>${firstName}</p>
                        </div>
                        <div>
                            <p class="form-label">Last Name</p>
                            <p>${lastName}</p>
                        </div>
                        <div>
                            <p class="form-label">DOB</p>
                            <p>${dob}</p>
                        </div>
                        <div>
                            <p class="form-label">Email</p>
                            <p>${email}</p>
                        </div>
                    </div>
                `;
            }),
            html`<div>Loading profile...</div>`
        );

        return html`
            <style>${styles}</style>
            <bread-crumb></bread-crumb>
            <div id="card">
                <h2>My Profile</h2>
                <div class="banner">
                <img id="profileImg" src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg" />
                ${bannerTemplate}
                </div>

                <div class="personal-info">
                ${personalInfoTemplate}
                <button @click=${() => window.location.hash = '/profile/edit'}>
                    <img src="${EditIcon}" alt="Edit Profile" width="16" height="16" />
                </button>
                </div>

                <div class="lists">
                    <h4>My Interests</h4>
                        <li style="list-style: none; display:flex; gap: 25px 5px; flex-wrap: wrap;">
                            <profile-tag text="Book"></profile-tag>
                            <profile-tag text="Series"></profile-tag>
                            <profile-tag text="Author"></profile-tag>
                            <profile-tag text="IP"></profile-tag>
                            <profile-tag text="Reading"></profile-tag>
                            <profile-tag text="Learning"></profile-tag>
                            <profile-tag text="Painting"></profile-tag>
                            <profile-tag text="Cooking"></profile-tag>
                        </li>
                    <h4>My Communities</h4>
                    <community-container>
                        ${myCommunities.map(c => this.renderCommunityCard(c))}
                    </community-container>
                    <h4>My Favorites</h4>
                    <community-container>
                        ${this.loading
                            ? html`<p>Loading...</p>`
                            : favoriteBooks.length
                                ? favoriteBooks.map(b => this.renderBookCard(b))
                                : html`<p style="color:#999; padding:8px 0;">No favorites yet — heart a book in the Libraries page!</p>`}
                    </community-container>
                </div>
            </div>
        `;
    }
};

export default ProfilePage;
