const body = document.body;
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.site-nav a');
const hashLinks = document.querySelectorAll('a[href^="#"]');
const revealItems = document.querySelectorAll('.reveal');
const magneticItems = document.querySelectorAll('.magnetic');
const tiltItem = document.querySelector('[data-tilt]');
const moreServicesCta = document.querySelector('.services-more-link');
const lessServicesCta = document.querySelector('.services-less-link');
const servicesGrid = document.querySelector('.services-grid');
const serviceBookingLinks = document.querySelectorAll(
  '#nabidka .service-footer a[href^="tel:"]'
);
const storyTrigger = document.querySelector('.about-cta-link');
const storyModal = document.getElementById('pribeh-modal');
const storyModalDialog = storyModal?.querySelector('.story-modal-dialog');
const storyModalClose = storyModal?.querySelector('.story-modal-close');
const coarsePointerMq = window.matchMedia('(pointer: coarse)');
const supportsFinePointer = window.matchMedia(
  '(hover: hover) and (pointer: fine)'
).matches;
const desktopHeaderPointerMq = window.matchMedia(
  '(min-width: 1025px) and (hover: hover) and (pointer: fine)'
);
const desktopServicesContactMq = window.matchMedia('(min-width: 1025px)');
const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
const heroRevealItems = document.querySelectorAll('.hero .reveal');
const STORY_HASH = '#pribeh';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

let storyModalScrollY = 0;
let storyModalLastFocused = null;
let storyModalOpenedViaTrigger = false;
let storyModalCanGoBack = false;
let storyModalHideTimer = 0;
let headerPointerReveal = false;

const getHeaderOffset = () => header?.getBoundingClientRect().height ?? 0;
const isStoryModalOpen = () => storyModal?.classList.contains('is-open');

const syncHeaderTopState = (isTop) => {
  header?.classList.toggle('is-top', isTop);
  body.classList.toggle('is-header-top', isTop);
};

const updateHeaderTopState = () => {
  const isTopOfPage = window.scrollY <= 1;
  const menuOpen = header?.classList.contains('menu-open');
  const shouldRevealFromPointer =
    desktopHeaderPointerMq.matches && isTopOfPage && headerPointerReveal;

  syncHeaderTopState(isTopOfPage && !menuOpen && !shouldRevealFromPointer);
};

const scrollToHashTarget = (hash, { behavior = 'smooth' } = {}) => {
  if (!hash || hash === '#') return false;

  const target = document.querySelector(hash);
  if (!target) return false;

  const headerOffset = getHeaderOffset();
  const desktopServicesNudge =
    hash === '#nabidka' && desktopServicesContactMq.matches ? 14 : 0;
  const desktopServicesHeading =
    hash === '#nabidka' && desktopServicesContactMq.matches
      ? target.querySelector('.section-heading')
      : null;
  const desktopAboutHeading =
    hash === '#omne' && desktopServicesContactMq.matches
      ? target.querySelector('.section-heading h2')
      : null;
  const effectiveTarget = desktopServicesHeading ?? desktopAboutHeading ?? target;
  const targetRect = effectiveTarget.getBoundingClientRect();
  const targetTopAbsolute =
    desktopServicesHeading || desktopAboutHeading
      ? targetRect.bottom + window.scrollY
      : targetRect.top + window.scrollY;
  const availableViewportHeight = window.innerHeight - headerOffset;
  const centerOffset = Math.max(
    (availableViewportHeight - targetRect.height) / 2,
    0
  );
  const targetTop = desktopServicesHeading
    ? targetTopAbsolute - headerOffset + desktopServicesNudge
    : desktopAboutHeading
      ? targetTopAbsolute - headerOffset
      : targetTopAbsolute - headerOffset - centerOffset;
  const maxScrollTop =
    document.documentElement.scrollHeight - window.innerHeight;

  window.scrollTo({
    top: Math.min(Math.max(targetTop, 0), Math.max(maxScrollTop, 0)),
    behavior,
  });

  return true;
};

const lockBodyScroll = () => {
  if (body.classList.contains('story-modal-open')) return;

  storyModalScrollY = window.scrollY;
  const scrollbarCompensation =
    window.innerWidth - document.documentElement.clientWidth;

  document.documentElement.style.setProperty(
    '--story-scrollbar-comp',
    `${Math.max(scrollbarCompensation, 0)}px`
  );
  body.style.top = `-${storyModalScrollY}px`;
  body.classList.add('story-modal-open');
};

const unlockBodyScroll = () => {
  if (!body.classList.contains('story-modal-open')) return;

  body.classList.remove('story-modal-open');
  body.style.top = '';
  document.documentElement.style.removeProperty('--story-scrollbar-comp');
  window.scrollTo(0, storyModalScrollY);
};

const togglePageInert = (isInert) => {
  const main = document.querySelector('main');

  if (header) header.inert = isInert;
  if (main) main.inert = isInert;
};

const getStoryModalFocusable = () => {
  if (!storyModal) return [];

  return [...storyModal.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (item) => !item.hasAttribute('disabled') && !item.getAttribute('aria-hidden')
  );
};

const openStoryModal = (trigger = storyTrigger) => {
  if (!storyModal || isStoryModalOpen()) return;

  window.clearTimeout(storyModalHideTimer);
  storyModalLastFocused = trigger ?? document.activeElement;
  lockBodyScroll();
  togglePageInert(true);
  storyModal.hidden = false;

  window.requestAnimationFrame(() => {
    storyModal.classList.add('is-open');
    storyModalDialog?.focus();
    storyModalClose?.focus();
  });
};

