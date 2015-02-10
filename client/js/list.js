Template.list.helpers({
  'albumsCollection': function() {
    var images = Images.find({}).fetch();
    var albums = _.groupBy(_.pluck(images, 'album'));
    var albumsList = [];
    _.each(albums, function(el, key) {
      albumsList.push({
        id: key,
        total: el.length
      });
    });
    return albumsList;
  }
});