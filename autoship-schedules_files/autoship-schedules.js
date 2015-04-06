jQuery(function ($) {
	var send_request_interval = null;
	function send_request(schedule_id, url, data, delay, success, fail, always) {
		clearInterval(send_request_interval);
		var $schedule = $('#wc-autoship-schedule-' + schedule_id);
		send_request_interval = setTimeout(function () {
			set_schedule_loading_state(schedule_id);
			var request = $.post(url, data)
				.success(function (response) {
					if (success != null) {
						success(response);
					}
				}).fail(function () {
					alert( "error" );
					if (fail != null) {
						fail();
					}
				}).always(function () {
					unset_schedule_loading_state(schedule_id);
					if (always != null) {
						always();
					}
				});
		}, delay);
	}
	
	function set_schedule_loading_state(schedule_id) {
		var $schedule = $('#wc-autoship-schedule-' + schedule_id);
		$schedule.addClass('loading');
		$schedule.find('input').attr('disabled', 'disabled');
		$schedule.find('button').attr('disabled', 'disabled').button('loading');
	}
	
	function unset_schedule_loading_state(schedule_id) {
		var $schedule = $('#wc-autoship-schedule-' + schedule_id);
		$schedule.removeClass('loading');
		$schedule.find('input').removeAttr('disabled');
		$schedule.find('button').removeAttr('disabled').button('reset');
	}
	
	function reload_schedule(schedule_id, active) {
		var data = {
			schedule_id: schedule_id,
			active: active ? 1 : 0
		}
		send_request(schedule_id, AUTOSHIP_SCHEDULES.ajax_url + '?action=schedules_action_get_schedule', data, 0, function (schedule_data) {
			var $new_schedule = $(schedule_data.html);
			$('#wc-autoship-schedule-' + schedule_id).replaceWith($new_schedule);
			bind_schedule_actions($new_schedule)
		});
	}
	
	function bind_schedule_actions($schedule) {
		// Autoship status
		var toggle_autoship_status = function () {
			var $input = $(this);
			var schedule_id = $input.data('schedule-id');
			var current_autoship_status = $input.data('autoship-status');
			var data = {
				schedule_id: schedule_id,
				autoship_status: (current_autoship_status == 1) ? 0 : 1
			};
			send_request(schedule_id, AUTOSHIP_SCHEDULES.ajax_url + '?action=schedules_action_set_autoship_status', data, 0, function (schedule) {
				reload_schedule(schedule.id, (schedule.autoship_status == 1) ? true : false);
			});
		};
		$schedule.find('.wc-autoship-schedule-autoship-status-btn').click(toggle_autoship_status);
		// Next order date
		var save_next_order_date = function () {
			var $input = $(this);
			var schedule_id = $input.data('schedule-id');
			var data = {
				schedule_id: schedule_id,
				next_order_date: $input.val()
			};
			send_request(schedule_id, AUTOSHIP_SCHEDULES.ajax_url + '?action=schedules_action_set_next_order_date', data, 0, function (schedule) {
				reload_schedule(schedule.id, true);
			});
		};
		$schedule.find('.wc-autoship-schedule-next-order-date-input').change(save_next_order_date)
			.each(function () {
				$picker = $(this);
				$picker.datepicker({
					dateFormat: 'yy-mm-dd',
					minDate: $picker.data('min')
				});
			} );
		// Delete schedule
		var delete_schedule = function () {
			var confirm_delete = confirm('Are you sure you want to delete this schedule?');
			if (!confirm_delete) {
				return;
			}
			var $input = $(this);
			var schedule_id = $input.data('schedule-id');
			var data = {
				schedule_id: schedule_id,
			};
			send_request(schedule_id, AUTOSHIP_SCHEDULES.ajax_url + '?action=schedules_action_delete', data, 0, function () {
				$('#wc-autoship-schedule-' + schedule_id).fadeOut();
			});
		};
		$schedule.find('.wc-autoship-schedule-delete-btn').click(delete_schedule);
		
		// Schedule item quantity
		var save_item_quantity = function() {
			var $input = $(this);
			var schedule_id = $input.data('schedule-id');
			var schedule_item_id = $input.data('schedule-item-id');
			var data = {
				schedule_item_id: schedule_item_id,
				quantity: $input.val()
			};
			send_request(schedule_id, AUTOSHIP_SCHEDULES.ajax_url + '?action=schedules_action_item_set_quantity', data, 700, function (schedule_item) {
				reload_schedule(schedule_item.schedule_id, true);
			});
		};
		$schedule.find('.wc-autoship-schedule-item-quantity-input').keyup(save_item_quantity).change(save_item_quantity);
		
		// Schedule item delete
		var delete_item = function() {
			var $input = $(this);
			var schedule_id = $input.data('schedule-id');
			var schedule_item_id = $input.data('schedule-item-id');
			var data = {
				schedule_item_id: schedule_item_id
			};
			send_request(schedule_id, AUTOSHIP_SCHEDULES.ajax_url + '?action=schedules_action_item_delete', data, 0, function () {
				reload_schedule(schedule_id, true);
			});
		};
		$schedule.find('.wc-autoship-schedule-item-delete-btn').click(delete_item);
		
		// Add schedule item
		var add_item = function() {
			var $input = $(this);
			// Parse product data
			var value = $input.val();
			if (value == '') {
				return;
			}
			var schedule_id = $input.data('schedule-id');
			var product_data = JSON.parse(value);	
			// Create ajax data
			var data = {
				schedule_id: schedule_id,
				product_id: product_data.product_id,
				variation_id: product_data.variation_id,
				quantity: 1
			};
			// Send request
			send_request(schedule_id, AUTOSHIP_SCHEDULES.ajax_url + '?action=schedules_action_item_add', data, 0, function (schedule_item) {
				reload_schedule(schedule_item.schedule_id, true);
			});
		};
		$schedule.find('.wc-autoship-schedule-item-add-input').bind('add-item', add_item).change(add_item);
		$schedule.find('.wc-autoship-schedule-item-add-btn').click(function () {
			$($(this).data('target')).trigger('add-item');
		});
	}
	
	bind_schedule_actions($('.wc-autoship-schedule'));
});