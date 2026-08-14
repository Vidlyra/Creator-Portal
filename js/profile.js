// ==========================================
// VIDLYRA CREATOR PROFILE
// ==========================================

console.log("Profile JS loaded");


// ==========================================
// ELEMENTS
// ==========================================

const profileHero =
    document.getElementById("profileHero");

const projectsContainer =
    document.getElementById("projects");


// ==========================================
// CREATOR ID
// ==========================================

const params =
    new URLSearchParams(
        window.location.search
    );

let creatorId =
    params.get("user") ||
    params.get("user_id");


console.log(
    "Profile URL:",
    window.location.href
);

console.log(
    "Creator ID from URL:",
    creatorId
);


// ==========================================
// GET CREATOR ID
// ==========================================

async function getCreatorId() {

    // --------------------------------------
    // 1. Creator ID from URL
    // --------------------------------------

    if (creatorId) {

        console.log(
            "Using creator ID from URL:",
            creatorId
        );

        return creatorId;

    }


    // --------------------------------------
    // 2. No URL ID
    // Use logged-in Supabase user
    // --------------------------------------

    console.log(
        "No creator ID in URL."
    );

    console.log(
        "Checking logged-in user..."
    );


    try {

        const {
            data,
            error
        } = await sb.auth.getUser();


        if (error) {

            console.error(
                "Auth user error:",
                error
            );

            return null;

        }


        const user =
            data?.user;


        if (!user) {

            console.error(
                "No logged-in user found."
            );

            return null;

        }


        console.log(
            "Using logged-in user as creator:",
            user.id
        );


        return user.id;

    } catch (error) {

        console.error(
            "Could not get logged-in user:",
            error
        );

        return null;

    }

}


// ==========================================
// LOAD PROFILE
// ==========================================

async function loadProfile() {

    // --------------------------------------
    // Get creator ID
    // --------------------------------------

    creatorId =
        await getCreatorId();


    if (!creatorId) {

        showError(
            "Unable to identify this creator. Please login first."
        );

        console.error(
            "No creator ID was found."
        );

        return;

    }


    console.log(
        "Final Creator ID:",
        creatorId
    );


    try {

        // ==================================
        // GET PROFILE
        // ==================================

        const {
            data: creator,
            error: creatorError
        } = await sb

            .from("profiles")

            .select(`
                user_id,
                full_name,
                email,
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


        // ==================================
        // PROFILE NOT FOUND
        // ==================================

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


        // ==================================
        // DISPLAY CREATOR
        // ==================================

        renderCreator(
            creator
        );


        // ==================================
        // LOAD APPROVED PROJECTS
        // ==================================

        await loadProjects(
            creatorId
        );


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        showError(
            error.message ||
            "Unable to load creator profile."
        );

    }

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
    // GITHUB AVATAR
    // ======================================

    const avatar =
        getOfficialAvatar(
            creator
        );


    console.log(
        "Creator profile avatar:",
        avatar
    );


    const placeholder =
        profileHero.querySelector(
            ".avatar-placeholder"
        );


    if (
        avatar &&
        placeholder
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.className =
            "avatar";


        image.src =
            avatar;


        image.alt =
            "Creator avatar";


        image.onerror =
            function () {

                console.error(
                    "Creator avatar failed:",
                    image.src
                );


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
// GITHUB AVATAR SYSTEM
// ==========================================

function getOfficialAvatar(
    profile
) {

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
            Number(
                profile.creator_avatar
            );


        if (
            Number.isInteger(
                creatorNumber
            ) &&
            creatorNumber >= 1 &&
            creatorNumber <= 7
        ) {

            return (
                "assets/creator-avatars/" +
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
            Number(
                profile.selected_avatar
            );


        if (
            Number.isInteger(
                avatarNumber
            ) &&
            avatarNumber >= 1 &&
            avatarNumber <= 12
        ) {

            return (
                "assets/avatars/" +
                `avatar${avatarNumber}.png`
            );

        }

    }


    return "";

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


        // ==================================
        // NO PROJECTS
        // ==================================

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


    } catch (error) {

        console.error(
            "Creator projects error:",
            error
        );


        projectsContainer.innerHTML = `
            <div class="error">
                ${safeHTML(
                    error.message ||
                    "Unable to load projects."
                )}
            </div>
        `;

    }

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

    let thumbnailUrl =
        getThumbnailUrl(
            project.thumbnail
        );


    console.log(
        "Project thumbnail:",
        project.title,
        thumbnailUrl
    );


    let imageHTML;


    if (thumbnailUrl) {

        imageHTML = `
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
        `;

    } else {

        imageHTML = `
            <div class="project-image placeholder">
                <span>
                    No Thumbnail
                </span>
            </div>
        `;

    }


    // ======================================
    // CARD
    // ======================================

    card.innerHTML = `

        ${imageHTML}


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
    // THUMBNAIL FALLBACK
    // ======================================

    const image =
        card.querySelector(
            ".project-image"
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


                // --------------------------------
                // Try projects bucket
                // --------------------------------

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


                    if (
                        data?.publicUrl
                    ) {

                        console.log(
                            "Trying projects bucket:",
                            data.publicUrl
                        );


                        image.src =
                            data.publicUrl;


                        return;

                    }

                }


                // --------------------------------
                // Final fallback
                // --------------------------------

                image.style.display =
                    "none";


                const placeholder =
                    document.createElement(
                        "div"
                    );


                placeholder.className =
                    "project-image placeholder";


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


    projectsContainer.appendChild(
        card
    );

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


    // Complete URL

    if (
        thumbnail.startsWith(
            "http://"
        ) ||
        thumbnail.startsWith(
            "https://"
        )
    ) {

        return thumbnail;

    }


    // Local/GitHub asset

    if (
        thumbnail.startsWith(
            "assets/"
        )
    ) {

        return thumbnail;

    }


    // Supabase thumbnails bucket

    const {
        data
    } = sb.storage
        .from("thumbnails")
        .getPublicUrl(
            thumbnail
        );


    return (
        data?.publicUrl ||
        ""
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
