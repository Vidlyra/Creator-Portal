// ==========================================
// VIDLYRA ADMIN NOTIFICATIONS
// ==========================================

console.log("Vidlyra Admin Notifications JS loaded");


// ==========================================
// ELEMENTS
// ==========================================

const creatorSelect =
    document.getElementById("creatorSelect");

const notificationForm =
    document.getElementById("notificationForm");

const notificationTitle =
    document.getElementById("notificationTitle");

const notificationMessage =
    document.getElementById("notificationMessage");

const notificationType =
    document.getElementById("notificationType");

const sendNotificationButton =
    document.getElementById(
        "sendNotificationButton"
    );

const notificationList =
    document.getElementById("notificationList");

const adminStatus =
    document.getElementById("adminStatus");

const statusBox =
    document.getElementById("status");

const formMessage =
    document.getElementById("formMessage");


// ==========================================
// CHECK ELEMENTS
// ==========================================

console.log(
    "Admin notification elements:",
    {
        creatorSelect,
        notificationForm,
        notificationTitle,
        notificationMessage,
        notificationType,
        sendNotificationButton,
        notificationList,
        adminStatus
    }
);


// ==========================================
// SHOW STATUS
// ==========================================

function showMessage(
    message,
    type = "success"
) {

    if (!formMessage) {
        console.log(message);
        return;
    }

    formMessage.textContent = message;

    formMessage.className =
        type === "error"
            ? "error"
            : "success";

    formMessage.style.display = "block";

}


// ==========================================
// HIDE STATUS
// ==========================================

function hideMessage() {

    if (!formMessage) {
        return;
    }

    formMessage.textContent = "";

    formMessage.style.display = "none";

    formMessage.className = "";

}


// ==========================================
// ADMIN CHECK
// ==========================================

async function verifyAdmin() {

    const {
        data,
        error
    } = await sb.auth.getUser();


    if (error) {
        throw error;
    }


    if (
        !data ||
        !data.user
    ) {

        throw new Error(
            "You must be logged in."
        );

    }


    const userId =
        data.user.id;


    const {
        data: profile,
        error: profileError
    } = await sb

        .from("profiles")

        .select(`
            user_id,
            full_name,
            email,
            creator_role
        `)

        .eq(
            "user_id",
            userId
        )

        .maybeSingle();


    if (profileError) {
        throw profileError;
    }


    if (!profile) {

        throw new Error(
            "Admin profile not found."
        );

    }


    const role =
        String(
            profile.creator_role || ""
        ).toLowerCase();


    if (role !== "admin") {

        throw new Error(
            "Access denied. Admin account required."
        );

    }


    console.log(
        "Admin verified:",
        userId
    );


    if (adminStatus) {

        adminStatus.innerHTML =
            "Admin access verified: <strong>" +
            (
                profile.full_name ||
                profile.email ||
                "Administrator"
            ) +
            "</strong>";

    }


    return data.user;

}


// ==========================================
// LOAD CREATORS
// ==========================================

async function loadCreators() {

    if (!creatorSelect) {

        throw new Error(
            "Creator select element not found."
        );

    }


    console.log(
        "Loading creators..."
    );


    creatorSelect.innerHTML = "";


    // ======================================
    // ALL CREATORS OPTION
    // ======================================

    const allOption =
        document.createElement("option");

    allOption.value =
        "ALL";

    allOption.textContent =
        "📢 All Creators";

    creatorSelect.appendChild(
        allOption
    );


    // ======================================
    // LOAD CREATOR PROFILES
    // ======================================

    const {
        data: profiles,
        error
    } = await sb

        .from("profiles")

        .select(`
            user_id,
            full_name,
            email,
            creator_role
        `)

        .order(
            "full_name",
            {
                ascending: true
            }
        );


    if (error) {

        throw error;

    }


    console.log(
        "Profiles found:",
        profiles
    );


    const creatorProfiles =
        (profiles || []).filter(
            profile => {

                const role =
                    String(
                        profile.creator_role || ""
                    ).toLowerCase();

                return role !== "admin";

            }
        );


    console.log(
        creatorProfiles.length +
        " creator profiles loaded."
    );


    // ======================================
    // ADD CREATORS
    // ======================================

    creatorProfiles.forEach(
        profile => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                profile.user_id;


            const name =
                profile.full_name ||
                "Creator";


            const email =
                profile.email ||
                "";


            option.textContent =
                email
                    ? name + " — " + email
                    : name;


            creatorSelect.appendChild(
                option
            );

        }
    );


    // ======================================
    // NO CREATORS
    // ======================================

    if (
        creatorProfiles.length === 0
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            "";

        option.textContent =
            "No creators found";

        option.disabled =
            true;

        creatorSelect.appendChild(
            option
        );

    }

}


