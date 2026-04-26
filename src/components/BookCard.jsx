import { html, css, LitElement } from "lit";
import PointArrow from '../images/Arrow.svg';

class BookCard extends LitElement {
    static get tag() {
        return "book-card";
    }

    static get properties(){
        return{
            name: { type:String },
            title: { type:String },
            author: { type:String },
            thumbnail: { type:String }, // must be at LEAST 200 x 200
            description: { type:String },
            book: { type:String},
            favorite: { type: Boolean }
        }
    }

    constructor(){
        super();
        this.name="A Court of Thorns and Roses";
        this.title="A Court of Thorns and Roses";
        this.author="Sarah J. Maas";
        this.thumbnail="https://imgs.search.brave.com/XlnwOZNk_kpCoM56CZ9t8y-iNQIhq0KwmU7k3fd-SAM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9saDMu/Z29vZ2xldXNlcmNv/bnRlbnQuY29tL1FY/eXROSEZIRmdJSHJ5/QzdNaDBGYklnWUtI/TnJNT0RrdnpRVDBp/SVYzdXUwQzlVdDlM/TklNNWY1aWN3eFQ5/cU1Td1lJaVIySGFC/QjQ1UzFuVzVxRGF4/S2F5d0tqYjJUc0U0/TE1CbU8tbE1ydlhP/cTRhNk09dzE0NDAt/aDgxMC1uLW51";
        this.description="A description of the book.";
        this.book = null;
        this.favorite = false;
    }

    static get styles(){
         return css`
            :host {
                --color-1: #7f553a;
                --color-2: #a58a64;
                --color-3: #ece0d5;
                --color-4: #646d4a;
                --color-5: #414833;
                display: inline-block;
            }

            .book {
                width: 15em;
                height: 12.5em;
                background: #646d4a;
                border-radius: 20px 16px 12px 20px;
                background-image: linear-gradient(to right, #414833 48px, #646d4a 50px, transparent 50px);
                transition: ease-in .2s;
                position: relative;
                display: inline-block;
            }

            .book::after {
                content: "";
                position: absolute;
                height: 2em;
                width: 14.5em;
                bottom: 6px;
                right: 0px;
                background: white;
                border-radius: 32px 4px 4px 32px;
                box-shadow: inset 4px 6px 0px 0px #E4E0CE;
                background-image: linear-gradient(to bottom, transparent 6px, #E4E0CE 8px, transparent 8px, transparent 12px, #E4E0CE 12px, transparent 14px, transparent 18px,#E4E0CE 18px, transparent 20px, transparent 24px, #E4E0CE 24px, transparent 26px, transparent 30px, #E4E0CE 30px, transparent 32px, transparent 36px, #E4E0CE 36px, transparent 38px, transparent 42px, #E4E0CE 42px, transparent 44px, transparent 48px, #E4E0CE 48px, transparent 50px);
                transition: ease-in-out .3s;
            }

            h3 {
                margin: 0;
                padding: 0;
                margin-left: 3em;
                padding-top: 2em;
                height: 40%;
                vertical-align: middle;
                width: 7.5em;
                overflow: hidden;
                color: #ece0d5;
                font-weight: bold;
                font-size: 1.3em;
                transition: ease-in-out .2s;
            }

            /* ── controls row (top-right) ─────────────────────────── */
            .controls {
                position: absolute;
                top: 0.55em;
                right: 0.55em;
                display: flex;
                align-items: center;
                gap: 0.35em;
                opacity: 0.65;
                transition: opacity ease-in-out .2s;
            }

            .book:hover .controls {
                opacity: 1;
            }

            .controls img {
                width: 24px;
                height: 24px;
                display: block;
            }

            .fav-btn {
                background: transparent;
                border: none;
                padding: 0;
                cursor: pointer;
                display: flex;
                align-items: center;
                line-height: 0;
            }

            .fav-btn:hover svg path {
                stroke: #ece0d5;
                opacity: 1;
            }

            /* ── card hover expansions ────────────────────────────── */
            .book:hover {
                width: 17em;
                transition: ease-in-out .2s;
            }

            .book:hover h3 {
                width: 8em;
                transition: ease-in-out .2s;
                font-size: 1.4em;
                height: 50%;
            }

            .book:hover::after {
                width: 16.5em;
                transition: ease-in-out .2s;
            }
        `;
    }

    toggleFavorite() {
        this.favorite = !this.favorite;
        this.dispatchEvent(new CustomEvent('favorite-toggle', {
            bubbles: true,
            composed: true,
            detail: { title: this.title || this.name, favorite: this.favorite }
        }));
    }

    render(){
        const heartIcon = this.favorite
            ? html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
                          fill="#ece0d5"/>
                </svg>`
            : html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
                          fill="none" stroke="#ece0d5" stroke-width="1.5"/>
                </svg>`;

        return html`
            <div class="book">
                <h3 class="title">${this.title || this.name || "Book Title"}</h3>
                <div class="controls">
                    <button class="fav-btn" @click=${() => this.toggleFavorite()}>
                        ${heartIcon}
                    </button>
                    <img src="${PointArrow}" alt="Info">
                </div>
            </div>
        `;
    }
}


customElements.define(BookCard.tag, BookCard);
