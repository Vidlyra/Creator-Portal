// ==========================================
// VIDLYRA CREATOR PROFILE
// ==========================================

console.log("Profile JS loaded");


// ==========================================
// LOAD CREATOR PROFILE
// ==========================================

async function loadProfile() {

    const loading =
        document.getElementById("loading");

    const content =
        document.getElementById("profileContent");

    const errorBox =
        document.getElementById("error");


    try {

        // ======================================
        // GET CURRENT USER
        // ======================================

        const {
            data: userData,
            error: userError
        } = await sb.auth.getUser();


        if (userError || !userData.user) {

            window.location.href =
                "login.html";

            return;
        }


        const user =
            userData.user;


        console.log(
            "Logged-in creator:",
            user.id
        );


        // ======================================
        // GET PROFILE
        // ======================================

        const {
            data: profile,
            error: profileError
        } = await sb
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();


        if (profileError) {

            console.error(
                "Profile error:",
                profileError
            );

            throw new Error(
                profileError.message
            );
        }


        // ======================================
        // CHECK PROFILE
        // ======================================

        if (!profile) {

            throw new Error(
                "Creator profile was not found."
            );
        }


        // ======================================
        // CREATOR NAME
        // ======================================

        document
            .getElementById("creatorName")
            .textContent =
                profile.full_name || "Creator";


        // ======================================
        // EMAIL
        // ======================================

        document
            .getElementById("creatorEmail")
            .textContent =
                profile.email ||
                user.email ||
                "Not available";


        // ======================================
        // USER ID
        // ======================================

        document
            .getElementById("userId")
            .textContent =
                user.id;


        // ======================================
        // ACCOUNT CREATED
        // ======================================

        if (user.created_at) {

            const date =
                new Date(
                    user.created_at
                );


            document
                .getElementById("createdAt")
                .textContent =
                    date.toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                        }
                    );

        }


        // ======================================
        // SELECTED AVATAR
        // ======================================

        const avatarNumber =
            profile.selected_avatar || 1;


        document
            .getElementById("avatarNumber")
            .textContent =
                `Avatar #${avatarNumber}`;


        // ======================================
        // AVATAR IMAGE
        // ======================================

        const avatarImage =
            document.getElementById(
                "avatarImage"
            );


        if (profile.avatar_url) {

            avatarImage.src =
                profile.avatar_url;

        } else {

            // Default avatar

            avatarImage.src =
                "assets/avatars/avatar1.png";

        }


        // ======================================
        // SHOW PROFILE
        // ======================================

        loading.style.display =
            "none";

        content.style.display =
            "block";


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        loading.style.display =
            "none";


        errorBox.style.display =
            "block";


        errorBox.textContent =
            error.message ||
            "Unable to load creator profile.";

    }

}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    console.log(
        "Logging out..."
    );


    const {
        error
    } = await sb.auth.signOut();


    if (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Logout failed: " +
            error.message
        );

        return;
    }


    window.location.href =
        "login.html";

}


// ==========================================
// START
// ==========================================

loadProfile();
