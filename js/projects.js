// ==========================================
// VIDLYRA ANIME EXPLORE
// ==========================================

console.log("Vidlyra Projects loaded");


// ==========================================
// ELEMENTS
// ==========================================

const projectsContainer =
    document.getElementById("projects");

const searchInput =
    document.getElementById("search");

const categorySelect =
    document.getElementById("category");


// ==========================================
// DATA
// ==========================================

let allProjects = [];


// ==========================================
// GITHUB AVATAR PATHS
// ==========================================

// projects.html is inside:
//
// Creator-Portal/
// ├── projects.html
// └── assets/
//     ├── avatars/
//     │   ├── avatar1.png
//     │   └── avatar12.png
//     │
//     └── creator-avatars/
//         ├── creator1.png
//         └── creator7.png

const AVATAR_BASE =
    "assets/avatars/";

const CREATOR_AVATAR_BASE =
    "assets/creator-avatars/";


// ==========================================
// GET OFFICIAL AVATAR
// ==========================================

function getOfficialAvatar(profile) {

    if (!profile) {

        return "";

    }


    // ======================================
    // CREATOR AVATAR
    // ======================================

    if (
        profile.creator_avatar_unlocked === true &&
        profile.creator_avatar !== null &&
        profile.creator_avatar !== undefined &&
        profile.creator_avatar !== ""
    ) {

        const creatorNumber =
            Number(profile.creator_avatar);


        if (
            Number.isInteger(creatorNumber) &&
            creatorNumber >= 1 &&
            creatorNumber <= 7
        ) {

            return (
                CREATOR_AVATAR_BASE +
                `creator${creatorNumber}.png`
            );

        }

    }


    // ======================================
    // NORMAL AVATAR
    // ======================================

    if (
        profile.selected_avatar !== null &&
        profile.selected_avatar !== undefined &&
        profile.selected_avatar !== ""
    ) {

        const avatarNumber =
            Number(profile.selected_avatar);


        if (
            Number.isInteger(avatarNumber) &&
            avatarNumber >= 1 &&
            avatarNumber <= 12
        ) {

            return (
                AVATAR_BASE +
                `avatar${avatarNumber}.png`
            );

        }

    }


    return "";

}


// ==========================================
// GET THUMBNAIL URL
// ==========================================

function getThumbnailUrl(
    thumbnail
) {

    if (!thumbnail) {

        return "";

    }


    // Already a complete URL.

    if (
        thumbnail.startsWith("http://") ||
        thumbnail.startsWith("https://")
    ) {

        return thumbnail;

    }


    // Relative GitHub/local path.

    if (
        thumbnail.startsWith("assets/")
    ) {

        return thumbnail;

    }


    // Supabase thumbnail path.
    //
    // We start with the thumbnails bucket.
    // If it fails, renderProject() will
    // automatically try the projects bucket.

    const {
        data
    } = sb.storage
        .from("thumbnails")
        .getPublicUrl(thumbnail);


    return data?.publicUrl || "";

}


// ==========================================
// LOAD APPROVED PROJECTS
// ==========================================