// ==========================================
// GET ALL CREATOR USER IDS
// ==========================================

async function getAllCreatorIds() {

    const {
        data: profiles,
        error
    } = await sb

        .from("profiles")

        .select(`
            user_id,
            creator_role
        `);


    if (error) {

        throw error;

    }


    const creatorIds =
        (profiles || [])

            .filter(
                profile => {

                    const role =
                        String(
                            profile.creator_role || ""
                        ).toLowerCase();

                    return role !== "admin";

                }
            )

            .map(
                profile =>
                    profile.user_id
            )

            .filter(
                Boolean
            );


    console.log(
        "All creator IDs:",
        creatorIds
    );


    return creatorIds;

}


// ==========================================
// CREATE NOTIFICATIONS
// ==========================================

async function createNotifications(
    userIds,
    title,
    message,
    type
) {

    if (
        !Array.isArray(userIds) ||
        userIds.length === 0
    ) {

        throw new Error(
            "No creator accounts found."
        );

    }


    const rows =
        userIds.map(
            userId => {

                return {

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

                };

            }
        );


    console.log(
        "Creating notifications:",
        rows
    );


    const {
        data,
        error
    } = await sb

        .from("notifications")

        .insert(
            rows
        )

        .select();


    if (error) {

        throw error;

    }


    console.log(
        "Notifications created:",
        data
    );


    return data || [];

}


// ==========================================
// SEND NOTIFICATION
// ==========================================

