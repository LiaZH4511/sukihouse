const form = document.querySelector("#uploadForm");
const input = document.querySelector("#fileInput");
const fileList = document.querySelector("#fileList");
const fileCount = document.querySelector("#fileCount");
const convertButton = document.querySelector("#convertButton");
const downloadButton = document.querySelector("#downloadButton");
const clearButton = document.querySelector("#clearButton");
const statusPill = document.querySelector("#statusPill");
const addButton = document.querySelector("#addButton");
const formatOptions = document.querySelectorAll(".format-option");
const downloadHint = document.querySelector("#downloadHint");
const xUrlInput = document.querySelector("#xUrlInput");
const xDownloadButton = document.querySelector("#xDownloadButton");
const xFileButton = document.querySelector("#xFileButton");
const xStatus = document.querySelector("#xStatus");
const xTypeOptions = document.querySelectorAll(".x-type-option");
const featurePickButton = document.querySelector("#featurePickButton");
const featureZipButton = document.querySelector("#featureZipButton");
const featureLocalButton = document.querySelector("#featureLocalButton");
const localInfo = document.querySelector("#localInfo");

let selectedFiles = [];
let outputFormat = "jpeg";
let xMediaType = "video";
const formatLabels = {
  jpeg: "JPEG",
  png: "PNG",
  svg: "SVG",
};

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function setStatus(label, type = "") {
  statusPill.textContent = label;
  statusPill.className = `status-pill ${type}`.trim();
}

function renderFiles(statusByName = new Map()) {
  fileList.innerHTML = "";
  fileCount.textContent = selectedFiles.length;
  convertButton.disabled = selectedFiles.length === 0;
  clearButton.disabled = selectedFiles.length === 0;

  for (const file of selectedFiles) {
    const row = document.createElement("li");
    row.className = "file-row";

    const icon = document.createElement("span");
    icon.className = "file-icon";
    icon.textContent = "RAF";

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = file.name;

    const target = document.createElement("span");
    target.className = "file-target";
    target.textContent = `到 ${formatLabels[outputFormat]}`;

    const meta = document.createElement("span");
    const result = statusByName.get(file.name);
    meta.className = `file-meta ${result?.type || ""}`.trim();
    meta.textContent = result?.label || "准备好";

    const size = document.createElement("span");
    size.className = "file-size";
    size.textContent = formatBytes(file.size);

    row.append(icon, name, target, meta, size);
    fileList.append(row);
  }
}

function setDownload(url) {
  if (!url) {
    downloadButton.href = "#";
    downloadButton.classList.add("disabled");
    downloadButton.setAttribute("aria-disabled", "true");
    return;
  }

  downloadButton.href = url;
  downloadButton.classList.remove("disabled");
  downloadButton.removeAttribute("aria-disabled");
}

function updateFormatText() {
  const label = formatLabels[outputFormat];
  downloadButton.textContent = `下载 ${label}`;
  downloadHint.textContent = `转换完成后会生成一个 ${label} 压缩包`;
}

function setOutputFormat(format) {
  outputFormat = format;
  for (const option of formatOptions) {
    option.classList.toggle("active", option.dataset.format === format);
  }
  setDownload(null);
  updateFormatText();
  renderFiles();
}

function setXDownload(url) {
  if (!url) {
    xFileButton.href = "#";
    xFileButton.classList.add("disabled");
    xFileButton.setAttribute("aria-disabled", "true");
    return;
  }

  xFileButton.href = url;
  xFileButton.classList.remove("disabled");
  xFileButton.removeAttribute("aria-disabled");
}

function setXMediaType(type) {
  xMediaType = type;
  for (const option of xTypeOptions) {
    option.classList.toggle("active", option.dataset.type === type);
  }
  setXDownload(null);
  xStatus.textContent = type === "gif" ? "X 的 GIF 通常会保存为 MP4 视频文件。" : "仅支持你有权保存的公开内容。";
}

