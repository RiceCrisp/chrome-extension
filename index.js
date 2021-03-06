const app = document.querySelector('#app')
const fade = document.querySelector('.fade')
const hideUiBtn = document.querySelector('#hide-ui-btn')
const settingsBtn = document.querySelector('#settings-btn')
const settingsForm = document.querySelector('.settings-form')
const refreshBtn = document.querySelector('#refresh-btn')
const lightbox = document.querySelector('.lightbox')
const thesaurus = document.querySelector('.thesaurus-form')

const d = new Date()
init()

function init() {
  chrome.storage.sync.get('tags', ({tags}) => {
    document.querySelector('#tags').value = tags
    refreshBg()
  })
  chrome.storage.sync.get('lastUpdate', ({lastUpdate}) => {
    if (d.getTime() - lastUpdate > 1*60*1000 || typeof lastUpdate === 'undefined') {
      updateWeather()
      updateTrello()
      updateNews()
      chrome.storage.sync.set({ 'lastUpdate': d.getTime() })
    }
  })
  getWeather()
  getTrello()
  getNews()
  getDate()
  initListeners()
}

function initListeners() {
  hideUiBtn.addEventListener('click', (e) => {
    e.preventDefault()
    if (!app.classList.contains('hide-ui')) {
      app.classList.add('hide-ui')
    }
    else {
      app.classList.remove('hide-ui')
    }
  })
  settingsBtn.addEventListener('click', (e) => {
    e.preventDefault()
    lightbox.classList.add('show')
  })
  refreshBtn.addEventListener('click', (e) => {
    e.preventDefault()
    refreshBg()
  })
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault()
    lightbox.classList.remove('show')
    chrome.storage.sync.set({ 'tags': document.querySelector('#tags').value })
  })
  thesaurus.addEventListener('submit', (e) => {
    e.preventDefault()
    window.location = `https://www.thesaurus.com/browse/${document.querySelector('#thesaurus').value}`
  })
  document.querySelector('#bookmarks').addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.update({ url: 'chrome://bookmarks' })
  })
}

function refreshBg() {
  const tags = document.querySelector('#tags').value
  refreshBtn.disabled = true
  fetch(`https://source.unsplash.com/1600x900/?${tags}`)
    .then(res => {
      app.classList.add('loaded')
      app.setAttribute('style', 'background-image: url(' + res.url + ')')
      refreshBtn.disabled = false
    })
}

function getDate() {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'Februrary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  document.querySelector('.date').innerHTML = `<h2>${weekdays[d.getDay()]}</h2><h3>${months[d.getMonth()]} ${d.getDate()}</h3>`
}

function updateTrello() {
  fetch('https://api.trello.com/1/members/blake_boucher/notifications?read_filter=unread&key=b02169ca8063fb06bd3e78064f2574be&token=4223c6c1e2ff330b003e58496f1a301a160209437cab36fb9fb12cba03b25a68')
    .then(res => {
      return res.json()
    })
    .then(res => {
      chrome.storage.sync.set({'trello': res})
      getTrello()
    })
}

function getTrello() {
  chrome.storage.sync.get('trello', ({trello}) => {
    console.log(trello)
    if (trello.length) {
      document.querySelector('.notification-list').innerHTML = trello.reduce((t, v) => {
        // console.log(v)
        text = v.data.text || ''
        if (v.type === 'removedFromCard') {
          text = 'Removed you from card'
        }
        else if (v.type === 'addedToCard') {
          text = 'Added you to card'
        }
        else if (v.type === 'changeCard') {
          text = 'Changed the due date'
        }
        else if (v.type === 'reactionAdded') {
          text += v.reactions.reduce((t, v) => {
            return t + v.native
          })
        }
        return t + `<li>
          <a href="https://trello.com/c/${v.data.card.shortLink}/">${v.data.board.name} &rarr; ${v.data.card.name}</a>
          <p>
            <b>${v.memberCreator.fullName}</b>
            <br />
            ${text}
          </p>
        </li>`
      }, '')
      document.querySelector('.notifications').innerHTML = trello.length;
    }
    else {
      document.querySelector('.notification-list').innerHTML = `<li><i>No Notifications</i> &#x1f389;</li>`
    }
  })
}

