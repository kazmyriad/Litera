import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './successAnimation.jsx'; 
import { setCurrentUser, createUser, loginUser, checkUniqueField } from '../Services.js';

interface PasswordChecks {
  length: boolean;
  upper: boolean;
  number: boolean;
  symbol: boolean;
}

@customElement('auth-overlay')
export class AuthOverlay extends LitElement {

  /* ------------------------- Public properties ------------------------- */

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) mode: 'login' | 'register' | '' = '';
  @property({ type: Boolean }) showSuccess = false;

  /* ------------------------- Login fields ------------------------- */

  @state() private loginIdentifier = '';
  @state() private password = '';

  /* ------------------------- Register fields ------------------------- */

  @state() private firstname = '';
  @state() private lastname = '';
  @state() private dob: string | null = null;
  @state() private username = '';
  @state() private email = '';
  @state() private confirmPassword = '';

  /* ------------------------- UI state ------------------------- */

  @state()
  private passwordChecks: PasswordChecks = {
    length: false,
    upper: false,
    number: false,
    symbol: false,
  };

  @state() private showPasswordChecks = false;
  @state() private showConfirmChecks = false;
  @state() private usernameError = '';
  @state() private emailError = '';
  @state() private submitError = '';

  /* ------------------------- Styles ------------------------- */

  static styles = css`
    :host {
      display: none;
    }
    :host([open]) {
      display: block;
    }

    .modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      box-sizing: border-box;
    }

    .panel {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      width: min(400px, 90vw);
      max-height: 90dvh;
      overflow-y: auto;
      box-sizing: border-box;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      padding-bottom: 24px;
      box-sizing: border-box;
    }

    input{
      border: none;
      background-color: #dce7d2;
      color: var(--color-5);
      font-weight: bold;
      padding: 1em;
      border-radius: 20px;
    }

    input::placeholder{
      color: #afbda2;
      font-weight: normal;
    }

    .required::after {
      content: ' *';
      color: red;
    }

    button{
      border: none;
      background: linear-gradient(135deg, var(--color-4) 0%, var(--color-5) 100%);
      border-radius: 12px;
      font-weight: bold;
      font-size: 1.2em;
      color: white;
      padding: 12px 24px;
      transition: all 0.3s ease;
      width: 100%;
      margin: 0 auto;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
    }

    button:hover{
      background: linear-gradient(135deg, var(--color-5) 0%, var(--color-4) 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }

    button.exit {
      width: 1em;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-3);
      color: var(--color-3);
      height: 1em;
      padding: 1em;
      font-size: 1em;
      float: right;
      transition: 0.3s ease;

    }

    button.exit:hover{
      background-color: var(--color-2);
      transition: 0.3s ease;
    }

    img{
      width: 2em;
      transform: rotate(180deg);
    }


    .wrapper {
      font-size: 10px;
      color: #666;
      font-style: italic;
    }

    .field-error {
      font-size: 10px;
      color: red;
      font-style: italic;
      margin: -6px 0 0 0;
    }

    .submit-error {
      font-size: 12px;
      color: red;
      text-align: center;
      margin: 0;
    }
  `;

  /* ------------------------- Helpers ------------------------- */

  private close = () => {
    console.log("auth closed");
    this.open = false;
    this.showSuccess = false;
    this.resetForm();
  };

  private onBackdropClick(e: MouseEvent) {
    console.log("buttonClicked");
    if (e.target === e.currentTarget) {
      this.close();
    }
  } 


  private resetForm() {
    this.loginIdentifier = '';
    this.firstname = '';
    this.lastname = '';
    this.dob = null;
    this.username = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';

    this.passwordChecks = {
      length: false,
      upper: false,
      number: false,
      symbol: false,
    };

    this.showPasswordChecks = false;
    this.showConfirmChecks = false;
    this.usernameError = '';
    this.emailError = '';
    this.submitError = '';

    this.renderRoot.querySelector('form')?.reset();
  }

  /* ------------------------- Password validation ------------------------- */

  private passwordCheck(e: Event) {
    const value = (e.target as HTMLInputElement).value;

    this.password = value;
    this.passwordChecks = {
      length: value.length >= 8,
      upper: /[A-Z]/.test(value),
      number: /[0-9]/.test(value),
      symbol: /[!@#$%&?><]/.test(value),
    };
  }

  /* ------------------------- Uniqueness checks ------------------------- */

  private async checkUsername() {
    if (!this.username) return;
    try {
      const { conflicts } = await checkUniqueField({ username: this.username });
      const taken = conflicts.some(c => c.username?.toLowerCase() === this.username.toLowerCase());
      this.usernameError = taken ? 'Username is already taken' : '';
    } catch { /* ignore network errors */ }
  }

  private async checkEmail() {
    if (!this.email) return;
    try {
      const { conflicts } = await checkUniqueField({ email: this.email });
      const taken = conflicts.some(c => c.email?.toLowerCase() === this.email.toLowerCase());
      this.emailError = taken ? 'Email is already in use' : '';
    } catch { /* ignore network errors */ }
  }

  /* ------------------------- Login ------------------------- */

  private async handleLogin(e: SubmitEvent) {
    e.preventDefault();

    try {
      const result = await loginUser({
        identifier: this.loginIdentifier,
        password: this.password,
      });

      setCurrentUser(result.user);

      this.open = false;
      this.resetForm();

      window.location.hash = '/profile';
    } catch (err) {
      console.error('Login failed:', err);
    }
  }

  /* ------------------------- Register ------------------------- */

  private async handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    if (this.password !== this.confirmPassword) return;
    if (!Object.values(this.passwordChecks).every(Boolean)) return;
    if (this.usernameError || this.emailError) return;

    this.submitError = '';

    try {
      await createUser({
        firstname: this.firstname,
        lastname: this.lastname,
        dob: this.dob,
        username: this.username,
        email: this.email,
        password: this.password,
      });

      this.showSuccess = true;

      await this.updateComplete;
      (this.renderRoot.querySelector('success-animation') as any)?.play();
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.toLowerCase().includes('username')) {
        this.usernameError = 'Username is already taken';
      } else if (msg.toLowerCase().includes('email')) {
        this.emailError = 'Email is already in use';
      } else if (msg.toLowerCase().includes('already in use')) {
        this.usernameError = 'Username is already taken';
        this.emailError = 'Email is already in use';
      } else {
        this.submitError = 'Something went wrong. Please try again.';
      }
    }
  }

  /* ------------------------- Renderers ------------------------- */

  private renderForm() {
    if (this.mode === 'login') {
      return html`
        <button class="exit" @click=${this.close}>x</button>
        <h2>Login</h2>
        <form @submit=${this.handleLogin}>
          <input
            placeholder="Username or Email"
            required
            @input=${(e: Event) =>
              this.loginIdentifier = (e.target as HTMLInputElement).value}
          />
          <input
            type="password"
            placeholder="Password"
            required
            @input=${(e: Event) =>
              this.password = (e.target as HTMLInputElement).value}
          />
          <button type="submit">Login</button>
        </form>
      `;
    }

    return html`
      <button class="exit" @click=${this.close}>x</button>
      <h2>Create Account</h2>
      <form @submit=${this.handleSubmit}>
        <label class="required">Name</label>
        <div style="display:flex;gap:12px">
          <input placeholder="First" required
            @input=${(e: Event) =>
              this.firstname = (e.target as HTMLInputElement).value} />
          <input placeholder="Last" required
            @input=${(e: Event) =>
              this.lastname = (e.target as HTMLInputElement).value} />
        </div>

        <label class="required">Date of Birth</label>
        <input type="date" required
          @input=${(e: Event) =>
            this.dob = (e.target as HTMLInputElement).value} />

        <label class="required">Email</label>
        <input required
          @input=${(e: Event) => { this.email = (e.target as HTMLInputElement).value; this.emailError = ''; }}
          @blur=${() => this.checkEmail()} />
        ${this.emailError ? html`<p class="field-error">${this.emailError}</p>` : null}

        <label class="required">Username</label>
        <input required
          @input=${(e: Event) => { this.username = (e.target as HTMLInputElement).value; this.usernameError = ''; }}
          @blur=${() => this.checkUsername()} />
        ${this.usernameError ? html`<p class="field-error">${this.usernameError}</p>` : null}

        <label class="required">Password</label>
        <input
          type="password"
          @focus=${() => this.showPasswordChecks = true}
          @input=${this.passwordCheck}
        />

        ${this.showPasswordChecks ? html`
          <div class="wrapper">
            <p style="color:${this.passwordChecks.length ? 'green':'red'}">
              At least 8 characters
            </p>
            <p style="color:${this.passwordChecks.upper ? 'green':'red'}">
              Uppercase letter
            </p>
            <p style="color:${this.passwordChecks.number ? 'green':'red'}">
              Number
            </p>
            <p style="color:${this.passwordChecks.symbol ? 'green':'red'}">
              Special character
            </p>
          </div>
        ` : null}

        <input
          type="password"
          placeholder="Confirm Password"
          @focus=${() => this.showConfirmChecks = true}
          @input=${(e: Event) =>
            this.confirmPassword = (e.target as HTMLInputElement).value}
        />

        ${this.showConfirmChecks ? html`
          <p style="color:${this.password === this.confirmPassword ? 'green' : 'red'}; font-size:10px">
            ${this.password === this.confirmPassword
              ? 'Passwords match'
              : 'Passwords do not match'}
          </p>
        ` : null}

        ${this.submitError ? html`<p class="submit-error">${this.submitError}</p>` : null}
        <button type="submit">Create Account</button>
      </form>
    `;
  }

  render() {
    return html`
      <div class="modal" @mousedown=${this.onBackdropClick}>
        <div class="panel" @click=${(e: Event) => e.stopPropagation()}>
          ${this.showSuccess
            ? html`<success-animation></success-animation>`
            : this.renderForm()}
        </div>
      </div>
    `;
  }
}