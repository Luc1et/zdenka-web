const body = document.body;
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.site-nav a');
const revealItems = document.querySelectorAll('.reveal');
const magneticItems = document.querySelectorAll('.magnetic');
const tiltItem = document.querySelector('[data-tilt]');
const moreServicesTrigger = document.querySelector('.service-card-more');
const servicesGrid = document.querySelector('.services-grid');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealItems.forEach((item) => revealObserver.observe(item));

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    header.classList.toggle('menu-open');
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    header.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    header.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('pointermove', (event) => {
  body.classList.add('pointer-ready');
  const x = `${(event.clientX / window.innerWidth) * 100}%`;
  const y = `${(event.clientY / window.innerHeight) * 100}%`;
  document.documentElement.style.setProperty('--mx', x);
  document.documentElement.style.setProperty('--my', y);
});

magneticItems.forEach((item) => {
  item.addEventListener('pointermove', (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = item.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;

    item.style.transform = `translate(${x * 0.04}px, ${y * 0.04}px)`;
  });

  item.addEventListener('pointerleave', () => {
    item.style.transform = '';
  });
});

if (tiltItem) {
  tiltItem.addEventListener('pointermove', (event) => {
    if (window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = tiltItem.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rx = (py - 0.5) * -7;
    const ry = (px - 0.5) * 7;

    tiltItem.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  tiltItem.addEventListener('pointerleave', () => {
    tiltItem.style.transform = '';
  });
}

if (moreServicesTrigger && servicesGrid) {
  moreServicesTrigger.addEventListener('click', () => {
    servicesGrid.classList.add('is-expanded');
    moreServicesTrigger.setAttribute('aria-expanded', 'true');
  });
}
