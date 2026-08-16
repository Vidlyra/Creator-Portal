// ==========================================
// VIDLYRA ADMIN PROJECTS
// PROJECT REVIEW SYSTEM
// ==========================================

console.log("Vidlyra Admin Projects JS loaded");


// ==========================================
// ELEMENTS
// ==========================================

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const projectsList = document.getElementById("projectsList");


// ==========================================
// STATE
// ==========================================

let currentProjects = [];


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

    console.error("Admin projects error:", message);

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

    if (!data || !data.user) {
        return null;
    }

    return data.user;

}


// ==========================================
// ADMIN CHECK
// ==========================================

async function checkAdmin(user) {

    if (!user) {
        return false;
    }

    console.log(
        "Checking admin:",
        user.id
    );

    /*
        IMPORTANT:

        Change this check if your project
        uses a different admin system.

        This version checks the profiles table
        for creator_role = admin.
    */

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
            user.id
        )
        .maybeSingle();

    if (error) {

        /*
            If creator_role does not exist
            in your profiles table, this will
            show an error instead of silently
            allowing access.
        */

        throw error;

    }

    if (!profile) {
        return false;
    }

    const role =
        String(
            profile.creator_role || ""
        ).toLowerCase();

    return (
        role === "admin" ||
        role === "administrator"
    );

}


// ==========================================
// LOAD PROJECTS
// ==========================================

async function loadProjects() {

    console.log(
        "Loading creator projects..."
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

    currentProjects =
        data || [];

    console.log(
        "Projects loaded:",
        currentProjects
    );

    renderProjects(
        currentProjects
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


    // ======================================
    // EMPTY
    // ======================================

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


    // ======================================
    // PROJECT CARDS
    // ======================================

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


    const date =
        project.created_at
            ? new Date(
                project.created_at
            ).toLocaleString()
            : "Unknown";


    // ======================================
    // CARD
    // ======================================

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
                    📅 ${escapeHTML(date)}
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
                    ? `
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
                    : ""
            }

        </div>

    `;


    // ======================================
    // BUTTON EVENTS
    // ======================================

    const viewButton =
        card.querySelector(
            '[data-action="view"]'
        );

    if (viewButton) {

        viewButton.addEventListener(
            "click",
            () => {

                showProjectDetails(
                    project
                );

            }
        );

    }


    const approveButton =
        card.querySelector(
            '[data-action="approve"]'
        );

    if (approveButton) {

        approveButton.addEventListener(
            "click",
            () => {

                approveProject(
                    project.id,
                    approveButton
                );

            }
        );

    }


    const rejectButton =
        card.querySelector(
            '[data-action="reject"]'
        );

    if (rejectButton) {

        rejectButton.addEventListener(
            "click",
            () => {

                rejectProject(
                    project.id,
                    rejectButton
                );

            }
        );

    }


    return card;

}


// ==========================================
// VIEW PROJECT DETAILS
// ==========================================

function showProjectDetails(project) {

    const details = `

Project: ${project.title || "Untitled"}

Category: ${project.category || "Unknown"}

Status: ${project.status || "Pending"}

Creator ID:
${project.user_id || "-"}

Created:
${
    project.created_at
        ? new Date(
            project.created_at
        ).toLocaleString()
        : "-"
}

Description:
${project.description || "No description"}

Main File:
${project.file_path || "-"}

Thumbnail:
${project.thumbnail || "-"}

    `;

    alert(details);

}


// ==========================================
// APPROVE PROJECT
// ==========================================

async function approveProject(
    projectId,
    button
) {

    if (!projectId) {
        return;
    }


    const confirmed =
        confirm(
            "Approve this project?"
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
            "Approving project:",
            projectId
        );


        const {
            data: project,
            error
        } = await sb
            .from("projects")
            .update({
                status: "Approved"
            })
            .eq(
                "id",
                projectId
            )
            .select()
            .single();


        if (error) {
            throw error;
        }


        console.log(
            "Project approved:",
            project
        );


        // ==================================
        // CREATE NOTIFICATION
        // ==================================

        await createNotification(
            project.user_id,
            "Project Approved 🎉",
            `Your project "${project.title}" was approved and is now published.`,
            "project_approved",
            project.id
        );


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
            "Unable to approve project:\n" +
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
    projectId,
    button
) {

    if (!projectId) {
        return;
    }


    const reason =
        prompt(
            "Enter rejection reason:"
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
            "Rejecting project:",
            projectId
        );


        const {
            data: project,
            error
        } = await sb
            .from("projects")
            .update({
                status: "Rejected"
            })
            .eq(
                "id",
                projectId
            )
            .select()
            .single();


        if (error) {
            throw error;
        }


        console.log(
            "Project rejected:",
            project
        );


        // ==================================
        // CREATE NOTIFICATION
        // ==================================

        await createNotification(
            project.user_id,
            "Project Rejected",
            `Your project "${project.title}" was not approved. Reason: ${cleanReason}`,
            "project_rejected",
            project.id
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
            "Unable to reject project:\n" +
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
    type,
    projectId
) {

    console.log(
        "Creating notification..."
    );


    /*
        IMPORTANT:

        Your notifications table must allow
        admin/service-side inserts.

        Expected columns:

        user_id
        title
        message
        type
        project_id
        is_read
    */


    const {
        data,
        error
    } = await sb
        .from("notifications")
        .insert({

            user_id: userId,

            title: title,

            message: message,

            type: type,

            project_id:
                projectId || null,

            is_read: false

        })
        .select()
        .single();


    if (error) {

        console.error(
            "Notification error:",
            error
        );

        /*
            Do NOT stop project approval
            if only notification creation
            fails.
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

    return String(value || "")
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
            "Unable to logout."
        );

    }

}


// ==========================================
// START
// ==========================================

async function loadAdminProjects() {

    showLoading();


    try {

        // ----------------------------------
        // SUPABASE CHECK
        // ----------------------------------

        if (
            typeof sb === "undefined" ||
            !sb
        ) {

            throw new Error(
                "Supabase client is not available. Check config.js."
            );

        }


        // ----------------------------------
        // USER
        // ----------------------------------

        const user =
            await getCurrentUser();


        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        console.log(
            "Logged-in admin candidate:",
            user.id
        );


        // ----------------------------------
        // ADMIN
        // ----------------------------------

        const isAdmin =
            await checkAdmin(
                user
            );


        if (!isAdmin) {

            showError(
                "Access denied. Admin account required."
            );

            return;

        }


        // ----------------------------------
        // LOAD PROJECTS
        // ----------------------------------

        await loadProjects();


        console.log(
            "Admin projects loaded successfully."
        );


    } catch (error) {

        console.error(
            "Admin project loading error:",
            error
        );


        showError(
            error.message ||
            "Unable to load projects."
        );

    }

}


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadAdminProjects();

    }
);