function updateNews() {
  fetch('https://newsapi.org/v2/top-headlines?country=us&apiKey=957c8d05152c4193bfab166f21f8b5aa')
    .then(res => {
      return res.json()
    })
    .then(res => {
      chrome.storage.sync.set({'news': res.articles.slice(0, 3)})
      getNews()
    })
}

function getNews() {
  chrome.storage.sync.get('news', ({news}) => {
    document.querySelector('.news-list').innerHTML = news.reduce((t, v) => {
      return t + `<li>
        <img src="${v.urlToImage}" alt="${v.title}" />
        <a href="${v.url}">${v.title}</a>
      </li>`
    }, '')
  })
}

function updateWeather() {
  fetch('http://api.openweathermap.org/data/2.5/weather?q=chicago&units=imperial&APPID=99c1b56b814b738c2e7b92c494291c5c')
    .then(res => {
      return res.json()
    })
    .then(res => {
      chrome.storage.sync.set({'weather': res})
      getWeather()
    })
}

function getWeather() {
  chrome.storage.sync.get('weather', ({weather}) => {
    document.querySelector('.weather .temp').innerHTML = Math.round(weather.main.temp)
    // Thunderstorm
    if ((weather.weather[0].id >= 200 && weather.weather[0].id <= 232) || (weather.weather[0].id >= 771 && weather.weather[0].id <= 781)) {
      document.querySelector('.weather .visual').innerHTML = '<path d="M13.802 13h3.042l-1.844 4h3l-6 7 2-5h-3l2.802-6zm6.62-5.484c-.178-3.232-3.031-5.777-6.432-5.491-1.087-1.24-2.693-2.025-4.49-2.025-3.172 0-5.754 2.443-5.922 5.516-2.033.359-3.578 2.105-3.578 4.206 0 2.362 1.949 4.278 4.354 4.278h1.326c.771 1.198 2.124 2 3.674 2h1.381l.935-2h-2.316c-1.297 0-2.354-1.021-2.354-2.278 0-2.118 2.104-2.597 3.488-2.513-.05-1.355.137-5.209 4.012-5.209 3.771 0 4.229 3.771 4.012 5.209 1.509-.105 3.488.437 3.488 2.513 0 1.257-1.057 2.278-2.355 2.278h-1.598l-.922 2h2.52c2.406 0 4.355-1.916 4.355-4.278 0-2.101-1.545-3.847-3.578-4.206zm-11.844 0c-2.022.357-3.697 2.127-3.551 4.484h-.673c-1.297 0-2.354-1.021-2.354-2.278 0-2.118 2.104-2.597 3.488-2.513-.05-1.355.137-5.209 4.012-5.209.967 0 1.714.25 2.29.645-1.823.921-3.096 2.745-3.212 4.871z"/>'
    }
    // Drizzle
    else if (weather.weather[0].id >= 300 && weather.weather[0].id <= 321) {
      document.querySelector('.weather .visual').innerHTML = '<path d="M20.422 8.516c-.178-3.233-3.031-5.778-6.432-5.492-1.087-1.239-2.693-2.024-4.49-2.024-3.172 0-5.754 2.443-5.922 5.516-2.033.359-3.578 2.105-3.578 4.206 0 2.362 1.949 4.278 4.354 4.278h1.326c.771 1.198 2.124 2 3.674 2h10.291c2.406 0 4.355-1.916 4.355-4.278 0-2.101-1.545-3.847-3.578-4.206zm-15.395 4.484h-.673c-1.297 0-2.354-1.022-2.354-2.278 0-2.118 2.104-2.597 3.488-2.512-.05-1.356.137-5.21 4.012-5.21.967 0 1.714.25 2.29.644-1.823.922-3.096 2.746-3.212 4.872-2.022.358-3.697 2.127-3.551 4.484zm14.618 2h-10.291c-1.297 0-2.354-1.022-2.354-2.278 0-2.118 2.104-2.597 3.488-2.512-.05-1.356.137-5.21 4.012-5.21 3.771 0 4.229 3.771 4.012 5.209 1.509-.105 3.488.437 3.488 2.513 0 1.256-1.057 2.278-2.355 2.278zm-14.063 8l-1.41-1.41 3.59-3.59 1.41 1.41-3.59 3.59zm8.543-3.59l-1.41-1.41-3.59 3.59 1.41 1.41 3.59-3.59zm4.875 0l-1.41-1.41-3.59 3.59 1.41 1.41 3.59-3.59z"/>'
    }
    // Rain
    else if (weather.weather[0].id >= 500 && weather.weather[0].id <= 531) {
      document.querySelector('.weather .visual').innerHTML = '<path d="M20.422 7.516c-.178-3.233-3.031-5.778-6.432-5.492-1.087-1.239-2.693-2.024-4.49-2.024-3.172 0-5.754 2.443-5.922 5.516-2.033.359-3.578 2.105-3.578 4.206 0 2.362 1.949 4.278 4.354 4.278h1.326c.771 1.198 2.124 2 3.674 2h10.291c2.406 0 4.355-1.916 4.355-4.278 0-2.101-1.545-3.847-3.578-4.206zm-15.395 4.484h-.673c-1.297 0-2.354-1.022-2.354-2.278 0-2.118 2.104-2.597 3.488-2.512-.05-1.356.137-5.21 4.012-5.21.967 0 1.714.25 2.29.644-1.823.922-3.096 2.746-3.212 4.872-2.022.358-3.697 2.127-3.551 4.484zm14.618 2h-10.291c-1.297 0-2.354-1.022-2.354-2.278 0-2.118 2.104-2.597 3.488-2.512-.05-1.356.137-5.21 4.012-5.21 3.771 0 4.229 3.771 4.012 5.209 1.509-.105 3.488.437 3.488 2.513 0 1.256-1.057 2.278-2.355 2.278zm-12.776 6.713l-1.41-1.41 2.303-2.303 1.41 1.41-2.303 2.303zm-3.3 3.287l-1.41-1.397 2.303-2.303 1.41 1.41-2.303 2.29zm8.253-3.287l-1.41-1.41 2.303-2.303 1.41 1.41-2.303 2.303zm-3.3 3.287l-1.41-1.397 2.303-2.303 1.41 1.41-2.303 2.29zm8.175-3.287l-1.41-1.41 2.303-2.303 1.41 1.41-2.303 2.303zm-3.301 3.287l-1.41-1.397 2.303-2.303 1.41 1.41-2.303 2.29z"/>'
    }
    // Snow
    else if (weather.weather[0].id >= 600 && weather.weather[0].id <= 622) {
      document.querySelector('.weather .visual').innerHTML = '<path d="M14 19.25c0 .689-.559 1.25-1.25 1.25s-1.25-.561-1.25-1.25.559-1.25 1.25-1.25 1.25.561 1.25 1.25zm-3.75 1.25c-.691 0-1.25.561-1.25 1.25s.559 1.25 1.25 1.25 1.25-.561 1.25-1.25-.559-1.25-1.25-1.25zm8.75-1.25c0 .689-.559 1.25-1.25 1.25s-1.25-.561-1.25-1.25.559-1.25 1.25-1.25 1.25.561 1.25 1.25zm-3.75 1.25c-.691 0-1.25.561-1.25 1.25s.559 1.25 1.25 1.25 1.25-.561 1.25-1.25-.559-1.25-1.25-1.25zm-6.25-1.25c0 .689-.559 1.25-1.25 1.25s-1.25-.561-1.25-1.25.559-1.25 1.25-1.25 1.25.561 1.25 1.25zm-3.75 1.25c-.691 0-1.25.561-1.25 1.25s.559 1.25 1.25 1.25 1.25-.561 1.25-1.25-.559-1.25-1.25-1.25zm18.75-7.778c0 2.362-1.949 4.278-4.355 4.278h-10.291c-1.55 0-2.902-.802-3.674-2h-1.326c-2.405 0-4.354-1.916-4.354-4.278 0-2.101 1.545-3.847 3.578-4.206.168-3.073 2.75-5.516 5.922-5.516 1.797 0 3.403.785 4.49 2.024 3.4-.286 6.254 2.259 6.432 5.491 2.033.36 3.578 2.106 3.578 4.207zm-15.422-4.206c.116-2.126 1.389-3.95 3.212-4.871-.576-.395-1.323-.645-2.29-.645-3.875 0-4.062 3.854-4.012 5.209-1.384-.084-3.488.395-3.488 2.513 0 1.257 1.057 2.278 2.354 2.278h.674c-.147-2.357 1.528-4.127 3.55-4.484zm13.422 4.206c0-2.075-1.979-2.618-3.488-2.513.217-1.438-.241-5.209-4.012-5.209-3.875 0-4.062 3.854-4.012 5.209-1.384-.084-3.488.395-3.488 2.513 0 1.257 1.057 2.278 2.354 2.278h10.291c1.298 0 2.355-1.021 2.355-2.278zm-5.521-3.97l-1.479.881v-1.633h-1v1.633l-1.494-.896-.506.867 1.499.896-1.499.865.537.867 1.463-.865v1.633h1v-1.633l1.467.869.533-.867-1.499-.869 1.499-.881-.521-.867z"/>'
    }
    // Fog
    else if (weather.weather[0].id >= 700 && weather.weather[0].id <= 762) {
      document.querySelector('.weather .visual').innerHTML = '<path d="M20.422 8.516c-.178-3.232-3.031-5.777-6.432-5.491-1.087-1.24-2.693-2.025-4.49-2.025-3.172 0-5.754 2.443-5.922 5.516-2.033.359-3.578 2.105-3.578 4.206 0 2.362 1.949 4.278 4.354 4.278h1.326c.771 1.198 2.124 2 3.674 2h10.291c2.406 0 4.355-1.916 4.355-4.278 0-2.101-1.545-3.847-3.578-4.206zm-15.395 4.484h-.673c-1.297 0-2.354-1.021-2.354-2.278 0-2.118 2.104-2.597 3.488-2.513-.05-1.355.137-5.209 4.012-5.209.967 0 1.714.25 2.29.645-1.823.921-3.096 2.745-3.212 4.871-2.022.357-3.697 2.127-3.551 4.484zm14.618 2h-10.291c-1.297 0-2.354-1.021-2.354-2.278 0-2.118 2.104-2.597 3.488-2.513-.05-1.355.137-5.209 4.012-5.209 3.771 0 4.229 3.771 4.012 5.209 1.509-.105 3.488.437 3.488 2.513 0 1.257-1.057 2.278-2.355 2.278zm4.355 5h-19v-2h19v2zm0 3h-19v-2h19v2z"/>'
    }
    // Clear
    else if (weather.weather[0].id === 800) {
      document.querySelector('.weather .visual').innerHTML = '<path d="M4.069 13h-4.069v-2h4.069c-.041.328-.069.661-.069 1s.028.672.069 1zm3.034-7.312l-2.881-2.881-1.414 1.414 2.881 2.881c.411-.529.885-1.003 1.414-1.414zm11.209 1.414l2.881-2.881-1.414-1.414-2.881 2.881c.528.411 1.002.886 1.414 1.414zm-6.312-3.102c.339 0 .672.028 1 .069v-4.069h-2v4.069c.328-.041.661-.069 1-.069zm0 16c-.339 0-.672-.028-1-.069v4.069h2v-4.069c-.328.041-.661.069-1 .069zm7.931-9c.041.328.069.661.069 1s-.028.672-.069 1h4.069v-2h-4.069zm-3.033 7.312l2.88 2.88 1.415-1.414-2.88-2.88c-.412.528-.886 1.002-1.415 1.414zm-11.21-1.415l-2.88 2.88 1.414 1.414 2.88-2.88c-.528-.411-1.003-.885-1.414-1.414zm2.312-4.897c0 2.206 1.794 4 4 4s4-1.794 4-4-1.794-4-4-4-4 1.794-4 4zm10 0c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6 6 2.686 6 6z"/>'
    }
    // Partially Cloudy
    else if (weather.weather[0].id >= 801 && weather.weather[0].id <= 802) {
      document.querySelector('.weather .visual').innerHTML = '<path d="M2.396 12h-2.396v-2h2.396v2zm7.604-6.458v-3.542h-2v3.542h2zm-4.793.876l-2.156-2.156-1.414 1.414 2.156 2.156 1.414-1.414zm9.461-2.396l-2.115 2.114 1.414 1.414 2.115-2.114-1.414-1.414zm-11.7 10.907l-2.198 1.919 1.303 1.517 2.198-1.919-1.303-1.517zm21.032 2.793c0 2.362-1.95 4.278-4.354 4.278h-10.292c-2.404 0-4.354-1.916-4.354-4.278 0-.77.211-1.49.574-2.113-.964-.907-1.574-2.18-1.574-3.609 0-2.762 2.238-5 5-5 1.329 0 2.523.528 3.414 1.376.649-.24 1.35-.376 2.086-.376 3.171 0 5.753 2.443 5.921 5.516 2.034.359 3.579 2.105 3.579 4.206zm-18-5.722c0 .86.37 1.628.955 2.172.485-.316 1.029-.551 1.624-.656.088-1.61.843-3.042 1.994-4.046-.46-.288-.991-.47-1.573-.47-1.654 0-3 1.346-3 3zm16 5.722c0-2.076-1.979-2.618-3.489-2.512.218-1.439-.24-5.21-4.011-5.21-3.875 0-4.062 3.854-4.011 5.209-1.385-.084-3.489.395-3.489 2.513 0 1.256 1.056 2.278 2.354 2.278h10.291c1.299 0 2.355-1.022 2.355-2.278z"/>'
    }
    // Cloudy
    else if (weather.weather[0].id >= 803 && weather.weather[0].id <= 804) {
      document.querySelector('.weather .visual').innerHTML = '<path d="M20.422 11.516c-.178-3.233-3.031-5.778-6.432-5.492-1.087-1.239-2.693-2.024-4.49-2.024-3.172 0-5.754 2.443-5.922 5.516-2.033.359-3.578 2.105-3.578 4.206 0 2.362 1.949 4.278 4.354 4.278h1.326c.771 1.198 2.124 2 3.674 2h10.291c2.406 0 4.355-1.916 4.355-4.278 0-2.101-1.545-3.847-3.578-4.206zm-15.395 4.484h-.673c-1.297 0-2.354-1.022-2.354-2.278 0-2.118 2.104-2.597 3.488-2.512-.05-1.356.137-5.21 4.012-5.21.967 0 1.714.25 2.29.644-1.823.922-3.096 2.746-3.212 4.872-2.022.358-3.697 2.127-3.551 4.484zm14.618 2h-10.291c-1.297 0-2.354-1.022-2.354-2.278 0-2.118 2.104-2.597 3.488-2.512-.05-1.356.137-5.21 4.012-5.21 3.771 0 4.229 3.771 4.012 5.209 1.509-.105 3.488.437 3.488 2.513 0 1.256-1.057 2.278-2.355 2.278z"/>'
    }
  })
}
