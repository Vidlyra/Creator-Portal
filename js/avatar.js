
console.log("Vidlyra Frequency Avatar JS loaded");

let currentUser = null;
let selectedAvatar = 1;

const avatars = {
    basic: [
        { id: 1, name: "Student" },
        { id: 2, name: "Cyber Hacker" },
        { id: 3, name: "Samurai" },
        { id: 4, name: "Mage" },
        { id: 5, name: "Music Producer" },
        { id: 6, name: "Idol" },
        { id: 7, name: "Creator" },
        { id: 8, name: "Explorer" },
        { id: 9, name: "Artist" },
        { id: 10, name: "Rider" },
        { id: 11, name: "Guardian" },
        { id: 12, name: "Dreamer" }
    ],
    premium: [
        { id: 13, name: "Shadow Hacker" },
        { id: 14, name: "Cyber Samurai" },
        { id: 15, name: "Storm Mage" },
        { id: 16, name: "Dark Creator" },
        { id: 17, name: "Pixel Master" },
        { id: 18, name: "Neon Rider" },
        { id: 19, name: "Code Warrior" },
        { id: 20, name: "Frequency Artist" },
        { id: 21, name: "Digital Mage" },
        { id: 22, name: "Sound Master" },
        { id: 23, name: "Anime Creator" },
        { id: 24, name: "Moon Samurai" },
        { id: 25, name: "Cyber Artist" },
        { id: 26, name: "Storm Rider" },
        { id: 27, name: "Dream Hacker" },
        { id: 28, name: "Galaxy Creator" },
        { id: 29, name: "Code Mage" },
        { id: 30, name: "Shadow Artist" },
        { id: 31, name: "Digital Samurai" },
        { id: 32, name: "Frequency Hacker" },
        { id: 33, name: "Creator X" },
        { id: 34, name: "Anime Rider" },
        { id: 35, name: "Cyber Guardian" },
        { id: 36, name: "Dark Mage" },
        { id: 37, name: "Music Warrior" },
        { id: 38, name: "Pixel Samurai" },
        { id: 39, name: "Storm Creator" },
        { id: 40, name: "Virtual Artist" },
        { id: 41, name: "Frequency Rider" },
        { id: 42, name: "Digital Guardian" }
    ],
    vip: [
        { id: 43, name: "Legendary Lyra" },
        { id: 44, name: "Frequency King" },
        { id: 45, name: "Frequency Queen" },
        { id: 46, name: "Void Guardian" },
        { id: 47, name: "Galaxy Warrior" },
        { id: 48, name: "Eternal Mage" }
    ]
};

// ------------------------------------------
// HELPERS
// ------------------------------------------

function getAvatarImage(id) {
    return `assets/avatars/avatar${id}.png`;
}

function showMessage(message, color = "#aaa") {
    const element = document.getElementById("message");

    if (element) {
        element.style.color = color;
        element.textContent = message;
    }
}

// ------------------------------------------
// CREATE AVATAR CARD
// ------------------------------------------

function createAvatarCard(avatar) {
    const card = document.createElement("div");

    card.className = "avatar-card";
    card.dataset.avatarId = String(avatar.id);

    if (Number(avatar.id) === selectedAvatar) {
        card.classList.add("selected");
    }

    const image = document.createElement("img");
    image.className = "avatar-image";
    image.src = getAvatarImage(avatar.id);
    image.alt = avatar.name;
    image.loading = "lazy";

    image.onerror = () => {
        image.style.opacity = "0.2";
    };

    const name = document.createElement("div");
    name.className = "avatar-name";
    name.textContent = avatar.name;

    const number = document.createElement("div");
    number.className = "avatar-number";
    number.textContent = `Avatar #${avatar.id}`;

    card.append(image, name, number);

    card.addEventListener("click", () => {
        selectAvatar(avatar.id);
    });

    return card;
}

// ------------------------------------------
// DISPLAY ALL AVATARS
// ------------------------------------------

