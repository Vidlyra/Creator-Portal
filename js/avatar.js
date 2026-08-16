// ==========================================
// VIDLYRA FREQUENCY AVATARS
// ==========================================

console.log("Frequency Avatar JS loaded");

let currentUser = null;
let selectedAvatar = 1;


// ==========================================
// AVATAR DATA
// ==========================================

const avatars = {

    basic: [
        { id: 1, name: "Student" },
        { id: 2, name: "Cyber Hacker" },
        { id: 3, name: "Samurai" },
        { id: 4, name: "Mage" },
        { id: 5, name: "Music Producer" },
        { id: 6, name: "Idol" },
        { id: 7, name: "Creator" },
        { id: 8, name: "Explorer" },
        { id: 9, name: "Artist" },
        { id: 10, name: "Rider" },
        { id: 11, name: "Guardian" },
        { id: 12, name: "Dreamer" }
    ],

    premium: [
        { id: 13, name: "Shadow Hacker" },
        { id: 14, name: "Cyber Samurai" },
        { id: 15, name: "Storm Mage" },
        { id: 16, name: "Dark Creator" },
        { id: 17, name: "Pixel Master" },
        { id: 18, name: "Neon Rider" },
        { id: 19, name: "Code Warrior" },
        { id: 20, name: "Frequency Artist" },
        { id: 21, name: "Digital Mage" },
        { id: 22, name: "Sound Master" },
        { id: 23, name: "Anime Creator" },
        { id: 24, name: "Moon Samurai" },
        { id: 25, name: "Cyber Artist" },
        { id: 26, name: "Storm Rider" },
        { id: 27, name: "Dream Hacker" },
        { id: 28, name: "Galaxy Creator" },
        { id: 29, name: "Code Mage" },
        { id: 30, name: "Shadow Artist" },
        { id: 31, name: "Digital Samurai" },
        { id: 32, name: "Frequency Hacker" },
        { id: 33, name: "Creator X" },
        { id: 34, name: "Anime Rider" },
        { id: 35, name: "Cyber Guardian" },
        { id: 36, name: "Dark Mage" },
        { id: 37, name: "Music Warrior" },
        { id: 38, name: "Pixel Samurai" },
        { id: 39, name: "Storm Creator" },
        { id: 40, name: "Virtual Artist" },
        { id: 41, name: "Frequency Rider" },
        { id: 42, name: "Digital Guardian" }
    ],

    vip: [
        { id: 43, name: "Legendary Lyra" },
        { id: 44, name: "Frequency King" },
        { id: 45, name: "Frequency Queen" },
        { id: 46, name: "Void Guardian" },
        { id: 47, name: "Galaxy Warrior" },
        { id: 48, name: "Eternal Mage" }
    ]

};


// ==========================================
// CURRENT USER
// ==========================================

async function getCurrentUser() {

    const {
        data,
        error
    } = await sb.auth.getUser();

    if (error) {
        throw error;
    }

    if (!data.user) {
        window.location.href = "login.html";
        return null;
    }

    return data.user;
}


// ==========================================
// GET AVATAR IMAGE
// ==========================================

function getAvatarImage(id) {

    return `assets/avatars/avatar${id}.png`;

}


// ==========================================
// CREATE CARD
// ==========================================

function createAvatarCard(avatar) {

    const card =
        document.createElement("div");

    card.className = "avatar-card";

    card.dataset.avatarId =
        avatar.id;


    if (Number(avatar.id) ===
        Number(selectedAvatar)) {

        card.classList.add("selected");

    }


    card.innerHTML = `

        <img
            class="avatar-image"
            src="${getAvatarImage(avatar.id)}"
            alt="${avatar.name}"
            onerror="this.style.opacity='0.2'"
        >

        <div class="avatar-name">
            ${avatar.name}
        </div>

        <div class="avatar-number">
            Avatar #${avatar.id}
        </div>

    `;


    card.addEventListener(
        "click",
        function () {

            selectAvatar(
                avatar.id
            );

        }
    );


    return card;

}


// ==========================================
// DISPLAY AVATARS
// ==========================================

