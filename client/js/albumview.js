Template.albumview.helpers({
  'moment': function(date){
    return moment(Number(date)).format('DD/MM/YY - hh:mm:ss');
  }
});