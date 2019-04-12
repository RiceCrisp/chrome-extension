chrome.runtime.onInstalled.addListener(function() {
  fetch('https://source.unsplash.com/1600x900/?nature')
    .then(res => {
      chrome.storage.sync.set({'tags': 'nature'}, function() {
      })
    })
})
