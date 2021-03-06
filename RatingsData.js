import React, { AsyncStorage } from 'react-native';

const keyPrefix = '@RatingRequestData.';
const eventCountKey = keyPrefix + 'positiveEventCount';
const ratedTimestamp = keyPrefix + 'ratedTimestamp';
const declinedTimestamp = keyPrefix + 'declinedTimestamp';
const feedbackTimestamp = keyPrefix + 'feedbackTimestamp';

/**
 * Private class that let's us interact with AsyncStorage on the device
 * @class
 */
class RatingsData {

	constructor() {
		this.initialize();
	}

	// Should only be used for debug purposes
	async resetData() {
		await AsyncStorage.removeItem(ratedTimestamp);
		await AsyncStorage.removeItem(declinedTimestamp);
		await AsyncStorage.removeItem(feedbackTimestamp);
		await AsyncStorage.setItem(eventCountKey, '0');
	}

	// Get current count of positive events
	async getCount() {
		try {
			let countString = await AsyncStorage.getItem(eventCountKey);
			return parseInt(countString, 10);
		} catch (ex) {
			console.warn('Couldn\'t retrieve positive events count. Error:', ex);
		}
	}

	// Increment count of positive events
	async incrementCount() {
		try {
			let currentCount = await this.getCount();
			await AsyncStorage.setItem(eventCountKey, (currentCount + 1).toString());

			return currentCount + 1;
		} catch (ex) {
			console.warn('Could not increment count. Error:', ex);
		}
	}

	async getActionTimestamps() {
		try {
			let timestamps = await AsyncStorage.multiGet([ratedTimestamp, declinedTimestamp, feedbackTimestamp]);

			return timestamps;
		} catch (ex) {
			console.warn('Could not retrieve rated or declined timestamps.', ex);
		}
	}

	async recordDecline() {
		try {
			await AsyncStorage.setItem(declinedTimestamp, Date.now().toString());
		} catch (ex) {
			console.warn('Couldn\'t set declined timestamp.', ex);
		}
	}

	async recordRated() {
		try {
			await AsyncStorage.setItem(ratedTimestamp, Date.now().toString());
		} catch (ex) {
			console.warn('Couldn\'t set rated timestamp.', ex);
		}
	}

	async recordFeedback() {
		try {
			await AsyncStorage.setItem(feedbackTimestamp, Date.now().toString());
		} catch (ex) {
			console.warn('Couldn\'t set feedback timestamp.', ex);
		}
	}

	// Initialize keys, if necessary
	async initialize() {
		try {
			let keys = await AsyncStorage.getAllKeys();

			if (!keys.some((key) => key === eventCountKey)) {
				// TODO: I don't think this actually ever gets executed...
				console.log('Initializing blank values...');
				await AsyncStorage.setItem(eventCountKey, '0');
			}
		} catch (ex) {
			// report error or maybe just initialize the values?
			console.warn('Uh oh, something went wrong initializing values!', ex);
		}
	}

}

export default new RatingsData();
