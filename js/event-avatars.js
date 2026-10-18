
console.log("Vidlyra Event Avatar System loaded");

// ==========================================
// VIDLYRA EVENT AVATARS
// Supabase tables:
// event_avatars
// user_event_avatars
// profiles
// ==========================================

let eventUser = null;
let eventProfile = null;
let eventAvatarRows = [];
let claimedEventAvatarIds = new Set();
let busyAvatarIds = new Set();

const eventLoading = document.getElementById("loading");
const eventContent = document.getElementById("eventAvatarContent");
const eventGrid = document.getElementById("eventAvatarGrid");
const eventMessage = document.getElementById("message");

// ==========================================
// MESSAGE
// ==========================================

function showEventMessage(text, type = "info") {
    if (!eventMessage) return;

    eventMessage.textContent = text;
    eventMessage.style.display = "block";
    eventMessage.style.color =
        type === "success" ? "#35c979" :
        type === "error" ? "#ff5555" : "#ff9b42";
}

// ==========================================
// CLAIM WINDOW
// ==========================================

function getEventStatus(event) {
    if (event.is_active !== true) {
        return {
            available: false,
            label: "Event Inactive"
        };
    }

    const now = Date.now();

    if (event.claim_start) {
        const start = new Date(event.claim_start).getTime();

        if (!Number.isFinite(start) || now < start) {
            return {
                available: false,
                label: "Coming Soon"
            };
        }
    }

    if (event.claim_end) {
        const end = new Date(event.claim_end).getTime();

        if (!Number.isFinite(end) || now > end) {
            return {
                available: false,
                label: "Claim Ended"
            };
        }
    }

    return {
        available: true,
        label: "Available"
    };
}

// ==========================================
// LOAD USER AND EVENT AVATARS
// ==========================================

async function loadEventAvatars() {
    try {
        if (typeof sb === "undefined" || !sb) {
            throw new Error("Supabase client is missing. Check js/config.js.");
        }

        const { data: authData, error: authError } =
            await sb.auth.getUser();

        if (authError) throw authError;

        eventUser = authData.user;

        if (!eventUser) {
            window.location.href = "login.html";
            return;
        }

        const { data: profile, error: profileError } = await sb
            .from("profiles")
            .select(`
                user_id,
                full_name,
                avatar_url,
                selected_avatar_type,
                selected_event_avatar_id
            `)
            .eq("user_id", eventUser.id)
            .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) throw new Error("Creator profile not found.");

        eventProfile = profile;

        const { data: events, error: eventsError } = await sb
            .from("event_avatars")
            .select(`
                id,
                event_name,
                avatar_name,
                image_url,
                claim_start,
                claim_end,
                is_active
            `)
            .order("created_at", { ascending: false });

        if (eventsError) throw eventsError;

        eventAvatarRows = events || [];

        const { data: claims, error: claimsError } = await sb
            .from("user_event_avatars")
            .select("event_avatar_id")
            .eq("user_id", eventUser.id);

        if (claimsError) throw claimsError;

        claimedEventAvatarIds = new Set(
            (claims || []).map(row => String(row.event_avatar_id))
        );

        renderEventAvatars();

        if (eventLoading) eventLoading.style.display = "none";
        if (eventContent) eventContent.style.display = "block";

        if (eventAvatarRows.length === 0) {
            showEventMessage("No event avatars have been published yet.");
        }

    } catch (error) {
        console.error("Loading event avatars failed:", error);

        if (eventLoading) {
            eventLoading.textContent =
                error.message || "Unable to load event avatars.";
        }

        showEventMessage(
            error.message || "Could not load event avatars.",
            "error"
        );
    }
}

// ==========================================
// RENDER EVENT AVATAR CARDS
// ==========================================

