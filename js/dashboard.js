
console.log("Vidlyra Dashboard loaded");

// ========================================
// CONFIGURATION
// ========================================

const DEFAULT_AVATAR = "assets/creator-avatars/creator1.png";

const EVENT_AVATARS = {
    "ff434e87-c105-451a-9d5c-dd5374bc7cb0":
        "https://raw.githubusercontent.com/Vidlyra/Creator-Portal/main/assets/event-avatars/Vidlyra_EventAvatar_HalloweenFest2026_LimitedEdition.png"
};

// ========================================
// DOM ELEMENTS
// ========================================

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const dashboardContent = document.getElementById("dashboardContent");

const headerName = document.getElementById("headerName");
const headerAvatar = document.getElementById("headerAvatar");
const welcomeName = document.getElementById("welcomeName");

const creatorRank = document.getElementById("creatorRank");
const creatorLevel = document.getElementById("creatorLevel");

const creatorAvatar = document.getElementById("creatorAvatar");
const creatorProfileName = document.getElementById("creatorProfileName");
const creatorProfileRank = document.getElementById("creatorProfileRank");

const approvedProjects = document.getElementById("approvedProjects");
const nextLevelTarget = document.getElementById("nextLevelTarget");
const levelProgress = document.getElementById("levelProgress");
const nextLevelText = document.getElementById("nextLevelText");

const totalProjects = document.getElementById("totalProjects");
const approvedCount = document.getElementById("approvedCount");
const pendingCount = document.getElementById("pendingCount");

const notificationBadge = document.getElementById("notificationBadge");

let currentUserId = null;
let loadingDashboard = false;

// ========================================
// LOADING AND ERROR DISPLAY
// ========================================

function showLoading() {
    if (loading) loading.style.display = "block";
    if (errorBox) errorBox.style.display = "none";
    if (dashboardContent) dashboardContent.style.display = "none";
}

function showDashboard() {
    if (loading) loading.style.display = "none";
    if (errorBox) errorBox.style.display = "none";
    if (dashboardContent) dashboardContent.style.display = "block";
}

function showError(message) {
    console.error("Dashboard error:", message);

    if (loading) loading.style.display = "none";
    if (dashboardContent) dashboardContent.style.display = "none";

    if (errorBox) {
        errorBox.textContent = message;
        errorBox.style.display = "block";
    }
}

// ========================================
// SUPABASE AUTHENTICATION
// ========================================

function checkSupabase() {
    if (typeof sb === "undefined" || !sb) {
        throw new Error(
            "Supabase client missing. Check your config.js file."
        );
    }
}

async function getCurrentUser() {
    const { data, error } = await sb.auth.getUser();

    if (error) throw error;

    return data?.user || null;
}

// ========================================
// LOAD CREATOR PROFILE
// ========================================

async function loadProfile(userId) {
    const { data, error } = await sb
        .from("profiles")
        .select(`
            user_id,
            full_name,
            email,
            avatar_url,
            selected_avatar,
            selected_avatar_type,
            selected_event_avatar_id,
            approved_projects,
            creator_level,
            creator_rank,
            creator_avatar,
            creator_avatar_unlocked
        `)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;

    if (!data) {
        throw new Error("Creator profile not found.");
    }

    console.log("Profile avatar data:", {
        selected_avatar_type: data.selected_avatar_type,
        selected_avatar: data.selected_avatar,
        creator_avatar: data.creator_avatar,
        creator_avatar_unlocked: data.creator_avatar_unlocked,
        selected_event_avatar_id: data.selected_event_avatar_id
    });

    return data;
}

// ========================================
// AVATAR URL VALIDATION
// ========================================

function isSafeAvatarUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
        return false;
    }

    try {
        const url = new URL(value, window.location.href);

        return (
            url.protocol === "https:" ||
            url.origin === window.location.origin
        );
    } catch {
        return false;
    }
}

// ========================================
// GET SELECTED AVATAR
// ========================================

function getAvatar(profile) {
    if (!profile) return DEFAULT_AVATAR;

    const type = String(
        profile.selected_avatar_type || ""
    ).trim().toLowerCase();

    // FREQUENCY AVATAR: IDs 1–48
    if (type === "frequency") {
        const id = Number(profile.selected_avatar);

        if (Number.isInteger(id) && id >= 1 && id <= 48) {
            return `assets/avatars/avatar${id}.png`;
        }

        return DEFAULT_AVATAR;
    }

    // CREATOR AVATAR: IDs 1–7
    if (type === "creator") {
        const id = Number(profile.creator_avatar);

        if (
            profile.creator_avatar_unlocked === true &&
            Number.isInteger(id) &&
            id >= 1 &&
            id <= 7
        ) {
            return `assets/creator-avatars/creator${id}.png`;
        }

        return DEFAULT_AVATAR;
    }

    // EVENT AVATAR
    if (type === "event") {
        if (isSafeAvatarUrl(profile.avatar_url)) {
            return profile.avatar_url.trim();
        }

        const eventId = String(
            profile.selected_event_avatar_id || ""
        );

        return EVENT_AVATARS[eventId] || DEFAULT_AVATAR;
    }

    // OLD PROFILE COMPATIBILITY
    if (!type) {
        const creatorId = Number(profile.creator_avatar);

        if (
            profile.creator_avatar_unlocked === true &&
            Number.isInteger(creatorId) &&
            creatorId >= 1 &&
            creatorId <= 7
        ) {
            return `assets/creator-avatars/creator${creatorId}.png`;
        }

        const frequencyId = Number(profile.selected_avatar);

        if (
            Number.isInteger(frequencyId) &&
            frequencyId >= 1 &&
            frequencyId <= 48
        ) {
            return `assets/avatars/avatar${frequencyId}.png`;
        }

        if (isSafeAvatarUrl(profile.avatar_url)) {
            return profile.avatar_url.trim();
        }
    }

    return DEFAULT_AVATAR;
}

