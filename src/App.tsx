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
import './components/NavBar.js';
import './components/AuthOverlay.js';


@customElement('app-root')
export class App extends LitElement {
    @state() private currentPath: string = this.getPathFromHash();

    connectedCallback(): void {
        super.connectedCallback();
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
        const overlay = this.renderRoot.querySelector(
        "auth-overlay"
        ) as HTMLElement & { open: boolean, mode: string };
        overlay.mode = e.detail.mode;
        overlay.open = true;
        
    };

    private renderPage(): TemplateResult {
        //routing switch statement by removing hash
        const basePath = this.currentPath.split('#')[0] || '/';
        switch (true) {
            case basePath === '/':
                return HomePage({currentPath: this.currentPath});
            case basePath.startsWith('/create-community'):
                return CommunityCreationPage({currentPath: this.currentPath});
            case basePath.startsWith('/communities'):
                return CommunitiesPage({currentPath: this.currentPath});
            case basePath.startsWith('/libraries'):
                return LibrariesPage({currentPath: this.currentPath});
            case basePath.startsWith('/login'):
                return LoginPage({currentPath: this.currentPath});
            case basePath.startsWith('/profile/edit'):
                return ProfileEditPage({currentPath: this.currentPath});
            case basePath.startsWith('/profile'):
                return ProfilePage({currentPath: this.currentPath});
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
                
            </div>
            <auth-overlay></auth-overlay>
            <app-footer></app-footer>
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