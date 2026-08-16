// ==========================================
// VIDLYRA NOTIFICATIONS
// ==========================================

console.log("Vidlyra notifications.js loaded");


// ==========================================
// ELEMENTS
// ==========================================

const loading =
    document.getElementById("loading");

const notificationList =
    document.getElementById("notificationList");

const readAllButton =
    document.getElementById("readAllButton");

const unreadBadge =
    document.getElementById("unreadBadge");


// ==========================================
// GET USER
// ==========================================

async function getCurrentUser() {

    const {
        data,
        error
    } = await sb.auth.getUser();

    if (error) {
        throw error;
    }

    if (!data || !data.user) {
        return null;
    }

    return data.user;
}


// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);

    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


// ==========================================
// LOAD NOTIFICATIONS
// ==========================================

async function loadNotifications() {

    try {

        loading.style.display = "block";
        notificationList.style.display = "none";

        const user =
            await getCurrentUser();


        // --------------------------------------
        // LOGIN CHECK
        // --------------------------------------

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        console.log(
            "Loading notifications for:",
            user.id
        );


        // --------------------------------------
        // GET NOTIFICATIONS
        // --------------------------------------

        const {
            data: notifications,
            error
        } = await sb

            .from("notifications")

            .select(`
                id,
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
                "Notification query error:",
                error
            );

            throw error;
        }


        const list =
            notifications || [];


        console.log(
            "Notifications:",
            list
        );


        renderNotifications(list);


    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );


        loading.style.display = "none";

        notificationList.style.display =
            "flex";

        notificationList.innerHTML = `
            <div class="error">
                Unable to load notifications.
                <br><br>
                ${escapeHTML(error.message)}
            </div>
        `;

    }

}


// ==========================================
// RENDER
// ==========================================

function renderNotifications(
    notifications
) {

    loading.style.display = "none";

    notificationList.style.display =
        "flex";


    // --------------------------------------
    // EMPTY
    // --------------------------------------

    if (!notifications.length) {

        notificationList.innerHTML = `
            <div class="empty">
                🔔<br><br>
                No notifications yet.
            </div>
        `;

        updateUnreadBadge(0);

        return;
    }


    // --------------------------------------
    // UNREAD COUNT
    // --------------------------------------

    const unread =
        notifications.filter(
            notification =>
                !notification.is_read
        ).length;


    updateUnreadBadge(unread);


    // --------------------------------------
    // HTML
    // --------------------------------------

    notificationList.innerHTML =
        notifications.map(
            notification => {

                const isUnread =
                    !notification.is_read;


                return `
                    <div
                        class="notification
                        ${isUnread ? "unread" : "read"}"
                        data-id="${escapeHTML(notification.id)}"
                    >

                        <div class="notification-top">

                            <div>

                                <div class="notification-title">

                                    ${escapeHTML(
                                        notification.title ||
                                        "Vidlyra Notification"
                                    )}

                                    ${
                                        isUnread
                                            ? `<span class="unread-label">NEW</span>`
                                            : ""
                                    }

                                </div>

                                <div class="notification-message">

                                    ${escapeHTML(
                                        notification.message ||
                                        ""
                                    )}

                                </div>

                            </div>


                            <div class="notification-time">

                                ${formatTime(
                                    notification.created_at
                                )}

                            </div>

                        </div>


                        <div class="notification-type">

                            ${escapeHTML(
                                notification.type ||
                                "Update"
                            )}

                        </div>

                    </div>
                `;

            }
        ).join("");


    // --------------------------------------
    // CLICK NOTIFICATION
    // --------------------------------------

    document
        .querySelectorAll(
            ".notification.unread"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        markAsRead(
                            element.dataset.id,
                            element
                        );

                    }
                );

            }
        );

}


// ==========================================
// MARK ONE AS READ
// ==========================================

async function markAsRead(
    notificationId,
    element
) {

    try {

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
            );


        if (error) {

            console.error(
                "Mark read error:",
                error
            );

            return;
        }


        // --------------------------------------
        // UPDATE UI
        // --------------------------------------

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


        updateUnreadBadgeFromPage();


    } catch (error) {

        console.error(
            "Unexpected mark read error:",
            error
        );

    }

}


// ==========================================
// MARK ALL AS READ
// ==========================================

async function markAllAsRead() {

    try {

        readAllButton.disabled =
            true;

        readAllButton.textContent =
            "Updating...";


        const user =
            await getCurrentUser();


        if (!user) {

            window.location.href =
                "login.html";

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
                "user_id",
                user.id
            )

            .eq(
                "is_read",
                false
            );


        if (error) {

            throw error;
        }


        // --------------------------------------
        // UPDATE UI
        // --------------------------------------

        document
            .querySelectorAll(
                ".notification.unread"
            )
            .forEach(
                element => {

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
            );


        updateUnreadBadge(0);


    } catch (error) {

        console.error(
            "Mark all read error:",
            error
        );

        alert(
            "Unable to mark notifications as read."
        );

    } finally {

        readAllButton.disabled =
            false;

        readAllButton.textContent =
            "Mark all as read";

    }

}


// ==========================================
// UPDATE BADGE
// ==========================================

function updateUnreadBadge(
    count
) {

    if (!unreadBadge) {
        return;
    }


    if (count > 0) {

        unreadBadge.textContent =
            count;

        unreadBadge.style.display =
            "inline-block";

    } else {

        unreadBadge.style.display =
            "none";

    }

}


// ==========================================
// UPDATE BADGE FROM CURRENT PAGE
// ==========================================

function updateUnreadBadgeFromPage() {

    const unread =
        document.querySelectorAll(
            ".notification.unread"
        ).length;


    updateUnreadBadge(unread);

}


// ==========================================
// HTML ESCAPE
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
// READ ALL BUTTON
// ==========================================

if (readAllButton) {

    readAllButton.addEventListener(
        "click",
        markAllAsRead
    );

}


// ==========================================
// START
// ==========================================

loadNotifications();
