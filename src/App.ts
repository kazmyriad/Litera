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

document.addEventListener('DOMContentLoaded', () => {
    const navButton = document.getElementById("#navToProfile") as HTMLElement;

    if (navButton) {
        navButton.addEventListener("click", () => {
            navigateTo(Profile);
        })
    } else {

    }
    try {
        navigateTo(Profile);
    } catch(e) {
        console.error("Error rendering page: ", e);
    }
})

function App () {
    // update browser URL
    const navigate = (path: string) => {
        window.history.pushState({}, "", path);
        renderView(path);
    }
    //retrieve current path
    const renderView = (path: string) => {
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `<h1>You are at ${path}</h1>`;
            // Update active class on nav links here
        }
    }
    //back/forward buttons on browser window
    window.onpopstate = () => {
        renderView(window.location.pathname);
    };
    
    //render path
    try {
        renderView(window.location.pathname);
    } catch (e) {
        console.error("Error rendering page: ", e);
    }
}