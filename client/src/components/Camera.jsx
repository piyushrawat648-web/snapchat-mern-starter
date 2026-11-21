import { useEffect, useRef, useState } from "react";
import api from "../api";

export default function Camera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const previewUrlRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user");
  const [preview, setPreview] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [recording, setRecording] = useState(false);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function openCamera(mode = facingMode) {
    try {
      stopCamera();
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera API unavailable. Use HTTPS or localhost in a supported browser.",
        );
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus("");
    } catch (error) {
      setStatus(error.message || "Camera permission denied");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function switchCamera() {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    await openCamera(next);
  }

  function setPreviewUrl(blob, type) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    setPreview(url);
    setMediaType(type);
    stopCamera();
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) setPreviewUrl(blob, "image");
      },
      "image/jpeg",
      0.9,
    );
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    const mimeType = candidates.find((type) =>
      MediaRecorder.isTypeSupported(type),
    );
    if (!mimeType) {
      setStatus("This browser does not support a compatible recording format.");
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onerror = (event) =>
      setStatus(event.error?.message || "Recording failed");
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      setPreviewUrl(blob, "video");
      setRecording(false);
    };
    recorder.start(1000);
    setRecording(true);
    setStatus("Recording...");
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function uploadStory() {
    if (!preview) return;
    setBusy(true);
    setStatus("Uploading story...");
    try {
      const response = await fetch(preview);
      const blob = await response.blob();
      const extension =
        mediaType === "image"
          ? "jpg"
          : blob.type.includes("mp4")
            ? "mp4"
            : "webm";
      const file = new File([blob], `story.${extension}`, {
        type: blob.type.split(";")[0],
      });
      const body = new FormData();
      body.append("media", file);
      body.append("caption", caption);
      await api.post("/api/stories", body);
      setStatus("Story uploaded successfully.");
      resetPreview();
      window.dispatchEvent(new Event("stories:refresh"));
    } catch (error) {
      setStatus(
        error.response?.data?.message ||
          "Upload failed. Check your connection and server configuration.",
      );
    } finally {
      setBusy(false);
    }
  }

  function resetPreview() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreview("");
    setMediaType("");
    setCaption("");
    openCamera();
  }

  useEffect(() => {
    openCamera();
    return () => {
      if (recorderRef.current?.state === "recording")
        recorderRef.current.stop();
      stopCamera();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
    // Camera is initialized once; switching is handled by switchCamera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="camera-card">
      {!preview ? (
        <div className="camera-stage">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
          />
          {status && <div className="camera-message">{status}</div>}
          <div className="camera-controls">
            <button
              className="button secondary"
              onClick={switchCamera}
              disabled={recording}
            >
              Flip
            </button>
            <button
              className="capture-button"
              aria-label="Take photo"
              onClick={takePhoto}
              disabled={recording}
            />
            {!recording ? (
              <button className="button primary" onClick={startRecording}>
                Record
              </button>
            ) : (
              <button className="button danger" onClick={stopRecording}>
                Stop
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="preview-stage">
          {mediaType === "image" ? (
            <img src={preview} alt="Captured preview" />
          ) : (
            <video src={preview} controls autoPlay playsInline />
          )}
          <input
            value={caption}
            maxLength={500}
            placeholder="Add a caption..."
            onChange={(event) => setCaption(event.target.value)}
          />
          <div className="preview-actions">
            <button
              className="button secondary"
              onClick={resetPreview}
              disabled={busy}
            >
              Retake
            </button>
            <button
              className="button primary"
              onClick={uploadStory}
              disabled={busy}
            >
              {busy ? "Uploading..." : "Add to story"}
            </button>
          </div>
        </div>
      )}
      {status && <p className="status-text">{status}</p>}
    </div>
  );
}
