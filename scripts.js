var apiKey
var tagHash = {}
var allArtists = []
var rootArtist
var counter = 0
var workingWidth = 0
var height
var width
var tagText
var currentTag

function setWidth() {
  width = parseInt($('svg').attr('width'))
}
function setHeight() {
  height = parseInt($('svg').attr('height'))
}

function setApiKey() {
  $('form#api-key-form').on('submit', function(e) {
    e.preventDefault()
    apiKey = $('input#key').val()
  })
}

$(document).ready(function() {
  setWidth()
  setHeight()
  setApiKey()
  formSubmit()
  moreArtists()
  resetAll()
  tagHover()
})

function resetAll() {
  $('button#reset').on('click', function() {
    allArtists = []
    workingWidth = 0
    counter = 0
    tagHash = {}
    $('input#artist-name').val('')
    $('svg').remove()
    $('div#svg-canvas').append(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewbox="0 0 ${width} ${height}"></svg>`)
    $('#tags').text("")
  })
}

function formSubmit() {
  $('form#artist-name-form').on('submit', function(e) {
    e.preventDefault()
    var name = $('input#artist-name').val().replace("&", "and")
    getTags(name)
    $('#buttons').show();
    $('#main').css({"display": "inline-block"})
    artist1 = createRoot(name);
    artist1.addToCanvas()
  })
}

function getTags(name) {
  $.get('http://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=' + name + '&api_key=' + apiKey + '&format=json', function(data) {
      for (i = 0; i < 10; i++) {
        if (tagHash[data["toptags"]["tag"][i]["name"]] === undefined) {
          tagHash[data["toptags"]["tag"][i]["name"]] = 1
        } else {
          tagHash[data["toptags"]["tag"][i]["name"]] += 1
        }
      };
      var sorted = sortHash(tagHash);
      const toInsert = $.map(sorted, function(tag, idx) {
        return `<span class="tag" alt="${tagHash[tag]}">${tag}</span>`
      })
      $('div#tags').html(toInsert.join(" | "));
      tagHover()
    })
}

function sortHash(tagHash) {
  var keys = Object.keys(tagHash);
  return keys.sort(function(a,b) {return tagHash[b] - tagHash[a]});
}

function tagHover() {
  $('span.tag').on('mouseover',function() {
    tagText = $(this).text()
    var tagCount = $(this).attr('alt')


    tagCount = Array(Math.round((tagText.length/2))).join("&nbsp;") + tagCount + Array(Math.round((tagText.length/2))).join("&nbsp;")
    $(this).html(tagCount)
  })
  $('span.tag').on('mouseout',function() {
    $(this).text(tagText)
  })
}

function createRoot(name) {
  rootArtist = new Artist(name, null, (width/2), 10);
  return rootArtist
}

function moreArtists() {
  $('button#more-artists').on('click', function(e) {
    e.preventDefault();
    fetchNextLayer(counter);
    counter++
  })
}

function Artist(name, parent, x, y) {
  this.name = name
  this.idName = name.toLowerCase().split(" ").join("-")
  this.parent = parent
  this.x = x
  this.y = y
  this.children = []
  this.layer = counter
  allArtists.push(this)
}

Artist.prototype.addToCanvas = function() {
  const name = this.name.replace("&", "and")
  const classes = createClasses(this).join(" ")
  var xml = $.parseXML(`<g xmlns="http://www.w3.org/2000/svg"><circle xmlns="http://www.w3.org/2000/svg" id="${this.idName}" class="${classes}" cx="${this.x}" cy="${this.y}" r="5" fill="black"></circle><text xmlns="http://www.w3.org/2000/svg" class="labels ${classes}" x="${this.x + 8}" y="${this.y + 18}" color="red" font-size="12" font-family="Verdana">${name}</text></g>`)
  $('svg').append(xml.documentElement)
  if (this.parent != null) {
    var xml2 = $.parseXML(`<line xmlns="http://www.w3.org/2000/svg" class="${classes}" x1="${this.parent.x}" y1="${this.parent.y}" x2="${this.x}" y2="${this.y}" stroke="#D3D3D3" stroke-width="1" />`)
    $('svg').prepend(xml2.documentElement)
  }
}

function createClasses(artist, array) {
  if (array === undefined) {
    array = []
  }
  if (artist.parent !== null) {
    array.push(artist.idName)
    createClasses(artist.parent, array)
    return array
  } else {
    array.push(artist.idName)
    return array
  }
}

Artist.prototype.fetchChildren = function(index) {
  const currentArtist = this
  const numPoints = allArtists.filter(x => x.layer === currentArtist.layer).length * 2
  $.get(`http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${currentArtist.name}&api_key=${apiKey}&format=json`, function(data) {
    for (i = 0; currentArtist.children.length < 2; i++) {
      if (allArtists.find(x => x.name === (data["similarartists"]["artist"][i]["name"].replace("&", "and"))) === undefined) {
        const newArtist = new Artist(data["similarartists"]["artist"][i]["name"].replace("&", "and"), currentArtist, ((width/2) - (workingWidth/2) + (workingWidth/numPoints)/2) + (((workingWidth/numPoints))*(index)), currentArtist.y + 50)
        currentArtist.children.push(newArtist);
        index += 1
      }
    };
    currentArtist.children.forEach(function(artist, index, array) {
        artist.addToCanvas();
        getTags(artist.name)
      })
  })
}

function fetchNextLayer(currentLayer) {
  const currentArtists = allArtists.filter(x => x.layer === currentLayer).sort(function(a,b) {return a.x - b.x})
  var pointCount = 0
  currentArtists.forEach(function(artist, index, array) {
    artist.fetchChildren(pointCount)
    pointCount += 2
  })
  workingWidth += 150
}