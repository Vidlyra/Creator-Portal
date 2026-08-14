// ==========================================
// VIDLYRA ADMIN DASHBOARD
// ==========================================

console.log("Admin Dashboard loaded");


// ==========================================
// STORAGE CONFIGURATION
// ==========================================

const BUCKETS = {

    // Anime files are stored in stories
    "Anime": "stories",

    // Short films
    "Short Film": "shortfilms",

    // Music
    "Music": "music",

    // Artwork
    "Artwork": "artwork",

    // Manga
    "Manga": "manga",

    // Optional lowercase support
    "anime": "stories",
    "short film": "shortfilms",
    "music": "music",
    "artwork": "artwork",
    "manga": "manga"

};


// ==========================================
// ELEMENTS
// ==========================================

const loading =
    document.getElementById("loading");

const projectsContainer =
    document.getElementById("projects");

const emptyBox =
    document.getElementById("empty");

const errorBox =
    document.getElementById("error");


// ==========================================
// HELPERS
// ==========================================

function getBucketForCategory(category) {

    if (!category) {

        console.warn(
            "No category provided."
        );

        return null;
    }


    const cleanCategory =
        String(category).trim();


    return (
        BUCKETS[cleanCategory] ||
        BUCKETS[
            cleanCategory.toLowerCase()
        ] ||
        null
    );

}


// ==========================================
// CHECK ADMIN
// ==========================================

