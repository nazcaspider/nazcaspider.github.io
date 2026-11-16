/**
* Template Name: MyPortfolio
* Updated: Sep 18 2023 with Bootstrap v5.3.2
* Template URL: https://bootstrapmade.com/myportfolio-bootstrap-portfolio-website-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * burgerMenu
   */
  const burgerMenu = select('.burger')
  on('click', '.burger', function(e) {
    burgerMenu.classList.toggle('active');
  })

  /**
   * Porfolio isotope and filter
   */
  window.addEventListener('load', () => {
    let portfolioContainer = select('#portfolio-grid');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.item',
      });

      let portfolioFilters = select('#filters a', true);

      on('click', '#filters a', function(e) {
        e.preventDefault();
        portfolioFilters.forEach(function(el) {
          el.classList.remove('active');
        });
        this.classList.add('active');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        portfolioIsotope.on('arrangeComplete', function() {
          AOS.refresh()
        });
      }, true);

      // Menu links like index.html#robotics open the grid pre-filtered;
      // #work shows everything.
      const applyHashFilter = () => {
        const key = location.hash.slice(1);
        if (!['work', 'robotics', 'startups', 'aviation'].includes(key)) return;
        const link = select(`#filters a[data-filter="${key === 'work' ? '*' : '.' + key}"]`);
        if (link) link.click();
        const navbar = select('#main-navbar');
        if (navbar && navbar.classList.contains('show')) {
          bootstrap.Collapse.getOrCreateInstance(navbar).hide();
          burgerMenu.classList.remove('active');
        }
        // offsetTop ignores the AOS fade-up transform that is still running.
        let top = 0;
        for (let n = select('#filters'); n; n = n.offsetParent) top += n.offsetTop;
        window.scrollTo({ top: Math.max(0, top - 20), behavior: 'instant' });
      };
      applyHashFilter();
      window.addEventListener('hashchange', applyHashFilter);
      // Picking the filter that is already in the URL fires no hashchange.
      on('click', '.custom-menu a[href^="index.html#"]', function() {
        if (this.hash === location.hash) applyHashFilter();
      }, true);
    }

  });

  /**
   * Testimonials slider
   */
  new Swiper('.testimonials-slider', {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    })
  });

})()