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
// SUPABASE STORAGE URL
// ==========================================

const SUPABASE_URL =
    "https://sfehwodlybnvrbotrtyc.supabase.co";


// ==========================================
// CATEGORY → BUCKET
// ==========================================

function getBucket(category) {

    switch (category) {

        case "Anime":
            return "stories";

        case "Short Film":
            return "shortfilms";

        case "Music":
            return "music";

        case "Artwork":
            return "artwork";

        case "Manga":
            return "manga";

        default:
            return "stories";
    }
}


// ==========================================
// THUMBNAIL URL
// ==========================================

function getThumbnailUrl(
    thumbnail
) {

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


    // Database contains only storage path
    return (
        SUPABASE_URL +
        "/storage/v1/object/public/thumbnails/" +
        thumbnail
    );
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
        .select(
            "user_id,is_admin"
        )
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


    const projects =
        data || [];


    const pending =
        projects.filter(
            project =>
                project.status === "Pending"
        ).length;


    const approved =
        projects.filter(
            project =>
                project.status === "Approved"
        ).length;


    const rejected =
        projects.filter(
            project =>
                project.status === "Rejected"
        ).length;


    const pendingCount =
        document.getElementById(
            "pendingCount"
        );

    const approvedCount =
        document.getElementById(
            "approvedCount"
        );

    const rejectedCount =
        document.getElementById(
            "rejectedCount"
        );


    if (pendingCount) {

        pendingCount.textContent =
            pending;
    }


    if (approvedCount) {

        approvedCount.textContent =
            approved;
    }


    if (rejectedCount) {

        rejectedCount.textContent =
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

    if (!projectsContainer) {

        console.error(
            "#projects element not found."
        );

        return;
    }


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


    projectsContainer.innerHTML =
        "";


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

            renderProject(
                project
            );

        }
    );
}


// ==========================================
// RENDER PROJECT
// ==========================================

function renderProject(
    project
) {

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
        project.category ||
        "Anime";


    const safeCategory =
        escapeHTML(
            category
        );


    const date =
        project.created_at
            ? new Date(
                project.created_at
            ).toLocaleDateString(
                "en-IN"
            )
            : "Unknown";


    // ----------------------------------
    // FIXED THUMBNAIL URL
    // ----------------------------------

    const thumbnail =
        getThumbnailUrl(
            project.thumbnail
        );


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
        "Original thumbnail:",
        project.thumbnail
    );


    console.log(
        "Final thumbnail URL:",
        thumbnail
    );


    card.innerHTML = `

        ${
            thumbnail
                ?
                `
                <img
                    class="thumbnail"
                    src="${escapeAttribute(thumbnail)}"
                    alt="${title}"
                    loading="lazy"
                    onerror="thumbnailError(this)"
                >
                `
                :
                `
                <div class="thumbnail">
                    No Thumbnail
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
                        ?
                        `
                        <button
                            type="button"
                            class="view"
                            onclick="viewProject('${project.id}')"
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
                            No File
                        </button>
                        `
                }


                <button
                    type="button"
                    class="approve"
                    onclick="approveProject('${project.id}')"
                >
                    ✓ Approve
                </button>


                <button
                    type="button"
                    class="reject"
                    onclick="rejectProject('${project.id}')"
                >
                    ✕ Reject
                </button>

            </div>

        </div>

    `;


    projectsContainer.appendChild(
        card
    );
}


// ==========================================
// THUMBNAIL ERROR
// ==========================================

function thumbnailError(
    image
) {

    console.error(
        "Thumbnail failed:",
        image.src
    );


    image.style.display =
        "none";
}


// ==========================================
// VIEW PROJECT
// ==========================================

async function viewProject(
    projectId
) {

    console.log(
        "VIEW PROJECT:",
        projectId
    );


    try {

        const {
            data: project,
            error
        } = await sb
            .from("projects")
            .select(`
                id,
                title,
                category,
                file_path
            `)
            .eq(
                "id",
                projectId
            )
            .maybeSingle();


        if (error) {

            throw error;
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
            getBucket(
                project.category
            );


        console.log(
            "Opening project:",
            project.title
        );


        console.log(
            "Bucket:",
            bucket
        );


        console.log(
            "Path:",
            project.file_path
        );


        const {
            data,
            error: storageError
        } = await sb.storage
            .from(bucket)
            .createSignedUrl(
                project.file_path,
                3600
            );


        if (storageError) {

            console.error(
                "Storage error:",
                storageError
            );


            alert(
                "File not found in Supabase Storage.\n\n" +
                "Bucket: " +
                bucket +
                "\n\n" +
                "Path: " +
                project.file_path
            );

            return;
        }


        if (
            !data ||
            !data.signedUrl
        ) {

            alert(
                "Could not create file URL."
            );

            return;
        }


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
            "Unable to open project:\n\n" +
            error.message
        );
    }
}


// ==========================================
// APPROVE
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

                status:
                    "Approved",

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
// REJECT
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

                status:
                    "Rejected",

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
