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
        top: -100vh;
        bottom: 100%;
        width: 2px;
        background: linear-gradient(#999, #666);
    }

    .disco-ball {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background:
        radial-gradient(circle at 30% 30%, #fff, #ccc, #999);
        position: relative;
        overflow: hidden;
    }

    .light {
        position: absolute;
        width: 10%;
        height: 10%;
        animation: flicker 1.5s infinite alternate;
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
        color: white;
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
        top: 20%;
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

  `;

    spawnBurstLight(container) {
        if (!container) return;

        const burstLight = document.createElement("div");
        burstLight.className = "burst-light";

        const rect = container.getBoundingClientRect();

        //rect.style.backgroundColor = `black, 50%`;

        burstLight.style.left = Math.random() * rect.width + "px";
        burstLight.style.top = Math.random() * rect.height + "px";

        
        burstLight.style.backgroundColor =
            `hsl(${Math.random() * 360}, 80%, 60%)`;

        container.appendChild(burstLight);
        setTimeout(() => burstLight.remove(), 1500);
    }

  createAnimation = () => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("disco-wrapper");

    const string = document.createElement("div");
    string.classList.add("string");

    const discoBall = document.createElement("div");
    discoBall.classList.add("disco-ball");

    const message = document.createElement("h1");
    message.textContent = "Success!";

    wrapper.appendChild(string);
    wrapper.appendChild(discoBall);
    wrapper.appendChild(message);

    this.renderRoot.querySelector("#content").appendChild(wrapper);
    this.renderRoot.querySelector("#content").setAttribute("style", "background-color: hsla(0, 0%, 0%, 0.5);");

    const burstInterval = setInterval(() => {
        this.spawnBurstLight(this.renderRoot.querySelector("#content"));
    }, 120);

    const rows = 10;
    const cols = 10;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const light = document.createElement("div");
            light.classList.add("light");

            const x = (col + 0.5) * (100 / cols);
            const y = (row + 0.5) * (100 / rows);

            light.style.left = `${x}%`;
            light.style.top = `${y}%`;
            light.style.transform = "translate(-50%, -50%)";

            light.style.animationDelay = `${Math.random() * 1.5}s`;
            light.style.opacity = 0.3 + Math.random() * 0.7;

            light.style.backgroundColor =
            `hsl(${Math.random() * 360}, 60%, 35%)`;

            discoBall.appendChild(light);
        }
    }

    setTimeout(() => {
        clearInterval(burstInterval);
        wrapper.remove();
        this.renderRoot.querySelector("#content").setAttribute("style", "background-color: transparent");
    }, 5000);
  };

  render() {
    return html`
      <div id="content">
      </div>
    `;
  }
}

customElements.define("success-animation", SuccessAnimation);