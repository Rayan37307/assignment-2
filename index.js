import fs from "fs";
import { parse } from "csv-parse/sync";
import path from "path";
import { execa } from "execa";

const BUILD_DIR = path.join(process.cwd(), "build");

// Hero options
const heroOptions = ["Quick", "Fast", "Speedy"];

async function checkDependencies() {
  try {
    // Check if npm is available
    await execa('npm', ['--version']);
    console.log("✅ npm is available");
    return true;
  } catch (error) {
    console.error("❌ npm is not available. Please install Node.js and npm.");
    return false;
  }
}

async function main() {
  // Check dependencies
  const dependenciesAvailable = await checkDependencies();
  if (!dependenciesAvailable) {
    process.exit(1);
  }

  // Check if websites.csv exists
  if (!fs.existsSync("./websites.csv")) {
    console.error("❌ websites.csv file not found. Please create the file and try again.");
    process.exit(1);
  }

  try {
    // Read CSV
    const fileContent = fs.readFileSync("./websites.csv", "utf-8");
    const businessData = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Validate that CSV has required columns
    if (businessData.length > 0) {
      const requiredColumns = ['domain', 'title', 'description', 'phone', 'address'];
      const firstRow = businessData[0];
      for (const col of requiredColumns) {
        if (!(col in firstRow)) {
          console.error(`❌ Required column '${col}' not found in websites.csv`);
          process.exit(1);
        }
      }
    }

    // Check if build directory exists and warn user
    if (fs.existsSync(BUILD_DIR)) {
      console.log(`⚠️  The 'build' directory already exists. Contents may be overwritten.`);
      console.log("   Press Ctrl+C to cancel, or wait 3 seconds to continue...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("   Continuing with app generation...\n");
    } else {
      // Create build folder
      fs.mkdirSync(BUILD_DIR, { recursive: true });
      console.log(`✅ Created build directory at: ${BUILD_DIR}`);
    }

    for (const [index, site] of businessData.entries()) {
      // Validate required fields exist for each site
      if (!site.domain || !site.title) {
        console.warn(`⚠️  Skipping entry at row ${index + 2}: Missing domain or title`);
        continue;
      }

      // Sanitize domain name for use as directory name
      const sanitizedDomain = site.domain.replace(/[^a-zA-Z0-9.-]/g, '_');
      const appDir = path.join(BUILD_DIR, sanitizedDomain);
      
      console.log(`\n➡ Generating Vite React app for: ${site.domain}`);
      
      // Check if app directory already exists
      if (fs.existsSync(appDir)) {
        console.log(`⚠️  Directory for ${site.domain} already exists. Skipping app creation.`);
        continue;
      }
      
      try {
        // 1️⃣ Create Vite React app non-interactive
        await execa(
          "npx",
          ["create-vite@latest", sanitizedDomain, "--template", "react", "--yes"],
          { cwd: BUILD_DIR, stdio: "inherit" }
        );

        // Wait a moment to ensure directory structure is created
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Ensure src directory exists with error handling
        const srcDir = path.join(appDir, "src");
        try {
          if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir, { recursive: true });
          }
        } catch (mkdirError) {
          console.error(`❌ Error creating src directory for ${site.domain}:`, mkdirError.message);
          continue; // Skip this site and continue with the next one
        }

        // Pick a random hero word
        const randomHeroWord = heroOptions[Math.floor(Math.random() * heroOptions.length)];

        // Sanitize content to prevent injection issues in generated files
        const safeTitle = site.title.replace(/[<>"'&]/g, (match) => {
          const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
          return escapeMap[match];
        });
        
        const safeDescription = site.description.replace(/[<>"'&]/g, (match) => {
          const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
          return escapeMap[match];
        });
        
        const safePhone = site.phone.replace(/[<>"'&]/g, (match) => {
          const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
          return escapeMap[match];
        });
        
        const safeAddress = site.address.replace(/[<>"'&]/g, (match) => {
          const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
          return escapeMap[match];
        });

        // 2️⃣ Write Hero.jsx with error handling
        const heroCode = `
import React from "react";

export default function Hero() {
  return <h1>${randomHeroWord} delivery service in dhaka.</h1>;
}
`;
        try {
          fs.writeFileSync(path.join(srcDir, "Hero.jsx"), heroCode);
        } catch (writeError) {
          console.error(`❌ Error writing Hero.jsx for ${site.domain}:`, writeError.message);
          continue; // Skip this site and continue with the next one
        }

        // 3️⃣ Write Contact.jsx with error handling
        const contactCode = `
import React from "react";

export default function Contact() {
  return (
    <>
      <p>Phone: ${safePhone}</p>
      <p>Address: ${safeAddress}</p>
    </>
  );
}
`;
        try {
          fs.writeFileSync(path.join(srcDir, "Contact.jsx"), contactCode);
        } catch (writeError) {
          console.error(`❌ Error writing Contact.jsx for ${site.domain}:`, writeError.message);
          continue; // Skip this site and continue with the next one
        }

        // 4️⃣ Update App.jsx with error handling
        const appJsCode = `
import React from "react";
import Hero from "./Hero";
import Contact from "./Contact";

export default function App() {
  return (
    <div>
      <h1>${safeTitle}</h1>
      <p>${safeDescription}</p>
      <Hero />
      <Contact />
    </div>
  );
}
`;
        try {
          fs.writeFileSync(path.join(srcDir, "App.jsx"), appJsCode);
        } catch (writeError) {
          console.error(`❌ Error writing App.jsx for ${site.domain}:`, writeError.message);
          continue; // Skip this site and continue with the next one
        }

        console.log(`✅ React app for ${site.domain} is ready!`);
      } catch (error) {
        console.error(`❌ Error generating app for ${site.domain}:`, error.message);
      }
    }

    console.log("\n🎉 All apps generated inside /build folder. Run npm install & npm run dev inside each folder.");
  } catch (error) {
    console.error("❌ Error processing CSV file:", error.message);
    process.exit(1);
  }
}

// Run the main function
main();