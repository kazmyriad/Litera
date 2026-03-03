//this is where we would write the frontend for Home
import { html, css, type TemplateResult } from "lit";

interface HomeProps {
    currentPath?: string;
}

export const HomePage = ({ currentPath = '/' }: HomeProps): TemplateResult => {
    css`
        div {
            display: block;
        }
    `
    return html`
        <div class="container">
            <h1>Home Page</h1>
            <img src="">
        </div>
    `;
};

export default HomePage;