// This file handles page navigation and connects slugs to ts pages
import Profile from "./pages/Profile";

//navigate function to display different pages
async function navigateTo(PageClass: any, params: URLSearchParams = new URLSearchParams()) {
    const page = new PageClass(params);
    const html = await page.getHtml();
    const root = document.querySelector('#app');
    if (!root) throw new Error("#app container not found");
    root.innerHTML = html;
    await page.afterRender();
}

// create notfound view for non-existent views
class NotFound {
    constructor(_: URLSearchParams) {}
    setTitle(t: string) {document.title = t}
    async getHtml() {return `<h1>404: Not Found</h1>`;}
    async afterRender() {}
}

// connect ts files to their slugs
const routes: Record<string, any> = {
    '/': NotFound, // replace w home
    '/profile': Profile,
    '/communities': NotFound, // replace w communities
    '/library': NotFound, // replace w library
}

// set active tab on nav bar
function setActiveOnNav(path: string) {
    document.querySelectorAll('nav-bar').forEach((el) => {
        (el as any).activePath = path;
    });
}

// rendering the frontend view
export async function renderCurrentRoute() {
    const url = new URL(window.location.href);
    const path = url.pathname;
    const params = url.searchParams;

    // set pageclass to one of the routes, otherwise set to Not Found
    const PageClass = routes[path] ?? NotFound;
    await navigateTo(PageClass, params);

    setActiveOnNav(path);
}

// actually replacing the current path state (the url)
export function navigate(path: string, replace = false) {
    const url = new URL(path, window.location.origin);
    if (replace) {
        window.history.replaceState({}, '', url);
    } else {
        window.history.pushState({}, '', url);
    }
    void renderCurrentRoute();
}

export function initRouter() {
    // handle back/forward in browser window
    window.addEventListener('popstate', () => {
        void renderCurrentRoute();
    });
    // handle nav requests from shadow DOM
    document.addEventListener('app:navigate', (e: Event) => {
        const ce = e as CustomEvent<{ path: string }>;
        if (ce?.detail?.path) {
            navigate(ce.detail.path);
        }
    })

    /* possibly add this function for regular anchor elements on the pages
        document.addEventListener('click', (e) => {
            const target = e.target as Element | null;
            const link = target?.closest?.('a[data-link]') as HTMLAnchorElement | null;
            if (link && link.origin === window.location.origin) {
                e.preventDefault();
                navigate(link.getAttribute('href') || '/');
            }
        });
    */
   void renderCurrentRoute();
}

document.addEventListener('DOMContentLoaded', () => {
    initRouter();
});