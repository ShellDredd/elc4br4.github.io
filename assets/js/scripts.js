jQuery(document).ready(function() {
	function count($this){
		var current = parseInt($this.html(), 10);
		current = current + 1; /* Where 1 is increment */

		$this.html(++current);
		if(current > $this.data('count')){
			$this.html($this.data('count'));
		} else {
			setTimeout(function(){count($this)}, 50);
		}
	}

	jQuery(".stat-count").each(function() {
	  jQuery(this).data('count', parseInt(jQuery(this).html(), 10));
	  jQuery(this).html('0');
	  count(jQuery(this));
	});
});

