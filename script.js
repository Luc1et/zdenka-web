const body = document.body;
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.site-nav a');
const revealItems = document.querySelectorAll('.reveal');
const magneticItems = document.querySelectorAll('.magnetic');
const tiltItem = document.querySelector('[data-tilt]');
const moreServicesTrigger = document.querySelector('.service-card-more');
const moreServicesCta = document.querySelector('.service-card-more-cta');
const servicesGrid = document.querySelector('.services-grid');
const supportsFinePointer = window.matchMedia(
  '(hover: hover) and (pointer: fine)'
).matches;
const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
const heroRevealItems = document.querySelectorAll('.hero .reveal');

const getHeaderOffset = () => header?.getBoundingClientRect().height ?? 0;

const scrollToHashTarget = (hash, { behavior = 'smooth' } = {}) => {
  if (!hash || hash === '#') return false;

  const target = document.querySelector(hash);
  if (!target) return false;

  const headerOffset = getHeaderOffset();
  const targetRect = target.getBoundingClientRect();
  const targetTopAbsolute = targetRect.top + window.scrollY;
  const availableViewportHeight = window.innerHeight - headerOffset;
  const centerOffset = Math.max(
    (availableViewportHeight - targetRect.height) / 2,
    0
  );
  const targetTop = targetTopAbsolute - headerOffset - centerOffset;
  const maxScrollTop =
    document.documentElement.scrollHeight - window.innerHeight;

  window.scrollTo({
    top: Math.min(Math.max(targetTop, 0), Math.max(maxScrollTop, 0)),
    behavior,
  });

  return true;
};

const scheduleDeferredWork = (callback) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 1200 });
    return;
  }

  window.setTimeout(callback, 180);
};

heroRevealItems.forEach((item) => item.classList.add('is-visible'));

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    header.classList.toggle('menu-open');
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');

    if (hash?.startsWith('#')) {
      event.preventDefault();
      scrollToHashTarget(hash);
      window.history.pushState(null, '', hash);
    }

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

const expandMoreServices = () => {
  if (!moreServicesTrigger || !servicesGrid) return;
  if (!servicesGrid.classList.contains('is-expanded')) {
    servicesGrid.classList.add('is-expanded');
    moreServicesTrigger.setAttribute('aria-expanded', 'true');
  }
};

scheduleDeferredWork(() => {
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

  revealItems.forEach((item) => {
    if (item.closest('.hero')) return;
    revealObserver.observe(item);
  });

  if (supportsFinePointer) {
    let pointerRaf = 0;
    let lastPointerEvent = null;

    window.addEventListener(
      'pointermove',
      (event) => {
        lastPointerEvent = event;

        if (pointerRaf) return;

        pointerRaf = window.requestAnimationFrame(() => {
          if (!lastPointerEvent) return;

          body.classList.add('pointer-ready');
          const x = `${(lastPointerEvent.clientX / window.innerWidth) * 100}%`;
          const y = `${(lastPointerEvent.clientY / window.innerHeight) * 100}%`;
          document.documentElement.style.setProperty('--mx', x);
          document.documentElement.style.setProperty('--my', y);
          pointerRaf = 0;
        });
      },
      { passive: true }
    );
  }

  if (supportsFinePointer && !reducedMotion) {
    magneticItems.forEach((item) => {
      item.addEventListener(
        'pointermove',
        (event) => {
          const rect = item.getBoundingClientRect();
          const x = event.clientX - rect.left - rect.width / 2;
          const y = event.clientY - rect.top - rect.height / 2;

          item.style.transform = `translate(${x * 0.04}px, ${y * 0.04}px)`;
        },
        { passive: true }
      );

      item.addEventListener('pointerleave', () => {
        item.style.transform = '';
      });
    });
  }

  if (tiltItem && supportsFinePointer && !reducedMotion) {
    tiltItem.addEventListener(
      'pointermove',
      (event) => {
        if (window.innerWidth < 768) return;

        const rect = tiltItem.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rx = (py - 0.5) * -7;
        const ry = (px - 0.5) * 7;

        tiltItem.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      },
      { passive: true }
    );

    tiltItem.addEventListener('pointerleave', () => {
      tiltItem.style.transform = '';
    });
  }

  if (moreServicesCta) {
    moreServicesCta.addEventListener('click', (event) => {
      event.preventDefault();
      expandMoreServices();
      scrollToHashTarget('#dalsi');
    });
  }
});
