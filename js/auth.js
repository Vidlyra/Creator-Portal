console.log("Auth loaded");

// ===============================
// SIGN UP
// ===============================

async function signup() {

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (!name || !email || !password || !confirm) {
        alert("Please fill all fields.");
        return;
    }

    if (password !== confirm) {
        alert("Passwords do not match.");
        return;
    }

    const { data, error } = await sb.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        alert(error.message);
        return;
    }

    if (data.user) {

        const { error: profileError } = await sb
            .from("profiles")
            .insert({
                user_id: data.user.id,
                full_name: name,
                email: email,
                avatar_url: null,
                selected_avatar: 1
            });

        if (profileError) {
            console.error("Profile error:", profileError);
        }
    }

    alert("Account created successfully!");

    window.location.href = "dashboard.html";
}


// ===============================
// LOGIN
// ===============================

async function login() {

    console.log("1. Login button clicked");

    const email = document
        .getElementById("email")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    const errorBox = document.getElementById("error");

    errorBox.textContent = "";

    console.log("2. Email:", email);

    if (!email || !password) {

        errorBox.textContent =
            "Please enter your email and password.";

        return;
    }

    console.log("3. Attempting login...");

    const { data, error } =
        await sb.auth.signInWithPassword({
            email: email,
            password: password
        });

    console.log("4. Response:", data, error);

    if (error) {

        console.error("Login error:", error);

        errorBox.textContent = error.message;

        return;
    }

    console.log("5. Login successful");

    window.location.href = "dashboard.html";
}
