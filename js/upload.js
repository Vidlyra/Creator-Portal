// ==========================================
// VIDLYRA CREATOR PORTAL
// MULTI-FORMAT PROJECT UPLOAD
// ==========================================

console.log("Upload system loaded");


// ==========================================
// CATEGORY SETTINGS
// ==========================================

const uploadSettings = {

    "Anime": {
        bucket: "anime",
        type: "video/mp4",
        extensions: [".mp4"],
        maxSize: 500 * 1024 * 1024
    },

    "Manga": {
        bucket: "manga",
        type: "application/pdf",
        extensions: [".pdf"],
        maxSize: 20 * 1024 * 1024
    },

    "Story": {
        bucket: "stories",
        type: "application/pdf",
        extensions: [".pdf"],
        maxSize: 20 * 1024 * 1024
    },

    "Short Film": {
        bucket: "shortfilms",
        type: "video/mp4",
        extensions: [".mp4"],
        maxSize: 500 * 1024 * 1024
    },

    "Music": {
        bucket: "music",
        type: "audio/mpeg",
        extensions: [".mp3"],
        maxSize: 50 * 1024 * 1024
    },

    "Artwork": {
        bucket: "artwork",
        type: "image",
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

function getExtension(filename) {

    const lastDot =
        filename.lastIndexOf(".");

    if (lastDot === -1) {
        return "";
    }

    return filename
        .substring(lastDot)
        .toLowerCase();

}


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

    const mainFile =
        document.getElementById("mainFile")
            .files[0];

    const thumbnail =
        document.getElementById("thumbnail")
            .files[0];

    const message =
        document.getElementById("message");

    const button =
        document.getElementById("uploadButton");


    message.textContent = "";
    message.style.color = "#ff5555";


    // ==========================================
    // BASIC VALIDATION
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


    // ==========================================
    // CATEGORY SETTINGS
    // ==========================================

    const settings =
        uploadSettings[category];


    if (!settings) {

        message.textContent =
            "Invalid project category.";

        return;
    }


    // ==========================================
    // FILE EXTENSION CHECK
    // ==========================================

    const extension =
        getExtension(mainFile.name);


    if (!settings.extensions.includes(extension)) {

        message.textContent =
            `Invalid file format. ${category} requires ${settings.extensions.join(", ")}.`;

        return;
    }


    // ==========================================
    // MIME TYPE CHECK
    // ==========================================

    if (
        settings.type !== "image" &&
        mainFile.type !== settings.type
    ) {

        message.textContent =
            `Invalid file type. Please upload a valid ${category} file.`;

        return;
    }


    // ==========================================
    // FILE SIZE CHECK
    // ==========================================

    if (mainFile.size > settings.maxSize) {

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
    // THUMBNAIL VALIDATION
    // ==========================================

    const thumbnailTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (!thumbnailTypes.includes(thumbnail.type)) {

        message.textContent =
            "Thumbnail must be JPG, PNG or WebP.";

        return;
    }


    const thumbnailMaxSize =
        5 * 1024 * 1024;


    if (thumbnail.size > thumbnailMaxSize) {

        message.textContent =
            "Thumbnail must be smaller than 5 MB.";

        return;
    }


    // ==========================================
    // CHECK AUTHENTICATION
    // ==========================================

    const {
        data: userData,
        error: userError
    } = await sb.auth.getUser();


    if (userError || !userData.user) {

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
        "Uploading for:",
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
        // SAFE FILENAMES
        // ======================================

        const safeMainName =
            mainFile.name
                .replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );


        const safeThumbnailName =
            thumbnail.name
                .replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );


        const timestamp =
            Date.now();


        // ======================================
        // MAIN FILE PATH
        // ======================================

        const mainPath =
            `${user.id}/${timestamp}-${safeMainName}`;


        // ======================================
        // THUMBNAIL PATH
        // ======================================

        const thumbnailPath =
            `${user.id}/${timestamp}-thumbnail-${safeThumbnailName}`;


        // ======================================
        // UPLOAD MAIN FILE
        // ======================================

        console.log(
            "Uploading main file to:",
            settings.bucket
        );


        const {
            data: mainUploadData,
            error: mainUploadError
        } = await sb.storage
            .from(settings.bucket)
            .upload(
                mainPath,
                mainFile,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: mainFile.type
                }
            );


        if (mainUploadError) {

            console.error(
                "Main upload error:",
                mainUploadError
            );

            message.textContent =
                "Project file upload failed: " +
                mainUploadError.message;

            return;
        }


        console.log(
            "Main file uploaded:",
            mainUploadData
        );


        // ======================================
        // UPLOAD THUMBNAIL
        // ======================================

        const {
            data: thumbnailData,
            error: thumbnailError
        } = await sb.storage
            .from("thumbnails")
            .upload(
                thumbnailPath,
                thumbnail,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: thumbnail.type
                }
            );


        if (thumbnailError) {

            console.error(
                "Thumbnail error:",
                thumbnailError
            );


            // Remove main file if thumbnail fails

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
            thumbnailData
        );


        // ======================================
        // SAVE PROJECT DATABASE RECORD
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


            // Cleanup uploaded files

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
                "Project could not be saved: " +
                projectError.message;

            return;
        }


        console.log(
            "Project saved:",
            projectData
        );


        // ======================================
        // STORY RECORD
        // ======================================

        if (category === "Story") {

            const {
                error: storyError
            } = await sb
                .from("stories")
                .insert({

                    user_id: user.id,

                    title: title,

                    description: description,

                    category: "Story",

                    pdf_path: mainPath,

                    status: "Pending"

                });


            if (storyError) {

                console.error(
                    "Story database error:",
                    storyError
                );

                message.textContent =
                    "Story uploaded, but story record failed: " +
                    storyError.message;

                return;
            }

        }


        // ======================================
        // SUCCESS
        // ======================================

        message.style.color =
            "#55dd77";

        message.textContent =
            `${category} uploaded successfully!`;


        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 1200);


    } catch (error) {

        console.error(
            "Unexpected upload error:",
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
