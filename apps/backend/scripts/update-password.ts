import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { connectMongoDB, getCollection, COLLECTIONS } from "../src/db-client";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function updatePassword() {
    try {
        console.log("Connecting to MongoDB...");
        await connectMongoDB();
        
        const email = "m.andonovski991@gmail.com";
        const newPassword = "Demopass!23";
        
        console.log(`Updating password for: ${email}`);
        
        // Hash the new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Get the organisations collection
        const organisationsCollection = await getCollection(COLLECTIONS.ORGANISATIONS);
        
        // Find the organisation by email
        const org = await organisationsCollection.findOne({
            contactEmail: email
        });
        
        if (!org) {
            console.error(`❌ Organisation not found with email: ${email}`);
            process.exit(1);
        }
        
        console.log(`✅ Found organisation: ${org.name || org.nameLocal || 'Unnamed'}`);
        console.log(`   ID: ${org._id}`);
        
        // Update the password hash
        const result = await organisationsCollection.updateOne(
            { _id: org._id },
            { $set: { passwordHash: hashedPassword } }
        );
        
        if (result.modifiedCount === 1) {
            console.log("✅ Password updated successfully!");
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 New password: ${newPassword}`);
        } else {
            console.error("❌ Failed to update password");
            process.exit(1);
        }
        
    } catch (error) {
        console.error("❌ Error updating password:", error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Run the script
updatePassword();

