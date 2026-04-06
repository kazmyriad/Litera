import { LitElement, css, html } from "lit";

class LoginButton extends LitElement {
    static get tag() {
        return "login-button";
    }
    static get properties() {
        return {
            mode: {type: String}
        }
    }

    constructor() {
        super();
        this.mode = "start";
    }

    static get styles() {
        return css`
        button {
            padding: 12px 24px;
            border-radius: 40px;
            background-color: var(--color-4);
            color: white;
            width: 15em;
            height: 3em;
            border: none;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            transition: 0.3s ease;
        }
        button:hover {
            background-color: var(--color-2);
            font-size: 1em;
            transition: 0.3s ease-in-out
        }
        .login {
            background-color: var(--color-5);
            transition: 0.3s ease;
        }
        .login:hover{
           background-color: var(--color-1);
           font-size: 1em;
           transition: 0.3s ease-in-out;
        }
        `;
    }

    openOverlay = () => {
        console.log("login button clicked");
        this.dispatchEvent(new CustomEvent("open-auth", {
            bubbles: true,
            composed: true,
            detail: {
                mode: this.mode
            }
        }));
    }

    render() {
        return html`
        <button @click=${this.openOverlay} class="${this.mode === "login" ? "login" : "start"}">
            ${this.mode === "login" ? "Login" : "Start Your Story"}
        </button>
        `;
    }
}

customElements.define(LoginButton.tag, LoginButton);