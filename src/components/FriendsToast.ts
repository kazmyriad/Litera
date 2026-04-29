import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { searchUsers, removeFriend, sendFriendRequest, type FriendUser, type UserSearchResult } from '../Services.js';

const DEFAULT_AVATAR = 'https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg';

@customElement('friends-toast')
export class FriendsToast extends LitElement {
    @property({ type: Array }) friends: FriendUser[] = [];
    @property({ type: Number }) currentUserId = 0;
    @property({ type: Boolean, reflect: true }) open = false;

    @state() private query = '';
    @state() private searchResults: UserSearchResult[] = [];
    @state() private searching = false;
    @state() private confirmUnfriendId: number | null = null;
    @state() private removingId: number | null = null;
    @state() private addingId: number | null = null;
    @state() private addedIds: Set<number> = new Set();

    private _searchTimer: ReturnType<typeof setTimeout> | null = null;

    static styles = css`
        :host { display: none; }
        :host([open]) { display: block; }

        .backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.3);
            z-index: 500;
        }

        .panel {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: min(360px, 90vw);
            background: white;
            z-index: 501;
            display: flex;
            flex-direction: column;
            box-shadow: -4px 0 24px rgba(0,0,0,0.18);
            animation: slide-in 0.22s ease-out;
        }

        @keyframes slide-in {
            from { transform: translateX(100%); }
            to   { transform: translateX(0); }
        }

        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 20px 14px;
            border-bottom: 1px solid #eee;
            flex-shrink: 0;
        }

        .panel-header h3 {
            margin: 0;
            font-size: 1.1rem;
            color: var(--color-5, #414833);
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 1.1rem;
            cursor: pointer;
            color: #999;
            padding: 4px 8px;
            border-radius: 4px;
            line-height: 1;
        }
        .close-btn:hover { background: #f0f0f0; color: #333; }

        .search-wrap {
            padding: 12px 16px;
            border-bottom: 1px solid #eee;
            flex-shrink: 0;
        }

        .search-input {
            width: 100%;
            padding: 8px 14px;
            border: 1px solid #ccc;
            border-radius: 20px;
            font-size: 0.9rem;
            box-sizing: border-box;
            outline: none;
            background: #f7f7f5;
        }
        .search-input:focus { border-color: var(--color-4, #646d4a); background: white; }

        .panel-body {
            flex: 1;
            overflow-y: auto;
        }

        .section-label {
            font-size: 0.72rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: #aaa;
            padding: 14px 16px 4px;
        }

        .user-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 16px;
            cursor: pointer;
            transition: background 0.1s;
        }
        .user-row:hover { background: #f7f7f5; }

        .avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
        }

        .username {
            flex: 1;
            font-weight: 600;
            font-size: 0.88rem;
            color: #222;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .tag {
            font-size: 0.72rem;
            color: #aaa;
            flex-shrink: 0;
        }

        .tag--friend { color: var(--color-4, #646d4a); }

        .add-btn, .remove-btn {
            background: none;
            border: none;
            font-size: 0.95rem;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 4px;
            line-height: 1;
            flex-shrink: 0;
        }

        .add-btn {
            color: #ccc;
        }
        .add-btn:hover { color: #646d4a; background: rgba(100,109,74,0.08); }
        .add-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .remove-btn {
            color: #ccc;
        }
        .remove-btn:hover { color: #7b5494; background: rgba(123,84,148,0.08); }

        .confirm-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px 10px 62px;
            background: #fdf8ff;
        }
        .confirm-row span {
            flex: 1;
            font-size: 0.8rem;
            color: #666;
        }
        .confirm-yes {
            background: transparent;
            border: 1.5px solid #7b5494;
            color: #7b5494;
            border-radius: 6px;
            font-size: 0.78rem;
            padding: 3px 10px;
            cursor: pointer;
        }
        .confirm-yes:hover { background: rgba(123,84,148,0.1); }
        .confirm-no {
            background: transparent;
            border: 1.5px solid #ccc;
            color: #777;
            border-radius: 6px;
            font-size: 0.78rem;
            padding: 3px 10px;
            cursor: pointer;
        }
        .confirm-no:hover { background: #f0f0f0; }

        .empty-msg {
            padding: 28px 16px;
            color: #bbb;
            font-size: 0.88rem;
            text-align: center;
            line-height: 1.6;
        }
    `;

    private onQueryInput(e: Event) {
        this.query = (e.target as HTMLInputElement).value;
        if (this._searchTimer) clearTimeout(this._searchTimer);
        if (!this.query.trim()) { this.searchResults = []; return; }
        this._searchTimer = setTimeout(() => this.runSearch(), 300);
    }

