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
                background-color: var(--color-5);
                color: var(--color-text-light);
                align-items: center;
                margin-inline: auto;
                justify-content: space-between;
                padding: 48px 48px;
                box-sizing: border-box;
            }
            #top {
                display: flex;
                gap: 24px;
                justify-self: center;
            }
            a {
                color: #999;
                text-decoration: none;
            }
        `;
    }
    
    render() {
        const updated = new Date(this.appUpdateDate).toLocaleDateString();
        return html`
            <footer id="container">
                <div id="top">
                    <p>Copywright © ${updated}</p>
                    <p>Litera</p>
                </div>
            </footer>
        `;
    }
}

//declare as a callable html element
customElements.define(AppFooter.tag, AppFooter);