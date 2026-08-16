// ==========================================
// VIDLYRA NOTIFICATIONS SYSTEM
// ==========================================

console.log("Vidlyra Notifications JS loaded");


// ==========================================
// ELEMENTS
// ==========================================

const notificationLoading =
    document.getElementById("loading");

const notificationList =
    document.getElementById("notificationList");

const readAllButton =
    document.getElementById("readAllButton");

const unreadBadge =
    document.getElementById("unreadBadge");


// Dashboard badge
const notificationBadge =
    document.getElementById("notificationBadge");


// ==========================================
// FORMAT TIME
// ==========================================

function formatNotificationTime(dateString) {

    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return "";
    }

    const now = new Date();

    const difference =
        now.getTime() - date.getTime();


    const seconds =
        Math.floor(difference / 1000);

    const minutes =
        Math.floor(seconds / 60);

    const hours =
        Math.floor(minutes / 60);

    const days =
        Math.floor(hours / 24);


    if (seconds < 60) {
        return "Just now";
    }

    if (minutes < 60) {
        return minutes +
            (minutes === 1 ? " minute ago" : " minutes ago");
    }

    if (hours < 24) {
        return hours +
            (hours === 1 ? " hour ago" : " hours ago");
    }

    if (days < 7) {
        return days +
            (days === 1 ? " day ago" : " days ago");
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// GET CURRENT USER
// ==========================================

async function getNotificationUser() {

    if (
        typeof sb === "undefined" ||
        !sb
    ) {

        throw new Error(
            "Supabase client is not available."
        );

    }


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
// UPDATE BADGE
// ==========================================

function updateNotificationBadge(count) {

    const unread =
        Number(count) || 0;


    // Notifications page badge

    if (unreadBadge) {

        if (unread > 0) {

            unreadBadge.textContent =
                unread > 99
                    ? "99+"
                    : unread;

            unreadBadge.style.display =
                "inline-block";

        } else {

            unreadBadge.style.display =
                "none";

        }

    }


    // Dashboard badge

    if (notificationBadge) {

        if (unread > 0) {

            notificationBadge.textContent =
                unread > 99
                    ? "99+"
                    : unread;

            notificationBadge.style.display =
                "flex";

        } else {

            notificationBadge.style.display =
                "none";

        }

    }

}


// ==========================================
// LOAD NOTIFICATION BADGE
// ==========================================

async function loadNotificationBadge() {

    try {

        const user =
            await getNotificationUser();


        if (!user) {

            updateNotificationBadge(0);

            return;

        }


        const {
            count,
            error
        } = await sb

            .from("notifications")

            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )

            .eq(
                "user_id",
                user.id
            )

            .eq(
                "is_read",
                false
            );


        if (error) {

            console.error(
                "Notification badge error:",
                error
            );

            updateNotificationBadge(0);

            return;

        }


        updateNotificationBadge(
            count || 0
        );


    } catch (error) {

        console.error(
            "Unable to load notification badge:",
            error
        );

        updateNotificationBadge(0);

    }

}


// ==========================================
// SHOW LOADING
// ==========================================

function showNotificationLoading() {

    if (notificationLoading) {

        notificationLoading.style.display =
            "block";

    }

    if (notificationList) {

        notificationList.style.display =
            "none";

    }

}


// ==========================================
// SHOW LIST
// ==========================================

function showNotificationList() {

    if (notificationLoading) {

        notificationLoading.style.display =
            "none";

    }

    if (notificationList) {

        notificationList.style.display =
            "flex";

    }

}


// ==========================================
// SHOW ERROR
// ==========================================

function showNotificationError(message) {

    if (notificationLoading) {

        notificationLoading.style.display =
            "none";

    }


    if (notificationList) {

        notificationList.style.display =
            "block";


        notificationList.innerHTML = `

            <div class="error">

                ${escapeHTML(
                    message ||
                    "Unable to load notifications."
                )}

            </div>

        `;

    }

}


// ==========================================
// LOAD NOTIFICATIONS
// ==========================================

async function loadNotifications() {

    showNotificationLoading();


    try {

        const user =
            await getNotificationUser();


        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        console.log(
            "Notification user:",
            user.id
        );


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

            .eq(
                "user_id",
                user.id
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Notification load error:",
                error
            );

            throw error;

        }


        const list =
            notifications || [];


        console.log(
            "Notifications loaded:",
            list
        );


        renderNotifications(
            list
        );


        const unread =
            list.filter(
                notification =>
                    !notification.is_read
            ).length;


        updateNotificationBadge(
            unread
        );


    } catch (error) {

        console.error(
            "Notification system error:",
            error
        );


        showNotificationError(
            error.message ||
            "Unable to load notifications."
        );

    }

}


