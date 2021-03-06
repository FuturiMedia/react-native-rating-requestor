import React, { Platform, Alert, Linking } from 'react-native';

import * as StoreReview from 'react-native-store-review';
import RatingsData from './RatingsData';

const _config = {
	title: 'Share Your Feedback',
	ratePrompt: 'Would you mind taking a quick moment to leave us a positive review?',
	initialQuestion: 'Do you like this app?',
	feedbackPrompt: 'Would you like to tell us about it?',
	appStoreId: null,
	feedbackLabels: {
		yes: 'Yes',
		no: 'No'
	},
	actionLabels: {
		decline: 'Don\'t ask again',
		delay: 'Maybe later...',
		feedback: 'Submit Feedback',
		accept: 'Rate the App'
	},
	timingFunction: function(currentCount) {
		return currentCount > 1 && (Math.log(currentCount) / Math.log(3)).toFixed(4) % 1 == 0;
	}
};

async function _isAwaitingRating() {
	let timestamps = await RatingsData.getActionTimestamps();

	// If no timestamps have been set yet we are still awaiting the user, return true
	return timestamps.every((timestamp) => { return timestamp[1] === null; });
}

/**
 * Creates the RatingRequestor object you interact with
 * @class
 */
export default class RatingRequestor {

	/**
	 * @param  {string} appStoreId - Required. The ID used in the app's respective app store
	 * @param  {object} options - Optional. Override the defaults. Takes the following shape, with all elements being optional:
	 * 								{
	 * 									title: {string},
	 * 									ratePrompt: {string},
	 * 									initialQuestion: {string},
	 * 									feedbackPrompt: {string},
	 * 									actionLabels: {
	 * 										decline: {string},
	 * 										delay: {string},
	 * 										accept: {string}
	 * 										feedback: {string}
	 * 									},
	 * 									timingFunction: {func}
	 * 								}
	 */
	constructor(appStoreId, options) {
		// Check for required options
		if (!appStoreId) {
			throw 'You must specify your app\'s store ID on construction to use the Rating Requestor.';
		}

		// Merge defaults with user-supplied config
		Object.assign(_config, options);
		_config.appStoreId = appStoreId;
	}

	/**
	 * For debug purposes
	 */
	resetData() {
		RatingsData.resetData();
	}

	recordFeedback() {
		RatingsData.recordFeedback();
	}

	/**
	 * Immediately invoke the store review
	 */
	storeReview(callback = () => {}) {
		let storeUrl = Platform.OS === 'ios' ?
			'http://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?id=' + _config.appStoreId + '&pageNumber=0&sortOrdering=2&type=Purple+Software&mt=8' :
			'market://details?id=' + _config.appStoreId;

		RatingsData.recordRated();
		callback(true, 'accept');

		// This API is only available on iOS 10.3 or later
		if (Platform.OS === 'ios' && StoreReview.isAvailable) {
			StoreReview.requestReview();
		} else {
			Linking.openURL(storeUrl);
		}
	}

	showFeedbackDialog(callback = () => {}) {
		Alert.alert(
			_config.title,
			_config.feedbackPrompt,
			[
				{ text: _config.actionLabels.decline, onPress: () => { RatingsData.recordDecline(); callback(true, 'decline'); } },
				{ text: _config.actionLabels.delay, onPress: () => { callback(true, 'delay'); } },
				{ text: _config.actionLabels.feedback, onPress: () => { callback(true, 'feedback'); }, style: 'cancel' }
			]
		);
	}

	showRatingDialog(callback = () => {}) {
		Alert.alert(
			_config.title,
			_config.ratePrompt,
			[
				{ text: _config.actionLabels.decline, onPress: () => { RatingsData.recordDecline(); callback(true, 'decline'); } },
				{ text: _config.actionLabels.delay, onPress: () => { callback(true, 'delay'); } },
				{ text: _config.actionLabels.accept, onPress: () => this.storeReview(), style: 'cancel' }
			]
		);
	}

	showInitialDialog(callback = () => {}) {
		Alert.alert(
			_config.title,
			_config.initialQuestion,
			[
				{ text: _config.feedbackLabels.no, onPress: () => this.showFeedbackDialog(callback) },
				{ text: _config.feedbackLabels.yes, onPress: () => this.showRatingDialog(callback), style: 'cancel' }
			]
		);
	}

	/**
	 * Call when a positive interaction has occurred within your application. Depending on the number
	 * of times this has occurred and your timing function, this may display a rating request dialog.
	 *
	 * @param {function(didAppear: boolean, result: string)} callback Optional. Callback that reports whether the dialog appeared and what the result was.
	 */
	async handlePositiveEvent(callback = () => {}) {
		if (await _isAwaitingRating()) {
			let currentCount = await RatingsData.incrementCount();

			if (_config.timingFunction(currentCount)) {
				this.showInitialDialog(callback);
			} else callback(false);
		} else callback(false);
	}
}
