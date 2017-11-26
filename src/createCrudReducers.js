const readInitialState = {
	data: [],
	listError: undefined,
	params: undefined,
	listLoading: false,
	oneLoading: false,
	currentId: undefined,
	currentData: undefined,
	oneError: undefined,
};

const saveInitialState = {
	isSaving: false,
	savedData: undefined,
	saveError: undefined,
};

const deleteInitialState = {
	isDeleting: false,
	deleteError: undefined,
};

function request(state, action) {
	return {
		...state,
		listLoading: true,
		params: action.params,
		data: readInitialState.data,
		listError: readInitialState.listError,
	};
}

function receive(state, action) {
	return {
		...state,
		data: action.data,
		listLoading: false,
	};
}

function receiveError(state, action) {
	return {
		...state,
		listError: action.error,
		listLoading: false,
	};
}

function requestOne(state, action) {
	return {
		...state,
		currentId: readInitialState.currentId,
		currentData: readInitialState.currentData,
		oneLoading: true,
		oneError: readInitialState.oneError,
	};
}

function receiveOne(state, action) {
	return {
		...state,
		currentId: action.id,
		currentData: action.data,
		oneLoading: false,
	};
}

function receiveOneError(state, action) {
	return {
		...state,
		oneLoading: false,
		oneError: action.error,
	};
}

function saving(state, action) {
	return {
		...state,
		isSaving: true,
		savedData: saveInitialState.savedData,
		saveError: saveInitialState.error,
	};
}

function saved(state, action) {
	return {
		...state,
		savedData: action.data,
		isSaving: false,
	};
}

function saveError(state, action) {
	return {
		...state,
		saveError: action.error,
		isSaving: false,
	};
}

function deleting(state, action) {
	return {
		...state,
		isDeleting: true,
		deleteError: deleteInitialState.error,
	};
}

function deleted(state, action) {
	return {
		...state,
		isDeleting: false,
	};
}

function deleteError(state, action) {
	return {
		...state,
		deleteError: action.error,
		isDeleting: false,
	};
}

export default function(
	actionCreators,
	availableCrudActions = 'CRUD',
	resetAllActionType = 'RESET_ALL_DATA',
) {
	let initialState = readInitialState;

	const hasSave =
		availableCrudActions.indexOf('C') >= 0 ||
		availableCrudActions.indexOf('U') >= 0;
	const hasDelete = availableCrudActions.indexOf('D') >= 0;

	if (hasSave) {
		initialState = { ...initialState, ...saveInitialState };
	}

	if (hasDelete) {
		initialState = { ...initialState, ...deleteInitialState };
	}

	const actionTypes = actionCreators.actionTypes;

	const actionHandlers = {
		[actionTypes.request]: request,
		[actionTypes.receive]: receive,
		[actionTypes.receiveError]: receiveError,
		[actionTypes.requestOne]: requestOne,
		[actionTypes.receiveOne]: receiveOne,
		[actionTypes.receiveOneError]: receiveOneError,
	};

	if (hasSave) {
		actionHandlers[actionTypes.saving] = saving;
		actionHandlers[actionTypes.saved] = saved;
		actionHandlers[actionTypes.saveError] = saveError;
	}

	if (hasDelete) {
		actionHandlers[actionTypes.deleting] = deleting;
		actionHandlers[actionTypes.deleted] = deleted;
		actionHandlers[actionTypes.deleteError] = deleteError;
	}

	return function(state = initialState, action) {
		if (action.type === resetAllActionType) {
			return initialState;
		} else if (!action || !action.type || !actionHandlers[action.type]) {
			return state;
		}

		return actionHandlers[action.type](state, action);
	};
}
