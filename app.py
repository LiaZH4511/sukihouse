from __future__ import annotations

import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import tempfile
import uuid
import zipfile
from base64 import b64encode
from email import policy
from email.parser import BytesParser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).parent.resolve()
STATIC_DIR = ROOT / "static"
OUTPUT_DIR = ROOT / "converted"
MAX_UPLOAD_BYTES = 8 * 1024 * 1024 * 1024
OUTPUT_FORMATS = {
    "jpeg": {"sips": "jpeg", "extension": "jpg", "label": "JPEG"},
    "png": {"sips": "png", "extension": "png", "label": "PNG"},
    "svg": {"sips": "png", "extension": "svg", "label": "SVG"},
}
X_HOSTS = {"x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"}


def safe_stem(filename: str) -> str:
    stem = Path(filename).stem.strip() or "photo"
    return re.sub(r"[^A-Za-z0-9._-]+", "_", stem)[:120]


def json_bytes(payload: dict, status: HTTPStatus = HTTPStatus.OK) -> tuple[bytes, int, str]:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8"), status.value, "application/json; charset=utf-8"


def unique_output_name(filename: str, extension: str, used_names: set[str]) -> str:
    stem = safe_stem(filename)
    candidate = f"{stem}.{extension}"
    suffix = 2
    while candidate in used_names:
        candidate = f"{stem}-{suffix}.{extension}"
        suffix += 1
    used_names.add(candidate)
    return candidate


def image_dimensions(converter: str, path: Path) -> tuple[int, int] | None:
    completed = subprocess.run(
        [converter, "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if completed.returncode != 0:
        return None

    width_match = re.search(r"pixelWidth:\s*(\d+)", completed.stdout)
    height_match = re.search(r"pixelHeight:\s*(\d+)", completed.stdout)
    if not width_match or not height_match:
        return None
    return int(width_match.group(1)), int(height_match.group(1))


def wrap_png_as_svg(converter: str, png_path: Path, svg_path: Path) -> None:
    encoded = b64encode(png_path.read_bytes()).decode("ascii")
    dimensions = image_dimensions(converter, png_path)
    if dimensions:
        width, height = dimensions
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}">'
            f'<image width="{width}" height="{height}" href="data:image/png;base64,{encoded}"/>'
            "</svg>\n"
        )
    else:
        svg = f'<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,{encoded}"/></svg>\n'
    svg_path.write_text(svg, encoding="utf-8")


def is_allowed_x_url(url: str) -> bool:
    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"}:
        return False
    if parsed.netloc.lower() not in X_HOSTS:
        return False
    return bool(re.search(r"/status(?:es)?/\d+", parsed.path))


def ytdlp_command() -> list[str] | None:
    if shutil.which("yt-dlp"):
        return ["yt-dlp"]
    try:
        subprocess.run([sys.executable, "-m", "yt_dlp", "--version"], capture_output=True, text=True, timeout=10, check=True)
    except (subprocess.SubprocessError, OSError):
        return None
    return [sys.executable, "-m", "yt_dlp"]


