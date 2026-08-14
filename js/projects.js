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


        await attachCreators();

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
                ${escapeHTML(error.message)}
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
            allProjects.map(
                project =>
                    project.user_id
            )
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
            creator_rank
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
// RENDER
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


            card.innerHTML = `

                ${
                    project.thumbnail
                    ?
                    `
                    <img
                        class="poster"
                        src="${safeAttribute(project.thumbnail)}"
                        alt="${escapeHTML(project.title || "Anime")}"
                    >
                    `
                    :
                    `
                    <div class="poster"></div>
                    `
                }


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

                        ${
                            avatar
                            ?
                            `
                            <img
                                class="creator-avatar"
                                src="${safeAttribute(avatar)}"
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
                                Level ${creatorLevel}
                                •
                                ${escapeHTML(
                                    creatorRank
                                )}
                            </div>

                        </div>

                    </div>


                    <a
                        class="view-profile"
                        href="profile.html?user=${project.user_id}"
                    >
                        View Creator Profile →
                    </a>

                </div>

            `;


            projectsContainer.appendChild(
                card
            );

        }
    );

}


// ==========================================
// SEARCH + FILTER
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

searchInput.addEventListener(
    "input",
    filterProjects
);


categorySelect.addEventListener(
    "change",
    filterProjects
);


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
