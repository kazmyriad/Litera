import { html, css, LitElement } from "lit";
import GoArrow from '../images/Caret-Right.svg';

class CommunityCard extends LitElement {
    static get tag() {
        return "community-card";
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
        this.name="A Community";
        this.thumbnail="https://imgs.search.brave.com/YrYKkH3zAO_LfZ53tMnd3SrCDwS5hjBSSInd-S_YvLQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wMDAv/MTU2LzkyMC9zbWFs/bC9jdXRlLWJvb2st/d2l0aC13b3JtLWls/bHVzdHJhdGlvbi12/ZWN0b3IuanBn"; // placeholder img
        this.description="A description of the community.";
    }

    static get styles(){
        return css`
            .container {
                display: flex;
                flex-direction: column;
                background-color: #FFFFFF;
                overflow: hidden;
                width: 15em;
                height: 10em;
                border-radius: 8px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
                transition: ease-out .2s;
            }

            .container:hover{
                transition: ease-in .2s;
                height: 10em;

                .info-button{
                    background-color: var(--color-5);
                    transition: ease-in .2s;
                }

                .thumbnail img{
                    opacity: 50%;
                    transition: ease-in .2s;
                }

                button img{
                    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(251deg) brightness(112%) contrast(101%);
                }
            }

            .thumbnail{
                width:100%;
                height: 100%;
                background-color: #000000;
                transition: ease-out .2s;
            }

            img{
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .info-button{
                background-color: var(--color-2);
                width: 30%;
                align-items: center;
            }

            .content-container{
                display: flex;
                height: 100%;
            }

            .title-container{
                background-color: var(--color-4);
            }

            h3{
                margin: .5em;
                color: var(--color-3);
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
            <div class="title-container">
                <h3>${this.name}</h3>
            </div>
           <div class="content-container">
             <div class="thumbnail">
                <img src="${this.thumbnail}" alt="${this.name} thumbnail">
            </div>
            <button class="info-button">
                <img src="${GoArrow}">
            </button>
        </div>
        `;
    }
}

customElements.define(CommunityCard.tag, CommunityCard);