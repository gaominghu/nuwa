Router.configure({
  layoutTemplate: 'layout',
  yieldTemplate: {
    header: {
      to: 'header'
    },
    footer: {
      to: 'footer'
    }
  }
});

Router.route('/', function() {
  this.render('list');
});

Router.route('/albums/:_id', function() {
  var unixdate = this.params._id,
    items = Images.find({
      album: Number(unixdate)
    }, {
      sort: [
        ["order", "asc"]
      ]
    });
  console.log(items);

  var images = Images.find({}).fetch(),
    albums = _.groupBy(_.pluck(images, 'album')),
    albumsList = [],
    prevKey,
    nextKey;

  //THIS IS DUMB AND WE SHOULD NOT RELY ON IT :)
  //HAS TO BE MODIFIED
  _.each(albums, function(el, key) {
    albumsList.push({
      id: key,
      total: el.length
    });
  });
  _.each(albumsList, function(el, index){
    if(el.id === unixdate){
      if(index === 0){
        prevKey = albumsList[albumsList.length-1].id;
      } else {
        prevKey = albumsList[index - 1].id;
      }
      if(index === albumsList.length -1){
        nextKey = albumsList[0].id;
      } else {
        nextKey = albumsList[index+1].id;
      }
    }
  });

  beforeRoute = '/albums/';
  this.render('albumview', {
    data: {
      images: items,
      date: unixdate,
      pagination:{
        prevURL: beforeRoute + prevKey,
        nextURL: beforeRoute + nextKey
      }
    }
  });
});