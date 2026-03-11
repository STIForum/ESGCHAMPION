/**
 * STIF Static Site - Main JavaScript
 * Handles all interactivity for the static site
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  initMobileMenu();
  initAccordions();
  initTabs();
  initSmoothScroll();
});

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
  const toggle = document.getElementById('mobileMenuToggle');
  const mobileNav = document.getElementById('mobileNav');
  
  if (!toggle || !mobileNav) return;
  
  const menuIcon = toggle.querySelector('.menu-icon');
  const closeIcon = toggle.querySelector('.close-icon');
  
  toggle.addEventListener('click', function() {
    const isOpen = mobileNav.classList.contains('open');
    
    if (isOpen) {
      mobileNav.classList.remove('open');
      if (menuIcon) menuIcon.classList.remove('hidden');
      if (closeIcon) closeIcon.classList.add('hidden');
    } else {
      mobileNav.classList.add('open');
      if (menuIcon) menuIcon.classList.add('hidden');
      if (closeIcon) closeIcon.classList.remove('hidden');
    }
  });
  
  // Close mobile menu when clicking a link
  const mobileLinks = mobileNav.querySelectorAll('a');
  mobileLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      mobileNav.classList.remove('open');
      if (menuIcon) menuIcon.classList.remove('hidden');
      if (closeIcon) closeIcon.classList.add('hidden');
    });
  });
}

/**
 * Accordion Components
 */
function initAccordions() {
  const accordionItems = document.querySelectorAll('.accordion-item');
  
  accordionItems.forEach(function(item) {
    const trigger = item.querySelector('.accordion-trigger');
    
    if (!trigger) return;
    
    trigger.addEventListener('click', function() {
      const isOpen = item.classList.contains('open');
      
      // Close all other accordions in the same container (single mode)
      const container = item.parentElement;
      const siblings = container.querySelectorAll('.accordion-item');
      
      siblings.forEach(function(sibling) {
        if (sibling !== item) {
          sibling.classList.remove('open');
        }
      });
      
      // Toggle current item
      if (isOpen) {
        item.classList.remove('open');
      } else {
        item.classList.add('open');
      }
    });
  });
}

/**
 * Tab Components
 */
function initTabs() {
  const tabContainer = document.getElementById('elevateTabs');
  
  if (!tabContainer) return;
  
  const tabButtons = tabContainer.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('[id^="tabContent"]');
  
  tabButtons.forEach(function(button, index) {
    button.addEventListener('click', function() {
      const tabIndex = button.getAttribute('data-tab');
      
      // Handle special navigation tabs
      if (tabIndex === '1') {
        // Scroll to "Grow as a Business" section
        const growSection = document.getElementById('grow-as-business');
        if (growSection) {
          growSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }
      
      if (tabIndex === '2') {
        // Scroll to "STIF Framework" section
        const frameworkSection = document.getElementById('stif-framework');
        if (frameworkSection) {
          frameworkSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }
      
      // Update active tab button
      tabButtons.forEach(function(btn) {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      
      // Update visible content
      tabContents.forEach(function(content) {
        content.classList.add('hidden');
      });
      
      const targetContent = document.getElementById('tabContent' + tabIndex);
      if (targetContent) {
        targetContent.classList.remove('hidden');
      }
    });
  });
}

/**
 * Smooth Scroll for anchor links
 */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(function(link) {
    link.addEventListener('click', function(e) {
      const href = link.getAttribute('href');
      
      // Skip if just "#"
      if (href === '#') return;
      
      const target = document.querySelector(href);
      
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Scroll to top when navigating to a new page
 * (for multi-page navigation simulation)
 */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/**
 * Hero video animation (optional enhancement)
 */
function initHeroAnimation() {
  const heroVideo = document.querySelector('.hero-video');
  
  if (!heroVideo) return;
  
  // Add subtle floating animation via JS if needed
  let animationFrame = 0;
  
  function animate() {
    animationFrame += 0.01;
    const yOffset = Math.sin(animationFrame) * 6;
    const xOffset = Math.cos(animationFrame * 0.7) * 2;
    
    heroVideo.style.transform = `translateY(${yOffset}px) translateX(${xOffset}px)`;
    
    requestAnimationFrame(animate);
  }
  
  // Uncomment to enable floating animation
  // animate();
}

/**
 * Active navigation link highlighting
 */
function updateActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(function(link) {
    const linkPath = link.getAttribute('href');
    
    // Check if current page matches link
    if (currentPath.endsWith(linkPath) || 
        (currentPath.endsWith('/') && linkPath === 'index.html') ||
        (currentPath.endsWith('/index.html') && linkPath === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Run on page load
updateActiveNavLink();
