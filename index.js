import fs from "fs";
import { parse } from "csv-parse/sync";
import path from "path";
import { execa } from "execa";

const BUILD_DIR = path.join(process.cwd(), "build");

// Hero options - keeping your original 3
const heroOptions = ["Quick", "Fast", "Speedy"];

async function checkDependencies() {
  try {
    await execa('npm', ['--version']);
    console.log("✅ npm is available");
    return true;
  } catch (error) {
    console.error("❌ npm is not available. Please install Node.js and npm.");
    return false;
  }
}

function sanitizeHTML(str) {
  if (!str) return '';
  const escapeMap = { 
    '<': '&lt;', 
    '>': '&gt;', 
    '"': '&quot;', 
    "'": '&#x27;', 
    '&': '&amp;' 
  };
  return str.replace(/[<>"'&]/g, match => escapeMap[match]);
}

async function main() {
  console.log("🚀 Website Generator Starting...\n");

  const dependenciesAvailable = await checkDependencies();
  if (!dependenciesAvailable) {
    process.exit(1);
  }

  if (!fs.existsSync("./websites.csv")) {
    console.error("❌ websites.csv file not found. Please create the file and try again.");
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync("./websites.csv", "utf-8");
    const businessData = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (businessData.length === 0) {
      console.error("❌ No data found in websites.csv");
      process.exit(1);
    }

    // Validate required columns
    const requiredColumns = ['domain', 'title', 'description', 'phone', 'address'];
    const firstRow = businessData[0];
    for (const col of requiredColumns) {
      if (!(col in firstRow)) {
        console.error(`❌ Required column '${col}' not found in websites.csv`);
        process.exit(1);
      }
    }

    if (fs.existsSync(BUILD_DIR)) {
      console.log(`⚠️  Build directory exists. Contents may be overwritten.`);
      console.log("   Press Ctrl+C to cancel, or waiting 3 seconds...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("   Continuing...\n");
    } else {
      fs.mkdirSync(BUILD_DIR, { recursive: true });
      console.log(`✅ Created build directory\n`);
    }

    // Shuffle hero options
    let shuffledHeroWords = [...heroOptions];
    for (let i = shuffledHeroWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledHeroWords[i], shuffledHeroWords[j]] = [shuffledHeroWords[j], shuffledHeroWords[i]];
    }

    let heroWordIndex = 0;
    let successCount = 0;
    let skipCount = 0;

    for (const [index, site] of businessData.entries()) {
      if (!site.domain || !site.title) {
        console.warn(`⚠️  Skipping row ${index + 2}: Missing domain or title`);
        skipCount++;
        continue;
      }

      const sanitizedDomain = site.domain.replace(/[^a-zA-Z0-9.-]/g, '_');
      const appDir = path.join(BUILD_DIR, sanitizedDomain);
      
      console.log(`\n[${index + 1}/${businessData.length}] Generating: ${site.domain}`);
      
      if (fs.existsSync(appDir)) {
        console.log(`⚠️  Directory exists. Skipping.`);
        skipCount++;
        continue;
      }
      
      try {
        // Create Vite React app
        await execa(
          "npx",
          ["create-vite@latest", sanitizedDomain, "--template", "react"],
          { cwd: BUILD_DIR, stdio: "pipe" }
        );

        await new Promise(resolve => setTimeout(resolve, 500));

        const srcDir = path.join(appDir, "src");
        if (!fs.existsSync(srcDir)) {
          fs.mkdirSync(srcDir, { recursive: true });
        }

        const heroWord = shuffledHeroWords[heroWordIndex % shuffledHeroWords.length];
        heroWordIndex++;

        const safeTitle = sanitizeHTML(site.title);
        const safeDescription = sanitizeHTML(site.description);
        const safePhone = sanitizeHTML(site.phone);
        const safeAddress = sanitizeHTML(site.address);

        // Hero Component
        const heroCode = `import React from "react";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-badge">${heroWord}</div>
        <h2 className="hero-title">Delivery Service in Dhaka</h2>
        <p className="hero-subtitle">We deliver excellence to your doorstep</p>
      </div>
    </section>
  );
}`;

        // Contact Component
        const contactCode = `import React from "react";

export default function Contact() {
  return (
    <section className="contact">
      <h3 className="contact-title">Get in Touch</h3>
      <div className="contact-grid">
        <div className="contact-card">
          <div className="contact-icon">📞</div>
          <div className="contact-details">
            <span className="contact-label">Phone</span>
            <a href="tel:${safePhone}" className="contact-value">${safePhone}</a>
          </div>
        </div>
        <div className="contact-card">
          <div className="contact-icon">📍</div>
          <div className="contact-details">
            <span className="contact-label">Address</span>
            <span className="contact-value">${safeAddress}</span>
          </div>
        </div>
      </div>
    </section>
  );
}`;

        // App Component
        const appJsCode = `import React from "react";
import Hero from "./Hero";
import Contact from "./Contact";
import './App.css';

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="main-title">${safeTitle}</h1>
          <p className="main-description">${safeDescription}</p>
        </div>
      </header>
      <main className="app-main">
        <Hero />
        <Contact />
      </main>
      <footer className="app-footer">
        <p>&copy; 2025 ${safeTitle}. All rights reserved.</p>
      </footer>
    </div>
  );
}`;

        // Modern, professional CSS with great design
        const appCssCode = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 3rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.main-title {
  font-size: 3rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.main-description {
  font-size: 1.25rem;
  color: #718096;
  max-width: 600px;
  margin: 0 auto;
}

.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.hero {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  color: white;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
  text-transform: capitalize;
}

.hero-subtitle {
  font-size: 1.1rem;
  opacity: 0.95;
  font-weight: 300;
}

.contact {
  background: white;
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.contact-title {
  font-size: 2rem;
  color: #2d3748;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 600;
}

.contact-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f6f8fb 0%, #eef2f7 100%);
  border-radius: 15px;
  transition: all 0.3s ease;
}

.contact-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.contact-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  flex-shrink: 0;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}

.contact-label {
  font-size: 0.9rem;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.contact-value {
  font-size: 1.1rem;
  color: #2d3748;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.3s ease;
}

.contact-value:hover {
  color: #667eea;
}

.app-footer {
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  padding: 2rem;
  text-align: center;
  color: white;
  font-size: 0.95rem;
}

.app-footer p {
  margin: 0;
}

@media (max-width: 768px) {
  .app-header {
    padding: 2rem 1.5rem;
  }

  .main-title {
    font-size: 2rem;
  }

  .main-description {
    font-size: 1rem;
  }

  .app-main {
    padding: 2rem 1.5rem;
    grid-template-columns: 1fr;
  }

  .hero {
    padding: 2rem 1.5rem;
    min-height: 250px;
  }

  .hero-title {
    font-size: 1.8rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .contact {
    padding: 2rem 1.5rem;
  }

  .contact-title {
    font-size: 1.5rem;
  }

  .contact-icon {
    font-size: 2rem;
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.75rem;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-badge {
    font-size: 0.8rem;
    padding: 0.4rem 1rem;
  }

  .contact-card {
    padding: 1rem;
    gap: 1rem;
  }
}`;

        // Base index.css
        const indexCssCode = `:root {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  width: 100%;
}`;

        // Write all files
        fs.writeFileSync(path.join(srcDir, "Hero.jsx"), heroCode);
        fs.writeFileSync(path.join(srcDir, "Contact.jsx"), contactCode);
        fs.writeFileSync(path.join(srcDir, "App.jsx"), appJsCode);
        fs.writeFileSync(path.join(srcDir, "App.css"), appCssCode);
        fs.writeFileSync(path.join(srcDir, "index.css"), indexCssCode);

        console.log(`✅ Successfully generated app for ${site.domain}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error generating ${site.domain}:`, error.message);
      }
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🎉 Generation Complete!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`⚠️  Skipped: ${skipCount}`);
    console.log(`\n📁 All apps are in: ${BUILD_DIR}`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. cd build/<domain-name>`);
    console.log(`   2. npm install`);
    console.log(`   3. npm run dev`);
    console.log(`${"=".repeat(50)}\n`);

  } catch (error) {
    console.error("❌ Error processing CSV:", error.message);
    process.exit(1);
  }
}

main();