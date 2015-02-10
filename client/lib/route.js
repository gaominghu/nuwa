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
  },{sort:[["order", "asc"]]});
  console.log(items);
  this.render('albumview', {
    data: {
      images: items,
      date: unixdate
    }
  });
});