    private async runSearch() {
        if (!this.query.trim()) return;
        this.searching = true;
        try {
            this.searchResults = await searchUsers(this.query, this.currentUserId);
        } catch {
            this.searchResults = [];
        }
        this.searching = false;
    }

    private goToProfile(userId: number) {
        this.open = false;
        window.location.hash = `/user/${userId}`;
    }

    private async doAddFriend(userId: number) {
        this.addingId = userId;
        try {
            await sendFriendRequest(userId);
            this.addedIds = new Set([...this.addedIds, userId]);
            this.dispatchEvent(new CustomEvent('friend-added', {
                detail: { userId }, bubbles: true, composed: true,
            }));
        } catch (e) {
            console.error('Failed to add friend', e);
        }
        this.addingId = null;
    }

    private async doUnfriend(friendId: number) {
        this.removingId = friendId;
        try {
            await removeFriend(friendId);
            this.friends = this.friends.filter(f => f.id !== friendId);
            this.confirmUnfriendId = null;
            this.dispatchEvent(new CustomEvent('friend-removed', {
                detail: { friendId }, bubbles: true, composed: true,
            }));
        } catch (e) {
            console.error('Failed to unfriend', e);
        }
        this.removingId = null;
    }

    render() {
        const friendIds = new Set(this.friends.map(f => f.id));
        const results = this.searchResults.filter(u => u.id !== this.currentUserId);
        const showSearch = !!this.query.trim();

        return html`
            <div class="backdrop" @click=${() => this.open = false}></div>
            <div class="panel">
                <div class="panel-header">
                    <h3>${this.friends.length} Friend${this.friends.length !== 1 ? 's' : ''}</h3>
                    <button class="close-btn" @click=${() => this.open = false}>✕</button>
                </div>

                <div class="search-wrap">
                    <input
                        class="search-input"
                        type="text"
                        placeholder="Search for users…"
                        .value=${this.query}
                        @input=${this.onQueryInput}
                    />
                </div>

                <div class="panel-body">
                    ${showSearch ? html`
                        <div class="section-label">Results</div>
                        ${this.searching
                            ? html`<p class="empty-msg">Searching…</p>`
                            : results.length === 0
                                ? html`<p class="empty-msg">No users found.</p>`
                                : results.map(u => html`
                                    <div class="user-row">
                                        <img class="avatar" src="${u.avatarUrl || DEFAULT_AVATAR}" alt="${u.username}" style="cursor: pointer;" @click=${() => this.goToProfile(u.id)} />
                                        <span class="username" style="cursor: pointer;" @click=${() => this.goToProfile(u.id)}>@${u.username}</span>
                                        ${friendIds.has(u.id)
                                            ? html`<span class="tag">Friends</span>`
                                            : this.addedIds.has(u.id)
                                                ? html`<span class="tag">Request sent</span>`
                                                : html`<button class="add-btn" title="Add friend" ?disabled=${this.addingId === u.id} @click=${() => this.doAddFriend(u.id)}>+ Add</button>`}
                                    </div>
                                `)
                        }
                    ` : html`
                        <div class="section-label">Friends</div>
                        ${this.friends.length === 0
                            ? html`<p class="empty-msg">No friends yet.<br>Search above to find people.</p>`
                            : this.friends.map(f => html`
                                <div class="user-row" @click=${() => this.goToProfile(f.id)}>
                                    <img class="avatar" src="${f.avatarUrl || DEFAULT_AVATAR}" alt="${f.username}" />
                                    <span class="username">@${f.username}</span>
                                    <button class="remove-btn" title="Unfriend"
                                        @click=${(e: Event) => {
                                            e.stopPropagation();
                                            this.confirmUnfriendId = this.confirmUnfriendId === f.id ? null : f.id;
                                        }}>✕</button>
                                </div>
                                ${this.confirmUnfriendId === f.id ? html`
                                    <div class="confirm-row">
                                        <span>Remove @${f.username}?</span>
                                        <button class="confirm-no" @click=${() => this.confirmUnfriendId = null}>Cancel</button>
                                        <button class="confirm-yes"
                                            ?disabled=${this.removingId === f.id}
                                            @click=${() => this.doUnfriend(f.id)}>
                                            ${this.removingId === f.id ? '…' : 'Unfriend'}
                                        </button>
                                    </div>
                                ` : ''}
                            `)
                        }
                    `}
                </div>
            </div>
        `;
    }
}
