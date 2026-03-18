//this is where we would write the frontend for profile
// ---- also where we would likely require having logged in + fetched specific user data
import { html, css, type TemplateResult } from "lit";
import { until } from 'lit/directives/until.js';
import  {fetchUserById} from '../Services';
import '../components/CommunityCard.js';
import '../components/CommunityContainer.js';
import { StyleInfo } from "lit/directives/style-map.js";

interface ProfileProps {
    currentPath?: string;
}

//functions

export const ProfilePage = ({ currentPath = '/profile' }: ProfileProps): TemplateResult => {
    const userPromise = fetchUserById(1); // hardcoded user id for testing, replace with actual logged in user id

    const userTemplate = until(
        userPromise.then(user => {
            const fullName = user.full_name ?? `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim();
            return html`
                <div class="profile-names">
                    <h4>@${user.username ?? 'Unknown'}</h4>
                    <h5>${fullName || 'No name available'}</h5>
                </div>
            `;
        }),
        html`<div>Loading profile...</div>`
    );

    const styles = css`
        :host{
            display: block;
            background-color: var(--color-3);
        }
        #card {
            margin: 48px;
            background-color: white;
            border-radius: 8px;
            padding: 24px;
        }
        .banner {
            display: flex;
            border-bottom: 1px solid #ccc;
            padding-top: 16px;
            padding-bottom: 16px;
            gap: 16px;
        }
        img#profileImg {
            max-width: 100px;
            height: 100px;
            border-radius: 100%;
        }
    `;

    return html`
      <style>${styles}</style>
      <button @click=${() => window.location.hash = '/'}>&larr; Back</button>
      <div id="card">
        <button @click=${() => window.location.hash = '/profile/edit'}>Edit Profile</button>
        <div class="banner">
          <img id="profileImg" src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg" />
          ${userTemplate}
        </div>
        <div class="lists">
            <h4>My Communities</h4>
            <community-container>
                <community-card></community-card>
                <community-card></community-card> 
                <community-card></community-card>  
                <!-- Ideally the insertion of community card should be in
                 community-container, this is just so we have something for the
                 presentation + testing -->
            </community-container>
            <h4>My Favorites</h4>
            insert widget here
        </div>
      </div>
      <p>${currentPath}</p>
    `;
};

export default ProfilePage;