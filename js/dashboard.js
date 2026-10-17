// ==========================================
// VIDLYRA CREATOR DASHBOARD
// Complete Dashboard JavaScript
// ==========================================

console.log("Vidlyra Dashboard JS loaded");

// ==========================================
// ELEMENTS
// ==========================================

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const dashboardContent = document.getElementById("dashboardContent");

const headerName = document.getElementById("headerName");
const headerAvatar = document.getElementById("headerAvatar");

const welcomeName = document.getElementById("welcomeName");

const creatorRank = document.getElementById("creatorRank");
const creatorLevel = document.getElementById("creatorLevel");

const approvedProjects = document.getElementById("approvedProjects");
const nextLevelTarget = document.getElementById("nextLevelTarget");
const levelProgress = document.getElementById("levelProgress");
const nextLevelText = document.getElementById("nextLevelText");

const totalProjects = document.getElementById("totalProjects");
const approvedCount = document.getElementById("approvedCount");
const pendingCount = document.getElementById("pendingCount");

const creatorAvatar = document.getElementById("creatorAvatar");
const creatorProfileName = document.getElementById("creatorProfileName");
const creatorProfileRank = document.getElementById("creatorProfileRank");

const notificationBadge = document.getElementById("notificationBadge");

// ==========================================
// AVATAR CONSTANTS
// ==========================================

const DEFAULT_AVATAR =
    "assets/creator-avatars/creator1.png";

const EVENT_AVATAR_URL =
    "https://vidlyra.github.io/Creator-Portal/assets/event-avatars/Vidlyra_EventAvatar_HalloweenFest2026_LimitedEdition.png";

// ==========================================
// SHOW / HIDE DASHBOARD
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
    console.error("Dashboard error:", message);

    if (loading) {
        loading.style.display = "none";
    }

    if (dashboardContent) {
        dashboardContent.style.display = "none";
    }

    if (errorBox) {
        errorBox.textContent =
            message || "Something went wrong.";

        errorBox.style.display = "block";
    }
}

// ==========================================
// CHECK SUPABASE CLIENT
// ==========================================

function checkSupabase() {
    if (typeof sb === "undefined" || !sb) {
        throw new Error(
            "Supabase client is unavailable. Check js/config.js."
        );
    }
}

// ==========================================
// GET CURRENT USER
// ==========================================

async function getCurrentUser() {
    const { data, error } = await sb.auth.getUser();

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

async function loadProfile(userId) {
    console.log("Loading profile:", userId);

    const { data: profile, error } = await sb
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
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!profile) {
        throw new Error(
            "Creator profile does not exist."
        );
    }

    console.log("Creator profile loaded:", profile);

    return profile;
}

// ==========================================
// GET SELECTED PROFILE AVATAR
// ==========================================

function getAvatar(profile) {
    /*
     * Priority:
     * 1. profiles.avatar_url
     * 2. Creator avatar
     * 3. Frequency avatar
     * 4. Default avatar
     *
     * Event Avatars are saved in avatar_url.
     */

    if (
        profile.avatar_url &&
        typeof profile.avatar_url === "string" &&
        profile.avatar_url.trim() !== ""
    ) {
        return profile.avatar_url.trim();
    }

    // Creator Avatar fallback
    if (
        profile.creator_avatar !== null &&
        profile.creator_avatar !== undefined &&
        profile.creator_avatar !== "" &&
        Number.isInteger(Number(profile.creator_avatar)) &&
        Number(profile.creator_avatar) >= 1 &&
        Number(profile.creator_avatar) <= 7
    ) {
        return (
            "assets/creator-avatars/creator" +
            Number(profile.creator_avatar) +
            ".png"
        );
    }

    // Frequency Avatar fallback
    if (
        profile.selected_avatar !== null &&
        profile.selected_avatar !== undefined &&
        profile.selected_avatar !== "" &&
        Number.isInteger(Number(profile.selected_avatar)) &&
        Number(profile.selected_avatar) >= 1 &&
        Number(profile.selected_avatar) <= 12
    ) {
        return (
            "assets/avatars/avatar" +
            Number(profile.selected_avatar) +
            ".png"
        );
    }

    return DEFAULT_AVATAR;
}

// ==========================================
// APPLY AVATAR TO IMAGE
// ==========================================

function setAvatarImage(imageElement, avatarUrl) {
    if (!imageElement) {
        return;
    }

    imageElement.onerror = function () {
        this.onerror = null;

        if (this.src !== new URL(
            DEFAULT_AVATAR,
            window.location.href
        ).href) {
            this.src = DEFAULT_AVATAR;
        }
    };

    imageElement.src = avatarUrl || DEFAULT_AVATAR;
}

// ==========================================
// UPDATE PROFILE UI
// ==========================================

