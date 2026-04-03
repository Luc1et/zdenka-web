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
const certificatesTrigger = document.querySelector('[data-certificates-open]');
const certificatesModal = document.getElementById('certifikaty-modal');
const certificatesModalDialog =
  certificatesModal?.querySelector('.story-modal-dialog');
const certificatesModalClose =
  certificatesModal?.querySelector('.story-modal-close');
const certificateDetailModal = document.getElementById('certifikat-detail-modal');
const certificateDetailDialog =
  certificateDetailModal?.querySelector('.story-modal-dialog');
const certificateDetailClose =
  certificateDetailModal?.querySelector('.story-modal-close');
const certificateCarouselViewport =
  certificateDetailModal?.querySelector('.certificate-carousel-viewport');
const certificateCarouselTrack =
  certificateDetailModal?.querySelector('.certificate-carousel-track');
const certificateDetailPrev =
  certificateDetailModal?.querySelector('[data-certificate-prev]');
const certificateDetailNext =
  certificateDetailModal?.querySelector('[data-certificate-next]');
const certificateDetailCurrent =
  certificateDetailModal?.querySelector('[data-certificate-current]');
const certificateDetailTotal =
  certificateDetailModal?.querySelector('[data-certificate-total]');
const certificateLinks = document.querySelectorAll('[data-certificate-detail]');
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
let storyModalOpenedViaTrigger = false;
let storyModalCanGoBack = false;
let headerPointerReveal = false;
let activeCertificateIndex = -1;
let certificateCarouselScrollTimer = 0;
let certificateCarouselArrowTimer = 0;
let isProgrammaticCertificateScroll = false;

