import { html, css, LitElement } from "lit";

class Breadcrumb extends LitElement {

    static get tag(){
        return "bread-crumb";
    }

    connectedCallback(){
        super.connectedCallback();
        this.loadBreadcrumb();
    }

    constructor() {
        super();
        this.segments = [];
    }

    static get properties(){
        return{
            segments: {type: Array}
        };
    }

    static get styles(){
        return css`
        `;
    }

    render(){
        return html`
        <nav>
            <div class="trail">
                ${this.segments.map((segment, index) => html`
                    <p><a href="${segment}">${segment}</a></p>`)}
            </div>
        </nav>
        `;
    }

    loadBreadcrumb(){
        let path = window.location.hash || window.location.pathname;
        let crumbs = path.split('/').filter(Boolean);
        this.segments = crumbs;
    }

}



customElements.define(Breadcrumb.tag, Breadcrumb);