# CSV to React App Generator

This project automatically reads data from a CSV file and generates individual React applications for each entry in the CSV. Each generated app is customized with the data from the corresponding row in the CSV file.

## Features

- Reads a CSV file containing website data
- Creates individual React applications for each entry
- Customizes each app with data from the CSV
- Generated apps are placed in the `build/` directory
- Each app includes business information in its components

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

## Installation

1. Clone this repository or download the source code.
2. Navigate to the project directory.
3. Install the dependencies:

```bash
npm install
```

## Usage

1. Prepare your `websites.csv` file with the required data.
2. Run the script to generate the React apps:

```bash
node index.js
```

3. The script will create individual React applications in the `build/` directory.
4. Navigate to any generated app directory and install dependencies:

```bash
cd build/[app-name]
npm install
npm run dev
```

## CSV Format

The `websites.csv` file should contain the following columns:

- `domain`: The domain name of the website
- `title`: The title of the website
- `description`: A description of the website
- `phone`: Contact phone number
- `address`: Physical address

Example:
```
domain,title,description,phone,address
foodexpress.com,Food Express,Delicious meals delivered fast,01712345678,"House 12, Road 5,
Banani, Dhaka"
techhubbd.com,Tech Hub BD,Your trusted tech partner,01898765432,"Level 4, Block B,
Dhanmondi, Dhaka"
```

## Generated Apps

Each generated app will contain:
- `App.jsx`: The main component containing the business title and description
- `Hero.jsx`: A hero section with a random descriptor word
- `Contact.jsx`: Contact information with phone and address

## Project Structure

After running the script, the following structure is created:

```
build/
├── [domain1]/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Hero.jsx
│   │   └── Contact.jsx
│   ├── ...
├── [domain2]/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Hero.jsx
│   │   └── Contact.jsx
│   ├── ...
```

## How It Works

1. The script reads the `websites.csv` file
2. For each entry in the CSV, it creates a new React app using Vite
3. It customizes the app components with the data from that row
4. The generated apps are placed in the `build/` directory under subdirectories named after the domain

## Customization

You can modify the component templates in `index.js` to change how the data is displayed in the generated applications.