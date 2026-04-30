//this is where we would write the frontend for profile
// ---- also where we would likely require having logged in + fetched specific user data
import { html, css, type TemplateResult } from "lit";
import { until } from 'lit/directives/until.js';
import { fetchUserById, updateUserInformation, checkUniqueUsernameEmail, setCurrentUser, deleteUser, logout } from '../Services';
import '../components/CommunityCard.jsx';
import '../components/CommunityContainer.jsx';
import '../components/AppAlert';
import '../components/successAnimation.jsx';
import '../components/ImagePicker.js';
import { getCurrentUser } from "../Services";
import { VALID_CATEGORIES, formatCategoryName } from '../constants';

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

function validateProfileInput(username: string, email: string) {
  const errors: string[] = [];
  if (!username) errors.push('Username is required.');
  else if (!USERNAME_REGEX.test(username)) errors.push('Username must be 1-20 chars and only letters, numbers, underscore.');
  if (!email) errors.push('Email is required.');
  else if (!EMAIL_REGEX.test(email)) errors.push('Email format invalid.');
  return errors;
}

export const ProfileEditPage = (_props: ProfileEditProps): TemplateResult => {
    const user = getCurrentUser();
    if (!user) {
        return html``; // App.tsx guard handles auth
    }

    const userPromise = fetchUserById(user.id);

    const formData: { username:string; firstname:string; lastname:string; dob:string; email:string; bio:string } = {
      username: '', firstname: '', lastname: '', dob: '', email: '', bio: ''
    };

    let profileImgUrl = '';           // updated by image-picker; initialized once user data loads
    let selectedInterests: string[] = [];

    const onImageChanged = (e: CustomEvent) => {
      profileImgUrl = e.detail.value;
    };

    const onInput = (field: keyof typeof formData, event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      formData[field] = target.value;
    };

    const onBioInput = (event: Event) => {
      const target = event.target as HTMLTextAreaElement;
      if (target.value.length > 250) target.value = target.value.slice(0, 250);
      formData.bio = target.value;
      const counter = target.closest('.bio-wrapper')?.querySelector('.bio-counter') as HTMLElement | null;
      if (counter) counter.textContent = `${formData.bio.length}/250`;
    };

    const toggleInterest = (interest: string, chipEl: HTMLElement) => {
      const idx = selectedInterests.indexOf(interest);
      if (idx === -1) {
        selectedInterests.push(interest);
        chipEl.classList.add('selected');
      } else {
        selectedInterests.splice(idx, 1);
        chipEl.classList.remove('selected');
      }
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

        const result = await updateUserInformation(
          user.id,
          formData.username,
          formData.firstname,
          formData.lastname,
          formData.email,
          formData.dob,
          profileImgUrl || undefined,
          formData.bio || undefined,
          selectedInterests.length ? selectedInterests : undefined,
        );

        if (!result || (result as any).success !== true) {
          throw new Error('Update failed');
        }

        setCurrentUser({
          id: user.id,
          username: formData.username || user.username,
          email: formData.email || user.email,
          avatarUrl: profileImgUrl || (result as any).user?.avatarUrl || user.avatarUrl,
        });

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

    const showDeleteConfirm = () => {
      const panel = document.getElementById('delete-confirm-panel') as HTMLElement;
      if (panel) panel.style.display = 'flex';
    };

    const hideDeleteConfirm = () => {
      const panel = document.getElementById('delete-confirm-panel') as HTMLElement;
      if (panel) panel.style.display = 'none';
    };

    const onDeleteAccount = async () => {
      try {
        await deleteUser(user.id);
        logout();
        window.location.hash = '/';
      } catch (err) {
        hideDeleteConfirm();
        showAppAlert('Failed to delete account: ' + ((err as Error).message || err), 'error', false);
      }
    };

    const imagePickerTemplate = until(
        userPromise.then(user => {
            const avatarUrl = user.avatarUrl || user.avatar_url || '';
            if (avatarUrl && !profileImgUrl) profileImgUrl = avatarUrl;
            return html`
                <image-picker
                    .value=${avatarUrl}
                    style="width:160px; display:block;"
                    @image-changed=${onImageChanged}
                ></image-picker>
            `;
        }),
        html`<image-picker style="width:160px; display:block;" @image-changed=${onImageChanged}></image-picker>`
    );

    const bannerTemplate = until(
        userPromise.then(user => {
            formData.username = formData.username || user.username || '';
            formData.bio = formData.bio || user.bio || '';
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
            formData.username = formData.username || user.username || '';
            formData.firstname = formData.firstname || user.firstname || '';
            formData.lastname = formData.lastname || user.lastname || '';
            formData.email = formData.email || user.email || '';
            formData.dob = formData.dob || (user.dob ? String(user.dob).slice(0,10) : '');
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
                </div>
            `;
        }),
        html`<div>Loading profile...</div>`
    );

    const bioTemplate = until(
        userPromise.then(user => {
            formData.bio = formData.bio || user.bio || '';
            return html`
                <div class="bio-wrapper">
                    <p class="form-label">Short Bio</p>
                    <textarea
                        maxlength="250"
                        .value=${formData.bio}
                        @input=${onBioInput}
                        placeholder="Tell others a little about yourself…"
                        rows="3"
                    ></textarea>
                    <span class="bio-counter">${formData.bio.length}/250</span>
                </div>
            `;
        }),
        html``
    );

    const interestsTemplate = until(
        userPromise.then(user => {
            const saved: string[] = Array.isArray(user.interests) ? user.interests : [];
            selectedInterests = [...saved];
            return html`
                <div class="interests-section">
                    <p class="form-label">Interests <span style="font-weight:normal; color:#999;">(tap to select)</span></p>
                    <div class="interests-chips">
                        ${VALID_CATEGORIES.map(cat => html`
                            <span
                                class="interest-chip ${saved.includes(cat) ? 'selected' : ''}"
                                @click=${(e: Event) => toggleInterest(cat, e.currentTarget as HTMLElement)}
                            >${formatCategoryName(cat)}</span>
                        `)}
                    </div>
                </div>
            `;
        }),
        html``
    );

    const styles = css`
        :host{
            display: block;
        }
        .card {
            margin: 48px;
            border-radius: 8px;
        }
        .banner, .personal-info, .lists {
            display: flex;
            background-color: white;
            border-bottom: 1px solid #ccc;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
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
          gap: 20px;
        }
        h4 {
            margin: 0;
        }
        image-picker {
            --color-4: #a9bb72;
        }
        .card button {
            background: #a9bb72;
            border: none;
            padding: 6px 8px;
            height: fit-content;
            border-radius: 4px;
        }
        .card button:hover {
            cursor: pointer;
            opacity: 0.7;
         }
        .bio-wrapper {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 100%;
        }
        .bio-wrapper textarea {
            resize: vertical;
            border: 1px solid #ccc;
            border-radius: 6px;
            padding: 8px;
            font-family: inherit;
            font-size: 0.95rem;
            line-height: 1.4;
            width: 100%;
            box-sizing: border-box;
        }
        .bio-wrapper textarea:focus {
            outline: 2px solid #a9bb72;
            border-color: transparent;
        }
        .bio-counter {
            font-size: 0.75rem;
            color: #999;
            text-align: right;
        }
        .interests-section {
            width: 100%;
        }
        .interests-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }
        .interest-chip {
            padding: 5px 14px;
            border-radius: 25px;
            border: 2px solid #646d4a;
            color: #646d4a;
            background: transparent;
            font-size: 0.875rem;
            cursor: pointer;
            user-select: none;
            transition: background 0.15s, color 0.15s;
        }
        .interest-chip.selected {
            background: #646d4a;
            color: #ece0d5;
        }
        .interest-chip:hover {
            opacity: 0.8;
        }
        .danger-zone {
            display: flex;
            justify-content: flex-end;
            padding: 24px 0 8px;
        }
        button.delete-account-btn {
            background-color: white;
            border: 2px solid var(--color-6);
            color: var(--color-6);
            padding: 8px 18px;
            border-radius: 6px;
            font-size: 0.875rem;
            cursor: pointer;
            transition: 0.15s, color 0.15s;
        }
        .delete-account-btn:hover {
            background: var(--color-6);
            color: white;
        }
        .confirm-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.45);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .confirm-dialog {
            background: white;
            border-radius: 10px;
            padding: 32px 28px 24px;
            width: min(420px, 90vw);
            box-shadow: 0 8px 32px rgba(0,0,0,0.22);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .confirm-dialog h3 {
            margin: 0;
            font-size: 1.1rem;
            color: var(--color-6);
        }
        .confirm-dialog p {
            margin: 0;
            font-size: 0.9rem;
            color: #555;
            line-height: 1.5;
        }
        .confirm-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 8px;
        }
        .confirm-cancel {
            background: transparent;
            border: 1.5px solid #ccc;
            color: #666;
            padding: 7px 18px;
            border-radius: 6px;
            font-size: 0.875rem;
            cursor: pointer;
        }
        .confirm-cancel:hover { background: #f0f0f0; }
        .confirm-delete {
            background: var(--color-6);
            border: none;
            color: white;
            padding: 7px 18px;
            border-radius: 6px;
            font-size: 0.875rem;
            cursor: pointer;
        }
        .confirm-delete:hover { opacity: 0.85; }
    `;

    return html`
      <style>${styles}</style>
      <button style="margin: 16px 24px; background: transparent; color: var(--color-5); border: none; font-size: 1rem; cursor: pointer; padding: 6px 0;"
        @click=${() => window.location.hash = '/profile'}>&larr; Back</button>
      <div class="card">
        <div class="banner">
          <div style="display:flex; flex-direction:column; gap:6px; align-items:center;">
            ${imagePickerTemplate}
          </div>
          ${bannerTemplate}
        </div>

        <div class="personal-info">
          ${personalInfoTemplate}
          <button @click=${onSave}>
            Save Changes
          </button>
        </div>

        <div class="lists">
          ${bioTemplate}
          ${interestsTemplate}
          <div class="danger-zone">
            <button class="delete-account-btn" @click=${showDeleteConfirm}>Delete Account</button>
          </div>
        </div>

      </div>

      <div id="delete-confirm-panel" class="confirm-backdrop" style="display:none;">
        <div class="confirm-dialog">
          <h3>Delete account?</h3>
          <p>This is permanent and cannot be undone. Your profile, shelves, and all activity will be removed.</p>
          <div class="confirm-actions">
            <button class="confirm-cancel" @click=${hideDeleteConfirm}>Cancel</button>
            <button class="confirm-delete" @click=${onDeleteAccount}>Delete Account</button>
          </div>
        </div>
      </div>
    `;
};

export default ProfileEditPage;
