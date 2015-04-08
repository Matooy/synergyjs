(function(root, def){


  // timeline = [FROM, TO, TO, TO, ....]
  //
  // attributes = {
  //   NAME : [FROM, TO, TO, TO, TO, ..., UNIT],
  //   NAME : [FROM, TO, TO, TO, TO, ..., UNIT],
  // }
  //
  // op = {
  //  debug     : false,
  //  start_out : null,
  //  start_in  : null,
  //  end_out   : null,
  //  end_in    : null,
  //  cross     : null,
  // }

  root['Synergy'] = def;

})(this, function(/*
  Array timeline,
  Object attributes,
  Object Options - callbacks
*/){

  'use strict';

  // Instance definition.
  function Synergy(){
    this.instance = null;
    this.status = {
      border        : 0,
      dest          : 0,
      overflow      : false,
      position      : 0,
      last_value    : 0,
      direction     : null,
      attributes    : {},
      range         : [],
      rate          : 0,
      step          : 0,
      last_callback : undefined,
      paused        : false,
    };
    this.option = {
      debug         : false,
      // callbacks
      step          : function(e){},
      start_out     : function(e){},
      start_in      : function(e){},
      end_out       : function(e){},
      end_in        : function(e){},
      cross         : function(e){},
      in_range      : function(e){}
    };
  }


  var expc_cl = 3;

  // Called 3 times or given 3 arguments,
  // this will return Synergy instance.
  return (arguments.length >= expc_cl)
    ? core.apply(this, arguments)
    : surrogate(this, arguments);


  /*-----------------------------------
   * Privates
   */

  function surrogate(instance, stack, depth){
    var s = Array.prototype.slice.call(stack);
    return function(){
      var d = (depth) ? depth : 1;
      var a = s.concat(Array.prototype.slice.call(arguments));
      return (d >= expc_cl || a.length >= expc_cl)
        ? core.apply(instance, a)
        : surrogate(instance, a, d)
    }
  }

  // Is it function?
  function is_f(a){
    return (typeof a === 'function');
  };

  // Is it array?
  function is_a(a){
    return toString.call(a) === '[object Array]';
  }

  // Is it object?
  function is_o(a){
    return toString.call(a) === '[object Object]';
  }

  // Iterator for Object, Array.
  function each(obj, callback){
    switch(true){
      case is_o(obj):
        for(var i in obj)
          callback.apply(obj, [obj[i], i]);
        break;
      case is_a(obj):
        obj.map.call(obj, callback);
        break;
    }
  }

  function call(f, args){
    f.apply(self, args);
  }

  function core(timeline, attributes, option){
    var timeline = timeline || [];
    var attributes = attributes || [];

    var option = option || {};
    var self = new Synergy;
    self.instance = this;

    // Statuses for sync
    var St = self.status;
    each({
      border: timeline[0],
      dest:   timeline[1],
      attributes: attributes,
      range: timeline
    }, function(v, i){
      if(St[i]) St[i] = v;
    });

    // Options
    var Op = self.option;
    each(option, function(v, i){
      if(Op[i]) Op[i] = v;
    });


    var // Var difinition.
      attribute_edges = (function(set){
        var self = this;
        self.from = {};
        self.to   = {};
        each(set, function(v, i){
          self.from[i] = v[0] + "" + (v[v.length - 1] || '');
          self.to[i]   = v[v.length - 2] + "" + (v[v.length - 1] || '');
        });
        return self;
      }).call({}, St.attributes)
    ;


    function retrieve_component(values){
      var unit = values.pop();
      if(typeof unit === 'string'){
      }else{
        values.push(unit);
        unit = false;
      }
      return [values, unit];
    }


    // Reformat attributes flow object.
    //
    function calc_attribute_changes(range, set){
      each(set, function(v, attr){

        if(is_f(v)) return;

        var component = retrieve_component(v);

        var unit   = component[1];
        var values = component[0];
        var prev   = null;
        var next   = null;

        each(values, function(value, k){

          if(value === null){
            prev = find_prev_available_value(k, values);
            values[k] = prev.value;
          }

          if(value === true){
            prev = find_prev_available_value(k, values);
            next = find_next_available_value(k, values);

            var range_diff = ( St.range[next.index] - St.range[prev.index] );
            var value_diff = ( next.value - prev.value );

            values[k] = prev.value + ( value_diff / range_diff * (St.range[k] - St.range[prev.index]) )
          }
        });

        values.push(unit);
        set[attr] = values;

      });

      return set;
    }



    // Find available value after index.
    function find_next_available_value(index, values){
      var ret  = values[index];
      var vals = values.slice(index);

      for(var i = 0; i < vals.length; i++ ){
        var val = vals[i];

        if( is_f(val) ){
          val = val(St.range[i], 0);
        }

        if(val !== true && val !== null){
          ret = val;
          index = i;
          break;
        }
      }

      return {
        'index': index,
        'value': ret
      };
    }



    // Find available value before index.
    function find_prev_available_value(index, values){
      var ret = values[index];

      var vals = values.slice(0, index);

      for(var i = vals.length - 1; i >= 0; i-- ){
        var val = vals[i];

        if( is_f(val) ){
          val = val(St.range[i], 0);
        }

        if(val !== true && val !== null){
          ret = val;
          index = i;
          break;
        }
      }

      return {
        'index': index,
        'value': ret
      };
    }



    // Check event usable
    //
    //   String -> Boolean
    //
    function detect_event_support(ev){
      var el = document.createElement('div');
      ev = 'on' + ev;
      var is_supported = (ev in el);
      if (!is_supported) {
        el.setAttribute(ev, 'return;');
        is_supported = is_f(el[ev]);
      }
      el = null;
      return is_supported;
    }



    function frame_sync(pos, set, rate, step){
      var ret = {};

      each(set, function(v, attr){

        if( is_f(v) ){
          ret[attr] = v(pos, rate, step);
          return;
        }

        var component = retrieve_component(v);
        var unit = component[1];
        var vals = component[0];
        var from = undefined, to = undefined, value = '';
        var addu = (unit ? String(unit) : 0);
        var f_i, t_i;

        // overflow

        if(step + 1 >= vals.length){
          from = vals[vals.length - 1];
          to   = vals[vals.length - 1];
        }else if(vals[step] !== undefined && vals[step+1] !== undefined){
          from = vals[step];
          to   = vals[step+1];
        }else if(typeof vals[step] === 'undefined'){
          from = vals[vals.length - 1];
          to   = vals[vals.length - 1];
        }

        if( is_f(from) ){
          from = from(pos, rate);
        }

        if( is_f(to) ){
          to = to(pos, rate);
        }

        if( typeof to == 'string' ){
          value = to;
        }else{
          f_i = parseInt(from);
          t_i = parseInt(to);

          if(f_i || t_i){
            if(f_i < t_i){
              value = ( f_i + ( (t_i - f_i)*rate ) ) + addu;
            }else if(f_i > t_i){
              value = ( f_i - ( (f_i - t_i)*rate ) ) + addu;
            }else{
              value = f_i + addu;
            }
          }else{
            if(rate === 0){
              value = f_i;
            }else if(rate===1){
              value = t_i;
            }
          }
        }

        ret[attr] = value;
      });

      return ret;
    }


    function decide_next_callable(){
      /*
       * -------------|----------------|----------------
       *  start in  -> <-start out
       *                     end out -> <- end in
       *              ^ cross          ^ cross
       */
      var next_callable = null;
      var min = St.range[0];
      var max = St.range[St.range.length - 1];
      if(St.position < min && St.direction === 0){
        next_callable = 'start_out';
      }else if(St.position >= min && St.position < max && ( St.direction ===  1 || St.direction === null)){
        next_callable = 'start_in';
      }else if(St.position > min && St.position <= max && St.direction === 0){
        next_callable = 'end_in';
      }else if(St.position > max && St.direction === 1){
        next_callable = 'end_out';
      }

      if(next_callable === St.last_callback){
        next_callable = null;
      }

      // Unwatch value vector toggling.
      if( next_callable == 'start_in' && St.last_callback == 'end_in'
       //|| next_callable == 'end_in' && St.last_callback == 'start_in'
      ){
        next_callable = null;
      }

      return next_callable;
    }


    function call_step(arg){
      if(is_a(Op.step)){
        var n = St.range.indexOf(St.position);
        (n >= 0) && (Op.step[n]) && call(Op.step[n], arg);
      }else if(is_f(Op.step)){
        call(Op.step, arg)
      }
    }


    function call_next_callable(arg){
      var next_callable = decide_next_callable();
      if(next_callable && Op.hasOwnProperty(next_callable) && St.last_callback !== next_callable){
        call(Op[next_callable], arg);
        St.last_callback = next_callable;
      }
    }


    function toggle_pause(){
      if(
        St.position > St.range[St.range.length - 1]
        || St.position < St.range[0]
      ){
        self.pause();
      }else{
        self.resume();
      }
    }


    function calculate(run){

      var bef = St.paused;
      toggle_pause();

      var st = frame_sync(St.position, St.attributes, St.rate, St.step);
      var arg = make_callback_args(st);

      (Op.debug) && console.log(st);

      if( ! St.paused || (bef === false && St.paused === true)){
        call_step(arg);
        is_f(run) && call(run, arg);
        call_next_callable(arg);
        if(St.border === St.position || St.dest === St.position){
          call(Op.cross, arg);
        }
      }

      St.last_value = St.position;

    }


    function make_callback_args(st){
      return [st, St.position, St.rate];
    }


    function init(val){
      St.attributes = calc_attribute_changes(St.range, St.attributes);
      recalc(val || 0);
      calculate();
      return self;
    }


    function calc_from_to(fromto, point){
      var b = fromto[0]
        , d = fromto[1]
        , s = 0
        ;

      each(fromto, function(v, i){
        if(v <= point){
          b = v; s = i;
          d = (fromto[i+1] !== undefined) ? fromto[i+1] : fromto[i];
        }
      });

      return [b, d, s];
    }



    function recalc(point){
      var calced = calc_from_to(St.range, point);

      St.border = calced[0];
      St.dest   = calced[1];
      St.step   = calced[2];
    }


    function main(value){
      recalc(value);

      var p = ( value - St.border );
      var c = ( St.dest - St.border );
      var rate = 0;
      if(!p){
        rate = 0;
      }else if(!c){
        rate = 1;
      }else{
        rate  = (p/c);
      }
      if(rate <= 0 ){
        St.rate = 0;
        St.overflow = true;
      }else if(rate > 1){
        St.rate = 1;
        St.overflow = true;
      }else{
        St.rate = rate;
        St.overflow = false;
      }

      St.direction  = (St.last_value < value) ? 1 : 0;
      St.last_value = value;

      calculate();
    }


    self.observe = function(value){
      St.position = value;
      main(value);
      return self;
    }

    self.pause = function(){
      St.paused = true;
    }

    self.resume = function(){
      St.paused = false;
    }

    self.recalc = function(){
      St.attributes = calc_attribute_changes(St.range, St.attributes);
    }

    self.config = function(o){
      each(o, function(v, i){
        if(Op.hasOwnProperty(i)) Op[i] = v;
      });
    }

    self.init = function(val){
      init(val);
      return self;
    }

    return self;
  }

});
