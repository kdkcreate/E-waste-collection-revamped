document.querySelectorAll('.reveal').forEach((item) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { item.classList.add('on'); return; }
  new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('on'); observer.unobserve(entry.target); }
  }), { threshold: 0.12 }).observe(item);
});
