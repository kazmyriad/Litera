// this is where we would write the frontend for the libraries section
// ---- would need to fetch book database + linked to specific user account 
import { html, css, type TemplateResult } from "lit";
import '../components/SearchBar.js';
import '../components/CommunityContainer.js';
import '../components/BookCard.js';

interface LibProps {
    currentPath?: string;
}

export const LibrariesPage = ({ currentPath = '/libraries' }: LibProps): TemplateResult => {
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
    `
    return html`
    <style>${styles}</style>
        <div class="banner">
            <h1 style="padding: 24px 64px;">Libraries</h1>
        </div>

        <div class="content">
            
            <search-bar></search-bar>

            <div class="community-reads">
                <h3>My Community Reads</h3>
                <community-container>
                    <book-card title="Book 1" author="Author 1" description="This is the first book."></book-card>
                    <book-card title="Book 2" author="Author 2" description="This is the second book."></book-card>
                    <book-card title="Book 3" author="Author 3" description="This is the third book."></book-card>
                </community-container>
            </div>

            <div class="favorites">
                <h3>Favorites</h3>
                <community-container>
                    <book-card title="Book 4" author="Author 4" description="This is the fourth book."></book-card>
                    <book-card title="Book 5" author="Author 5" description="This is the fifth book."></book-card>
                </community-container>
            </div>

            <div class="user-shelf">
                <h3>User-Defined-Shelf</h3>
                <community-container>
                    <book-card title="Book 6" author="Author 6" description="This is the sixth book."></book-card>
                    <book-card title="Book 7" author="Author 7" description="This is the seventh book."></book-card>
                </community-container>
            </div>

            <img src="">
        </div>
    `;
};

export default LibrariesPage;