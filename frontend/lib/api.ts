const API = process.env.NEXT_PUBLIC_API_URL!;

export type VideoInfo = {
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  platform: string;
};

export async function fetchInfo(url: string): Promise<VideoInfo> {
  const res = await fetch(`${API}/info?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to fetch video info" }));
    throw new Error(err.detail ?? "Failed to fetch video info");
  }
  return res.json();
}

export async function downloadFile(url: string, format: "mp4" | "mp3"): Promise<void> {
  const res = await fetch(
    `${API}/download?url=${encodeURIComponent(url)}&format=${format}`
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Download failed" }));
    throw new Error(err.detail ?? "Download failed");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="(.+)"/);
  const filename = match?.[1] ?? `download.${format}`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