function displayAvatars() {

    const basicGrid =
        document.getElementById("basicGrid");

    const premiumGrid =
        document.getElementById("premiumGrid");

    const vipGrid =
        document.getElementById("vipGrid");


    if (!basicGrid ||
        !premiumGrid ||
        !vipGrid) {

        console.error(
            "Avatar grids not found."
        );

        return;

    }


    basicGrid.innerHTML = "";
    premiumGrid.innerHTML = "";
    vipGrid.innerHTML = "";


    avatars.basic.forEach(
        avatar => {

            basicGrid.appendChild(
                createAvatarCard(avatar)
            );

        }
    );


    avatars.premium.forEach(
        avatar => {

            premiumGrid.appendChild(
                createAvatarCard(avatar)
            );

        }
    );


    avatars.vip.forEach(
        avatar => {

            vipGrid.appendChild(
                createAvatarCard(avatar)
            );

        }
    );

}


// ==========================================
// SELECT
// ==========================================

function selectAvatar(id) {

    selectedAvatar =
        Number(id);


    document
        .querySelectorAll(".avatar-card")
        .forEach(card => {

            card.classList.remove(
                "selected"
            );

        });


    const selectedCard =
        document.querySelector(
            `.avatar-card[data-avatar-id="${selectedAvatar}"]`
        );


    if (selectedCard) {

        selectedCard.classList.add(
            "selected"
        );

    }


    const message =
        document.getElementById(
            "message"
        );


    if (message) {

        message.style.color =
            "#aaa";

        message.textContent =
            `Avatar #${selectedAvatar} selected.`;

    }

}


// ==========================================
// LOAD PROFILE
// ==========================================

async function loadAvatarSystem() {

    const loading =
        document.getElementById("loading");

    const content =
        document.getElementById("avatarContent");

    const message =
        document.getElementById("message");


    try {

        currentUser =
            await getCurrentUser();


        if (!currentUser) {
            return;
        }


        const {
            data: profile,
            error
        } = await sb
            .from("profiles")
            .select(
                "frequency_avatar,avatar_type"
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


        if (error) {
            throw error;
        }


        /*
         * If the creator already has a
         * Frequency Avatar, select it.
         *
         * Otherwise start with Avatar #1.
         */

        if (
            profile &&
            profile.frequency_avatar !== null &&
            profile.frequency_avatar !== undefined
        ) {

            selectedAvatar =
                Number(
                    profile.frequency_avatar
                );

        } else {

            selectedAvatar = 1;

        }


        displayAvatars();


        if (loading) {

            loading.style.display =
                "none";

        }


        if (content) {

            content.style.display =
                "block";

        }


    } catch (error) {

        console.error(
            "Frequency avatar system error:",
            error
        );


        if (loading) {

            loading.textContent =
                "Unable to load avatar system.";

        }


        if (message) {

            message.style.color =
                "#ff5555";

            message.textContent =
                error.message;

        }

    }

}


// ==========================================
// SAVE FREQUENCY AVATAR
// ==========================================

async function saveAvatar() {

    const button =
        document.getElementById(
            "saveButton"
        );

    const message =
        document.getElementById(
            "message"
        );


    if (!currentUser) {

        if (message) {

            message.textContent =
                "Please login first.";

        }

        return;

    }


    if (button) {

        button.disabled = true;

        button.textContent =
            "Saving...";

    }


    try {

        console.log(
            "Saving Frequency Avatar:",
            selectedAvatar
        );


        const {
            error
        } = await sb
            .from("profiles")
            .update({

                frequency_avatar:
                    selectedAvatar,

                avatar_type:
                    "frequency"

            })
            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {

            throw error;

        }


        if (message) {

            message.style.color =
                "#55dd77";

            message.textContent =
                `✅ Frequency Avatar #${selectedAvatar} saved!`;

        }


        /*
         * Give Supabase a moment to finish
         * before returning to profile.
         */

        setTimeout(
            function () {

                window.location.href =
                    "profile.html";

            },
            800
        );


    } catch (error) {

        console.error(
            "Frequency avatar save error:",
            error
        );


        if (message) {

            message.style.color =
                "#ff5555";

            message.textContent =
                "❌ Could not save avatar: " +
                error.message;

        }

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Save Selected Avatar";

        }

    }

}


// ==========================================
// START
// ==========================================

loadAvatarSystem();
