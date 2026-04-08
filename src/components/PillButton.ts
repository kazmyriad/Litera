import { LitElement, css, html } from "lit";

export class PillButton extends LitElement {
  static tag = "pill-button";

  static properties = {
    selected: { type: Boolean, reflect: true },
    category: { type: String }
  }

  selected = false;
  category = "";

  static styles = css`
      button {
        padding: 12px 24px;
        border-radius: 40px;
        background-color: var(--color-4);
        color: white;
        border: none;
        box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
        cursor: pointer;
      }

      .selected {
        background-color: var(--color-5);
      }
    `;

  toggleMode = () => {
    if (!this.selected) {
      const selectedCount = document.querySelectorAll(
        "pill-button[selected]"
      ).length;

      if (selectedCount >= 5) return;
    }

    this.selected = !this.selected;
  };

  render() {
    return html`
      <button
        class=${this.selected ? "selected" : ""}
        @click=${this.toggleMode}
      >
        <slot></slot>
      </button>
    `;
  }
}

customElements.define(PillButton.tag, PillButton);