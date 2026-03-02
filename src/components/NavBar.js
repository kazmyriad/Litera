// This file defines and styles the NavBar element

import { html, css, LitElement} from "lit";


class NavBar extends LitElement {
    static get tag() {
        return "nav-bar";
    }

    static get properties() {
        return {
            appName: {type: String, reflect: true},
            appLogoUrl: {type: String, reflect: true},
            activePath: {type: String},
        };
    }
    constructor() {
        super();
        this.appName = "";
        this.appLogoUrl = "#";
        this.activePath = "/";
    }

    static get styles() {
        return css`
            :host {
                display: block;
                width: 100%;
            }
            #container {
                display: flex;
                background-color: var(--color-1);
                align-items: center;
                gap: 24px;
                margin-inline: auto;
                justify-content: space-between;
                padding: 12px 24px;
                box-sizing: border-box;
            }
            #left {
                display: flex;
            }
            img {
                max-width: 80px;
            }
        `;
    }

    _onNavigate(path) {
        this.dispatchEvent(new CustomEvent('app:navigate', {
            detail: {path},
            bubbles: true,
            composed: true,
        }));
    }

    _isActive(path) {
        return this.activePath === path? 'active' : '';
    }
    
    render() {
        return html`
            <div id="container">
                <div id="left">
                    <img src="${this.appLogoUrl}">
                    <h2>${this.appName}</h2>
                </div>
                <div id="rights">
                    <a class="${this._isActive('/')}" @click=${(e) => {
                        e.preventDefault(); this._onNavigate('/');}}>
                        home</a>
                    <a class="${this._isActive('/communities')}" @click=${(e) => {
                        e.preventDefault(); this._onNavigate('/communities');}}>
                        communities</a>
                    <a class="${this._isActive('/library')}" @click=${(e) => {
                        e.preventDefault(); this._onNavigate('/library');}}>
                        library</a>
                    <a class="${this._isActive('/profile')}" @click=${(e) => {
                        e.preventDefault(); this._onNavigate('/profile');}}>
                        profile</a>
                </div>
            </div>
        `;
    }
}

//declare as a callable html element
customElements.define(NavBar.tag, NavBar);