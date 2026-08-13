// ==========================================
// VIDLYRA CREATOR PROFILE
// ==========================================

console.log("Creator Profile JS loaded");


// ==========================================
// LEVEL DATA
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
// FIND LEVEL
// ==========================================

function getCreatorLevel(projects) {

    return creatorLevels.find(level =>

        projects >= level.min &&
        projects <= level.max

    ) || creatorLevels[0];

}


// ==========================================
// UPDATE LEVEL UI
// ==========================================

function updateLevelUI(projects) {

    const levelInfo =
        getCreatorLevel(projects);


    document.getElementById(
        "creatorLevel"
    ).textContent =
        `LEVEL ${levelInfo.level}`;


    document.getElementById(
        "creatorRank"
    ).textContent =
        levelInfo.rank;


    document.getElementById(
        "approvedProjects"
    ).textContent =
        projects;


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


    // LEGENDARY

    if (levelInfo.level === 7) {

        target.textContent = "∞";

        progress.style.width = "100%";

        nextText.textContent =
            "🌌 Legendary Creator — maximum level reached.";

        return;

    }


    // PROGRESS

    const total =
        levelInfo.next -
        levelInfo.min;


    const completed =
        projects -
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
        projects;


    if (remaining === 1) {

        nextText.textContent =
            "1 approved project needed for the next level.";

    } else {

        nextText.textContent =
            `${remaining} approved projects needed for the next level.`;

    }

}


// ==========================================
// LOAD PROFILE
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

        // GET LOGGED-IN USER

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


        // GET PROFILE

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
                creator_avatar,
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
                "Creator profile not found."
            );

        }


        console.log(
            "Creator profile:",
            profile
        );


        // ======================================
        // NAME
        // ======================================

        document.getElementById(
            "creatorName"
        ).textContent =
            profile.full_name ||
            "Creator";


        // ======================================
        // EMAIL
        // ======================================

        document.getElementById(
            "creatorEmail"
        ).textContent =
            profile.email ||
            user.email ||
            "";


        // ======================================
        // USER ID
        // ======================================

        document.getElementById(
            "userId"
        ).textContent =
            user.id;


        // ======================================
        // CREATED DATE
        // ======================================

        if (user.created_at) {

            const date =
                new Date(
                    user.created_at
                );


            document.getElementById(
                "createdAt"
            ).textContent =
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
        // CREATOR AVATAR
        // ======================================

        const creatorAvatar =
            Number(
                profile.creator_avatar || 1
            );


        const avatarImage =
            document.getElementById(
                "creatorAvatarImage"
            );


        avatarImage.src =
            `assets/creator-avatars/creator${creatorAvatar}.png`;


        avatarImage.alt =
            `Creator Avatar #${creatorAvatar}`;


        document.getElementById(
            "avatarNumber"
        ).textContent =
            `Creator Avatar #${creatorAvatar}`;


        // ======================================
        // APPROVED PROJECTS
        // ======================================

        const approvedProjects =
            Number(
                profile.approved_projects || 0
            );


        // ======================================
        // LEVEL UI
        // ======================================

        updateLevelUI(
            approvedProjects
        );


        // ======================================
        // SHOW
        // ======================================

        loading.style.display =
            "none";

        content.style.display =
            "block";


    } catch (error) {

        console.error(
            "Profile error:",
            error
        );


        loading.style.display =
            "none";

        errorBox.style.display =
            "block";

        errorBox.textContent =
            error.message ||
            "Unable to load profile.";

    }

}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    const {
        error
    } = await sb.auth.signOut();


    if (error) {

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
