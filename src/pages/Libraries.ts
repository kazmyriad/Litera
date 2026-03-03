// this is where we would write the frontend for the libraries section
// ---- would need to fetch book database + linked to specific user account 
import { html, css, type TemplateResult } from "lit";

interface LibProps {
    currentPath?: string;
}

export const LibrariesPage = ({ currentPath = '/libraries' }: LibProps): TemplateResult => {
    css`
        div {
            display: block;
        }
    `
    return html`
        <div class="container">
            <h1>Libraries Page</h1>
            <img src="">
        </div>
    `;
};

export default LibrariesPage;