// ==========================================
// RENDER NOTIFICATIONS
// ==========================================

function renderNotifications(
    notifications
) {

    if (!notificationList) {

        console.error(
            "Notification list element not found."
        );

        return;

    }


    notificationList.innerHTML = "";


    if (
        !notifications ||
        notifications.length === 0
    ) {

        notificationList.innerHTML = `

            <div class="empty">

                🔔

                <br><br>

                No notifications yet.

            </div>

        `;

        showNotificationList();

        updateNotificationBadge(0);

        return;

    }


    notifications.forEach(
        notification => {

            const item =
                document.createElement("div");


            item.className =
                "notification " +
                (
                    notification.is_read
                        ? "read"
                        : "unread"
                );


            const title =
                escapeHTML(
                    notification.title ||
                    "Vidlyra Notification"
                );


            const message =
                escapeHTML(
                    notification.message ||
                    ""
                );


            const type =
                escapeHTML(
                    notification.type ||
                    "Update"
                );


            const time =
                formatNotificationTime(
                    notification.created_at
                );


            item.innerHTML = `

                <div class="notification-top">

                    <div>

                        <div class="notification-title">

                            ${title}

                            ${
                                notification.is_read
                                    ? ""
                                    : `
                                        <span class="unread-label">
                                            NEW
                                        </span>
                                    `
                            }

                        </div>

                        <div class="notification-message">

                            ${message}

                        </div>

                    </div>


                    <div class="notification-time">

                        ${escapeHTML(time)}

                    </div>

                </div>


                <div class="notification-type">

                    ${type}

                </div>

            `;


            item.addEventListener(
                "click",
                () => {

                    markNotificationRead(
                        notification.id,
                        item
                    );

                }
            );


            notificationList.appendChild(
                item
            );

        }
    );


    showNotificationList();

}


// ==========================================
// MARK SINGLE NOTIFICATION READ
// ==========================================

async function markNotificationRead(
    notificationId,
    element
) {

    if (!notificationId) {
        return;
    }


    try {

        const user =
            await getNotificationUser();


        if (!user) {
            return;
        }


        const {
            error
        } = await sb

            .from("notifications")

            .update({
                is_read: true
            })

            .eq(
                "id",
                notificationId
            )

            .eq(
                "user_id",
                user.id
            );


        if (error) {

            console.error(
                "Mark notification read error:",
                error
            );

            return;

        }


        if (element) {

            element.classList.remove(
                "unread"
            );

            element.classList.add(
                "read"
            );


            const label =
                element.querySelector(
                    ".unread-label"
                );


            if (label) {
                label.remove();
            }

        }


        await loadNotificationBadge();


    } catch (error) {

        console.error(
            "Notification read error:",
            error
        );

    }

}


// ==========================================
// MARK ALL AS READ
// ==========================================

async function markAllNotificationsRead() {

    try {

        const user =
            await getNotificationUser();


        if (!user) {
            return;
        }


        if (readAllButton) {

            readAllButton.disabled =
                true;

            readAllButton.textContent =
                "Marking...";

        }


        const {
            error
        } = await sb

            .from("notifications")

            .update({
                is_read: true
            })

            .eq(
                "user_id",
                user.id
            )

            .eq(
                "is_read",
                false
            );


        if (error) {

            console.error(
                "Mark all read error:",
                error
            );

            throw error;

        }


        console.log(
            "All notifications marked as read."
        );


        updateNotificationBadge(0);


        if (notificationList) {

            const unreadItems =
                notificationList.querySelectorAll(
                    ".notification.unread"
                );


            unreadItems.forEach(
                item => {

                    item.classList.remove(
                        "unread"
                    );

                    item.classList.add(
                        "read"
                    );


                    const label =
                        item.querySelector(
                            ".unread-label"
                        );


                    if (label) {
                        label.remove();
                    }

                }
            );

        }


    } catch (error) {

        console.error(
            "Mark all notifications error:",
            error
        );


        alert(
            "Unable to mark notifications as read."
        );


    } finally {

        if (readAllButton) {

            readAllButton.disabled =
                false;

            readAllButton.textContent =
                "Mark all as read";

        }

    }

}


// ==========================================
// BUTTON
// ==========================================

if (readAllButton) {

    readAllButton.addEventListener(
        "click",
        markAllNotificationsRead
    );

}


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Starting Vidlyra notification system..."
        );


        /*
         * If this is notifications.html,
         * load the complete notification list.
         */

        if (notificationList) {

            await loadNotifications();

        }


        /*
         * Always attempt to update
         * the notification badge.
         */

        await loadNotificationBadge();


        console.log(
            "Notification system ready."
        );

    }
);
