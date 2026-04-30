// customized successAnimation for successful creation attempts
import { html, css, LitElement } from "lit";

class SuccessAnimation extends LitElement {
  static styles = css`
    :host {
        position: fixed;
        inset: 0;
        z-index: 9999;
        pointer-events: none;
    }

    #content {
        position: absolute;
        inset: 0;
        overflow: hidden;
        background-color: transparent;
        pointer-events: none;
    }

    #content.active {
        pointer-events: auto;
        cursor: pointer;
    }

    .disco-wrapper {
        position: absolute;
        top: -200px;
        left: 50%;
        transform: translateX(-50%);
        animation: descend 2s ease-out forwards;
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .string {
        position: absolute;
        top: -50vh;
        left: 50%;
        transform: translateX(-50%);
        
        object-fit: fill;
        width: auto;
        height: 50vh;
        pointer-events: none;
    }

    .disco-ball {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        background:
        none;
        position: relative;
        overflow: hidden;
    }

    .light {
        width: 100%;
        height: 100%;
        animation: flicker 1.5s infinite alternate;
        outline: 1px solid transparent;
        outline-offset: -1px;
    }

    .light-grid {
        position: absolute;
        inset: 0;
        width: 300%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(30, 1fr);
        grid-template-rows: repeat(10, 1fr);
        animation: spin 3s linear infinite;
    }

    .burst-light {
        position: absolute;
        width: 6px;
        height: 10px;
        border-radius: 2px;
        pointer-events: none;
        animation: burst 1.5s ease-out forwards;
    }

    h1 {
        margin-top: 16px;
        text-align: center;
        color: var(--color-3);
    }

    
    @keyframes burst {
        from {
            transform: scale(0.5);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    @keyframes descend {
        to {
        top: 40%;
        }
    }
    
    @keyframes flicker {
        from {
        opacity: 0.3;
        }
        to {
        opacity: 1;
        }
    }

    @keyframes spin {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(-33.33%);
        }
    }

  `;

  randomizeColors() {
    const baseColors = [
        { h: 33,  s: 44, l: 49 }, // #7f553a (color-1) - warm brown
        { h: 40,  s: 32, l: 63 }, // #a58a64 (color-2) - tan/gold
        { h: 29,  s: 38, l: 88 }, // #ece0d5 (color-3) - warm cream
        { h: 75,  s: 19, l: 36 }, // #646d4a (color-4) - olive green
        { h: 80,  s: 17, l: 24 }, // #414833 (color-5) - dark green
    ];

    const base = baseColors[Math.floor(Math.random() * baseColors.length)];

    function vary(value, amount) {
        return value + (Math.random() * 2 - 1) * amount;
    }

    const h = vary(base.h, 8);
    const s = vary(base.s, 5);
    const l = vary(base.l, 7);

    return `hsl(${h}, ${s}%, ${l}%)`;
  }

    spawnBurstLight(container) {
        if (!container) return;

        const burstLight = document.createElement("div");
        burstLight.className = "burst-light";

        const rect = container.getBoundingClientRect();

        burstLight.style.left = Math.random() * rect.width + "px";
        burstLight.style.top = Math.random() * rect.height + "px";
        
        burstLight.style.backgroundColor = this.randomizeColors();

        container.appendChild(burstLight);
        setTimeout(() => burstLight.remove(), 1500);
    }

  createAnimation = () => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("disco-wrapper");

    const string = document.createElement("img");
    string.src = new URL("../images/disco-string.png", import.meta.url).href;
    string.classList.add("string");

    const discoBall = document.createElement("div");
    discoBall.classList.add("disco-ball");

    const message = document.createElement("h1");
    message.textContent = "Success!";

    const lightGrid = document.createElement("div");
    lightGrid.classList.add("light-grid");
    discoBall.appendChild(lightGrid);

    wrapper.appendChild(string);
    wrapper.appendChild(discoBall);
    wrapper.appendChild(message);

    const content = this.renderRoot.querySelector("#content");
    content.appendChild(wrapper);
    content.setAttribute("style", "background-color: hsla(0, 0%, 0%, 0.5);");
    content.classList.add("active");

    this._burstInterval = setInterval(() => {
        this.spawnBurstLight(content);
    }, 120);

    this._animTimeout = setTimeout(() => this._finish(wrapper), 3000);

    content.addEventListener("click", () => this._stopEarly(wrapper), { once: true });

    const rows = 10;
    const cols = 30;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const light = document.createElement("div");
            light.classList.add("light");
            light.style.backgroundColor = this.randomizeColors();
            light.style.animationDelay = `${Math.random() * 1.5}s`;
            light.style.opacity = 0.3 + Math.random() * 0.7;

            /*const x = (col + 0.5) * (100 / cols);
            const y = (row + 0.5) * (100 / rows);

            light.style.left = `${x}%`;
            light.style.top = `${y}%`;
            light.style.transform = "translate(-50%, -50%)";

            

            light.style.backgroundColor = this.randomizeColors();*/

            lightGrid.appendChild(light);
        }
    }

  };

  _finish(wrapper) {
    clearInterval(this._burstInterval);
    clearTimeout(this._animTimeout);
    wrapper.remove();
    const content = this.renderRoot.querySelector("#content");
    content.setAttribute("style", "background-color: transparent");
    content.classList.remove("active");
    this.dispatchEvent(new CustomEvent('finished', { bubbles: true, composed: true }));
  }

  _stopEarly(wrapper) {
    this._finish(wrapper);
  }

  async play() {
    await this.updateComplete;
    this.createAnimation();
  }

  render() {
    return html`
      <div id="content">
      </div>
    `;
  }
}

customElements.define("success-animation", SuccessAnimation);