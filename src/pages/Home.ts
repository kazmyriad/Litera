//this is where we would write the frontend for Home
import { html, css, type TemplateResult } from "lit";
import '../components/Hero.js';
import '../components/successAnimation.js';

interface HomeProps {
    currentPath?: string;
}

export const HomePage = ({ currentPath = '/' }: HomeProps): TemplateResult => {
    const style = css`
        :host {
            display: block;
        }
        div.content {
            margin: 48px;
        }
    `
    return html`
    <style>${style}</style>

    <success-animation id="successAnim"></success-animation>

        <div class="banner">
            <title-hero></title-hero>
        </div>

        <div class="content">
            <div class="our-mission">
                <h2>Our Mission</h2>
                <p>To provide a platform for book lovers to discover communities to review and share their favorite reads.</p>
            </div>
            <div class="features">
                <h2>Features</h2>
                <ul>
                    <li>Discover new books and authors</li>
                    <li>Connect with other book lovers in real time</li>
                    <li>Track your favorites</li>
                </ul>
            </div>
            <button @click=${(e: Event) => {
                const root = (e.currentTarget as HTMLElement).getRootNode() as ShadowRoot;
                const anim = root.querySelector("#successAnim") as any;
                anim?.createAnimation();
            }}>Create Animation</button>

        </div>
    `;
};

export default HomePage;