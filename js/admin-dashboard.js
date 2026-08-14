// ==========================================
// VIDLYRA ADMIN DASHBOARD
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
// STORAGE BUCKETS
// ==========================================

const BUCKETS = {
    Anime: "stories",
    "Short Film": "shortfilms",
    Music: "music",
    Artwork: "artwork",
    Manga: "manga"
};


// ==========================================
// GET BUCKET
// ==========================================

function getBucket(category) {

    return BUCKETS[category] || "stories";

}


// ==========================================
// THUMBNAIL URL
// ==========================================

function getThumbnailUrl(thumbnail) {

    if (!thumbnail) {
        return "";
    }

    // Already a complete URL
    if (
        thumbnail.startsWith("http://") ||
        thumbnail.startsWith("https://")
    ) {
        return thumbnail;
    }

    // Thumbnail stored as:
    // user_id/filename.png

    return (
        sb.storage
            .from("thumbnails")
            .getPublicUrl(thumbnail)
            .data.publicUrl
    );

}


// ==========================================
// AUTH
// ==========================================

async function checkAdmin() {

    const {
        data: {
            user
        },
        error
    } = await sb.auth.getUser();

    if (error || !user) {

        window.location.href = "login.html";

        return null;
    }

    console.log(
        "Logged in user:",
        user.id
    );


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


    if (
        !profile ||
        profile.is_admin !== true
    ) {

        alert("Admin access required.");

        window.location.href =
            "dashboard.html";

        return null;
    }


    return user;

}


// ==========================================
// LOAD STATS
// ==========================================

