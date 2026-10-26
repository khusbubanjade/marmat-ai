// Marmat.ai — interactive behaviour

document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Mobile menu toggle
  const header = document.querySelector(".site-header");
  const toggle = document.getElementById("menuToggle");

  if (toggle && header) {
    toggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("menu-open");
      toggle.classList.toggle("open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu when a link is clicked
    header.querySelectorAll(".nav a, .nav-actions a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("menu-open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Scroll reveal animation
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  // Contact form (front-end only; connect to your backend or CRM here)
  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");

  if (form && note) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const submitBtn = form.querySelector("button[type='submit']");

      submitBtn.disabled = true;
      note.textContent = "Sending your request...";

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();

        if (res.ok && result.ok) {
          note.textContent = result.message;
          form.reset();
        } else {
          note.textContent = result.errors ? result.errors.join(" ") : result.error || "Something went wrong. Please try again.";
        }
      } catch (err) {
        note.textContent = "Network error. Please check your connection and try again.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
});
