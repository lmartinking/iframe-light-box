/* iflb - the so called iframe lightbox 
 *
 *  by Lucas Martin-King
 *
 *  Actually, this can do images as well.
 */


/* Thou shalt not assume jQuery forever always $ */
jQuery(document).ready( function () {

iflb_init(jQuery);

function iflb_init($) {
	if ($.browser.msie) {
		alert("You are using IE, which isn't supported.");
		
		return false;
	}
	
	var settings = {
		css_path : "",			/* set this to the path of iflb.css, or else empty */
		
		fade_in_speed : "slow",
		fade_out_speed : "slow",
		
		slide_down_speed : "slow",
		slide_up_speed : "fast",
		
		set_cursor : "pointer",		/* pointer to set for click object */
		
		default_width : "640px",
		default_height : "480px",
		
		close_on_overlay_click : false,	/* do we close the lightbox if the user clicks on the overlay? */
		
		pause_flash : true		/* pause flash marked with iflb:hint="flash,pausable" */
	};
	
	/* options for each click object's lightbox */
	var cobj_opts = new Array();
	
	var flash_objs = new Array();
	
	/* mysterious function to get page size, etc */
	function _getPageSize() {
		var xScroll, yScroll;
		if (window.innerHeight && window.scrollMaxY) {	
			xScroll = window.innerWidth + window.scrollMaxX;
			yScroll = window.innerHeight + window.scrollMaxY;
		} else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
			xScroll = document.body.scrollWidth;
			yScroll = document.body.scrollHeight;
		} else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
			xScroll = document.body.offsetWidth;
			yScroll = document.body.offsetHeight;
		}
		
		var windowWidth, windowHeight;
		if (self.innerHeight) {	// all except Explorer
			if (document.documentElement.clientWidth) {
				windowWidth = document.documentElement.clientWidth; 
			} else {
				windowWidth = self.innerWidth;
			}
			windowHeight = self.innerHeight;
		} else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
			windowWidth = document.documentElement.clientWidth;
			windowHeight = document.documentElement.clientHeight;
		} else if (document.body) { // other Explorers
			windowWidth = document.body.clientWidth;
			windowHeight = document.body.clientHeight;
		}	
		// for small pages with total height less then height of the viewport
		if(yScroll < windowHeight){
			pageHeight = windowHeight;
		} else { 
			pageHeight = yScroll;
		}
		// for small pages with total width less then width of the viewport
		if(xScroll < windowWidth){	
			pageWidth = xScroll;		
		} else {
			pageWidth = windowWidth;
		}
		arrayPageSize = new Array(pageWidth,pageHeight,windowWidth,windowHeight);
		
		return arrayPageSize;
	};
		

	/* Insert the code for the stylesheet into the document */
	function insert_stylesheet () {
		if (settings.css_path !== "") {
			var str = '<link rel="stylesheet" href="' + settings.css_path + '"/>';
			$('head').append(str);
		}
	}
	
	/* Insert the code for the overlay into the document */
	function insert_overlaycode() {
		var str = '<div id="iflb-overlay"></div>';
		$('body').append(str);
	}
	
	/* Insert the lightbox div code into the document */
	function insert_boxcode() {
		var str =	
			'<div id="iflb">' +
			'<div id="iflb-header">' +
				'<span id="iflb-title"></span>' +
				'<span id="iflb-close">Close</span>' +
			'</div>' +
			'<div id="iflb-content"></div>' +
			'<div id="iflb-footer">' +
				'<span id="iflb-caption"></span>' +
			'</div>' +
			'</div>';
		$('body').append(str);
	}
	
	/* Removes the div code from the document */
	function remove_iflb() {
		$('#iflb').slideUp( function () { $('#iflb').remove(); } );
		$('#iflb-overlay').fadeOut( settings.fade_out_speed, function () { $('#iflb-overlay').remove(); } );
	}
	
	/* Work out the title from attributes of the click object */
	function get_title(cobj) {
		var t;
		if ( (t = $(cobj).attr("iflb:title")) )	{ return t; }
		if ( (t = $(cobj).attr("title")) )	{ return t; }
		if ( (t = $(cobj).attr("name")) )	{ return t; }
		return;
	}
	
	function get_caption(cobj) {
		var c;
		if ( (c = $(cobj).attr("iflb:caption")) ) 	{ return c; }
		if ( (c = $(cobj).attr("alt")) )		{ return c; }
		return;
	}
	
	/* Get the tag of an object */
	function tag_of(obj) {
		var t_name = $(obj).attr("tagName");
		return t_name.toLowerCase();
	}
	
	
	function parse_opts(cobj) {
		var optstr;
		
		if (optstr = $(cobj).attr("iflb:options")) {
			// nothing
		} else if (optstr = $(cobj).attr("rel")) {
			var opt_begin = optstr.indexOf('[');	//opt_begin++;
			var opt_end = optstr.indexOf(']');	//opt_end--;
		
			optstr = optstr.substring(opt_begin + 1, opt_end);
		}
		
		if (optstr == '') { return false; }
		
		var opts = new Array();
		
		var optstr_pairs = new Array();
		optstr_pairs = optstr.split(',');
		
		for (var x in optstr_pairs) {
			var p = new Array();
			p = optstr_pairs[x].split(':');
			var key = p[0]; var val = p[1];
			
			if (key === 'w') {
				opts["width"] = val;
			} else if (key === 'h') {
				opts["height"] = val;
			}
		}
		
		return opts;
	}
	
	/* Inserts and sets up the iframe inside the content box */
	function iflb_content_iframe(cobj) {
		var iframe_src = $(cobj).attr("href");
		
		var code = '<iframe' +
					' name="iflb-embedded-iframe"' +
					' id="iflb-embedded-iframe"' +
					' class="iflb-embedded"' +
					//' src="' + iframe_src + '"' +
				'></iframe>';
				
		//alert("iframe code is: " + code);				
		$('#iflb-content').html(code).addClass('iflb-content-loading');

		$('#iflb-embedded-iframe').error( function () {
			$('#iflb-content').removeClass('iflb-content-loading');
			$('#iflb-content').addClass('iflb-content-error');
		});
		$('#iflb-embedded-iframe').load( function () {
			$('#iflb-content').removeClass('iflb-content-loading');
			$('#iflb-embedded-iframe').fadeIn(settings.fade_in_speed);
		} );
		
		$('#iflb-embedded-iframe').attr("src", iframe_src).hide();
	}
	
	/* Inserts and sets up the img inside the content box */
	function iflb_content_img(cobj) {
		var img_src = $(cobj).attr("src");
		
		var code = '<img class="iflb-embedded" src="' + img_src + '">';
		$('#iflb-content').html(code);
	}
	
	/* Set the mouse cursor for an object */
	function set_cursor(obj, cur) {
		$(obj).css({cursor:cur});
	}
	
	/* Centers the iflb "window" */
	function iflb_position() {
		var pgsize = _getPageSize();
		
		var w = $('#iflb').width();
		var h = $('#iflb').height();
		
		$('#iflb').css( {
			top:		((0.97 * pgsize[3] - h) / 2),	/* Ugly hack here */
			left:		((0.97 * pgsize[2] - w) / 2)
		} );
	}
	
	function pause_flash() {
		if (settings.pause_flash) {
			$("embed[src$='swf']").each( function () {
				flash_objs.push(this);
				
				$(this).hide();
			} );
		}	
	}
	
	function unpause_flash() {
		if (settings.pause_flash) {
			var i;
			
			for (i in flash_objs) {
				$(flash_objs[i]).show();
			}
			
			flash_objs = new Array();
		}
	}
	
	
	/* Called when click object is clicked... */
	function iflb_start(cobj) {
	
		function setup_caption() {
			var c;
			$('#iflb-footer').hide();
			if (c = get_caption(cobj)) {
				$('#iflb-caption').html(c);
				$('#iflb-footer').show();
			}		
		}
		
		function setup_overlay() {
			insert_overlaycode();
			if (settings.close_on_overlay_click) {
				$('#iflb-overlay').click(function () { iflb_stop(); });
			}
			$('#iflb-overlay').scroll( function () {
				return false;
			} );
			$(document).scroll( function () {
				return false;
			} );			
		}
		
		function setup_iflb() {
			insert_boxcode();
			$('#iflb').hide();		
		}
		
		function setup_title () {
			var t;
			if (t = get_title(cobj)) {
				$('#iflb-title').html( t );
			}
		}
		
		function setup_contents () {
			var t;

			t = tag_of(cobj);
		
			if (t == 'img') {
				iflb_content_img(cobj);
			} else if (t == 'a') {
				iflb_content_iframe(cobj);
			} else {
				$('#iflb-content').text("Implement this method!");
			}
		}
		
		function apply_options() {
			var idx = $(cobj).attr("iflb_opts_idx");
			
			var w; var h;
			if ((w = cobj_opts[idx].width)) {
				$('#iflb-content').width(w);
			} else {
				$('#iflb-content').width(settings.default_width);
			}
			if ((h = cobj_opts[idx].height)) {
				$('#iflb-content').height(h);
			} else {
				$('#iflb-content').height(settings.default_height);
			}
			
			
		}
		
		pause_flash();
		
		setup_overlay();
		setup_iflb();
		setup_title();
		setup_caption();
		
		$('#iflb-close').click(function () { iflb_stop(); });
		
		setup_contents();
		apply_options();
		
		iflb_position();
		
		$(window).resize(function () { iflb_position (); });
		
		$('#iflb-overlay').fadeIn(settings.fade_in_speed, function () { 
			$('#iflb-content .iflb-embedded').hide();
			$('#iflb').slideDown(settings.slide_down_speed, function () { $('#iflb-content .iflb-embedded').fadeIn(settings.fade_in_speed); } );
		} );
	}
	
	/* Stops the current iflb. Cleanup, etc */
	function iflb_stop() {
		remove_iflb();
		unpause_flash();
	}
	
	/* Setup the hooks for the click objects */
	function init() {
		$("*[rel^='iflb']").each( function () {
			var this_opts = parse_opts(this);
			cobj_opts.push(this_opts);

			var idx = cobj_opts.length - 1;
			$(this).attr('iflb_opts_idx', idx);
			
			/* set cursor for click objects */
			if (settings.set_cursor) {
				set_cursor(this, settings.set_cursor);
			}
		} );
	
		/* setup callbacks */
		$("*[rel^='iflb']").click( function () {
			iflb_start(this);
			
			return false;
		} );
	}
	
	/* Here we go! */
	
	insert_stylesheet();

	init();
}

} );
