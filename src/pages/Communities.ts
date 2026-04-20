import { html, css, type TemplateResult, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import '../components/SearchBar.jsx';
import '../components/CommunityCard.jsx';
import '../components/CommunityContainer.jsx';
import '../components/Breadcrumb.jsx';
import { getCurrentUser, fetchCommunities, type Community } from "../Services.js";

@customElement('communities-page')
export class CommunitiesPage extends LitElement {
    @state() private communities: Community[] = [];
    @state() private loading = true;

    connectedCallback(): void {
        super.connectedCallback();
        this.loadCommunities();
    }

    private async loadCommunities() {
        try {
            this.communities = await fetchCommunities();
        } catch (e) {
            console.error('Failed to load communities', e);
        } finally {
            this.loading = false;
        }
    }

    private renderCommunityCard(community: Community): TemplateResult {
        return html`
          <div style="cursor:pointer" @click=${() => { window.location.hash = `#/community-detail/${community.id}`; }}>
            <community-card name="${community.name}" description="${community.description}"></community-card>
          </div>`;
    }

    render(): TemplateResult {
        const user = getCurrentUser();
        const isAuthenticated = !!user;

        const popularCommunities = this.communities.slice(0, 3); // first 3 as popular
        const myCommunities = isAuthenticated ? this.communities.filter(c => c.ownerId === user.id) : [];

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
        `;

        if (this.loading) {
            return html`<div>Loading communities...</div>`;
        }

        return html`
            <style>${styles}</style>
            <bread-crumb></bread-crumb>
            <div class="banner">
                <h1 style="padding: 24px 64px;">Communities</h1>
            </div>

            <div class="content">
                
                <search-bar></search-bar>

                <div class="popular-communities">
                    <h3>Popular This Week</h3>
                    <community-container>
                        ${popularCommunities.map(c => this.renderCommunityCard(c))}
                    </community-container>
                </div>

                ${isAuthenticated ? html`
                    <div class="my-communities">
                        <h3>My Communities</h3>
                        <button @click=${() => window.location.hash = '#/create-community'}>New Community</button>
                        <community-container>
                            ${myCommunities.map(c => this.renderCommunityCard(c))}
                        </community-container>
                    </div>
                ` : null
                }
            </div>
        `;
    }
};

export default CommunitiesPage;