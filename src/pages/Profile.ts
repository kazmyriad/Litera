//this is where we would write the frontend for profile
// ---- also where we would likely require having logged in + fetched specific user data
import { html, css, type TemplateResult, LitElement } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import '../components/CommunityCard.jsx';
import '../components/CommunityContainer.jsx';
import '../components/BookCard.jsx';
import '../components/Breadcrumb.jsx';
import '../components/ProfileTag.jsx';
import EditIcon from '../images/Edit.svg';
import {
    getCurrentUser, fetchUserById, fetchCommunities, fetchBooks,
    fetchFavorites, addFavorite, removeFavorite,
    getFriendshipStatus, sendFriendRequest, respondToFriendRequest, removeFriend,
    getPendingFriendRequests, getFriends,
    type Community, type BookRecord, type FriendshipStatus, type PendingFriendRequest, type FriendUser,
} from "../Services";

@customElement('profile-page')
export class ProfilePage extends LitElement {
    @property({ type: Number }) viewUserId?: number;

    @state() private communities: Community[] = [];
    @state() private books: BookRecord[] = [];
    @state() private favoriteIds: Set<number> = new Set();
    @state() private loading = true;
    @state() private userData: any = null;
    @state() private friendStatus: FriendshipStatus = 'none';
    @state() private friendRequestId: number | null = null;
    @state() private friendActionLoading = false;
    @state() private pendingRequests: PendingFriendRequest[] = [];
    @state() private showUnfriendConfirm = false;
    @state() private friends: FriendUser[] = [];
    @state() private friendsCount: number = 0;

    connectedCallback(): void {
        super.connectedCallback();
        this.loadData();
        this.addEventListener('favorite-toggle', this.handleFavoriteToggle as unknown as EventListener);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.removeEventListener('favorite-toggle', this.handleFavoriteToggle as unknown as EventListener);
    }

    updated(changed: Map<string, unknown>) {
        if (changed.has('viewUserId')) {
            this.userData = null;
            this.loadData();
        }
    }

    private get targetUserId(): number | null {
        if (this.viewUserId) return this.viewUserId;
        return getCurrentUser()?.id ?? null;
    }

    private get isOwnProfile(): boolean {
        const cur = getCurrentUser();
        if (!cur) return false;
        return !this.viewUserId || this.viewUserId === cur.id;
    }

    private async loadData() {
        const targetId = this.targetUserId;
        if (!targetId) { this.loading = false; return; }

        this.loading = true;
        try {
            const cur = getCurrentUser();
            const [userData, communities, books, favorites] = await Promise.all([
                fetchUserById(targetId),
                fetchCommunities(),
                this.isOwnProfile ? fetchBooks() : Promise.resolve([] as BookRecord[]),
                this.isOwnProfile && cur ? fetchFavorites(cur.id) : Promise.resolve([] as number[]),
            ]);
            this.userData = userData;
            this.communities = communities;
            this.books = books;
            this.favoriteIds = new Set(favorites);

            if (this.isOwnProfile && cur) {
                try {
                    this.pendingRequests = await getPendingFriendRequests(cur.id);
                    this.friends = await getFriends(cur.id);
                    this.friendsCount = this.friends.length;
                } catch (e) {
                    console.error('Failed to load pending friend requests or friends', e);
                }
            } else if (!this.isOwnProfile && cur) {
                const info = await getFriendshipStatus(cur.id, targetId);
                this.friendStatus = info.status;
                this.friendRequestId = info.requestId ?? null;
            }
        } catch (e) {
            console.error('Failed to load profile data', e);
        } finally {
            this.loading = false;
        }
    }

    private async handleAddFriend() {
        const target = this.targetUserId;
        if (!target || this.friendActionLoading) return;
        this.friendActionLoading = true;
        try {
            const result = await sendFriendRequest(target);
            this.friendStatus = 'pending_sent';
            this.friendRequestId = result.id;
        } catch (e) {
            console.error('Failed to send friend request', e);
        } finally {
            this.friendActionLoading = false;
        }
    }

    private async handleRespondRequest(status: 'accepted' | 'declined') {
        if (!this.friendRequestId || this.friendActionLoading) return;
        this.friendActionLoading = true;
        try {
            await respondToFriendRequest(this.friendRequestId, status);
            this.friendStatus = status === 'accepted' ? 'accepted' : 'none';
            if (status === 'declined') this.friendRequestId = null;
        } catch (e) {
            console.error('Failed to respond to friend request', e);
        } finally {
            this.friendActionLoading = false;
        }
    }

    private async handleUnfriend() {
        const target = this.targetUserId;
        if (!target || this.friendActionLoading) return;
        this.friendActionLoading = true;
        try {
            await removeFriend(target);
            this.friendStatus = 'none';
            this.friendRequestId = null;
        } catch (e) {
            console.error('Failed to unfriend', e);
        } finally {
            this.friendActionLoading = false;
        }
    }

    private async handleRespondPending(requestId: number, status: 'accepted' | 'declined') {
        try {
            await respondToFriendRequest(requestId, status);
            this.pendingRequests = this.pendingRequests.filter(r => r.requestId !== requestId);
        } catch (e) {
            console.error('Failed to respond to friend request', e);
        }
    }

