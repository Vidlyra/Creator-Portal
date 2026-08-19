/* =========================================================
   VIDLYRA ADMIN NOTIFICATIONS
   Uses existing Supabase client: sb
   ========================================================= */

"use strict";

console.log("Vidlyra Admin Notifications JS loaded");

let supabaseClient = null;
let currentAdmin = null;
let creators = [];


/* =========================================================
   DOM HELPERS
   ========================================================= */

function getEl(id) {
    return document.getElementById(id);
}

const elements = {
    creatorSelect: null,
    title: null,
    message: null,
    type: null,
    sendButton: null,
    status: null,
    creatorCount: null
};


/* =========================================================
   CACHE ELEMENTS
   ========================================================= */

function cacheElements() {

    elements.creatorSelect =
        getEl("creatorSelect");

    elements.title =
        getEl("notificationTitle");

    elements.message =
        getEl("notificationMessage");

    elements.type =
        getEl("notificationType");

    elements.sendButton =
        getEl("sendNotification") ||
        getEl("sendNotificationButton") ||
        getEl("sendButton");

    elements.status =
        getEl("notificationStatus");

    elements.creatorCount =
        getEl("creatorCount");

    console.log(
        "Admin notification elements:",
        elements
    );
}


/* =========================================================
   GET EXISTING SUPABASE CLIENT
   ========================================================= */

function getSupabase() {

    /*
     * Your config.js creates:
     *
     * const sb = window.supabase.createClient(...)
     */

    if (
        typeof sb !== "undefined" &&
        sb &&
        typeof sb.from === "function"
    ) {
        return sb;
    }

    console.error(
        "Supabase client `sb` not found."
    );

    return null;
}


/* =========================================================
   STATUS MESSAGE
   ========================================================= */

function setStatus(message, type = "info") {

    if (!elements.status) {
        console.log(`[${type}] ${message}`);
        return;
    }

    elements.status.textContent = message;

    elements.status.style.display = "block";

    elements.status.className =
        `notification-status ${type}`;
}


/* =========================================================
   VERIFY ADMIN
   ========================================================= */

async function verifyAdmin() {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        throw error;
    }

    const user = data?.user;

    if (!user) {
        throw new Error(
            "You are not logged in."
        );
    }

    currentAdmin = user;

    console.log(
        "Logged-in user:",
        user.id
    );

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select(
            "user_id, creator_role"
        )
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
            "Admin profile does not exist."
        );
    }

    const role =
        String(
            profile.creator_role || ""
        )
        .trim()
        .toLowerCase();

    if (role !== "admin") {
        throw new Error(
            "Access denied. Admin account required."
        );
    }

    console.log(
        "Admin verified:",
        user.id
    );

    return true;
}


/* =========================================================
   LOAD ALL CREATORS
   ========================================================= */

async function loadCreators() {

    if (!elements.creatorSelect) {
        throw new Error(
            "Creator select element not found."
        );
    }

    console.log(
        "Loading creators..."
    );

    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .select(
            "user_id, full_name, email, creator_role"
        )
        .eq(
            "creator_role",
            "creator"
        )
        .order(
            "full_name",
            {
                ascending: true
            }
        );

    if (error) {
        console.error(
            "Failed to load creators:",
            error
        );

        throw error;
    }

    console.log(
        "Profiles found:",
        data
    );

    /*
     * Remove admin and duplicate IDs.
     */

    const uniqueCreators = new Map();

    (data || []).forEach(
        creator => {

            if (
                creator.user_id &&
                creator.user_id !==
                currentAdmin?.id
            ) {

                uniqueCreators.set(
                    creator.user_id,
                    creator
                );
            }
        }
    );

    creators =
        Array.from(
            uniqueCreators.values()
        );

    console.log(
        `${creators.length} creator profiles loaded.`
    );

    renderCreatorSelect();
}


/* =========================================================
   RENDER CREATOR DROPDOWN
   ========================================================= */

function renderCreatorSelect() {

    const select =
        elements.creatorSelect;

    if (!select) {
        return;
    }

    select.innerHTML = "";

    /*
     * Default
     */

    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";

    defaultOption.textContent =
        "Select recipient";

    select.appendChild(
        defaultOption
    );


    /*
     * ALL CREATORS
     */

    const allOption =
        document.createElement("option");

    allOption.value =
        "ALL_CREATORS";

    allOption.textContent =
        "📢 All Creators";

    select.appendChild(
        allOption
    );


    /*
     * Separator
     */

    if (creators.length > 0) {

        const separator =
            document.createElement("option");

        separator.disabled = true;

        separator.textContent =
            "──────────────";

        select.appendChild(
            separator
        );
    }


    /*
     * INDIVIDUAL CREATORS
     */

    creators.forEach(
        creator => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                creator.user_id;

            const name =
                creator.full_name ||
                "Unnamed Creator";

            const email =
                creator.email
                    ? ` — ${creator.email}`
                    : "";

            option.textContent =
                `${name}${email}`;

            select.appendChild(
                option
            );
        }
    );


    /*
     * Creator count
     */

    if (elements.creatorCount) {

        elements.creatorCount.textContent =
            creators.length;
    }
}


/* =========================================================
   GET RECIPIENT IDS
   ========================================================= */

