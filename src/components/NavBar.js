// This file defines and styles the NavBar element
import { html, css, LitElement } from "lit";

const NAV_LINKS = [
    {name: 'home', path: '/'},
    {name: 'communities', path: '/communities'},
    {name: 'libraries', path: '/libraries'},
    {name: 'profile', path: '/profile'},
];


class NavBar extends LitElement {

    static get tag() {
        return "nav-bar";
    }

    static get properties() {
        return {
            currentPath: { type: String },
            onNavigate: { attribute: false},
            user: { attribute: false}
        };
    }

    constructor() {
        super();
        this.currentPath = "/";
        this.onNavigate = (path) => {
            window.location.hash = path;
        };
        this.user = null;
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
            }
            #left {
                display: flex;
                justify-content: space-between;
            }
            #right{
                display: flex;
                justify-content: flex-end;
                width: 40%;

            }
            #navLink{
                background-color: var(--color-3);
                padding: 1em;
                margin-right: 1em;
                border-radius: 50px;
            }
            #navLink:hover{
                background-color: var(--color-5);
                color: var(--color-text-light);
                transition: 0.3s ease;
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

    render() {
        return html `
            <nav id="container">
                <div id="left">
                    <img src="https://ik.imagekit.io/kjonesLitera/Disco.png?updatedAt=1771898369768">
                    <h2>Litera</h2>
                </div>
                <div id="right">
                    ${NAV_LINKS.map(
                        (link) =>
                        html`
                            <button
                                class=${this._isActive(link.path) ? 'active' : ''}
                                @click=${() => this._go(link.path)}
                                aria-current=${this._isActive(link.path) ? 'page' : 'false'}
                            >
                                ${link.name}
                            </button>
                        `
                    )}
                </div>
            </nav>
        `
    }
}

//declare as a callable html element
customElements.define(NavBar.tag, NavBar);