function chooseFiles(files) {
  const existing = new Set(selectedFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
  const incoming = [...files].filter((file) => file.name.toLowerCase().endsWith(".raf"));
  for (const file of incoming) {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (!existing.has(key)) {
      selectedFiles.push(file);
      existing.add(key);
    }
  }
  setDownload(null);
  setStatus(selectedFiles.length ? "已选择" : "待选择", selectedFiles.length ? "ready" : "");
  renderFiles();
}

form.addEventListener("click", () => {
  if (selectedFiles.length === 0) input.click();
});
addButton.addEventListener("click", () => input.click());
input.addEventListener("change", () => chooseFiles(input.files));
for (const option of formatOptions) {
  option.addEventListener("click", () => setOutputFormat(option.dataset.format));
}
for (const option of xTypeOptions) {
  option.addEventListener("click", () => setXMediaType(option.dataset.type));
}

form.addEventListener("dragover", (event) => {
  event.preventDefault();
  form.classList.add("dragging");
});

form.addEventListener("dragleave", () => form.classList.remove("dragging"));

form.addEventListener("drop", (event) => {
  event.preventDefault();
  form.classList.remove("dragging");
  chooseFiles(event.dataTransfer.files);
});

clearButton.addEventListener("click", () => {
  selectedFiles = [];
  input.value = "";
  setDownload(null);
  setStatus("待选择");
  renderFiles();
});

downloadButton.addEventListener("click", (event) => {
  if (downloadButton.classList.contains("disabled")) event.preventDefault();
});

convertButton.addEventListener("click", async () => {
  if (!selectedFiles.length) return;

  const pending = new Map(selectedFiles.map((file) => [file.name, { label: "转换中", type: "work" }]));
  renderFiles(pending);
  setDownload(null);
  setStatus("转换中", "ready");
  convertButton.disabled = true;

  const payload = new FormData();
  payload.append("format", outputFormat);
  for (const file of selectedFiles) payload.append("files", file);

  try {
    const response = await fetch("/convert", { method: "POST", body: payload });
    const data = await response.json();
    const statuses = new Map();

    for (const item of data.converted || []) {
      statuses.set(item.name, { label: `完成 · ${formatBytes(item.bytes)}`, type: "ok" });
    }
    for (const item of data.failed || []) {
      statuses.set(item.name, { label: item.reason || "失败", type: "fail" });
    }

    renderFiles(statuses);
    setDownload(data.downloadUrl);
    setStatus(data.converted?.length ? "已完成" : "失败", data.converted?.length ? "done" : "error");
  } catch (error) {
    const statuses = new Map(selectedFiles.map((file) => [file.name, { label: "请求失败", type: "fail" }]));
    renderFiles(statuses);
    setStatus("失败", "error");
  } finally {
    convertButton.disabled = selectedFiles.length === 0;
  }
});

xFileButton.addEventListener("click", (event) => {
  if (xFileButton.classList.contains("disabled")) event.preventDefault();
});

featurePickButton.addEventListener("click", () => input.click());

featureZipButton.addEventListener("click", () => {
  if (!downloadButton.classList.contains("disabled")) {
    downloadButton.click();
    return;
  }

  downloadHint.textContent = "先完成一次 RAF 转换，这里就可以下载 ZIP。";
  document.querySelector(".workspace").scrollIntoView({ behavior: "smooth", block: "center" });
});

featureLocalButton.addEventListener("click", () => {
  const willOpen = localInfo.hidden;
  localInfo.hidden = !willOpen;
  featureLocalButton.setAttribute("aria-expanded", String(willOpen));
});

xDownloadButton.addEventListener("click", async () => {
  const url = xUrlInput.value.trim();
  if (!url) {
    xStatus.textContent = "请先粘贴 X/Twitter 推文链接。";
    setXDownload(null);
    return;
  }

  xDownloadButton.disabled = true;
  setXDownload(null);
  xStatus.textContent = "正在下载媒体...";

  try {
    const response = await fetch("/download-x", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, type: xMediaType }),
    });
    const data = await response.json();

    if (!response.ok) {
      xStatus.textContent = data.error || "下载失败。";
      return;
    }

    const count = data.files?.length || 0;
    xStatus.textContent = count ? `完成，已打包 ${count} 个媒体文件。` : "完成。";
    setXDownload(data.downloadUrl);
  } catch (error) {
    xStatus.textContent = "请求失败，请稍后重试。";
  } finally {
    xDownloadButton.disabled = false;
  }
});

renderFiles();
updateFormatText();
setXMediaType("video");
