// THIS IS WHERE WE WILL GENERATE TEST CODE FOR book API routes in server.ts

const fs = require('fs');
const os = require('os');
const path = require('path');

// Temporary dist folder — required by the server's static-file middleware
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'litera-books-'));
fs.mkdirSync(path.join(tmp, 'dist'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'dist', 'index.html'), '<!doctype html><title>ok</title>');
process.chdir(tmp);
process.env.NODE_ENV = 'test';

// Mock imagekit — server imports it at module level
jest.mock('../imagekit', () => ({
    __esModule: true,
    getAuthParams: jest.fn(() => ({ token: 'mock', expire: 0, signature: 'mock', publicKey: 'mock', urlEndpoint: 'mock' })),
    uploadBuffer: jest.fn(async () => ({ url: 'mock', fileId: 'mock' })),
    toFile: jest.fn(async () => 'mock'),
}));

// Mock mysql2/promise — prevents any real DB connection
jest.mock('mysql2/promise', () => ({
    createPool: jest.fn().mockReturnValue({
        getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
        query: jest.fn(),
    }),
}));

const request = require('supertest');
const app = require('../server').default;

// Grab the shared query mock from the pool the server created on load
const mysql2 = require('mysql2/promise');
const mockQuery = mysql2.createPool.mock.results[0].value.query;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_BOOKS = [
    {
        id: 2,
        isbn13: '9780061965500',
        title: 'The Hobbit',
        subtitle: null,
        authors: 'J.R.R. Tolkien',
        categories: 'Fantasy',
        thumbnail: 'https://example.com/hobbit.jpg',
        description: 'An unexpected journey begins.',
        published_year: 1937,
        average_rating: 4.28,
    },
    {
        id: 1,
        isbn13: '9780743273565',
        title: 'The Great Gatsby',
        subtitle: null,
        authors: 'F. Scott Fitzgerald',
        categories: 'Fiction,Classics',
        thumbnail: 'https://example.com/gatsby.jpg',
        description: 'A portrait of the Jazz Age.',
        published_year: 1925,
        average_rating: 3.91,
    },
];

// ── GET /api/books ─────────────────────────────────────────────────────────────

describe('GET /api/books', () => {
    beforeEach(() => mockQuery.mockReset());

    test('returns 200 with an array of books', async () => {
        mockQuery.mockResolvedValueOnce([MOCK_BOOKS, []]);

        const res = await request(app).get('/api/books');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(MOCK_BOOKS);
    });

    test('queries books ordered by average_rating DESC', async () => {
        mockQuery.mockResolvedValueOnce([MOCK_BOOKS, []]);

        await request(app).get('/api/books');

        expect(mockQuery).toHaveBeenCalledWith(
            'SELECT * FROM books ORDER BY average_rating DESC'
        );
    });

    test('returns 200 with an empty array when no books exist', async () => {
        mockQuery.mockResolvedValueOnce([[], []]);

        const res = await request(app).get('/api/books');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('returns 500 on a database error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

        const res = await request(app).get('/api/books');

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Server error' });
    });
});

// ── GET /api/books/:id ─────────────────────────────────────────────────────────

describe('GET /api/books/:id', () => {
    beforeEach(() => mockQuery.mockReset());

    test('returns 200 with the matching book', async () => {
        mockQuery.mockResolvedValueOnce([[MOCK_BOOKS[0]], []]);

        const res = await request(app).get('/api/books/2');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(MOCK_BOOKS[0]);
    });

    test('returns 404 when the book does not exist', async () => {
        mockQuery.mockResolvedValueOnce([[], []]);

        const res = await request(app).get('/api/books/999');

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ error: 'Book not found' });
    });

    test('returns 400 for a non-integer id', async () => {
        const res = await request(app).get('/api/books/abc');

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid book id' });
    });

    test('returns 400 for id = 0', async () => {
        const res = await request(app).get('/api/books/0');

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid book id' });
    });

    test('returns 400 for a negative id', async () => {
        const res = await request(app).get('/api/books/-1');

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid book id' });
    });

    test('returns 500 on a database error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('timeout'));

        const res = await request(app).get('/api/books/1');

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'Server error' });
    });
});
