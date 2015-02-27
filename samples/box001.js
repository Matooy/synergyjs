var box001 = $('#box001');

var anim001 = new Synergy([280, 380, 480, 620, 680], {
  'width'  : function(i){ return (i/2) + 'px'; },
  'height' : [40, true, function(i){ return (i/4); }, null, 0, 'px']
})({

  step: function(attr, i){
    box001.css(attr);
  }

}).init();

var timer = null;
$('#run001').on('click', function(){
  if(timer)
    clearInterval(timer);
  var i = 200;
  timer = setInterval(function(){
    anim001.observe(i);
    (i>680) && clearInterval(timer);
    i++;
  });
});
