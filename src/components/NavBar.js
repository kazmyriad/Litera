// This file defines and styles the NavBar element
import { html, css, LitElement } from "lit";
import ProfileIcon from '../images/Profile.svg';
import BookCaseIcon from '../images/BookCase.svg';
import { getCurrentUser, isLoggedIn, logout } from '../Services';

const NAV_LINKS = [
    {name: 'home', path: '/'},
    {name: 'communities', path: '/communities'},
    {name: 'libraries', path: '/libraries'},
    {name: 'profile', path: '/profile'},
];

const SUB_TABS = {
    communities: [
        {name: 'create new community', path: '/create-community'}
        //add "my communities"
    ],
    profile: [
        {name: 'logout', action: 'logout'}
    ]
}

class NavBar extends LitElement {

    static get tag() {
        return "nav-bar";
    }

    static get properties() {
        return {
            currentPath: { type: String },
            onNavigate: { attribute: false},
            user: { attribute: false},
            hoveredTab: { type: String }
        };
    }

    constructor() {
        super();
        this.currentPath = "/";
        this.onNavigate = (path) => {
            window.location.hash = path;
        };
        this.user = getCurrentUser();
        this.hoveredTab = null;
    }

    connectedCallback() {
        super.connectedCallback();

        this._onAuthChanged = (e) => {
            this.user = e.detail.user;
            this.requestUpdate();
        }
        window.addEventListener('auth-changed', this._onAuthChanged);
    }

    disconnectedCallback() {
        window.removeEventListener('auth-changed', this._onAuthChanged);
        super.disconnectedCallback();
    }

    handleSubAction(action) {
        if (action === 'logout') {
            logout();
            this.user = null;
            window.location.hash = '/';
        }
    }

    _goProfile() {
        if (!isLoggedIn()) {
            this.dispatchEvent(new CustomEvent('open-auth', {
                bubbles: true,
                composed: true,
                detail: { mode: 'login' }
            }));
        } else {
            this._go('/profile');
        }
    }

    _base(path) {
        if (!path) return '/';
        return path.split('#')[0] || '/';
    }

    _isActive(path) {
        const current = this._base(this.currentPath);
        return path === '/' ? current === '/' : current.startsWith(path);
    }

    _go(path) {
        if (typeof this.onNavigate === 'function') {
            this.onNavigate(path);
        }

        this.dispatchEvent(
            new CustomEvent('navigate', {
                detail: { path },
                bubbles: true,
                composed: true,
            })
        );
    }

    static get styles() {
        return css`
            :host {
                display: block;
                width: 100%;
                color: white;
                //font-family: "K2D Mono";
            }
            nav#container {
                display: flex;
                background-color: var(--color-4);
                align-items: center;
                gap: 24px;
                margin-inline: auto;
                justify-content: space-between;
                padding: 12px 24px;
                box-sizing: border-box;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            #left {
                display: flex;
                gap: 16px;
                align-items: center;
                justify-content: space-between;
            }
            #right{
                display: flex;
                justify-content: flex-end;
                width: 40%;
                align-items: center;
            }
            button{
                background-color: transparent;
                border: none;
                padding: 1em;
                margin-right: 1em;
                color: white;
            }
            button:hover{
                color: var(--color-text-light);
                transition: 0.3s ease;
                cursor: pointer;
            }
            button.active {
                color: var(--color-text-light); 
                font-weight: bold;
            }

            .nav-item {
            position: relative;
            }

            .subtabs {
                position: absolute;
                top: 100%;
                left: 0;
                background: rgba(0, 0, 0, 0.85);
                padding: 8px 0;
                border-radius: 6px;
                min-width: 200px;
                z-index: 100;
                transition: 2s ease;
            }

            .subtabs button {
                display: block;
                width: 100%;
                padding: 8px 12px;
                background: none;
                border: none;
                color: white;
                text-align: left;
            }

            .subtabs button:hover {
                background-color: var(--color-1);
            }
            img {
                max-width: 80px;
            }
            img:hover{
                transform: rotate(360deg);
                transition: 5s ease;
            }
        `;
    }

    showSubTabs(tabName) {
        const subtabs = SUB_TABS[tabName];
        if (!subtabs) {
            return null;
        }

        return html`
            <div class="subtabs">
            ${subtabs.map(
                sub => html`
                <button @click=${() => sub.path ? this._go(sub.path)
                    : this.handleSubAction(sub.action)
                }>
                    ${sub.name}
                </button>
                `
            )}
            </div>
        `;

    }

    handleSubAction(action) {
        if (action === 'logout') {
            logout();

            this.user = null;
            window.location.hash = '/';
        }
    }

    render() {
        return html `
            <nav id="container">
                <div id="left">
                    <img src=${BookCaseIcon} alt="Bookcase Icon" style="width: 40px; height: 40px;">
                    <!--<img src="https://ik.imagekit.io/kjonesLitera/Disco.png?updatedAt=1771898369768">-->
                    <h2>Litera</h2>
                </div>
                <div id="right">
                    ${NAV_LINKS
                    .map(
                        link =>
                        html`
                        <div class="nav-item"
                            @mouseenter=${() => (this.hoveredTab = link.name)}
                            @mouseleave=${() => (this.hoveredTab = null)}
                        >
                            <button
                                class=${this._isActive(link.path) ? 'active' : ''}
                                @click=${() => {
                                    if (link.name === 'profile') {
                                        this._goProfile();
                                    } else {
                                        this._go(link.path);
                                    }
                                }}
                                aria-current=${this._isActive(link.path) ? 'page' : 'false'}
                            >
                                ${link.name === 'profile' && !this.user ? 'login' : link.name}
                            </button>

                            ${this.hoveredTab === link.name && 
                            (link.name !== 'profile' || this.user)
                                    ? this.showSubTabs(link.name)
                                    : null}

                        </div>
                            
                        `
                    )}
                    ${this.user ? html `<img src="${this.user.avatarUrl ?? ProfileIcon}" alt="User Avatar" style="width: 40px; height: 40px; border-radius: 50%;">`: null}
                </div>
            </nav>
        `
    }
}

//declare as a callable html element
customElements.define(NavBar.tag, NavBar);