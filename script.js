document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initStatsCounter();
  initScrollAnimations();
  initParticleEffects();
  initNeuralNetwork();
});

function initNavbar() {
  const navbar = document.querySelector(".navbar");
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenuBtn.classList.toggle("active");
      if (navLinks) {
        navLinks.classList.toggle("mobile-open");
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

function initStatsCounter() {
  const statNumbers = document.querySelectorAll(".stat-number[data-target]");

  const observerOptions = {
    threshold: 0.5,
    rootMargin: "0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  statNumbers.forEach((stat) => observer.observe(stat));
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute("data-target"));
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

function initScrollAnimations() {
  const animatedElements = document.querySelectorAll(
    ".problem-card, .ai-card, .quantum-card, .output-item, .spec-card, .legend-item",
  );

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }, index * 100);
      }
    });
  }, observerOptions);

  animatedElements.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });

  const impactBars = document.querySelectorAll(".bar-fill");
  const barObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animation = "fillBar 1.5s ease-out forwards";
        }
      });
    },
    { threshold: 0.5 },
  );

  impactBars.forEach((bar) => barObserver.observe(bar));

  const accuracyMeters = document.querySelectorAll(".meter-fill");
  const meterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animation = "fillMeter 2s ease-out forwards";
        }
      });
    },
    { threshold: 0.5 },
  );

  accuracyMeters.forEach((meter) => meterObserver.observe(meter));
}

function initParticleEffects() {
  const particleField = document.querySelector(".particle-field");
  if (!particleField) return;

  for (let i = 0; i < 30; i++) {
    createParticle(particleField);
  }
}

function createParticle(container) {
  const particle = document.createElement("div");
  particle.className = "floating-particle";

  const size = Math.random() * 4 + 2;
  const startX = Math.random() * 100;
  const startY = Math.random() * 100;
  const duration = Math.random() * 10 + 10;
  const delay = Math.random() * 5;

  const colors = ["#00d4aa", "#667eea", "#ffd700"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${startX}%;
        top: ${startY}%;
        opacity: 0.5;
        box-shadow: 0 0 ${size * 2}px ${color};
        animation: floatParticle ${duration}s ${delay}s infinite ease-in-out;
        pointer-events: none;
    `;

  container.appendChild(particle);
}

function initNeuralNetwork() {
  const neurons = document.querySelectorAll(".neuron");

  neurons.forEach((neuron, index) => {
    neuron.style.animationDelay = `${index * 0.2}s`;
  });

  setInterval(() => {
    neurons.forEach((neuron, index) => {
      setTimeout(() => {
        neuron.classList.add("pulse");
        setTimeout(() => neuron.classList.remove("pulse"), 500);
      }, index * 100);
    });
  }, 3000);
}

const chartSegments = document.querySelectorAll(".donut-chart .segment");
const legendItems = document.querySelectorAll(".legend-item");

legendItems.forEach((item, index) => {
  item.addEventListener("mouseenter", () => {
    chartSegments.forEach((seg, i) => {
      if (i === index) {
        seg.style.strokeWidth = "35";
        seg.style.filter = "brightness(1.3)";
      } else {
        seg.style.opacity = "0.3";
      }
    });
  });

  item.addEventListener("mouseleave", () => {
    chartSegments.forEach((seg) => {
      seg.style.strokeWidth = "30";
      seg.style.filter = "none";
      seg.style.opacity = "1";
    });
  });
});

window.addEventListener("scroll", () => {
  const quantumSection = document.querySelector(".quantum-section");
  if (!quantumSection) return;

  const rect = quantumSection.getBoundingClientRect();
  const scrollPercent = -rect.top / window.innerHeight;

  if (scrollPercent > -1 && scrollPercent < 2) {
    const qubitGrid = quantumSection.querySelector(".qubit-grid");
    if (qubitGrid) {
      qubitGrid.style.transform = `translateY(${scrollPercent * 50}px)`;
    }
  }
});

document
  .querySelectorAll(".btn-primary, .btn-secondary, .btn-outline")
  .forEach((btn) => {
    btn.addEventListener("mouseenter", function (e) {
      const x = e.clientX - this.getBoundingClientRect().left;
      const y = e.clientY - this.getBoundingClientRect().top;

      const ripple = document.createElement("span");
      ripple.className = "btn-ripple";
      ripple.style.cssText = `
            position: absolute;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            left: ${x}px;
            top: ${y}px;
            animation: rippleEffect 0.6s ease-out forwards;
            pointer-events: none;
        `;

      this.style.position = "relative";
      this.style.overflow = "hidden";
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

const style = document.createElement("style");
style.textContent = `
    @keyframes rippleEffect {
        to {
            width: 300px;
            height: 300px;
            opacity: 0;
        }
    }
    
    .neuron.pulse {
        transform: scale(1.3) !important;
        box-shadow: 0 0 20px var(--color-primary) !important;
    }
    
    @keyframes floatParticle {
        0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
        }
        25% {
            transform: translate(10px, -20px) scale(1.2);
            opacity: 0.8;
        }
        50% {
            transform: translate(-5px, -40px) scale(0.8);
            opacity: 0.3;
        }
        75% {
            transform: translate(15px, -20px) scale(1.1);
            opacity: 0.6;
        }
    }
    
    .nav-links.mobile-open {
        display: flex !important;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(10, 10, 15, 0.98);
        padding: 20px;
        gap: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .mobile-menu-btn.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .mobile-menu-btn.active span:nth-child(2) {
        opacity: 0;
    }
    
    .mobile-menu-btn.active span:nth-child(3) {
        transform: rotate(-45deg) translate(5px, -5px);
    }
`;
document.head.appendChild(style);

function initTypingEffect() {
  const titleHighlight = document.querySelector(".title-highlight");
  if (!titleHighlight) return;

  const text = titleHighlight.textContent;
  titleHighlight.textContent = "";
  titleHighlight.style.borderLeft = "3px solid var(--color-primary)";

  let i = 0;
  const typing = setInterval(() => {
    if (i < text.length) {
      titleHighlight.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(typing);
      titleHighlight.style.borderLeft = "none";
    }
  }, 50);
}

setTimeout(initTypingEffect, 500);

window.addEventListener("load", () => {
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.5s ease";

  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 100);
});

console.log(
  `
%c🧱 NanoBrick %c- Transforming Agricultural Waste into Future Building Materials

%c✨ Technologies Used:
   • AI-Powered Classification (92%+ Accuracy)
   • Quantum Computing Optimization (VQE, D-Wave)
   • Advanced Nanocellulose Engineering

%c🌍 Building a sustainable future, one brick at a time.
`,
  "color: #00d4aa; font-size: 24px; font-weight: bold;",
  "color: #667eea; font-size: 16px;",
  "color: #ffd700; font-size: 12px;",
  "color: #90ee90; font-size: 12px; font-style: italic;",
);
