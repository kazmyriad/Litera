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

            .book{
                width:15em;
                height:12.5em;
                background: #646d4a;
                border-radius: 20px 16px 12px 20px;
                background-image: linear-gradient(to right, #414833 48px, #646d4a 50px, transparent 50px);  
                transition: ease-in .2s;
                position: relative;
                display: inline-block;
            }
            .book::after{
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

            h3{
                margin: 0;
                padding: 0;
                margin-left: 3em;
                padding-top: 0.5em;
                height: 40%;
                vertical-align: middle;
                width: 7.5em;
                overflow: hidden;
                color: #ece0d5;
                font-weight: bold;
                font-size: 1.3em;
                transition: ease-in-out .2s;
            }

            img{
                opacity: .5;
                transition: ease-in-out .2s;
                float: right;
                margin-right: 0.5em;
                position: relative;
            }

            .book:hover{
                width: 17em;
                transition: ease-in-out .2s;
            }

            .book:hover img{
                opacity: 1;
                transition: ease-in-out .2s;
            }

            .book:hover h3{
                width: 8em;
                transition: ease-in-out .2s;
                font-size: 1.4em;
                height: 50%;
            }

            .book:hover::after{
                width: 16.5em;
                transition: ease-in-out .2s;
            }
        `;
    }
        
    render(){
        return html`
            <div class="book">
                <h3 class="title">${this.title || this.name || "Book Title"}</h3>
                <img src="${PointArrow}" alt="Info">
                <button onClick=${() => libraryManager.favoriteBook(book.id)}>
                ${book.favorite ? "Unfavorite" : "Favorite"}
                </button>
            </div>
        
        `;
    }

    
}


customElements.define(BookCard.tag, BookCard);

