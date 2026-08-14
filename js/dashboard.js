// ==========================================
// VIDLYRA CREATOR DASHBOARD
// ==========================================

console.log("Vidlyra Dashboard JS loaded");


// ==========================================
// ELEMENTS
// ==========================================

const loading =
    document.getElementById("loading");

const errorBox =
    document.getElementById("error");

const dashboardContent =
    document.getElementById(
        "dashboardContent"
    );

const headerName =
    document.getElementById("headerName");

const headerAvatar =
    document.getElementById("headerAvatar");

const welcomeName =
    document.getElementById("welcomeName");

const creatorRank =
    document.getElementById("creatorRank");

const creatorLevel =
    document.getElementById("creatorLevel");

const approvedProjects =
    document.getElementById("approvedProjects");

const nextLevelTarget =
    document.getElementById("nextLevelTarget");

const levelProgress =
    document.getElementById("levelProgress");

const nextLevelText =
    document.getElementById("nextLevelText");

const totalProjects =
    document.getElementById("totalProjects");

const approvedCount =
    document.getElementById("approvedCount");

const pendingCount =
    document.getElementById("pendingCount");

const creatorAvatar =
    document.getElementById("creatorAvatar");

const creatorProfileName =
    document.getElementById(
        "creatorProfileName"
    );

const creatorProfileRank =
    document.getElementById(
        "creatorProfileRank"
    );


// ==========================================
// CHECK REQUIRED ELEMENTS
// ==========================================

console.log("Dashboard elements:", {
    loading,
    errorBox,
    dashboardContent,
    headerName,
    headerAvatar,
    welcomeName,
    creatorRank,
    creatorLevel,
    approvedProjects,
    nextLevelTarget,
    levelProgress,
    nextLevelText,
    totalProjects,
    approvedCount,
    pendingCount,
    creatorAvatar,
    creatorProfileName,
    creatorProfileRank
});


// ==========================================
// SHOW / HIDE
// ==========================================

function showLoading() {

    if (loading) {
        loading.style.display = "block";
    }

    if (errorBox) {
        errorBox.style.display = "none";
    }

    if (dashboardContent) {
        dashboardContent.style.display = "none";
    }

}


function showDashboard() {

    if (loading) {
        loading.style.display = "none";
    }

    if (errorBox) {
        errorBox.style.display = "none";
    }

    if (dashboardContent) {
        dashboardContent.style.display = "block";
    }

}


function showError(message) {

    console.error(
        "Dashboard error:",
        message
    );

    if (loading) {
        loading.style.display = "none";
    }

    if (dashboardContent) {
        dashboardContent.style.display = "none";
    }

    if (errorBox) {

        errorBox.textContent =
            message ||
            "Something went wrong.";

        errorBox.style.display =
            "block";
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

        throw error;

    }


    if (!data || !data.user) {

        return null;

    }


    return data.user;

}


// ==========================================
// LOAD PROFILE
// ==========================================

async function loadProfile(
    userId
) {

    console.log(
        "Loading profile:",
        userId
    );


    const {
        data: profile,
        error
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
            userId
        )

        .maybeSingle();


    if (error) {

        throw error;

    }


    if (!profile) {

        throw new Error(
            "Creator profile does not exist."
        );

    }


    console.log(
        "Creator profile:",
        profile
    );


    return profile;

}


// ==========================================
// GET AVATAR
// ==========================================

function getAvatar(
    profile
) {

    // Creator avatar from GitHub
    if (
        profile.creator_avatar &&
        Number(profile.creator_avatar) >= 1 &&
        Number(profile.creator_avatar) <= 7
    ) {

        return (
            "assets/creator-avatars/creator" +
            Number(profile.creator_avatar) +
            ".png"
        );

    }


    // Frequency avatar from GitHub
    if (
        profile.selected_avatar &&
        Number(profile.selected_avatar) >= 1 &&
        Number(profile.selected_avatar) <= 12
    ) {

        return (
            "assets/avatars/avatar" +
            Number(profile.selected_avatar) +
            ".png"
        );

    }


    // Supabase avatar URL
    if (
        profile.avatar_url
    ) {

        return profile.avatar_url;

    }


    // Default
    return (
        "assets/creator-avatars/creator1.png"
    );

}


// ==========================================
// UPDATE PROFILE UI
// ==========================================

