// This file handles page navigation and connects slugs to ts pages
import {html, LitElement, type TemplateResult} from "lit";
import { customElement, state } from "lit/decorators.js";
import HomePage from "./pages/Home.js";
import CommunitiesPage from "./pages/Communities.js";
import LibrariesPage from "./pages/Libraries.js";
import ProfilePage from "./pages/Profile.js";
import LoginPage from "./pages/Login.js";
import ProfileEditPage from "./pages/ProfileEdit.js";
import CommunityCreationPage from "./pages/CommunityCreation.js";
import './pages/CommunityDetail.js';
import './components/NavBar.jsx';
import './components/AuthOverlay.js';
import { isLoggedIn } from './Services.js';
import { restoreAuth } from './Services.js'; 


@customElement('app-root')
export class App extends LitElement {
    @state() private currentPath: string = this.getPathFromHash();

    connectedCallback(): void {
        super.connectedCallback();
        restoreAuth();
        window.addEventListener('hashchange', this.handleHashChange);

    }

    disconnectedCallback(): void {
        window.removeEventListener('hashchange', this.handleHashChange);
        super.disconnectedCallback();
    }

    private getPathFromHash(): string {
        const fullHash = window.location.hash.slice(1) || '/';
        return fullHash.split('#')[0];
    }

    private handleHashChange = (): void => {
        this.currentPath = this.getPathFromHash();
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }

    private navigate = (path: string): void => {
        if (!path.startsWith('/')) path = '/' + path;
        if (window.location.hash !== `#${path}`) {
            window.location.hash = path;
        } else {
            this.currentPath = this.getPathFromHash();
        }
    };

    private openAuth = (e: CustomEvent) => {
        console.log("auth opened");
        const overlay = this.renderRoot.querySelector(
        "auth-overlay"
        ) as HTMLElement & { open: boolean, mode: string };
        overlay.mode = e.detail.mode;
        overlay.open = true;
        
    };

    private renderPage() {
        //routing switch statement by removing hash
        const basePath = this.currentPath.split('#')[0] || '/';
        if (
            (basePath.startsWith('/profile')) && !isLoggedIn()
        ) {
            const overlay = this.renderRoot.querySelector('auth-overlay') as any;
            if (overlay) {
                overlay.mode = 'login';
                overlay.open = true;
            }
            return HomePage({ currentPath: this.currentPath });
        }
        switch (true) {
            case basePath === '/':
                return HomePage({currentPath: this.currentPath});
            case basePath.startsWith('/create-community'):
                return CommunityCreationPage({currentPath: this.currentPath});
            case basePath.startsWith('/community-detail'): {
                const communityId = Number(basePath.split('/community-detail/')[1]) || 0;
                return html`<community-detail-page .communityId=${communityId}></community-detail-page>`;
            }
            case basePath.startsWith('/communities'):
                return html`<communities-page></communities-page>`;
            case basePath.startsWith('/libraries'):
                return html`<libraries-page></libraries-page>`;
            case basePath.startsWith('/login'):
                return LoginPage({currentPath: this.currentPath});
            case basePath.startsWith('/profile/edit'):
                return ProfileEditPage({currentPath: this.currentPath});
            case basePath.startsWith('/profile'):
                return html`<profile-page></profile-page>`;
            case basePath.startsWith('/user/'): {
                const userId = Number(basePath.split('/user/')[1]) || 0;
                return html`<profile-page .viewUserId=${userId}></profile-page>`;
            }
            default: 
                return HomePage({currentPath: this.currentPath});
        }
    };
    
    render(): TemplateResult {
        return html`

            <div class="container" @open-auth=${this.openAuth}>
                <nav-bar .currentPath=${this.currentPath} .onNavigate=${this.navigate}></nav-bar>
                <main class="content">
                    ${this.renderPage()}
                </main>
                <app-footer></app-footer>
            </div>
            <auth-overlay></auth-overlay>
            
        `;
    }
    
}

//library management OOP implementation: Observer
import React, { useEffect, useMemo, useState } from "react";
import { LibraryManager, Book } from "./Services.js";

const LibraryApp = () => {
  const libraryManager = useMemo(() => new LibraryManager(), []);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    const updateBooks = (updatedBooks: Book[]) => setBooks([...updatedBooks]);
    libraryManager.subscribe(updateBooks);

    return () => {
      libraryManager.unsubscribe(updateBooks);
    };
  }, [libraryManager]);

  return (
    <div>
        <h1>My Library</h1>

        <button
        onClick={() =>
            libraryManager.addBook({
            id: Date.now(),
            title: "Test Book",
            favorite: false,
            tags: []
            })
        }
        >
        Add Book
        </button>

        {books.length === 0 ? (
        <p>No books in library yet.</p>
        ) : (
        <ul>
            {books.map((book) => (
            <li key={book.id}>
                <span>
                {book.title} {book.favorite ? "★" : ""}
                </span>

                <button onClick={() => libraryManager.favoriteBook(book.id)}>
                {book.favorite ? "Unfavorite" : "Favorite"}
                </button>

                <button onClick={() => libraryManager.removeBook(book.id)}>
                Remove
                </button>
            </li>
            ))}
        </ul>
        )}
    </div>
    );
};

export default LibraryApp;