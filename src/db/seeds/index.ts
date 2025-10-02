import 'dotenv/config';   // make sure env vars are loaded
import runSeed from './customerSeed'; // or wherever your runSeed is defined

(async () => {
  try {
    await runSeed();
    console.log("✅ Seeding finished!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
})();
