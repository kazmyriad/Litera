// This file defines and styles the NavBar element
import { html, css, LitElement } from "lit";
import './LoginButton.jsx';


class TitleHero extends LitElement {

    static get tag() {
        return "title-hero";
    }

    static get properties() {
        return {
            isAuthenticated: {type: Boolean, reflect: true},
            user: {type: String}
        };
    }

    constructor() {
        super();
        this.isAuthenticated = false;
        this.user = "";
    }

    static get styles() {
        return css`
            :host {
                display: block;
                color: white;
                background-image: linear-gradient(
                    rgba(115, 6, 77, 0.8),
                    rgba(67, 72, 51, 0.2)
                ),
                url('src/images/heroGradient.svg');
                background-size: cover;
                background-position: center;
                align-content: center;
                text-align: center;
                justify-content: center;
                padding: 12px 24px;
                min-height: 300px;
                //font-family: "K2D Mono";
            }
            img {
                max-width: 80px;
            }
            button {
                padding: 12px 24px;
                border-radius: 40px;
                background-color: var(--color-4);
                color: white;
                border: none;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
                cursor: pointer;
            }
            button:hover {
                background-color: var(--color-5);
                transition: 0.3s ease;
            }
        `;
    }

    render() {
        return html `
        ${this.isAuthenticated ? html`
            <h1>Welcome, ${this.user}</h1>
            <button @click=${()=> window.location.hash = "/communities"}>View My Communities</button>
        ` : html`
            <h1>Welcome to Litera</h1>
            <p>Join thousands of readers having personalized discussions and discovering new favorites</p>
            <div>
                <login-button mode="start"></login-button>
            </div>

            <p>Already have an account?</p>
            <login-button mode="login"></login-button>
            `
        }
        `
    }
}

//declare as a callable html element
customElements.define(TitleHero.tag, TitleHero);