//this is where we would write the frontend for profile
// ---- also where we would likely require having logged in + fetched specific user data
import { html, css, type TemplateResult } from "lit";
import { until } from 'lit/directives/until.js';
import { fetchUserById, updateUserInformation, checkUniqueUsernameEmail } from '../Services';

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

export const ProfileEditPage = ({ currentPath = '/profile/edit' }: ProfileEditProps): TemplateResult => {
    let userId = 1;

    const userPromise = fetchUserById(1); // hardcoded user id for testing, replace with actual logged in user id

    const formData: { username:string; firstname:string; lastname:string; dob:string; email:string } = {
      username: '', firstname: '', lastname: '', dob: '', email: ''
    };

    const onInput = (field: keyof typeof formData, event: Event) => {
      const target = event.target as HTMLInputElement;
      formData[field] = target.value;
      console.log(`Input for ${field}:`, target.value);
    };

    const onSave = async () => {
      const errors = validateProfileInput(formData.username, formData.email);
      if (errors.length) {
        alert(errors.join('\n'));
        return;
      }

      try {
        const json = await checkUniqueUsernameEmail(formData.username, formData.email, userId);
        if (!json.unique) {
          alert('Username or email already taken');
          return;
        }

        const result = await updateUserInformation(userId, formData.username, formData.firstname, formData.lastname, formData.email, formData.dob);
        if (!result || (result as any).success !== true) {
          throw new Error('Update failed');
        }

        alert('Profile saved');
      } catch (err) {
        console.error(err);
        alert('Save failed: ' + ((err as Error).message || err));
      }
    };

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
        <div class="banner">
          <img id="profileImg" src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg" />
          ${until(
            userPromise.then(user => {
              userId = Number(user.id) || 1;   // important
              formData.username = formData.username || user.username || '';
              formData.firstname = formData.firstname || user.firstname || '';
              formData.lastname = formData.lastname || user.lastname || '';
              formData.email = formData.email || user.email || '';
              formData.dob = formData.dob || (user.dob ? String(user.dob).slice(0,10) : '');

              const fullName = user.full_name ?? `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim();
              return html`
                <div class="profile-names">
                  <label>Username: <input type="text" .value=${formData.username} @input=${(e: Event) => onInput('username', e)} /></label>
                  <label>First Name: <input type="text" .value=${formData.firstname} @input=${(e: Event) => onInput('firstname', e)} /></label>
                  <label>Last Name: <input type="text" .value=${formData.lastname} @input=${(e: Event) => onInput('lastname', e)} /></label>
                  <label>Email: <input type="email" .value=${formData.email} @input=${(e: Event) => onInput('email', e)} /></label>
                  <label>DOB: <input type="date" .value=${formData.dob} @input=${(e: Event) => onInput('dob', e)} /></label>
                </div>
              `;
            }),
            html`<div>Loading profile...</div>`
          )}
           <button @click=${onSave}>Save Changes</button>
        </div>
        <div class="lists">
            <h4>My Communities</h4>
            insert widget here
            <h4>My Favorites</h4>
            insert widget here
        </div>
       
      </div>
      <p>${currentPath}</p>
    `;
};

export default ProfileEditPage;