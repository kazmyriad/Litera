//this is where we would write the frontend for profile
// ---- also where we would likely require having logged in + fetched specific user data
import { html, css, type TemplateResult } from "lit";
import { until } from 'lit/directives/until.js';
import { fetchUserById, updateUserInformation, checkUniqueUsernameEmail } from '../Services';
import '../components/CommunityCard.jsx';
import '../components/CommunityContainer.jsx';
import '../components/AppAlert';
import '../components/successAnimation.jsx';
import '../components/ImagePicker.js';
import { getCurrentUser } from "../Services";

type AlertType = 'success' | 'error' | 'info' | 'warning';

function showSuccessAnimation() {

  let animEl = document.querySelector('success-animation') as any;

  if (!animEl) {
    animEl = document.createElement('success-animation');
    document.body.appendChild(animEl);
  }

  animEl.play?.();

  return animEl;
}

function showAppAlert(message: string, type: AlertType = 'info', autoClose = true) {
  let alertEl = document.querySelector('app-alert') as HTMLElement | null;
  if (!alertEl) {
    alertEl = document.createElement('app-alert');
    document.body.appendChild(alertEl);
  }

  // @ts-ignore: we know this method exists on component
  (alertEl as any).show(message, type, autoClose);
  return alertEl;
}

interface ProfileEditProps {
    currentPath?: string;
}

const USERNAME_REGEX = /^[A-Za-z0-9_]{1,20}$/;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

let userId = null;

function validateProfileInput(username: string, email: string) {
  const errors: string[] = [];
  if (!username) errors.push('Username is required.');
  else if (!USERNAME_REGEX.test(username)) errors.push('Username must be 1-20 chars and only letters, numbers, underscore.');
  if (!email) errors.push('Email is required.');
  else if (!EMAIL_REGEX.test(email)) errors.push('Email format invalid.');
  return errors;
}

export const ProfileEditPage = ({ currentPath = '/profile/edit' }: ProfileEditProps): TemplateResult => {
    const user = getCurrentUser();
    if (!user) {
        return html``; // App.tsx guard handles auth
    }

    const userPromise = fetchUserById(user.id); // hardcoded user id for testing, replace with actual logged in user id

    const formData: { username:string; firstname:string; lastname:string; dob:string; email:string } = {
      username: '', firstname: '', lastname: '', dob: '', email: ''
    };

    let profileImgUrl = '';
    const onImageChanged = (e: CustomEvent) => {
      profileImgUrl = e.detail.value;
    };

    const onInput = (field: keyof typeof formData, event: Event) => {
      const target = event.target as HTMLInputElement;
      formData[field] = target.value;
      console.log(`Input for ${field}:`, target.value);
    };

    const onSave = async () => {
      const errors = validateProfileInput(formData.username, formData.email);
      if (errors.length) {
        showAppAlert(errors.join('\n'), 'error', false);
        return;
      }

      try {
        const json = await checkUniqueUsernameEmail(formData.username, formData.email, user.id);
        if (!json.unique) {
          showAppAlert('Username or email already taken', 'warning', false);
          return;
        }

        const result = await updateUserInformation(user.id, formData.username, formData.firstname, formData.lastname, formData.email, formData.dob);
        if (!result || (result as any).success !== true) {
          throw new Error('Update failed');
        }

        
        const animEl = showSuccessAnimation();
        animEl.addEventListener(
            'finished',
        () => {
            window.location.hash = '/profile';
        },
        { once: true }
        );

      } catch (err) {
        console.error(err);
        showAppAlert('Save failed: ' + ((err as Error).message || err), 'error', false);
      }
    };

    const bannerTemplate = until(
        userPromise.then(user => {
            const userId = Number(user.id);   // important
            formData.username = formData.username || user.username || '';
            const fullName = user.full_name ?? `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim();
            return html`
                <div class="profile-names">
                    <p class="form-label">Username: </p> <input type="text" .value=${formData.username} @input=${(e: Event) => onInput('username', e)} /></label>
                    <p class="form-label">Full Name: </p> <p style="margin:0px; font-style: italic; color: #666;">${fullName || 'No name available'}</p>
                </div>
            `;
        }),
        html`<div>Loading profile...</div>`
    );

    const personalInfoTemplate = until(
        userPromise.then(user => {
            userId = Number(user.id) || 1;   // important
            formData.username = formData.username || user.username || '';
            formData.firstname = formData.firstname || user.firstname || '';
            formData.lastname = formData.lastname || user.lastname || '';
            formData.email = formData.email || user.email || '';
            formData.dob = formData.dob || (user.dob ? String(user.dob).slice(0,10) : '');

              const fullName = user.full_name ?? `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim();
            //const phone = user.phone ?? '';
            return html`
                <div class="info">
                    <div>
                        <p class="form-label">First Name</p>
                        <input type="text" .value=${formData.firstname} @input=${(e: Event) => onInput('firstname', e)} /></label>
                    </div>
                    <div>
                        <p class="form-label">Last Name</p>
                        <input type="text" .value=${formData.lastname} @input=${(e: Event) => onInput('lastname', e)} /></label>
                    </div>
                    <div>
                        <p class="form-label">DOB</p>
                        <input type="date" .value=${formData.dob} @input=${(e: Event) => onInput('dob', e)} /></label>
                    </div>
                    <div>
                        <p class="form-label">Email</p>
                        <input type="email" .value=${formData.email} @input=${(e: Event) => onInput('email', e)} /></label>
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
        image-picker {
            --color-4: #a9bb72;
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
      <button @click=${() => window.location.hash = '/profile'}>&larr; Back</button>
      <div id="card">
        <div class="banner">
          <div style="display:flex; flex-direction:column; gap:6px; align-items:center;">
            <image-picker
              value="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg"
              style="width:160px; display:block;"
              @image-changed=${onImageChanged}
            ></image-picker>
          </div>
          ${bannerTemplate}
        </div>

        <div class="personal-info">
          ${personalInfoTemplate}
          <button @click=${onSave}>
            Save Changes
        </button>
        </div>
       
      </div>
      <p>${currentPath}</p>
    `;
};

export default ProfileEditPage;