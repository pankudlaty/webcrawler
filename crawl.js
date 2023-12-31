const { JSDOM } = require('jsdom')
function normalizeURL(rawURL) {
  const myURL = new URL(rawURL);
  let fullPath = `${myURL.hostname}${myURL.pathname}`
  if (fullPath.length > 0 && fullPath.slice(-1) === '/') {
    fullPath = fullPath.slice(0, -1)
  }
  return fullPath
}
function getURLsFromHTML(htmlBody, baseURL) {
  let absoluteURLs = []
  let listURLs = []
  const dom = new JSDOM(htmlBody)
  const relURLs = dom.window.document.querySelectorAll("a")
  for (let i = 0; i < relURLs.length; i++) {
    listURLs.push(relURLs[i].href);
  }
  for (let url in listURLs) {
    if (listURLs[url].startsWith('http') || listURLs[url].startsWith('https')) {
      absoluteURLs.push(listURLs[url])
    } else if (!listURLs[url].startsWith('/')) {
      continue
    } else {
      absoluteURLs.push(`${baseURL}${listURLs[url]}`)
    }
  }
  return absoluteURLs
}

async function crawlPage(baseURL, currentURL, pages) {
  const currentUrlObj = new URL(currentURL)
  const baseUrlObj = new URL(baseURL)
  if (currentUrlObj.hostname !== baseUrlObj.hostname) {
    return pages
  }

  const normalizedURL = normalizeURL(currentURL)

  if (pages[normalizedURL] > 0) {
    pages[normalizedURL]++
    return pages
  }

  if (currentURL === baseURL) {
    pages[normalizedURL] = 0
  } else {
    pages[normalizedURL] = 1
  }
  console.log(`crawling: ${currentURL}`)
  let htmlBody = ''
  try {
    const response = await fetch(currentURL)
    if (response.status > 399) {
      console.log(`Http error: ${response.status}`)
      return pages
    }
    const contentType = response.headers.get('content-type')
    if (!contentType.includes('text/html')) {
      console.log(`Not html response: ${contentType}`)
      return pages
    }
    htmlBody = await response.text()
  } catch (err) {
    console.log(err.message)
  }

  const nextURLs = getURLsFromHTML(htmlBody, baseURL)
  for (const nextURL of nextURLs) {
    pages = await crawlPage(baseURL, nextURL, pages)
  }

  return pages
}




module.exports = {
  normalizeURL,
  getURLsFromHTML,
  crawlPage
}
