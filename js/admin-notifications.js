/* =========================================================
   VIDLYRA ADMIN NOTIFICATIONS
   Supports:
   1. Specific Creator
   2. All Creators
   ========================================================= */

console.log("Vidlyra Admin Notifications JS loaded");

(() => {
    "use strict";

    let supabaseClient = null;
    let currentAdmin = null;
    let creators = [];

    /* =====================================================
       DOM
       ===================================================== */

    const getEl = (id) => document.getElementById(id);

    const elements = {};

    function cacheElements() {
        elements.creatorSelect =
            getEl("creatorSelect") ||
            getEl("creator") ||
            getEl("creatorSelector");

        elements.title =
            getEl("notificationTitle") ||
            getEl("title");

        elements.message =
            getEl("notificationMessage") ||
            getEl("message");

        elements.type =
            getEl("notificationType") ||
            getEl("type");

        elements.sendButton =
            getEl("sendNotification") ||
            getEl("sendButton") ||
            getEl("sendNotificationButton");

        elements.status =
            getEl("notificationStatus") ||
            getEl("status");

        elements.creatorCount =
            getEl("creatorCount");

        console.log("Admin notification elements:", elements);
    }

    /* =====================================================
       SUPABASE
       ===================================================== */

    function getSupabase() {

        if (typeof window.supabaseClient !== "undefined") {
            return window.supabaseClient;
        }

        if (typeof window.supabase !== "undefined") {

            if (
                window.supabase &&
                typeof window.supabase.from === "function"
            ) {
                return window.supabase;
            }
        }

        console.error("Supabase client not found.");

        return null;
    }

    /* =====================================================
       STATUS
       ===================================================== */

    function setStatus(message, type = "info") {

        if (!elements.status) {
            console.log(`[${type}] ${message}`);
            return;
        }

        elements.status.textContent = message;

        elements.status.className =
            `notification-status ${type}`;

        elements.status.style.display = "block";
    }

    /* =====================================================
       ADMIN VERIFICATION
       ===================================================== */

    async function verifyAdmin() {

        if (!supabaseClient) {
            throw new Error("Supabase client unavailable.");
        }

        const {
            data: {
                user
            },
            error
        } = await supabaseClient.auth.getUser();

        if (error) {
            throw error;
        }

        if (!user) {
            throw new Error("You are not logged in.");
        }

        currentAdmin = user;

        console.log(
            "Logged-in user:",
            user.id
        );

        /*
         * Check profiles table.
         */

        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("user_id, creator_role")
            .eq("user_id", user.id)
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
            String(profile.creator_role || "")
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

    /* =====================================================
       LOAD CREATORS
       ===================================================== */

    async function loadCreators() {

        if (!elements.creatorSelect) {
            throw new Error(
                "Creator select element not found."
            );
        }

        console.log("Loading creators...");

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select(
                "user_id, full_name, email, creator_role"
            )
            .eq("creator_role", "creator")
            .order("full_name", {
                ascending: true
            });

        if (error) {
            console.error(
                "Creator loading error:",
                error
            );

            throw error;
        }

        creators = Array.isArray(data)
            ? data
            : [];

        console.log(
            "Profiles found:",
            creators
        );

        /*
         * Remove duplicates.
         */

        const uniqueMap = new Map();

        creators.forEach((creator) => {

            if (
                creator.user_id &&
                creator.user_id !== currentAdmin?.id
            ) {
                uniqueMap.set(
                    creator.user_id,
                    creator
                );
            }
        });

        creators = Array.from(
            uniqueMap.values()
        );

        console.log(
            `${creators.length} creator profiles loaded.`
        );

        renderCreatorSelect();
    }

    /* =====================================================
       RENDER CREATOR SELECT
       ===================================================== */

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

        allOption.value = "ALL_CREATORS";

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

        creators.forEach((creator) => {

            const option =
                document.createElement("option");

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
        });

        /*
         * Count
         */

        if (elements.creatorCount) {
            elements.creatorCount.textContent =
                creators.length;
        }
    }

    /* =====================================================
       GET FORM DATA
       ===================================================== */

    function getFormData() {

        const recipient =
            elements.creatorSelect?.value;

        const title =
            elements.title?.value.trim();

        const message =
            elements.message?.value.trim();

        const type =
            elements.type?.value ||
            "announcement";

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

        return {
            recipient,
            title,
            message,
            type
        };
    }

    /* =====================================================
       GET RECIPIENT IDS
       ===================================================== */

    async function getRecipientIds(
        recipient
    ) {

        /*
         * ALL CREATORS
         */

        if (
            recipient ===
            "ALL_CREATORS"
        ) {

            /*
             * Refresh the creator list from
             * Supabase so newly registered
             * creators are included.
             */

            const {
                data,
                error
            } = await supabaseClient
                .from("profiles")
                .select(
                    "user_id, creator_role"
                )
                .eq(
                    "creator_role",
                    "creator"
                );

            if (error) {
                throw error;
            }

            const ids = [
                ...new Set(
                    (data || [])
                        .map(
                            row => row.user_id
                        )
                        .filter(Boolean)
                        .filter(
                            id =>
                                id !==
                                currentAdmin?.id
                        )
                )
            ];

            return ids;
        }

        /*
         * SPECIFIC CREATOR
         */

        if (
            recipient &&
            recipient !==
            currentAdmin?.id
        ) {
            return [recipient];
        }

        throw new Error(
            "Invalid notification recipient."
        );
    }

    /* =====================================================
       SEND NOTIFICATION
       ===================================================== */

    async function sendNotification() {

        if (!supabaseClient) {
            setStatus(
                "Supabase is not available.",
                "error"
            );

            return;
        }

        try {

            const form =
                getFormData();

            const recipientIds =
                await getRecipientIds(
                    form.recipient
                );

            if (
                recipientIds.length === 0
            ) {

                throw new Error(
                    "No creator profiles found."
                );
            }

            console.log(
                "Notification recipients:",
                recipientIds
            );

            /*
             * Create one notification
             * for each creator.
             */

            const rows =
                recipientIds.map(
                    userId => ({
                        user_id: userId,
                        title: form.title,
                        message: form.message,
                        type: form.type,
                        is_read: false
                    })
                );

            setStatus(
                "Sending notification...",
                "info"
            );

            if (elements.sendButton) {
                elements.sendButton.disabled =
                    true;
            }

            const {
                data,
                error
            } = await supabaseClient
                .from("notifications")
                .insert(rows)
                .select();

            if (error) {

                console.error(
                    "Notification insert error:",
                    error
                );

                throw error;
            }

            console.log(
                "Notifications created:",
                data
            );

            const count =
                recipientIds.length;

            if (
                form.recipient ===
                "ALL_CREATORS"
            ) {

                setStatus(
                    `Notification sent successfully to ${count} creator${count === 1 ? "" : "s"}.`,
                    "success"
                );

            } else {

                setStatus(
                    "Notification sent successfully.",
                    "success"
                );
            }

            clearForm();

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
            }
        }
    }

    /* =====================================================
       CLEAR FORM
       ===================================================== */

    function clearForm() {

        if (elements.title) {
            elements.title.value = "";
        }

        if (elements.message) {
            elements.message.value = "";
        }

        if (elements.type) {
            elements.type.value =
                "announcement";
        }

        if (elements.creatorSelect) {
            elements.creatorSelect.value =
                "";
        }
    }

    /* =====================================================
       BUTTON EVENT
       ===================================================== */

    function attachEvents() {

        if (!elements.sendButton) {

            console.warn(
                "Send notification button not found."
            );

            return;
        }

        /*
         * Prevent duplicate listeners.
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
            (event) => {

                event.preventDefault();

                sendNotification();
            }
        );
    }

    /* =====================================================
       INIT
       ===================================================== */

    async function initAdminNotifications() {

        console.log(
            "Initializing admin notifications..."
        );

        try {

            cacheElements();

            supabaseClient =
                getSupabase();

            if (!supabaseClient) {
                throw new Error(
                    "Supabase client not found. Check js/config.js."
                );
            }

            await verifyAdmin();

            await loadCreators();

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

    /* =====================================================
       GLOBAL ACCESS
       ===================================================== */

    window.sendNotification =
        sendNotification;

    window.loadCreators =
        loadCreators;

    window.initAdminNotifications =
        initAdminNotifications;

    /* =====================================================
       START
       ===================================================== */

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

})();