async function getRecipientIds(
    selectedRecipient
) {

    /*
     * ALL CREATORS
     */

    if (
        selectedRecipient ===
        "ALL_CREATORS"
    ) {

        console.log(
            "Loading all creators for notification..."
        );

        /*
         * Refresh directly from database.
         * This automatically includes newly
         * registered creators.
         */

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select(
                "user_id"
            )
            .eq(
                "creator_role",
                "creator"
            );

        if (error) {
            throw error;
        }

        const ids =
            [
                ...new Set(
                    (data || [])
                        .map(
                            row =>
                                row.user_id
                        )
                        .filter(Boolean)
                        .filter(
                            id =>
                                id !==
                                currentAdmin?.id
                        )
                )
            ];

        console.log(
            "All creator IDs:",
            ids
        );

        return ids;
    }


    /*
     * SPECIFIC CREATOR
     */

    if (
        selectedRecipient &&
        selectedRecipient !==
        currentAdmin?.id
    ) {

        console.log(
            "Specific creator:",
            selectedRecipient
        );

        return [
            selectedRecipient
        ];
    }


    throw new Error(
        "Please select a valid creator."
    );
}


/* =========================================================
   SEND NOTIFICATION
   ========================================================= */

async function sendNotification() {

    try {

        if (!supabaseClient) {
            throw new Error(
                "Supabase client is not available."
            );
        }


        /*
         * FORM VALUES
         */

        const recipient =
            elements.creatorSelect?.value;

        const title =
            elements.title?.value.trim();

        const message =
            elements.message?.value.trim();

        const type =
            elements.type?.value ||
            "announcement";


        /*
         * VALIDATION
         */

        if (!recipient) {
            throw new Error(
                "Please select a recipient."
            );
        }

        if (!title) {
            throw new Error(
                "Please enter a notification title."
            );
        }

        if (!message) {
            throw new Error(
                "Please enter a notification message."
            );
        }


        /*
         * FIND RECIPIENTS
         */

        const recipientIds =
            await getRecipientIds(
                recipient
            );


        if (
            recipientIds.length === 0
        ) {

            throw new Error(
                "No creators found."
            );
        }


        console.log(
            "Sending notification to:",
            recipientIds
        );


        /*
         * CREATE ROWS
         */

        const notificationRows =
            recipientIds.map(
                userId => ({

                    user_id:
                        userId,

                    title:
                        title,

                    message:
                        message,

                    type:
                        type,

                    is_read:
                        false
                })
            );


        /*
         * DISABLE BUTTON
         */

        if (elements.sendButton) {

            elements.sendButton.disabled =
                true;

            elements.sendButton.textContent =
                "Sending...";
        }


        setStatus(
            "Sending notification...",
            "info"
        );


        /*
         * INSERT
         */

        const {
            data,
            error
        } = await supabaseClient
            .from("notifications")
            .insert(
                notificationRows
            )
            .select();


        if (error) {

            console.error(
                "Notification insert error:",
                error
            );

            throw error;
        }


        /*
         * SUCCESS
         */

        console.log(
            "Notifications created:",
            data
        );


        if (
            recipient ===
            "ALL_CREATORS"
        ) {

            setStatus(
                `Notification sent to ${recipientIds.length} creator${recipientIds.length === 1 ? "" : "s"}.`,
                "success"
            );

        } else {

            setStatus(
                "Notification sent successfully.",
                "success"
            );
        }


        /*
         * CLEAR FORM
         */

        if (elements.title) {
            elements.title.value = "";
        }

        if (elements.message) {
            elements.message.value = "";
        }

        if (elements.creatorSelect) {
            elements.creatorSelect.value = "";
        }

    } catch (error) {

        console.error(
            "Send notification error:",
            error
        );

        setStatus(
            error.message ||
            "Failed to send notification.",
            "error"
        );

    } finally {

        if (elements.sendButton) {

            elements.sendButton.disabled =
                false;

            elements.sendButton.textContent =
                "Send Notification";
        }
    }
}


/* =========================================================
   ATTACH EVENTS
   ========================================================= */

function attachEvents() {

    if (!elements.sendButton) {

        console.warn(
            "Send notification button not found."
        );

        return;
    }


    /*
     * Prevent duplicate event listeners.
     */

    if (
        elements.sendButton.dataset
            .notificationBound === "true"
    ) {
        return;
    }


    elements.sendButton.dataset
        .notificationBound = "true";


    elements.sendButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            sendNotification();
        }
    );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initAdminNotifications() {

    console.log(
        "Initializing admin notifications..."
    );

    try {

        /*
         * DOM
         */

        cacheElements();


        /*
         * SUPABASE
         */

        supabaseClient =
            getSupabase();


        if (!supabaseClient) {

            throw new Error(
                "Supabase client not found. Check js/config.js."
            );
        }


        /*
         * ADMIN
         */

        await verifyAdmin();


        /*
         * CREATORS
         */

        await loadCreators();


        /*
         * EVENTS
         */

        attachEvents();


        console.log(
            "Admin notification page ready."
        );

    } catch (error) {

        console.error(
            "Admin notification initialization error:",
            error
        );

        setStatus(
            error.message ||
            "Failed to initialize admin notifications.",
            "error"
        );
    }
}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.sendNotification =
    sendNotification;

window.loadCreators =
    loadCreators;

window.initAdminNotifications =
    initAdminNotifications;


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initAdminNotifications,
        {
            once: true
        }
    );

} else {

    initAdminNotifications();
}
