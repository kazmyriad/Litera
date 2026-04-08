//this is where we would write the frontend for communities
// ---- would also need to use sql-related variables to load in communities (likely through a map)
import { html, css, type TemplateResult } from "lit";
import '../components/SearchBar.js';
import '../components/CommunityCard.js';
import '../components/CommunityContainer.js';
import '../components/JoinButton.js';

interface ComProps {
    currentPath?: string;
}

export const CommunityDetailPage = ({ currentPath = '/community-detail' }: ComProps): TemplateResult => {
    const styles = css`
        :host {
            display: block;
        }
        div.banner {
            background-color: var(--color-5);
            margin: 24px;
            text-align: center;
            color: white;
            width: fit-content;
            justify-self: center;
        }

        button {
            background-color: var(--color-5);
            border-radius: 8px;
            color: white;
        }
        div.content {
            justify-self: center;
        }
        div.my-communities, div.popular-communities {
            margin: 24px;
            gap: 24px;
        }
    `

    return html`
        <style>${styles}</style>
        <div class="banner">
             <img src="https://www.baltimoremagazine.com/wp-content/uploads/2026/02/wuthering-heights-header-1-1200x675.jpg">
        </div>

        <div class="content">
            <div class="popular-communities">
                <h3>Movie Adaptations</h3>
                <label>2.4k Members</label>
                <join-button></join-button>
            </div>

        </div>
    `;
};

export default CommunityDetailPage;