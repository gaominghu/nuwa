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
  console.log(this.params._id);
  var items = Images.find({
    album: Number(this.params._id)
  },{sort:[["order", "asc"]]});
  console.log(items);
  this.render('albumview', {
    data: {
      images:items
    }
  });
});