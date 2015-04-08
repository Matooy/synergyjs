var box001   = $('#box001');
var timeline = [280, 380, 480, 620, 680];
var timer    = null;


var synergy001 = new Synergy(timeline, {
  'width'  :   function(i){ return (i/6.8) + '%'; },
  'height' :   [40, true, function(i){ return (i/4); }, null, 0, 'px'],
  'transform': [0, true, function(i){ return i/2.4; }, null, 0]
})({
  step: function(attr, i){
    if(attr.transform)
      attr.transform = 'rotate(' + attr.transform + 'deg)';
    box001.css(attr);
  }
}).init();


$('#run001').on('click', function(){
  (timer) && clearInterval(timer);

  var i = 200;
  timer = setInterval(function(){
    synergy001.observe(i);
    (i>timeline[timeline.length - 1]) && clearInterval(timer); i++;
  });
});
