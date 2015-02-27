;(function(){

  var p = $('#preview-first');

  var observer = new Synergy([0, 100, 400], {
    'margin-left': [0, 200, 0]
  })({
    step: function(attr, i){
      p.css(attr);
    },
  });

  $(window).scroll(function(){
    observer.observe($(window).scrollTop());
  });

})();
