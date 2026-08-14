// ==========================================
// VIDLYRA PROJECTS
// Explore + My Projects
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
// MODE
// ==========================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const mineMode =
    urlParams.get("mine") === "true";


console.log(
    "Projects mode:",
    mineMode
        ? "MY PROJECTS"
        : "EXPLORE"
);


// ==========================================
// DATA
// ==========================================

let allProjects = [];

let currentUser = null;


// ==========================================
// PAGE TITLE
// ==========================================

function updatePageTitle() {

    const heroTitle =
        document.querySelector(".hero h1");

    const heroDescription =
        document.querySelector(".hero p");

    if (mineMode) {

        if (heroTitle) {
            heroTitle.textContent =
                "My Projects";
        }

        if (heroDescription) {
            heroDescription.textContent =
                "View and manage your submitted projects.";
        }

        document.title =
            "My Projects | Vidlyra";

    } else {

        if (heroTitle) {
            heroTitle.textContent =
                "Anime";
        }

        if (heroDescription) {
            heroDescription.textContent =
                "Discover approved creations from Vidlyra creators.";
        }

        document.title =
            "Anime | Vidlyra";
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

        console.error(
            "Auth error:",
            error
        );

        return null;
    }


    return data?.user || null;

}


// ==========================================
// LOAD PROJECTS
// ==========================================

async function loadProjects() {

    projectsContainer.innerHTML = `
        <div class="loading">
            Loading projects...
        </div>
    `;


    try {

        // ======================================
        // GET LOGIN USER
        // ======================================

        currentUser =
            await getCurrentUser();


        // ======================================
        // MY PROJECTS MODE
        // ======================================

        if (
            mineMode &&
            !currentUser
        ) {

            projectsContainer.innerHTML = `
                <div class="error">
                    Please login to view your projects.
                </div>
            `;

            return;

        }


        // ======================================
        // BASE QUERY
        // ======================================

        let query =
            sb

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
                `);


        // ======================================
        // EXPLORE
        // ======================================

        if (!mineMode) {

            query =
                query.eq(
                    "status",
                    "Approved"
                );

        }


        // ======================================
        // MY PROJECTS
        // ======================================

        if (
            mineMode &&
            currentUser
        ) {

            query =
                query.eq(
                    "user_id",
                    currentUser.id
                );

        }


        // ======================================
        // ORDER
        // ======================================

        query =
            query.order(
                "created_at",
                {
                    ascending: false
                }
            );


        // ======================================
        // EXECUTE
        // ======================================

        const {
            data: projects,
            error
        } = await query;


        if (error) {

            throw error;

        }


        allProjects =
            projects || [];


        console.log(
            mineMode
                ? "My projects:"
                : "Approved projects:",
            allProjects
        );


        // ======================================
        // ATTACH CREATORS
        // ======================================

        await attachCreators();


        // ======================================
        // RENDER
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
            creator_rank
        `)

        .in(
            "user_id",
            userIds
        );


    if (error) {

        console.error(
            "Creator profiles error:",
            error
        );

        return;

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
// CREATOR AVATAR
// ==========================================

function getCreatorAvatar(
    creator
) {

    if (!creator) {

        return "";

    }


    // --------------------------------------
    // GitHub creator avatar
    // --------------------------------------

    if (
        creator.creator_avatar &&
        Number(creator.creator_avatar) >= 1 &&
        Number(creator.creator_avatar) <= 7
    ) {

        return (
            "assets/creator-avatars/creator" +
            Number(creator.creator_avatar) +
            ".png"
        );

    }


    // --------------------------------------
    // GitHub Frequency avatar
    // --------------------------------------

    if (
        creator.selected_avatar &&
        Number(creator.selected_avatar) >= 1 &&
        Number(creator.selected_avatar) <= 12
    ) {

        return (
            "assets/avatars/avatar" +
            Number(creator.selected_avatar) +
            ".png"
        );

    }


    // --------------------------------------
    // Supabase avatar URL
    // --------------------------------------

    if (
        creator.avatar_url
    ) {

        return creator.avatar_url;

    }


    return "";

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

                ${
                    mineMode
                    ?
                    "You have not submitted any projects yet."
                    :
                    "No approved projects found."
                }

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
// RENDER PROJECT CARD
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
        getCreatorAvatar(
            creator
        );


    // ======================================
    // THUMBNAIL
    // ======================================

    let thumbnailHTML = "";


    if (
        project.thumbnail
    ) {

        thumbnailHTML = `

            <img
                class="poster"
                src="${safeAttribute(
                    project.thumbnail
                )}"
                alt="${escapeHTML(
                    project.title ||
                    "Anime"
                )}"
                loading="lazy"
            >

        `;

    } else {

        thumbnailHTML = `

            <div class="poster"></div>

        `;

    }


    // ======================================
    // CREATOR AVATAR
    // ======================================

    let avatarHTML = "";


    if (avatar) {

        avatarHTML = `

            <img
                class="creator-avatar"
                src="${safeAttribute(
                    avatar
                )}"
                alt="Creator avatar"
                loading="lazy"
            >

        `;

    } else {

        avatarHTML = `

            <div class="creator-avatar"></div>

        `;

    }


    // ======================================
    // STATUS
    // ======================================

    const statusHTML =
        mineMode
        ?
        `

        <div
            class="project-status"
            style="
                margin-top:10px;
                font-size:11px;
                color:${
                    project.status === "Approved"
                    ? "#63d471"
                    : "#ffb347"
                };
            "
        >
            Status:
            ${escapeHTML(
                project.status ||
                "Pending"
            )}
        </div>

        `
        :
        "";


    // ======================================
    // CARD
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


            ${
                mineMode
                ?
                `
                <div
                    style="
                        color:#777;
                        font-size:11px;
                        line-height:1.5;
                    "
                >
                    ${
                        escapeHTML(
                            project.description ||
                            "No description available."
                        )
                    }
                </div>
                `
                :
                ""
            }


            <div class="creator">


                ${avatarHTML}


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


            ${statusHTML}


            <a
                class="view-profile"
                href="profile.html?user=${encodeURIComponent(
                    project.user_id
                )}"
            >

                View Creator Profile →

            </a>


        </div>

    `;


    // ======================================
    // THUMBNAIL ERROR
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

                console.error(
                    "Thumbnail failed:",
                    project.thumbnail
                );


                image.style.display =
                    "none";

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
                    "Creator avatar failed:",
                    avatarImage.src
                );


                avatarImage.style.display =
                    "block";

                avatarImage.src =
                    "assets/avatars/avatar1.png";

            }
        );

    }


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
                        project.creator?.full_name ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    title.includes(search) ||
                    description.includes(search) ||
                    creatorName.includes(search);


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

updatePageTitle();

loadProjects();
