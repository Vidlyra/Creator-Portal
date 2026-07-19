async function uploadProject() {

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;
    const file = document.getElementById("thumbnail").files[0];

    if (!title || !description || !file) {
        alert("Please fill all fields.");
        return;
    }

    const {
        data: { user }
    } = await sb.auth.getUser();

    if (!user) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const filename = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await sb.storage
        .from("thumbnails")
        .upload(filename, file);

    if (uploadError) {
        alert(uploadError.message);
        return;
    }

    const imageUrl = sb.storage
        .from("thumbnails")
        .getPublicUrl(filename).data.publicUrl;

    const { error: dbError } = await sb
        .from("projects")
        .insert([
            {
                user_id: user.id,
                title,
                description,
                category,
                thumbnail: imageUrl,
                status: "Pending"
            }
        ]);

    if (dbError) {
        alert(dbError.message);
        return;
    }

    alert("Project uploaded successfully!");

    window.location.href = "dashboard.html";
}
const { error: uploadError } = await sb.storage
    .from("thumbnails")
    .upload(filename, file);
