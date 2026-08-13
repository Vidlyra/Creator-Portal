// ==========================================
// VIDLYRA CREATOR DASHBOARD
// ==========================================

console.log("Dashboard JS loaded");


// ==========================================
// CREATOR LEVEL SYSTEM
// ==========================================

const creatorLevels = [

    {
        level: 1,
        rank: "New Creator",
        min: 0,
        max: 2,
        next: 3
    },

    {
        level: 2,
        rank: "Rising Creator",
        min: 3,
        max: 5,
        next: 6
    },

    {
        level: 3,
        rank: "Active Creator",
        min: 6,
        max: 10,
        next: 11
    },

    {
        level: 4,
        rank: "Pro Creator",
        min: 11,
        max: 20,
        next: 21
    },

    {
        level: 5,
        rank: "Elite Creator",
        min: 21,
        max: 35,
        next: 36
    },

    {
        level: 6,
        rank: "Master Creator",
        min: 36,
        max: 50,
        next: 51
    },

    {
        level: 7,
        rank: "Legendary Creator",
        min: 51,
        max: Infinity,
        next: null
    }

];


// ==========================================
// GET LEVEL
// ==========================================

function getCreatorLevel(projectCount) {

    return creatorLevels.find(level =>

        projectCount >= level.min &&
        projectCount <= level.max

    ) || creatorLevels[0];

}


// ==========================================
// UPDATE LEVEL
// ==========================================

function updateLevel(projectCount) {

    const levelInfo =
        getCreatorLevel(projectCount);


    document.getElementById(
        "creatorLevel"
    ).textContent =
        `LEVEL ${levelInfo.level}`;


    document.getElementById(
        "creatorRank"
    ).textContent =
        levelInfo.rank;


    document.getElementById(
        "creatorProfileRank"
    ).textContent =
        `${levelInfo.rank} • Level ${levelInfo.level}`;


    document.getElementById(
        "approvedProjects"
    ).textContent =
        projectCount;


    const progress =
        document.getElementById(
            "levelProgress"
        );


    const target =
        document.getElementById(
            "nextLevelTarget"
        );


    const nextText =
        document.getElementById(
            "nextLevelText"
        );


    // ======================================
    // LEGENDARY
    // ======================================

    if (levelInfo.level === 7) {

        target.textContent = "∞";

        progress.style.width = "100%";

        nextText.textContent =
            "🌌 Legendary Creator — maximum level reached.";

        return;

    }


    // ======================================
    // PROGRESS
    // ======================================

    const total =
        levelInfo.next -
        levelInfo.min;


    const completed =
        projectCount -
        levelInfo.min;


    let percentage =
        (completed / total) * 100;


    percentage =
        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        );


    progress.style.width =
        `${percentage}%`;


    target.textContent =
        levelInfo.next;


    const remaining =
        levelInfo.next -
        projectCount;


    if (remaining === 1) {

        nextText.textContent =
            "1 approved project needed for the next level.";

    } else {

        nextText.textContent =
            `${remaining} approved projects needed for the next level.`;

    }

}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    const loading =
        document.getElementById(
            "loading"
        );

    const content =
        document.getElementById(
            "dashboardContent"
        );

    const errorBox =
        document.getElementById(
            "error"
        );


    try {

        // ======================================
        // CHECK LOGIN
        // ======================================

        const {
            data,
            error
        } = await sb.auth.getUser();


        if (
            error ||
            !data.user
        ) {

            window.location.href =
                "login.html";

            return;

        }


        const user =
            data.user;


        console.log(
            "Logged-in creator:",
            user.id
        );


        // ======================================
        // LOAD PROFILE
        // ======================================

        const {
            data: profile,
            error: profileError
        } = await sb

            .from("profiles")

            .select(`
                full_name,
                email,
                creator_avatar,
                creator_level,
                creator_rank,
                approved_projects
            `)

            .eq(
                "user_id",
                user.id
            )

            .maybeSingle();


        if (profileError) {

            throw profileError;

        }


        if (!profile) {

            throw new Error(
                "Creator profile not found."
            );

        }


        console.log(
            "Creator profile:",
            profile
        );


        // ======================================
        // CREATOR NAME
        // ======================================

        const creatorName =
            profile.full_name ||
            "Creator";


        document.getElementById(
            "welcomeName"
        ).textContent =
            creatorName;


        document.getElementById(
            "headerName"
        ).textContent =
            creatorName;


        document.getElementById(
            "creatorProfileName"
        ).textContent =
            creatorName;


        // ======================================
        // CREATOR AVATAR
        // ======================================

        const avatarNumber =
            Number(
                profile.creator_avatar || 1
            );


        const avatarPath =
            `assets/creator-avatars/creator${avatarNumber}.png`;


        document.getElementById(
            "headerAvatar"
        ).src =
            avatarPath;


        document.getElementById(
            "creatorAvatar"
        ).src =
            avatarPath;


        // ======================================
        // APPROVED PROJECTS
        // ======================================

        const approvedProjects =
            Number(
                profile.approved_projects || 0
            );


        // ======================================
        // LEVEL
        // ======================================

        updateLevel(
            approvedProjects
        );


        // ======================================
        // PROJECT STATISTICS
        // ======================================

        await loadProjectStats(
            user.id,
            approvedProjects
        );


        // ======================================
        // SHOW DASHBOARD
        // ======================================

        loading.style.display =
            "none";


        content.style.display =
            "block";


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        loading.style.display =
            "none";


        errorBox.style.display =
            "block";


        errorBox.textContent =
            error.message ||
            "Unable to load dashboard.";

    }

}


// ==========================================
// LOAD PROJECT STATISTICS
// ==========================================

async function loadProjectStats(
    userId,
    approvedFromProfile
) {

    try {

        /*
         * IMPORTANT:
         *
         * This assumes your project table
         * is called "projects".
         *
         * If your table has a different name,
         * change "projects" below.
         */


        const {
            data: projects,
            error
        } = await sb

            .from("projects")

            .select(`
                id,
                status
            `)

            .eq(
                "user_id",
                userId
            );


        if (error) {

            console.warn(
                "Project statistics unavailable:",
                error.message
            );


            // Still show approved count
            document.getElementById(
                "approvedCount"
            ).textContent =
                approvedFromProfile;


            return;

        }


        const projectList =
            projects || [];


        // ======================================
        // TOTAL
        // ======================================

        const total =
            projectList.length;


        document.getElementById(
            "totalProjects"
        ).textContent =
            total;


        // ======================================
        // APPROVED
        // ======================================

        const approved =
            projectList.filter(
                project =>

                    String(
                        project.status || ""
                    ).toLowerCase() ===
                    "approved"

            ).length;


        document.getElementById(
            "approvedCount"
        ).textContent =
            approved;


        // ======================================
        // PENDING
        // ======================================

        const pending =
            projectList.filter(
                project => {

                    const status =
                        String(
                            project.status || ""
                        ).toLowerCase();


                    return (
                        status === "pending" ||
                        status === "submitted" ||
                        status === ""
                    );

                }
            ).length;


        document.getElementById(
            "pendingCount"
        ).textContent =
            pending;


    } catch (error) {

        console.warn(
            "Project stats error:",
            error
        );

    }

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
            "Logout failed: " +
            error.message
        );

    }

}


// ==========================================
// START DASHBOARD
// ==========================================

loadDashboard();
