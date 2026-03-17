// this is where we would write the frontend for the login section
import { html, css, type TemplateResult } from "lit";

interface LoginProps {
    currentPath?: string;
}

export const LoginPage = ({ currentPath = '/libraries' }: LoginProps): TemplateResult => {
    css`
        div {
            display: block;
        }
    `
    return html`
        <div class="container">
            <h1>Login Page</h1>
            <img src="">
        </div>
    `;
};

export default LoginPage;