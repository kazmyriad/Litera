import { html, css, LitElement } from "lit";
import GoArrow from '../images/Caret-Right.svg';
import PointArrow from '../images/Arrow.svg';  

class BookCard extends LitElement {
    static get tag() {
        return "book-card";
    }

    static get properties(){
        return{
            name: { type:String },
            thumbnail: { type:String }, // must be at LEAST 200 x 200
            description: { type:String }
        }
    }

    constructor(){
        super();
        this.name="A Book Title";
        this.description="A description of the book.";
    }

    static get styles(){
        return css`
            :host {
                display: flex;
                flex-direction: column;
                overflow: hidden;
                width: 15em;
                height: 10em;
                transition: ease-out .2s;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
                border-radius: 8px;
            }
            .top {
                position: relative;
                background-image: url("https://images.pexels.com/photos/1172018/pexels-photo-1172018.jpeg");
                background-size: cover;
                background-position: center;
                justify-content: flex-end;
                display: flex;
                padding: 0.5em;
            }

            
            .top::before {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    rgba(0, 0, 0, 0.8),
                    rgba(0, 0, 0, 0.2)
                );
                transition: opacity 0.4s ease;
            }


            .container:hover .top::before{
                opacity: 0.6;
            }

            .info-button{
                background-color: transparent;
                position: relative;
                width: 30%;
                justify-self: end;
                align-items: center;
                padding: 0.5em;
            }

            h3{
                margin: .5em;
                transition: ease-out .2s;
            }

            button{
                border: 0px;
                justify-content: center; /* Centers horizontally */
                align-items: center;
                transition: ease-out .2s;
            }

            button img{
                height: auto;
                max-width: 100%;
                margin: auto;
            }

        `;
    }

    render(){
        return html`
        <div class="container">
            <div class="top">
                <button class="info-button">
                    <img src="${PointArrow}" alt="Info">
                </button>
            </div>

            <div class="bottom">
                <h3>${this.name}</h3>
            </div>
        </div>
        `;
    }
}

customElements.define(BookCard.tag, BookCard);