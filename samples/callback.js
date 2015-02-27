;(function(){

  var observer = new Synergy([3,6,9], {});

  var val = 0;
  var add = $("<button>+</button>");
  var red = $("<button>-</button>");

  var prv_clb = $('<div id="preview-callback-event">');
  var prv_val = $('<div id="preview-callback-value">');

  $('#preview-callback').append(add);
  $('#preview-callback').append(red);
  $('#preview-callback').append(prv_clb);
  $('#preview-callback').append(prv_val);

  function update(txt){
    var def = prv_clb.text();
    prv_clb.text((txt ? (def?def+', ':'') + txt: ''));
    prv_val.text(val);
  }


  var action = observer({
    step: function(attr, i){
      // If function assigned to 'step' property,
      // it will be called everytime when observe method is called.
    },
    start_in:  function(){ update('start_in'); },
    start_out: function(){ update('start_out'); },
    end_in:    function(){ update('end_in'); },
    end_out:   function(){ update('end_out'); },
    cross:     function(){ update('cross'); },
    in_range:  function(){ update('in_range'); }
  });


  (function(){
    update();

    add.on('click', function(){
      val++; update();
      action.observe(val);
    });

    red.on('click', function(){
      val--; update();
      action.observe(val);
    });
  })();

})();
