// ==========================================
// VIDLYRA CREATOR PORTAL
// AUTHENTICATION
// ==========================================

console.log("Auth loaded");


// ==========================================
// LOGIN
// ==========================================

async function login() {

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("message");
    const button = document.getElementById("loginButton");
    const loading = document.getElementById("loading");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Clear previous message
    message.textContent = "";

    // Validate
    if (!email || !password) {

        message.textContent =
            "Please enter your email and password.";

        return;
    }

    // Loading state
    button.disabled = true;
    loading.style.display = "inline";

    console.log("Login started");
    console.log("Email:", email);

    try {

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

        console.log("Supabase response:", data, error);

        // ==================================
        // ERROR
        // ==================================

        if (error) {

            console.error("Login error:", error);

            message.textContent = error.message;

            return;
        }

        // ==================================
        // SUCCESS
        // ==================================

        if (!data.session) {

            message.textContent =
                "Login completed, but no session was created.";

            return;
        }

        console.log("Login successful");
        console.log("User:", data.user);

        message.style.color = "#55dd77";
        message.textContent =
            "Login successful! Opening Creator Portal...";

        // Give the message a moment to appear
        setTimeout(() => {

            window.location.href = "dashboard.html";

        }, 700);

    } catch (error) {

        console.error("Unexpected login error:", error);

        message.style.color = "#ff5555";

        message.textContent =
            "Unable to connect to the authentication service.";

    } finally {

        button.disabled = false;
        loading.style.display = "none";

    }
}
