// This file defines and styles the Footer element

import { html, css, LitElement} from "lit";

const BUILD_TIME = import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString();
const COMMIT_HASH = import.meta.env.VITE_COMMIT ?? 'unknown';

class AppFooter extends LitElement {
    static get tag() {
        return "app-footer";
    }

    static get properties() {
        return {
            appLogoUrlInverted: {type: String, reflect: true},
            appUpdateDate: {type: Date, reflect: true},
            appContactUrl: {type: String, reflect: true},
        };
    }
    constructor() {
        super();
        this.appLogoUrlInverted = "#";
        this.appUpdateDate = BUILD_TIME,
        this.appContactUrl = "#"
    }

    static get styles() {
        return css`
            :host {
                display: block;
                width: 100%;
            }
            #container {
                display: flex;
                background-color: grey;
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
        `;
    }
    
    render() {
        const updated = new Date(this.appUpdateDate).toLocaleString();
        return html`
            <footer id="container">
                <div id="left">
                    <img src="${this.appLogoUrlInverted}">
                    <p>${updated}</p>
                    <p>Litera</p>
                </div>
                <div id="right">
                    <a href="${this.appContactUrl}">contact</a>
                </div>
            </footer>
        `;
    }
}

//declare as a callable html element
customElements.define(AppFooter.tag, AppFooter);