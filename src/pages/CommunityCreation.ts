//this is where we would write the frontend for communities
// ---- would also need to use sql-related variables to load in communities (likely through a map)
import { html, css, type TemplateResult } from "lit";
import '../components/SearchBar.js';
import '../components/CommunityCard.js';
import '../components/CommunityContainer.js';

interface ComProps {
    currentPath?: string;
}

export const CommunityCreationPage = ({ currentPath = '/communities/create-community' }: ComProps): TemplateResult => {
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
            justify-items: center;
            margin: 0px 120px;
        }

        div.subsec {
            margin-bottom: 48px;
            width: 100%;
        }
        div.subhead {
            display: flex;
            align-items: center;
            gap: 24px;
            margin-left: 48px;
        }
        .label {
            line-height: 0px;
        }
        .inputs {
            display: flex;
            flex-wrap: wrap;
            gap: 0px 24px;
            margin: 0px 48px;
            padding-left: 48px;
        }
        .num {
            background-color: var(--color-4);
            width: 48px;
            height: 48px;
            text-align: center;
            align-content: center;
            border-radius: 24px;
            color: white;
        }
        button {
            justify-self: end;
        }
    `
    return html`
        <style>${styles}</style>
        <div class="banner">
            <h1 style="padding: 24px 64px;">Create a New Community</h1>
        </div>

        <div class="content">
            <!--1, General Information-->
            <div class="subsec">
                <div class="subhead">
                    <div class="num"><h4 style="line-height: 0px">1</h4></div>
                    <h3>General Information</h3>
                </div>

                <div class="inputs">
                    <div class="label">
                        <h5>Owner*</h5>
                        <input placeholder="UserName" style="width: 16vw">
                    </div>
                    <div class="label">
                        <h5>Community Name*</h5>
                        <input placeholder="Community Name" style="width: 30vw">
                    </div>
                    <div class="label">
                        <h5>Description*</h5>
                        <input type="text" placeholder="Describe your community here" style="width: 46vw;">
                    </div>
                </div>
            </div>
            
            <!--2, Choose Categories-->
            <div class="subsec">
                <div class="subhead">
                    <div class="num"><h4 style="line-height: 0px">2</h4></div>
                    <h3>Choose Categories</h3>
                    <p>choose up to 5</p>
                </div>

                <div class="inputs">
                    <div>Fantasy</div>
                    <div>Sci-Fi</div>
                    <div>Romance</div>
                    <div>Non-Fiction</div>
                    <div>Fiction</div>
                    <div>Horror</div>
                </div>
            </div>
            
            <!--3, Choose Categories-->
            <div class="subsec">
                <div class="subhead">
                    <div class="num"><h4 style="line-height: 0px">3</h4></div>
                    <h3>Rules & Privileges</h3>
                </div>

                <div class="inputs">
                    <div class="label">
                        <h5>Visibility*</h5>
                        <select>
                            <option>Private</option>
                            <option>Public</option>
                        </select>
                    </div>
                    <div>
                        <p>**NOTE: Selecting "public" will require an additional review and approval process.</p>
                    </div>
                    <div class="label">
                        <h5>Community Guidelines*</h5>

                        <input type="checkbox"><label>Default Settings</label>
                        <div style="display: flex; flex-wrap: wrap; line-height: 24px; gap: 12px;">
                            <input type="checkbox"><label>Allow Profanity</label>
                            <input type="checkbox"><label>Age-Restriction (18+)</label>
                            <input type="checkbox"><label>Spam Protection</label>
                            <input type="checkbox"><label>Allow Image Sending</label>
                            <input type="checkbox"><label>Auto Ban</label>
                            
                        </div>
                    </div>
                </div>
            </div>
            
            <!--4, Choose Categories-->
            <div class="subsec">
                <div class="subhead">
                    <div class="num"><h4 style="line-height: 0px">4</h4></div>
                    <h3>Personalize</h3>
                </div>

                <div class="inputs">
                    <div class="label">
                        <h5>Color Scheme</h5>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div>customize <span></span></div>
                    </div>

                    <div class="label">
                        <h5>Thumbnail</h5>

                        <div>Component Placeholder</div>
                        <p>OR</p>
                        <input type="text" placeholder="Paste Image URL">
                    </div>
                </div>
            </div>
        </div>

        <button>Create Community</button>
        
    `;
};

export default CommunityCreationPage;