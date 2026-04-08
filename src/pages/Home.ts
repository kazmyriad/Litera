//this is where we would write the frontend for Home
import { html, css, type TemplateResult } from "lit";
import '../components/Hero.js';
import '../components/successAnimation.js';
import { getCurrentUser } from "../Services.js";

interface HomeProps {
    currentPath?: string;
}

export const HomePage = ({ currentPath = '/' }: HomeProps): TemplateResult => {

    const user = getCurrentUser();
    const isAuthenticated = !!user;

    const style = css`
        :host {
            display: block;
        }
        div.content {
            margin: 48px;
        }
        ul {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 48px;
            padding: 0;

        }
        li {
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
            padding: 24px;
            list-style-type: none;
        }
        li h4 {
            width: fill;
        }
        img {
            width: 100%;
            height: 200px;
            max-height: 250px;
            object-fit: cover;
        }
    `
    return html`
    <style>${style}</style>

    <success-animation id="successAnim"></success-animation>

        <div class="banner">
            <title-hero .isAuthenticated=${isAuthenticated} .user=${user?.username ?? ""}></title-hero>
        </div>

        <div class="content">
            <div class="features">
                <h2>Features</h2>
                <ul>
                    <li>
                        <img src="https://images.pexels.com/photos/31632300/pexels-photo-31632300.jpeg">
                        <h4>Discover new books and authors</h4>
                    </li>
                    <li>
                        <img src="https://images.pexels.com/photos/4861347/pexels-photo-4861347.jpeg">
                        <h4>Connect with other book lovers in real time</h4>
                    </li>
                    <li>
                        <img src="https://images.pexels.com/photos/6499045/pexels-photo-6499045.jpeg">
                        <h4>Track your favorites</h4>
                    </li>
                </ul>
            </div>
            <!--<button @click=${(e: Event) => {
                const root = (e.currentTarget as HTMLElement).getRootNode() as ShadowRoot;
                const anim = root.querySelector("#successAnim") as any;
                anim?.createAnimation();
            }}>Create Animation</button>-->

        </div>
    `;
};

export default HomePage;