function renderProfile(
    profile
) {

    const name =
        profile.full_name ||
        "Creator";


    const rank =
        profile.creator_rank ||
        "New Creator";


    const level =
        Number(
            profile.creator_level
        ) || 1;


    const avatar =
        getAvatar(profile);


    // Header
    if (headerName) {
        headerName.textContent =
            name;
    }


    if (headerAvatar) {

        headerAvatar.src =
            avatar;

        headerAvatar.onerror =
            function () {

                this.onerror = null;

                this.src =
                    "assets/creator-avatars/creator1.png";

            };

    }


    // Welcome
    if (welcomeName) {

        welcomeName.textContent =
            name;

    }


    // Rank
    if (creatorRank) {

        creatorRank.textContent =
            rank;

    }


    // Level
    if (creatorLevel) {

        creatorLevel.textContent =
            "LEVEL " + level;

    }


    // Creator card
    if (creatorProfileName) {

        creatorProfileName.textContent =
            name;

    }


    if (creatorProfileRank) {

        creatorProfileRank.textContent =
            rank +
            " • Level " +
            level;

    }


    // Creator avatar
    if (creatorAvatar) {

        creatorAvatar.src =
            avatar;

        creatorAvatar.onerror =
            function () {

                this.onerror = null;

                this.src =
                    "assets/creator-avatars/creator1.png";

            };

    }


    // Profile links
    const profileLinks =
        document.querySelectorAll(
            'a[href="profile.html"]'
        );


    profileLinks.forEach(
        link => {

            link.href =
                "profile.html?user=" +
                encodeURIComponent(
                    profile.user_id
                );

        }
    );


    return {
        level,
        approved:
            Number(
                profile.approved_projects
            ) || 0
    };

}


// ==========================================
// LOAD PROJECT STATS
// ==========================================

async function loadProjectStats(
    userId
) {

    console.log(
        "Loading project statistics..."
    );


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

        throw error;

    }


    const projectList =
        projects || [];


    const total =
        projectList.length;


    const approved =
        projectList.filter(
            project =>
                String(
                    project.status || ""
                ).toLowerCase() ===
                "approved"
        ).length;


    const pending =
        projectList.filter(
            project =>
                String(
                    project.status || ""
                ).toLowerCase() ===
                "pending"
        ).length;


    console.log(
        "Project stats:",
        {
            total,
            approved,
            pending
        }
    );


    if (totalProjects) {

        totalProjects.textContent =
            total;

    }


    if (approvedCount) {

        approvedCount.textContent =
            approved;

    }


    if (pendingCount) {

        pendingCount.textContent =
            pending;

    }


    return {
        total,
        approved,
        pending
    };

}


// ==========================================
// LEVEL PROGRESS
// ==========================================

function updateLevelProgress(
    profileApproved,
    actualApproved
) {

    /*
        Use actual database project count
        when available.

        This keeps the dashboard accurate.
    */

    const approved =
        Number(
            actualApproved
        ) || Number(
            profileApproved
        ) || 0;


    let target;


    if (approved < 3) {

        target = 3;

    } else if (approved < 6) {

        target = 6;

    } else if (approved < 10) {

        target = 10;

    } else {

        target = approved + 5;

    }


    if (approvedProjects) {

        approvedProjects.textContent =
            approved;

    }


    if (nextLevelTarget) {

        nextLevelTarget.textContent =
            target;

    }


    const percentage =
        Math.min(
            100,
            (approved / target) * 100
        );


    if (levelProgress) {

        levelProgress.style.width =
            percentage + "%";

    }


    const remaining =
        Math.max(
            0,
            target - approved
        );


    if (nextLevelText) {

        if (remaining === 0) {

            nextLevelText.textContent =
                "Next creator level unlocked!";

        } else {

            nextLevelText.textContent =
                remaining +
                " approved project" +
                (
                    remaining === 1
                        ? ""
                        : "s"
                ) +
                " needed for the next level.";

        }

    }

}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    try {

        console.log(
            "Logging out..."
        );


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


        showError(
            "Unable to logout. Please try again."
        );

    }

}


// ==========================================
// START DASHBOARD
// ==========================================

async function loadDashboard() {

    showLoading();


    try {

        // --------------------------------------
        // Check Supabase
        // --------------------------------------

        if (
            typeof sb === "undefined" ||
            !sb
        ) {

            throw new Error(
                "Supabase client is not available. Check config.js."
            );

        }


        // --------------------------------------
        // Get logged-in user
        // --------------------------------------

        const user =
            await getCurrentUser();


        if (!user) {

            console.warn(
                "No logged-in user."
            );


            window.location.href =
                "login.html";

            return;

        }


        console.log(
            "Logged-in user:",
            user.id
        );


        // --------------------------------------
        // Profile
        // --------------------------------------

        const profile =
            await loadProfile(
                user.id
            );


        // --------------------------------------
        // Render profile
        // --------------------------------------

        const profileData =
            renderProfile(
                profile
            );


        // --------------------------------------
        // Project statistics
        // --------------------------------------

        const stats =
            await loadProjectStats(
                user.id
            );


        // --------------------------------------
        // Progress
        // --------------------------------------

        updateLevelProgress(
            profileData.approved,
            stats.approved
        );


        // --------------------------------------
        // Show dashboard
        // --------------------------------------

        showDashboard();


        console.log(
            "Dashboard loaded successfully."
        );


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        showError(
            error.message ||
            "Unable to load dashboard."
        );

    }

}


// ==========================================
// START
// ==========================================

loadDashboard();
