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
// CHECK ADMIN
// ==========================================

async function checkAdmin() {

    const {
        data: {
            user
        },
        error
    } = await sb.auth.getUser();


    if (error || !user) {

        window.location.href =
            "login.html";

        return null;

    }


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
// LOAD PROJECTS
// ==========================================

async function loadProjects() {

    loading.style.display =
        "block";

    emptyBox.style.display =
        "none";

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


    loading.style.display =
        "none";


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

        emptyBox.style.display =
            "block";

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

function renderProject(project) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "project-card";


    const thumbnail =
        project.thumbnail ||
        "";


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


    card.innerHTML = `

        ${
            thumbnail
            ?
            `
            <img
                class="thumbnail"
                src="${escapeAttribute(thumbnail)}"
                alt="Project thumbnail"
            >
            `
            :
            `
            <div class="thumbnail"></div>
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

                ${
                    project.file_path
                    ?
                    `
                    <button
                        class="view"
                        onclick="viewProject('${escapeAttribute(project.file_path)}')"
                    >
                        👁 View
                    </button>
                    `
                    :
                    ""
                }


                <button
                    class="approve"
                    onclick="approveProject('${project.id}')"
                >
                    ✓ Approve
                </button>


                <button
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


        await loadProjects();

        await loadStats();


    } catch (error) {

        console.error(
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


        await loadProjects();

        await loadStats();


    } catch (error) {

        console.error(
            error
        );

        showError(
            "Rejection failed: " +
            error.message
        );

    }

}


// ==========================================
// VIEW PROJECT
// ==========================================

async function viewProject(
    filePath
) {

    if (!filePath) {

        alert(
            "No project file available."
        );

        return;

    }


    try {

        const {
            data,
            error
        } = await sb.storage

            .from("projects")

            .createSignedUrl(
                filePath,
                3600
            );


        if (error) {

            throw error;

        }


        window.open(
            data.signedUrl,
            "_blank"
        );


    } catch (error) {

        alert(
            "Unable to open file:\n" +
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
            p =>
                p.status === "Pending"
        ).length;


    const approved =
        projects.filter(
            p =>
                p.status === "Approved"
        ).length;


    const rejected =
        projects.filter(
            p =>
                p.status === "Rejected"
        ).length;


    document.getElementById(
        "pendingCount"
    ).textContent =
        pending;


    document.getElementById(
        "approvedCount"
    ).textContent =
        approved;


    document.getElementById(
        "rejectedCount"
    ).textContent =
        rejected;

}


// ==========================================
// ERROR
// ==========================================

function showError(
    message
) {

    loading.style.display =
        "none";

    errorBox.textContent =
        message;

    errorBox.style.display =
        "block";

}


// ==========================================
// SECURITY HELPERS
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

    return String(value)

        .replace(
            /\\/g,
            "\\\\"
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
