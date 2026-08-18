// ==========================================
// VIDLYRA ADMIN NOTIFICATIONS
// ==========================================

console.log("Vidlyra Admin Notifications JS loaded");


// ==========================================
// ELEMENTS
// ==========================================

const adminStatus =
    document.getElementById("adminStatus");

const notificationForm =
    document.getElementById("notificationForm");

const creatorSelect =
    document.getElementById("creator");

const notificationTitle =
    document.getElementById("notificationTitle");

const notificationMessage =
    document.getElementById("notificationMessage");

const notificationType =
    document.getElementById("notificationType");

const sendButton =
    document.getElementById("sendButton");

const formMessage =
    document.getElementById("formMessage");

const notificationList =
    document.getElementById("notificationList");


// ==========================================
// CHECK SUPABASE
// ==========================================

if (
    typeof sb === "undefined" ||
    !sb
) {

    console.error(
        "Supabase client is not available."
    );

    if (adminStatus) {

        adminStatus.textContent =
            "Supabase is not connected.";

    }

}


// ==========================================
// SHOW FORM MESSAGE
// ==========================================

function showFormMessage(
    message,
    type
) {

    if (!formMessage) {
        return;
    }

    formMessage.className =
        type === "success"
            ? "success"
            : "error";

    formMessage.textContent =
        message;

    formMessage.style.display =
        "block";

}


// ==========================================
// CLEAR FORM MESSAGE
// ==========================================

function clearFormMessage() {

    if (!formMessage) {
        return;
    }

    formMessage.textContent = "";

    formMessage.className = "";

    formMessage.style.display =
        "none";

}


// ==========================================
// CHECK CURRENT USER
// ==========================================

async function getCurrentUser() {

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

        return null;

    }


    return data.user;

}


// ==========================================
// CHECK ADMIN ROLE
// ==========================================

async function checkAdmin(
    userId
) {

    console.log(
        "Checking admin role:",
        userId
    );


    const {
        data: profile,
        error
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


    if (error) {

        throw error;

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
        profile
    );


    return profile;

}


// ==========================================
// LOAD CREATORS
// ==========================================

async function loadCreators() {

    console.log(
        "Loading creators..."
    );


    if (!creatorSelect) {
        return;
    }


    creatorSelect.innerHTML = `
        <option value="">
            Loading creators...
        </option>
    `;


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

        console.error(
            "Creator loading error:",
            error
        );

        creatorSelect.innerHTML = `
            <option value="">
                Unable to load creators
            </option>
        `;

        throw error;

    }


    const creatorList =
        (profiles || []).filter(
            profile => {

                const role =
                    String(
                        profile.creator_role || ""
                    )
                    .trim()
                    .toLowerCase();


                return role !== "admin";

            }
        );


    creatorSelect.innerHTML = "";


    if (
        creatorList.length === 0
    ) {

        creatorSelect.innerHTML = `
            <option value="">
                No creators found
            </option>
        `;

        return;

    }


    const firstOption =
        document.createElement("option");

    firstOption.value = "";

    firstOption.textContent =
        "Select a creator";

    creatorSelect.appendChild(
        firstOption
    );


    creatorList.forEach(
        creator => {

            const option =
                document.createElement("option");


            option.value =
                creator.user_id;


            const name =
                creator.full_name ||
                "Creator";


            const email =
                creator.email ||
                "";


            option.textContent =
                email
                    ? `${name} — ${email}`
                    : name;


            creatorSelect.appendChild(
                option
            );

        }
    );


    console.log(
        "Creators loaded:",
        creatorList.length
    );

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(
    date
) {

    if (!date) {
        return "Unknown date";
    }


    const parsed =
        new Date(date);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return "Unknown date";

    }


    return parsed.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


// ==========================================
// LOAD NOTIFICATION HISTORY
// ==========================================

async function loadNotificationHistory() {

    console.log(
        "Loading notification history..."
    );


    if (!notificationList) {
        return;
    }


    notificationList.innerHTML = `
        <div class="loading-state">
            Loading notifications...
        </div>
    `;


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
        );


    if (error) {

        console.error(
            "Notification history error:",
            error
        );

        notificationList.innerHTML = `
            <div class="empty-state">
                Unable to load notification history.
                <br><br>
                ${escapeHTML(error.message)}
            </div>
        `;

        return;

    }


    const notificationData =
        notifications || [];


    if (
        notificationData.length === 0
    ) {

        notificationList.innerHTML = `
            <div class="empty-state">
                No notifications have been created yet.
            </div>
        `;

        return;

    }


    /*
        Load creator profiles separately.

        This avoids depending on a foreign-key
        relationship between notifications and profiles.
    */

    const userIds =
        [
            ...new Set(
                notificationData
                    .map(
                        item => item.user_id
                    )
                    .filter(Boolean)
            )
        ];


    let profileMap = {};


    if (
        userIds.length > 0
    ) {

        const {
            data: profiles,
            error: profileError
        } = await sb

            .from("profiles")

            .select(`
                user_id,
                full_name,
                email
            `)

            .in(
                "user_id",
                userIds
            );


        if (!profileError) {

            (profiles || []).forEach(
                profile => {

                    profileMap[
                        profile.user_id
                    ] = profile;

                }
            );

        }

    }


    notificationList.innerHTML = "";


    notificationData.forEach(
        notification => {

            const profile =
                profileMap[
                    notification.user_id
                ];


            const creatorName =
                profile?.full_name ||
                profile?.email ||
                "Creator";


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "notification-item";


            item.innerHTML = `

                <div class="notification-item-top">

                    <div>

                        <div class="notification-item-title">
                            ${escapeHTML(
                                notification.title
                            )}
                        </div>

                        <div class="notification-item-message">
                            ${escapeHTML(
                                notification.message
                            )}
                        </div>

                    </div>

                </div>


                <div class="notification-meta">

                    <span class="notification-type">
                        ${escapeHTML(
                            notification.type ||
                            "system"
                        )}
                    </span>

                    <span class="notification-date">
                        To:
                        ${escapeHTML(
                            creatorName
                        )}
                    </span>

                    <span class="notification-date">
                        ${formatDate(
                            notification.created_at
                        )}
                    </span>

                    <span class="notification-date">
                        ${
                            notification.is_read
                                ? "Read"
                                : "Unread"
                        }
                    </span>

                </div>

            `;


            notificationList.appendChild(
                item
            );

        }
    );


    console.log(
        "Notification history loaded:",
        notificationData.length
    );

}


