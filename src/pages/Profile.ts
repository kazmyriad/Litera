//this is where we would write the frontend for profile
// ---- also where we would likely require having logged in + fetched specific user data
import { html, css, type TemplateResult } from "lit";

interface ProfileProps {
    currentPath?: string;
}

export const ProfilePage = ({ currentPath = '/profile' }: ProfileProps): TemplateResult => {
    css`
        div {
            display: block;
        }
    `
    return html`
        <div class="container">
            <h3>Test Profile Page</h3>
            <img src="">
            <button>test image set</button>
        </div>
        <p>${currentPath}</p>
    `;
};

export default ProfilePage;