// -------------------------
// Dashboard Initialization
// -------------------------

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});

// -------------------------
// Load Dashboard
// -------------------------

async function loadDashboard() {

    // Check logged in user
    const {
        data: { user },
        error: authError
    } = await sb.auth.getUser();

    if (authError || !user) {
        window.location.href = "login.html";
        return;
    }

    // Load profile
    await loadProfile(user.id);

    // Load projects
    await loadProjects(user.id);
}

// -------------------------
// Load Creator Profile
// -------------------------

async function loadProfile(userId) {

    const { data, error } = await sb
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();

    if (!error && data) {
        document.getElementById("creatorName").textContent =
            data.full_name;
    }
}

// -------------------------
// Load Projects
// -------------------------

async function loadProjects(userId) {

    const { data, error } = await sb
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    updateStats(data);

    renderProjects(data);
}

// -------------------------
// Statistics
// -------------------------

function updateStats(projects) {

    document.getElementById("totalProjects").textContent =
        projects.length;

    document.getElementById("pendingProjects").textContent =
        projects.filter(p => p.status === "Pending").length;

    document.getElementById("approvedProjects").textContent =
        projects.filter(p => p.status === "Approved").length;

    document.getElementById("rejectedProjects").textContent =
        projects.filter(p => p.status === "Rejected").length;

}

// -------------------------
// Project Cards
// -------------------------

function renderProjects(projects) {

    const container =
        document.getElementById("projectsContainer");

    container.innerHTML = "";

    if (projects.length === 0) {

        container.innerHTML =
            "<p>No projects uploaded yet.</p>";

        return;
    }

    projects.forEach(project => {

        container.innerHTML += `

<div class="project">

<img src="${project.thumbnail}" alt="Thumbnail">

<div class="content">

<h3>${project.title}</h3>

<p>${project.description}</p>

<div class="badge">

${project.status}

</div>

<div class="actions">

<button class="edit">

Edit

</button>

<button
class="delete"
onclick="deleteProject('${project.id}')">

Delete

</button>

</div>

</div>

</div>

`;

    });

}

// -------------------------
// Delete Project
// -------------------------

async function deleteProject(id) {

    if (!confirm("Delete this project?"))
        return;

    const { error } = await sb
        .from("projects")
        .delete()
        .eq("id", id);

    if (error) {

        alert(error.message);

        return;

    }

    location.reload();

}

// -------------------------
// Logout
// -------------------------

async function logout() {

    await sb.auth.signOut();

    window.location.href = "login.html";

}
