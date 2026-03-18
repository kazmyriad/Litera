import { html, css, LitElement } from "lit";

class CommunityContainer extends LitElement {
    static get tag() {
        return "community-container";
    }

    static get properties() {
        return{
            name:{ type: String}
        }
    }

    constructor(){
        super();
        this.name="Communities";
    }

    static get styles(){
        return css`
        .card{
           display:flex;
        }

        ::slotted(*){
            margin-right: 1em;
        }
        `;
    }

    render(){
        return html`
        <div class="card">
            <slot></slot>
        </div>
        `;
    }
}

customElements.define(CommunityContainer.tag, CommunityContainer);