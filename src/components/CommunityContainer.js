import { html, css, LitElement } from "lit";
import '../components/CommunityCard.js';
import { communityService} from '../Services.ts';

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
           gap: 16px;
           flex-wrap: wrap;
        }

        ::slotted(*){
            padding: 1em 1em 1em 0em;
        }
        `;
    }

    render(){
        const communities = communityService.getCommunities();

        return html`
        <div class="card">
            <slot></slot>
            
            ${communities.map(
                c => html`
                    <community-card
                    .name=${c.name}
                    .description=${c.description}
                    ></community-card>
                `
                )}

        </div>
        `;
    }
}

customElements.define(CommunityContainer.tag, CommunityContainer);