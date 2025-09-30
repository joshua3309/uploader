"use client";

import { useState } from "react";
import FileList from "./components/FileList";

export default function Home() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploadedKey, setUploadedKey] = useState("");

  async function handleUpload(event) {
    event.preventDefault();
    setStatus("");
    setUploadedKey("");

    if (!file) {
      setStatus("Please choose a file first.");
      return;
    }

    try {
      // 1) Ask backend for a pre-signed URL
      const res = await fetch("/api/s3-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Upload API Error:", data);
        throw new Error(data.error || `HTTP ${res.status}: Failed to get pre-signed URL`);
      }

      const { url, key } = await res.json();

      // 2) Upload directly to S3 with the pre-signed URL
      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!put.ok) {
        throw new Error("Upload to S3 failed");
      }

      setUploadedKey(key);
      setStatus("Upload complete!");
    } catch (err) {
      setStatus(err.message || "Something went wrong");
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      <h1>Uploader</h1>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ display: "block", marginBottom: 12 }}
        />
        <button type="submit">Upload to S3</button>
      </form>
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
      {uploadedKey && (
        <p style={{ marginTop: 6 }}>
          Stored as key: <code>{uploadedKey}</code>
        </p>
      )}
      
      <FileList />
    </div>
  );
}