function displayAvatars() {
    const basicGrid = document.getElementById("basicGrid");
    const premiumGrid = document.getElementById("premiumGrid");
    const vipGrid = document.getElementById("vipGrid");

    if (!basicGrid || !premiumGrid || !vipGrid) {
        console.error("One or more avatar grids were not found.");
        showMessage("Avatar display elements are missing.", "#ff5555");
        return;
    }

    basicGrid.replaceChildren();
    premiumGrid.replaceChildren();
    vipGrid.replaceChildren();

    avatars.basic.forEach(avatar =>
        basicGrid.appendChild(createAvatarCard(avatar))
    );

    avatars.premium.forEach(avatar =>
        premiumGrid.appendChild(createAvatarCard(avatar))
    );

    avatars.vip.forEach(avatar =>
        vipGrid.appendChild(createAvatarCard(avatar))
    );
}

// ------------------------------------------
// SELECT AVATAR
// ------------------------------------------

function selectAvatar(id) {
    const number = Number(id);

    if (!Number.isInteger(number) || number < 1 || number > 48) {
        showMessage("Invalid avatar selection.", "#ff5555");
        return;
    }

    selectedAvatar = number;

    document.querySelectorAll(".avatar-card").forEach(card => {
        card.classList.toggle(
            "selected",
            Number(card.dataset.avatarId) === selectedAvatar
        );
    });

    showMessage(`Avatar #${selectedAvatar} selected.`);
}

// ------------------------------------------
// LOAD LOGGED-IN USER AND SAVED AVATAR
// ------------------------------------------

async function loadAvatarSystem() {
    const loading = document.getElementById("loading");
    const content = document.getElementById("avatarContent");

    try {
        const { data, error } = await sb.auth.getUser();

        if (error) throw error;

        if (!data?.user) {
            window.location.href = "login.html";
            return;
        }

        currentUser = data.user;

        const { data: profile, error: profileError } = await sb
            .from("profiles")
            .select("selected_avatar, selected_avatar_type")
            .eq("user_id", currentUser.id)
            .maybeSingle();

        if (profileError) throw profileError;

        if (profile) {
            const saved = Number(profile.selected_avatar);

            if (Number.isInteger(saved) && saved >= 1 && saved <= 48) {
                selectedAvatar = saved;
            }
        }

        displayAvatars();

        if (loading) loading.style.display = "none";
        if (content) content.style.display = "block";

        showMessage(
            `Current selection: Frequency Avatar #${selectedAvatar}.`
        );

        console.log("Frequency avatar loaded:", selectedAvatar);

    } catch (error) {
        console.error("Frequency avatar loading error:", error);

        if (loading) {
            loading.textContent = "Unable to load Frequency Avatars.";
        }

        showMessage(
            error.message || "Something went wrong.",
            "#ff5555"
        );
    }
}

// ------------------------------------------
// SAVE FREQUENCY AVATAR
// ------------------------------------------

async function saveAvatar() {
    const button = document.getElementById("saveButton");

    if (!currentUser) {
        showMessage("Please login first.", "#ff5555");
        return;
    }

    if (
        !Number.isInteger(selectedAvatar) ||
        selectedAvatar < 1 ||
        selectedAvatar > 48
    ) {
        showMessage("Please select a valid avatar.", "#ff5555");
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
    }

    try {
        const { data, error } = await sb
            .from("profiles")
            .update({
                selected_avatar: selectedAvatar,
                selected_avatar_type: "frequency",
                selected_event_avatar_id: null
            })
            .eq("user_id", currentUser.id)
            .select("user_id, selected_avatar, selected_avatar_type")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            throw new Error(
                "No profile was updated. Check that your profile exists and your Supabase RLS policy allows this update."
            );
        }

        console.log("Frequency avatar saved:", data);

        showMessage(
            `Avatar #${selectedAvatar} saved successfully!`,
            "#55dd77"
        );

        // Keep the selected avatar type and number in sync.
        window.setTimeout(() => {
            window.location.href = "profile.html";
        }, 1000);

    } catch (error) {
        console.error("Frequency avatar save error:", error);

        showMessage(
            `Could not save avatar: ${error.message || "Unknown error"}`,
            "#ff5555"
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Save Selected Avatar";
        }
    }
}

// ------------------------------------------
// START
// ------------------------------------------

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        loadAvatarSystem,
        { once: true }
    );
} else {
    loadAvatarSystem();
}
