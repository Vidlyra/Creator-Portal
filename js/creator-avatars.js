
console.log("Vidlyra Creator Avatars loaded");

// ========================================
// CONFIGURATION
// ========================================

const CREATOR_AVATAR_PATH = "assets/creator-avatars/creator";
const TOTAL_CREATOR_AVATARS = 7;

let currentUser = null;
let currentProfile = null;
let selectedCreatorAvatar = null;

// ========================================
// DOM ELEMENTS
// ========================================

const loading = document.getElementById("loading");
const avatarContent = document.getElementById("avatarContent");
const currentLevelElement = document.getElementById("currentLevel");
const avatarGrid = document.getElementById("avatarGrid");
const message = document.getElementById("message");
const saveButton = document.getElementById("saveButton");

// ========================================
// MESSAGES
// ========================================

function showMessage(text, type = "info") {
    if (!message) return;

    message.textContent = text;
    message.style.display = "block";
    message.style.color =
        type === "error" ? "#ff5555" :
        type === "success" ? "#35c979" : "#ff9b42";
}

// ========================================
// LOAD CURRENT USER
// ========================================

async function loadCreatorProfile() {
    try {
        if (typeof sb === "undefined" || !sb) {
            throw new Error("Supabase client not found. Check config.js.");
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
        if (!profile) throw new Error("Creator profile not found.");

        currentProfile = profile;

        const level = Number(profile.creator_level) || 1;

        if (currentLevelElement) {
            currentLevelElement.textContent =
                `Level ${level} • ${profile.creator_rank || "New Creator"}`;
        }

        selectedCreatorAvatar =
            Number(profile.creator_avatar) || null;

        renderCreatorAvatars(level);

        if (loading) loading.style.display = "none";
        if (avatarContent) avatarContent.style.display = "block";

    } catch (error) {
        console.error("Creator avatar load error:", error);
        showMessage(error.message || "Unable to load creator avatars.", "error");

        if (loading) loading.style.display = "none";
    }
}

// ========================================
// AVATAR UNLOCK RULES
// ========================================

// Adjust these level requirements to match your actual Vidlyra rules.
function getRequiredLevel(avatarId) {
    if (avatarId <= 2) return 1;
    if (avatarId <= 3) return 2;
    if (avatarId <= 4) return 3;
    if (avatarId <= 5) return 4;
    if (avatarId <= 6) return 5;
    return 6;
}

function isAvatarUnlocked(avatarId, creatorLevel) {
    return creatorLevel >= getRequiredLevel(avatarId);
}

// ========================================
// RENDER AVATAR GRID
// ========================================

function renderCreatorAvatars(creatorLevel) {
    if (!avatarGrid) {
        console.error("Missing #avatarGrid element.");
        return;
    }

    avatarGrid.innerHTML = "";

    for (let id = 1; id <= TOTAL_CREATOR_AVATARS; id++) {
        const unlocked = isAvatarUnlocked(id, creatorLevel);

        const card = document.createElement("button");
        card.type = "button";
        card.className = "creator-avatar-card";

        card.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 12px;
            border: 2px solid ${
                selectedCreatorAvatar === id ? "#ff8c32" : "#444"
            };
            border-radius: 12px;
            background: #171717;
            color: white;
            cursor: ${unlocked ? "pointer" : "not-allowed"};
            opacity: ${unlocked ? "1" : "0.55"};
        `;

        const img = document.createElement("img");
        img.src = `${CREATOR_AVATAR_PATH}${id}.png`;
        img.alt = `Creator Avatar ${id}`;
        img.loading = "lazy";
        img.style.cssText = `
            width: 100px;
            height: 100px;
            object-fit: contain;
        `;

        img.onerror = () => {
            img.alt = `Creator Avatar ${id} image missing`;
            img.style.display = "none";
        };

        const title = document.createElement("span");
        title.textContent = `Creator ${id}`;

        const status = document.createElement("small");
        status.textContent = unlocked
            ? (selectedCreatorAvatar === id ? "Selected" : "Unlocked")
            : `Unlock at Level ${getRequiredLevel(id)}`;

        card.append(img, title, status);
        card.disabled = !unlocked;

        card.addEventListener("click", () => {
            if (!unlocked) {
                showMessage(
                    `Reach Level ${getRequiredLevel(id)} to unlock Creator ${id}.`,
                    "error"
                );
                return;
            }

            selectedCreatorAvatar = id;
            renderCreatorAvatars(creatorLevel);
            showMessage(`Creator ${id} selected. Click Save to apply it.`);
        });

        avatarGrid.appendChild(card);
    }

    if (saveButton) {
        saveButton.disabled = !selectedCreatorAvatar;
    }
}

// ========================================
// SAVE SELECTED CREATOR AVATAR
// ========================================

async function saveCreatorAvatar() {
    if (!currentUser || !currentProfile) {
        showMessage("Please sign in again.", "error");
        return;
    }

    if (!selectedCreatorAvatar) {
        showMessage("Select an unlocked avatar first.", "error");
        return;
    }

    const level = Number(currentProfile.creator_level) || 1;

    if (!isAvatarUnlocked(selectedCreatorAvatar, level)) {
        showMessage("This avatar is not unlocked for your level.", "error");
        return;
    }

    try {
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = "Saving...";
        }

        const { data, error } = await sb
            .from("profiles")
            .update({
                creator_avatar: selectedCreatorAvatar,
                selected_avatar_type: "creator"
            })
            .eq("user_id", currentUser.id)
            .select("creator_avatar, selected_avatar_type")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            throw new Error(
                "No profile was updated. Check your Supabase RLS policies."
            );
        }

        currentProfile.creator_avatar = data.creator_avatar;
        currentProfile.selected_avatar_type = data.selected_avatar_type;

        showMessage(
            "Creator Avatar saved! Return to your dashboard to see it.",
            "success"
        );

    } catch (error) {
        console.error("Save creator avatar error:", error);
        showMessage(error.message || "Failed to save avatar.", "error");
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Save Avatar";
        }
    }
}

window.saveCreatorAvatar = saveCreatorAvatar;

// ========================================
// INITIALIZE
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    if (saveButton) {
        saveButton.addEventListener("click", saveCreatorAvatar);
    }

    loadCreatorProfile();
});
