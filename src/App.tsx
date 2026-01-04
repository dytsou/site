import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/navigation/Navigation';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Experience } from './pages/Experience';
import { Projects } from './pages/Projects';
import { Contact } from './pages/Contact';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { setTheme } from './store/themeSlice';
import { fetchGitHubData } from './store/githubSlice';

function App() {
  const theme = useAppSelector((state) => state.theme.theme);
  const dispatch = useAppDispatch();

  // Initialize theme to ensure proper dark mode setup
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored) {
      dispatch(setTheme(stored as 'light' | 'dark'));
    }
  }, [dispatch]);

  // Apply theme class to document root
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch GitHub data on mount
  useEffect(() => {
    dispatch(fetchGitHubData());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/experiences" element={<Experience />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
