import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { GitHubRepo, GitHubStats } from '../types';

const GITHUB_USERNAME = 'dytsou';
const GITHUB_API = 'https://api.github.com';

interface GitHubState {
  repos: GitHubRepo[];
  stats: GitHubStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: GitHubState = {
  repos: [],
  stats: null,
  loading: false,
  error: null,
};

export const fetchGitHubData = createAsyncThunk(
  'github/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const [reposResponse, userResponse] = await Promise.all([
        fetch(
          `${GITHUB_API}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`
        ),
        fetch(`${GITHUB_API}/users/${GITHUB_USERNAME}`),
      ]);

      if (!reposResponse.ok || !userResponse.ok) {
        throw new Error('Failed to fetch GitHub data');
      }

      const reposData = await reposResponse.json();
      const userData = await userResponse.json();

      return {
        repos: reposData,
        stats: {
          public_repos: userData.public_repos,
          followers: userData.followers,
          following: userData.following,
        },
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
      })
      .addCase(fetchGitHubData.fulfilled, (state, action) => {
        state.loading = false;
        state.repos = action.payload.repos;
        state.stats = action.payload.stats;
        state.error = null;
      })
      .addCase(fetchGitHubData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default githubSlice.reducer;
