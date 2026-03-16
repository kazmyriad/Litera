//this is where we would write the frontend for profile
// ---- also where we would likely require having logged in + fetched specific user data
import { html, css, type TemplateResult } from "lit";

interface ProfileEditProps {
    currentPath?: string;
}

//functions


export const ProfileEditPage = ({ currentPath = '/profile' }: ProfileEditProps): TemplateResult => {
    css`
        div {
            display: block;
        }
    `
    return html`
        <div class="container">
            <h3>Test Profile Page</h3>
            <img id="profileImg" src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg">
            <h4>disco_fan_1</h4>
            <button>test image set</button>
        </div>
        <p>${currentPath}</p>
    `;
};

export default ProfileEditPage;