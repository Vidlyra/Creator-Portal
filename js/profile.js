// ==========================================
// VIDLYRA CREATOR PROFILE
// ==========================================

console.log("Profile JS loaded");


// ==========================================
// GET CREATOR ID
// ==========================================

const params = new URLSearchParams(
    window.location.search
);

const creatorId =
    params.get("user") ||
    params.get("user_id");

console.log(
    "Creator ID:",
    creatorId
);


// ==========================================
// ELEMENTS
// ==========================================

const profileHero =
    document.getElementById("profileHero");

const projectsContainer =
    document.getElementById("projects");


// ==========================================
// LOAD PROFILE
// ==========================================

async function loadProfile() {

    if (!creatorId) {

        showError(
            "Creator profile not found. No creator ID was provided."
        );

        console.error(
            "Missing ?user=CREATOR_UUID in URL."
        );

        return;
    }


    try {

        // ======================================
        // GET CREATOR PROFILE
        // ======================================

        const {
            data: creator,
            error: creatorError
        } = await sb

            .from("profiles")

            .select(`
                user_id,
                full_name,
                avatar_url,
                selected_avatar,
                approved_projects,
                creator_level,
                creator_rank,
                creator_avatar,
                creator_avatar_unlocked
            `)

            .eq(
                "user_id",
                creatorId
            )

            .maybeSingle();


        if (creatorError) {

            throw creatorError;
        }


        if (!creator) {

            showError(
                "Creator profile does not exist."
            );

            console.error(
                "No profile found for:",
                creatorId
            );

            return;
        }


        console.log(
            "Creator found:",
            creator
        );


        // ======================================
        // DISPLAY CREATOR
        // ======================================

        renderCreator(
            creator
        );


        // ======================================
        // LOAD APPROVED PROJECTS
        // ======================================

        await loadProjects(
            creatorId
        );


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        showError(
            error.message
        );

    }

}


// ==========================================
// RENDER CREATOR
// ==========================================

function renderCreator(
    creator
) {

    const nameElement =
        profileHero.querySelector(
            ".creator-name"
        );

    const rankElement =
        profileHero.querySelector(
            ".rank"
        );

    const stats =
        profileHero.querySelectorAll(
            ".stat strong"
        );

    const levelElement =
        profileHero.querySelector(
            ".level"
        );


    if (nameElement) {

        nameElement.textContent =
            creator.full_name ||
            "Vidlyra Creator";
    }


    if (rankElement) {

        rankElement.textContent =
            creator.creator_rank ||
            "New Creator";
    }


    if (stats[0]) {

        stats[0].textContent =
            creator.approved_projects || 0;
    }


    if (stats[1]) {

        stats[1].textContent =
            creator.creator_level || 1;
    }


    if (levelElement) {

        levelElement.textContent =
            `Level ${
                creator.creator_level || 1
            } • ${
                creator.creator_rank ||
                "New Creator"
            }`;
    }


    // ======================================
    // AVATAR
    // ======================================

    const placeholder =
        profileHero.querySelector(
            ".avatar-placeholder"
        );


    if (
        creator.avatar_url &&
        placeholder
    ) {

        const image =
            document.createElement(
                "img"
            );

        image.className =
            "avatar";

        image.src =
            creator.avatar_url;

        image.alt =
            "Creator avatar";


        image.onerror =
            function () {

                image.remove();

                placeholder.style.display =
                    "flex";
            };


        placeholder.replaceWith(
            image
        );
    }

}


// ==========================================
// LOAD PROJECTS
// ==========================================

async function loadProjects(
    userId
) {

    projectsContainer.innerHTML = `
        <div class="loading">
            Loading approved projects...
        </div>
    `;


    const {
        data: projects,
        error
    } = await sb

        .from("projects")

        .select(`
            id,
            title,
            description,
            category,
            thumbnail,
            status,
            created_at,
            file_path
        `)

        .eq(
            "user_id",
            userId
        )

        .eq(
            "status",
            "Approved"
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


    if (
        !projects ||
        projects.length === 0
    ) {

        projectsContainer.innerHTML = `
            <div class="empty">
                This creator has no approved projects yet.
            </div>
        `;

        return;
    }


    projectsContainer.innerHTML = "";


    projects.forEach(
        project => {

            renderProject(
                project
            );
        }
    );

}


// ==========================================
// PROJECT CARD
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


    const image =
        project.thumbnail
        ?
        `
        <img
            class="project-image"
            src="${safeAttribute(project.thumbnail)}"
            alt="${safeHTML(
                project.title ||
                "Project"
            )}"
        >
        `
        :
        `
        <div class="project-image"></div>
        `;


    card.innerHTML = `

        ${image}

        <div class="project-content">

            <h3 class="project-title">
                ${safeHTML(
                    project.title ||
                    "Untitled Project"
                )}
            </h3>

            <div class="project-category">
                ${safeHTML(
                    project.category ||
                    "Anime"
                )}
            </div>

            <div class="project-date">
                ${formatDate(
                    project.created_at
                )}
            </div>

        </div>

    `;


    projectsContainer.appendChild(
        card
    );

}


// ==========================================
// ERROR
// ==========================================

function showError(
    message
) {

    profileHero.innerHTML = `
        <div class="error">
            ${safeHTML(message)}
        </div>
    `;

    projectsContainer.innerHTML = "";
}


// ==========================================
// DATE
// ==========================================

function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    return new Date(
        value
    ).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


// ==========================================
// SECURITY
// ==========================================

function safeHTML(
    value
) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function safeAttribute(
    value
) {

    return safeHTML(value);
}


// ==========================================
// START
// ==========================================

loadProfile();
