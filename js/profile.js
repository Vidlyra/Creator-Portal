
console.log("Vidlyra Creator Profile loaded");

const profileHero = document.getElementById("profileHero");
const projectsContainer = document.getElementById("projects");

const params = new URLSearchParams(window.location.search);
let creatorId = params.get("user") || params.get("user_id");

const EVENT_AVATARS = {
    "ff434e87-c105-451a-9d5c-dd5374bc7cb0":
        "https://raw.githubusercontent.com/Vidlyra/Creator-Portal/main/assets/event-avatars/Vidlyra_EventAvatar_HalloweenFest2026_LimitedEdition.png"
};

// ------------------------------------------
// GET CREATOR ID
// ------------------------------------------

async function getCreatorId() {
    if (creatorId) return creatorId;

    try {
        const { data, error } = await sb.auth.getUser();
        if (error) throw error;
        return data?.user?.id || null;
    } catch (error) {
        console.error("Authentication error:", error);
        return null;
    }
}

// ------------------------------------------
// LOAD PROFILE
// ------------------------------------------

async function loadProfile() {
    creatorId = await getCreatorId();

    if (!creatorId) {
        showError("Unable to identify this creator. Please login first.");
        return;
    }

    try {
        const { data: creator, error } = await sb
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
            .eq("user_id", creatorId)
            .maybeSingle();

        if (error) throw error;

        if (!creator) {
            showError("Creator profile does not exist.");
            return;
        }

        await renderCreator(creator);
        await loadProjects(creatorId);

    } catch (error) {
        console.error("Profile loading error:", error);
        showError(error.message || "Unable to load creator profile.");
    }
}

// ------------------------------------------
// RENDER CREATOR DETAILS AND AVATAR
// ------------------------------------------

async function renderCreator(creator) {
    if (!profileHero) {
        console.error("profileHero element not found.");
        return;
    }

    const name = profileHero.querySelector(".creator-name");
    if (name) {
        name.textContent = creator.full_name || "Vidlyra Creator";
    }

    const rank = profileHero.querySelector(".rank");
    if (rank) {
        rank.textContent = creator.creator_rank || "New Creator";
    }

    const stats = profileHero.querySelectorAll(".stat strong");

    if (stats[0]) {
        stats[0].textContent = Number(creator.approved_projects) || 0;
    }

    if (stats[1]) {
        stats[1].textContent = Number(creator.creator_level) || 1;
    }

    const level = profileHero.querySelector(".level");

    if (level) {
        level.textContent =
            `Level ${Number(creator.creator_level) || 1} • ` +
            `${creator.creator_rank || "New Creator"}`;
    }

    const avatarURL = getOfficialAvatar(creator);

    console.log("Selected avatar type:", creator.selected_avatar_type);
    console.log("Selected avatar URL:", avatarURL);

    const placeholder =
        profileHero.querySelector(".avatar-placeholder");

    const existingAvatar =
        profileHero.querySelector("img.avatar");

    if (!avatarURL) {
        if (existingAvatar) existingAvatar.remove();
        if (placeholder) placeholder.style.display = "flex";
        return;
    }

    const image = document.createElement("img");

    image.className = "avatar";
    image.src = avatarURL;
    image.alt = `${creator.full_name || "Creator"} profile avatar`;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";

    image.onerror = () => {
        console.error("Avatar failed to load:", image.src);
        image.remove();

        if (placeholder) {
            placeholder.style.display = "flex";
        }
    };

    if (existingAvatar) {
        existingAvatar.replaceWith(image);
    } else if (placeholder) {
        placeholder.replaceWith(image);
    } else {
        profileHero.appendChild(image);
    }
}

// ------------------------------------------
// UNIFIED AVATAR DISPLAY
// ------------------------------------------

function getOfficialAvatar(profile) {
    if (!profile) return "";

    const type = String(
        profile.selected_avatar_type || ""
    ).toLowerCase();

    // 1. FREQUENCY AVATARS: Basic, Premium and VIP (IDs 1–48)
    if (type === "frequency") {
        const id = Number(profile.selected_avatar);

        if (Number.isInteger(id) && id >= 1 && id <= 48) {
            return `assets/avatars/avatar${id}.png`;
        }

        return "";
    }

    // 2. CREATOR AVATARS: IDs 1–7
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

        return "";
    }

    // 3. EVENT AVATARS: Must have a saved event avatar ID
    if (type === "event") {
        const eventId = String(
            profile.selected_event_avatar_id || ""
        );

        if (!eventId) return "";

        // Prefer the saved URL from the verified avatar selection.
        if (isSafeImageURL(profile.avatar_url)) {
            return profile.avatar_url;
        }

        // Fallback for the registered Halloween Fest avatar.
        return EVENT_AVATARS[eventId] || "";
    }

    // BACKWARD COMPATIBILITY:
    // Profiles saved before selected_avatar_type was introduced.
    if (!type) {
        const creatorID = Number(profile.creator_avatar);

        if (
            profile.creator_avatar_unlocked === true &&
            Number.isInteger(creatorID) &&
            creatorID >= 1 &&
            creatorID <= 7
        ) {
            return `assets/creator-avatars/creator${creatorID}.png`;
        }

        const frequencyID = Number(profile.selected_avatar);

        if (
            Number.isInteger(frequencyID) &&
            frequencyID >= 1 &&
            frequencyID <= 48
        ) {
            return `assets/avatars/avatar${frequencyID}.png`;
        }

        if (isSafeImageURL(profile.avatar_url)) {
            return profile.avatar_url;
        }
    }

    return "";
}

