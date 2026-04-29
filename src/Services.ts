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
  avatarUrl?: string | null;
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
  ownerAvatarUrl?: string; // owner's avatar — server includes this on GET
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
  dob: string,
  avatarUrl?: string,
  bio?: string,
  interests?: string[]
) {
  const dobValue = dob ? dob : null;
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username, firstname, lastname, email,
      dob: dobValue,
      avatarUrl: avatarUrl ?? null,
      bio: bio ?? null,
      interests: interests ?? [],
    })
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

export async function checkUniqueField(params: { username?: string; email?: string }): Promise<{ unique: boolean; conflicts: { id: number; username: string; email: string }[] }> {
  const q = new URLSearchParams();
  if (params.username) q.set('username', params.username);
  if (params.email) q.set('email', params.email);
  const res = await fetch(`${API_BASE}/api/users/check-unique?${q}`);
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

export async function createBook(book: {
  title: string;
  authors: string;
  isbn13?: string;
  thumbnail?: string;
  published_year?: number;
  description?: string;
}): Promise<BookRecord> {
  const res = await fetch(`${API_BASE}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function fetchBooks(): Promise<BookRecord[]> {
  const res = await fetch(`${API_BASE}/api/books`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function fetchPopularBooks(): Promise<BookRecord[]> {
  const res = await fetch(`${API_BASE}/api/books/popular`);
  const raw = await res.text();
  return handleResponse(raw, res) ?? [];
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

// Favorites

export async function fetchFavorites(userId: number): Promise<number[]> {
  const res = await fetch(`${API_BASE}/api/favorites?user_id=${userId}`);
  const raw = await res.text();
  const data = handleResponse(raw, res);
  return (data?.bookIds ?? []) as number[];
}

export async function addFavorite(bookId: number): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to favorite a book');
  const res = await fetch(`${API_BASE}/api/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, book_id: bookId }),
  });
  const raw = await res.text();
  handleResponse(raw, res);
}

export async function removeFavorite(bookId: number): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to unfavorite a book');
  const res = await fetch(`${API_BASE}/api/favorites`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, book_id: bookId }),
  });
  const raw = await res.text();
  handleResponse(raw, res);
}

export type CommunityBooks = {
  current: BookRecord | null;
  previous: BookRecord[];
};

export type CommunityRead = {
  communityId: number;
  communityName: string;
  book: BookRecord;
};

export type UserShelf = {
  id: number;
  name: string;
  books: BookRecord[];
};

