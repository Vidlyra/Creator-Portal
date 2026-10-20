
/* ==========================================
   VIDLYRA ADMIN PROJECTS
   File preview + approve/reject workflow
========================================== */

console.log("Vidlyra Admin Projects JS loaded");

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const projectsList = document.getElementById("projectsList");

const PROJECT_BUCKETS = {
    "anime": "stories",
    "story": "stories",
    "stories": "stories",
    "short film": "shortfilms",
    "short films": "shortfilms",
    "shortfilm": "shortfilms",
    "music": "music",
    "audio": "music",
    "artwork": "artwork",
    "art": "artwork",
    "manga": "manga"
};

let previewObjectUrl = null;

/* ==========================================
   GENERAL HELPERS
========================================== */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value).replace(/`/g, "&#096;");
}

function showLoading() {
    if (loading) loading.style.display = "block";
    if (errorBox) errorBox.style.display = "none";
    if (projectsList) projectsList.style.display = "none";
}

function showError(message) {
    console.error("Admin error:", message);

    if (loading) loading.style.display = "none";
    if (projectsList) projectsList.style.display = "none";

    if (errorBox) {
        errorBox.textContent = message || "Something went wrong.";
        errorBox.style.display = "block";
    }
}

function showProjects() {
    if (loading) loading.style.display = "none";
    if (errorBox) errorBox.style.display = "none";
    if (projectsList) projectsList.style.display = "block";
}

function getFileName(path) {
    const cleanPath = String(path || "").split("?")[0].split("#")[0];
    const name = cleanPath.split("/").pop() || "project-file";

    try {
        return decodeURIComponent(name);
    } catch {
        return name;
    }
}

function getExtension(name) {
    const match = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : "";
}

function getProjectBucket(category) {
    const key = String(category || "").trim().toLowerCase();
    return PROJECT_BUCKETS[key] || "stories";
}

/* ==========================================
   PREVIEW MODAL STYLES
   No separate HTML edit is required.
========================================== */

function addPreviewStyles() {
    if (document.getElementById("vidlyraPreviewStyles")) return;

    const style = document.createElement("style");
    style.id = "vidlyraPreviewStyles";

    style.textContent = `
        .vp-modal {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background: rgba(0,0,0,.88);
            backdrop-filter: blur(7px);
        }
        .vp-modal.open { display: flex; }
        .vp-dialog {
            width: min(1100px, 100%);
            height: min(850px, 94vh);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #101010;
            border: 1px solid #383838;
            border-radius: 15px;
            box-shadow: 0 20px 80px #000;
        }
        .vp-header, .vp-toolbar, .vp-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 13px 17px;
            border-bottom: 1px solid #292929;
        }
        .vp-header h2 {
            margin: 0;
            color: #ff7a00;
            font-size: 18px;
            overflow-wrap: anywhere;
        }
        .vp-header p {
            margin: 5px 0 0;
            color: #888;
            font-size: 12px;
        }
        .vp-toolbar {
            background: #151515;
            color: #bbb;
            font-size: 12px;
        }
        .vp-close, .vp-close-bottom {
            border: 1px solid #444;
            border-radius: 8px;
            padding: 8px 12px;
            background: #222;
            color: white;
            cursor: pointer;
        }
        .vp-close { font-size: 22px; }
        .vp-download {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 9px 13px;
            border-radius: 8px;
            background: #ff7a00;
            color: #111;
            font-size: 12px;
            font-weight: 700;
            text-decoration: none;
            white-space: nowrap;
        }
        .vp-content {
            flex: 1;
            min-height: 0;
            overflow: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 15px;
            color: #ddd;
        }
        .vp-image {
            display: block;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        .vp-image-wrap {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .vp-frame {
            width: 100%;
            height: 100%;
            min-height: 350px;
            border: 0;
            background: #fff;
        }
        .vp-video { max-width: 100%; max-height: 100%; }
        .vp-audio { width: min(650px, 100%); }
        .vp-message {
            width: 100%;
            max-width: 700px;
            margin: auto;
            padding: 25px;
            text-align: center;
            color: #bbb;
            overflow-wrap: anywhere;
        }
        .vp-message h3 { color: #ff7a00; margin-bottom: 12px; }
        .vp-message p { margin: 12px 0; line-height: 1.7; }
        .vp-text {
            align-self: stretch;
            width: 100%;
            min-height: 100%;
            padding: 18px;
            overflow: auto;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            background: #080808;
            color: #ddd;
            font: 13px/1.6 Consolas, monospace;
        }
        .vp-footer {
            border-top: 1px solid #292929;
            border-bottom: 0;
            color: #888;
            font-size: 11px;
        }
        body.vp-open { overflow: hidden; }
        @media(max-width:600px) {
            .vp-modal { padding: 5px; }
            .vp-dialog { height: 97vh; border-radius: 9px; }
            .vp-header, .vp-toolbar, .vp-footer {
                padding: 10px;
                align-items: flex-start;
                flex-wrap: wrap;
            }
            .vp-frame { min-height: 280px; }
            .vp-content { padding: 8px; }
            .vp-header h2 { font-size: 15px; }
        }
    `;

    document.head.appendChild(style);
}

/* ==========================================
   CREATE AND CONTROL PREVIEW MODAL
========================================== */

function ensurePreviewModal() {
    addPreviewStyles();

    let modal = document.getElementById("projectPreviewModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "projectPreviewModal";
    modal.className = "vp-modal";
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
        <section class="vp-dialog" role="dialog"
            aria-modal="true" aria-labelledby="vpTitle">

            <header class="vp-header">
                <div>
                    <h2 id="vpTitle">Project Preview</h2>
                    <p id="vpSubtitle">Review the submitted file.</p>
                </div>
                <button class="vp-close" id="vpClose"
                    type="button" aria-label="Close preview">×</button>
            </header>

            <div class="vp-toolbar">
                <span id="vpFileName">Loading file...</span>
                <a id="vpDownload" class="vp-download"
                    href="#" target="_blank" rel="noopener"
                    style="display:none">Open / Download</a>
            </div>

            <div id="vpContent" class="vp-content">
                Preparing preview...
            </div>

            <footer class="vp-footer">
                <span id="vpStatus">File preview</span>
                <button class="vp-close-bottom" id="vpCloseBottom"
                    type="button">Close</button>
            </footer>

        </section>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#vpClose").addEventListener(
        "click", closeProjectPreview
    );

    modal.querySelector("#vpCloseBottom").addEventListener(
        "click", closeProjectPreview
    );

    modal.addEventListener("click", event => {
        if (event.target === modal) closeProjectPreview();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && modal.classList.contains("open")) {
            closeProjectPreview();
        }
    });

    return modal;
}

function closeProjectPreview() {
    const modal = document.getElementById("projectPreviewModal");
    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("vp-open");

    const content = document.getElementById("vpContent");
    if (content) content.replaceChildren();

    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }
}

function setPreviewMessage(message, isError = false) {
    const content = document.getElementById("vpContent");
    if (!content) return;

    content.innerHTML = "";

    const box = document.createElement("div");
    box.className = "vp-message";
    box.textContent = message;

    if (isError) box.style.color = "#ff7777";
    content.appendChild(box);
}

function renderFilePreview(url, fileName, container) {
    if (!container) {
        console.error("Preview container not found.");
        return;
    }

    const extension = (fileName.split(".").pop() || "").toLowerCase();
    const safeUrl = url;

    container.innerHTML = "";

    if (["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(extension)) {
        const img = document.createElement("img");
        img.src = safeUrl;
        img.alt = fileName;
        img.style.cssText = "max-width:100%;max-height:70vh;object-fit:contain;";
        container.appendChild(img);

    } else if (extension === "pdf") {
        const frame = document.createElement("iframe");
        frame.src = safeUrl;
        frame.title = fileName;
        frame.style.cssText = "width:100%;height:70vh;border:0;";
        container.appendChild(frame);

    } else if (["mp4", "webm", "mov", "ogv"].includes(extension)) {
        const video = document.createElement("video");
        video.src = safeUrl;
        video.controls = true;
        video.style.cssText = "width:100%;max-height:70vh;";
        container.appendChild(video);

    } else if (["mp3", "wav", "ogg", "m4a"].includes(extension)) {
        const audio = document.createElement("audio");
        audio.src = safeUrl;
        audio.controls = true;
        audio.style.width = "100%";
        container.appendChild(audio);

    } else if (["txt", "html", "css", "js", "json", "md"].includes(extension)) {
        const link = document.createElement("a");
        link.href = safeUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Open or download " + fileName;
        container.appendChild(link);

    } else {
        const link = document.createElement("a");
        link.href = safeUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Download / open " + fileName;
        container.appendChild(link);
    }
}

/* ==========================================
   RENDER FILE PREVIEW
========================================== */


async function previewProject(project) {
    const modal = ensurePreviewModal();

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("vp-open");

    const title = document.getElementById("vpTitle");
    const subtitle = document.getElementById("vpSubtitle");
    const fileNameElement = document.getElementById("vpFileName");
    const downloadLink = document.getElementById("vpDownload");
    const status = document.getElementById("vpStatus");

    title.textContent = project.title || "Untitled Project";
    subtitle.textContent =
        `${project.category || "Uncategorized"} · Status: ${project.status || "Pending"}`;

    fileNameElement.textContent = "Locating file...";
    downloadLink.style.display = "none";
    downloadLink.removeAttribute("href");
    setPreviewMessage("Checking Supabase storage...");

    try {
        if (typeof sb === "undefined" || !sb) {
            throw new Error("Supabase client is unavailable.");
        }

        if (!project.file_path) {
            throw new Error("The project database record has no file_path.");
        }

        let path = String(project.file_path).trim();
        let bucket = getProjectBucket(project.category);

        // If file_path is a full Supabase Storage URL,
        // extract its bucket and object path.
        if (/^https?:\/\//i.test(path)) {
            const parsedUrl = new URL(path);
            const parts = parsedUrl.pathname.split("/").filter(Boolean);
            const objectIndex = parts.indexOf("object");

            if (objectIndex !== -1) {
                const accessType = parts[objectIndex + 1];

                if (["public", "sign", "authenticated"].includes(accessType)) {
                    bucket = parts[objectIndex + 2];
                    path = parts.slice(objectIndex + 3).join("/");
                    path = decodeURIComponent(path);
                } else {
                    throw new Error(
                        "Unrecognized Supabase Storage URL format."
                    );
                }
            } else {
                // A non-Supabase URL can be previewed directly.
                const externalName = getFileName(parsedUrl.pathname);
                fileNameElement.textContent = externalName;
                downloadLink.href = path;
                downloadLink.style.display = "inline-flex";

                await renderFilePreview(
                    path,
                    externalName,
                    getExtension(externalName)
                );
                return;
            }
        } else {
            path = path.replace(/^\/+/, "");

            const knownBuckets = [
                "stories", "shortfilms", "music", "artwork", "manga"
            ];

            const firstSegment = path.split("/")[0];

            if (
                knownBuckets.includes(firstSegment.toLowerCase())
            ) {
                bucket = firstSegment;
                path = path.split("/").slice(1).join("/");
            }
        }

        if (!path || !bucket) {
            throw new Error("Could not determine the storage bucket and file path.");
        }

        const fileName = getFileName(path);
        fileNameElement.textContent = fileName;

        // Try the expected bucket first, then the other configured buckets.
        const bucketCandidates = [
            ...new Set([
                bucket,
                "stories",
                "shortfilms",
                "music",
                "artwork",
                "manga"
            ])
        ];

        let signedUrl = null;
        let lastError = null;
        let matchedBucket = null;

        for (const candidate of bucketCandidates) {
            const result = await sb.storage
                .from(candidate)
                .createSignedUrl(path, 3600);

            if (!result.error && result.data?.signedUrl) {
                signedUrl = result.data.signedUrl;
                matchedBucket = candidate;
                break;
            }

            lastError = result.error;
            console.warn(
                `File not found in bucket "${candidate}"`,
                result.error?.message
            );
        }

        if (!signedUrl) {
            console.error("Storage lookup failed", {
                projectId: project.id,
                originalFilePath: project.file_path,
                attemptedPath: path,
                attemptedBuckets: bucketCandidates,
                lastError
            });

            throw new Error(
                "Object not found in the configured buckets. " +
                "Check the exact file path and bucket in Supabase Storage."
            );
        }

        console.log("Project file located:", {
            projectId: project.id,
            bucket: matchedBucket,
            path: path
        });

        downloadLink.href = signedUrl;
        downloadLink.style.display = "inline-flex";
        downloadLink.setAttribute("download", fileName);

        if (status) {
            status.textContent = `Preview · ${matchedBucket}`;
        }

        await renderFilePreview(
            signedUrl,
            fileName,
            getExtension(fileName)
        );

    } catch (error) {
        console.error("Project preview error:", error);

        setPreviewMessage(
            "Unable to preview this file. " +
            (error.message || "Check the bucket and file path."),
            true
        );

        if (status) status.textContent = "Preview failed";
    }
}

/* ==========================================
   OPEN PROJECT FILE
========================================== */

async function previewProject(project) {
    const modal = ensurePreviewModal();

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("vp-open");

    const title = document.getElementById("vpTitle");
    const subtitle = document.getElementById("vpSubtitle");
    const fileNameElement = document.getElementById("vpFileName");
    const downloadLink = document.getElementById("vpDownload");
    const status = document.getElementById("vpStatus");

    title.textContent = project.title || "Untitled Project";
    subtitle.textContent =
        `${project.category || "Uncategorized"} · Status: ${project.status || "Pending"}`;

    fileNameElement.textContent = "Loading file...";
    downloadLink.style.display = "none";
    downloadLink.removeAttribute("href");

    setPreviewMessage("Connecting to secure project storage...");

    try {
        if (typeof sb === "undefined" || !sb) {
            throw new Error("Supabase client is unavailable. Check js/config.js.");
        }

        if (!project.file_path) {
            throw new Error(
                "This project has no file_path saved in its Supabase record."
            );
        }

        let storagePath = String(project.file_path).trim();
        let bucket = getProjectBucket(project.category);

        /*
         * If file_path is stored as:
         * stories/folder/file.pdf
         * then extract the bucket prefix.
         */
        storagePath = storagePath.replace(/^\/+/, "");

        const knownBuckets = [
            "stories", "shortfilms", "music", "artwork", "manga"
        ];

        const firstSegment = storagePath.split("/")[0];

        if (knownBuckets.includes(firstSegment.toLowerCase())) {
            bucket = firstSegment;
            storagePath = storagePath.split("/").slice(1).join("/");
        }

        const fileName = getFileName(storagePath);
        const extension = getExtension(fileName);

        fileNameElement.textContent = fileName;

        const { data, error } = await sb.storage
            .from(bucket)
            .createSignedUrl(storagePath, 3600);

        if (error) throw error;

        if (!data || !data.signedUrl) {
            throw new Error("Supabase did not return a signed URL.");
        }

        downloadLink.href = data.signedUrl;
        downloadLink.style.display = "inline-flex";
        downloadLink.setAttribute("download", fileName);

        await renderFilePreview(data.signedUrl, fileName, extension);

    } catch (error) {
        console.error("Project preview error:", error);

        setPreviewMessage(
            "Unable to preview this file. " +
            (error.message || "Check the storage bucket, path and permissions."),
            true
        );

        if (status) status.textContent = "Preview failed";
    }
}

/* ==========================================
   AUTHENTICATION AND ADMIN CHECK
========================================== */

async function getCurrentUser() {
    const { data, error } = await sb.auth.getUser();

    if (error) throw error;

    return data?.user || null;
}

async function checkAdmin(userId) {
    const { data: profile, error } = await sb
        .from("profiles")
        .select("user_id, full_name, email, creator_role")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;

    return String(profile?.creator_role || "").toLowerCase() === "admin";
}

/* ==========================================
   LOAD PROJECTS
========================================== */

async function loadProjects() {
    const { data, error } = await sb
        .from("projects")
        .select(`
            id,
            user_id,
            title,
            description,
            category,
            thumbnail,
            file_path,
            status,
            created_at
        `)
        .order("created_at", { ascending: false });

    if (error) throw error;

    renderProjects(data || []);
}

function renderProjects(projects) {
    if (!projectsList) {
        console.error("projectsList element not found.");
        return;
    }

    projectsList.innerHTML = "";

    if (!projects.length) {
        projectsList.innerHTML = `
            <div class="empty">
                <h3>No projects found</h3>
                <p>There are currently no creator submissions.</p>
            </div>
        `;

        showProjects();
        return;
    }

    projects.forEach(project => {
        projectsList.appendChild(createProjectCard(project));
    });

    showProjects();
}

/* ==========================================
   PROJECT CARD
========================================== */

function createProjectCard(project) {
    const card = document.createElement("div");
    card.className = "project-card";

    const status = String(project.status || "Pending");
    const statusClass = status.toLowerCase();
    const createdDate = project.created_at
        ? new Date(project.created_at).toLocaleString()
        : "Unknown";

    card.innerHTML = `
        <div class="project-header">
            <div>
                <h3>${escapeHTML(project.title || "Untitled Project")}</h3>
                <span class="category">
                    ${escapeHTML(project.category || "Unknown")}
                </span>
            </div>
            <span class="status ${escapeAttribute(statusClass)}">
                ${escapeHTML(status)}
            </span>
        </div>

        <div class="project-body">
            <p>${escapeHTML(project.description || "No description provided.")}</p>

            <div class="project-meta">
                <span>👤 Creator: ${escapeHTML(project.user_id || "-")}</span>
                <span>📅 ${escapeHTML(createdDate)}</span>
            </div>
        </div>

        <div class="project-actions">
            <button type="button" class="view-btn" data-action="view">
                View File
            </button>

            ${
                status.toLowerCase() === "pending"
                ? `
                    <button type="button" class="approve-btn" data-action="approve">
                        ✓ Approve
                    </button>
                    <button type="button" class="reject-btn" data-action="reject">
                        ✕ Reject
                    </button>
                `
                : ""
            }
        </div>
    `;

    card.querySelector('[data-action="view"]')
        .addEventListener("click", () => previewProject(project));

    const approveButton = card.querySelector('[data-action="approve"]');

    if (approveButton) {
        approveButton.addEventListener("click", () => {
            approveProject(project, approveButton);
        });
    }

    const rejectButton = card.querySelector('[data-action="reject"]');

    if (rejectButton) {
        rejectButton.addEventListener("click", () => {
            rejectProject(project, rejectButton);
        });
    }

    return card;
}

/* ==========================================
   NOTIFICATIONS
========================================== */

async function createNotification(userId, title, message, type) {
    try {
        const { data, error } = await sb
            .from("notifications")
            .insert({
                user_id: userId,
                title: title,
                message: message,
                type: type,
                is_read: false
            })
            .select()
            .single();

        if (error) {
            console.error("Notification insert error:", error);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Notification error:", error);
        return null;
    }
}

/* ==========================================
   APPROVE PROJECT
========================================== */

async function approveProject(project, button) {
    if (!confirm(`Approve "${project.title}"?`)) return;

    if (button) {
        button.disabled = true;
        button.textContent = "Approving...";
    }

    try {
        const { error } = await sb
            .from("projects")
            .update({ status: "Approved" })
            .eq("id", project.id);

        if (error) throw error;

        await createNotification(
            project.user_id,
            "Project Approved 🎉",
            `Your project "${project.title}" was approved and is now pending publication.`,
            "project_approved"
        );

        alert("Project approved successfully.");
        await loadProjects();

    } catch (error) {
        console.error("Approve error:", error);

        alert("Unable to approve project:\n\n" + error.message);

        if (button) {
            button.disabled = false;
            button.textContent = "✓ Approve";
        }
    }
}

/* ==========================================
   REJECT PROJECT
========================================== */

async function rejectProject(project, button) {
    const reason = prompt(`Why are you rejecting "${project.title}"?`);

    if (reason === null) return;

    const cleanReason = reason.trim();

    if (!cleanReason) {
        alert("Please enter a rejection reason.");
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Rejecting...";
    }

    try {
        const { error } = await sb
            .from("projects")
            .update({ status: "Rejected" })
            .eq("id", project.id);

        if (error) throw error;

        await createNotification(
            project.user_id,
            "Project Rejected",
            `Your project "${project.title}" was rejected. Reason: ${cleanReason}`,
            "project_rejected"
        );

        alert("Project rejected successfully.");
        await loadProjects();

    } catch (error) {
        console.error("Reject error:", error);

        alert("Unable to reject project:\n\n" + error.message);

        if (button) {
            button.disabled = false;
            button.textContent = "✕ Reject";
        }
    }
}

/* ==========================================
   LOGOUT
========================================== */

async function logout() {
    try {
        const { error } = await sb.auth.signOut();

        if (error) throw error;

        window.location.href = "login.html";

    } catch (error) {
        console.error("Logout error:", error);
        alert("Unable to logout. Please try again.");
    }
}

/* ==========================================
   START ADMIN PAGE
========================================== */

async function loadAdminProjects() {
    showLoading();

    try {
        if (typeof sb === "undefined" || !sb) {
            throw new Error(
                "Supabase client is not available. Check js/config.js."
            );
        }

        const user = await getCurrentUser();

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const isAdmin = await checkAdmin(user.id);

        if (!isAdmin) {
            showError("Access denied. Admin account required.");
            return;
        }

        await loadProjects();

        console.log("Admin projects loaded successfully.");

    } catch (error) {
        console.error("Admin page error:", error);

        showError(
            error.message || "Unable to load admin projects."
        );
    }
}

document.addEventListener("DOMContentLoaded", loadAdminProjects);
