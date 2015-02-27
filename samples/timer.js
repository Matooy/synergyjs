(function(){

  var $el = $('#preview-timer-output');

  var timer = new Synergy([1, 2, 3, 5])({
    value: function(v){
      return v;
    }
  },
  {
    step: [
      function(attr, pos, rate){
        console.log(attr, pos, rate);
        $el.html('One: ' + pos);
      },
      function(){
        $el.html('Two?');
      },
      function(){
        $el.html('Three...');
      },
      function(){
        $el.html('Five!!!');
      }
    ]
  });

  $(document).on('click', '#run-timer', function(){
    var i = 0;
    setInterval(function(){
      i++;
      timer.observe(i);
    }, 1000);
  })

})();
