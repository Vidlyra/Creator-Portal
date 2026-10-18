
console.log("Vidlyra Creator Avatar System loaded");

// ==========================================
// CONFIGURATION
// ==========================================

const AVATAR_COUNT = 7;
const AVATAR_PATH = "assets/creator-avatars/creator";

let currentUser = null;
let currentProfile = null;
let selectedCreatorAvatar = null;
let savingAvatar = false;

// ==========================================
// HTML ELEMENTS
// ==========================================

const loading = document.getElementById("loading");
const avatarContent = document.getElementById("avatarContent");
const currentLevelElement = document.getElementById("currentLevel");
const avatarGrid = document.getElementById("avatarGrid");
const messageElement = document.getElementById("message");
const saveButton = document.getElementById("saveButton");

// ==========================================
// MESSAGE
// ==========================================

function showMessage(text, type = "info") {
    if (!messageElement) return;

    messageElement.textContent = text;

    messageElement.style.color =
        type === "success" ? "#35c979" :
        type === "error" ? "#ff5555" : "#ff9b42";
}

// ==========================================
// AVATAR LEVEL REQUIREMENTS
// Change these to your actual Vidlyra rules
// ==========================================

function getRequiredLevel(avatarId) {
    if (avatarId <= 2) return 1;
    if (avatarId === 3) return 2;
    if (avatarId === 4) return 3;
    if (avatarId === 5) return 4;
    if (avatarId === 6) return 5;
    return 6;
}

function isUnlocked(avatarId, level) {
    return Number(level) >= getRequiredLevel(avatarId);
}

// ==========================================
// LOAD PROFILE
// ==========================================

async function loadCreatorAvatars() {
    try {
        if (typeof sb === "undefined" || !sb) {
            throw new Error(
                "Supabase client missing. Check js/config.js."
            );
        }

        const { data: authData, error: authError } =
            await sb.auth.getUser();

        if (authError) throw authError;

        currentUser = authData.user;

        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }

        const { data: profile, error } = await sb
            .from("profiles")
            .select(`
                user_id,
                full_name,
                creator_level,
                creator_rank,
                creator_avatar,
                creator_avatar_unlocked,
                selected_avatar_type
            `)
            .eq("user_id", currentUser.id)
            .maybeSingle();

        if (error) throw error;

        if (!profile) {
            throw new Error("Your creator profile was not found.");
        }

        currentProfile = profile;

        const level = Number(profile.creator_level) || 1;

        // Display current level
        if (currentLevelElement) {
            currentLevelElement.textContent =
                `Level ${level} • ${profile.creator_rank || "Creator"}`;
        }

        // Preserve the saved avatar selection
        selectedCreatorAvatar =
            Number(profile.creator_avatar) || null;

        renderAvatarGrid(level);

        if (loading) loading.style.display = "none";
        if (avatarContent) avatarContent.style.display = "block";

    } catch (error) {
        console.error("Creator avatar loading failed:", error);

        if (loading) {
            loading.textContent =
                error.message || "Failed to load creator avatars.";
        }

        showMessage(
            error.message || "Unable to load avatars.",
            "error"
        );
    }
}

// ==========================================
// RENDER AVATAR CARDS
// ==========================================

function renderAvatarGrid(level) {
    if (!avatarGrid) return;

    avatarGrid.innerHTML = "";

    for (let id = 1; id <= AVATAR_COUNT; id++) {
        const unlocked = isUnlocked(id, level);

        const card = document.createElement("div");
        card.className = "avatar-card";

        if (!unlocked) card.classList.add("locked");

        if (selectedCreatorAvatar === id) {
            card.classList.add("selected");
        }

        card.setAttribute("role", "button");
        card.setAttribute("tabindex", unlocked ? "0" : "-1");

        const image = document.createElement("img");
        image.className = "avatar-image";
        image.src = `${AVATAR_PATH}${id}.png`;
        image.alt = `Creator Avatar ${id}`;

        image.onerror = function () {
            this.onerror = null;
            this.alt = `Image missing: creator${id}.png`;
            this.style.opacity = "0.4";
        };

        const name = document.createElement("div");
        name.className = "avatar-name";
        name.textContent = `Creator ${id}`;

        const required = document.createElement("div");
        required.className = "required-level";
        required.textContent = unlocked
            ? (selectedCreatorAvatar === id ? "Selected" : "Unlocked")
            : `Requires Level ${getRequiredLevel(id)}`;

        card.appendChild(image);
        card.appendChild(name);
        card.appendChild(required);

        if (!unlocked) {
            const lock = document.createElement("div");
            lock.className = "lock-label";
            lock.textContent = "LOCKED";
            card.appendChild(lock);
        } else {
            const selectAvatar = () => {
                selectedCreatorAvatar = id;

                renderAvatarGrid(level);

                if (saveButton) saveButton.disabled = false;

                showMessage(
                    `Creator ${id} selected. Click Save Creator Avatar.`,
                    "info"
                );
            };

            card.addEventListener("click", selectAvatar);

            card.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectAvatar();
                }
            });
        }

        avatarGrid.appendChild(card);
    }

    if (saveButton) {
        saveButton.disabled = !selectedCreatorAvatar;
    }
}

// ==========================================
// SAVE AVATAR TO SUPABASE
// ==========================================

async function saveCreatorAvatar() {
    if (savingAvatar) return;

    if (!currentUser || !currentProfile) {
        showMessage("Please sign in again.", "error");
        return;
    }

    if (!selectedCreatorAvatar) {
        showMessage("Please select an unlocked avatar first.", "error");
        return;
    }

    const level = Number(currentProfile.creator_level) || 1;

    if (!isUnlocked(selectedCreatorAvatar, level)) {
        showMessage("This avatar is locked for your current level.", "error");
        return;
    }

    savingAvatar = true;

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    try {
        const { data, error } = await sb
            .from("profiles")
            .update({
                creator_avatar: selectedCreatorAvatar,
                selected_avatar_type: "creator"
            })
            .eq("user_id", currentUser.id)
            .select(`
                creator_avatar,
                selected_avatar_type,
                creator_avatar_unlocked
            `)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            throw new Error(
                "No profile updated. Check your Supabase RLS update policy."
            );
        }

        currentProfile.creator_avatar = data.creator_avatar;
        currentProfile.selected_avatar_type = data.selected_avatar_type;
        currentProfile.creator_avatar_unlocked =
            data.creator_avatar_unlocked;

        showMessage(
            "Creator Avatar saved. Open your dashboard to check it.",
            "success"
        );

        renderAvatarGrid(level);

    } catch (error) {
        console.error("Creator avatar save failed:", error);

        showMessage(
            error.message || "Failed to save avatar.",
            "error"
        );
    } finally {
        savingAvatar = false;

        if (saveButton) {
            saveButton.disabled = !selectedCreatorAvatar;
            saveButton.textContent = "Save Creator Avatar";
        }
    }
}

// Required by the HTML onclick="saveCreatorAvatar()"
window.saveCreatorAvatar = saveCreatorAvatar;

// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadCreatorAvatars();
});
