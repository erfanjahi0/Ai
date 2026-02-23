// Scroll animations
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
document.querySelectorAll('.feature-card, .model-card, .section-title, .section-label').forEach(el => {
  el.classList.add('fade-up'); observer.observe(el);
});

// Hamburger
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => navLinks.classList.toggle('open'));

// Nav scroll
window.addEventListener('scroll', () => {
  document.querySelector('.nav').style.background =
    window.scrollY > 20 ? 'rgba(8,12,20,0.95)' : 'rgba(8,12,20,0.8)';
});
