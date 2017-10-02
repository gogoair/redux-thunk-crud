import fetchAdapter from './adapters/fetch.js';

const defaultSettings = {
	adapter: fetchAdapter,
	primaryKey: 'id',
	actionTypesSuffixPlural: undefined,
	json: false,
	headers: [],
	getters: {},
	responseType: undefined,
};

const ERROR_SUFFIX = '_ERROR';

export default class CrudActionCreators {
	constructor(url, actionTypesSuffix, settings = {}) {
		this.url = url;
		this.primaryKey = settings.primaryKey || defaultSettings.primaryKey;
		this.adapter = settings.adapter || defaultSettings.adapter;
		this.json = settings.json;
		this.headers = settings.headers || defaultSettings.headers;
		this.getters = settings.getters || defaultSettings.getters;
		this.responseType = settings.responseType || defaultSettings.responseType

		const actionTypesSuffixPl = settings.actionTypesSuffixPlural || (actionTypesSuffix + 'S');

		this.actionTypes = {
			request:			'REQUEST_' + actionTypesSuffixPl,
			receive:			'RECEIVED_' + actionTypesSuffixPl,
			receiveError:		'RECEIVED_' + actionTypesSuffixPl + ERROR_SUFFIX,
			saving:				'SAVING_' + actionTypesSuffix,
			saved:				'SAVED_' + actionTypesSuffix,
			saveError:			'SAVE_' + actionTypesSuffix + ERROR_SUFFIX,
			requestOne:			'REQUEST_' + actionTypesSuffix,
			receiveOne:			'RECEIVED_' + actionTypesSuffix,
			receiveOneError:	'RECEIVED_' + actionTypesSuffix + ERROR_SUFFIX,
			deleting:			'DELETING_' + actionTypesSuffix,
			deleted:			'DELETED_' + actionTypesSuffix,
			deleteError:		'DELETE_' + actionTypesSuffix + ERROR_SUFFIX,
            resetAll:           'RESET_ALL',
		};

		this.requestList = ::this.requestList;
		this.receiveList = ::this.receiveList;
		this.receiveListError = ::this.receiveListError;
		this.saving = ::this.saving;
		this.saved = ::this.saved;
		this.saveError = ::this.saveError;
		this.requestOne = ::this.requestOne;
		this.receiveOne = ::this.receiveOne;
		this.receiveOneError = ::this.receiveOneError;
		this.deleting = ::this.deleting;
		this.deleted = ::this.deleted;
		this.deleteError = ::this.deleteError;
		this.resetAll = ::this.resetAll;
	}

	_getHeaders() {
		if (typeof this.headers == 'object') {
			return this.headers;
		}

		if (typeof this.headers == 'function') {
			return this.headers();
		}

		return {};
	}

    resetAll() {
	    return {
	        type: this.actionTypes.resetAll,
        }
    }

	requestList(params) {
		return {
			type: this.actionTypes.request,
			params,
		};
	}

	receiveList(params, data) {
		return {
			type: this.actionTypes.receive,
			data: this.getters.getList ? this.getters.getList(data) : data,
			params,
		};
	}

	receiveListError(params, data, error) {
		return {
			type: this.actionTypes.receiveError,
			data,
			error,
			params,
		};
	}

	fetchList(params) {
		return this.adapter({
			url: this.url,
			params,
			headers: this._getHeaders(),
			requestAction: this.requestList,
			successAction: this.receiveList.bind(null, params),
			failureAction: this.receiveListError.bind(null, params),
		});
	}

	saving(id) {
		return {
			type: this.actionTypes.saving,
			id,
		};
	}

	saved(id) {
		return {
			type: this.actionTypes.saved,
			id,
		};
	}

	saveError(id, data, error) {
		return {
			type: this.actionTypes.saveError,
			id,
			data, 
			error,
		}
	}

	save(data, id, method) {
		if (id) {
			data[this.primaryKey] = id;
		}

		return this.adapter({
			url: id ? this.url + '/' + id : this.url,
			params: data,
			method: method || (id ? 'PUT' : 'POST'),
			json: this.json,
			headers: this._getHeaders(),
			requestAction: this.saving,
			successAction: this.saved.bind(null, id),
			failureAction: this.saveError.bind(null, id),
		});
	}

	requestOne(id) {
		return {
			type: this.actionTypes.requestOne,
			id,
		};
	}

	receiveOne(id, data) {
		return {
			type: this.actionTypes.receiveOne,
			id,
			data: this.getters.getOne ? this.getters.getOne(data) : data,
		};
	}

	receiveOneError(id, data, error) {
		return {
			type: this.actionTypes.receiveOneError,
			id,
			error,
			data,
		};
	}

	fetchOne(id) {
		return this.adapter({
			url: this.url + '/' + id,
			headers: this._getHeaders,
			requestAction: this.requestOne,
			successAction: this.receiveOne.bind(null, id),
			failureAction: this.receiveOneError.bind(null, id),
		});
	}

	deleting(id) {
		return {
			type: this.actionTypes.deleting,
			id,
		};
	}

	deleted(id, data) {
		return {
			type: this.actionTypes.deleted,
			data,
			id,
		};
	}

	deleteError(id, data, error) {
		return {
			type: this.actionTypes.deleteError,
			data,
			error,
			id,
		};
	}

	delete(id) {
		return this.adapter({
			url: this.url + '/' + id,
			method: 'DELETE',
			headers: this._getHeaders,
			requestAction: this.deleting,
			successAction: this.deleted.bind(null, id),
			failureAction: this.deleteError.bind(null, id),
		});
	}
}