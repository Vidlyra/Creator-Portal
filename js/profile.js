// ==========================================
// VIDLYRA CREATOR PROFILE
// ==========================================

console.log("Profile JS loaded");


// ==========================================
// GITHUB AVATAR SYSTEM
// ==========================================

// Your GitHub Pages structure:
//
// assets/
// ├── avatars/
// │   ├── avatar1.png
// │   ├── avatar2.png
// │   └── avatar12.png
// │
// └── creator-avatars/
//     ├── creator1.png
//     ├── creator2.png
//     └── creator7.png
//
// These are official Vidlyra avatars.
// No Supabase avatar storage is needed.

const AVATAR_BASE =
    "assets/avatars/";

const CREATOR_AVATAR_BASE =
    "assets/creator-avatars/";


// ==========================================
// GET OFFICIAL AVATAR
// ==========================================

function getOfficialAvatar(profile) {

    // Creator avatar gets priority
    // when it has been unlocked.

    if (
        profile.creator_avatar_unlocked === true &&
        profile.creator_avatar
    ) {

        const creatorNumber =
            Number(profile.creator_avatar);

        if (
            creatorNumber >= 1 &&
            creatorNumber <= 7
        ) {

            return (
                CREATOR_AVATAR_BASE +
                `creator${creatorNumber}.png`
            );

        }

    }


    // Normal Vidlyra avatar.

    if (profile.selected_avatar) {

        const avatarNumber =
            Number(profile.selected_avatar);

        if (
            avatarNumber >= 1 &&
            avatarNumber <= 12
        ) {

            return (
                AVATAR_BASE +
                `avatar${avatarNumber}.png`
            );

        }

    }


    // No avatar selected.

    return "";

}


// ==========================================
// GET CREATOR ID
// ==========================================

const params =
    new URLSearchParams(
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
    document.getElementById(
        "profileHero"
    );


const projectsContainer =
    document.getElementById(
        "projects"
    );


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
// STORAGE URL HELPER
// ==========================================

// Used ONLY for project thumbnails.
// Creator avatars are from GitHub.

function getStorageUrl(
    bucket,
    filePath
) {

    if (!filePath) {

        return "";

    }


    // Already a complete URL.

    if (
        filePath.startsWith(
            "http://"
        ) ||
        filePath.startsWith(
            "https://"
        )
    ) {

        return filePath;

    }


    const {
        data
    } = sb.storage

        .from(
            bucket
        )

        .getPublicUrl(
            filePath
        );


    return data?.publicUrl || "";

}


// ==========================================
// RENDER CREATOR
// ==========================================

function renderCreator(
    creator
) {

    if (!profileHero) {

        console.error(
            "profileHero element not found."
        );

        return;

    }


    // ======================================
    // NAME
    // ======================================

    const nameElement =
        profileHero.querySelector(
            ".creator-name"
        );


    if (nameElement) {

        nameElement.textContent =
            creator.full_name ||
            "Vidlyra Creator";

    }


    // ======================================
    // RANK
    // ======================================

    const rankElement =
        profileHero.querySelector(
            ".rank"
        );


    if (rankElement) {

        rankElement.textContent =
            creator.creator_rank ||
            "New Creator";

    }


    // ======================================
    // STATS
    // ======================================

    const stats =
        profileHero.querySelectorAll(
            ".stat strong"
        );


    if (stats[0]) {

        stats[0].textContent =
            creator.approved_projects ||
            0;

    }


    if (stats[1]) {

        stats[1].textContent =
            creator.creator_level ||
            1;

    }


    // ======================================
    // LEVEL
    // ======================================

    const levelElement =
        profileHero.querySelector(
            ".level"
        );


    if (levelElement) {

        levelElement.textContent =
            `Level ${
                creator.creator_level ||
                1
            } • ${
                creator.creator_rank ||
                "New Creator"
            }`;

    }


    // ======================================
    // OFFICIAL GITHUB AVATAR
    // ======================================

    const placeholder =
        profileHero.querySelector(
            ".avatar-placeholder"
        );


    if (!placeholder) {

        console.warn(
            "Avatar placeholder not found."
        );

        return;

    }


    const avatarUrl =
        getOfficialAvatar(
            creator
        );


    console.log(
        "Official GitHub avatar:",
        avatarUrl
    );


    if (!avatarUrl) {

        console.warn(
            "No official avatar selected."
        );

        return;

    }


    const image =
        document.createElement(
            "img"
        );


    image.className =
        "avatar";


    image.src =
        avatarUrl;


    image.alt =
        creator.full_name
            ? `${creator.full_name} avatar`
            : "Creator avatar";


    // ======================================
    // AVATAR ERROR
    // ======================================

    image.onerror =
        function () {

            console.error(
                "GitHub avatar failed:",
                avatarUrl
            );


            image.remove();

            placeholder.style.display =
                "flex";

        };


    // ======================================
    // SHOW AVATAR
    // ======================================

    placeholder.replaceWith(
        image
    );

}


// ==========================================
// LOAD APPROVED PROJECTS
// ==========================================

async function loadProjects(
    userId
) {

    if (!projectsContainer) {

        console.error(
            "Projects container not found."
        );

        return;

    }


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


    console.log(
        "Creator approved projects:",
        projects
    );


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


    projectsContainer.innerHTML =
        "";


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


    // ======================================
    // THUMBNAIL
    // ======================================

    const thumbnailUrl =
        getStorageUrl(
            "thumbnails",
            project.thumbnail
        );


    console.log(
        "Profile project thumbnail:",
        project.title,
        thumbnailUrl
    );


    const image =
        thumbnailUrl
        ?
        `
        <img
            class="project-image"
            src="${safeAttribute(
                thumbnailUrl
            )}"
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


    // ======================================
    // CARD
    // ======================================

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


    // ======================================
    // IMAGE ERROR
    // ======================================

    const imageElement =
        card.querySelector(
            ".project-image"
        );


    if (
        imageElement &&
        imageElement.tagName === "IMG"
    ) {

        imageElement.addEventListener(
            "error",
            function () {

                console.error(
                    "Profile thumbnail failed:",
                    thumbnailUrl
                );

                imageElement.style.display =
                    "none";

            }
        );

    }


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

    if (profileHero) {

        profileHero.innerHTML = `
            <div class="error">
                ${safeHTML(
                    message
                )}
            </div>
        `;

    }


    if (projectsContainer) {

        projectsContainer.innerHTML =
            "";

    }

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


function safeAttribute(
    value
) {

    return safeHTML(
        value
    );

}


// ==========================================
// START
// ==========================================

loadProfile();
