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
                <div id="right">
                    <div id="navLink"><a class="${this._isActive('/')}" @click=${(e) => {
                        e.preventDefault(); this._onNavigate('/');}}>
                        home</a></div>
                    <div id="navLink"><a class="${this._isActive('/communities')}" @click=${(e) => {
                        e.preventDefault(); this._onNavigate('/communities');}}>
                        communities</a></div>
                    <div id="navLink"><a class="${this._isActive('/library')}" @click=${(e) => {
                        e.preventDefault(); this._onNavigate('/library');}}>
                        library</a></div>
                    <div id="navLink"><a class="${this._isActive('/profile')}" @click=${(e) => {
                        e.preventDefault(); this._onNavigate('/profile');}}>
                        profile</a></div>
                </div>
            </div>
        `;
    }
}

//declare as a callable html element
customElements.define(NavBar.tag, NavBar);