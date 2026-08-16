// ==========================================
// VIDLYRA NOTIFICATIONS
// ==========================================

console.log("Vidlyra Notifications loaded");

let currentUser = null;


// ==========================================
// ELEMENTS
// ==========================================

const loading =
    document.getElementById("loading");

const notificationList =
    document.getElementById("notificationList");

const readAllButton =
    document.getElementById("readAllButton");


// ==========================================
// TIME FORMAT
// ==========================================

function timeAgo(dateString) {

    const date =
        new Date(dateString);

    const now =
        new Date();

    const seconds =
        Math.floor(
            (now - date) / 1000
        );


    if (seconds < 60) {

        return "Just now";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (minutes < 60) {

        return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return `${hours} hour${hours !== 1 ? "s" : ""} ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (days < 30) {

        return `${days} day${days !== 1 ? "s" : ""} ago`;

    }


    return date.toLocaleDateString();

}


// ==========================================
// LOAD NOTIFICATIONS
// ==========================================

async function loadNotifications() {

    try {

        const {
            data,
            error
        } = await sb.auth.getUser();


        if (error || !data.user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            data.user;


        console.log(
            "Notification user:",
            currentUser.id
        );


        // --------------------------------------
        // GET NOTIFICATIONS
        // --------------------------------------

        const {
            data: notifications,
            error: notificationError
        } = await sb
            .from("notifications")
            .select("*")
            .or(
                `user_id.eq.${currentUser.id},user_id.is.null`
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (notificationError) {

            throw notificationError;

        }


        renderNotifications(
            notifications || []
        );


    } catch (error) {

        console.error(
            "Notification error:",
            error
        );


        loading.style.display =
            "none";

        notificationList.style.display =
            "block";

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

    loading.style.display =
        "none";


    notificationList.style.display =
        "flex";


    if (!notifications.length) {

        notificationList.innerHTML = `

            <div class="empty">

                🔔

                <br><br>

                No notifications yet.

                <br>

                Vidlyra will keep you updated here.

            </div>

        `;

        return;

    }


    notificationList.innerHTML =
        notifications.map(
            notification => {

                const title =
                    notification.title ||
                    "Vidlyra Update";


                const message =
                    notification.message ||
                    "";


                const type =
                    notification.type ||
                    "update";


                const createdAt =
                    notification.created_at ||
                    new Date().toISOString();


                const isRead =
                    notification.is_read === true;


                return `

                    <article
                        class="
                            notification
                            ${isRead ? "" : "unread"}
                        "
                        data-id="${notification.id}"
                    >

                        <div class="notification-top">

                            <div>

                                <div class="notification-title">

                                    ${escapeHTML(title)}

                                </div>

                                <div class="notification-message">

                                    ${escapeHTML(message)}

                                </div>

                            </div>


                            <div class="notification-time">

                                ${timeAgo(createdAt)}

                            </div>

                        </div>


                        <div class="notification-type">

                            ${escapeHTML(type)}

                        </div>

                    </article>

                `;

            }
        ).join("");


    // --------------------------------------
    // CLICK NOTIFICATION
    // --------------------------------------

    document
        .querySelectorAll(".notification")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    markAsRead(
                        card.dataset.id
                    );

                }
            );

        });

}


// ==========================================
// MARK ONE AS READ
// ==========================================

async function markAsRead(
    notificationId
) {

    if (!notificationId) {

        return;

    }


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
            )
            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {

            console.error(
                "Mark read error:",
                error
            );

            return;

        }


        const card =
            document.querySelector(
                `.notification[data-id="${notificationId}"]`
            );


        if (card) {

            card.classList.remove(
                "unread"
            );

        }

    } catch (error) {

        console.error(
            "Mark notification error:",
            error
        );

    }

}


// ==========================================
// MARK ALL AS READ
// ==========================================

async function markAllAsRead() {

    if (!currentUser) {

        return;

    }


    readAllButton.disabled =
        true;


    readAllButton.textContent =
        "Updating...";


    try {

        const {
            error
        } = await sb
            .from("notifications")
            .update({
                is_read: true
            })
            .eq(
                "user_id",
                currentUser.id
            )
            .eq(
                "is_read",
                false
            );


        if (error) {

            throw error;

        }


        document
            .querySelectorAll(
                ".notification.unread"
            )
            .forEach(card => {

                card.classList.remove(
                    "unread"
                );

            });


    } catch (error) {

        console.error(
            "Mark all read error:",
            error
        );

        alert(
            "Could not update notifications."
        );

    } finally {

        readAllButton.disabled =
            false;

        readAllButton.textContent =
            "Mark all as read";

    }

}


// ==========================================
// SAFE HTML
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ==========================================
// BUTTON
// ==========================================

if (readAllButton) {

    readAllButton.addEventListener(
        "click",
        markAllAsRead
    );

}


// ==========================================
// REAL-TIME NOTIFICATIONS
// ==========================================

function startRealtimeNotifications() {

    if (!currentUser) {

        return;

    }


    sb
        .channel(
            "vidlyra-notifications"
        )
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "notifications"
            },
            payload => {

                const notification =
                    payload.new;


                if (
                    notification.user_id ===
                    currentUser.id
                    ||
                    notification.user_id ===
                    null
                ) {

                    loadNotifications();

                }

            }
        )
        .subscribe();

}


// ==========================================
// START
// ==========================================

async function startNotifications() {

    await loadNotifications();

    startRealtimeNotifications();

}


startNotifications();
