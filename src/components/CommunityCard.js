import { html, css, LitElement } from "lit";

class CommunityCard extends LitElement {
    static get tag() {
        return "community-card";
    }

    static get properties(){
        return{
            name: {type:String},
        }
    }
}