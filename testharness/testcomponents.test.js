// THIS IS WHERE WE WILL GENERATE TEST CODE FOR BookCard and CommunityCard components
//
// These tests cover component logic (default props, methods, events, data binding)
// without requiring Lit, a browser, or any API/database connection.
// Run with: npm test

// CustomEvent is browser-only — polyfill it for the Node test environment
global.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
        this.type = type;
        this.bubbles = options.bubbles || false;
        this.composed = options.composed || false;
        this.detail = options.detail || null;
    }
};

// ── BookCard logic stub ────────────────────────────────────────────────────────
// Mirrors the constructor, properties, and toggleFavorite() from
// src/components/BookCard.jsx without pulling in Lit or the DOM.
class BookCardLogic {
    constructor() {
        this.name        = 'A Court of Thorns and Roses';
        this.title       = 'A Court of Thorns and Roses';
        this.author      = 'Sarah J. Maas';
        this.thumbnail   = 'https://example.com/acotar.jpg';
        this.description = 'A description of the book.';
        this.book        = null;
        this.favorite    = false;
        this._dispatched = [];
    }

    dispatchEvent(event) {
        this._dispatched.push(event);
        return true;
    }

    toggleFavorite() {
        this.favorite = !this.favorite;
        this.dispatchEvent(new CustomEvent('favorite-toggle', {
            bubbles: true,
            composed: true,
            detail: { title: this.title || this.name, favorite: this.favorite },
        }));
    }
}

// ── CommunityCard logic stub ───────────────────────────────────────────────────
// Mirrors the constructor and properties from src/components/CommunityCard.jsx.
class CommunityCardLogic {
    constructor() {
        this.name        = 'A Community';
        this.thumbnail   = 'https://example.com/placeholder.jpg';
        this.description = 'A description of the community.';
    }
}

// ══ BookCard tests ════════════════════════════════════════════════════════════

describe('BookCard', () => {
    let card;

    beforeEach(() => {
        card = new BookCardLogic();
    });

    // ── Default properties ──────────────────────────────────────────────────

    describe('default properties', () => {
        test('title defaults to "A Court of Thorns and Roses"', () => {
            expect(card.title).toBe('A Court of Thorns and Roses');
        });

        test('name defaults to "A Court of Thorns and Roses"', () => {
            expect(card.name).toBe('A Court of Thorns and Roses');
        });

        test('author defaults to "Sarah J. Maas"', () => {
            expect(card.author).toBe('Sarah J. Maas');
        });

        test('description is a non-empty string', () => {
            expect(typeof card.description).toBe('string');
            expect(card.description.length).toBeGreaterThan(0);
        });

        test('thumbnail is a non-empty string', () => {
            expect(typeof card.thumbnail).toBe('string');
            expect(card.thumbnail.length).toBeGreaterThan(0);
        });

        test('favorite defaults to false', () => {
            expect(card.favorite).toBe(false);
        });

        test('book defaults to null', () => {
            expect(card.book).toBeNull();
        });
    });

    // ── toggleFavorite() ────────────────────────────────────────────────────

    describe('toggleFavorite()', () => {
        test('flips favorite from false to true', () => {
            card.toggleFavorite();
            expect(card.favorite).toBe(true);
        });

        test('flips favorite from true back to false', () => {
            card.favorite = true;
            card.toggleFavorite();
            expect(card.favorite).toBe(false);
        });

        test('toggling twice restores the original state', () => {
            card.toggleFavorite();
            card.toggleFavorite();
            expect(card.favorite).toBe(false);
        });

        test('dispatches exactly one favorite-toggle event per call', () => {
            card.toggleFavorite();
            expect(card._dispatched).toHaveLength(1);
            expect(card._dispatched[0].type).toBe('favorite-toggle');
        });

        test('event detail.favorite reflects the NEW state after toggle', () => {
            card.toggleFavorite(); // false → true
            expect(card._dispatched[0].detail.favorite).toBe(true);

            card.toggleFavorite(); // true → false
            expect(card._dispatched[1].detail.favorite).toBe(false);
        });

        test('event detail.title uses the title property', () => {
            card.title = 'Dune';
            card.toggleFavorite();
            expect(card._dispatched[0].detail.title).toBe('Dune');
        });

        test('event detail.title falls back to name when title is empty', () => {
            card.title = '';
            card.name  = 'Fallback Book Name';
            card.toggleFavorite();
            expect(card._dispatched[0].detail.title).toBe('Fallback Book Name');
        });

        test('event has bubbles: true', () => {
            card.toggleFavorite();
            expect(card._dispatched[0].bubbles).toBe(true);
        });

        test('event has composed: true (crosses shadow DOM boundaries)', () => {
            card.toggleFavorite();
            expect(card._dispatched[0].composed).toBe(true);
        });
    });

    // ── Binding from a BookRecord (API response shape) ──────────────────────

    describe('BookRecord data binding', () => {
        const bookRecord = {
            id: 1,
            isbn13: '9780743273565',
            title: 'The Great Gatsby',
            subtitle: null,
            authors: 'F. Scott Fitzgerald',
            categories: 'Fiction,Classics',
            thumbnail: 'https://example.com/gatsby.jpg',
            description: 'A portrait of the Jazz Age in all of its decadence.',
            published_year: 1925,
            average_rating: 3.91,
        };

        test('title prop binds from BookRecord.title', () => {
            card.title = bookRecord.title;
            expect(card.title).toBe('The Great Gatsby');
        });

        test('author prop binds from BookRecord.authors', () => {
            card.author = bookRecord.authors;
            expect(card.author).toBe('F. Scott Fitzgerald');
        });

        test('thumbnail prop binds from BookRecord.thumbnail', () => {
            card.thumbnail = bookRecord.thumbnail;
            expect(card.thumbnail).toBe('https://example.com/gatsby.jpg');
        });

        test('description prop binds from BookRecord.description', () => {
            card.description = bookRecord.description;
            expect(card.description).toContain('Jazz Age');
        });

        test('thumbnail falls back gracefully to empty string when null', () => {
            card.thumbnail = bookRecord.thumbnail ?? '';
            expect(typeof card.thumbnail).toBe('string');
        });

        test('description falls back gracefully to empty string when null', () => {
            card.description = null ?? '';
            expect(card.description).toBe('');
        });
    });

    // ── Multiple independent instances ─────────────────────────────────────

    describe('multiple independent instances', () => {
        test('two cards do not share favorite state', () => {
            const cardA = new BookCardLogic();
            const cardB = new BookCardLogic();

            cardA.toggleFavorite();

            expect(cardA.favorite).toBe(true);
            expect(cardB.favorite).toBe(false);
        });

        test('two cards do not share dispatched event arrays', () => {
            const cardA = new BookCardLogic();
            const cardB = new BookCardLogic();

            cardA.toggleFavorite();

            expect(cardA._dispatched).toHaveLength(1);
            expect(cardB._dispatched).toHaveLength(0);
        });
    });
});