    private openFriendsToast() {
        const cur = getCurrentUser();
        if (!cur) return;
        const toast = document.querySelector('friends-toast') as any;
        if (toast) {
            toast.currentUserId = cur.id;
            toast.friends = this.friends;
            toast.open = true;
        }
    }

    private renderFriendButton() {
        const loading = this.friendActionLoading;
        switch (this.friendStatus) {
            case 'none':
                return html`<button class="friend-btn" ?disabled=${loading} @click=${this.handleAddFriend.bind(this)}>
                    ${loading ? 'Sending…' : '+ Add Friend'}
                </button>`;
            case 'pending_sent':
                return html`<button class="friend-btn friend-btn--pending" disabled>Request Sent</button>`;
            case 'pending_received':
                return html`
                    <button class="friend-btn friend-btn--accept" ?disabled=${loading} @click=${() => this.handleRespondRequest('accepted')}>
                        ${loading ? '…' : 'Accept'}
                    </button>
                    <button class="friend-btn friend-btn--decline" ?disabled=${loading} @click=${() => this.handleRespondRequest('declined')}>
                        ${loading ? '…' : 'Decline'}
                    </button>`;
            case 'accepted':
                return html`<button class="friend-btn friend-btn--friends" ?disabled=${loading} @click=${() => this.showUnfriendConfirm = true}>
                    ${loading ? '…' : '✓ Friends'}
                </button>`;
        }
    }