// ==========================================
// SEND NOTIFICATION
// ==========================================

async function sendNotification(
    event
) {

    event.preventDefault();


    clearFormMessage();


    const userId =
        creatorSelect?.value;


    const title =
        notificationTitle?.value.trim();


    const message =
        notificationMessage?.value.trim();


    const type =
        notificationType?.value;


    // ======================================
    // VALIDATION
    // ======================================

    if (!userId) {

        showFormMessage(
            "Please select a creator.",
            "error"
        );

        return;

    }


    if (!title) {

        showFormMessage(
            "Please enter a notification title.",
            "error"
        );

        return;

    }


    if (!message) {

        showFormMessage(
            "Please enter a notification message.",
            "error"
        );

        return;

    }


    if (!type) {

        showFormMessage(
            "Please select a notification type.",
            "error"
        );

        return;

    }


    // ======================================
    // DISABLE BUTTON
    // ======================================

    if (sendButton) {

        sendButton.disabled =
            true;

        sendButton.textContent =
            "Sending...";

    }


    try {

        console.log(
            "Sending notification:",
            {
                userId,
                title,
                type
            }
        );


        // ==================================
        // INSERT
        // ==================================

        const {
            data,
            error
        } = await sb

            .from("notifications")

            .insert({

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

            .select()
            .single();


        if (error) {

            console.error(
                "Notification insert error:",
                error
            );

            throw error;

        }


        console.log(
            "Notification created:",
            data
        );


        // ==================================
        // SUCCESS
        // ==================================

        showFormMessage(
            "Notification sent successfully! 🔔",
            "success"
        );


        // ==================================
        // RESET FORM
        // ==================================

        notificationTitle.value =
            "";

        notificationMessage.value =
            "";

        notificationType.value =
            "project";


        if (creatorSelect) {

            creatorSelect.value =
                "";

        }


        // ==================================
        // REFRESH HISTORY
        // ==================================

        await loadNotificationHistory();


    } catch (error) {

        console.error(
            "Send notification error:",
            error
        );


        let errorMessage =
            "Unable to send notification.";


        if (
            error?.code === "42501"
        ) {

            errorMessage =
                "Permission denied. Check that this account has creator_role = admin.";

        } else if (
            error?.message
        ) {

            errorMessage =
                error.message;

        }


        showFormMessage(
            errorMessage,
            "error"
        );


    } finally {

        if (sendButton) {

            sendButton.disabled =
                false;

            sendButton.textContent =
                "Send Notification";

        }

    }

}


// ==========================================
// INITIALIZE
// ==========================================

async function initializeAdminNotifications() {

    console.log(
        "Initializing admin notifications..."
    );


    try {

        // ==================================
        // SUPABASE CHECK
        // ==================================

        if (
            typeof sb === "undefined" ||
            !sb
        ) {

            throw new Error(
                "Supabase client is not available. Check js/config.js."
            );

        }


        // ==================================
        // GET USER
        // ==================================

        const user =
            await getCurrentUser();


        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        console.log(
            "Logged-in admin candidate:",
            user.id
        );


        // ==================================
        // ADMIN CHECK
        // ==================================

        const adminProfile =
            await checkAdmin(
                user.id
            );


        // ==================================
        // STATUS
        // ==================================

        if (adminStatus) {

            adminStatus.innerHTML =
                `
                Logged in as
                <strong>
                    ${escapeHTML(
                        adminProfile.full_name ||
                        adminProfile.email ||
                        "Admin"
                    )}
                </strong>
                · Administrator
                `;

        }


        // ==================================
        // LOAD CREATORS
        // ==================================

        await loadCreators();


        // ==================================
        // LOAD HISTORY
        // ==================================

        await loadNotificationHistory();


        console.log(
            "Admin notifications loaded successfully."
        );


    } catch (error) {

        console.error(
            "Admin notifications initialization error:",
            error
        );


        if (adminStatus) {

            adminStatus.innerHTML =
                `
                <span style="color:#ff7777;">
                    ${escapeHTML(
                        error.message ||
                        "Unable to load admin notifications."
                    )}
                </span>
                `;

        }


        if (creatorSelect) {

            creatorSelect.innerHTML = `
                <option value="">
                    Access denied
                </option>
            `;

        }


        if (sendButton) {

            sendButton.disabled =
                true;

        }

    }

}


// ==========================================
// FORM EVENT
// ==========================================

if (notificationForm) {

    notificationForm.addEventListener(
        "submit",
        sendNotification
    );

}


// ==========================================
// START
// ==========================================

initializeAdminNotifications();