const getHeaderOffset = () => header?.getBoundingClientRect().height ?? 0;
const isModalOpen = (modal) => modal?.classList.contains('is-open');
const getOpenModal = () => {
  const openModals = [...document.querySelectorAll('.story-modal.is-open')];

  return openModals.at(-1) ?? null;
};
const isStoryModalOpen = () => isModalOpen(storyModal);

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
  const scrollTop =
    hash === '#kontakt'
      ? Math.max(maxScrollTop, 0)
      : Math.min(Math.max(targetTop, 0), Math.max(maxScrollTop, 0));

  window.scrollTo({
    top: scrollTop,
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

const getModalFocusable = (modal) => {
  if (!modal) return [];

  return [...modal.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (item) => !item.hasAttribute('disabled') && !item.getAttribute('aria-hidden')
  );
};

const openModal = (modal, trigger = document.activeElement) => {
  if (!modal || isModalOpen(modal)) return;

  window.clearTimeout(modal.hideTimer);
  modal.returnFocusTo = trigger ?? document.activeElement;
  lockBodyScroll();
  togglePageInert(true);
  modal.hidden = false;

  window.requestAnimationFrame(() => {
    modal.classList.add('is-open');
    modal.querySelector('.story-modal-dialog')?.focus();
    modal.querySelector('.story-modal-close')?.focus();
  });
};

const closeModal = (modal, { restoreFocus = true } = {}) => {
  if (!modal || !isModalOpen(modal)) return;

  modal.classList.remove('is-open');

  modal.hideTimer = window.setTimeout(() => {
    modal.hidden = true;
  }, 320);

  if (!document.querySelector('.story-modal.is-open')) {
    togglePageInert(false);
    unlockBodyScroll();
  }

  if (restoreFocus && modal.returnFocusTo instanceof HTMLElement) {
    modal.returnFocusTo.focus({ preventScroll: true });
  }
};

const openStoryModal = (trigger = storyTrigger) => {
  openModal(storyModal, trigger);
};

const closeStoryModal = ({ restoreFocus = true } = {}) => {
  closeModal(storyModal, { restoreFocus });
  storyModalOpenedViaTrigger = false;
  storyModalCanGoBack = false;
};

const openCertificatesModal = (trigger = certificatesTrigger) => {
  openModal(certificatesModal, trigger);
};

const closeCertificatesModal = ({ restoreFocus = true } = {}) => {
  closeModal(certificatesModal, { restoreFocus });
};

const openCertificatesPreview = (trigger = certificatesTrigger) => {
  const firstCertificateLink = certificateLinks[0];

  if (!firstCertificateLink) return;

  openCertificateDetailModal(firstCertificateLink, trigger ?? firstCertificateLink);
};

const wrapCertificateIndex = (index) =>
  (index + certificateLinks.length) % certificateLinks.length;

const getCertificateCarouselSlides = () =>
  [...certificateCarouselTrack?.querySelectorAll('.certificate-carousel-slide') ?? []];

const getRealCertificateSlides = () =>
  getCertificateCarouselSlides().filter(
    (slide) => slide.dataset.certificateCopy === '1'
  );

const buildCertificateCarousel = () => {
  if (!certificateCarouselTrack || certificateCarouselTrack.childElementCount) return;

  const createSlideMarkup = (link, index, copyIndex) => {
    const image = link.querySelector('img');
    const src = link.getAttribute('href') ?? '';
    const alt = image?.getAttribute('alt') ?? 'Certifikát';

    return `
      <button
        class="certificate-carousel-slide"
        type="button"
        data-certificate-index="${index}"
        data-certificate-copy="${copyIndex}"
        aria-label="${alt}"
      >
        <img
          class="certificate-carousel-image"
          src="${src}"
          alt="${alt}"
          decoding="async"
        />
      </button>
    `;
  };

  const slidesMarkup = [0, 1, 2]
    .map((copyIndex) =>
      [...certificateLinks]
        .map((link, index) => createSlideMarkup(link, index, copyIndex))
        .join('')
    )
    .join('');

  certificateCarouselTrack.innerHTML = slidesMarkup;
};

const getCenteredCertificateSlide = () => {
  const slides = getCertificateCarouselSlides();

  if (!certificateCarouselViewport || !slides.length) return null;

  const viewportCenter =
    certificateCarouselViewport.scrollLeft +
    certificateCarouselViewport.clientWidth / 2;

  let nearestSlide = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  slides.forEach((slide) => {
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const distance = Math.abs(slideCenter - viewportCenter);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestSlide = slide;
    }
  });

  return nearestSlide;
};

const updateActiveCertificateSlide = () => {
  const slides = getCertificateCarouselSlides();
  const centeredSlide = getCenteredCertificateSlide();

  slides.forEach((slide) => {
    const isActive = slide === centeredSlide;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  if (certificateDetailCurrent) {
    certificateDetailCurrent.textContent = String(activeCertificateIndex + 1);
  }
};

const scrollToSlide = (targetSlide, { behavior = 'smooth' } = {}) => {
  if (!certificateCarouselViewport || !targetSlide) return;

  const targetLeft =
    targetSlide.offsetLeft -
    (certificateCarouselViewport.clientWidth - targetSlide.offsetWidth) / 2;

  const nextLeft = Math.max(targetLeft, 0);

  if (behavior === 'instant') {
    certificateCarouselViewport.scrollLeft = nextLeft;
    return;
  }

  certificateCarouselViewport.scrollTo({
    left: nextLeft,
    behavior,
  });
};

const getSlideByIndex = (index, { copy = 1 } = {}) =>
  getCertificateCarouselSlides().find(
    (slide) =>
      Number(slide.dataset.certificateIndex) === index &&
      Number(slide.dataset.certificateCopy) === copy
  );

const scrollToCertificate = (
  index,
  { behavior = 'smooth', copy = 1 } = {}
) => {
  const targetSlide = getSlideByIndex(index, { copy });
  scrollToSlide(targetSlide, { behavior });
};

const normalizeInfiniteCertificatePosition = () => {
  const centeredSlide = getCenteredCertificateSlide();

  if (!centeredSlide) return;

  const realIndex = Number(centeredSlide.dataset.certificateIndex);
  const copyIndex = Number(centeredSlide.dataset.certificateCopy);

  if (copyIndex === 1) return;

  const middleSlide = getSlideByIndex(realIndex, { copy: 1 });

  if (middleSlide) {
    scrollToSlide(middleSlide, { behavior: 'instant' });
  }
};

const updateActiveCertificateFromScroll = () => {
  const centeredSlide = getCenteredCertificateSlide();

  if (!centeredSlide) return;

  activeCertificateIndex = Number(centeredSlide.dataset.certificateIndex);
  updateActiveCertificateSlide();
};

const openCertificateDetailModal = (trigger, focusReturnTarget = trigger) => {
  if (!certificateCarouselTrack) return;

  buildCertificateCarousel();
  activeCertificateIndex = [...certificateLinks].indexOf(trigger);
  if (certificateDetailTotal) {
    certificateDetailTotal.textContent = String(certificateLinks.length);
  }
  openModal(certificateDetailModal, focusReturnTarget);

  window.requestAnimationFrame(() => {
    updateActiveCertificateSlide();
    scrollToCertificate(activeCertificateIndex, { behavior: 'instant', copy: 1 });
  });
};

const closeCertificateDetailModal = ({ restoreFocus = true } = {}) => {
  closeModal(certificateDetailModal, { restoreFocus });
  activeCertificateIndex = -1;
  window.clearTimeout(certificateCarouselScrollTimer);
  window.clearTimeout(certificateCarouselArrowTimer);
  isProgrammaticCertificateScroll = false;

  if (certificateDetailCurrent) {
    certificateDetailCurrent.textContent = '1';
  }
};

const showAdjacentCertificate = (direction) => {
  if (!certificateLinks.length || activeCertificateIndex < 0) return;

  const slides = getCertificateCarouselSlides();
  const centeredSlide = getCenteredCertificateSlide();
  const currentSlideIndex = slides.indexOf(centeredSlide);
  const targetSlide = slides[currentSlideIndex + direction];

  if (!targetSlide) return;

  activeCertificateIndex = Number(targetSlide.dataset.certificateIndex);
  updateActiveCertificateSlide();
  isProgrammaticCertificateScroll = true;
  scrollToSlide(targetSlide);
  certificateDetailModal.returnFocusTo = certificateLinks[activeCertificateIndex];

  window.clearTimeout(certificateCarouselArrowTimer);
  certificateCarouselArrowTimer = window.setTimeout(() => {
    normalizeInfiniteCertificatePosition();
    updateActiveCertificateFromScroll();
    isProgrammaticCertificateScroll = false;
  }, 360);
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

const requestCertificatesModalClose = () => {
  closeCertificatesModal();
};

const requestCertificateDetailModalClose = () => {
  closeCertificateDetailModal();
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
  const openModalElement = getOpenModal();

  if (openModalElement && event.key === 'Tab') {
    const focusable = getModalFocusable(openModalElement);
    const openModalDialog =
      openModalElement.querySelector('.story-modal-dialog');

    if (!focusable.length) {
      event.preventDefault();
      openModalDialog?.focus();
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
    if (isModalOpen(certificateDetailModal)) {
      requestCertificateDetailModalClose();
      return;
    }

    if (isModalOpen(certificatesModal)) {
      requestCertificatesModalClose();
      return;
    }

    if (isStoryModalOpen()) {
      requestStoryModalClose();
      return;
    }

    header.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    updateHeaderTopState();
  }

  if (isModalOpen(certificateDetailModal)) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      showAdjacentCertificate(-1);
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      showAdjacentCertificate(1);
    }
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

const initDeferredFeatures = () => {
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

  certificatesTrigger?.addEventListener('click', () => {
    openCertificatesPreview(certificatesTrigger);
  });

  certificatesModal?.addEventListener('click', (event) => {
    const closeTrigger = event.target.closest('[data-modal-close]');

    if (closeTrigger || event.target === certificatesModal) {
      requestCertificatesModalClose();
    }
  });

  certificatesModalClose?.addEventListener('click', () => {
    requestCertificatesModalClose();
  });

  certificatesModalDialog?.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  certificateLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openCertificateDetailModal(link);
    });
  });

  certificateDetailModal?.addEventListener('click', (event) => {
    const closeTrigger = event.target.closest('[data-certificate-detail-close]');

    if (closeTrigger || event.target === certificateDetailModal) {
      requestCertificateDetailModalClose();
    }
  });

  certificateDetailClose?.addEventListener('click', () => {
    requestCertificateDetailModalClose();
  });

  certificateDetailPrev?.addEventListener('click', () => {
    showAdjacentCertificate(-1);
  });

  certificateDetailNext?.addEventListener('click', () => {
    showAdjacentCertificate(1);
  });

  certificateCarouselTrack?.addEventListener('click', (event) => {
    const slide = event.target.closest('.certificate-carousel-slide');
    const nextIndex = Number(slide?.dataset.certificateIndex);

    if (!slide || Number.isNaN(nextIndex) || nextIndex === activeCertificateIndex) {
      return;
    }

    activeCertificateIndex = nextIndex;
    updateActiveCertificateSlide();
    isProgrammaticCertificateScroll = true;
    scrollToSlide(slide);

    window.clearTimeout(certificateCarouselArrowTimer);
    certificateCarouselArrowTimer = window.setTimeout(() => {
      normalizeInfiniteCertificatePosition();
      updateActiveCertificateFromScroll();
      isProgrammaticCertificateScroll = false;
    }, 360);
  });

  certificateCarouselViewport?.addEventListener(
    'scroll',
    () => {
      window.clearTimeout(certificateCarouselScrollTimer);
      certificateCarouselScrollTimer = window.setTimeout(() => {
        if (isProgrammaticCertificateScroll) return;
        updateActiveCertificateFromScroll();
        normalizeInfiniteCertificatePosition();
      }, 90);
    },
    { passive: true }
  );

  certificateDetailDialog?.addEventListener('click', (event) => {
    event.stopPropagation();
  });

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
};

window.addEventListener('load', () => {
  scheduleDeferredWork(initDeferredFeatures);
});