// ------------------------------------------
// IMAGE URL VALIDATION
// ------------------------------------------

function isSafeImageURL(value) {
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

// ------------------------------------------
// LOAD APPROVED PROJECTS
// ------------------------------------------

async function loadProjects(userId) {
    if (!projectsContainer) {
        console.error("Projects container not found.");
        return;
    }

    projectsContainer.innerHTML =
        '<div class="loading">Loading approved projects...</div>';

    try {
        const { data: projects, error } = await sb
            .from("projects")
            .select(`
                id,
                user_id,
                title,
                description,
                category,
                thumbnail,
                status,
                created_at,
                file_path
            `)
            .eq("user_id", userId)
            .eq("status", "Approved")
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!projects || projects.length === 0) {
            projectsContainer.innerHTML =
                '<div class="empty">This creator has no approved projects yet.</div>';
            return;
        }

        projectsContainer.replaceChildren();

        projects.forEach(project => {
            renderProject(project);
        });

    } catch (error) {
        console.error("Projects loading error:", error);

        projectsContainer.replaceChildren();

        const message = document.createElement("div");
        message.className = "error";
        message.textContent =
            error.message || "Unable to load projects.";

        projectsContainer.appendChild(message);
    }
}

// ------------------------------------------
// RENDER PROJECT CARD
// ------------------------------------------

function renderProject(project) {
    const card = document.createElement("article");
    card.className = "project-card";

    const thumbnailURL = getThumbnailURL(project.thumbnail);

    if (thumbnailURL) {
        const image = document.createElement("img");

        image.className = "project-image";
        image.src = thumbnailURL;
        image.alt = project.title || "Project";
        image.loading = "lazy";

        image.onerror = () => {
            if (
                !image.dataset.fallbackUsed &&
                project.thumbnail &&
                !/^https?:\/\//i.test(project.thumbnail) &&
                !project.thumbnail.startsWith("assets/")
            ) {
                image.dataset.fallbackUsed = "true";

                const { data } = sb.storage
                    .from("projects")
                    .getPublicUrl(project.thumbnail);

                if (data?.publicUrl) {
                    image.src = data.publicUrl;
                    return;
                }
            }

            const fallback = document.createElement("div");
            fallback.className = "project-image placeholder";
            fallback.textContent = "Thumbnail unavailable";

            image.replaceWith(fallback);
        };

        card.appendChild(image);
    } else {
        const fallback = document.createElement("div");

        fallback.className = "project-image placeholder";
        fallback.textContent = "No Thumbnail";

        card.appendChild(fallback);
    }

    const content = document.createElement("div");
    content.className = "project-content";

    const title = document.createElement("h3");
    title.className = "project-title";
    title.textContent = project.title || "Untitled Project";

    const category = document.createElement("div");
    category.className = "project-category";
    category.textContent = project.category || "Anime";

    const date = document.createElement("div");
    date.className = "project-date";
    date.textContent = formatDate(project.created_at);

    content.append(title, category, date);
    card.appendChild(content);

    projectsContainer.appendChild(card);
}

// ------------------------------------------
// GET THUMBNAIL URL
// ------------------------------------------

function getThumbnailURL(thumbnail) {
    if (!thumbnail || typeof thumbnail !== "string") {
        return "";
    }

    if (/^https?:\/\//i.test(thumbnail)) {
        return thumbnail;
    }

    if (thumbnail.startsWith("assets/")) {
        return thumbnail;
    }

    const { data } = sb.storage
        .from("thumbnails")
        .getPublicUrl(thumbnail);

    return data?.publicUrl || "";
}

// ------------------------------------------
// ERROR DISPLAY
// ------------------------------------------

function showError(message) {
    if (profileHero) {
        profileHero.replaceChildren();

        const error = document.createElement("div");
        error.className = "error";
        error.textContent = message;

        profileHero.appendChild(error);
    }

    if (projectsContainer) {
        projectsContainer.replaceChildren();
    }
}

// ------------------------------------------
// FORMAT DATE
// ------------------------------------------

function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// ------------------------------------------
// START
// ------------------------------------------

loadProfile();
