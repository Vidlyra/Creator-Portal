// ==========================================
// VIDLYRA CREATOR PORTAL
// PROJECT UPLOAD
// ==========================================

console.log("Upload system loaded");


// ==========================================
// UPLOAD PROJECT
// ==========================================

async function uploadProject() {

    const title =
        document.getElementById("title")
            .value
            .trim();

    const description =
        document.getElementById("description")
            .value
            .trim();

    const category =
        document.getElementById("category")
            .value;

    const file =
        document.getElementById("thumbnail")
            .files[0];

    const message =
        document.getElementById("message");

    const button =
        document.getElementById("uploadButton");


    message.textContent = "";
    message.style.color = "#ff5555";


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!title || !description || !category || !file) {

        message.textContent =
            "Please complete all fields.";

        return;
    }


    // ==========================================
    // FILE VALIDATION
    // ==========================================

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        message.textContent =
            "Please select a JPG, PNG or WebP image.";

        return;
    }


    // 5 MB maximum

    const maxSize =
        5 * 1024 * 1024;

    if (file.size > maxSize) {

        message.textContent =
            "Thumbnail must be smaller than 5 MB.";

        return;
    }


    // ==========================================
    // CHECK LOGIN
    // ==========================================

    const {
        data: userData,
        error: userError
    } = await sb.auth.getUser();


    if (userError) {

        console.error(
            "User error:",
            userError
        );

        message.textContent =
            "Unable to verify your account.";

        return;
    }


    const user =
        userData.user;


    if (!user) {

        message.textContent =
            "Please login first.";

        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 1000);

        return;
    }


    console.log(
        "Uploading for user:",
        user.id
    );


    // ==========================================
    // LOADING
    // ==========================================

    button.disabled = true;

    button.textContent =
        "Uploading...";


    try {


        // ======================================
        // SAFE FILE NAME
        // ======================================

        const safeName =
            file.name
                .replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );


        // Store files inside user's folder

        const filePath =
            `${user.id}/${Date.now()}-${safeName}`;


        console.log(
            "Storage path:",
            filePath
        );


        // ======================================
        // UPLOAD THUMBNAIL
        // ======================================

        const {
            data: storageData,
            error: storageError
        } = await sb.storage
            .from("thumbnails")
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


        if (storageError) {

            console.error(
                "Storage error:",
                storageError
            );

            message.textContent =
                "Thumbnail upload failed: " +
                storageError.message;

            return;
        }


        console.log(
            "Storage upload successful:",
            storageData
        );


        // ======================================
        // GET PUBLIC URL
        // ======================================

        const {
            data: publicUrlData
        } = sb.storage
            .from("thumbnails")
            .getPublicUrl(filePath);


        const imageUrl =
            publicUrlData.publicUrl;


        console.log(
            "Thumbnail URL:",
            imageUrl
        );


        // ======================================
        // SAVE PROJECT
        // ======================================

        const {
            data: projectData,
            error: projectError
        } = await sb
            .from("projects")
            .insert({

                user_id: user.id,

                title: title,

                description: description,

                category: category,

                thumbnail: imageUrl,

                status: "Pending"

            })
            .select()
            .single();


        if (projectError) {

            console.error(
                "Database error:",
                projectError
            );


            // Remove uploaded image if
            // database insert failed

            await sb.storage
                .from("thumbnails")
                .remove([
                    filePath
                ]);


            message.textContent =
                "Project could not be saved: " +
                projectError.message;

            return;
        }


        console.log(
            "Project created:",
            projectData
        );


        // ======================================
        // SUCCESS
        // ======================================

        message.style.color =
            "#55dd77";

        message.textContent =
            "Project uploaded successfully!";


        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 1000);


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );

        message.style.color =
            "#ff5555";

        message.textContent =
            "Something went wrong while uploading.";

    } finally {

        button.disabled = false;

        button.textContent =
            "Upload Project";

    }

}