function renderProfile(profile) {
    const name =
        profile.full_name ||
        profile.email ||
        "Creator";

    const rank =
        profile.creator_rank ||
        "New Creator";

    const level =
        Number(profile.creator_level) || 1;

    const avatar = getAvatar(profile);

    // Header name
    if (headerName) {
        headerName.textContent = name;
    }

    // Header avatar
    setAvatarImage(headerAvatar, avatar);

    // Welcome section
    if (welcomeName) {
        welcomeName.textContent = name;
    }

    // Creator rank
    if (creatorRank) {
        creatorRank.textContent = rank;
    }

    // Creator level
    if (creatorLevel) {
        creatorLevel.textContent = "LEVEL " + level;
    }

    // Creator profile card
    if (creatorProfileName) {
        creatorProfileName.textContent = name;
    }

    if (creatorProfileRank) {
        creatorProfileRank.textContent =
            rank + " • Level " + level;
    }

    // Creator profile avatar
    setAvatarImage(creatorAvatar, avatar);

    // Keep existing profile links working.
    const profileLinks = document.querySelectorAll(
        'a[href="profile.html"]'
    );

    profileLinks.forEach((link) => {
        link.href =
            "profile.html?user=" +
            encodeURIComponent(profile.user_id);
    });

    return {
        level: level,
        approved: Number(profile.approved_projects) || 0,
        avatar: avatar
    };
}

// ==========================================
// LOAD PROJECT STATISTICS
// ==========================================

async function loadProjectStats(userId) {
    console.log("Loading project statistics...");

    const { data: projects, error } = await sb
        .from("projects")
        .select("id, status")
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    const projectList = projects || [];

    const total = projectList.length;

    const approved = projectList.filter((project) => {
        return (
            String(project.status || "").toLowerCase() ===
            "approved"
        );
    }).length;

    const pending = projectList.filter((project) => {
        return (
            String(project.status || "").toLowerCase() ===
            "pending"
        );
    }).length;

    // Total project count
    if (totalProjects) {
        totalProjects.textContent = total;
    }

    // Approved project count
    if (approvedCount) {
        approvedCount.textContent = approved;
    }

    // Pending project count
    if (pendingCount) {
        pendingCount.textContent = pending;
    }

    console.log("Project stats:", {
        total,
        approved,
        pending
    });

    return {
        total,
        approved,
        pending
    };
}

// ==========================================
// CREATOR LEVEL PROGRESS
// ==========================================

function updateLevelProgress(profileApproved, actualApproved) {
    // Use the actual project-table count when available.
    const approved =
        Number(actualApproved) ||
        Number(profileApproved) ||
        0;

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
        approvedProjects.textContent = approved;
    }

    if (nextLevelTarget) {
        nextLevelTarget.textContent = target;
    }

    const percentage = Math.min(
        100,
        (approved / target) * 100
    );

    if (levelProgress) {
        levelProgress.style.width =
            percentage + "%";
    }

    const remaining = Math.max(
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
                (remaining === 1 ? "" : "s") +
                " needed for the next level.";
        }
    }
}

// ==========================================
// LOGOUT
// ==========================================

async function logout() {
    try {
        console.log("Logging out...");

        const { error } = await sb.auth.signOut();

        if (error) {
            throw error;
        }

        window.location.href = "login.html";
    } catch (error) {
        console.error("Logout error:", error);

        showError(
            "Unable to logout. Please try again."
        );
    }
}

// ==========================================
// LOAD NOTIFICATION BADGE
// ==========================================

async function loadNotificationBadge() {
    if (!notificationBadge) {
        console.warn(
            "Notification badge element not found."
        );
        return;
    }

    try {
        const {
            data: userData,
            error: userError
        } = await sb.auth.getUser();

        if (userError || !userData.user) {
            notificationBadge.style.display = "none";
            return;
        }

        const userId = userData.user.id;

        const {
            count,
            error
        } = await sb
            .from("notifications")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (error) {
            console.error(
                "Notification badge error:",
                error
            );
            return;
        }

        const unreadCount = count || 0;

        if (unreadCount > 0) {
            notificationBadge.textContent =
                unreadCount > 99 ? "99+" : unreadCount;

            notificationBadge.style.display =
                "inline-block";
        } else {
            notificationBadge.textContent = "0";

            notificationBadge.style.display = "none";
        }

        console.log(
            "Unread notifications:",
            unreadCount
        );
    } catch (error) {
        console.error(
            "Notification badge error:",
            error
        );
    }
}

// ==========================================
// START DASHBOARD
// ==========================================

async function loadDashboard() {
    showLoading();

    try {
        // Check Supabase configuration
        checkSupabase();

        // Get logged-in user
        const user = await getCurrentUser();

        if (!user) {
            console.warn("No logged-in user.");

            window.location.href = "login.html";
            return;
        }

        console.log("Logged-in user:", user.id);

        // Load profile
        const profile = await loadProfile(user.id);

        // Render profile and selected avatar
        const profileData = renderProfile(profile);

        // Load project statistics
        const stats = await loadProjectStats(user.id);

        // Update creator level progress
        updateLevelProgress(
            profileData.approved,
            stats.approved
        );

        // Show dashboard
        showDashboard();

        console.log("Dashboard loaded successfully.");
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
// INITIALIZE DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    loadNotificationBadge();
});

// ==========================================
// EVENT AVATAR RELOAD SUPPORT
// ==========================================

// Refresh dashboard avatar when returning to this page
// after selecting an avatar on event-avatars.html.
window.addEventListener("pageshow", async () => {
    try {
        if (typeof sb === "undefined" || !sb) {
            return;
        }

        const { data, error } = await sb.auth.getUser();

        if (error || !data?.user) {
            return;
        }

        const profile = await loadProfile(data.user.id);
        const avatar = getAvatar(profile);

        setAvatarImage(headerAvatar, avatar);
        setAvatarImage(creatorAvatar, avatar);
    } catch (error) {
        console.warn(
            "Could not refresh profile avatar:",
            error
        );
    }
});