export async function fetchCommunityCurrentReads(userId: number): Promise<CommunityRead[]> {
  const res = await fetch(`${API_BASE}/api/communities/current-reads?user_id=${userId}`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function fetchUserShelves(userId: number): Promise<UserShelf[]> {
  const res = await fetch(`${API_BASE}/api/shelves?user_id=${userId}`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function updateUserShelf(shelfId: number, name: string, bookIds: number[]): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to update a shelf');
  const res = await fetch(`${API_BASE}/api/shelves/${shelfId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, name, book_ids: bookIds }),
  });
  const raw = await res.text();
  handleResponse(raw, res);
}

export async function createUserShelf(name: string, bookIds: number[]): Promise<UserShelf> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to create a shelf');
  const res = await fetch(`${API_BASE}/api/shelves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, name, book_ids: bookIds }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function fetchCommunityBooks(communityId: number): Promise<CommunityBooks> {
  const res = await fetch(`${API_BASE}/api/communities/${communityId}/books`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function finishCurrentBook(communityId: number): Promise<{ success: boolean }> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to finish the current book');
  const res = await fetch(`${API_BASE}/api/communities/${communityId}/books/current`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesting_user_id: user.id }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function setCommunityCurrentBook(communityId: number, bookId: number): Promise<{ success: boolean }> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to set the current book');
  const res = await fetch(`${API_BASE}/api/communities/${communityId}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: bookId, requesting_user_id: user.id }),
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

// ---------- FRIENDS ----------

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export type FriendshipInfo = {
  status: FriendshipStatus;
  requestId?: number;
};

export type FriendUser = {
  id: number;
  username: string;
  avatarUrl: string | null;
};

export type PendingFriendRequest = {
  requestId: number;
  id: number;
  username: string;
  avatarUrl: string | null;
};

export async function getFriendshipStatus(userId: number, otherUserId: number): Promise<FriendshipInfo> {
  const res = await fetch(`${API_BASE}/api/friends/status?user_id=${userId}&other_user_id=${otherUserId}`);
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function sendFriendRequest(toUserId: number): Promise<{ success: boolean; id: number }> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to send a friend request');
  const res = await fetch(`${API_BASE}/api/friends/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from_user_id: user.id, to_user_id: toUserId }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function getFriends(userId: number): Promise<FriendUser[]> {
  const res = await fetch(`${API_BASE}/api/friends?user_id=${userId}`);
  const raw = await res.text();
  return handleResponse(raw, res) ?? [];
}

export type UserSearchResult = {
  id: number;
  username: string;
  avatarUrl: string | null;
};

export async function searchUsers(query: string, excludeId?: number): Promise<UserSearchResult[]> {
  const q = new URLSearchParams({ q: query });
  if (excludeId) q.set('exclude', String(excludeId));
  const res = await fetch(`${API_BASE}/api/users/search?${q}`);
  const raw = await res.text();
  return handleResponse(raw, res) ?? [];
}

export async function getPendingFriendRequests(userId: number): Promise<PendingFriendRequest[]> {
  const res = await fetch(`${API_BASE}/api/friends/pending?user_id=${userId}`);
  const raw = await res.text();
  return handleResponse(raw, res) ?? [];
}

export async function respondToFriendRequest(requestId: number, status: 'accepted' | 'declined'): Promise<{ success: boolean }> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to respond to a friend request');
  const res = await fetch(`${API_BASE}/api/friends/${requestId}/respond`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, status }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function removeFriend(friendId: number): Promise<{ success: boolean }> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to remove a friend');
  const res = await fetch(`${API_BASE}/api/friends`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, friend_id: friendId }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function addCommunityMembers(communityId: number, userIds: number[]): Promise<{ success: boolean }> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to add members');
  const res = await fetch(`${API_BASE}/api/communities/${communityId}/members/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_ids: userIds, requesting_user_id: user.id }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function deleteForumPost(threadId: number, postId: number): Promise<{ success: boolean }> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to delete a post');
  const res = await fetch(`${API_BASE}/api/threads/${threadId}/posts/${postId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requesting_user_id: user.id }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

// ---------- FORUM ----------

export type ForumThread = {
  id: number;
  community_id: number;
  title: string;
  created_by: number;
  username: string;
  created_at: string;
  post_count: number;
};

export type ForumPost = {
  id: number;
  thread_id: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
};

export async function fetchCommunityThreads(communityId: number): Promise<ForumThread[]> {
  const res = await fetch(`${API_BASE}/api/communities/${communityId}/threads`);
  const raw = await res.text();
  return handleResponse(raw, res) ?? [];
}

export async function createForumThread(communityId: number, title: string): Promise<ForumThread> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to create a thread');
  const res = await fetch(`${API_BASE}/api/communities/${communityId}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, user_id: user.id }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}

export async function fetchThreadPosts(threadId: number): Promise<ForumPost[]> {
  const res = await fetch(`${API_BASE}/api/threads/${threadId}/posts`);
  const raw = await res.text();
  return handleResponse(raw, res) ?? [];
}

export async function createForumPost(threadId: number, content: string): Promise<ForumPost> {
  const user = getCurrentUser();
  if (!user) throw new Error('Must be logged in to post');
  const res = await fetch(`${API_BASE}/api/threads/${threadId}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, user_id: user.id }),
  });
  const raw = await res.text();
  return handleResponse(raw, res);
}