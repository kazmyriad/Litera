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
        };
    }
    constructor() {
        super();
        this.appName = "";
        this.appLogoUrl = "#";
    }

    static get styles() {
        return css`
        :host {
            display: block;
            width: 100%;
        }
            * {
                background-color: grey;
                align-items: center;
                gap: 60px;
            }
            #container {
                display: flex;
                justify-content: space-between;
                padding: 12px 24px 12px 24px;
                width: 100%;
            }
            #left {
                display: flex;
            }
        `;
    }
    
    render() {
        return html`
            <div id="container">
                <div id="left">
                    <img src="${this.appLogoUrl}">
                    <h2>${this.appName}</h2>
                </div>
                <div id="rights">
                    <a>home</a>
                    <a>communities</a>
                    <a>library</a>
                    <a>profile</a>
                </div>
            </div>
        `;
    }
}

//declare as a callable html element
customElements.define(NavBar.tag, NavBar);
``