function renderEventAvatars() {
    if (!eventGrid) {
        console.error("Missing #eventAvatarGrid element.");
        return;
    }

    eventGrid.innerHTML = "";

    for (const event of eventAvatarRows) {
        const id = String(event.id);
        const status = getEventStatus(event);
        const claimed = claimedEventAvatarIds.has(id);

        const isSelected =
            eventProfile?.selected_avatar_type === "event" &&
            String(eventProfile?.selected_event_avatar_id) === id;

        const card = document.createElement("article");
        card.className = "avatar-card";

        if (isSelected) card.classList.add("selected");

        const image = document.createElement("img");
        image.className = "avatar-image";
        image.src = event.image_url || "";
        image.alt = event.avatar_name || "Event Avatar";
        image.loading = "lazy";

        image.onerror = function () {
            this.alt = "Event avatar image unavailable";
            this.style.opacity = "0.4";
        };

        const name = document.createElement("div");
        name.className = "avatar-name";
        name.textContent = event.avatar_name || "Event Avatar";

        const eventName = document.createElement("div");
        eventName.className = "required-level";
        eventName.textContent = event.event_name || "Vidlyra Event";

        const statusLabel = document.createElement("div");
        statusLabel.className = "required-level";

        if (isSelected) {
            statusLabel.textContent = "Currently Selected";
        } else if (claimed) {
            statusLabel.textContent = "Claimed";
        } else {
            statusLabel.textContent = status.label;
        }

        const action = document.createElement("button");
        action.type = "button";
        action.className = "save-btn";
        action.style.margin = "12px auto 0";
        action.style.padding = "10px";
        action.style.fontSize = "13px";

        if (isSelected) {
            action.textContent = "Selected";
            action.disabled = true;
        } else if (claimed) {
            action.textContent = "Use Avatar";
            action.addEventListener("click", () => useEventAvatar(event));
        } else if (status.available) {
            action.textContent = "Claim Avatar";
            action.addEventListener("click", () => claimEventAvatar(event));
        } else {
            action.textContent = status.label;
            action.disabled = true;
        }

        card.append(
            image,
            name,
            eventName,
            statusLabel,
            action
        );

        eventGrid.appendChild(card);
    }
}

// ==========================================
// CLAIM EVENT AVATAR
// ==========================================

async function claimEventAvatar(event) {
    const id = String(event.id);

    if (busyAvatarIds.has(id)) return;

    if (claimedEventAvatarIds.has(id)) {
        showEventMessage("You already claimed this avatar.");
        return;
    }

    const status = getEventStatus(event);

    if (!status.available) {
        showEventMessage(
            `This avatar cannot be claimed: ${status.label}.`,
            "error"
        );
        return;
    }

    busyAvatarIds.add(id);

    try {
        const { data: claim, error: claimError } = await sb
            .from("user_event_avatars")
            .insert({
                user_id: eventUser.id,
                event_avatar_id: event.id
            })
            .select("id, event_avatar_id")
            .single();

        if (claimError) {
            if (
                claimError.code === "23505" ||
                /duplicate|unique/i.test(claimError.message || "")
            ) {
                claimedEventAvatarIds.add(id);
                renderEventAvatars();
                showEventMessage("This avatar has already been claimed.");
                return;
            }

            throw claimError;
        }

        if (!claim) {
            throw new Error("Claim could not be confirmed.");
        }

        claimedEventAvatarIds.add(id);

        showEventMessage(
            `${event.avatar_name || "Event Avatar"} claimed successfully!`,
            "success"
        );

        renderEventAvatars();

    } catch (error) {
        console.error("Claim event avatar failed:", error);

        showEventMessage(
            error.message || "Unable to claim this avatar.",
            "error"
        );
    } finally {
        busyAvatarIds.delete(id);
    }
}

// ==========================================
// SELECT A CLAIMED EVENT AVATAR
// ==========================================

async function useEventAvatar(event) {
    const id = String(event.id);

    if (!claimedEventAvatarIds.has(id)) {
        showEventMessage("Claim this event avatar before using it.", "error");
        return;
    }

    if (!getEventStatus(event).available) {
        showEventMessage(
            "This event is no longer active. Check the event rules.",
            "error"
        );
        return;
    }

    if (busyAvatarIds.has(id)) return;
    busyAvatarIds.add(id);

    try {
        const { data, error } = await sb
            .from("profiles")
            .update({
                selected_avatar_type: "event",
                selected_event_avatar_id: event.id,
                avatar_url: event.image_url
            })
            .eq("user_id", eventUser.id)
            .select(`
                user_id,
                selected_avatar_type,
                selected_event_avatar_id,
                avatar_url
            `)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            throw new Error(
                "Profile was not updated. Check your Supabase RLS policy."
            );
        }

        eventProfile = {
            ...eventProfile,
            ...data
        };

        showEventMessage(
            "Event Avatar selected! Return to your dashboard.",
            "success"
        );

        renderEventAvatars();

    } catch (error) {
        console.error("Selecting event avatar failed:", error);

        showEventMessage(
            error.message || "Unable to select this avatar.",
            "error"
        );
    } finally {
        busyAvatarIds.delete(id);
    }
}

// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener("DOMContentLoaded", loadEventAvatars);
