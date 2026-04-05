const API_BASE = import.meta.env.VITE_API_BASE ?? '';

function handleResponse(raw: string, res: Response) {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw}`);
  return JSON.parse(raw);
}

export type CreateUserPayload = {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  dob: string | null;
  password: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export async function fetchUserById(id:number) {
  const res = await fetch(`${API_BASE}/api/users/${id}`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function checkUniqueUsernameEmail(username?: string, email?: string, id?: number) {
  if (!username && !email) {
    throw new Error('username or email required for uniqueness check');
  }

  const params = new URLSearchParams();
  if (username) params.set('username', username);
  if (email) params.set('email', email);
  if (id !== undefined) params.set('id', String(id));

  const res = await fetch(`${API_BASE}/api/users/check-unique?${params.toString()}`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function updateUserInformation(
  id: number,
  username: string,
  firstname: string,
  lastname: string,
  email: string,
  dob: string
) {
  const dobValue = dob ? dob : null;
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, firstname, lastname, email, dob: dobValue })
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function loginUser(payload: LoginPayload) {
  const res = await fetch(`/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function createUser(payload: CreateUserPayload) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

//Library management OOP implementation: Observer

export type Book = {
  id: number;
  title: string;
  favorite?: boolean;
  tags?: string[];
};

export type LibraryObserver = (books: Book[]) => void;

export class LibraryManager {
  private books: Book[] = [];
  private observers: LibraryObserver[] = [];

  subscribe(observer: LibraryObserver) {
    this.observers.push(observer);
  }

  unsubscribe(observer: LibraryObserver) {
    this.observers = this.observers.filter(o => o !== observer);
  }

  private notify() {
    this.observers.forEach(observer => observer(this.books));
  }

  getBooks() {
    return this.books;
  }

  addBook(book: Book) {
    this.books.push(book);
    this.notify();
  }

  favoriteBook(bookId: number) {
    this.books = this.books.map(book =>
      book.id === bookId ? { ...book, favorite: !book.favorite } : book
    );
    this.notify();
  }

  removeBook(bookId: number) {
    this.books = this.books.filter(book => book.id !== bookId);
    this.notify();
  }
}