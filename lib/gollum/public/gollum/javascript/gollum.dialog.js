/**
  *  gollum.dialog.js
  *
  *  Used for dialogs. Duh.
  *
  */

(function($) {

  var Dialog = {

    debugOn: false,
    markupCreated: false,
    markup: '',

    currentAspect: function(){
      if (window.innerWidth < 480) return "small-mobile";
      if ($('#gollum-dialog-dialog').css('position') == 'fixed') return "large-mobile";
      return "desktop";
    },

    attachEvents: function( evtOK ) {
      $('#gollum-dialog-action-ok').click(function( e ) {
        Dialog.eventOK( e, evtOK );
      });
      $('#gollum-dialog-action-cancel').click( Dialog.eventCancel );
      $('#gollum-dialog-dialog input[type="text"]').keydown(function( e ) {
        if ( e.keyCode == 13 ) {
          Dialog.eventOK( e, evtOK );
        }
      });
    },

    detachEvents: function() {
      $('#gollum-dialog-action-ok').unbind('click');
      $('#gollum-dialog-action-cancel').unbind('click');
    },

    createFieldMarkup: function( fieldArray ) {
      var fieldMarkup = '<fieldset>';
      for ( var i=0; i < fieldArray.length; i++ ) {
        if ( typeof fieldArray[i] == 'object' ) {
          fieldMarkup += '<div class="field">';
          switch ( fieldArray[i].type ) {

          case 'text':
            fieldMarkup += Dialog.createFieldText( fieldArray[i] );
            break;

          case 'file':
            fieldMarkup += Dialog.createFieldFile( fieldArray[i] );
            break;

          default:
            break;

          }
          fieldMarkup += '</div>';
        }

      }
      fieldMarkup += '</fieldset>';
      return fieldMarkup;
    },

    createFieldText: function( fieldAttributes ) {
      var html = '';

      if ( fieldAttributes.name ) {
        html += '<label';
        if ( fieldAttributes.id ) {
          html += ' for="gollum-dialog-dialog-generated-field-' + fieldAttributes.id + '"';
        }
        html += '>' + fieldAttributes.name + '</label>';
      }

      html += '<input type="text" class="form-control input-sm width-full"';

      if ( fieldAttributes.id ) {
        html += ' name="' + fieldAttributes.id + '"'
        if ( fieldAttributes.type == 'code' ) {
          html+= ' class="code"';
        }
        if ( fieldAttributes.defaultValue ) {
          html+= ' value="' + fieldAttributes.defaultValue.split('"').join('&quot;') + '"';
        }
        html += ' id="gollum-dialog-dialog-generated-field-' +
          fieldAttributes.id + '">';
      }

      if( fieldAttributes.context ){
        html += '<span class="context">' + fieldAttributes.context + '</span>';
      }

      return html;
    },

    createFieldFile: function( fieldAttributes ) {
      // Not actually a field, but an embedded form.
      var html = '';

      var id = fieldAttributes.id || 'upload';
      var name = fieldAttributes.name || 'file';
      var action = fieldAttributes.action || routePath('upload_file');

      html += '<form method=post enctype="multipart/form-data" ' +
        'action="' + action + '" ' + 'id="' + id + '">';
      html += '<input type=file name="' + name + '" class="form-control width-full">';
      html += '</form>';

      if( fieldAttributes.context ){
        html += '<span class="context">' + fieldAttributes.context + '</span>';
      }

      return html;
    },

    createMarkup: function( title, body ) {
      Dialog.markupCreated = true;
      return '<div id="gollum-dialog-dialog">' +
             '<div id="gollum-dialog-dialog-inner" class="border rounded-1">' +
             '<div id="gollum-dialog-dialog-title"><h4 class="f2 border-bottom mb-3">' +
             title +'</h4></div>' +
             '<div id="gollum-dialog-dialog-body">' + body + '</div>' +
             '<div id="gollum-dialog-dialog-buttons" class="pt-2 float-right">' +
             '<button name="Cancel" id="gollum-dialog-action-cancel" ' +
             'class="btn">Cancel</button>' +
             '<span class="px-1"></span>' +
             '<button name="OK" id="gollum-dialog-action-ok" '+
             'class="btn btn-primary">OK</button>' +
             '</div>' +
             '</div>' +
             '</div>';
    },

    eventCancel: function( e ) {
      e.preventDefault();
      debug('Cancelled dialog.');
      Dialog.hide();
    },

    eventOK: function( e, evtOK ) {
      e.preventDefault();

      var results = [];
      // get the results from each field and build them into the object
      $('#gollum-dialog-dialog-body input').each(function() {
        results[$(this).attr('name')] = $(this).val();
      });

      // pass them to evtOK if it exists (which it should)
      if ( evtOK &&
           typeof evtOK == 'function' ) {
        evtOK( results );
      }
      Dialog.hide();
    },

    hide: function() {
      $('#gollum-dialog-dialog').animate({ opacity: 0 }, {
        duration: 200,
        complete: function() {
          $('#gollum-dialog-dialog').removeClass('active');
          $('#gollum-dialog-dialog').css('display', 'none');
        }
      });

      $(window).unbind('resize', Dialog.resize);
    },

    init: function( argObject ) {
      var title = '';
      var body = '';

      // bail out if necessary
      if ( !argObject ||
           typeof argObject != 'object' ) {
        debug('Editor Dialog: Cannot init; invalid init object');
        return;
      }

      if ( argObject.body && typeof argObject.body == 'string' ) {
        body = '<p>' + argObject.body + '</p>';
      }

      // alright, build out fields
      if ( argObject.fields && typeof argObject.fields == 'object' ) {
        body += Dialog.createFieldMarkup( argObject.fields );
      }

      if ( argObject.title && typeof argObject.title == 'string' ) {
        title = argObject.title;
      }

      if ( Dialog.markupCreated ) {
        $('#gollum-dialog-dialog').remove();
      }

      Dialog.markup = Dialog.createMarkup( title, body );

      $('body').append( Dialog.markup );
      if ( argObject.OK &&
           typeof argObject.OK == 'function' ) {
        Dialog.attachEvents( argObject.OK );
      }

      Dialog.show();
    },

    show: function() {
      if ( !Dialog.markupCreated ) {
        debug('Dialog: No markup to show. Please use init first.');
      } else {
        debug('Showing dialog');

        $('#gollum-dialog.dialog').css('display', 'none');
        $('#gollum-dialog-dialog').animate({ opacity: 0 }, {
          duration: 0,
          complete: function() {
            $('#gollum-dialog-dialog').css('display', 'block');
            Dialog.position(); // position this thing
            $('#gollum-dialog-dialog').animate({ opacity: 1 }, {
            duration: 500
            });
            $($('#gollum-dialog-dialog input[type="text"]').get(0)).focus();
          }
        });

        $(window).bind('resize', Dialog.resize);
      }
    },

    resize: function(){
      Dialog.position();
    },

    position: function() {
      if (Dialog.currentAspect() == "small-mobile") {
        $('#gollum-dialog-dialog-inner').css('height', '100%').css('margin-top', 'auto');
      }
      else if (Dialog.currentAspect() == "large-mobile") {
        $('#gollum-dialog-dialog-inner').css('height', 'auto').css('margin-top', 'auto');
      }
      else if (Dialog.currentAspect() == "desktop") {
        var dialogHeight = $('#gollum-dialog-dialog-inner').height();
        $('#gollum-dialog-dialog-inner')
          .css('height', dialogHeight + 'px')
          .css('margin-top', -1 * parseInt( dialogHeight / 2 ));
      }
    }
  };


  var debug = function(m) {
    if ( Dialog.debugOn
         && typeof console != 'undefined' ) {
      console.log( m );
    }
  };

  $.GollumDialog = Dialog;

})(jQuery);