class RafConverterHandler(BaseHTTPRequestHandler):
    server_version = "RafBatchConverter/1.0"

    def do_GET(self) -> None:
        if self.path == "/" or self.path == "/index.html":
            self.send_file(STATIC_DIR / "index.html", "text/html; charset=utf-8")
            return

        if self.path.startswith("/static/"):
            target = (ROOT / unquote(self.path.lstrip("/"))).resolve()
            if not target.is_relative_to(STATIC_DIR):
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
            self.send_file(target, content_type)
            return

        if self.path.startswith("/download/"):
            job_id = unquote(self.path.removeprefix("/download/")).strip()
            if not re.fullmatch(r"[a-f0-9-]{36}", job_id):
                self.send_error(HTTPStatus.NOT_FOUND)
                return

            archive = OUTPUT_DIR / f"{job_id}.zip"
            if not archive.exists():
                self.send_error(HTTPStatus.NOT_FOUND)
                return

            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Length", str(archive.stat().st_size))
            self.send_header("Content-Disposition", 'attachment; filename="raf-converted.zip"')
            self.end_headers()
            with archive.open("rb") as file:
                shutil.copyfileobj(file, self.wfile)
            return

        self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        if self.path == "/convert":
            result = self.convert_upload()
            self.send_payload(*result)
            return

        if self.path == "/download-x":
            result = self.download_x_media()
            self.send_payload(*result)
            return

        self.send_error(HTTPStatus.NOT_FOUND)

    def download_x_media(self) -> tuple[bytes, int, str]:
        command_prefix = ytdlp_command()
        if command_prefix is None:
            return json_bytes({"error": "没有找到 yt-dlp。请先运行 python3 -m pip install yt-dlp。"}, HTTPStatus.INTERNAL_SERVER_ERROR)

        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > 8192:
            return json_bytes({"error": "请求内容无效。"}, HTTPStatus.BAD_REQUEST)

        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return json_bytes({"error": "请求格式无效。"}, HTTPStatus.BAD_REQUEST)

        url = str(payload.get("url", "")).strip()
        media_type = str(payload.get("type", "video")).strip().lower()
        if media_type not in {"video", "gif"}:
            return json_bytes({"error": "请选择视频或 GIF。"}, HTTPStatus.BAD_REQUEST)
        if not is_allowed_x_url(url):
            return json_bytes({"error": "请输入公开的 X/Twitter 推文链接。"}, HTTPStatus.BAD_REQUEST)

        OUTPUT_DIR.mkdir(exist_ok=True)
        job_id = str(uuid.uuid4())
        archive = OUTPUT_DIR / f"{job_id}.zip"

        with tempfile.TemporaryDirectory(prefix="x-media-") as temp_dir:
            temp_path = Path(temp_dir)
            output_template = str(temp_path / "%(title).80s-%(id)s.%(ext)s")
            command = [
                *command_prefix,
                "--no-playlist",
                "--restrict-filenames",
                "--merge-output-format",
                "mp4",
                "-f",
                "bv*+ba/best",
                "-o",
                output_template,
                url,
            ]
            completed = subprocess.run(command, capture_output=True, text=True, timeout=300)
            media_files = [path for path in temp_path.iterdir() if path.is_file() and path.suffix.lower() not in {".part", ".ytdl"}]

            if completed.returncode != 0 or not media_files:
                detail = (completed.stderr or completed.stdout or "").strip()
                reason = "下载失败，可能需要登录、链接不可公开访问，或该推文没有可下载媒体。"
                if "Unsupported URL" in detail:
                    reason = "这个链接暂不支持。"
                return json_bytes({"error": reason}, HTTPStatus.UNPROCESSABLE_ENTITY)

            downloaded = [{"name": path.name, "bytes": path.stat().st_size} for path in media_files]
            with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as zipped:
                for path in media_files:
                    zipped.write(path, path.name)

        return json_bytes(
            {
                "jobId": job_id,
                "downloadUrl": f"/download/{job_id}",
                "type": "GIF" if media_type == "gif" else "视频",
                "files": downloaded,
            }
        )

    def convert_upload(self) -> tuple[bytes, int, str]:
        converter = shutil.which("sips")
        if converter is None:
            return json_bytes({"error": "没有找到 macOS 自带的 sips 转换器。"}, HTTPStatus.INTERNAL_SERVER_ERROR)

        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return json_bytes({"error": "没有收到文件。"}, HTTPStatus.BAD_REQUEST)
        if length > MAX_UPLOAD_BYTES:
            return json_bytes({"error": "上传内容太大。"}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)

        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            return json_bytes({"error": "请使用表单上传 RAF 文件。"}, HTTPStatus.BAD_REQUEST)

        body = self.rfile.read(length)
        message = BytesParser(policy=policy.default).parsebytes(
            f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8") + body
        )

        files = []
        target_format = "jpeg"
        for part in message.iter_parts():
            filename = part.get_filename()
            if not filename:
                field_name = part.get_param("name", header="content-disposition")
                if field_name == "format":
                    value = (part.get_payload(decode=True) or b"").decode("utf-8", errors="ignore").strip().lower()
                    if value in OUTPUT_FORMATS:
                        target_format = value
                continue
            data = part.get_payload(decode=True)
            if data is not None:
                files.append((filename, data))

        if not files:
            return json_bytes({"error": "没有找到可转换的文件。"}, HTTPStatus.BAD_REQUEST)

        OUTPUT_DIR.mkdir(exist_ok=True)
        job_id = str(uuid.uuid4())
        converted = []
        failed = []
        format_info = OUTPUT_FORMATS[target_format]
        used_names: set[str] = set()

        with tempfile.TemporaryDirectory(prefix="raf-convert-") as temp_dir:
            temp_path = Path(temp_dir)
            out_dir = temp_path / target_format
            out_dir.mkdir()

            for index, (filename, data) in enumerate(files, start=1):
                if Path(filename).suffix.lower() != ".raf":
                    failed.append({"name": filename, "reason": "不是 RAF 文件"})
                    continue

                input_path = temp_path / f"{index:04d}_{safe_stem(filename)}.raf"
                output_name = unique_output_name(filename, format_info["extension"], used_names)
                output_path = out_dir / output_name
                sips_output_path = output_path if target_format != "svg" else out_dir / f"{Path(output_name).stem}.png"
                input_path.write_bytes(data)

                if target_format == "jpeg":
                    command = [
                        converter,
                        "-s",
                        "format",
                        "jpeg",
                        "-s",
                        "formatOptions",
                        "92",
                        str(input_path),
                        "--out",
                        str(sips_output_path),
                    ]
                else:
                    command = [converter, "-s", "format", format_info["sips"], str(input_path), "--out", str(sips_output_path)]
                completed = subprocess.run(command, capture_output=True, text=True, timeout=180)
                if target_format == "svg" and completed.returncode == 0 and sips_output_path.exists():
                    wrap_png_as_svg(converter, sips_output_path, output_path)

                if completed.returncode == 0 and output_path.exists() and output_path.stat().st_size > 0:
                    converted.append({"name": filename, "output": output_name, "bytes": output_path.stat().st_size})
                else:
                    detail = (completed.stderr or completed.stdout or "").strip()
                    reason = "无法解码这个 RAF 文件"
                    if detail and "sips --help" not in detail:
                        reason = detail.splitlines()[-1]
                    failed.append({"name": filename, "reason": reason})

            if converted:
                archive = OUTPUT_DIR / f"{job_id}.zip"
                with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as zipped:
                    for item in converted:
                        zipped.write(out_dir / item["output"], item["output"])

        status = HTTPStatus.OK if converted else HTTPStatus.UNPROCESSABLE_ENTITY
        return json_bytes(
            {
                "jobId": job_id if converted else None,
                "downloadUrl": f"/download/{job_id}" if converted else None,
                "format": format_info["label"],
                "converted": converted,
                "failed": failed,
            },
            status,
        )

    def send_file(self, path: Path, content_type: str) -> None:
        if not path.exists() or not path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        data = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_payload(self, data: bytes, status: int, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format: str, *args: object) -> None:
        print(f"{self.address_string()} - {format % args}")


def main() -> None:
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("127.0.0.1", port), RafConverterHandler)
    print(f"RAF 批量转换网站已启动：http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
