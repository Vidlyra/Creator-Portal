// ==========================================
// VIDLYRA ADMIN DASHBOARD - SIMPLE VERSION
// ==========================================

console.log("Admin Dashboard loaded");

// ==========================================
// ELEMENTS
// ==========================================

const loading = document.getElementById("loading");
const projectsContainer = document.getElementById("projects");
const emptyBox = document.getElementById("empty");
const errorBox = document.getElementById("error");

// ==========================================
// CATEGORY → STORAGE BUCKET
// ==========================================

function getBucket(category) {

    const buckets = {
        "Anime": "stories",
        "Short Film": "shortfilms",
        "Music": "music",
        "Artwork": "artwork",
        "Manga": "manga"
    };

    return buckets[category] || "stories";
}

// ==========================================
// CHECK ADMIN
// ==========================================

async function checkAdmin() {

    const {
        data: { user },
        error
    } = await sb.auth.getUser();

    if (error || !user) {

        window.location.href = "login.html";
        return null;
    }

    console.log("Logged in user:", user.id);

    const {
        data: profile,
        error: profileError
    } = await sb
        .from("profiles")
        .select("user_id,is_admin")
        .eq("user_id", user.id)
        .maybeSingle();

    if (profileError) {
        throw profileError;
    }

    if (!profile || profile.is_admin !== true) {

        alert("Admin access required.");

        window.location.href = "dashboard.html";

        return null;
    }

    return user;
}

// ==========================================
// LOAD STATISTICS
// ==========================================

async function loadStats() {

    const {
        data,
        error
    } = await sb
        .from("projects")
        .select("status");

    if (error) {

        console.error("Stats error:", error);

        return;
    }

    const projects = data || [];

    const pending =
        projects.filter(
            p => p.status === "Pending"
        ).length;

    const approved =
        projects.filter(
            p => p.status === "Approved"
        ).length;

    const rejected =
        projects.filter(
            p => p.status === "Rejected"
        ).length;

    const pendingElement =
        document.getElementById("pendingCount");

    const approvedElement =
        document.getElementById("approvedCount");

    const rejectedElement =
        document.getElementById("rejectedCount");

    if (pendingElement) {
        pendingElement.textContent = pending;
    }

    if (approvedElement) {
        approvedElement.textContent = approved;
    }

    if (rejectedElement) {
        rejectedElement.textContent = rejected;
    }

    console.log("Stats:", {
        pending,
        approved,
        rejected
    });
}

// ==========================================
// LOAD PENDING PROJECTS
// ==========================================

async function loadProjects() {

    if (!projectsContainer) {

        console.error(
            "Projects container not found."
        );

        return;
    }

    if (loading) {
        loading.style.display = "block";
    }

    if (emptyBox) {
        emptyBox.style.display = "none";
    }

    if (errorBox) {
        errorBox.style.display = "none";
    }

    projectsContainer.innerHTML = "";

    const {
        data: projects,
        error
    } = await sb
        .from("projects")
        .select(`
            id,
            user_id,
            title,
            description,
            category,
            thumbnail,
            status,
            created_at,
            file_path,
            admin_note
        `)
        .eq("status", "Pending")
        .order("created_at", {
            ascending: false
        });

    if (loading) {
        loading.style.display = "none";
    }

    if (error) {

        console.error(
            "Projects error:",
            error
        );

        showError(error.message);

        return;
    }

    console.log(
        "Pending projects:",
        projects
    );

    if (!projects || projects.length === 0) {

        if (emptyBox) {
            emptyBox.style.display = "block";
        }

        return;
    }

    projects.forEach(
        project => renderProject(project)
    );
}

// ==========================================
// RENDER PROJECT
// ==========================================

function renderProject(project) {

    const card =
        document.createElement("article");

    card.className = "project-card";

    const title =
        escapeHTML(
            project.title ||
            "Untitled Project"
        );

    const description =
        escapeHTML(
            project.description ||
            "No description."
        );

    const category =
        project.category ||
        "Anime";

    const safeCategory =
        escapeHTML(category);

    const date =
        project.created_at
            ? new Date(
                project.created_at
            ).toLocaleDateString("en-IN")
            : "Unknown";

    const thumbnail =
        project.thumbnail || "";

    console.log(
        "Project:",
        project.title
    );

    console.log(
        "Category:",
        category
    );

    console.log(
        "Bucket:",
        getBucket(category)
    );

    console.log(
        "File path:",
        project.file_path
    );

    console.log(
        "Thumbnail:",
        thumbnail
    );

    card.innerHTML = `

        ${
            thumbnail
                ? `
                    <img
                        class="thumbnail"
                        src="${escapeAttribute(thumbnail)}"
                        alt="${title}"
                        onerror="this.style.display='none'"
                    >
                  `
                : `
                    <div class="thumbnail">
                    </div>
                  `
        }

        <div class="project-info">

            <h3>
                ${title}
            </h3>

            <p class="description">
                ${description}
            </p>

            <div class="meta">

                <span class="badge">
                    ${safeCategory}
                </span>

                <span class="badge pending">
                    Pending
                </span>

                <span class="badge">
                    ${date}
                </span>

            </div>

            <div class="actions">

                ${
                    project.file_path
                        ? `
                            <button
                                class="view"
                                type="button"
                                onclick="viewProject('${project.id}')"
                            >
                                👁 View
                            </button>
                          `
                        : ""
                }

                <button
                    class="approve"
                    type="button"
                    onclick="approveProject('${project.id}')"
                >
                    ✓ Approve
                </button>

                <button
                    class="reject"
                    type="button"
                    onclick="rejectProject('${project.id}')"
                >
                    ✕ Reject
                </button>

            </div>

        </div>
    `;

    projectsContainer.appendChild(card);
}

