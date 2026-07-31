/**
 * Version and repo selector for header dropdowns
 * Data loaded from hispark_version.js (injected inline in header.html)
 */
(function () {
  'use strict';

  // Wait for hispark_version.js to load
  function initSelectors() {
    if (typeof HISPARK_DOCUMENTATIONS === 'undefined') {
      setTimeout(initSelectors, 100);
      return;
    }

    var currentRepoTarget = USER_DEFINED_OPTIONS.REPO_PATH
    var curRepo = (HISPARK_DOCUMENTATIONS.REPOS || []).find(function (e) {
      return e.path === currentRepoTarget;
    });
    if (!curRepo) return;

    var currentVersion = DOCUMENTATION_OPTIONS.VERSION;
    var language = DOCUMENTATION_OPTIONS.LANGUAGE;
    var rootUrl = USER_DEFINED_OPTIONS.ROOT_URL || '';
    var languagePath = language && language !== 'zh' ? '/' + language + '/' : '/';

    // --- Helper functions ---
    function getCurrentRepo() {
      return (HISPARK_DOCUMENTATIONS.REPOS || []).find(function (e) {
        return e.path === USER_DEFINED_OPTIONS.REPO_PATH
      }) || {};
    }

    function getCurrentVersion(versionName) {
      var repo = getCurrentRepo();
      var versionList = (repo.branches || []).concat(repo.tags || []);
      var found = versionList.find(function (e) { return e.name === versionName; });
      return found ? found.path : '';
    }

    function getCurrentRepoTarget(repoName) {
      return (HISPARK_DOCUMENTATIONS.REPOS || []).find(function (e) {
        return e.name === repoName;
      }) || {};
    }

    function buildUrl(repoPath, versionPath) {
      return rootUrl + '/' + repoPath + languagePath + versionPath;
    }

    // --- Version Selector ---
    var versionSelect = document.getElementById('version-select');
    var versionSelector = document.querySelector('.version-selector');
    var versionOptions = document.getElementById('version-options');
    var versionReadOnly = document.querySelector('.version-readOnly');

    var versionWrapper = document.querySelector('.version-select.custom-select');

    if (versionSelector && versionOptions && versionSelect && versionWrapper) {
      // Prevent duplicate event listeners on re-init
      if (versionWrapper.dataset.initialized) return;
      versionWrapper.dataset.initialized = 'true';
      // Toggle dropdown on click (on the whole wrapper including label)
      function toggleVersionDropdown(e) {
        e.stopPropagation();
        var isOpen = versionOptions.style.display === 'block';
        if (isOpen) {
          versionOptions.style.display = 'none';
          versionWrapper.classList.remove('active');
        } else {
          // Close repo dropdown if open
          var repoOptions = document.getElementById('repo-options');
          var repoWrapper = document.querySelector('.repo-select.custom-select');
          if (repoOptions) repoOptions.style.display = 'none';
          if (repoWrapper) repoWrapper.classList.remove('active');

          versionOptions.style.display = 'block';
          versionWrapper.classList.add('active');
          versionSelect.focus();
        }
      }
      versionWrapper.addEventListener('click', toggleVersionDropdown);

      // Blur handler
      versionSelect.addEventListener('blur', function () {
        setTimeout(function () {
          versionOptions.style.display = 'none';
          versionWrapper.classList.remove('active');
        }, 150);
      });

      // Option click
      versionOptions.addEventListener('mousedown', function (e) {
         var target = e.target;
         if (target.classList.contains('option')) {
          versionSelect.value = target.innerText;
          versionSelector.setAttribute('title', versionSelect.value);
          versionReadOnly.textContent = versionSelect.value;
          versionSelect.dispatchEvent(new Event('change'));
          versionOptions.style.display = 'none';
          versionWrapper.classList.remove('active');
        }
      });

      // Change handler - navigate on version change
      versionSelect.addEventListener('change', function () {
        var version = getCurrentVersion(versionSelect.value);
        if (!currentRepoTarget || !version) {
          console.error('未找到版本');
          return;
        }
        var hrefUrl = buildUrl(currentRepoTarget, version);
        console.log('Version change: ' + hrefUrl);
        window.location.href = hrefUrl;
      });

      // Populate version options
      var releaseVersions = curRepo.tags || [];
      var preReleaseVersions = curRepo.branches || [];

      // Clear existing options before re-populating (for re-init after instant nav)
      versionOptions.innerHTML = '';
      while (versionSelect.firstChild) versionSelect.removeChild(versionSelect.firstChild);

      var releaseTitle = document.createElement('li');
      releaseTitle.className = 'opTitle';
      releaseTitle.textContent = 'Release';
      versionOptions.appendChild(releaseTitle);

      releaseVersions.forEach(function (version) {
        var option = document.createElement('li');
        option.className = 'option';
        option.title = version.name;
        option.textContent = version.name;
        versionOptions.appendChild(option);
      });

      var previewTitle = document.createElement('li');
      previewTitle.className = 'opTitle';
      previewTitle.textContent = 'Preview';
      versionOptions.appendChild(previewTitle);

      preReleaseVersions.forEach(function (version) {
        var option = document.createElement('li');
        option.className = 'option';
        option.title = version.name;
        option.textContent = version.name;
        versionOptions.appendChild(option);
      });

      // Set current value
      var allVersions = preReleaseVersions.concat(releaseVersions);
      var currentVer = allVersions.find(function (e) { return e.path === currentVersion; });
      if (currentVer) {
        versionSelect.value = currentVer.name;
        versionSelector.setAttribute('title', currentVer.name);
        versionReadOnly.textContent = currentVer.name;
      }

      // Add options to select element for value binding
      releaseVersions.forEach(function (version) {
        var option = document.createElement('option');
        option.value = version.name;
        option.textContent = version.name;
        versionSelect.appendChild(option);
      });

      preReleaseVersions.forEach(function (version) {
        var option = document.createElement('option');
        option.value = version.name;
        option.textContent = version.name;
        versionSelect.appendChild(option);
      });
    }

    // --- Repo Selector ---
    var repoSelect = document.getElementById('repo-select');
    var repoSelector = document.querySelector('.repo-selector');
    var repoOptions = document.getElementById('repo-options');
    var repoReadOnly = document.querySelector('.repo-readOnly');

    var repoWrapper = document.querySelector('.repo-select.custom-select');

    if (repoSelector && repoOptions && repoSelect && repoWrapper) {
      // Prevent duplicate event listeners on re-init
      if (repoWrapper.dataset.initialized) return;
      repoWrapper.dataset.initialized = 'true';
      // Toggle dropdown on click (on the whole wrapper including label)
      function toggleRepoDropdown(e) {
        e.stopPropagation();
        var isOpen = repoOptions.style.display === 'block';
        if (isOpen) {
          repoOptions.style.display = 'none';
          repoWrapper.classList.remove('active');
        } else {
          // Close version dropdown if open
          if (versionOptions) versionOptions.style.display = 'none';
          if (versionWrapper) versionWrapper.classList.remove('active');

          repoOptions.style.display = 'block';
          repoWrapper.classList.add('active');
          repoSelect.focus();
        }
      }
      repoWrapper.addEventListener('click', toggleRepoDropdown);

      // Blur handler
      repoSelect.addEventListener('blur', function () {
        setTimeout(function () {
          repoOptions.style.display = 'none';
          repoWrapper.classList.remove('active');
        }, 150);
      });

      // Option click
      repoOptions.addEventListener('mousedown', function (e) {
        var target = e.target;
        if (target.classList.contains('option')) {
          repoSelect.value = target.innerText;
          repoSelector.setAttribute('title', repoSelect.value);
          repoReadOnly.textContent = repoSelect.value;
          repoSelect.dispatchEvent(new Event('change'));
          repoOptions.style.display = 'none';
          repoWrapper.classList.remove('active');
        }
      });

      // Change handler - navigate on repo change
      repoSelect.addEventListener('change', function () {
        var repo = getCurrentRepoTarget(repoSelect.value);
        if (!repo || !repo.path || !repo.default_version) {
          console.error('项目未找到');
          return;
        }
        var hrefUrl = buildUrl(repo.path, repo.default_version);
        console.log('Repo change: ' + hrefUrl);
        window.location.href = hrefUrl;
      });

      // Populate repo options
      // Clear existing options before re-populating
      repoOptions.innerHTML = '';
      while (repoSelect.firstChild) repoSelect.removeChild(repoSelect.firstChild);

      var repoTargets = (HISPARK_DOCUMENTATIONS.REPOS || []).map(function (e) {
        return { text: e.name, value: e.path };
      });

      // Set current value
      var currentRepoVal = repoTargets.find(function (e) { return e.value === currentRepoTarget; });
      if (currentRepoVal) {
        repoSelect.value = currentRepoVal.text;
        repoSelector.setAttribute('title', currentRepoVal.text);
        repoReadOnly.textContent = currentRepoVal.text;
      }

      // Add options to select element for value binding
      repoTargets.forEach(function (repoTarget) {
        var option = document.createElement('option');
        option.value = repoTarget.text;
        option.textContent = repoTarget.text;
        repoSelect.appendChild(option);
      });

      // Hide repo selector if only one repo
      // if (repoTargets.length <= 1) {
      //   document.querySelector('.repo-select').style.display = 'none';
      //   document.querySelector('.version-select').classList.add('only-version');
      // }

      repoTargets.forEach(function (repoTarget) {
        var option = document.createElement('li');
        option.className = 'option';
        option.title = repoTarget.text;
        option.textContent = repoTarget.text;
        repoOptions.appendChild(option);
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function () {
      if (versionOptions) versionOptions.style.display = 'none';
      if (versionWrapper) versionWrapper.classList.remove('active');
      if (repoOptions) repoOptions.style.display = 'none';
      if (repoWrapper) repoWrapper.classList.remove('active');
    });



  }



  // Expose for re-initialization after Material instant navigation
  window._initSelectors = initSelectors;

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initSelectors();
    });
  } else {
    initSelectors();
  }
  // Re-initialize after Material instant navigation rebuilds the sidebar.
  // Just one delayed attempt; the MutationObserver in custom.js is the primary trigger.
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSelectors, 300);
  });
})();