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
            display: block;
            margin: 1em;
        }
        nav {
            display: inline-flex;
        }
        .trail{
            display: flex;
            align-items: center;
            background-color: var(--color-3);
            border-radius: 50px;
            padding: 0.5em 1.25em;
            gap: 0.25em;
        }
        a{
            color: var(--color-2);
            font-weight: 600;
            text-decoration: none;
            padding: 0.25em 0.5em;
            border-radius: 50px;
            transition: background-color 150ms ease, color 150ms ease;
        }
        a:hover{
            background-color: rgba(127, 85, 58, 0.12);
            color: var(--color-1);
        }
        .separator {
            color: var(--color-2);
            opacity: 0.5;
            font-size: 0.85em;
            user-select: none;
        }
        .lastCrumb{
            color: var(--color-4);
            font-weight: 600;
            text-decoration: none;
            padding: 0.25em 0.5em;
            border-radius: 50px;
            transition: background-color 150ms ease, color 150ms ease;
        }
        .lastCrumb:hover{
            background-color: rgba(100, 109, 74, 0.12);
            color: var(--color-5);
        }
        `;
    }

    render(){
        return html`
        <nav>
            <div class="trail">
                ${this.segments.slice(0, this.segments.length - 1).map((segment) => html`
                    <a href="${segment}">${segment}</a><span class="separator">/</span>`)}
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