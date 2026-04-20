import { LitElement, css, html } from "lit";

class JoinButton extends LitElement {
  static get tag() {
    return "join-button";
  }

  static get properties() {
    return {
      mode: { type: String }
    };
  }

  constructor() {
    super();
    this.mode = "join";
  }

  static get styles() {
    return css`
      button {
        padding: 12px 24px;
        border-radius: 40px;
        background-color: var(--color-4);
        color: white;
        border: none;
        box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
        cursor: pointer;
      }

      .join {
        background-color: var(--color-5);
      }

      .unjoin {
        background-color: var(--color-3);
        color: brown;
      }
    `;
  }

  toggleJoin = () => {
    this.mode = this.mode === "join" ? "unjoin" : "join";
  };

  render() {
    return html`
      <button
        @click=${this.toggleJoin}
        class=${this.mode}
      >
        ${this.mode === "join" ? "Join" : "Leave Community"}
      </button>
    `;
  }
}

customElements.define(JoinButton.tag, JoinButton);