// ==========================================
// VIEW PROJECT
// ==========================================

async function viewProject(projectId) {

    console.log(
        "VIEW PROJECT:",
        projectId
    );

    try {

        const {
            data: project,
            error: projectError
        } = await sb
            .from("projects")
            .select(`
                id,
                title,
                category,
                file_path
            `)
            .eq("id", projectId)
            .maybeSingle();

        if (projectError) {
            throw projectError;
        }

        if (!project) {

            alert(
                "Project not found."
            );

            return;
        }

        if (!project.file_path) {

            alert(
                "This project has no file."
            );

            return;
        }

        const bucket =
            getBucket(project.category);

        console.log(
            "Category:",
            project.category
        );

        console.log(
            "Bucket:",
            bucket
        );

        console.log(
            "File path:",
            project.file_path
        );

        // ----------------------------------
        // Create signed URL
        // ----------------------------------

        const {
            data,
            error
        } = await sb.storage
            .from(bucket)
            .createSignedUrl(
                project.file_path,
                3600
            );

        if (error) {

            console.error(
                "Storage error:",
                error
            );

            alert(
                "File could not be opened.\n\n" +
                "Bucket: " +
                bucket +
                "\n" +
                "Path: " +
                project.file_path +
                "\n\n" +
                "Check this file in Supabase Storage."
            );

            return;
        }

        if (!data || !data.signedUrl) {

            alert(
                "Supabase did not return a file URL."
            );

            return;
        }

        console.log(
            "Opening:",
            data.signedUrl
        );

        window.open(
            data.signedUrl,
            "_blank"
        );

    } catch (error) {

        console.error(
            "View project error:",
            error
        );

        alert(
            "Unable to open project:\n\n" +
            error.message
        );
    }
}

// ==========================================
// APPROVE PROJECT
// ==========================================

async function approveProject(projectId) {

    const confirmed =
        confirm(
            "Approve this project?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const {
            data: { user }
        } = await sb.auth.getUser();

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }

        const {
            error
        } = await sb
            .from("projects")
            .update({
                status: "Approved",
                reviewed_at:
                    new Date().toISOString(),
                reviewed_by:
                    user.id
            })
            .eq(
                "id",
                projectId
            );

        if (error) {
            throw error;
        }

        alert(
            "Project approved! ✓"
        );

        await loadStats();
        await loadProjects();

    } catch (error) {

        console.error(
            "Approve error:",
            error
        );

        showError(
            "Approval failed: " +
            error.message
        );
    }
}

// ==========================================
// REJECT PROJECT
// ==========================================

async function rejectProject(projectId) {

    const note =
        prompt(
            "Reason for rejection:"
        );

    if (note === null) {
        return;
    }

    try {

        const {
            data: { user }
        } = await sb.auth.getUser();

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }

        const {
            error
        } = await sb
            .from("projects")
            .update({
                status: "Rejected",
                admin_note:
                    note.trim(),
                reviewed_at:
                    new Date().toISOString(),
                reviewed_by:
                    user.id
            })
            .eq(
                "id",
                projectId
            );

        if (error) {
            throw error;
        }

        alert(
            "Project rejected."
        );

        await loadStats();
        await loadProjects();

    } catch (error) {

        console.error(
            "Reject error:",
            error
        );

        showError(
            "Rejection failed: " +
            error.message
        );
    }
}

// ==========================================
// ERROR
// ==========================================

function showError(message) {

    if (loading) {
        loading.style.display = "none";
    }

    if (errorBox) {

        errorBox.textContent =
            message;

        errorBox.style.display =
            "block";
    }
}

// ==========================================
// SECURITY
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {

    return escapeHTML(value);
}

// ==========================================
// START
// ==========================================

async function startDashboard() {

    try {

        const user =
            await checkAdmin();

        if (!user) {
            return;
        }

        await loadStats();

        await loadProjects();

        console.log(
            "Admin dashboard ready."
        );

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        showError(
            error.message
        );
    }
}

startDashboard();
