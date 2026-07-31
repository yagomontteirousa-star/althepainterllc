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

    revealItems.forEach((item) => revealObserver.observe(item));
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

  const setupCarousel = (carousel) => {
    const track = carousel.querySelector("[data-carousel-track]");
    const slides = [...carousel.querySelectorAll(".testimonial")];
    const previous = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    const pause = carousel.querySelector("[data-carousel-pause]");
    const current = carousel.querySelector("[data-carousel-current]");

    if (!track || slides.length < 2) return;

    let index = 0;
    let timer = null;
    let userPaused = reducedMotion.matches;
    let interactionPaused = false;
    let pointerStart = null;

    const isPaused = () =>
      userPaused || interactionPaused || document.visibilityState !== "visible";

    const syncPauseButton = () => {
      if (!pause) return;
      pause.setAttribute("aria-pressed", String(userPaused));
      pause.setAttribute(
        "aria-label",
        userPaused
          ? "Resume automatic testimonial rotation"
          : "Pause automatic testimonial rotation"
      );

      const label = pause.querySelector("span");
      if (label) label.textContent = userPaused ? "Play" : "Pause";
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = null;

      if (isPaused()) return;

      timer = window.setTimeout(() => {
        goTo(index + 1);
      }, 6500);
    };

    const render = () => {
      track.style.transform = `translate3d(${-index * 100}%, 0, 0)`;
      if (current) current.textContent = String(index + 1).padStart(2, "0");

      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.setAttribute("aria-hidden", String(!active));

        slide.querySelectorAll("a, button").forEach((control) => {
          control.tabIndex = active ? 0 : -1;
        });
      });

      schedule();
    };

    const goTo = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      render();
    };

    previous?.addEventListener("click", () => goTo(index - 1));
    next?.addEventListener("click", () => goTo(index + 1));

    pause?.addEventListener("click", () => {
      userPaused = !userPaused;
      syncPauseButton();
      schedule();
    });

    carousel.addEventListener("mouseenter", () => {
      interactionPaused = true;
      schedule();
    });

    carousel.addEventListener("mouseleave", () => {
      interactionPaused = false;
      schedule();
    });

    carousel.addEventListener("focusin", () => {
      interactionPaused = true;
      schedule();
    });

    carousel.addEventListener("focusout", (event) => {
      if (carousel.contains(event.relatedTarget)) return;
      interactionPaused = false;
      schedule();
    });

    carousel.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      pointerStart = { x: event.clientX, y: event.clientY };
    });

    carousel.addEventListener("pointerup", (event) => {
      if (!pointerStart) return;

      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;
      pointerStart = null;

      if (Math.abs(deltaX) < 42 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      goTo(index + (deltaX < 0 ? 1 : -1));
    });

    carousel.addEventListener("pointercancel", () => {
      pointerStart = null;
    });

    document.addEventListener("visibilitychange", schedule);
    reducedMotion.addEventListener?.("change", (event) => {
      if (event.matches) userPaused = true;
      syncPauseButton();
      schedule();
    });

    syncPauseButton();
    render();
  };

  document.querySelectorAll("[data-carousel]").forEach(setupCarousel);

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
