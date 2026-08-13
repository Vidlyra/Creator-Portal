// ==========================================
// VIDLYRA CREATOR AVATARS
// ==========================================

console.log("Creator Avatar JS loaded");


// ==========================================
// CREATOR AVATAR DATA
// ==========================================

const creatorAvatars = [

    {
        id: 1,
        name: "Starter Creator",
        level: 1,
        image: "assets/creator-avatars/creator1.png"
    },

    {
        id: 2,
        name: "Rising Creator",
        level: 2,
        image: "assets/creator-avatars/creator2.png"
    },

    {
        id: 3,
        name: "Active Creator",
        level: 3,
        image: "assets/creator-avatars/creator3.png"
    },

    {
        id: 4,
        name: "Pro Creator",
        level: 4,
        image: "assets/creator-avatars/creator4.png"
    },

    {
        id: 5,
        name: "Elite Creator",
        level: 5,
        image: "assets/creator-avatars/creator5.png"
    },

    {
        id: 6,
        name: "Master Creator",
        level: 6,
        image: "assets/creator-avatars/creator6.png"
    },

    {
        id: 7,
        name: "Legendary Creator",
        level: 7,
        image: "assets/creator-avatars/creator7.png"
    }

];


// ==========================================
// CURRENT USER
// ==========================================

let currentUser = null;

let currentProfile = null;

let selectedCreatorAvatar = null;


// ==========================================
// LOAD CREATOR
// ==========================================

async function loadCreatorAvatarPage() {

    const loading =
        document.getElementById("loading");

    const content =
        document.getElementById("avatarContent");

    const levelDisplay =
        document.getElementById("currentLevel");

    try {

        // --------------------------------------
        // GET USER
        // --------------------------------------

        const {
            data,
            error
        } = await sb.auth.getUser();


        if (error || !data.user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            data.user;


        // --------------------------------------
        // GET PROFILE
        // --------------------------------------

        const {
            data: profile,
            error: profileError
        } = await sb
            .from("profiles")
            .select(`
                creator_level,
                creator_rank,
                creator_avatar
            `)
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


        if (profileError) {

            throw profileError;

        }


        if (!profile) {

            throw new Error(
                "Creator profile not found."
            );

        }


        currentProfile =
            profile;


        const creatorLevel =
            Number(
                profile.creator_level || 1
            );


        // --------------------------------------
        // LEVEL DISPLAY
        // --------------------------------------

        levelDisplay.textContent =
            `Level ${creatorLevel} • ${
                profile.creator_rank ||
                "New Creator"
            }`;


        // --------------------------------------
        // CURRENT AVATAR
        // --------------------------------------

        selectedCreatorAvatar =
            Number(
                profile.creator_avatar || 1
            );


        // --------------------------------------
        // BUILD AVATARS
        // --------------------------------------

        renderCreatorAvatars(
            creatorLevel
        );


        loading.style.display =
            "none";

        content.style.display =
            "block";


    } catch (error) {

        console.error(
            "Creator avatar error:",
            error
        );


        loading.textContent =
            "Unable to load creator avatars.";

    }

}


// ==========================================
// RENDER AVATARS
// ==========================================

function renderCreatorAvatars(
    creatorLevel
) {

    const grid =
        document.getElementById(
            "avatarGrid"
        );


    grid.innerHTML = "";


    creatorAvatars.forEach(
        avatar => {

            const unlocked =
                creatorLevel >=
                avatar.level;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "avatar-card";


            if (
                !unlocked
            ) {

                card.classList.add(
                    "locked"
                );

            }


            if (
                avatar.id ===
                selectedCreatorAvatar
            ) {

                card.classList.add(
                    "selected"
                );

            }


            // ----------------------------------
            // LOCK LABEL
            // ----------------------------------

            let lockHTML = "";


            if (!unlocked) {

                lockHTML = `
                    <div class="lock-label">
                        🔒 Level ${avatar.level}
                    </div>
                `;

            }


            // ----------------------------------
            // CARD HTML
            // ----------------------------------

            card.innerHTML = `

                ${lockHTML}

                <img
                    class="avatar-image"
                    src="${avatar.image}"
                    alt="${avatar.name}"
                    onerror="
                        this.style.opacity='0.3';
                    "
                >

                <div class="avatar-name">
                    ${avatar.name}
                </div>

                <div class="required-level">
                    Requires Level ${avatar.level}
                </div>

            `;


            // ----------------------------------
            // SELECT
            // ----------------------------------

            if (unlocked) {

                card.addEventListener(
                    "click",
                    () => {

                        selectCreatorAvatar(
                            avatar.id
                        );

                    }
                );

            }


            grid.appendChild(
                card
            );

        }
    );

}


// ==========================================
// SELECT AVATAR
// ==========================================

function selectCreatorAvatar(
    avatarId
) {

    selectedCreatorAvatar =
        avatarId;


    const creatorLevel =
        Number(
            currentProfile.creator_level ||
            1
        );


    renderCreatorAvatars(
        creatorLevel
    );


    document.getElementById(
        "message"
    ).textContent =
        "Creator avatar selected.";

}


// ==========================================
// SAVE AVATAR
// ==========================================

async function saveCreatorAvatar() {

    const button =
        document.getElementById(
            "saveButton"
        );

    const message =
        document.getElementById(
            "message"
        );


    if (!currentUser) {

        return;

    }


    button.disabled = true;

    button.textContent =
        "Saving...";


    try {

        const {
            error
        } = await sb
            .from("profiles")
            .update({
                creator_avatar:
                    selectedCreatorAvatar
            })
            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {

            throw error;

        }


        currentProfile.creator_avatar =
            selectedCreatorAvatar;


        message.textContent =
            "✅ Creator avatar saved!";


    } catch (error) {

        console.error(
            "Save avatar error:",
            error
        );


        message.textContent =
            "❌ " + error.message;


    } finally {

        button.disabled =
            false;

        button.textContent =
            "Save Creator Avatar";

    }

}


// ==========================================
// START
// ==========================================

loadCreatorAvatarPage();
