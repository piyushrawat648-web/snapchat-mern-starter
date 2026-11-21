import { useCallback, useEffect, useState } from "react";
import api from "../api";

export default function StoryFeed({ onOpenStory }) {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");

  const fetchStories = useCallback(async () => {
    try {
      const { data } = await api.get("/api/stories");
      const grouped = Object.values(
        (data.stories || []).reduce((acc, story) => {
          const id = story.user?._id;
          if (!id) return acc;
          if (!acc[id]) acc[id] = { user: story.user, stories: [] };
          acc[id].stories.push(story);
          return acc;
        }, {}),
      );
      setGroups(grouped);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load stories");
    }
  }, []);

  useEffect(() => {
    fetchStories();
    window.addEventListener("stories:refresh", fetchStories);
    return () => window.removeEventListener("stories:refresh", fetchStories);
  }, [fetchStories]);

  return (
    <div>
      {error && <p className="error">{error}</p>}
      {groups.length === 0 && !error && (
        <p className="muted">
          No active stories yet. Add a friend or upload your first story.
        </p>
      )}
      <div className="story-feed">
        {groups.map((group) => (
          <button
            className="story-person"
            key={group.user._id}
            onClick={() => onOpenStory(group.stories)}
          >
            <span className="avatar-ring">
              {group.user.profileImage ? (
                <img src={group.user.profileImage} alt="" />
              ) : (
                <span>{group.user.username?.[0]?.toUpperCase() || "?"}</span>
              )}
            </span>
            <span>{group.user.username}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
