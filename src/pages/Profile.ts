//this is where we would write the frontend for profile
// ---- also where we would likely require having logged in + fetched specific user data
import { html, css, type TemplateResult } from "lit";
import { until } from 'lit/directives/until.js';
import  {fetchUserById} from '../Services';
import '../components/CommunityCard.js';
import '../components/CommunityContainer.js';
import '../components/BookCard.js';
import '../components/Breadcrumb.js';
import '../components/ProfileTag.js';
import EditIcon from '../images/Edit.svg';


interface ProfileProps {
    currentPath?: string;
}

//functions

export const ProfilePage = ({ currentPath = '/profile' }: ProfileProps): TemplateResult => {
    const userPromise = fetchUserById(1); // hardcoded user id for testing, replace with actual logged in user id

    const bannerTemplate = until(
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

    const personalInfoTemplate = until(
        userPromise.then(user => {
            const firstName = user.firstname ?? '';
            const lastName = user.lastname ?? '';
            const dob = user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A';
            const email = user.email ?? '';
            //const phone = user.phone ?? '';
            return html`
                <div class="info">
                    <div>
                        <p class="form-label">First Name</p>
                        <p>${firstName}</p>
                    </div>
                    <div>
                        <p class="form-label">Last Name</p>
                        <p>${lastName}</p>
                    </div>
                    <div>
                        <p class="form-label">DOB</p>
                        <p>${dob}</p>
                    </div>
                    <div>
                        <p class="form-label">Email</p>
                        <p>${email}</p>
                    </div>
                    <!-- <p>Phone: </p> -->
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
            border-radius: 8px;
        }
        .banner, .personal-info, .lists {
            display: flex;
            background-color: white;
            border-bottom: 1px solid #ccc;
            border-radius: 8px;
            padding: 16px;
            gap: 24px;
            margin-bottom: 16px;
        }
        .personal-info {
            justify-content: space-between;
        }
        .info {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
        }
        p.form-label {
            font-weight: lighter;
                color: #666;
            font-size: 0.8em;
        }
        .lists {
            flex-direction: column;
        }
        img#profileImg {
            max-width: 100px;
            height: 100px;
            border-radius: 100%;
        }
        #card button {
            background: #a9bb72;
            border: none;
            padding: 6px 8px;
            height: fit-content;
            border-radius: 4px;
        }
        #card button:hover {
            cursor: pointer;
            opacity: 0.7;
         }
    `;

    return html`
      <style>${styles}</style>
      <bread-crumb></bread-crumb>
      <div id="card">
        <h2>My Profile</h2>
        <div class="banner">
          <img id="profileImg" src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg" />
          ${bannerTemplate}
        </div>

        <div class="personal-info">
          ${personalInfoTemplate}
          <button @click=${() => window.location.hash = '/profile/edit'}>
            <img src="${EditIcon}" alt="Edit Profile" width="16" height="16" />
        </button>
        </div>

        <div class="lists">
            <h4>My Interests</h4>
                <li style="list-style: none; display:flex; gap: 25px 5px; flex-wrap: wrap;">
                    <profile-tag text="Book"></profile-tag>
                    <profile-tag text="Series"></profile-tag>
                    <profile-tag text="Author"></profile-tag>
                    <profile-tag text="IP"></profile-tag>
                    <profile-tag text="Reading"></profile-tag>
                    <profile-tag text="Learning"></profile-tag>
                    <profile-tag text="Painting"></profile-tag>
                    <profile-tag text="Cooking"></profile-tag>
                </li>
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
            <community-container>
                <book-card></book-card>
                <book-card></book-card>
                <book-card></book-card>
            </community-container>
        </div>
      </div>
      <p>${currentPath}</p>
    `;
};

export default ProfilePage;