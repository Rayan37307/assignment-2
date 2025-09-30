import fs from "fs";
import { parse } from "csv-parse/sync";
import path from "path";
import { execa } from "execa";

const BUILD_DIR = path.join(process.cwd(), "build");

// Hero options
const heroOptions = ["Quick", "Fast", "Speedy"];

try {
  // Read CSV
  const fileContent = fs.readFileSync("./websites.csv", "utf-8");
  const businessData = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  // Ensure build folder exists
  if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR);

  (async () => {
    for (const site of businessData) {
      const appDir = path.join(BUILD_DIR, site.domain);
      console.log(`\n➡ Generating Vite React app for: ${site.domain}`);

      // 1️⃣ Create Vite React app non-interactive
      await execa(
        "npx",
        ["create-vite@latest", site.domain, "--template", "react", "--yes"],
        { cwd: BUILD_DIR, stdio: "inherit" }
      );

      // Wait a moment to ensure directory structure is created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Ensure src directory exists
      const srcDir = path.join(appDir, "src");
      if (!fs.existsSync(srcDir)) {
        fs.mkdirSync(srcDir, { recursive: true });
      }

      // Pick a random hero word
      const randomHeroWord = heroOptions[Math.floor(Math.random() * heroOptions.length)];

      // 2️⃣ Write Hero.jsx
      const heroCode = `
import React from "react";

export default function Hero() {
  return <h1>${randomHeroWord} delivery service in dhaka.</h1>;
}
`;
      fs.writeFileSync(path.join(srcDir, "Hero.jsx"), heroCode);

      // 3️⃣ Write Contact.jsx
      const contactCode = `
import React from "react";

export default function Contact() {
  return (
    <>
      <p>Phone: ${site.phone}</p>
      <p>Address: ${site.address}</p>
    </>
  );
}
`;
      fs.writeFileSync(path.join(srcDir, "Contact.jsx"), contactCode);

      // 4️⃣ Update App.jsx
      const appJsCode = `
import React from "react";
import Hero from "./Hero";
import Contact from "./Contact";

export default function App() {
  return (
    <div>
      <Hero />
      <Contact />
    </div>
  );
}
`;
      fs.writeFileSync(path.join(srcDir, "App.jsx"), appJsCode);

      console.log(`✅ React app for ${site.domain} is ready!`);
    }

    console.log("\nAll apps generated inside /build folder. Run npm install & npm run dev inside each folder.");
  })();
} catch (error) {
  console.error(error);
}
