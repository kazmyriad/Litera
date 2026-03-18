// This file defines and styles the NavBar element
import { html, css, LitElement } from "lit";

class TitleHero extends LitElement {

    static get tag() {
        return "title-hero";
    }

    static get properties() {
        return {
            //
        };
    }

    constructor() {
        super();
        //
    }

    static get styles() {
        return css`
            :host {
                display: block;
                width: 100%;
                color: white;
                background-image: linear-gradient(
                    rgba(0, 0, 0, 0.8),
                    rgba(0, 0, 0, 0.2)
                ),
                url('https://images.pexels.com/photos/3747505/pexels-photo-3747505.jpeg');
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
        `;
    }

    render() {
        return html `
        <h1>Welcome to Litera</h1>
        `
    }
}

//declare as a callable html element
customElements.define(TitleHero.tag, TitleHero);