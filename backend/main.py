from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import yt_dlp
import ipaddress
import os
import re
import shutil
import tempfile
from pathlib import Path
from urllib.parse import quote, urlparse

app = FastAPI()

def parse_allowed_origins(raw: str) -> list[str]:
    origins: list[str] = []
    for origin in raw.split(","):
        cleaned = origin.strip().strip("'\"").rstrip("/")
        if cleaned:
            origins.append(cleaned)
    return origins


ALLOWED_ORIGINS = parse_allowed_origins(
    os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
)
ALLOWED_ORIGIN_REGEX = os.environ.get(
    "ALLOWED_ORIGIN_REGEX",
    r"^https://.*\.vercel\.app$",
).strip()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX if ALLOWED_ORIGIN_REGEX else None,
    allow_methods=["GET"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

MAX_URL_LENGTH = 2048
BLOCKED_HOSTNAMES = {"localhost", "127.0.0.1", "::1", "0.0.0.0"}
BLOCKED_HOST_SUFFIXES = (".local", ".internal", ".localhost")


def validate_media_url(raw_url: str) -> str:
    url = raw_url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    if len(url) > MAX_URL_LENGTH:
        raise HTTPException(status_code=400, detail="URL is too long")

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Only http(s) URLs are allowed")
    if not parsed.hostname:
        raise HTTPException(status_code=400, detail="Invalid URL")
    if parsed.username or parsed.password:
        raise HTTPException(status_code=400, detail="URL credentials are not allowed")

    hostname = parsed.hostname.lower().strip(".")
    if hostname in BLOCKED_HOSTNAMES or hostname.endswith(BLOCKED_HOST_SUFFIXES):
        raise HTTPException(status_code=400, detail="Blocked host")

    try:
        ip = ipaddress.ip_address(hostname)
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise HTTPException(status_code=400, detail="Blocked host")
    except ValueError:
        # Host is not a direct IP address; leave DNS resolution to yt-dlp/network layer.
        pass

    return url


def content_disposition_header(filename: str) -> str:
    # Starlette headers are latin-1 encoded; provide both safe ASCII and UTF-8 names.
    ascii_name = filename.encode("ascii", "ignore").decode("ascii")
    ascii_name = re.sub(r'[^A-Za-z0-9._ -]', "_", ascii_name).strip()
    if not ascii_name:
        ascii_name = "download.bin"
    utf8_name = quote(filename, safe="")
    return f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{utf8_name}"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/info")
def get_info(url: str = Query(..., min_length=5, max_length=MAX_URL_LENGTH)):
    url = validate_media_url(url)
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        return {
            "title": info.get("title"),
            "thumbnail": info.get("thumbnail"),
            "duration": info.get("duration"),
            "uploader": info.get("uploader"),
            "platform": info.get("extractor"),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/download")
def download(
    url: str = Query(..., min_length=5, max_length=MAX_URL_LENGTH),
    format: str = Query("mp4"),
):
    url = validate_media_url(url)
    if format not in ("mp4", "mp3"):
        raise HTTPException(status_code=400, detail="format must be mp4 or mp3")

    tmp_dir = tempfile.mkdtemp()

    try:
        if format == "mp4":
            ydl_opts = {
                "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]",
                "merge_output_format": "mp4",
                "outtmpl": os.path.join(tmp_dir, "%(title)s.%(ext)s"),
                "quiet": True,
            }
        else:
            ydl_opts = {
                "format": "bestaudio/best",
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "320",
                    }
                ],
                "outtmpl": os.path.join(tmp_dir, "%(title)s.%(ext)s"),
                "quiet": True,
            }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        files = list(Path(tmp_dir).glob("*"))
        if not files:
            raise HTTPException(status_code=500, detail="Download failed")

        output_file = files[0]
        filename = output_file.name

        def iterfile():
            with open(output_file, "rb") as f:
                while chunk := f.read(1024 * 1024):
                    yield chunk
            shutil.rmtree(tmp_dir, ignore_errors=True)

        mime = "video/mp4" if format == "mp4" else "audio/mpeg"

        return StreamingResponse(
            iterfile(),
            media_type=mime,
            headers={"Content-Disposition": content_disposition_header(filename)},
        )

    except HTTPException:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise
    except Exception as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))
