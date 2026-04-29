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
      position: relative;
    }

    #content {
        display: flex;
        background-color: var(--color-3);
        border-radius: 50px;
        padding: 1em;
        width: 30em;
        align-items: center;
        justify-content: space-between;
    }

    .search-input {
        border: none;
        background: transparent;
        text-align: center;
    }

    .search-input:focus {
        outline: none;
    }

    #left {
      display: flex;
        width: 100%;
        flex-grow: 3;
        justify-content: flex-start;
    }

    #right button {
        position: relative;
        background-color: transparent;
        border: none;
        color: var(--color-4);
    }
    #right button:hover {
        cursor: pointer;
        color: var(--color-5);
    }

    #dropdown {
        position: absolute;
        top: 40px;
        right: 0;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,.15);
        z-index: 10;
    }

    #dropdown button {
        display: block;
        width: 100%;
        padding: 8px 16px;
        background-color: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
    }

    #dropdown button:hover {
        background-color: #f0f0f0;
    }

    #tags {
        display: flex;
        gap: 8px;
        padding: 8px 16px;
        flex-wrap: wrap;
    }

    .tag {
        background-color: var(--color-2);
        color: white;
        border-radius: 16px;
        padding: 4px 12px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .tag button {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 12px;
    }

    .active {
        font-weight: bold;
    }

    img{
      float: left;
      margin-right:2em;
      width:2em;
    }

    input{
      field-sizing: content;
      /* this only works on the latest chromium browsers though */
      text-align: left;
      font-size: 1em;
      font-style: normal;
    }

    input::placeholder{
      font-style: italic;
      color: var(--color-2);
    }
  `;

  constructor() {
    super();

    this.dropdownOpen = false;
    this.activeFilters = [];
    this._query = '';

    this.filterOptions = ["A-Z", "Recently Updated", "Popular"];
  }

  _handleOutsideClick(event) {
    if (!this.dropdownOpen) return;

    const path = event.composedPath();
    if (!path.includes(this)) {
      this.dropdownOpen = false;
      this.requestUpdate();
    }
  }

  _dispatchSearch() {
    this.dispatchEvent(new CustomEvent('search-changed', {
      detail: { query: this._query, filters: [...this.activeFilters] },
      bubbles: true,
      composed: true,
    }));
  }

  _onInput(e) {
    this._query = e.target.value;
    this._dispatchSearch();
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    this.requestUpdate();
  }

  selectFilter(option) {
    const index = this.activeFilters.indexOf(option);
    if (index === -1) {
      this.activeFilters.push(option);
    } else {
      this.activeFilters.splice(index, 1);
    }

    this.requestUpdate();
    this._dispatchSearch();
  }

  removeTag(option) {
    this.activeFilters = this.activeFilters.filter(filter => filter !== option);
    this.requestUpdate();
    this._dispatchSearch();
  }

  render() {
    return html`
      <div id="content">
        <div id="left">
          <img src=${SearchIcon} width="24" height="24" />
          <input
            class="search-input"
            type="text"
            placeholder="browse by title, books, genres..."
            @input=${(e) => this._onInput(e)}
          />
        </div>

        <div id="right">
          <button @click=${(e) => {e.stopPropagation(); this.toggleDropdown()}}>
            Filter
          </button>

          ${this.dropdownOpen
            ? html`
                <div id="dropdown" @click=${(e) => e.stopPropagation()}>
                  ${this.filterOptions.map(
                    option => html`
                      <button
                        class=${option === this.activeFilters.includes(option) ? "active" : ""}
                        @click=${() => this.selectFilter(option)}
                      >
                        ${option}
                      </button>
                    `
                  )}
                </div>
              `
            : null}
        </div>
      </div>
      ${this.activeFilters.length > 0
        ? html`
            <div id="tags">
              ${this.activeFilters.map(
                option => html`
                  <div class="tag">
                    ${option}
                    <button @click=${() => this.removeTag(option)}>×</button>
                  </div>
                `
              )}
            </div>
          `
        : null}
    `;
  }
}

customElements.define(SearchBar.tag, SearchBar);