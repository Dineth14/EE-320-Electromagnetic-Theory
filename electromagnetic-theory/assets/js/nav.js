/* ============================================================
   Sidebar Navigation Controller
   ============================================================ */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const mainContent = document.querySelector('.main-content');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', function () {
        sidebar.classList.toggle('collapsed');
        sidebar.classList.toggle('open');
        if (mainContent) mainContent.classList.toggle('expanded');
      });
    }

    // Highlight active page
    const links = document.querySelectorAll('.sidebar-nav a');
    const currentPath = window.location.pathname;
    links.forEach(function (link) {
      const href = link.getAttribute('href');
      if (href && currentPath.includes(href.replace(/^\.\.\//, '').replace(/^\.\//, ''))) {
        link.classList.add('active');
      }
    });

    // Collapsible sections
    document.querySelectorAll('.collapsible-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        this.classList.toggle('open');
        const content = this.nextElementSibling;
        if (content) content.classList.toggle('open');
      });
    });

    // Right-TOC scroll spy
    const tocLinks = document.querySelectorAll('.right-toc a');
    if (tocLinks.length > 0) {
      const headings = [];
      tocLinks.forEach(function (a) {
        const id = a.getAttribute('href');
        if (id && id.startsWith('#')) {
          const el = document.querySelector(id);
          if (el) headings.push({ el: el, link: a });
        }
      });

      window.addEventListener('scroll', function () {
        let current = headings[0];
        headings.forEach(function (h) {
          if (h.el.getBoundingClientRect().top <= 120) current = h;
        });
        tocLinks.forEach(function (l) { l.classList.remove('active'); });
        if (current) current.link.classList.add('active');
      });
    }

    // Progress tracker
    trackProgress();
  });

  function trackProgress() {
    const visited = JSON.parse(localStorage.getItem('em-visited') || '{}');
    const path = window.location.pathname;
    const chapterMatch = path.match(/chapters\/(\d+-[\w-]+)/);
    if (chapterMatch) {
      visited[chapterMatch[1]] = true;
      localStorage.setItem('em-visited', JSON.stringify(visited));
    }
  }

  window.getVisitedChapters = function () {
    return JSON.parse(localStorage.getItem('em-visited') || '{}');
  };
})();
