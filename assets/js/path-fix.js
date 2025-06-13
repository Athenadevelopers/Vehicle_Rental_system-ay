// This script helps fix path issues when deployed to GitHub Pages
;(() => {
  // Get the repository name from the URL
  function getRepoName() {
    const pathSegments = window.location.pathname.split("/")
    // If deployed to GitHub Pages, the first segment after the domain will be the repo name
    if (pathSegments.length > 1 && pathSegments[1] !== "") {
      return pathSegments[1]
    }
    return ""
  }

  // Fix relative paths in links and images
  function fixPaths() {
    const repoName = getRepoName()

    // If not deployed to GitHub Pages or running locally, do nothing
    if (!repoName || window.location.hostname === "localhost") {
      return
    }

    // Fix href attributes in links
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href")
      // Only fix relative paths that don't start with / or #
      if (href && !href.startsWith("http") && !href.startsWith("#") && !href.startsWith("/")) {
        link.setAttribute("href", `/${repoName}/${href}`)
      }
      // Fix absolute paths that start with / but not //
      else if (href && href.startsWith("/") && !href.startsWith("//") && !href.startsWith(`/${repoName}`)) {
        link.setAttribute("href", `/${repoName}${href}`)
      }
    })

    // Fix src attributes in images, scripts, etc.
    document.querySelectorAll("[src]").forEach((element) => {
      const src = element.getAttribute("src")
      // Only fix relative paths that don't start with / or data:
      if (src && !src.startsWith("http") && !src.startsWith("data:") && !src.startsWith("/")) {
        element.setAttribute("src", `/${repoName}/${src}`)
      }
      // Fix absolute paths that start with / but not //
      else if (src && src.startsWith("/") && !src.startsWith("//") && !src.startsWith(`/${repoName}`)) {
        element.setAttribute("src", `/${repoName}${src}`)
      }
    })

    // Fix form actions
    document.querySelectorAll("form[action]").forEach((form) => {
      const action = form.getAttribute("action")
      if (action && !action.startsWith("http") && !action.startsWith("#") && !action.startsWith("/")) {
        form.setAttribute("action", `/${repoName}/${action}`)
      } else if (action && action.startsWith("/") && !action.startsWith("//") && !action.startsWith(`/${repoName}`)) {
        form.setAttribute("action", `/${repoName}${action}`)
      }
    })

    console.log(`Path fix applied for GitHub Pages repository: ${repoName}`)
  }

  // Run the fix when the DOM is fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fixPaths)
  } else {
    fixPaths()
  }
})()
