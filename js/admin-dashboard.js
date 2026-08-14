// ==========================================
// VIDLYRA LOGIN
// ==========================================

console.log("Vidlyra Login loaded");


// ==========================================
// LOGIN FORM
// ==========================================

const loginForm =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");


loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;


        if (!email || !password) {

            showMessage(
                "Please enter your email and password."
            );

            return;

        }


        try {

            showMessage(
                "Signing in..."
            );


            // ==================================
            // SUPABASE LOGIN
            // ==================================

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


            if (!data.user) {

                throw new Error(
                    "Login successful, but user information was not found."
                );

            }


            const user =
                data.user;


            // ==================================
            // GET PROFILE
            // ==================================

            const {
                data: profile,
                error: profileError
            } = await sb

                .from("profiles")

                .select(
                    "is_admin"
                )

                .eq(
                    "user_id",
                    user.id
                )

                .maybeSingle();


            if (profileError) {

                throw profileError;

            }


            // ==================================
            // ADMIN REDIRECT
            // ==================================

            if (
                profile &&
                profile.is_admin === true
            ) {

                showMessage(
                    "Welcome, Admin. Redirecting..."
                );


                setTimeout(
                    function () {

                        window.location.href =
                            "admin-dashboard.html";

                    },
                    500
                );


                return;

            }


            // ==================================
            // CREATOR REDIRECT
            // ==================================

            showMessage(
                "Login successful. Redirecting..."
            );


            setTimeout(
                function () {

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
);


// ==========================================
// MESSAGE
// ==========================================

function showMessage(text) {

    if (!message) {

        return;

    }


    message.textContent =
        text;

}