const closeStoryModal = ({ restoreFocus = true } = {}) => {
  if (!storyModal || !isStoryModalOpen()) return;

  storyModal.classList.remove('is-open');
  togglePageInert(false);
  unlockBodyScroll();

  storyModalHideTimer = window.setTimeout(() => {
    storyModal.hidden = true;
  }, 320);

  if (restoreFocus && storyModalLastFocused instanceof HTMLElement) {
    storyModalLastFocused.focus({ preventScroll: true });
  }

  storyModalOpenedViaTrigger = false;
  storyModalCanGoBack = false;
};

const requestStoryModalClose = () => {
  if (!storyModal) return;

  if (window.location.hash === STORY_HASH) {
    if (storyModalCanGoBack) {
      window.history.back();
      return;
    }

    const fallbackUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, '', fallbackUrl);
  }

  closeStoryModal();
};

const syncStoryModalWithHash = ({ restoreFocus = true } = {}) => {
  if (!storyModal) return false;

  if (window.location.hash === STORY_HASH) {
    openStoryModal(storyTrigger);
    return true;
  }

  if (isStoryModalOpen()) {
    closeStoryModal({ restoreFocus });
    return true;
  }

  return false;
};

const scheduleDeferredWork = (callback) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 1200 });
    return;
  }

  window.setTimeout(callback, 180);
};

heroRevealItems.forEach((item) => item.classList.add('is-visible'));
updateHeaderTopState();
window.addEventListener('scroll', updateHeaderTopState, { passive: true });
window.addEventListener('resize', updateHeaderTopState, { passive: true });

window.addEventListener(
  'pointermove',
  (event) => {
    if (!desktopHeaderPointerMq.matches) {
      if (headerPointerReveal) {
        headerPointerReveal = false;
        updateHeaderTopState();
      }
      return;
    }

    const revealThreshold = Math.max(getHeaderOffset() + 20, 96);
    const nextReveal = event.clientY <= revealThreshold;

    if (nextReveal !== headerPointerReveal) {
      headerPointerReveal = nextReveal;
      updateHeaderTopState();
    }
  },
  { passive: true }
);

window.addEventListener('pointerleave', () => {
  if (!headerPointerReveal) return;
  headerPointerReveal = false;
  updateHeaderTopState();
});

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    header.classList.toggle('menu-open');
    updateHeaderTopState();
  });
}

hashLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');

    if (hash === STORY_HASH) {
      event.preventDefault();
      storyModalOpenedViaTrigger = true;
      storyModalCanGoBack = true;
      window.history.pushState({ storyModal: true }, '', STORY_HASH);
      openStoryModal(link);
      return;
    }

    if (hash?.startsWith('#')) {
      event.preventDefault();
      scrollToHashTarget(hash);
      window.history.pushState(null, '', hash);
    }

    if (link.closest('.site-nav')) {
      header.classList.remove('menu-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      updateHeaderTopState();
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (isStoryModalOpen() && event.key === 'Tab') {
    const focusable = getStoryModalFocusable();

    if (!focusable.length) {
      event.preventDefault();
      storyModalDialog?.focus();
      return;
    }

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  }

  if (event.key === 'Escape') {
    if (isStoryModalOpen()) {
      requestStoryModalClose();
      return;
    }

    header.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    updateHeaderTopState();
  }
});

window.addEventListener('load', () => {
  if (window.location.hash === STORY_HASH) {
    if (!window.history.state?.storyModal) {
      const fallbackUrl = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState({ storyModalBase: true }, '', fallbackUrl);
      window.history.pushState({ storyModal: true, direct: true }, '', STORY_HASH);
    }
    storyModalCanGoBack = true;
    syncStoryModalWithHash({ restoreFocus: false });
  } else if (window.location.hash) {
    scrollToHashTarget(window.location.hash, { behavior: 'auto' });
  }
  updateHeaderTopState();
});

window.addEventListener('hashchange', () => {
  if (window.location.hash === STORY_HASH) {
    storyModalCanGoBack = true;
    syncStoryModalWithHash({ restoreFocus: false });
  } else {
    syncStoryModalWithHash();
  }

  if (window.location.hash && window.location.hash !== STORY_HASH) {
    scrollToHashTarget(window.location.hash);
  }
  updateHeaderTopState();
});

const expandMoreServices = () => {
  if (!moreServicesCta || !servicesGrid) return;
  if (!servicesGrid.classList.contains('is-expanded')) {
    servicesGrid.classList.add('is-expanded');
    moreServicesCta.setAttribute('aria-expanded', 'true');
    lessServicesCta?.setAttribute('aria-expanded', 'true');
  }
};

const collapseMoreServices = () => {
  if (!servicesGrid) return;
  if (servicesGrid.classList.contains('is-expanded')) {
    servicesGrid.classList.remove('is-expanded');
    moreServicesCta?.setAttribute('aria-expanded', 'false');
    lessServicesCta?.setAttribute('aria-expanded', 'false');
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

  if (lessServicesCta) {
    lessServicesCta.addEventListener('click', () => {
      collapseMoreServices();
      scrollToHashTarget('#sluzba-dalsi');
    });
  }

  storyModal?.addEventListener('click', (event) => {
    const closeTrigger = event.target.closest('[data-story-close]');

    if (closeTrigger || event.target === storyModal) {
      requestStoryModalClose();
    }
  });

  storyModalClose?.addEventListener('click', () => {
    requestStoryModalClose();
  });

  storyModalDialog?.addEventListener('click', (event) => {
    if (
      coarsePointerMq.matches &&
      !event.target.closest('a, button, input, textarea, select, label')
    ) {
      requestStoryModalClose();
      return;
    }

    event.stopPropagation();
  });

  serviceBookingLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!desktopServicesContactMq.matches) return;

      event.preventDefault();
      scrollToHashTarget('#kontakt');
      window.history.pushState(null, '', '#kontakt');
    });
  });
});
