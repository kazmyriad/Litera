import { html, css, LitElement } from "lit";

class CommunityCard extends LitElement {
    static get tag() {
        return "community-card";
    }

    static get properties(){
        return{
            name: {type:String},
            thumbnail: {type:String},
            description: {type:String}
        }
    }

    constructor(){
        super();
        this.name="A Community";
        this.thumbnail=""; // add placeholder img
        this.description="A description of the community.";
    }

    static get styles(){
        return css`

        `;
    }

    render(){
        return html`
        `;
    }
}