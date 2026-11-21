import { useEffect, useRef, useState } from "react";
import api from "../api";

export default function StoryViewer({ stories, onClose }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const story = stories[index];

  function next() {
    setIndex((current) => {
      if (current >= stories.length - 1) {
        onClose();
        return current;
      }
      return current + 1;
    });
  }

  function previous() {
    setIndex((current) => Math.max(0, current - 1));
  }

  useEffect(() => {
    if (!story) return;
    api.post(`/api/stories/${story._id}/view`).catch(() => {});
    if (story.mediaType === "image") {
      timerRef.current = setTimeout(next, 5000);
    }
    return () => clearTimeout(timerRef.current);
    // next is intentionally used as the timer callback for the current story.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?._id]);

  if (!story) return null;

  return (
    <div className="viewer-backdrop" role="dialog" aria-modal="true">
      <div className="viewer">
        <div className="viewer-progress">
          {stories.map((item, i) => (
            <span key={item._id} className={i <= index ? "done" : ""} />
          ))}
        </div>
        <button className="viewer-close" onClick={onClose}>
          ×
        </button>
        <div className="viewer-user">{story.user?.username}</div>
        {story.mediaType === "image" ? (
          <img className="viewer-media" src={story.mediaUrl} alt="Story" />
        ) : (
          <video
            ref={videoRef}
            key={story._id}
            className="viewer-media"
            src={story.mediaUrl}
            autoPlay
            controls
            playsInline
            onEnded={next}
          />
        )}
        {story.caption && <p className="viewer-caption">{story.caption}</p>}
        <div className="viewer-nav">
          <button
            className="button secondary"
            onClick={previous}
            disabled={index === 0}
          >
            Previous
          </button>
          <button className="button primary" onClick={next}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
