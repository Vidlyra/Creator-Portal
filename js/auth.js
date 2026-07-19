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
        email,
        password
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
            console.error(profileError);
        }
    }

    alert("Account created successfully!");
    window.location.href = "dashboard.html";
}
async function login(){

const email=document.getElementById("email").value.trim();
const password=document.getElementById("password").value;
const errorBox=document.getElementById("error");

errorBox.textContent="";

if(!email || !password){

errorBox.textContent="Please enter your email and password.";

return;

}

const { error } = await sb.auth.signInWithPassword({

email,
password

});

if(error){

errorBox.textContent=error.message;

return;

}

window.location.href="dashboard.html";

}
