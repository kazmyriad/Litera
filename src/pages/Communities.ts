//this is where we would write the frontend for communities
// ---- would also need to use sql-related variables to load in communities (likely through a map)
import { html, css, type TemplateResult } from "lit";

interface ComProps {
    currentPath?: string;
}

export const CommunitiesPage = ({ currentPath = '/communities' }: ComProps): TemplateResult => {
    css`
        div {
            display: block;
        }
    `
    return html`
        <div class="container">
            <h1>Communities Page</h1>
            <img src="">
        </div>
    `;
};

export default CommunitiesPage;