import { html, css, LitElement } from "lit";
import PointArrow from '../images/Arrow.svg';  

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
            <div class="top" style="background-image: url('${this.thumbnail}')">
                <button class="info-button" @click=${() => window.location.hash = '/community-detail'}>
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

customElements.define(CommunityCard.tag, CommunityCard);