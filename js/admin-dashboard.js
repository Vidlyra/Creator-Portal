// ==========================================
// VIDLYRA ADMIN DASHBOARD
// ==========================================

console.log("Admin Dashboard loaded");


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
// BUCKETS
// ==========================================

const PROJECT_BUCKET = "projects";
const THUMBNAIL_BUCKET = "thumbnails";


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

    const user = data?.user;

    if (!user) {

        window.location.href =
            "login.html";

        return null;
    }


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
// LOAD PROJECTS
// ==========================================

async function loadProjects() {

    if (loading) {
        loading.style.display = "block";
    }

    if (emptyBox) {
        emptyBox.style.display = "none";
    }

    if (errorBox) {
        errorBox.style.display = "none";
    }

    if (projectsContainer) {
        projectsContainer.innerHTML = "";
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
        loading.style.display = "none";
    }


    if (error) {

        showError(
            error.message
        );

        return;
    }


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

}


// ==========================================
// THUMBNAIL URL
// ==========================================

async function getThumbnailUrl(
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


    // Existing URL
    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {

        return path;
    }


    // Remove bucket prefix
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


    console.log(
        "Thumbnail path:",
        path
    );


    // Public thumbnails bucket
    const {
        data: thumbnailData
    } = sb.storage
        .from(
            THUMBNAIL_BUCKET
        )
        .getPublicUrl(
            path
        );


    if (
        thumbnailData?.publicUrl
    ) {

        return thumbnailData.publicUrl;

    }


    // Fallback to projects bucket
    const {
        data: projectData
    } = sb.storage
        .from(
            PROJECT_BUCKET
        )
        .getPublicUrl(
            path
        );


    return (
        projectData?.publicUrl ||
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


    const thumbnailUrl =
        await getThumbnailUrl(
            project.thumbnail
        );


    console.log(
        "Project:",
        project.title
    );

    console.log(
        "Thumbnail:",
        thumbnailUrl
    );

    console.log(
        "File path:",
        project.file_path
    );


    // ======================================
    // IMAGE
    // ======================================

    let imageHTML;


    if (thumbnailUrl) {

        imageHTML = `

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

        imageHTML = `

            <div class="
                thumbnail
                thumbnail-fallback
            ">
                🎬
            </div>

        `;

    }


    // ======================================
    // CARD
    // ======================================

    card.innerHTML = `

        ${imageHTML}


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

                ${
                    project.file_path
                    ?
                    `
                    <button
                        type="button"
                        class="view"
                        data-file-path="${escapeAttribute(
                            project.file_path
                        )}"
                    >
                        👁 View
                    </button>
                    `
                    :
                    `
                    <button
                        type="button"
                        class="view"
                        disabled
                    >
                        👁 No File
                    </button>
                    `
                }


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
    // VIEW BUTTON
    // ======================================

    const viewButton =
        card.querySelector(
            ".view"
        );


    if (
        viewButton &&
        project.file_path
    ) {

        viewButton.addEventListener(
            "click",
            function () {

                console.log(
                    "VIEW BUTTON CLICKED"
                );

                console.log(
                    "File:",
                    this.dataset.filePath
                );


                viewProject(
                    this.dataset.filePath
                );

            }
        );

    }


    // ======================================
    // APPROVE BUTTON
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
                    this.dataset.projectId
                );

            }
        );

    }


    // ======================================
    // REJECT BUTTON
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
                    this.dataset.projectId
                );

            }
        );

    }

}


// ==========================================
// VIEW PROJECT
// ==========================================

async function viewProject(
    filePath
) {

    console.log(
        "Opening project file:",
        filePath
    );


    if (!filePath) {

        alert(
            "No project file available."
        );

        return;
    }


    try {

        let path =
            String(
                filePath
            ).trim();


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

            console.log(
                "Opening existing URL"
            );

            window.open(
                path,
                "_blank"
            );

            return;
        }


        // ======================================
        // REMOVE BUCKET PREFIX
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


        console.log(
            "Supabase project path:",
            path
        );


        // ======================================
        // CREATE SIGNED URL
        // ======================================

        const {
            data,
            error
        } = await sb.storage

            .from(
                PROJECT_BUCKET
            )

            .createSignedUrl(
                path,
                3600
            );


        if (error) {

            console.error(
                "Signed URL error:",
                error
            );

            alert(
                "Unable to view project:\n" +
                error.message
            );

            return;
        }


        if (
            !data?.signedUrl
        ) {

            alert(
                "Supabase did not return a file URL."
            );

            return;
        }


        console.log(
            "Signed URL created successfully."
        );


        // ======================================
        // OPEN
        // ======================================

        window.open(
            data.signedUrl,
            "_blank"
        );

    } catch (error) {

        console.error(
            "View error:",
            error
        );


        alert(
            "Unable to view project:\n" +
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


    if (note === null) {
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
// STATISTICS
// ==========================================

async function loadStats() {

    const {
        data,
        error
    } = await sb

        .from("projects")

        .select(
            "status"
        );


    if (error) {

        console.error(
            "Stats error:",
            error
        );

        return;
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
