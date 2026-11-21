import { useState } from "react";
import Auth from "./components/Auth";
import Camera from "./components/Camera";
import StoryFeed from "./components/StoryFeed";
import StoryViewer from "./components/StoryViewer";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [selectedStories, setSelectedStories] = useState(null);

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  if (!token) return <Auth onAuthenticated={(newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }} />;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><span className="brand-dot">●</span> Snap MERN</div>
        <button className="button secondary" onClick={logout}>Log out</button>
      </header>

      <section className="section">
        <h2>Friends' stories</h2>
        <StoryFeed onOpenStory={setSelectedStories} />
      </section>

      <section className="section">
        <h2>Create a story</h2>
        <Camera />
      </section>

      {selectedStories && (
        <StoryViewer stories={selectedStories} onClose={() => setSelectedStories(null)} />
      )}
    </main>
  );
}
