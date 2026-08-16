// ==========================================
// VIDLYRA ADMIN PROJECTS
// ==========================================

console.log("Vidlyra Admin Projects JS loaded");


// ==========================================
// ELEMENTS
// ==========================================

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const projectsList = document.getElementById("projectsList");


// ==========================================
// SHOW LOADING
// ==========================================

function showLoading() {

    if (loading) {
        loading.style.display = "block";
    }

    if (errorBox) {
        errorBox.style.display = "none";
    }

    if (projectsList) {
        projectsList.style.display = "none";
    }

}


// ==========================================
// SHOW ERROR
// ==========================================

function showError(message) {

    console.error("Admin error:", message);

    if (loading) {
        loading.style.display = "none";
    }

    if (projectsList) {
        projectsList.style.display = "none";
    }

    if (errorBox) {

        errorBox.textContent =
            message || "Something went wrong.";

        errorBox.style.display = "block";
    }

}


// ==========================================
// SHOW PROJECTS
// ==========================================

function showProjects() {

    if (loading) {
        loading.style.display = "none";
    }

    if (errorBox) {
        errorBox.style.display = "none";
    }

    if (projectsList) {
        projectsList.style.display = "block";
    }

}


// ==========================================
// GET CURRENT USER
// ==========================================

async function getCurrentUser() {

    const {
        data,
        error
    } = await sb.auth.getUser();

    if (error) {
        throw error;
    }

    return data?.user || null;

}


// ==========================================
// CHECK ADMIN
// ==========================================

async function checkAdmin(userId) {

    console.log(
        "Checking admin role:",
        userId
    );

    const {
        data: profile,
        error
    } = await sb
        .from("profiles")
        .select(`
            user_id,
            full_name,
            email,
            creator_role
        `)
        .eq(
            "user_id",
            userId
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!profile) {
        return false;
    }

    console.log(
        "Admin profile:",
        profile
    );

    return (
        String(
            profile.creator_role || ""
        ).toLowerCase() === "admin"
    );

}


// ==========================================
// LOAD PROJECTS
// ==========================================

