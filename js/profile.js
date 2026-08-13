// ==========================================
// VIDLYRA CREATOR PROFILE
// ==========================================

console.log("Profile JS loaded");


// ==========================================
// LEVEL SYSTEM
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
// GET LEVEL INFORMATION
// ==========================================

function getLevelInfo(projectCount) {

    for (const level of creatorLevels) {

        if (
            projectCount >= level.min &&
            projectCount <= level.max
        ) {
            return level;
        }

    }

    return creatorLevels[0];
}


// ==========================================
// UPDATE LEVEL DISPLAY
// ==========================================

function updateCreatorLevel(projectCount) {

    const levelInfo =
        getLevelInfo(projectCount);


    const creatorLevel =
        document.getElementById(
            "creatorLevel"
        );

    const creatorRank =
        document.getElementById(
            "creatorRank"
        );

    const approvedProjects =
        document.getElementById(
            "approvedProjects"
        );

    const progress =
        document.getElementById(
            "levelProgress"
        );

    const nextLevelTarget =
        document.getElementById(
            "nextLevelTarget"
        );

    const nextLevelText =
        document.getElementById(
            "nextLevelText"
        );


    // ======================================
    // LEVEL
    // ======================================

    creatorLevel.textContent =
        `LEVEL ${levelInfo.level}`;


    // ======================================
    // RANK
    // ======================================

    creatorRank.textContent =
        levelInfo.rank;


    // ======================================
    // PROJECT COUNT
    // ======================================

    approvedProjects.textContent =
        projectCount;


    // ======================================
    // LEGENDARY
    // ======================================

    if (levelInfo.level === 7) {

        nextLevelTarget.textContent =
            "∞";


        progress.style.width =
            "100%";


        nextLevelText.textContent =
            "🌌 Maximum creator level reached";


        return;

    }


    // ======================================
    // PROGRESS CALCULATION
    // ======================================

    const range =
        levelInfo.next - levelInfo.min;


    const completed =
        projectCount - levelInfo.min;


    let percentage =
        (completed / range) * 100;


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


    // ======================================
    // NEXT LEVEL
    // ======================================

    nextLevelTarget.textContent =
        levelInfo.next;


    const remaining =
        levelInfo.next - projectCount;


    if (remaining === 1) {

        nextLevelText.textContent =
            "1 approved project needed for the next level.";

    } else {

        nextLevelText.textContent =
            `${remaining} approved projects needed for the next level.`;

    }

}


// ==========================================
// LOAD CREATOR PROFILE
// ==========================================

async function loadProfile() {

    const loading =
        document.getElementById(
            "loading"
        );

    const content =
        document.getElementById(
            "profileContent"
        );

    const errorBox =
        document.getElementById(
            "error"
        );


    try {

        // ======================================
        // GET USER
        // ======================================

        const {
            data: userData,
            error: userError
        } = await sb.auth.getUser();


        if (
            userError ||
            !userData.user
        ) {

            window.location.href =
                "login.html";

            return;

        }


        const user =
            userData.user;


        console.log(
            "Creator:",
            user.id
        );


        // ======================================
        // GET PROFILE
        // ======================================

        const {
            data: profile,
            error: profileError
        } = await sb
            .from("profiles")
            .select(`
                full_name,
                email,
                avatar_url,
                selected_avatar,
                approved_projects,
                creator_level,
                creator_rank
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
                "Creator profile was not found."
            );

        }


        console.log(
            "Profile:",
            profile
        );


        // ======================================
        // NAME
        // ======================================

        document
            .getElementById(
                "creatorName"
            )
            .textContent =
                profile.full_name ||
                "Creator";


        // ======================================
        // EMAIL
        // ======================================

        document
            .getElementById(
                "creatorEmail"
            )
            .textContent =
                profile.email ||
                user.email ||
                "Not available";


        // ======================================
        // USER ID
        // ======================================

        document
            .getElementById(
                "userId"
            )
            .textContent =
                user.id;


        // ======================================
        // ACCOUNT CREATED
        // ======================================

        if (user.created_at) {

            const date =
                new Date(
                    user.created_at
                );


            document
                .getElementById(
                    "createdAt"
                )
                .textContent =
                    date.toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                        }
                    );

        }


        // ======================================
        // AVATAR NUMBER
        // ======================================

        const avatarNumber =
            Number(
                profile.selected_avatar || 1
            );


        document
            .getElementById(
                "avatarNumber"
            )
            .textContent =
                `Avatar #${avatarNumber}`;


        // ======================================
        // AVATAR IMAGE
        // ======================================

        const avatarImage =
            document.getElementById(
                "avatarImage"
            );


        if (profile.avatar_url) {

            avatarImage.src =
                profile.avatar_url;

        } else {

            avatarImage.src =
                `assets/avatars/avatar${avatarNumber}.png`;

        }


        // ======================================
        // APPROVED PROJECTS
        // ======================================

        const approvedProjects =
            Number(
                profile.approved_projects || 0
            );


        // ======================================
        // UPDATE CREATOR LEVEL
        // ======================================

        updateCreatorLevel(
            approvedProjects
        );


        // ======================================
        // SHOW PROFILE
        // ======================================

        loading.style.display =
            "none";

        content.style.display =
            "block";


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        loading.style.display =
            "none";

        errorBox.style.display =
            "block";

        errorBox.textContent =
            error.message ||
            "Unable to load creator profile.";

    }

}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    console.log(
        "Logging out..."
    );


    const {
        error
    } = await sb.auth.signOut();


    if (error) {

        console.error(
            "Logout error:",
            error
        );


        alert(
            "Logout failed: " +
            error.message
        );

        return;

    }


    window.location.href =
        "login.html";

}


// ==========================================
// START
// ==========================================

loadProfile();