async function checkAdmin() {

    const {
        data,
        error
    } = await sb.auth.getUser();


    if (error) {
        throw error;
    }


    const user =
        data?.user;


    if (!user) {

        window.location.href =
            "login.html";

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

        .select(`
            user_id,
            is_admin
        `)

        .eq(
            "user_id",
            user.id
        )

        .maybeSingle();


    if (profileError) {
        throw profileError;
    }


    if (
        !profile ||
        profile.is_admin !== true
    ) {

        alert(
            "Admin access required."
        );


        window.location.href =
            "dashboard.html";


        return null;
    }


    return user;

}


// ==========================================
// LOAD PENDING PROJECTS
// ==========================================

async function loadProjects() {

    if (loading) {

        loading.style.display =
            "block";
    }


    if (emptyBox) {

        emptyBox.style.display =
            "none";
    }


    if (errorBox) {

        errorBox.style.display =
            "none";
    }


    if (projectsContainer) {

        projectsContainer.innerHTML =
            "";
    }


    try {

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


        if (error) {
            throw error;
        }


        if (loading) {

            loading.style.display =
                "none";
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


        for (
            const project of projects
        ) {

            await renderProject(
                project
            );

        }


    } catch (error) {

        console.error(
            "Load projects error:",
            error
        );


        showError(
            error.message
        );

    }

}


// ==========================================
// GET THUMBNAIL URL
// ==========================================

function getThumbnailUrl(
    thumbnail
) {

    if (!thumbnail) {
        return null;
    }


    let path =
        String(
            thumbnail
        ).trim();


    if (!path) {
        return null;
    }


    // Already a complete URL
    if (
        path.startsWith(
            "http://"
        ) ||
        path.startsWith(
            "https://"
        )
    ) {

        return path;
    }


    // Remove thumbnails/ if database
    // contains bucket name
    if (
        path.startsWith(
            "thumbnails/"
        )
    ) {

        path =
            path.substring(
                "thumbnails/".length
            );
    }


    const {
        data
    } = sb.storage

        .from(
            "thumbnails"
        )

        .getPublicUrl(
            path
        );


    return (
        data?.publicUrl ||
        null
    );

}


// ==========================================
// RENDER PROJECT
// ==========================================

async function renderProject(
    project
) {

    if (!projectsContainer) {
        return;
    }


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "project-card";


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
            "Unknown"
        );


    const date =
        project.created_at
            ? new Date(
                project.created_at
            ).toLocaleDateString(
                "en-IN"
            )
            : "Unknown";


    const bucket =
        getBucketForCategory(
            project.category
        );


    const thumbnailUrl =
        getThumbnailUrl(
            project.thumbnail
        );


    console.log(
        "================================"
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
        bucket
    );


    console.log(
        "File path:",
        project.file_path
    );


    console.log(
        "Thumbnail:",
        thumbnailUrl
    );


    console.log(
        "================================"
    );


    // ======================================
    // THUMBNAIL
    // ======================================

    let thumbnailHTML;


    if (thumbnailUrl) {

        thumbnailHTML = `

            <img
                class="thumbnail"
                src="${escapeAttribute(
                    thumbnailUrl
                )}"
                alt="${escapeAttribute(
                    project.title ||
                    "Project"
                )}"
                loading="lazy"
                onerror="
                    this.style.display='none';
                    this.nextElementSibling.style.display='flex';
                "
            >

            <div
                class="thumbnail thumbnail-fallback"
                style="display:none;"
            >
                🎬
            </div>

        `;

    } else {

        thumbnailHTML = `

            <div class="
                thumbnail
                thumbnail-fallback
            ">
                🎬
            </div>

        `;

    }


    // ======================================
    // VIEW BUTTON
    // ======================================

    let viewButtonHTML;


    if (
        project.file_path &&
        bucket
    ) {

        viewButtonHTML = `

            <button
                type="button"
                class="view"
                data-project-id="${escapeAttribute(
                    project.id
                )}"
            >
                👁 View
            </button>

        `;

    } else {

        viewButtonHTML = `

            <button
                type="button"
                class="view"
                disabled
                title="File path or category is missing"
            >
                👁 File unavailable
            </button>

        `;

    }


    // ======================================
    // CARD
    // ======================================

    card.innerHTML = `

        ${thumbnailHTML}


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

                ${viewButtonHTML}


                <button
                    type="button"
                    class="approve"
                    data-project-id="${escapeAttribute(
                        project.id
                    )}"
                >
                    ✓ Approve
                </button>


                <button
                    type="button"
                    class="reject"
                    data-project-id="${escapeAttribute(
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


    // ======================================
    // VIEW
    // ======================================

    const viewButton =
        card.querySelector(
            ".view:not([disabled])"
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


    // ======================================
    // APPROVE
    // ======================================

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


    // ======================================
    // REJECT
    // ======================================

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


    if (
        !project ||
        !project.file_path
    ) {

        alert(
            "No project file is available."
        );

        return;
    }


    const bucket =
        getBucketForCategory(
            project.category
        );


    if (!bucket) {

        alert(
            "Unknown project category:\n" +
            project.category
        );

        console.error(
            "No bucket mapping for:",
            project.category
        );

        return;
    }


    let path =
        String(
            project.file_path
        ).trim();


    if (!path) {

        alert(
            "Project file path is empty."
        );

        return;
    }


    console.log(
        "Category:",
        project.category
    );


    console.log(
        "Selected bucket:",
        bucket
    );


    console.log(
        "Original path:",
        path
    );


    // ======================================
    // FULL URL
    // ======================================

    if (
        path.startsWith(
            "http://"
        ) ||
        path.startsWith(
            "https://"
        )
    ) {

        window.open(
            path,
            "_blank"
        );

        return;
    }


    // ======================================
    // REMOVE BUCKET PREFIX
    // ======================================

    const bucketPrefix =
        bucket + "/";


    if (
        path.startsWith(
            bucketPrefix
        )
    ) {

        path =
            path.substring(
                bucketPrefix.length
            );

    }


    // ======================================
    // REMOVE OTHER COMMON PREFIXES
    // ======================================

    if (
        path.startsWith(
            "projects/"
        )
    ) {

        path =
            path.substring(
                "projects/".length
            );

    }


    if (
        path.startsWith(
            "stories/"
        )
    ) {

        if (
            bucket === "stories"
        ) {

            path =
                path.substring(
                    "stories/".length
                );
        }

    }


    if (
        path.startsWith(
            "shortfilms/"
        )
    ) {

        if (
            bucket === "shortfilms"
        ) {

            path =
                path.substring(
                    "shortfilms/".length
                );
        }

    }


    if (
        path.startsWith(
            "music/"
        )
    ) {

        if (
            bucket === "music"
        ) {

            path =
                path.substring(
                    "music/".length
                );
        }

    }


    if (
        path.startsWith(
            "artwork/"
        )
    ) {

        if (
            bucket === "artwork"
        ) {

            path =
                path.substring(
                    "artwork/".length
                );
        }

    }


    if (
        path.startsWith(
            "manga/"
        )
    ) {

        if (
            bucket === "manga"
        ) {

            path =
                path.substring(
                    "manga/".length
                );
        }

    }


    console.log(
        "Final Storage bucket:",
        bucket
    );


    console.log(
        "Final Storage path:",
        path
    );


    // ======================================
    // CREATE SIGNED URL
    // ======================================

    try {

        const {
            data,
            error
        } = await sb.storage

            .from(
                bucket
            )

            .createSignedUrl(
                path,
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
                "\n\n" +
                "Path: " +
                path +
                "\n\n" +
                error.message
            );


            return;
        }


        if (
            !data ||
            !data.signedUrl
        ) {

            alert(
                "Supabase did not return a file URL."
            );


            return;
        }


        console.log(
            "Signed URL created."
        );


        // ==================================
        // OPEN FILE
        // ==================================

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
            data,
            error
        } = await sb.auth.getUser();


        if (
            error ||
            !data?.user
        ) {

            window.location.href =
                "login.html";

            return;
        }


        const {
            error: updateError
        } = await sb

            .from("projects")

            .update({

                status:
                    "Approved",

                reviewed_at:
                    new Date().toISOString(),

                reviewed_by:
                    data.user.id

            })

            .eq(
                "id",
                projectId
            );


        if (updateError) {

            throw updateError;
        }


        alert(
            "Project approved! ✓"
        );


        await loadProjects();

        await loadStats();


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

async function rejectProject(
    projectId
) {

    const note =
        prompt(
            "Reason for rejection:"
        );


    if (
        note === null
    ) {

        return;
    }


    try {

        const {
            data,
            error
        } = await sb.auth.getUser();


        if (
            error ||
            !data?.user
        ) {

            window.location.href =
                "login.html";

            return;
        }


        const {
            error: updateError
        } = await sb

            .from("projects")

            .update({

                status:
                    "Rejected",

                admin_note:
                    note.trim(),

                reviewed_at:
                    new Date().toISOString(),

                reviewed_by:
                    data.user.id

            })

            .eq(
                "id",
                projectId
            );


        if (updateError) {

            throw updateError;
        }


        alert(
            "Project rejected."
        );


        await loadProjects();

        await loadStats();


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
// LOAD STATISTICS
// ==========================================

async function loadStats() {

    try {

        const {
            data,
            error
        } = await sb

            .from("projects")

            .select(
                "status"
            );


        if (error) {

            throw error;
        }


        const projects =
            data || [];


        const pending =
            projects.filter(
                project =>
                    project.status ===
                    "Pending"
            ).length;


        const approved =
            projects.filter(
                project =>
                    project.status ===
                    "Approved"
            ).length;


        const rejected =
            projects.filter(
                project =>
                    project.status ===
                    "Rejected"
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


    } catch (error) {

        console.error(
            "Stats error:",
            error
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
            message ||
            "Something went wrong.";

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

    return String(
        value
    )

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
            "Dashboard startup error:",
            error
        );


        showError(
            error.message
        );

    }

}


startDashboard();
