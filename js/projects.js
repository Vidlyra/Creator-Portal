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
// SUPABASE STORAGE
// ==========================================

// Your project thumbnail files are stored
// inside the Supabase "projects" bucket.

const PROJECT_BUCKET =
    "projects";


// ==========================================
// LOAD APPROVED PROJECTS
// ==========================================

async function loadProjects() {

    projectsContainer.innerHTML = `
        <div class="loading">
            Loading anime...
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


        allProjects =
            projects || [];


        console.log(
            "Approved projects:",
            allProjects
        );


        // Get creator information

        await attachCreators();


        // Display projects

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
                    error.message
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


    const {
        data: profiles,
        error
    } = await sb

        .from("profiles")

        .select(`
            user_id,
            full_name,
            avatar_url,
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

        throw error;

    }


    const profileMap =
        new Map();


    (profiles || []).forEach(
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
// GET THUMBNAIL URL
// ==========================================

function getThumbnailUrl(
    thumbnail
) {

    if (!thumbnail) {

        return "";

    }


    // If database already contains
    // a complete URL, use it directly.

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


    // Otherwise treat it as a
    // Supabase Storage path.

    const {
        data
    } = sb.storage

        .from(
            PROJECT_BUCKET
        )

        .getPublicUrl(
            thumbnail
        );


    return data?.publicUrl || "";

}


// ==========================================
// RENDER PROJECTS
// ==========================================

function renderProjects(
    projects
) {

    projectsContainer.innerHTML = "";


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

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "card";


            // ==================================
            // CREATOR
            // ==================================

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


            const avatar =
                creator?.avatar_url ||
                "";


            // ==================================
            // THUMBNAIL
            // ==================================

            const thumbnailUrl =
                getThumbnailUrl(
                    project.thumbnail
                );


            console.log(
                "Thumbnail:",
                project.title,
                thumbnailUrl
            );


            // ==================================
            // CREATOR PROFILE URL
            // ==================================

            const creatorProfileUrl =
                project.user_id
                    ? `profile.html?user=${encodeURIComponent(
                        project.user_id
                    )}`
                    : "profile.html";


            // ==================================
            // CARD
            // ==================================

            card.innerHTML = `

                ${
                    thumbnailUrl
                    ?
                    `
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
                    `
                    :
                    `
                    <div class="poster"></div>
                    `
                }


                <div class="card-body">


                    <!-- PROJECT TITLE -->

                    <div class="title">

                        ${escapeHTML(
                            project.title ||
                            "Untitled"
                        )}

                    </div>


                    <!-- CATEGORY -->

                    <div class="category">

                        ${escapeHTML(
                            project.category ||
                            "Anime"
                        )}

                    </div>


                    <!-- CREATOR -->

                    <div class="creator">


                        ${
                            avatar
                            ?
                            `
                            <img
                                class="creator-avatar"
                                src="${safeAttribute(
                                    avatar
                                )}"
                                alt="Creator avatar"
                            >
                            `
                            :
                            `
                            <div class="creator-avatar">
                            </div>
                            `
                        }


                        <div>


                            <div class="creator-name">

                                ${escapeHTML(
                                    creatorName
                                )}

                            </div>


                            <div class="creator-level">

                                Level
                                ${creatorLevel}

                                •
                                
                                ${escapeHTML(
                                    creatorRank
                                )}

                            </div>


                        </div>


                    </div>


                    <!-- PROFILE LINK -->

                    <a
                        class="view-profile"
                        href="${creatorProfileUrl}"
                    >
                        View Creator Profile →
                    </a>


                </div>

            `;


            // ==================================
            // IMAGE ERROR HANDLER
            // ==================================

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

                        console.error(
                            "Thumbnail failed:",
                            thumbnailUrl
                        );


                        image.style.display =
                            "none";

                    }
                );

            }


            projectsContainer.appendChild(
                card
            );

        }
    );

}


// ==========================================
// SEARCH + CATEGORY FILTER
// ==========================================

function filterProjects() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const category =
        categorySelect.value;


    const filtered =
        allProjects.filter(
            project => {


                const title =
                    (
                        project.title ||
                        ""
                    ).toLowerCase();


                const description =
                    (
                        project.description ||
                        ""
                    ).toLowerCase();


                const projectCategory =
                    project.category ||
                    "";


                const creatorName =
                    (
                        project.creator
                            ?.full_name ||
                        ""
                    ).toLowerCase();


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

                    projectCategory ===
                    category;


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
// SEARCH EVENT
// ==========================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterProjects
    );

}


// ==========================================
// CATEGORY EVENT
// ==========================================

if (categorySelect) {

    categorySelect.addEventListener(
        "change",
        filterProjects
    );

}


// ==========================================
// SECURITY
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
