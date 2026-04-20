import { html, css, type TemplateResult } from 'lit';
import '../components/PillButton.js';
import { createCommunity, getCurrentUser, type Categories } from '../Services.js';
import '../components/successAnimation.jsx';
import type { PillButton } from '../components/PillButton.ts';
import { VALID_CATEGORIES, formatCategoryName } from '../constants.js';

interface ComProps {
  currentPath?: string;
}

export const CommunityCreationPage = ({
  currentPath = '/communities/create-community'
}: ComProps): TemplateResult => {

  const styles = css`
    :host {
      display: block;
    }

    /* Banner */
    .banner {
      background-color: var(--color-5);
      margin: 24px auto;
      text-align: center;
      color: white;
      width: fit-content;
      border-radius: 12px;
    }

    .banner h1 {
      padding: 24px 64px;
      margin: 0;
    }

    /* Main content wrapper */
    .content {
      justify-items: center;
      margin: 0px 120px;
    }

    .subsec {
      margin-bottom: 56px;
      width: 100%;
    }

    /* Section headers */
    .subhead {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-left: 48px;
      margin-bottom: 16px;
    }

    .num {
      background-color: var(--color-4);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      color: white;
      display: grid;
      place-items: center;
      line-height: 0px;
    }

    /* Inputs layout */
    .inputs {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      margin: 0px 48px;
      padding-left: 48px;
    }

    .label {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    input, select {
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #ccc;
      font-size: 0.95rem;
    }

    input[type="checkbox"] {
      margin-right: 6px;
    }
    /* Rules layout */
    .rules {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
    }

    /* Footer button */
    .submit {
      display: flex;
      justify-content: flex-end;
      margin: 48px 120px 96px;
    }

    button {
      background-color: var(--color-4);
      color: white;
      padding: 12px 32px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }

    button:hover {
      opacity: 0.9;
    }
  `;

  // Closure state — updated by @input/@change handlers so handleSubmit
  // never has to query the DOM (which would fail inside shadow DOM).
  let nameValue = '';
  let descriptionValue = '';
  let visibilityValue = 'public';
  let colorSchemeValue = 'default';
  let thumbnailValue = '';
  const rulesState = {
    allowProfanity: false,
    ageRestricted: false,
    spamProtection: true,
    allowImages: false,
    autoBan: false,
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    try {
      // pill-button elements live inside the app-root shadow root;
      // document.querySelectorAll cannot pierce it.
      const shadowRoot = document.querySelector('app-root')?.shadowRoot ?? document;
      const pills = Array.from(shadowRoot.querySelectorAll('pill-button')) as PillButton[];
      const categories = pills
        .filter(p => p.selected)
        .map(p => p.category as any) as Categories;

      const user = getCurrentUser();
      if (!user) {
        alert('You must be logged in to create a community');
        return;
      }

      await createCommunity({
        name: nameValue || 'New Community',
        description: descriptionValue,
        categories,
        visibility: visibilityValue as 'public' | 'private',
        rules: rulesState,
        colorScheme: colorSchemeValue,
        thumbnailUrl: thumbnailValue,
        ownerId: user.id
      });

      const successAnim = document.createElement('success-animation');

      successAnim.addEventListener('finished', () => {
        window.location.href = '#/communities';
      });

      document.body.appendChild(successAnim);

      await customElements.whenDefined('success-animation');

      (successAnim as any).play();

    } catch(e) {
      console.error(e);
    }
  };

  return html`
    <style>${styles}</style>

    <!-- Banner -->
    <div class="banner">
      <h1>Create a New Community</h1>
    </div>

    <div class="content">

      <!-- 1. General Info -->
      <div class="subsec">
        <div class="subhead">
          <div class="num"><h4>1</h4></div>
          <h3>General Information</h3>
        </div>

        <div class="inputs">
          <div class="label">
            <h5>Owner</h5>
            <input disabled placeholder="${getCurrentUser()?.username || 'Username'}" style="width: 16vw" />
          </div>

          <div class="label">
            <h5>Community Name*</h5>
            <input
              placeholder="Community Name"
              style="width: 30vw"
              @input=${(e: Event) => { nameValue = (e.target as HTMLInputElement).value; }}
            />
          </div>

          <div class="label" style="flex: 1;">
            <h5>Description</h5>
            <input
              placeholder="Describe your community"
              style="width: 46vw"
              @input=${(e: Event) => { descriptionValue = (e.target as HTMLInputElement).value; }}
            />
          </div>
        </div>
      </div>

      <!-- 2. Categories -->
      <div class="subsec">
        <div class="subhead">
          <div class="num"><h4>2</h4></div>
          <h3>Choose Categories</h3>
          <p>(up to 5)</p>
        </div>

        <div class="inputs">
            ${VALID_CATEGORIES.map(
                category => html`
                    <pill-button class="pill" .category=${category}> ${formatCategoryName(category)}</pill-button>
                `
            )}
        </div>

      </div>

      <!-- 3. Rules -->
      <div class="subsec">
        <div class="subhead">
          <div class="num"><h4>3</h4></div>
          <h3>Rules & Privileges</h3>
        </div>

        <div class="inputs">
          <div class="label">
            <h5>Visibility*</h5>
            <select name="visibility" @change=${(e: Event) => { visibilityValue = (e.target as HTMLSelectElement).value; }}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div class="label">
            <h5>Community Guidelines</h5>
            <div class="rules">
              <label><input type="checkbox" @change=${(e: Event) => { rulesState.allowProfanity = (e.target as HTMLInputElement).checked; }} /> Allow Profanity</label>
              <label><input type="checkbox" @change=${(e: Event) => { rulesState.ageRestricted = (e.target as HTMLInputElement).checked; }} /> 18+ Age Restriction</label>
              <label><input type="checkbox" .checked=${true} @change=${(e: Event) => { rulesState.spamProtection = (e.target as HTMLInputElement).checked; }} /> Spam Protection</label>
              <label><input type="checkbox" @change=${(e: Event) => { rulesState.allowImages = (e.target as HTMLInputElement).checked; }} /> Allow Image Sending</label>
              <label><input type="checkbox" @change=${(e: Event) => { rulesState.autoBan = (e.target as HTMLInputElement).checked; }} /> Auto-Ban</label>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Personalization -->
      <div class="subsec">
        <div class="subhead">
          <div class="num"><h4>4</h4></div>
          <h3>Personalize</h3>
        </div>

        <div class="inputs">
          <div class="label">
            <h5>Color Scheme</h5>
            <select name="colorScheme" @change=${(e: Event) => { colorSchemeValue = (e.target as HTMLSelectElement).value; }}>
              <option value="default">Default</option>
              <option value="dark">Dark</option>
              <option value="ocean">Ocean</option>
              <option value="forest">Forest</option>
              <option value="sunset">Sunset</option>
            </select>
          </div>

          <div class="label">
            <h5>Thumbnail</h5>
            <input
              placeholder="Paste image URL"
              style="width: 30vw"
              @input=${(e: Event) => { thumbnailValue = (e.target as HTMLInputElement).value; }}
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Submit -->
    <div class="submit">
      <button @click=${handleSubmit}>Create Community</button>
    </div>
  `;
};

export default CommunityCreationPage;