async function loadStats() {

    const {
        data,
        error
    } = await sb
        .from("projects")
        .select("status");


    if (error) {

        console.error(
            "Stats error:",
            error
        );

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
        document.getElementById(
            "pendingCount"
        );

    const approvedElement =
        document.getElementById(
            "approvedCount"
        );

    const rejectedElement =
        document.getElementById(
            "rejectedCount"
        );


    if (pendingElement) {
        pendingElement.textContent =
            pending;
    }


    if (approvedElement) {
        approvedElement.textContent =
            approved;
    }


    if (rejectedElement) {
        rejectedElement.textContent =
            rejected;
    }


    console.log(
        "Stats:",
        {
            pending,
            approved,
            rejected
        }
    );

}


// ==========================================
// LOAD PENDING PROJECTS
// ==========================================

async function loadProjects() {

    if (loading) {
        loading.style.display =
            "block";
    }


    if (errorBox) {
        errorBox.style.display =
            "none";
    }


    if (emptyBox) {
        emptyBox.style.display =
            "none";
    }


    if (projectsContainer) {
        projectsContainer.innerHTML =
            "";
    }


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
        .eq(
            "status",
            "Pending"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (loading) {
        loading.style.display =
            "none";
    }


    if (error) {

        console.error(
            "Projects error:",
            error
        );

        showError(
            error.message
        );

        return;
    }


    console.log(
        "Pending projects:",
        projects
    );


    if (
        !projects ||
        projects.length === 0
    ) {

        if (emptyBox) {
            emptyBox.style.display =
                "block";
        }

        return;
    }


    projects.forEach(
        project => {

            console.log(
                "=============================="
            );

            console.log(
                "Project:",
                project.title
            );

            console.log(
                "Category:",
                project.category
            );

            console.log(
                "Bucket:",
                getBucket(
                    project.category
                )
            );

            console.log(
                "File path:",
                project.file_path
            );

            console.log(
                "Thumbnail:",
                project.thumbnail
            );

            console.log(
                "=============================="
            );


            renderProject(
                project
            );

        }
    );

}


// ==========================================
// RENDER PROJECT
// ==========================================

function renderProject(project) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "project-card";


    const thumbnailUrl =
        getThumbnailUrl(
            project.thumbnail
        );


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
        escapeHTML(
            project.category ||
            "Anime"
        );


    const date =
        project.created_at
            ?
            new Date(
                project.created_at
            ).toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                }
            )
            :
            "Unknown";


    card.innerHTML = `

        ${
            thumbnailUrl
            ?
            `
            <img
                class="thumbnail"
                src="${escapeAttribute(
                    thumbnailUrl
                )}"
                alt="${title}"
            >
            `
            :
            `
            <div class="thumbnail">
                No thumbnail
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
                    ${category}
                </span>

                <span class="badge pending">
                    Pending
                </span>

                <span class="badge">
                    ${date}
                </span>

            </div>


            <div class="actions">

                <button
                    class="view"
                    type="button"
                    data-project-id="${escapeAttribute(
                        project.id
                    )}"
                >
                    👁 View
                </button>


                <button
                    class="approve"
                    type="button"
                    data-approve-id="${escapeAttribute(
                        project.id
                    )}"
                >
                    ✓ Approve
                </button>


                <button
                    class="reject"
                    type="button"
                    data-reject-id="${escapeAttribute(
                        project.id
                    )}"
                >
                    ✕ Reject
                </button>

            </div>

        </div>

    `;


    projectsContainer.appendChild(
        card
    );


    // View
    const viewButton =
        card.querySelector(
            ".view"
        );


    if (viewButton) {

        viewButton.addEventListener(
            "click",
            function () {

                viewProject(
                    project
                );

            }
        );

    }


    // Approve
    const approveButton =
        card.querySelector(
            ".approve"
        );


    if (approveButton) {

        approveButton.addEventListener(
            "click",
            function () {

                approveProject(
                    project.id
                );

            }
        );

    }


    // Reject
    const rejectButton =
        card.querySelector(
            ".reject"
        );


    if (rejectButton) {

        rejectButton.addEventListener(
            "click",
            function () {

                rejectProject(
                    project.id
                );

            }
        );

    }


    // Thumbnail error
    const thumbnail =
        card.querySelector(
            ".thumbnail"
        );


    if (
        thumbnail &&
        thumbnail.tagName === "IMG"
    ) {

        thumbnail.addEventListener(
            "error",
            function () {

                console.warn(
                    "Thumbnail failed:",
                    thumbnail.src
                );

                thumbnail.style.display =
                    "none";

            }
        );

    }

}


// ==========================================
// VIEW PROJECT
// ==========================================

async function viewProject(
    project
) {

    console.log(
        "VIEW PROJECT:",
        project
    );


    if (!project.file_path) {

        alert(
            "No project file available."
        );

        return;
    }


    const bucket =
        getBucket(
            project.category
        );


    console.log(
        "Bucket:",
        bucket
    );


    console.log(
        "File:",
        project.file_path
    );


    try {

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
                "Project file could not be opened.\n\n" +
                "Bucket: " +
                bucket +
                "\n\n" +
                "Path: " +
                project.file_path
            );

            return;
        }


        if (
            data &&
            data.signedUrl
        ) {

            window.open(
                data.signedUrl,
                "_blank"
            );

        }

    } catch (error) {

        console.error(
            "View error:",
            error
        );

        alert(
            "Unable to open project file."
        );

    }

}


// ==========================================
// APPROVE PROJECT
// ==========================================

async function approveProject(
    projectId
) {

    if (
        !confirm(
            "Approve this project?"
        )
    ) {

        return;
    }


    try {

        const {
            data: {
                user
            }
        } =
            await sb.auth.getUser();


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
            error.message
        );

    }

}


// ==========================================
// REJECT PROJECT
// ==========================================

async function rejectProject(
    projectId
) {

    const note =
        prompt(
            "Reason for rejection:"
        );


    if (note === null) {
        return;
    }


    try {

        const {
            data: {
                user
            }
        } =
            await sb.auth.getUser();


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
            error.message
        );

    }

}


// ==========================================
// ERROR
// ==========================================

function showError(
    message
) {

    if (loading) {
        loading.style.display =
            "none";
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

function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

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
