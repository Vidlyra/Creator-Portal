// ==========================================
// VIDLYRA CREATOR PORTAL
// UPLOAD SYSTEM
// ==========================================

console.log("Vidlyra upload.js loaded");


// ==========================================
// CATEGORY SETTINGS
// ==========================================

const uploadSettings = {

    Anime: {
        bucket: "stories",
        extensions: [".pdf"],
        maxSize: 20 * 1024 * 1024
    },

    Manga: {
        bucket: "manga",
        extensions: [".pdf"],
        maxSize: 20 * 1024 * 1024
    },

    "Short Film": {
        bucket: "shortfilms",
        extensions: [".mp4"],
        maxSize: 500 * 1024 * 1024
    },

    Music: {
        bucket: "music",
        extensions: [".mp3"],
        maxSize: 50 * 1024 * 1024
    },

    Artwork: {
        bucket: "artwork",
        extensions: [
            ".png",
            ".jpg",
            ".jpeg",
            ".webp"
        ],
        maxSize: 10 * 1024 * 1024
    }

};


// ==========================================
// GET FILE EXTENSION
// ==========================================

function getFileExtension(filename) {

    const dot =
        filename.lastIndexOf(".");

    if (dot === -1) {
        return "";
    }

    return filename
        .substring(dot)
        .toLowerCase();

}


// ==========================================
// UPLOAD PROJECT
// ==========================================

async function uploadProject() {

    const title =
        document
            .getElementById("title")
            .value
            .trim();

    const description =
        document
            .getElementById("description")
            .value
            .trim();

    const category =
        document
            .getElementById("category")
            .value;

    const mainFile =
        document
            .getElementById("mainFile")
            .files[0];

    const thumbnail =
        document
            .getElementById("thumbnail")
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

    if (!title) {

        message.textContent =
            "Please enter a project title.";

        return;
    }


    if (!description) {

        message.textContent =
            "Please enter a description.";

        return;
    }


    if (!category) {

        message.textContent =
            "Please select a category.";

        return;
    }


    if (!mainFile) {

        message.textContent =
            "Please select your project file.";

        return;
    }


    if (!thumbnail) {

        message.textContent =
            "Please select a thumbnail.";

        return;
    }


    const settings =
        uploadSettings[category];


    if (!settings) {

        message.textContent =
            "Invalid category.";

        return;
    }


    // ==========================================
    // FILE EXTENSION
    // ==========================================

    const extension =
        getFileExtension(
            mainFile.name
        );


    if (
        !settings.extensions.includes(
            extension
        )
    ) {

        message.textContent =
            `Invalid file format. ${category} accepts ${settings.extensions.join(", ")}.`;

        return;
    }


    // ==========================================
    // FILE SIZE
    // ==========================================

    if (
        mainFile.size >
        settings.maxSize
    ) {

        const maxMB =
            Math.round(
                settings.maxSize /
                (1024 * 1024)
            );

        message.textContent =
            `File is too large. Maximum size is ${maxMB} MB.`;

        return;
    }


    // ==========================================
    // THUMBNAIL CHECK
    // ==========================================

    const allowedThumbnailTypes = [

        "image/jpeg",
        "image/png",
        "image/webp"

    ];


    if (
        !allowedThumbnailTypes.includes(
            thumbnail.type
        )
    ) {

        message.textContent =
            "Thumbnail must be JPG, JPEG, PNG or WebP.";

        return;
    }


    if (
        thumbnail.size >
        5 * 1024 * 1024
    ) {

        message.textContent =
            "Thumbnail must be smaller than 5 MB.";

        return;
    }


    // ==========================================
    // GET LOGGED-IN USER
    // ==========================================

    const {
        data: userData,
        error: userError
    } = await sb.auth.getUser();


    if (
        userError ||
        !userData.user
    ) {

        message.textContent =
            "Please login first.";

        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 1000);

        return;
    }


    const user =
        userData.user;


    console.log(
        "Logged-in user:",
        user.id
    );


    // ==========================================
    // START UPLOAD
    // ==========================================

    button.disabled = true;

    button.textContent =
        "Uploading...";


    try {

        const timestamp =
            Date.now();


        // ======================================
        // CLEAN FILENAMES
        // ======================================

        const cleanMainName =
            mainFile.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


        const cleanThumbnailName =
            thumbnail.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


        // ======================================
        // FILE PATHS
        // ======================================

        const mainPath =
            `${user.id}/${timestamp}-${cleanMainName}`;


        const thumbnailPath =
            `${user.id}/${timestamp}-thumbnail-${cleanThumbnailName}`;


        console.log(
            "Bucket:",
            settings.bucket
        );

        console.log(
            "Main file:",
            mainPath
        );


        // ======================================
        // UPLOAD MAIN FILE
        // ======================================

        const {
            data: mainUpload,
            error: mainError
        } = await sb.storage
            .from(settings.bucket)
            .upload(
                mainPath,
                mainFile,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


        if (mainError) {

            console.error(
                "Main upload error:",
                mainError
            );

            message.textContent =
                "File upload failed: " +
                mainError.message;

            return;
        }


        console.log(
            "Main file uploaded:",
            mainUpload
        );


        // ======================================
        // UPLOAD THUMBNAIL
        // ======================================

        const {
            data: thumbnailUpload,
            error: thumbnailError
        } = await sb.storage
            .from("thumbnails")
            .upload(
                thumbnailPath,
                thumbnail,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


        if (thumbnailError) {

            console.error(
                "Thumbnail upload error:",
                thumbnailError
            );


            // Delete main file if thumbnail fails

            await sb.storage
                .from(settings.bucket)
                .remove([
                    mainPath
                ]);


            message.textContent =
                "Thumbnail upload failed: " +
                thumbnailError.message;

            return;
        }


        console.log(
            "Thumbnail uploaded:",
            thumbnailUpload
        );


        // ======================================
        // SAVE PROJECT
        // ======================================

        const {
            data: project,
            error: projectError
        } = await sb
            .from("projects")
            .insert({

                user_id: user.id,

                title: title,

                description: description,

                category: category,

                thumbnail: thumbnailPath,

                status: "Pending"

            })
            .select()
            .single();


        if (projectError) {

            console.error(
                "Database error:",
                projectError
            );


            // Cleanup files

            await sb.storage
                .from(settings.bucket)
                .remove([
                    mainPath
                ]);


            await sb.storage
                .from("thumbnails")
                .remove([
                    thumbnailPath
                ]);


            message.textContent =
                "Database error: " +
                projectError.message;

            return;
        }


        console.log(
            "Project saved:",
            project
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

        }, 1500);


    } catch (error) {

        console.error(
            "Unexpected error:",
            error
        );

        message.textContent =
            "Something went wrong during upload.";

    } finally {

        button.disabled = false;

        button.textContent =
            "Upload Project";

    }

}
