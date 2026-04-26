import { type CategoryType } from './constants';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

function handleResponse(raw: string, res: Response) {
  // Try to pull a structured error message out of the server's JSON so the
  // UI can show something useful instead of "HTTP 500: {...}".
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = raw ? JSON.parse(raw) : null;
      if (body && typeof body.error === 'string') message = body.error;
    } catch {
      /* non-JSON body — fall through with the generic message */
    }
    throw new Error(message);
  }
  // 204s and empty bodies are legal; don't explode trying to parse them.
  if (!raw) return null;
  return JSON.parse(raw);
}

// ---------- DATA MODELS & SERVICES ----------

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

export type AuthUser = {
  id: number;
  username: string;
  email: string;
};

export type CommunityVisibility = 'public' | 'private';

export type Rules = {
  allowProfanity: boolean;
  ageRestricted: boolean;
  spamProtection: boolean;
  allowImages: boolean;
  autoBan: boolean;
}

export type Categories = CategoryType[];

export type Community = {
  id: number;
  ownerId: number;
  owner?: string; // owner's username — server includes this on GET
  name: string;
  description: string;
  categories: Categories;
  visibility: CommunityVisibility;
  rules: Rules;
  colorScheme?: string;
  thumbnailUrl?: string;
  createdAt: string;
};

export type Membership = {
  id: number;
  user_id: number;
  community_id: number;
  community_role: string;
};

const STORAGE_KEY = 'litera_user';
let currentUser: AuthUser | null = null;

// Authentication and User Services
export function setCurrentUser(user: AuthUser | null) {
  currentUser = user;

  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.dispatchEvent(new CustomEvent('auth-changed', {
    detail: {user}
  }))
}

export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

export function isLoggedIn(): boolean {
  return !!currentUser;
}

export function restoreAuth() {
  if (currentUser) return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    currentUser = JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function logout() {
  setCurrentUser(null);
}

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
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function createUser(payload: CreateUserPayload) {
  const res = await fetch(`${API_BASE}/api/users`, {
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

export type BookRecord = {
  id: number;
  isbn13: string;
  title: string;
  subtitle: string | null;
  authors: string;
  categories: string | null;
  thumbnail: string | null;
  description: string | null;
  published_year: number | null;
  average_rating: number | null;
};

export async function fetchBooks(): Promise<BookRecord[]> {
  const res = await fetch(`${API_BASE}/api/books`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function fetchBookById(id: number): Promise<BookRecord> {
  const res = await fetch(`${API_BASE}/api/books/${id}`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

// Community based functions

export async function fetchCommunities(): Promise<Community[]> {
  const res = await fetch(`${API_BASE}/api/communities`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function getCommunityById(id: number): Promise<Community> {
  const res = await fetch(`${API_BASE}/api/communities/${id}`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function createCommunity(
  community: Omit<Community, 'id' | 'createdAt' | 'owner'>
): Promise<Community> {
  const user = getCurrentUser();

  if (!user) {
    throw new Error('User must be logged in to create a community');
  }

  // Send categories/rules as real JSON values, not pre-stringified strings.
  // The server JSON.stringifies them once before writing to the TEXT columns.
  const res = await fetch(`${API_BASE}/api/communities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: community.name,
      description: community.description,
      categories: community.categories,
      visibility: community.visibility,
      rules: community.rules,
      color_scheme: community.colorScheme || 'default',
      thumbnail_url: community.thumbnailUrl || null,
      owner_id: user.id,
    }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export type MembershipStatus = {
  isMember: boolean;
  role: string | null;
};

export async function getMembership(communityId: number): Promise<MembershipStatus> {
  const user = getCurrentUser();
  if (!user) return { isMember: false, role: null };

  const res = await fetch(`${API_BASE}/api/communities/${communityId}/membership?user_id=${user.id}`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function leaveCommunity(communityId: number): Promise<{ success: boolean }> {
  const user = getCurrentUser();
  if (!user) throw new Error('User must be logged in to leave a community');

  const res = await fetch(`${API_BASE}/api/communities/${communityId}/members`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function updateCommunity(
  id: number,
  data: Partial<Omit<Community, 'id' | 'createdAt' | 'owner'>>
): Promise<Community> {
  const user = getCurrentUser();
  if (!user) throw new Error('User must be logged in to update a community');

  const res = await fetch(`${API_BASE}/api/communities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      categories: data.categories,
      visibility: data.visibility,
      rules: data.rules,
      color_scheme: data.colorScheme || 'default',
      thumbnail_url: data.thumbnailUrl || null,
      requesting_user_id: user.id,
    }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function deleteCommunity(id: number): Promise<{ success: boolean }> {
  const user = getCurrentUser();
  if (!user) throw new Error('User must be logged in to delete a community');

  const res = await fetch(`${API_BASE}/api/communities/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesting_user_id: user.id }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function joinCommunity(communityId: number): Promise<{
  success: boolean;
  alreadyMember?: boolean;
  membership: Membership;
}> {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be logged in to join a community');
  }

  const res = await fetch(`${API_BASE}/api/communities/${communityId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}