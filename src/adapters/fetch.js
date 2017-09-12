import dispatch from 'redux';

const methodsWithBody = ['POST', 'PUT', 'PATCH'];

export default function({requestAction, successAction, failureAction, method, url, params, json, headers, responseType}) {
	return dispatch => {
		if (requestAction) {
			dispatch(requestAction(params));
		}

		const hasBody = methodsWithBody.indexOf(method) >= 0;

		let urlFinal = url;
		const paramKeys = params ? Object.keys(params) : [];

		if (!hasBody && paramKeys.length) {
			urlFinal += '?';
			paramKeys.forEach((paramKey, index) => {
				if (index) {
					urlFinal += '&';
				}

				urlFinal += paramKey + '=' + params[paramKey];
			});
		}

		return fetch(urlFinal, {
			method,
			headers: new Headers(headers),
			data: hasBody ? (json ? JSON.stringify(params) : params) : undefined,
		}).then(function(response) {
			let responseTypeFinal = response[responseType] == 'function' ? responseType : 'json';

			if (responseTypeFinal == 'json' && response.body._readableState.length == 0) {
				responseTypeFinal = 'text';
			}

			const dataPromise = response[responseTypeFinal]();

			dataPromise.then(data => {
				if (response.ok) {
					if (successAction) {
						dispatch(successAction(data));
					}
				}
				else if (failureAction) {
					dispatch(failureAction(data, response.statusText));
				}
			});

			return dataPromise;
		}).catch(function(error) {
			console.log(error);
			if (failureAction) {
				dispatch(failureAction(null, error || 'Network error'));
			}

			return null;
		});
	};
}