async function loadProjects() {

    if (!projectsContainer) {

        console.error(
            "Projects container not found."
        );

        return;

    }


    projectsContainer.innerHTML = `
        <div class="loading">
            Loading anime...
        </div>
    `;


    try {

        // ======================================
        // GET APPROVED PROJECTS
        // ======================================

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
                created_at
            `)

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
            "Approved projects:",
            projects
        );


        allProjects =
            projects || [];


        // ======================================
        // LOAD CREATOR INFORMATION
        // ======================================

        await attachCreators();


        // ======================================
        // DISPLAY
        // ======================================

        renderProjects(
            allProjects
        );


    } catch (error) {

        console.error(
            "Projects error:",
            error
        );


        projectsContainer.innerHTML = `
            <div class="error">
                ${escapeHTML(
                    error.message ||
                    "Unable to load projects."
                )}
            </div>
        `;

    }

}


// ==========================================
// ATTACH CREATOR INFORMATION
// ==========================================

async function attachCreators() {

    const userIds = [
        ...new Set(
            allProjects
                .map(
                    project =>
                        project.user_id
                )
                .filter(Boolean)
        )
    ];


    if (
        userIds.length === 0
    ) {

        return;

    }


    console.log(
        "Loading creator profiles:",
        userIds
    );


    const {
        data: profiles,
        error
    } = await sb

        .from("profiles")

        .select(`
            user_id,
            full_name,
            avatar_url,
            selected_avatar,
            creator_avatar,
            creator_level,
            creator_rank,
            creator_avatar_unlocked
        `)

        .in(
            "user_id",
            userIds
        );


    if (error) {

        console.error(
            "Profile loading error:",
            error
        );

        throw error;

    }


    console.log(
        "Creator profiles:",
        profiles
    );


    const profileMap =
        new Map();


    (
        profiles || []
    ).forEach(
        profile => {

            profileMap.set(
                profile.user_id,
                profile
            );

        }
    );


    allProjects =
        allProjects.map(
            project => ({

                ...project,

                creator:
                    profileMap.get(
                        project.user_id
                    ) || null

            })
        );


}


// ==========================================
// RENDER PROJECTS
// ==========================================

function renderProjects(
    projects
) {

    projectsContainer.innerHTML =
        "";


    if (
        !projects ||
        projects.length === 0
    ) {

        projectsContainer.innerHTML = `
            <div class="empty">
                No approved projects found.
            </div>
        `;

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
// RENDER SINGLE PROJECT
// ==========================================

function renderProject(
    project
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "card";


    // ======================================
    // CREATOR
    // ======================================

    const creator =
        project.creator;


    const creatorName =
        creator?.full_name ||
        "Vidlyra Creator";


    const creatorLevel =
        creator?.creator_level ||
        1;


    const creatorRank =
        creator?.creator_rank ||
        "New Creator";


    // ======================================
    // GITHUB AVATAR
    // ======================================

    const avatar =
        getOfficialAvatar(
            creator
        );


    console.log(
        "Creator GitHub avatar:",
        creatorName,
        avatar
    );


    // ======================================
    // THUMBNAIL
    // ======================================

    const thumbnailUrl =
        getThumbnailUrl(
            project.thumbnail
        );


    console.log(
        "Thumbnail:",
        project.title,
        thumbnailUrl
    );


    // ======================================
    // THUMBNAIL HTML
    // ======================================

    let thumbnailHTML;


    if (thumbnailUrl) {

        thumbnailHTML = `
            <img
                class="poster"
                src="${safeAttribute(
                    thumbnailUrl
                )}"
                alt="${escapeHTML(
                    project.title ||
                    "Anime"
                )}"
            >
        `;

    } else {

        thumbnailHTML = `
            <div class="poster placeholder">
                <span>
                    No Thumbnail
                </span>
            </div>
        `;

    }


    // ======================================
    // AVATAR HTML
    // ======================================

    let avatarHTML;


    if (avatar) {

        avatarHTML = `
            <img
                class="creator-avatar"
                src="${safeAttribute(
                    avatar
                )}"
                alt="${escapeHTML(
                    creatorName
                )} avatar"
            >
        `;

    } else {

        avatarHTML = `
            <div
                class="creator-avatar avatar-placeholder"
                aria-label="Creator avatar unavailable"
            ></div>
        `;

    }


    // ======================================
    // PROFILE LINK
    // ======================================

    const profileLink =
        project.user_id
            ? `profile.html?user=${encodeURIComponent(
                project.user_id
            )}`
            : "#";


    // ======================================
    // CARD HTML
    // ======================================

    card.innerHTML = `

        ${thumbnailHTML}


        <div class="card-body">


            <div class="title">

                ${escapeHTML(
                    project.title ||
                    "Untitled"
                )}

            </div>


            <div class="category">

                ${escapeHTML(
                    project.category ||
                    "Anime"
                )}

            </div>


            <div class="creator">


                ${avatarHTML}


                <div class="creator-info">


                    <div class="creator-name">

                        ${escapeHTML(
                            creatorName
                        )}

                    </div>


                    <div class="creator-level">

                        Level ${escapeHTML(
                            creatorLevel
                        )}

                        •

                        ${escapeHTML(
                            creatorRank
                        )}

                    </div>


                </div>


            </div>


            <a
                class="view-profile"
                href="${safeAttribute(
                    profileLink
                )}"
            >
                View Creator Profile →
            </a>


        </div>

    `;


    // ======================================
    // THUMBNAIL FALLBACK
    // ======================================

    const image =
        card.querySelector(
            ".poster"
        );


    if (
        image &&
        image.tagName === "IMG"
    ) {

        image.addEventListener(
            "error",
            function () {

                console.warn(
                    "Thumbnail failed:",
                    image.src
                );


                // Try projects bucket
                // if thumbnails bucket failed.

                if (
                    !image.dataset.fallbackUsed &&
                    project.thumbnail &&
                    !project.thumbnail.startsWith(
                        "http://"
                    ) &&
                    !project.thumbnail.startsWith(
                        "https://"
                    )
                ) {

                    image.dataset.fallbackUsed =
                        "true";


                    const {
                        data
                    } = sb.storage
                        .from("projects")
                        .getPublicUrl(
                            project.thumbnail
                        );


                    const fallbackUrl =
                        data?.publicUrl;


                    if (fallbackUrl) {

                        console.log(
                            "Trying projects bucket:",
                            fallbackUrl
                        );


                        image.src =
                            fallbackUrl;


                        return;

                    }

                }


                // Final fallback.

                image.style.display =
                    "none";


                const placeholder =
                    document.createElement(
                        "div"
                    );


                placeholder.className =
                    "poster placeholder";


                placeholder.innerHTML = `
                    <span>
                        Thumbnail unavailable
                    </span>
                `;


                image.parentNode.insertBefore(
                    placeholder,
                    image
                );

            }
        );

    }


    // ======================================
    // AVATAR ERROR
    // ======================================

    const avatarImage =
        card.querySelector(
            ".creator-avatar"
        );


    if (
        avatarImage &&
        avatarImage.tagName === "IMG"
    ) {

        avatarImage.addEventListener(
            "error",
            function () {

                console.error(
                    "GitHub avatar failed:",
                    avatarImage.src
                );


                avatarImage.style.display =
                    "none";


                const avatarFallback =
                    document.createElement(
                        "div"
                    );


                avatarFallback.className =
                    "creator-avatar avatar-placeholder";


                avatarImage.parentNode.insertBefore(
                    avatarFallback,
                    avatarImage
                );

            }
        );

    }


    // ======================================
    // ADD CARD
    // ======================================

    projectsContainer.appendChild(
        card
    );

}


// ==========================================
// SEARCH + FILTER
// ==========================================

function filterProjects() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const category =
        categorySelect
            ? categorySelect.value
            : "all";


    const filtered =
        allProjects.filter(
            project => {

                const title =
                    (
                        project.title ||
                        ""
                    )
                    .toLowerCase();


                const description =
                    (
                        project.description ||
                        ""
                    )
                    .toLowerCase();


                const projectCategory =
                    project.category ||
                    "";


                const creatorName =
                    (
                        project.creator?.full_name ||
                        ""
                    )
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    title.includes(
                        search
                    ) ||
                    description.includes(
                        search
                    ) ||
                    creatorName.includes(
                        search
                    );


                const matchesCategory =
                    category === "all" ||
                    projectCategory === category;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    renderProjects(
        filtered
    );

}


// ==========================================
// EVENTS
// ==========================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterProjects
    );

}


if (categorySelect) {

    categorySelect.addEventListener(
        "change",
        filterProjects
    );

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


function safeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


// ==========================================
// START
// ==========================================

loadProjects();
