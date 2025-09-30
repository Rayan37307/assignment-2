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

    // Create a shuffled array of hero words to ensure uniqueness
    let shuffledHeroWords = [...heroOptions];
    for (let i = shuffledHeroWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledHeroWords[i], shuffledHeroWords[j]] = [shuffledHeroWords[j], shuffledHeroWords[i]];
    }
    
    // Counter for assigning unique hero words
    let heroWordIndex = 0;
    
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
          ["create-vite@latest", sanitizedDomain, "--template", "react", "--no-interactive"],
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

        // Get unique hero word for this site
        const heroWord = shuffledHeroWords[heroWordIndex % shuffledHeroWords.length];
        const randomHeroWord = heroWord;
        
        // Increment for next site
        heroWordIndex++;

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
  return (
    <div className="hero">
      <h2>${randomHeroWord} delivery service in dhaka.</h2>
    </div>
  );
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
    <div className="contact">
      <div className="contact-item">
        <strong>Phone:</strong> 
        <span>${safePhone}</span>
      </div>
      <div className="contact-item">
        <strong>Address:</strong> 
        <span>${safeAddress}</span>
      </div>
    </div>
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
import './App.css';

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>${safeTitle}</h1>
        <p>${safeDescription}</p>
      </header>
      <main className="app-main">
        <Hero />
        <Contact />
      </main>
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

        // 5️⃣ Update App.css with better styling
        const appCssCode = `
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Arial', sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  min-height: 100vh;
  box-sizing: border-box;
  width: 100%;
}

.app-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.app-header h1 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.app-header p {
  color: #7f8c8d;
  font-size: 1.2rem;
  margin: 0;
}

.app-main {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  width: 100%;
}

.hero, .contact {
  flex: 1;
  min-width: 300px; /* Minimum width before stacking */
  display: flex;
  flex-direction: column;
}

.hero {
  background: linear-gradient(90deg, #3498db, #2c3e50);
  color: white;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  justify-content: center;
  word-break: break-word;
}

.hero h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  word-wrap: break-word;
}

.contact {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  word-break: break-word;
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.contact-item strong {
  color: #2c3e50;
  font-size: 1.1rem;
}

.contact-item span {
  color: #7f8c8d;
  font-size: 1.1rem;
  padding-left: 0.5rem;
  word-wrap: break-word;
}

/* Enhanced Responsive design */
@media (max-width: 992px) {
  .app-container {
    padding: 1.5rem;
  }
  
  .app-header h1 {
    font-size: 2.2rem;
  }
  
  .hero h2 {
    font-size: 1.8rem;
  }
}

@media (max-width: 768px) {
  .app-main {
    flex-direction: column; /* Stack vertically on smaller screens */
  }
  
  .app-container {
    padding: 1rem;
  }
  
  .app-header {
    padding: 1.2rem;
  }
  
  .app-header h1 {
    font-size: 2rem;
  }
  
  .hero h2 {
    font-size: 1.6rem;
  }
  
  .contact {
    padding: 1.5rem;
  }
  
  .contact-item strong,
  .contact-item span {
    font-size: 1rem;
  }
}

@media (max-width: 576px) {
  .app-container {
    padding: 0.75rem;
  }
  
  .app-header h1 {
    font-size: 1.7rem;
  }
  
  .app-header p {
    font-size: 1rem;
  }
  
  .hero {
    padding: 1.5rem;
  }
  
  .hero h2 {
    font-size: 1.4rem;
  }
  
  .contact {
    padding: 1.2rem;
  }
  
  .contact-item strong,
  .contact-item span {
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .app-container {
    padding: 0.5rem;
  }
  
  .app-header {
    padding: 1rem;
  }
  
  .app-header h1 {
    font-size: 1.5rem;
  }
  
  .hero {
    padding: 1.2rem;
  }
  
  .hero h2 {
    font-size: 1.2rem;
  }
  
  .contact {
    padding: 1rem;
  }
}

/* Additional responsive adjustments for very small screens */
@media (max-width: 360px) {
  .app-header h1 {
    font-size: 1.3rem;
  }
  
  .hero h2 {
    font-size: 1.1rem;
  }
  
  .app-container {
    padding: 0.25rem;
  }
}

/* Responsive adjustments for larger screens */
@media (min-width: 1200px) {
  .app-container {
    padding: 2.5rem;
  }
  
  .app-header h1 {
    font-size: 2.8rem;
  }
  
  .hero h2 {
    font-size: 2.2rem;
  }
  
  .contact {
    padding: 2.5rem;
  }
}
`;

        try {
          fs.writeFileSync(path.join(srcDir, "App.css"), appCssCode);
        } catch (writeError) {
          console.error(`❌ Error writing App.css for ${site.domain}:`, writeError.message);
          continue; // Skip this site and continue with the next one
        }

        // 6️⃣ Update index.css for better base styling
        const indexCssCode = `
  :root {
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    font-weight: 400;

    color-scheme: light dark;
    color: rgba(255, 255, 255, 0.87);
    background-color: #f0f4f8;

    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    margin: 0;
    display: flex;
    min-width: 320px;
    min-height: 100vh;
    background-color: #f0f4f8;
  }

  h1,
  h2 {
    font-weight: 700;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      color: #242424;
      background-color: #ffffff;
    }
    
    body {
      background-color: #ffffff;
    }
  }
`;

        try {
          fs.writeFileSync(path.join(srcDir, "index.css"), indexCssCode);
        } catch (writeError) {
          console.error(`❌ Error writing index.css for ${site.domain}:`, writeError.message);
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