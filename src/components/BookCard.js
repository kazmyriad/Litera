import { html, css, LitElement } from "lit";
import PointArrow from '../images/Arrow.svg';  

class BookCard extends LitElement {
    static get tag() {
        return "book-card";
    }

    static get properties(){
        return{
            name: { type:String },
            thumbnail: { type:String }, // must be at LEAST 200 x 200
            description: { type:String },
            book: { type:String},
            favorite: { type: Boolean }
        }
    }

    constructor(){
        super();
        this.name="A Court of Thorns and Roses";
        this.thumbnail="https://imgs.search.brave.com/XlnwOZNk_kpCoM56CZ9t8y-iNQIhq0KwmU7k3fd-SAM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9saDMu/Z29vZ2xldXNlcmNv/bnRlbnQuY29tL1FY/eXROSEZIRmdJSHJ5/QzdNaDBGYklnWUtI/TnJNT0RrdnpRVDBp/SVYzdXUwQzlVdDlM/TklNNWY1aWN3eFQ5/cU1Td1lJaVIySGFC/QjQ1UzFuVzVxRGF4/S2F5d0tqYjJUc0U0/TE1CbU8tbE1ydlhP/cTRhNk09dzE0NDAt/aDgxMC1uLW51";
        this.description="A description of the book.";
        this.book = null;
        this.favorite = false;

    }

    static get styles(){
         return css`
         *
            {
                margin:0;
                padding:0;
            }
            html, body{
                height: 100%;
                width: 100%;
                // overflow: hidden;
            }
            body{
                background: #FFC967;
            }
            *, *:before, *:after { 
                box-sizing: inherit; 
            }
            *:before, *:after { 
                content: ""; 
                position: absolute; 
            } 
            .book{
                width:15em;
                height:12.5em;
                transform: translate(-0%, -0%);
                background: var(--color-4);
                border-radius: 20px 16px 12px 20px;
                background-image: linear-gradient(to right, var(--color-5) 48px, var(--color-4) 50px, transparent 50px);  
                transition: ease-in .2s;
                //box-shadow:  2px 6px 40px 0px #FEA600
            }
            .book:after{
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

            .book-container{
                width: 100px;
                background-color: blue;
            }

            div{
                 text-align: center;
            }

            h3{
                margin-left: 3em;
                padding-top: 1em;
                height: 40%;
                vertical-align: middle;
                width: 7.5em;
                overflow: hidden;
                color: var(--color-3);
                font-weight: bold;
                font-size: 1.3em;
                transition: ease-in-out .2s;
            }

            img{
                opacity: .5;
                transition: ease-in-out .2s;
                float: right;
                margin-right: .5em;
            }

            .book:hover{
                width: 17em;
                transition: ease-in-out .2s;
                
                img{
                    opacity: 1;
                    transition: ease-in-out .2s;
                }

                h3{
                    width: 8em;
                    transition: ease-in-out .2s;
                    font-size: 1.4em;
                    height: 50%;
                }
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
                <h3 class="title">${this.name}</h3>
                <img src="${PointArrow}" alt="Info">
            </div>
            
            <!-- <button onClick={() => libraryManager.favoriteBook(book.id)}>
                {book.favorite ? "Unfavorite" : "Favorite"}
            </button> -->

            <!-- Unable to fix this withou refactoring every method and I do not know React +
             How the App.tsx works -->
        `;
    }

    
}


customElements.define(BookCard.tag, BookCard);