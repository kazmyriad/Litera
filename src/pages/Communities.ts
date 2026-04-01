//this is where we would write the frontend for communities
// ---- would also need to use sql-related variables to load in communities (likely through a map)
import { html, css, type TemplateResult } from "lit";
import '../components/SearchBar.js';
import '../components/CommunityCard.js';
import '../components/CommunityContainer.js';

interface ComProps {
    currentPath?: string;
}

export const CommunitiesPage = ({ currentPath = '/communities' }: ComProps): TemplateResult => {
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
            <h1 style="padding: 24px 64px;">Communities</h1>
        </div>

        <div class="content">
            
            <search-bar></search-bar>

            <div class="popular-communities">
                <h3>Popular This Week</h3>
                <community-container>
                    <community-card name="Community 1" description="This is the first community."></community-card>
                    <community-card name="Community 2" description="This is the second community."></community-card>
                    <community-card name="Community 3" description="This is the third community."></community-card>
                </community-container>
            </div>

            <div class="my-communities">
                <h3>My Communities</h3>
                <button @click=${() => window.location.hash = '#/create-community'}>New Community</button>
                <community-container>
                    <community-card name="My Community 1" description="This is my first community."></community-card>
                    <community-card name="My Community 2" description="This is my second community."></community-card>
                </community-container>
            </div>

            <img src="">
        </div>
    `;
};

export default CommunitiesPage;