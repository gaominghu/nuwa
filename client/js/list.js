Template.list.helpers({
  'albumsCollection': function() {
    var images = Images.find({}).fetch(),
      albums = _.groupBy(_.pluck(images, 'album')),
      albumsList = [];
    _.each(albums, function(el, key) {
      albumsList.push({
        id: key,
        total: el.length
      });
    });
    return albumsList;
  },
  'moment': function(date) {
    return moment(Number(date)).format('DD/MM/YY - hh:mm:ss');
  }
});