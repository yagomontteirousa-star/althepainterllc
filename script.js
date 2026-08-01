(() => {
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  const navLinks = [...document.querySelectorAll(".site-nav a")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const setMenu = (open) => {
    if (!menuToggle || !nav) return;

    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    header?.classList.toggle("is-menu-open", open);
    document.body.classList.toggle("menu-open", open);
  };

  menuToggle?.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (menuToggle?.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuToggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 960) setMenu(false);
  });

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealItems = [...document.querySelectorAll(".reveal")];

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    // Anything already on screen is shown straight away. The observer can be
    // delayed (or never fire, e.g. in a backgrounded tab), and the hero must
    // never be left sitting at opacity 0.
    revealItems.forEach((item) => {
      if (item.getBoundingClientRect().top < window.innerHeight) {
        item.classList.add("is-visible");
      }
    });

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealItems.forEach((item) => {
      if (!item.classList.contains("is-visible")) revealObserver.observe(item);
    });
  }

  const sections = [...document.querySelectorAll("main section[id]")];

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${visible.target.id}`;
          link.classList.toggle("is-active", isActive);

          if (isActive) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      {
        rootMargin: "-34% 0px -52% 0px",
        threshold: [0, 0.2, 0.5]
      }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* Testimonial marquee -------------------------------------------------- */

  const marquee = document.querySelector("[data-marquee]");

  if (marquee && !reducedMotion.matches) {
    const track = marquee.querySelector("[data-marquee-track]");
    const originals = [...track.children];

    if (originals.length) {
      // A second identical set makes the -50% loop point seamless.
      originals.forEach((node) => {
        const copy = node.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.querySelectorAll("a, button").forEach((control) => {
          control.tabIndex = -1;
        });
        track.append(copy);
      });

      const PIXELS_PER_SECOND = 46;
      let lastWidth = 0;

      const setDuration = () => {
        const half = track.scrollWidth / 2;
        if (!half || Math.abs(half - lastWidth) < 2) return;

        lastWidth = half;
        track.style.setProperty(
          "--marquee-duration",
          `${Math.round(half / PIXELS_PER_SECOND)}s`
        );
      };

      // Touch has no hover, so a tap would do nothing. Hold while pressed,
      // then keep it still for a beat after release so the card stays
      // readable instead of sliding away under the finger.
      let tapResumeTimer = null;

      const releaseTapPause = () => {
        window.clearTimeout(tapResumeTimer);
        tapResumeTimer = window.setTimeout(() => {
          marquee.removeAttribute("data-tap-paused");
        }, 1000);
      };

      marquee.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse") return;
        window.clearTimeout(tapResumeTimer);
        marquee.setAttribute("data-tap-paused", "");
      });

      marquee.addEventListener("pointerup", (event) => {
        if (event.pointerType === "mouse") return;
        releaseTapPause();
      });

      marquee.addEventListener("pointercancel", releaseTapPause);

      setDuration();
      marquee.setAttribute("data-ready", "");

      // Fonts land after first paint and change the measured width
      document.fonts?.ready.then(setDuration);

      let resizeTimer = null;
      window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(setDuration, 250);
      });
    }
  }

  /* Estimate form -------------------------------------------------------- */

  const form = document.querySelector("[data-estimate-form]");

  if (form) {
    const status = form.querySelector("[data-form-status]");
    const submit = form.querySelector("button[type='submit']");
    const looksLikeContact = (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ||
      value.replace(/\D/g, "").length >= 10;

    const setFieldError = (field, message) => {
      field.classList.toggle("has-error", Boolean(message));
      let note = field.querySelector(".field-error");

      if (!message) {
        note?.remove();
        field.querySelector("input, select, textarea")?.removeAttribute("aria-invalid");
        return;
      }

      if (!note) {
        note = document.createElement("span");
        note.className = "field-error";
        field.append(note);
      }

      note.textContent = message;
      field.querySelector("input, select, textarea")?.setAttribute("aria-invalid", "true");
    };

    const validate = () => {
      const problems = [];
      const name = form.elements.name;
      const contact = form.elements.contact;
      const projectType = form.elements.projectType;

      const checks = [
        [name, name.value.trim().length >= 2, "Please add your name."],
        [
          contact,
          looksLikeContact(contact.value.trim()),
          "Add a phone number or an email address."
        ],
        [projectType, Boolean(projectType.value), "Choose a project type."]
      ];

      checks.forEach(([element, valid, message]) => {
        const field = element.closest(".field");
        setFieldError(field, valid ? "" : message);
        if (!valid) problems.push(element);
      });

      return problems;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const problems = validate();

      if (problems.length) {
        status.textContent = "";
        problems[0].focus();
        return;
      }

      const endpoint = form.dataset.endpoint;
      const firstName = form.elements.name.value.trim().split(/\s+/)[0];

      if (!endpoint) {
        // No backend connected yet — confirm locally and point to the phone.
        status.textContent = `Thanks, ${firstName}. Online sending isn’t connected yet — please call (978) 562-6410 and Al will pick up right away.`;
        return;
      }

      submit.disabled = true;
      status.textContent = "Sending…";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form)
        });

        if (!response.ok) throw new Error(String(response.status));

        form.reset();
        status.textContent = `Thanks, ${firstName}. Your request is in — Al usually replies within one business day.`;
      } catch {
        status.textContent =
          "Something went wrong sending the form. Please call (978) 562-6410 instead.";
      } finally {
        submit.disabled = false;
      }
    });

    form.querySelectorAll("input, select, textarea").forEach((element) => {
      element.addEventListener("input", () => {
        const field = element.closest(".field");
        if (field?.classList.contains("has-error")) setFieldError(field, "");
      });
    });
  }

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
