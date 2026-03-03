// This file handles page navigation and connects slugs to ts pages
import {html, LitElement, type TemplateResult} from "lit";
import { customElement, state } from "lit/decorators.js";
import HomePage from "./pages/Home";
import CommunitiesPage from "./pages/Communities";
import LibrariesPage from "./pages/Libraries";
import ProfilePage from "./pages/Profile";
import './components/NavBar.js';

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

    private renderPage(): TemplateResult {
        //routing switch statement by removing hash
        const basePath = this.currentPath.split('#')[0] || '/';
        switch (true) {
            case basePath === '/':
                return HomePage({currentPath: this.currentPath});
            case basePath.startsWith('/communities'):
                return CommunitiesPage({currentPath: this.currentPath});
            case basePath.startsWith('/libraries'):
                return LibrariesPage({currentPath: this.currentPath});
            case basePath.startsWith('/profile'):
                return ProfilePage({currentPath: this.currentPath});
            default: 
                return HomePage({currentPath: this.currentPath});
        }
    };
    
    render(): TemplateResult {
        return html`
            <div class="container">
                <nav-bar .currentPath=${this.currentPath} .onNavigate=${this.navigate}></nav-bar>
                <main class="content">
                    ${this.renderPage()}
                </main>
                
            </div>
            <app-footer></app-footer>
        `;
    }
    
}