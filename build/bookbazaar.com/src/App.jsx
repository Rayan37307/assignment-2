
import React from "react";
import Hero from "./Hero";
import Contact from "./Contact";
import './App.css';

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Book Bazaar</h1>
        <p>Buy and sell books online</p>
      </header>
      <main className="app-main">
        <Hero />
        <Contact />
      </main>
    </div>
  );
}
