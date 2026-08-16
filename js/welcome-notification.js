console.log("Vidlyra Welcome Notification loaded");

async function createWelcomeNotification() {

    try {

        // ======================================
        // GET CURRENT USER
        // ======================================

        const {
            data: userData,
            error: userError
        } = await sb.auth.getUser();

        if (userError || !userData.user) {
            return;
        }

        const user = userData.user;


        // ======================================
        // GET CREATOR NAME
        // ======================================

        const {
            data: profile,
            error: profileError
        } = await sb
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (profileError) {
            console.error(
                "Profile error:",
                profileError
            );
            return;
        }


        // ======================================
        // FIND ORIGINAL NAME
        // ======================================

        const creatorName =
            profile?.full_name ||
            profile?.name ||
            profile?.username ||
            "Creator";


        // ======================================
        // CHECK PREVIOUS WELCOME
        // ======================================

        const {
            data: previousNotifications,
            error: notificationError
        } = await sb
            .from("notifications")
            .select("id,title,message,created_at")
            .eq(
                "user_id",
                user.id
            )
            .eq(
                "type",
                "welcome"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(1);


        if (notificationError) {

            console.error(
                "Notification check error:",
                notificationError
            );

            return;
        }


        // ======================================
        // DETERMINE WELCOME MESSAGE
        // ======================================

        const isNewCreator =
            !previousNotifications ||
            previousNotifications.length === 0;


        let title;
        let message;


        if (isNewCreator) {

            title =
                "Welcome to Vidlyra!";

            message =
                `Welcome to Vidlyra, ${creatorName}! Your creator journey has officially started. Take the pen, create your story, and never stop moving forward.`;

        } else {

            title =
                "Welcome Back!";

            message =
                `Welcome back, ${creatorName}! The journey continues. Take the pen, keep creating, and never let the story end.`;

        }


        // ======================================
        // CREATE NOTIFICATION
        // ======================================

        const {
            error: insertError
        } = await sb
            .from("notifications")
            .insert({

                user_id:
                    user.id,

                title:
                    title,

                message:
                    message,

                type:
                    "welcome",

                is_read:
                    false

            });


        if (insertError) {

            console.error(
                "Welcome notification error:",
                insertError
            );

            return;
        }


        console.log(
            "Welcome notification created:",
            creatorName
        );


    } catch (error) {

        console.error(
            "Welcome notification failed:",
            error
        );

    }

}
