// ==========================================
// VIDLYRA CREATOR PROJECTS
// ==========================================

console.log("Projects JS loaded");


// ==========================================
// LOAD PROJECTS
// ==========================================

async function loadProjects() {

    const loading =
        document.getElementById("loading");

    const grid =
        document.getElementById("projectsGrid");

    const empty =
        document.getElementById("empty");

    const errorBox =
        document.getElementById("error");


    try {

        // ======================================
        // CHECK LOGIN
        // ======================================

        const {
            data: userData,
            error: userError
        } = await sb.auth.getUser();


        if (userError || !userData.user) {

            window.location.href =
                "login.html";

            return;
        }


        const user =
            userData.user;


        // ======================================
        // GET CREATOR PROJECTS
        // ======================================

        const {
            data: projects,
            error: projectsError
        } = await sb
            .from("projects")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", {
                ascending: false
            });


        if (projectsError) {

            throw projectsError;

        }


        console.log(
            "Projects:",
            projects
        );


        // ======================================
        // STOP LOADING
        // ======================================

        loading.style.display =
            "none";


        // ======================================
        // NO PROJECTS
        // ======================================

        if (!projects || projects.length === 0) {

            empty.style.display =
                "block";

            return;

        }


        // ======================================
        // DISPLAY PROJECTS
        // ======================================

        grid.innerHTML = "";


        projects.forEach(project => {

            const card =
                createProjectCard(project);

            grid.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Projects loading error:",
            error
        );


        loading.style.display =
            "none";


        errorBox.textContent =
            "Unable to load projects: " +
            error.message;

    }

}


// ==========================================
// CREATE PROJECT CARD
// ==========================================

function createProjectCard(project) {

    const card =
        document.createElement("div");


    card.className =
        "project-card";


    // ======================================
    // THUMBNAIL
    // ======================================

    let thumbnailURL =
        "assets/default-thumbnail.png";


    if (project.thumbnail) {

        const {
            data
        } = sb.storage
            .from("thumbnails")
            .getPublicUrl(
                project.thumbnail
            );


        if (data && data.publicUrl) {

            thumbnailURL =
                data.publicUrl;

        }

    }


    // ======================================
    // SAFE TEXT
    // ======================================

    const title =
        project.title || "Untitled Project";


    const description =
        project.description ||
        "No description";


    const category =
        project.category ||
        "Unknown";


    const status =
        project.status ||
        "Pending";


    // ======================================
    // CARD
    // ======================================

    card.innerHTML = `

        <img
            class="thumbnail"
            src="${thumbnailURL}"
            alt="${title}"
            onerror="
                this.src='assets/default-thumbnail.png'
            "
        >

        <div class="card-content">

            <div class="project-title">
                ${title}
            </div>

            <div class="category">
                ${category}
            </div>

            <div class="status">
                Status: ${status}
            </div>

            <div class="description">
                ${description}
            </div>

        </div>

    `;


    return card;

}


// ==========================================
// START
// ==========================================

loadProjects();
