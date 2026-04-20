import { html, css, LitElement } from "lit";

class ProfileTag extends LitElement {

    static get tag() {
        return "profile-tag"
    }

    // Things put in here, declare a default in the constructor
    static get properties() {
        return {
            text: { type : String }
        };
    }

    constructor() {
        super();
        this.text = "Default";
    }

    static get styles() {
        return css`
        p {
            color: #ece0d5;
            border-radius: 25px;
            background-color: #646d4a;
            padding: 5px 10px;
            display: inline;
            overflow: wrap;
        }
        `;
    }

    render() {
        return html`
        <p>${this.text}</p>
        `;
    }

    // connectedCallback() runs when the page is loaded

    // IMPORT IN THE .ts FILE!!!

    // js logic goes here...
}

customElements.define(ProfileTag.tag, ProfileTag);