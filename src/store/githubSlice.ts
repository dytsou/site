import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { GitHubRepo, GitHubStats } from '../types';
import { EXCLUDED_GITHUB_LANGUAGES } from '../config/githubLanguages';

const GITHUB_USERNAME = 'dytsou';
const GITHUB_API = 'https://api.github.com';

type TopLanguage = {
  name: string;
  bytes: number;
  percent: number;
};

interface GitHubState {
  repos: GitHubRepo[];
  stats: GitHubStats | null;
  topLanguages: TopLanguage[] | null;
  languagesLoading: boolean;
  languagesError: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: GitHubState = {
  repos: [],
  stats: null,
  topLanguages: null,
  languagesLoading: false,
  languagesError: null,
  loading: false,
  error: null,
};

const TOP_LANGUAGES_CACHE_KEY = 'githubTopLanguages:v2';
const TOP_LANGUAGES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const EXCLUDED_LANGUAGES = new Set<string>(EXCLUDED_GITHUB_LANGUAGES);

function readTopLanguagesCache(): TopLanguage[] | null {
  try {
    const raw = localStorage.getItem(TOP_LANGUAGES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: TopLanguage[] };
    if (!parsed?.ts || !Array.isArray(parsed.data)) return null;
    if (Date.now() - parsed.ts > TOP_LANGUAGES_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeTopLanguagesCache(data: TopLanguage[]) {
  try {
    localStorage.setItem(
      TOP_LANGUAGES_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // ignore cache write failures (private mode, storage full, etc.)
  }
}

async function fetchOwnedPublicRepos(): Promise<GitHubRepo[]> {
  const perPage = 100;
  const collected: GitHubRepo[] = [];

  for (let page = 1; page <= 10; page += 1) {
    const res = await fetch(
      `${GITHUB_API}/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=${perPage}&page=${page}`
    );
    if (!res.ok) throw new Error('Failed to fetch GitHub repositories');
    const data = (await res.json()) as GitHubRepo[];
    collected.push(...data);
    if (data.length < perPage) break;
  }

  return collected.filter(
    (repo) =>
      repo.owner?.login === GITHUB_USERNAME && !repo.fork && !repo.private
  );
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;

  const workers = new Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (idx < items.length) {
        const current = idx;
        idx += 1;
        results[current] = await fn(items[current], current);
      }
    });

  await Promise.all(workers);
  return results;
}

async function computeTopLanguagesFromRepos(
  repos: GitHubRepo[]
): Promise<TopLanguage[]> {
  const totals = new Map<string, number>();

  await mapWithConcurrency(repos, 6, async (repo) => {
    const res = await fetch(repo.languages_url);
    if (!res.ok) return;
    const data = (await res.json()) as Record<string, number>;
    for (const [lang, bytes] of Object.entries(data)) {
      if (EXCLUDED_LANGUAGES.has(lang)) continue;
      totals.set(lang, (totals.get(lang) ?? 0) + bytes);
    }
  });

  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 8);
  const sum = top.reduce((acc, [, bytes]) => acc + bytes, 0) || 1;

  return top.map(([name, bytes]) => ({
    name,
    bytes,
    percent: Math.round((bytes / sum) * 1000) / 10,
  }));
}

export const fetchGitHubData = createAsyncThunk(
  'github/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const cachedTopLanguages = readTopLanguagesCache();
      const userResponse = await fetch(
        `${GITHUB_API}/users/${GITHUB_USERNAME}`
      );

      if (!userResponse.ok) {
        throw new Error('Failed to fetch GitHub data');
      }

      const ownedRepos = await fetchOwnedPublicRepos();
      const reposForUi = ownedRepos.slice(0, 6);
      const userData = await userResponse.json();

      let topLanguages = cachedTopLanguages;
      let languagesError: string | null = null;

      if (!topLanguages) {
        try {
          topLanguages = await computeTopLanguagesFromRepos(ownedRepos);
          writeTopLanguagesCache(topLanguages);
        } catch (error) {
          // Languages are best-effort; don't fail stats/repos if we can't compute.
          const message =
            error instanceof Error ? error.message : String(error);
          languagesError = message;
          topLanguages = null;
        }
      }

      return {
        repos: reposForUi,
        stats: {
          public_repos: userData.public_repos,
          followers: userData.followers,
          following: userData.following,
        },
        topLanguages,
        languagesError,
      };
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to fetch GitHub data'
      );
    }
  }
);

const githubSlice = createSlice({
  name: 'github',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGitHubData.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.languagesLoading = true;
        state.languagesError = null;
      })
      .addCase(fetchGitHubData.fulfilled, (state, action) => {
        state.loading = false;
        state.repos = action.payload.repos;
        state.stats = action.payload.stats;
        state.topLanguages = action.payload.topLanguages;
        state.languagesLoading = false;
        state.languagesError = action.payload.languagesError ?? null;
        state.error = null;
      })
      .addCase(fetchGitHubData.rejected, (state, action) => {
        state.loading = false;
        state.languagesLoading = false;
        state.languagesError = action.payload as string;
        state.error = action.payload as string;
      });
  },
});

export default githubSlice.reducer;