async function sendNotification() {

    hideMessage();


    if (
        !creatorSelect ||
        !notificationTitle ||
        !notificationMessage ||
        !notificationType
    ) {

        throw new Error(
            "Notification form elements are missing."
        );

    }


    const selectedUser =
        creatorSelect.value;


    const title =
        notificationTitle.value.trim();


    const message =
        notificationMessage.value.trim();


    const type =
        notificationType.value;


    // ======================================
    // VALIDATION
    // ======================================

    if (!selectedUser) {

        throw new Error(
            "Please select a creator."
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


    // ======================================
    // DISABLE BUTTON
    // ======================================

    if (sendNotificationButton) {

        sendNotificationButton.disabled =
            true;

        sendNotificationButton.textContent =
            "Sending...";

    }


    try {

        let userIds = [];


        // ==================================
        // ALL CREATORS
        // ==================================

        if (
            selectedUser === "ALL"
        ) {

            console.log(
                "Sending notification to ALL creators..."
            );


            userIds =
                await getAllCreatorIds();


            if (
                userIds.length === 0
            ) {

                throw new Error(
                    "No creator accounts are available."
                );

            }

        }


        // ==================================
        // ONE CREATOR
        // ==================================

        else {

            console.log(
                "Sending notification to:",
                selectedUser
            );


            userIds = [
                selectedUser
            ];

        }


        console.log(
            "Sending notification:",
            {
                userIds,
                title,
                message,
                type
            }
        );


        // ==================================
        // INSERT
        // ==================================

        const created =
            await createNotifications(
                userIds,
                title,
                message,
                type
            );


        // ==================================
        // SUCCESS
        // ==================================

        const count =
            created.length;


        if (
            selectedUser === "ALL"
        ) {

            showMessage(
                "Notification sent successfully to " +
                count +
                " creator" +
                (
                    count === 1
                        ? ""
                        : "s"
                ) +
                ".",
                "success"
            );

        }

        else {

            showMessage(
                "Notification sent successfully.",
                "success"
            );

        }


        // ==================================
        // CLEAR FORM
        // ==================================

        notificationTitle.value =
            "";

        notificationMessage.value =
            "";

        notificationType.value =
            "project";


        // ==================================
        // RELOAD HISTORY
        // ==================================

        await loadNotificationHistory();


    } catch (error) {

        console.error(
            "Send notification error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to send notification.",
            "error"
        );


    } finally {

        if (sendNotificationButton) {

            sendNotificationButton.disabled =
                false;

            sendNotificationButton.textContent =
                "Send Notification";

        }

    }

}


// ==========================================
// LOAD NOTIFICATION HISTORY
// ==========================================

async function loadNotificationHistory() {

    if (!notificationList) {
        return;
    }


    notificationList.innerHTML =
        `
        <div class="loading-state">
            Loading notifications...
        </div>
        `;


    try {

        const {
            data: notifications,
            error
        } = await sb

            .from("notifications")

            .select(`
                id,
                user_id,
                title,
                message,
                type,
                is_read,
                created_at
            `)

            .order(
                "created_at",
                {
                    ascending: false
                }
            )

            .limit(100);


        if (error) {

            throw error;

        }


        if (
            !notifications ||
            notifications.length === 0
        ) {

            notificationList.innerHTML =
                `
                <div class="empty-state">
                    No notifications found.
                </div>
                `;

            return;

        }


        notificationList.innerHTML =
            "";


        notifications.forEach(
            notification => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "notification-item";


                const top =
                    document.createElement(
                        "div"
                    );


                top.className =
                    "notification-item-top";


                const title =
                    document.createElement(
                        "div"
                    );


                title.className =
                    "notification-item-title";


                title.textContent =
                    notification.title ||
                    "Notification";


                const message =
                    document.createElement(
                        "div"
                    );


                message.className =
                    "notification-item-message";


                message.textContent =
                    notification.message ||
                    "";


                const meta =
                    document.createElement(
                        "div"
                    );


                meta.className =
                    "notification-meta";


                const type =
                    document.createElement(
                        "span"
                    );


                type.className =
                    "notification-type";


                type.textContent =
                    notification.type ||
                    "general";


                const date =
                    document.createElement(
                        "span"
                    );


                date.className =
                    "notification-date";


                date.textContent =
                    formatDate(
                        notification.created_at
                    );


                meta.appendChild(
                    type
                );

                meta.appendChild(
                    date
                );


                top.appendChild(
                    title
                );


                item.appendChild(
                    top
                );

                item.appendChild(
                    message
                );

                item.appendChild(
                    meta
                );


                notificationList.appendChild(
                    item
                );

            }
        );


    } catch (error) {

        console.error(
            "Notification history error:",
            error
        );


        notificationList.innerHTML =
            `
            <div class="empty-state">
                Unable to load notification history.
            </div>
            `;

    }

}


// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


// ==========================================
// FORM SUBMIT
// ==========================================

if (notificationForm) {

    notificationForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            try {

                await sendNotification();

            } catch (error) {

                console.error(
                    "Notification form error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to send notification.",
                    "error"
                );

            }

        }
    );

}


// ==========================================
// INITIALIZE
// ==========================================

async function initAdminNotifications() {

    console.log(
        "Initializing admin notifications..."
    );


    try {

        // ==============================
        // SUPABASE CHECK
        // ==============================

        if (
            typeof sb === "undefined" ||
            !sb
        ) {

            throw new Error(
                "Supabase client is not available."
            );

        }


        // ==============================
        // VERIFY ADMIN
        // ==============================

        await verifyAdmin();


        // ==============================
        // LOAD CREATORS
        // ==============================

        await loadCreators();


        // ==============================
        // LOAD HISTORY
        // ==============================

        await loadNotificationHistory();


        console.log(
            "Admin notification page ready."
        );


    } catch (error) {

        console.error(
            "Admin notification initialization error:",
            error
        );


        if (adminStatus) {

            adminStatus.textContent =
                error.message ||
                "Unable to initialize admin notifications.";

        }


        showMessage(
            error.message ||
            "Unable to initialize admin notifications.",
            "error"
        );

    }

}


// ==========================================
// START
// ==========================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initAdminNotifications
    );

} else {

    initAdminNotifications();

}
