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
        :host{
            font-size: 1em;
            color: var(--color-2);
        }
        .trail{
            display: flex;
        }
        a{
            margin: 1em 1em 0em 1em;
            color: var(--color-2);
            font-weight: bold;
        }
        a:hover{
            color: var(--color-1);
        }
        .lastCrumb{
            font-size: 1.2em;
            margin-top: .7em;
            color: var(--color-4);
            text-decoration: none;
        }
        .lastCrumb:hover{
            color:var(--color-5);
        }
        `;
    }

    render(){
        return html`
        <nav>
            <div class="trail">
                ${this.segments.slice(0, this.segments.length - 1).map((segment) => html`
                    <a href="${segment}">${segment}</a> <p>/</p>`)}
                ${this.segments.slice(-1).map((segment) => html`
                    <a href="${segment}" class="lastCrumb">${segment}</a>`)}
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