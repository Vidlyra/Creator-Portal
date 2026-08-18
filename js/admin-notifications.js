// ==========================================
// VIDLYRA ADMIN NOTIFICATIONS
// ==========================================

console.log("Vidlyra Admin Notifications JS loaded");


// ==========================================
// ELEMENTS
// ==========================================

const creatorSelect =
    document.getElementById("creatorSelect");

const titleInput =
    document.getElementById("notificationTitle");

const messageInput =
    document.getElementById("notificationMessage");

const typeSelect =
    document.getElementById("notificationType");

const sendButton =
    document.getElementById("sendNotificationButton");

const statusBox =
    document.getElementById("status");

const creatorList =
    document.getElementById("creatorList");


// ==========================================
// STATUS
// ==========================================

function showStatus(message, success = false) {

    if (!statusBox) return;

    statusBox.textContent = message;

    statusBox.style.display = "block";

    statusBox.style.color =
        success
            ? "#7dff9b"
            : "#ff7777";

}


// ==========================================
// CHECK ADMIN
// ==========================================

async function checkAdmin() {

    const {
        data,
        error
    } = await sb.auth.getUser();

    if (error) {
        throw error;
    }

    if (!data || !data.user) {

        window.location.href =
            "login.html";

        return null;

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
            "You do not have admin permission."
        );

    }


    console.log(
        "Admin verified:",
        userId
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

        throw new Error(
            "Creator select element not found."
        );

    }


    creatorSelect.innerHTML = `

        <option value="">
            Loading creators...
        </option>

    `;


    const {
        data,
        error
    } = await sb

        .from("profiles")

        .select(`
            user_id,
            full_name,
            email,
            creator_role
        `)

        .not(
            "user_id",
            "is",
            null
        )

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

        throw error;

    }


    const profiles =
        data || [];


    console.log(
        "Profiles found:",
        profiles
    );


    // Clear dropdown

    creatorSelect.innerHTML = `

        <option value="">
            Select your creator
        </option>

    `;


    if (
        profiles.length === 0
    ) {

        creatorSelect.innerHTML = `

            <option value="">
                No creators found
            </option>

        `;

        showStatus(
            "No creator profiles found in the profiles table."
        );

        return;

    }


    profiles.forEach(
        profile => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                profile.user_id;


            const name =
                profile.full_name ||
                "Unnamed Creator";


            const email =
                profile.email ||
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
        `${profiles.length} creator profiles loaded.`
    );

}


// ==========================================
// SEND NOTIFICATION
// ==========================================

async function sendNotification() {

    try {

        if (!creatorSelect) {
            throw new Error(
                "Creator selector not found."
            );
        }


        const userId =
            creatorSelect.value;


        const title =
            titleInput
                ? titleInput.value.trim()
                : "";


        const message =
            messageInput
                ? messageInput.value.trim()
                : "";


        const type =
            typeSelect
                ? typeSelect.value
                : "general";


        // Validation

        if (!userId) {

            showStatus(
                "Please select a creator."
            );

            return;

        }


        if (!title) {

            showStatus(
                "Please enter a notification title."
            );

            return;

        }


        if (!message) {

            showStatus(
                "Please enter a notification message."
            );

            return;

        }


        if (sendButton) {

            sendButton.disabled =
                true;

            sendButton.textContent =
                "Sending...";

        }


        console.log(
            "Sending notification:",
            {
                userId,
                title,
                message,
                type
            }
        );


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


        showStatus(
            "Notification sent successfully! 🔔",
            true
        );


        // Clear form

        if (titleInput) {
            titleInput.value = "";
        }


        if (messageInput) {
            messageInput.value = "";
        }


        if (typeSelect) {
            typeSelect.value =
                "general";
        }


    } catch (error) {

        console.error(
            "Send notification error:",
            error
        );


        showStatus(
            error.message ||
            "Failed to send notification."
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
// BUTTON
// ==========================================

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendNotification
    );

}


// ==========================================
// INITIALIZE
// ==========================================

async function initAdminNotifications() {

    try {

        console.log(
            "Initializing admin notifications..."
        );


        await checkAdmin();


        await loadCreators();


        console.log(
            "Admin notification page ready."
        );


    } catch (error) {

        console.error(
            "Admin notification initialization error:",
            error
        );


        showStatus(
            error.message ||
            "Unable to load admin notification page."
        );

    }

}


// ==========================================
// START
// ==========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initAdminNotifications
    );

} else {

    initAdminNotifications();

}
