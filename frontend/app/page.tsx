"use client";

import { useState, useRef } from "react";
import { fetchInfo, downloadFile, formatDuration, VideoInfo } from "@/lib/api";
import { Meteors } from "@/components/ui/meteors";

type State = "idle" | "fetching" | "ready" | "downloading" | "done" | "error";
const MAX_URL_LENGTH = 2048;
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function validateInputUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Please paste a link.";
  if (value.length > MAX_URL_LENGTH) return "That link is too long.";

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "Please enter a valid URL.";
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return "Only http(s) links are allowed.";
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".local") || host.endsWith(".internal")) {
    return "This host is not allowed.";
  }

  return null;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>("idle");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [format, setFormat] = useState<"mp4" | "mp3">("mp4");
  const [error, setError] = useState<string | null>(null);
  const [showContactTip, setShowContactTip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFetch() {
    const cleanUrl = url.trim();
    const validationError = validateInputUrl(cleanUrl);
    if (validationError) {
      setInfo(null);
      setError(validationError);
      setState("error");
      return;
    }

    setState("fetching");
    setInfo(null);
    setError(null);
    try {
      const data = await fetchInfo(cleanUrl);
      setInfo(data);
      setState("ready");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load video info");
      setState("error");
    }
  }

  async function handleDownload() {
    if (!info) return;
    const cleanUrl = url.trim();
    const validationError = validateInputUrl(cleanUrl);
    if (validationError) {
      setError(validationError);
      setState("error");
      return;
    }

    setState("downloading");
    setError(null);
    try {
      await downloadFile(cleanUrl, format);
      setState("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Download failed");
      setState("error");
    }
  }

  function handleReset() {
    setUrl("");
    setInfo(null);
    setError(null);
    setState("idle");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const isLoading = state === "fetching" || state === "downloading";

  return (
    <main className="relative overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.25),transparent_45%)]" />
        <Meteors className="bg-violet-400/70" number={28} />
      </div>

      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            Grab<span className="text-violet-500">r</span>
          </h1>
          <p className="text-zinc-400 text-sm">Paste a link. Get the file.</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-lg bg-zinc-900/85 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">

          {/* URL Input */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (state !== "idle") handleReset();
              }}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleFetch()}
              placeholder="Paste YouTube, TikTok, Instagram, or Twitter URL..."
              disabled={isLoading}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition disabled:opacity-50"
            />
            <button
              onClick={handleFetch}
              disabled={!url.trim() || isLoading}
              className="bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium px-4 py-3 rounded-xl transition disabled:cursor-not-allowed whitespace-nowrap"
            >
              {state === "fetching" ? <Spinner /> : "Fetch"}
            </button>
          </div>

          {/* Preview Card */}
          {info && (
            <div className="flex gap-3 bg-zinc-800 rounded-xl p-3 border border-zinc-700">
              {info.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={info.thumbnail}
                  alt=""
                  className="w-24 h-14 object-cover rounded-lg shrink-0 bg-zinc-700"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white leading-tight line-clamp-2">
                  {info.title}
                </p>
                <div className="flex gap-2 mt-1.5 text-xs text-zinc-400">
                  {info.uploader && <span>{info.uploader}</span>}
                  {info.duration > 0 && (
                    <>
                      <span>·</span>
                      <span>{formatDuration(info.duration)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Format Toggle */}
          {(state === "ready" || state === "downloading" || state === "done") && (
            <div className="flex gap-2">
              {(["mp4", "mp3"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  disabled={state === "downloading"}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border disabled:opacity-50 ${
                    format === f
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
                  }`}
                >
                  {f === "mp4" ? "Video (MP4)" : "Audio (MP3)"}
                </button>
              ))}
            </div>
          )}

          {/* Download Button */}
          {(state === "ready" || state === "downloading" || state === "done") && (
            <button
              onClick={handleDownload}
              disabled={state === "downloading" || state === "done"}
              className="w-full py-3 rounded-xl text-sm font-semibold transition bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white disabled:cursor-not-allowed"
            >
              {state === "downloading" ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Downloading... (large files may take a moment)
                </span>
              ) : state === "done" ? (
                "Done!"
              ) : (
                `Download ${format.toUpperCase()}`
              )}
            </button>
          )}

          {/* Done state — grab another */}
          {state === "done" && (
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white transition"
            >
              Grab another
            </button>
          )}

          {/* Error */}
          {state === "error" && error && (
            <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer + contact tip */}
        <div className="relative mt-6 flex flex-col items-center gap-3 text-xs text-zinc-500">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowContactTip(true)}
              onMouseEnter={() => setShowContactTip(true)}
              onFocus={() => setShowContactTip(true)}
              className="rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition"
            >
              Want more?
            </button>
          </div>

          <p className="text-zinc-600">
            by{" "}
            <a href="https://itwela.dev" target="_blank" rel="noreferrer" className="hover:text-zinc-400">
              itwela
            </a>{" "}
            - caveman creative -{" "}
            <a href="https://itwela.dev" target="_blank" rel="noreferrer" className="hover:text-zinc-400">
              itwela.dev
            </a>
          </p>

          {showContactTip && (
            <div className="absolute left-1/2 top-full z-20 mt-2 w-[22rem] max-w-[90vw] -translate-x-1/2 rounded-xl border border-zinc-800 bg-zinc-900/95 px-4 py-3 text-center text-xs text-zinc-300 shadow-xl backdrop-blur-sm">
              <p>
                If you would like more, head over to{" "}
                <a
                  href="https://itwela.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
                >
                  itwela.dev
                </a>{" "}
                and send me a message in the Mail app.
              </p>
              <button
                type="button"
                onClick={() => setShowContactTip(false)}
                className="mt-3 rounded-md border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/25 transition"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 inline-block"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
