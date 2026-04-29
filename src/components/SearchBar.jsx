import { html, css, LitElement } from "lit";
import SearchIcon from "../images/Search.svg";

// need to add actual search functionality and filter logic, 
// but this is the basic structure for the search bar with dropdown and tags

class SearchBar extends LitElement {
    static tag = "search-bar";


    connectedCallback() {
        super.connectedCallback();
        this._handleOutsideClick = this._handleOutsideClick.bind(this);
        document.addEventListener("click", this._handleOutsideClick);
    }

    disconnectedCallback() {
        document.removeEventListener("click", this._handleOutsideClick);
        super.disconnectedCallback();
    }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 30em;
      position: relative;
    }

    #content {
        display: flex;
        background-color: var(--color-3);
        border-radius: 50px;
        padding: 1em;
        width: 100%;
        box-sizing: border-box;
        align-items: center;
        gap: 8px;
        box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.2);
    }

    img {
      flex-shrink: 0;
      width: 1.5em;
    }

    input {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      font-size: 1em;
      font-style: normal;
      text-align: left;
    }

    input:focus { outline: none; }

    input::placeholder {
      font-style: italic;
      color: var(--color-2);
    }

    .clear-btn {
        background: rgba(0,0,0,0.12);
        border: none;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        color: var(--color-5);
        line-height: 1;
        padding: 0;
        flex-shrink: 0;
    }
    .clear-btn:hover { background: rgba(0,0,0,0.22); }
  `;

  constructor() {
    super();
    this._query = '';
  }

  _dispatchSearch() {
    this.dispatchEvent(new CustomEvent('search-changed', {
      detail: { query: this._query, filters: [] },
      bubbles: true,
      composed: true,
    }));
  }

  _onInput(e) {
    this._query = e.target.value;
    this._dispatchSearch();
  }

  clearSearch() {
    this._query = '';
    this.requestUpdate();
    this._dispatchSearch();
    const input = this.shadowRoot?.querySelector('input');
    if (input) input.value = '';
  }

  render() {
    return html`
      <div id="content">
        <img src=${SearchIcon} width="24" height="24" />
        <input
          type="text"
          placeholder="browse by title, author, genres..."
          .value=${this._query}
          @input=${(e) => this._onInput(e)}
        />
        ${this._query ? html`
          <button class="clear-btn" title="Clear search" @click=${(e) => { e.stopPropagation(); this.clearSearch(); }}>✕</button>
        ` : null}
      </div>
    `;
  }
}

customElements.define(SearchBar.tag, SearchBar);