// ========================================
// DISPLAY AVATAR IMAGE
// ========================================

function setAvatarImage(element, imageUrl) {
    if (!element) return;

    element.onerror = function () {
        this.onerror = null;
        this.src = DEFAULT_AVATAR;
    };

    element.src = imageUrl || DEFAULT_AVATAR;
}

// ========================================
// DISPLAY CREATOR PROFILE
// ========================================

function renderProfile(profile) {
    const name = profile.full_name || profile.email || "Creator";
    const rank = profile.creator_rank || "New Creator";
    const level = Number(profile.creator_level) || 1;

    const avatarUrl = getAvatar(profile);

    if (headerName) {
        headerName.textContent = name;
    }

    if (welcomeName) {
        welcomeName.textContent = name;
    }

    if (creatorRank) {
        creatorRank.textContent = rank;
    }

    if (creatorLevel) {
        creatorLevel.textContent = `LEVEL ${level}`;
    }

    if (creatorProfileName) {
        creatorProfileName.textContent = name;
    }

    if (creatorProfileRank) {
        creatorProfileRank.textContent =
            `${rank} • Level ${level}`;
    }

    // Both avatar displays use the same selected avatar.
    setAvatarImage(headerAvatar, avatarUrl);
    setAvatarImage(creatorAvatar, avatarUrl);

    console.log("Selected dashboard avatar:", avatarUrl);

    return {
        level: level,
        approved: Number(profile.approved_projects) || 0
    };
}

// ========================================
// LOAD PROJECT STATISTICS
// ========================================

async function loadProjectStats(userId) {
    const { data, error } = await sb
        .from("projects")
        .select("id, status")
        .eq("user_id", userId);

    if (error) throw error;

    const projects = data || [];

    const total = projects.length;

    const approved = projects.filter(project =>
        String(project.status || "").toLowerCase() === "approved"
    ).length;

    const pending = projects.filter(project =>
        String(project.status || "").toLowerCase() === "pending"
    ).length;

    if (totalProjects) {
        totalProjects.textContent = total;
    }

    if (approvedCount) {
        approvedCount.textContent = approved;
    }

    if (pendingCount) {
        pendingCount.textContent = pending;
    }

    return { total, approved, pending };
}

// ========================================
// CREATOR LEVEL PROGRESS
// ========================================

function updateLevelProgress(profileApproved, actualApproved) {
    const approved = Number(actualApproved ?? profileApproved) || 0;

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
        levelProgress.style.width = `${percentage}%`;
    }

    const remaining = Math.max(0, target - approved);

    if (nextLevelText) {
        nextLevelText.textContent = remaining === 0
            ? "Next creator level unlocked!"
            : `${remaining} approved project(s) needed for the next level.`;
    }
}

// ========================================
// NOTIFICATION BADGE
// ========================================

async function loadNotificationBadge() {
    if (!notificationBadge) return;

    try {
        const user = await getCurrentUser();

        if (!user) {
            notificationBadge.style.display = "none";
            return;
        }

        const { count, error } = await sb
            .from("notifications")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq("user_id", user.id)
            .eq("is_read", false);

        if (error) throw error;

        const unread = count || 0;

        notificationBadge.textContent =
            unread > 99 ? "99+" : String(unread);

        notificationBadge.style.display =
            unread > 0 ? "inline-block" : "none";

    } catch (error) {
        console.error("Notification error:", error);
    }
}

// ========================================
// LOGOUT
// ========================================

async function logout() {
    try {
        checkSupabase();

        const { error } = await sb.auth.signOut();

        if (error) throw error;

        window.location.href = "login.html";

    } catch (error) {
        console.error("Logout error:", error);
        showError("Unable to logout. Please try again.");
    }
}

window.logout = logout;

// ========================================
// LOAD DASHBOARD
// ========================================

async function loadDashboard({ quiet = false } = {}) {
    if (loadingDashboard) return;

    loadingDashboard = true;

    if (!quiet) showLoading();

    try {
        checkSupabase();

        const user = await getCurrentUser();

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        currentUserId = user.id;

        const profile = await loadProfile(user.id);
        const profileData = renderProfile(profile);

        const stats = await loadProjectStats(user.id);

        updateLevelProgress(
            profileData.approved,
            stats.approved
        );

        showDashboard();

        console.log("Dashboard loaded successfully.");

    } catch (error) {
        console.error("Dashboard load failed:", error);

        if (!quiet) {
            showError(error.message || "Unable to load dashboard.");
        }
    } finally {
        loadingDashboard = false;
    }
}

// ========================================
// INITIALIZE AND REFRESH
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    loadNotificationBadge();
});

window.addEventListener("pageshow", () => {
    if (
        document.readyState === "complete" &&
        currentUserId
    ) {
        loadDashboard({ quiet: true });
    }
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden && currentUserId) {
        loadDashboard({ quiet: true });
    }
});