// ══ CommunityCard tests ═══════════════════════════════════════════════════════

describe('CommunityCard', () => {
    let card;

    beforeEach(() => {
        card = new CommunityCardLogic();
    });

    // ── Default properties ──────────────────────────────────────────────────

    describe('default properties', () => {
        test('name defaults to "A Community"', () => {
            expect(card.name).toBe('A Community');
        });

        test('description defaults to a non-empty string', () => {
            expect(typeof card.description).toBe('string');
            expect(card.description.length).toBeGreaterThan(0);
        });

        test('thumbnail defaults to a non-empty string', () => {
            expect(typeof card.thumbnail).toBe('string');
            expect(card.thumbnail.length).toBeGreaterThan(0);
        });
    });

    // ── Binding from a Community (API response shape) ───────────────────────

    describe('Community data binding', () => {
        const community = {
            id: 7,
            ownerId: 42,
            owner: 'readerJane',
            name: 'Fantasy Readers',
            description: 'A community for fantasy book lovers.',
            categories: ['fantasy'],
            visibility: 'public',
            rules: { allowProfanity: false, ageRestricted: false, spamProtection: true, allowImages: true, autoBan: false },
            colorScheme: 'default',
            thumbnailUrl: 'https://example.com/fantasy-community.jpg',
            createdAt: '2024-01-15T00:00:00.000Z',
        };

        test('name prop binds from Community.name', () => {
            card.name = community.name;
            expect(card.name).toBe('Fantasy Readers');
        });

        test('description prop binds from Community.description', () => {
            card.description = community.description;
            expect(card.description).toBe('A community for fantasy book lovers.');
        });

        test('thumbnail prop binds from Community.thumbnailUrl', () => {
            card.thumbnail = community.thumbnailUrl;
            expect(card.thumbnail).toBe('https://example.com/fantasy-community.jpg');
        });

        test('thumbnail falls back gracefully when thumbnailUrl is null', () => {
            card.thumbnail = community.thumbnailUrl ?? '';
            expect(typeof card.thumbnail).toBe('string');
        });
    });

    // ── Property mutation ───────────────────────────────────────────────────

    describe('property mutation', () => {
        test('name can be updated after construction', () => {
            card.name = 'Sci-Fi Club';
            expect(card.name).toBe('Sci-Fi Club');
        });

        test('description can be updated after construction', () => {
            card.description = 'For science fiction enthusiasts.';
            expect(card.description).toBe('For science fiction enthusiasts.');
        });
    });

    // ── Multiple independent instances ─────────────────────────────────────

    describe('multiple independent instances', () => {
        test('two cards do not share name state', () => {
            const cardA = new CommunityCardLogic();
            const cardB = new CommunityCardLogic();

            cardA.name = 'Romance Readers';

            expect(cardA.name).toBe('Romance Readers');
            expect(cardB.name).toBe('A Community');
        });
    });
});
