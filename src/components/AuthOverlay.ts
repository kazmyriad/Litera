import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './successAnimation.jsx'; 
import { setCurrentUser, createUser, loginUser } from '../Services.js';

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
    }

    .panel {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      min-width: 320px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 80vh;
      padding-bottom: 24px;
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
      background-color: var(--color-4);
      border-radius: 2em;
      font-weight: bold;
      font-size: 2em;
      color: var(--color-5);
      padding: 1em 0 1em 0;
      transition: 0.3s ease;
      width: 50%;
      margin: 0 auto;
    }

    button:hover{
      color: var(--color-3);
      transition: 0.3s ease;
      width: 100%;
    }

    button.exit {
      width: 1em;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-3);
      color: var(--color-2);
      height: 1em;
      padding: 1em;
      font-size: 1em;
      float: right;
      transition: 0.3s ease;

    }

    button.exit:hover{
      color: var(--color-1);
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
    } catch (err) {
      console.error('Account creation failed:', err);
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
          @input=${(e: Event) =>
            this.email = (e.target as HTMLInputElement).value} />

        <label class="required">Username</label>
        <input required
          @input=${(e: Event) =>
            this.username = (e.target as HTMLInputElement).value} />

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