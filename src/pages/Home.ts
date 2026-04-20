//this is where we would write the frontend for Home
import { html, css, type TemplateResult } from "lit";
import '../components/Hero.jsx';
import '../components/successAnimation.jsx';
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
            background-color: #fefefe;
        }
        div.content {
            margin: 48px;
            background-color: #f9f5f0;
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05);
        }
        ul {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 32px;
            padding: 0;
            list-style: none;
        }
        li {
            background-color: white;
            box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
            padding: 24px;
            border-radius: 12px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        li:hover {
            transform: translateY(-4px);
            box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.15);
        }
        li h4 {
            margin-top: 16px;
            text-align: center;
            color: var(--color-5);
            font-weight: 600;
        }
        img {
            width: 100%;
            height: 200px;
            max-height: 250px;
            object-fit: cover;
            border-radius: 8px 8px 0 0;
        }
        h2 {
            text-align: center;
            color: #555;
            margin-bottom: 32px;
            font-size: 2rem;
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