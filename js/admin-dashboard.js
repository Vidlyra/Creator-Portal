// ==========================================
// VIDLYRA ADMIN DASHBOARD
// ==========================================

console.log("Vidlyra Admin Dashboard loaded");


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
// SHOW ERROR
// ==========================================

function showError(message) {

    errorBox.textContent = message;

    errorBox.style.display = "block";

}


// ==========================================
// CHECK ADMIN
// ==========================================

async function checkAdmin() {

    try {

        const {
            data: authData,
            error: authError
        } = await sb.auth.getUser();


        if (
            authError ||
            !authData.user
        ) {

            window.location.href =
                "login.html";

            return null;

        }


        const user =
            authData.user;


        // Get admin status

        const {
            data: profile,
            error: profileError
        } = await sb

            .from("profiles")

            .select("is_admin")

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
                "You do not have administrator access."
            );

            window.location.href =
                "dashboard.html";

            return null;

        }


        return user;


    } catch (error) {

        console.error(
            "Admin check error:",
            error
        );

        showError(
            error.message ||
            "Unable to verify administrator access."
        );

        return null;

    }

}


// ==========================================
// LOAD PROJECTS
// ==========================================

async function loadProjects() {

    loading.style.display =
        "block";

    projectsContainer.innerHTML =
        "";

    emptyBox.style.display =
        "none";


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
                thumbnail_url,
                file_url,
                status,
                admin_note,
                created_at
            `)

            .eq(
                "status",
                "pending"
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


        loading.style.display =
            "none";


        if (
            !projects ||
            projects.length === 0
        ) {

            emptyBox.style.display =
                "block";

            await loadStats();

            return;

        }


        projects.forEach(
            project => {

                renderProject(
                    project
                );

            }
        );


        await loadStats();


    } catch (error) {

        loading.style.display =
            "none";

        console.error(
            "Load projects error:",
            error
        );

        showError(
            error.message ||
            "Unable to load projects."
        );

    }

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
        project.thumbnail_url ||
        "assets/default-project.png";


    const title =
        escapeHTML(
            project.title ||
            "Untitled Project"
        );


    const description =
        escapeHTML(
            project.description ||
            "No description provided."
        );


    const category =
        escapeHTML(
            project.category ||
            "Unknown"
        );


    const created =
        project.created_at
            ? new Date(
                project.created_at
            ).toLocaleDateString(
                "en-IN"
            )
            : "Unknown";


    card.innerHTML = `

        <img
            class="thumbnail"
            src="${thumbnail}"
            alt="Project thumbnail"
            onerror="
                this.src='assets/default-project.png';
            "
        >

        <div class="project-info">

            <h3>
                ${title}
            </h3>

            <p class="project-description">
                ${description}
            </p>

            <div class="project-meta">

                <span class="badge">
                    ${category}
                </span>

                <span class="badge status">
                    Pending Review
                </span>

                <span class="badge">
                    ${created}
                </span>

            </div>

            <div class="actions">

                <button
                    class="approve"
                    onclick="
                        approveProject('${project.id}')
                    "
                >
                    ✓ Approve
                </button>

                <button
                    class="reject"
                    onclick="
                        rejectProject('${project.id}')
                    "
                >
                    ✕ Reject
                </button>

                ${
                    project.file_url
                        ? `
                            <button
                                class="approve"
                                onclick="
                                    window.open(
                                        '${project.file_url}',
                                        '_blank'
                                    )
                                "
                            >
                                👁 View File
                            </button>
                          `
                        : ""
                }

            </div>

        </div>

    `;


    projectsContainer.appendChild(
        card
    );

}


// ==========================================
// APPROVE PROJECT
// ==========================================

async function approveProject(
    projectId
) {

    const confirmed =
        confirm(
            "Approve this project?"
        );


    if (!confirmed) {

        return;

    }


    try {

        // Get current admin

        const {
            data: authData
        } = await sb.auth.getUser();


        if (
            !authData.user
        ) {

            window.location.href =
                "login.html";

            return;

        }


        // Update project

        const {
            error
        } = await sb

            .from("projects")

            .update({

                status: "approved",

                reviewed_at:
                    new Date().toISOString(),

                reviewed_by:
                    authData.user.id

            })

            .eq(
                "id",
                projectId
            );


        if (error) {

            throw error;

        }


        alert(
            "Project approved successfully! ✓"
        );


        // Refresh

        await loadProjects();


    } catch (error) {

        console.error(
            "Approve error:",
            error
        );

        alert(
            "Could not approve project:\n" +
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
            "Why are you rejecting this project?\n\nOptional:"
        );


    if (
        note === null
    ) {

        return;

    }


    try {

        const {
            data: authData
        } = await sb.auth.getUser();


        if (
            !authData.user
        ) {

            window.location.href =
                "login.html";

            return;

        }


        const {
            error
        } = await sb

            .from("projects")

            .update({

                status: "rejected",

                admin_note:
                    note.trim(),

                reviewed_at:
                    new Date().toISOString(),

                reviewed_by:
                    authData.user.id

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


    } catch (error) {

        console.error(
            "Reject error:",
            error
        );

        alert(
            "Could not reject project:\n" +
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
            data: projects,
            error
        } = await sb

            .from("projects")

            .select("status");


        if (error) {

            throw error;

        }


        const list =
            projects || [];


        const pending =
            list.filter(
                p =>
                    p.status ===
                    "pending"
            ).length;


        const approved =
            list.filter(
                p =>
                    p.status ===
                    "approved"
            ).length;


        const rejected =
            list.filter(
                p =>
                    p.status ===
                    "rejected"
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


    } catch (error) {

        console.error(
            "Stats error:",
            error
        );

    }

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

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


// ==========================================
// START
// ==========================================

async function startAdminDashboard() {

    const admin =
        await checkAdmin();


    if (!admin) {

        return;

    }


    await loadProjects();

}


startAdminDashboard();
