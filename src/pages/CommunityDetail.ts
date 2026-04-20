//this is where we would write the frontend for communities
// ---- would also need to use sql-related variables to load in communities (likely through a map)
import { html, css, type TemplateResult } from "lit";
import '../components/SearchBar.jsx';
import '../components/CommunityCard.jsx';
import '../components/CommunityContainer.jsx';
import '../components/JoinButton.jsx';

interface ComProps {
    currentPath?: string;
}

export const CommunityDetailPage = ({
  currentPath = "/community-detail",
}: ComProps): TemplateResult => {
  const styles = css`
    :host {
      display: block;
      min-height: 100vh;
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

    .community-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 8px;
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

  return html`
    <style>${styles}</style>

    <main class="page">
      <section class="hero">
        <img
          src="https://www.baltimoremagazine.com/wp-content/uploads/2026/02/wuthering-heights-header-1-1200x675.jpg"
          alt="Movie Adaptations community banner"
        />
      </section>

      <section class="content">
        <div class="top-grid">
          <div>
            <h1 class="community-title">Movie Adaptations</h1>
            <div class="member-count">2.4k members</div>

            <div class="subheading">Currently Reading:</div>
            <div class="current-book">
              <img
                src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1631088473i/6185.jpg"
                alt="Wuthering Heights cover"
              />
              <div class="current-book-info">
                <div class="current-book-title">Wuthering Heights</div>
                <div class="current-book-author">by Emily Bronte</div>
              </div>
            </div>
          </div>

          <div>
            <div class="moderators-title">Moderated by:</div>
            <div class="moderators">
              <div class="moderator">
                <div class="avatar"></div>
                <span>Kelley</span>
              </div>
              <div class="moderator">
                <div class="avatar"></div>
                <span>Mark</span>
              </div>
            </div>

            <div class="subheading">Previous Reads:</div>
            <div class="previous-reads">
              <div class="book-thumb">
                <img
                  src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1660273739i/84.jpg"
                  alt="Frankenstein cover"
                />
                <span>Frankenstein</span>
              </div>
              <div class="book-thumb">
                <img
                  src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320399351i/1885.jpg"
                  alt="Pride and Prejudice cover"
                />
                <span>Pride & Prejudice</span>
              </div>
              <div class="book-thumb">
                <img
                  src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1447303603i/2767052.jpg"
                  alt="The Hunger Games cover"
                />
                <span>The Hunger Games</span>
              </div>
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
};

export default CommunityDetailPage;