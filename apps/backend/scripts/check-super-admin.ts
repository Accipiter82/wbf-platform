import { superAdminUsersCollection } from "../src/services/mongodb-wrapper";

async function checkSuperAdmin() {
    try {
        console.log("Checking super admin users...");

        // Get all super admin users
        const adminSnapshot = await superAdminUsersCollection.get();

        if (adminSnapshot.empty) {
            console.log("❌ No super admin users found!");
            return;
        }

        console.log(`✅ Found ${adminSnapshot.size} super admin user(s):`);

        adminSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`📧 Email: ${data.email}`);
            console.log(`🆔 User ID (legacy firebaseUid): ${data.firebaseUid}`);
            console.log(`🆔 Document ID: ${doc.id}`);
            console.log(`👤 Name: ${data.name}`);
            console.log(`🔐 Role: ${data.role}`);
            console.log(`📅 Created: ${data.createdAt?.toDate?.() || data.createdAt}`);
            console.log("---");
        });

        // Test specific query by email
        const emailQuery = await superAdminUsersCollection
            .where("email", "==", "superadmin@wbf.com")
            .limit(1)
            .get();

        if (emailQuery.empty) {
            console.log("❌ Could not find superadmin@wbf.com by email query!");
        } else {
            console.log("✅ Found superadmin@wbf.com by email query");
            const doc = emailQuery.docs[0];
            const data = doc.data();

            // Test User ID query
            if (data.firebaseUid) {
                const uidQuery = await superAdminUsersCollection
                    .where("firebaseUid", "==", data.firebaseUid)
                    .limit(1)
                    .get();

                if (uidQuery.empty) {
                    console.log("❌ Could not find by firebaseUid query!");
                } else {
                    console.log("✅ Found by firebaseUid query");
                }
            }
        }

    } catch (error) {
        console.error("❌ Error checking super admin:", error);
    }
}

// Run the script
checkSuperAdmin()
    .then(() => {
        console.log("✅ Check completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Check failed:", error);
        process.exit(1);
    });
