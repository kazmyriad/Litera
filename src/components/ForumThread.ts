import { html, css, LitElement, type TemplateResult } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { fetchThreadPosts, createForumPost, getCurrentUser, type ForumPost } from '../Services.js';

@customElement('forum-thread')
export class ForumThreadElement extends LitElement {
  @property({ type: Number }) threadId = 0;
  @property({ type: String }) title = '';
  @property({ type: Number }) postCount = 0;

  @state() private open = false;
  @state() private posts: ForumPost[] = [];
  @state() private loaded = false;
  @state() private loadingPosts = false;
  @state() private newContent = '';
  @state() private submitting = false;

  static styles = css`
    :host { display: block; }

    .thread-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--cs-light, #ece0d5);
      color: var(--cs-text-dark, #2d2a26);
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      padding: 16px 20px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      user-select: none;
      transition: filter 120ms;
    }
    .thread-row:hover { filter: brightness(0.94); }

    .thread-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .post-count {
      font-size: 0.78rem;
      font-weight: 500;
      opacity: 0.6;
    }

    .chevron {
      font-size: 1.1rem;
      display: inline-block;
      transition: transform 200ms ease;
    }
    .chevron.open { transform: rotate(180deg); }

    .thread-body {
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .posts-list {
      padding: 4px 20px;
      max-height: 520px;
      overflow-y: auto;
    }

    .post {
      padding: 14px 0;
      border-bottom: 1px solid #eee;
    }
    .post:last-child { border-bottom: none; }

    .post-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .post-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      object-fit: cover;
      background: #d9d9d9;
      flex-shrink: 0;
    }

    .post-author {
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      text-decoration: none;
    }
    .post-author:hover {
      text-decoration: underline;
    }

    .post-time {
      font-size: 0.75rem;
      color: #999;
      margin-left: auto;
    }

    .post-content {
      font-size: 0.92rem;
      line-height: 1.55;
      color: #333;
      white-space: pre-wrap;
      word-break: break-word;
      padding-left: 40px;
    }

    .empty {
      padding: 20px;
      text-align: center;
      color: #999;
      font-style: italic;
      font-size: 0.88rem;
    }

    .compose {
      padding: 14px 20px;
      border-top: 1px solid #eee;
      background: #fff;
      display: flex;
      gap: 10px;
      align-items: flex-end;
    }

    .compose textarea {
      flex: 1;
      resize: none;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 10px 12px;
      font-family: inherit;
      font-size: 0.9rem;
      line-height: 1.4;
      min-height: 58px;
      max-height: 160px;
      box-sizing: border-box;
    }
    .compose textarea:focus {
      outline: none;
      border-color: var(--cs-mid, #646d4a);
    }

    .compose-btn {
      background: var(--cs-mid, #646d4a);
      color: var(--cs-text-light, #fbfff4);
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      font-family: inherit;
    }
    .compose-btn:hover:not(:disabled) { opacity: 0.85; }
    .compose-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .login-prompt {
      padding: 12px 20px;
      color: #999;
      font-style: italic;
      font-size: 0.85rem;
      border-top: 1px solid #eee;
      background: #fff;
    }
  `;

  private async toggle() {
    this.open = !this.open;
    if (this.open && !this.loaded) {
      this.loadingPosts = true;
      try {
        this.posts = await fetchThreadPosts(this.threadId);
        this.loaded = true;
      } catch (e) {
        console.error('Failed to load posts', e);
      } finally {
        this.loadingPosts = false;
      }
    }
  }

  private async handleSubmit() {
    if (!this.newContent.trim() || this.submitting) return;
    this.submitting = true;
    try {
      const post = await createForumPost(this.threadId, this.newContent.trim());
      this.posts = [...this.posts, post];
      this.postCount += 1;
      this.newContent = '';
    } catch (e) {
      console.error('Failed to post', e);
    } finally {
      this.submitting = false;
    }
  }

  private renderPost(p: ForumPost): TemplateResult {
    const date = new Date(p.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    return html`
      <div class="post">
        <div class="post-header">
          ${p.avatar_url
            ? html`<img class="post-avatar" src="${p.avatar_url}" alt="${p.username}" style="cursor:pointer"
                @click=${() => { window.location.hash = `/user/${p.user_id}`; }} />`
            : html`<div class="post-avatar"></div>`}
          <span class="post-author" @click=${() => { window.location.hash = `/user/${p.user_id}`; }}>@${p.username}</span>
          <span class="post-time">${date}</span>
        </div>
        <div class="post-content">${p.content}</div>
      </div>
    `;
  }

  render(): TemplateResult {
    const user = getCurrentUser();
    return html`
      <div class="thread-row" @click=${this.toggle.bind(this)}>
        <div class="thread-meta">
          <span>${this.title}</span>
          <span class="post-count">${this.postCount} post${this.postCount !== 1 ? 's' : ''}</span>
        </div>
        <span class="chevron ${this.open ? 'open' : ''}">˅</span>
      </div>

      ${this.open ? html`
        <div class="thread-body">
          <div class="posts-list">
            ${this.loadingPosts
              ? html`<div class="empty">Loading…</div>`
              : this.posts.length
                ? this.posts.map(p => this.renderPost(p))
                : html`<div class="empty">No replies yet — be the first!</div>`}
          </div>
          ${user ? html`
            <div class="compose">
              <textarea
                placeholder="Write a reply… (Ctrl+Enter to post)"
                .value=${this.newContent}
                @input=${(e: Event) => { this.newContent = (e.target as HTMLTextAreaElement).value; }}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) this.handleSubmit();
                }}
              ></textarea>
              <button
                class="compose-btn"
                ?disabled=${!this.newContent.trim() || this.submitting}
                @click=${this.handleSubmit.bind(this)}
              >${this.submitting ? 'Posting…' : 'Post'}</button>
            </div>
          ` : html`
            <p class="login-prompt">Log in to reply.</p>
          `}
        </div>
      ` : null}
    `;
  }
}

export default ForumThreadElement;