    private handleFavoriteToggle = async (e: Event) => {
        const { bookId, favorite } = (e as CustomEvent).detail;
        if (!bookId || !this.isOwnProfile) return;
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
        const cur = getCurrentUser();

        if (this.isOwnProfile && !cur) {
            return html`<p>Please log in to view your profile.</p>`;
        }

        if (this.loading) {
            return html`<p style="padding:48px;">Loading…</p>`;
        }

        const u = this.userData;
        if (!u) {
            return html`<p style="padding:48px;">User not found.</p>`;
        }

        const fullName = u.full_name ?? `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim();
        const avatarSrc = u.avatarUrl || u.avatar_url || 'https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg';
        const interests: string[] = Array.isArray(u.interests) ? u.interests : [];

        const visibleCommunities = this.communities.filter(c => c.ownerId === u.id);
        const favoriteBooks = this.books.filter(b => this.favoriteIds.has(b.id));

        const styles = css`
            :host{
                display: block;
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
                padding: 24px 48px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
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
                gap: 16px;
            }
            h4 {
                margin: 0;
            }
            img#profileImg {
                width: 100px;
                height: 100px;
                border-radius: 100%;
                object-fit: cover;
                flex-shrink: 0;
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
            .profile-names {
                display: flex;
                flex-direction: column;
                gap: 4px;
                justify-content: center;
            }
            .profile-names h4, .profile-names h5 {
                margin: 0;
            }
            .bio-text {
                margin: 8px 0 0;
                color: #555;
                font-size: 0.95rem;
                max-width: 480px;
                line-height: 1.5;
            }
            .friend-actions {
                display: flex;
                gap: 8px;
                align-items: center;
                margin-top: 12px;
            }
            .friend-btn {
                padding: 8px 18px;
                border-radius: 8px;
                border: none;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                background: var(--color-5, #414833);
                color: white;
            }
            .friend-btn:disabled { opacity: 0.55; cursor: default; }
            .friend-btn:not(:disabled):hover { opacity: 0.8; }
            .friend-btn--pending { background: #888; }
            .friend-btn--accept { background: #a9bb72; color: #2d2a26; }
            .friend-btn--decline { background: transparent; color: #7b5494; border: 1.5px solid #7b5494; }
            .friend-btn--decline:not(:disabled):hover { background: rgba(123,84,148,0.08); }
            .friend-btn--friends { background: white; color: var(--color-5, #414833); border: 1.5px solid var(--color-5, #414833); }
            .friend-btn--friends:not(:disabled):hover { background: transparent; border-color: #7b5494; color: #7b5494; }

            .confirm-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .confirm-dialog {
                background: white;
                border-radius: 12px;
                padding: 28px 32px;
                max-width: 300px;
                width: 90%;
                text-align: center;
                box-shadow: 0 8px 24px rgba(0,0,0,0.18);
            }
            .confirm-dialog p {
                margin: 0 0 20px;
                font-size: 1rem;
                color: #333;
            }
            .confirm-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
            }

            .pending-requests {
                background: white;
                border-radius: 8px;
                padding: 20px 48px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
                margin-bottom: 16px;
            }
            .pending-requests h4 {
                margin: 0 0 12px;
            }
            .pending-request-row {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
            }
            .pending-request-row:last-child { border-bottom: none; }
            .pending-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                flex-shrink: 0;
            }
            .pending-username {
                flex: 1;
                font-weight: 600;
                font-size: 0.95rem;
            }
            .pending-actions {
                display: flex;
                gap: 8px;
            }
        `;

        return html`
            <style>${styles}</style>
            ${this.showUnfriendConfirm ? html`
                <div class="confirm-overlay" @click=${(e: Event) => { if (e.target === e.currentTarget) this.showUnfriendConfirm = false; }}>
                    <div class="confirm-dialog">
                        <p>Remove <strong>@${u.username}</strong> as a friend?</p>
                        <div class="confirm-actions">
                            <button class="friend-btn friend-btn--friends" @click=${() => this.showUnfriendConfirm = false}>Cancel</button>
                            <button class="friend-btn friend-btn--decline" @click=${() => { this.showUnfriendConfirm = false; this.handleUnfriend(); }}>Unfriend</button>
                        </div>
                    </div>
                </div>
            ` : ''}
            ${this.isOwnProfile ? html`<bread-crumb></bread-crumb>` : html`
                <button style="margin: 16px 24px; background: transparent; color: var(--color-5); border: none; font-size: 1rem; cursor: pointer; padding: 6px 0;"
                    @click=${() => history.back()}>&larr; Back</button>
            `}
            <div id="card">
                <h2>${this.isOwnProfile ? 'My Profile' : `@${u.username}'s Profile`}</h2>

                <div class="banner">
                    <img id="profileImg" src="${avatarSrc}" />
                    <div class="profile-names">
                        <h4>@${u.username ?? 'Unknown'}</h4>
                        <h5>${fullName || 'No name available'}</h5>
                        ${u.bio ? html`<p class="bio-text">${u.bio}</p>` : ''}
                        ${!this.isOwnProfile && cur ? html`
                            <div class="friend-actions">${this.renderFriendButton()}</div>
                        ` : ''}
                    </div>
                </div>

                ${this.isOwnProfile ? html`
                    <div style="padding: 20px 24px; border-bottom: 1px solid #eee; display: flex; gap: 20px;">
                        <button style="background: transparent; border: none; color: var(--color-4); cursor: pointer; font-weight: 600; padding: 0;" @click=${this.openFriendsToast.bind(this)}>
                            👥 ${this.friendsCount} friend${this.friendsCount !== 1 ? 's' : ''}
                        </button>
                    </div>
                ` : ''}

                ${this.isOwnProfile ? html`
                    <div class="personal-info">
                        <div class="info">
                            <div>
                                <p class="form-label">First Name</p>
                                <p>${u.firstname ?? ''}</p>
                            </div>
                            <div>
                                <p class="form-label">Last Name</p>
                                <p>${u.lastname ?? ''}</p>
                            </div>
                            <div>
                                <p class="form-label">DOB</p>
                                <p>${u.dob ? new Date(u.dob).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                                <p class="form-label">Email</p>
                                <p>${u.email ?? ''}</p>
                            </div>
                        </div>
                        <button @click=${() => window.location.hash = '/profile/edit'}>
                            <img src="${EditIcon}" alt="Edit Profile" width="16" height="16" />
                        </button>
                    </div>
                ` : ''}

                ${this.isOwnProfile && this.pendingRequests.length > 0 ? html`
                    <div class="pending-requests">
                        <h4>Friend Requests (${this.pendingRequests.length})</h4>
                        ${this.pendingRequests.map(r => html`
                            <div class="pending-request-row">
                                <img class="pending-avatar"
                                    src="${r.avatarUrl || 'https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg'}"
                                    alt="${r.username}" />
                                <span class="pending-username">@${r.username}</span>
                                <div class="pending-actions">
                                    <button class="friend-btn friend-btn--accept"
                                        @click=${() => this.handleRespondPending(r.requestId, 'accepted')}>
                                        Accept
                                    </button>
                                    <button class="friend-btn friend-btn--decline"
                                        @click=${() => this.handleRespondPending(r.requestId, 'declined')}>
                                        Decline
                                    </button>
                                </div>
                            </div>
                        `)}
                    </div>
                ` : ''}

                <div class="lists">
                    ${interests.length ? html`
                        <h4>${this.isOwnProfile ? 'My Interests' : 'Interests'}</h4>
                        <ul style="list-style:none; margin:0; padding:0; display:flex; gap:8px 6px; flex-wrap:wrap;">
                            ${interests.map(i => html`<li><profile-tag text="${i}"></profile-tag></li>`)}
                        </ul>
                    ` : ''}

                    <h4>${this.isOwnProfile ? 'My Communities' : 'Communities'}</h4>
                    <community-container>
                        ${visibleCommunities.length
                            ? visibleCommunities.map(c => this.renderCommunityCard(c))
                            : html`<p style="color:#999; padding:8px 0;">No communities yet.</p>`}
                    </community-container>

                    ${this.isOwnProfile ? html`
                        <h4>My Favorites</h4>
                        <community-container>
                            ${this.loading
                                ? html`<p>Loading...</p>`
                                : favoriteBooks.length
                                    ? favoriteBooks.map(b => this.renderBookCard(b))
                                    : html`<p style="color:#999; padding:8px 0;">No favorites yet — heart a book in the Libraries page!</p>`}
                        </community-container>
                    ` : ''}
                </div>
            </div>
        `;
    }
};

export default ProfilePage;
