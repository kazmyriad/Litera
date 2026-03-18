import { html, css, LitElement } from "lit";

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
                width: 15em;
                height: 10em;
            }

            .thumbnail{
                width:100%;
                height: 100%;
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
            }

            .title-container{
                background-color: var(--color-4);
            }

            h3{
                margin: .5em;
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
            <div class="info-button">
                <p>></p>
            </div>
           </div>
        </div>
        `;
    }
}

customElements.define(CommunityCard.tag, CommunityCard);