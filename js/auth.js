// ==========================================
// VIDLYRA AUTH
// ==========================================

console.log("Vidlyra Auth loaded");


// ==========================================
// LOGIN
// ==========================================

async function loginUser() {

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    if (!email || !password) {

        showMessage(
            "Please enter email and password."
        );

        return;

    }


    try {

        showMessage(
            "Signing in..."
        );


        // ======================================
        // SUPABASE LOGIN
        // ======================================

        const {
            data,
            error
        } = await sb.auth.signInWithPassword({

            email: email,

            password: password

        });


        if (error) {

            throw error;

        }


        const user =
            data.user;


        if (!user) {

            throw new Error(
                "User was not found after login."
            );

        }


        console.log(
            "Logged in:",
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

            .select(
                "user_id,is_admin"
            )

            .eq(
                "user_id",
                user.id
            )

            .maybeSingle();


        if (profileError) {

            throw profileError;

        }


        console.log(
            "Profile:",
            profile
        );


        // ======================================
        // ADMIN
        // ======================================

        if (
            profile &&
            profile.is_admin === true
        ) {

            showMessage(
                "Welcome Admin! Redirecting..."
            );


            setTimeout(
                () => {

                    window.location.href =
                        "admin-dashboard.html";

                },
                500
            );


            return;

        }


        // ======================================
        // NORMAL CREATOR
        // ======================================

        showMessage(
            "Login successful. Redirecting..."
        );


        setTimeout(
            () => {

                window.location.href =
                    "dashboard.html";

            },
            500
        );


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        showMessage(
            error.message ||
            "Login failed."
        );

    }

}


// ==========================================
// MESSAGE
// ==========================================

function showMessage(text) {

    const message =
        document.getElementById("message");


    if (message) {

        message.textContent =
            text;

    }

}
