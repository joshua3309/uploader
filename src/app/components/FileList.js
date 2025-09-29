"use client";

import { useState, useEffect } from "react";

export default function FileList() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFiles = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/list-files");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch files");
      }
      const data = await response.json();
      console.log("Fetched files:", data);
      setFiles(data.files || []);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <p>Loading watermarked files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
        <p>Error: {error}</p>
        <button onClick={fetchFiles} style={{ marginTop: "10px" }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Watermarked Files ({files.length})</h2>
        <button onClick={fetchFiles} style={{ padding: "8px 16px" }}>
          Refresh
        </button>
      </div>
      
      {files.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <p>No watermarked files found.</p>
          <p>Upload some images to see them here after processing.</p>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "20px" 
        }}>
          {files.map((file, index) => (
            <div key={file.key} style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "16px",
              backgroundColor: "#f9f9f9"
            }}>
              <div style={{ marginBottom: "12px" }}>
                <img
                  src={file.url}
                  alt={file.filename}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    border: "1px solid #eee"
                  }}
                  onLoad={() => {
                    console.log(`Image loaded successfully: ${file.filename}`);
                  }}
                  onError={(e) => {
                    console.error(`Image failed to load: ${file.filename}`, file.url);
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div style={{ 
                  display: "none", 
                  width: "100%", 
                  height: "200px", 
                  backgroundColor: "#f0f0f0",
                  borderRadius: "4px",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#666",
                  flexDirection: "column"
                }}>
                  <div>Preview not available</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: "#007bff" }}>
                      Try direct link
                    </a>
                  </div>
                </div>
              </div>
              
              <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  {file.filename}
                </div>
                <div style={{ color: "#666", marginBottom: "2px" }}>
                  Size: {formatFileSize(file.size)}
                </div>
                <div style={{ color: "#666", marginBottom: "8px" }}>
                  Uploaded: {formatDate(file.lastModified)}
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    backgroundColor: "#007bff",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                    fontSize: "12px"
                  }}
                >
                  View Full Size
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