async function loadProjects() {

    console.log(
        "Loading projects..."
    );

    const {
        data,
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
            file_path,
            status,
            created_at
        `)
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {
        throw error;
    }

    console.log(
        "Projects:",
        data
    );

    renderProjects(
        data || []
    );

}


// ==========================================
// RENDER PROJECTS
// ==========================================

function renderProjects(projects) {

    if (!projectsList) {

        console.error(
            "projectsList element not found."
        );

        return;
    }

    projectsList.innerHTML = "";


    if (projects.length === 0) {

        projectsList.innerHTML = `
            <div class="empty">
                <h3>No projects found</h3>
                <p>There are currently no creator submissions.</p>
            </div>
        `;

        showProjects();

        return;
    }


    projects.forEach(
        project => {

            const card =
                createProjectCard(
                    project
                );

            projectsList.appendChild(
                card
            );

        }
    );


    showProjects();

}


// ==========================================
// CREATE PROJECT CARD
// ==========================================

function createProjectCard(project) {

    const card =
        document.createElement("div");

    card.className =
        "project-card";


    const status =
        String(
            project.status || "Pending"
        );


    const statusClass =
        status.toLowerCase();


    const createdDate =
        project.created_at
            ? new Date(
                project.created_at
            ).toLocaleString()
            : "Unknown";


    card.innerHTML = `

        <div class="project-header">

            <div>

                <h3>
                    ${escapeHTML(
                        project.title ||
                        "Untitled Project"
                    )}
                </h3>

                <span class="category">

                    ${escapeHTML(
                        project.category ||
                        "Unknown"
                    )}

                </span>

            </div>


            <span class="status ${statusClass}">

                ${escapeHTML(status)}

            </span>

        </div>


        <div class="project-body">

            <p>

                ${escapeHTML(
                    project.description ||
                    "No description provided."
                )}

            </p>


            <div class="project-meta">

                <span>
                    👤 Creator:
                    ${escapeHTML(
                        project.user_id || "-"
                    )}
                </span>


                <span>
                    📅 ${escapeHTML(
                        createdDate
                    )}
                </span>

            </div>

        </div>


        <div class="project-actions">

            <button
                type="button"
                class="view-btn"
                data-action="view"
            >
                View
            </button>


            ${
                status.toLowerCase() === "pending"
                ?
                `
                    <button
                        type="button"
                        class="approve-btn"
                        data-action="approve"
                    >
                        ✓ Approve
                    </button>


                    <button
                        type="button"
                        class="reject-btn"
                        data-action="reject"
                    >
                        ✕ Reject
                    </button>
                `
                :
                ""
            }

        </div>

    `;


    // ======================================
    // VIEW
    // ======================================

    const viewButton =
        card.querySelector(
            '[data-action="view"]'
        );


    if (viewButton) {

        viewButton.addEventListener(
            "click",
            function () {

                showProjectDetails(
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
            '[data-action="approve"]'
        );


    if (approveButton) {

        approveButton.addEventListener(
            "click",
            function () {

                approveProject(
                    project,
                    approveButton
                );

            }
        );

    }


    // ======================================
    // REJECT
    // ======================================

    const rejectButton =
        card.querySelector(
            '[data-action="reject"]'
        );


    if (rejectButton) {

        rejectButton.addEventListener(
            "click",
            function () {

                rejectProject(
                    project,
                    rejectButton
                );

            }
        );

    }


    return card;

}


// ==========================================
// VIEW DETAILS
// ==========================================

function showProjectDetails(project) {

    alert(

        "PROJECT DETAILS\n\n" +

        "Title: " +
        (project.title || "-") +

        "\n\nCategory: " +
        (project.category || "-") +

        "\n\nStatus: " +
        (project.status || "-") +

        "\n\nCreator ID: " +
        (project.user_id || "-") +

        "\n\nDescription:\n" +
        (project.description || "-") +

        "\n\nFile:\n" +
        (project.file_path || "-")

    );

}


// ==========================================
// APPROVE PROJECT
// ==========================================

async function approveProject(
    project,
    button
) {

    const confirmed =
        confirm(
            `Approve "${project.title}"?`
        );


    if (!confirmed) {
        return;
    }


    if (button) {

        button.disabled = true;

        button.textContent =
            "Approving...";

    }


    try {

        console.log(
            "Approving:",
            project.id
        );


        // ==================================
        // UPDATE PROJECT
        // ==================================

        const {
            data: updatedProject,
            error
        } = await sb
            .from("projects")
            .update({
                status: "Approved"
            })
            .eq(
                "id",
                project.id
            )
            .select()
            .single();


        if (error) {
            throw error;
        }


        console.log(
            "Project approved:",
            updatedProject
        );


        // ==================================
        // NOTIFICATION
        // ==================================

        const notification =
            await createNotification(
                project.user_id,
                "Project Approved 🎉",
                `Your project "${project.title}" was approved and is now pending publication.`,
                "project_approved"
            );


        if (notification) {

            console.log(
                "Approval notification created."
            );

        }


        alert(
            "Project approved successfully."
        );


        await loadProjects();


    } catch (error) {

        console.error(
            "Approve error:",
            error
        );


        alert(
            "Unable to approve project:\n\n" +
            error.message
        );


        if (button) {

            button.disabled = false;

            button.textContent =
                "✓ Approve";

        }

    }

}


// ==========================================
// REJECT PROJECT
// ==========================================

async function rejectProject(
    project,
    button
) {

    const reason =
        prompt(
            `Why are you rejecting "${project.title}"?`
        );


    if (reason === null) {
        return;
    }


    const cleanReason =
        reason.trim();


    if (!cleanReason) {

        alert(
            "Please enter a rejection reason."
        );

        return;
    }


    if (button) {

        button.disabled = true;

        button.textContent =
            "Rejecting...";

    }


    try {

        console.log(
            "Rejecting:",
            project.id
        );


        // ==================================
        // UPDATE PROJECT
        // ==================================

        const {
            data: updatedProject,
            error
        } = await sb
            .from("projects")
            .update({
                status: "Rejected"
            })
            .eq(
                "id",
                project.id
            )
            .select()
            .single();


        if (error) {
            throw error;
        }


        console.log(
            "Project rejected:",
            updatedProject
        );


        // ==================================
        // NOTIFICATION
        // ==================================

        await createNotification(

            project.user_id,

            "Project Rejected",

            `Your project "${project.title}" was rejected. Reason: ${cleanReason}`,

            "project_rejected"

        );


        alert(
            "Project rejected successfully."
        );


        await loadProjects();


    } catch (error) {

        console.error(
            "Reject error:",
            error
        );


        alert(
            "Unable to reject project:\n\n" +
            error.message
        );


        if (button) {

            button.disabled = false;

            button.textContent =
                "✕ Reject";

        }

    }

}


// ==========================================
// CREATE NOTIFICATION
// ==========================================

async function createNotification(
    userId,
    title,
    message,
    type
) {

    console.log(
        "Creating notification for:",
        userId
    );


    /*
        YOUR ACTUAL TABLE:

        id
        user_id
        title
        message
        type
        is_read
        created_at

        There is NO project_id.
    */


    const {
        data,
        error
    } = await sb
        .from("notifications")
        .insert({

            user_id:
                userId,

            title:
                title,

            message:
                message,

            type:
                type,

            is_read:
                false

        })
        .select()
        .single();


    if (error) {

        console.error(
            "Notification insert error:",
            error
        );


        /*
            Project approval/rejection
            has already succeeded.

            Therefore notification failure
            should NOT undo the project update.
        */

        return null;

    }


    console.log(
        "Notification created:",
        data
    );


    return data;

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(
        value ?? ""
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


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    try {

        const {
            error
        } = await sb.auth.signOut();


        if (error) {
            throw error;
        }


        window.location.href =
            "login.html";


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        alert(
            "Unable to logout. Please try again."
        );

    }

}


// ==========================================
// START ADMIN PAGE
// ==========================================

async function loadAdminProjects() {

    showLoading();


    try {

        // ==================================
        // SUPABASE CHECK
        // ==================================

        if (
            typeof sb === "undefined" ||
            !sb
        ) {

            throw new Error(
                "Supabase client is not available. Check config.js."
            );

        }


        // ==================================
        // CURRENT USER
        // ==================================

        const user =
            await getCurrentUser();


        if (!user) {

            console.warn(
                "No logged-in user."
            );


            window.location.href =
                "login.html";

            return;

        }


        console.log(
            "Logged-in user:",
            user.id
        );


        // ==================================
        // ADMIN CHECK
        // ==================================

        const isAdmin =
            await checkAdmin(
                user.id
            );


        if (!isAdmin) {

            showError(
                "Access denied. Admin account required."
            );

            return;

        }


        console.log(
            "Admin access confirmed."
        );


        // ==================================
        // LOAD PROJECTS
        // ==================================

        await loadProjects();


        console.log(
            "Admin projects loaded successfully."
        );


    } catch (error) {

        console.error(
            "Admin page error:",
            error
        );


        showError(
            error.message ||
            "Unable to load admin projects."
        );

    }

}


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadAdminProjects();

    }
);
