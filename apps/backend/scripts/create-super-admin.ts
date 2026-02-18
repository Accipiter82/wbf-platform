import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { superAdminUsersCollection } from "../src/services/mongodb-wrapper";
import { AdminUser } from "../src/types";

async function createSuperAdmin() {
    try {
        console.log("Creating super admin user...");

        const email = "superadmin@wbf.com";
        const password = "SuperAdmin123!";
        const name = "Super Administrator";

        // Check if super admin already exists
        const existingAdminQuery = await superAdminUsersCollection
            .where("email", "==", email)
            .limit(1)
            .get();

        if (!existingAdminQuery.empty) {
            console.log("Super admin user already exists!");
            return;
        }

        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create super admin record (no Firebase Auth needed)
        const adminId = uuidv4();
        const now = new Date();

        const adminData: Partial<AdminUser> = {
            email: email,
            name: name,
            role: "super_admin",
            createdAt: now,
            passwordHash: hashedPassword,
            firebaseUid: adminId, // Use adminId as uid since we're not using Firebase Auth
            loginCount: 0,
        };

        await superAdminUsersCollection.doc(adminId).set(adminData);

        console.log("✅ Super admin user created successfully!");
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`🆔 Admin ID: ${adminId}`);
        console.log("");
        console.log("⚠️  Please change the password after first login!");
        console.log(`🌐 Login URL: http://localhost:5173/admin/login`);

    } catch (error) {
        console.error("❌ Error creating super admin:", error);
        process.exit(1);
    }
}

// Run the script
createSuperAdmin()
    .then(() => {
        console.log("✅ Script completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
