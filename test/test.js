import 'babel-polyfill';
import 'es6-promise/auto';
import 'isomorphic-fetch';

import fetchMock from 'fetch-mock';
import chai, { expect } from 'chai';
import chaiRedux from 'chai-redux';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiRedux);
chai.use(chaiAsPromised);

import thunkMiddleware from 'redux-thunk';

import { createCrudReducers, CrudActionCreators } from '../src/index.js';

const MOCK_API_BASE_URL = 'https://localhost:1337';
const MOCK_API_FIRST_ITEM_URL = MOCK_API_BASE_URL + '/' + '1';
const MOCK_API_THIRD_ITEM_URL = MOCK_API_BASE_URL + '/' + '3';

const EMPTY_RESPONSE = {};

const ERROR_MESSAGE = 'Not Found';

const mockList = [
	{ id: 1, owner: 1, text: 'test 1' },
	{ id: 2, owner: 2, text: 'test 2' },
	{ id: 3, owner: 1, text: 'test 3' },
	{ id: 4, owner: 1, text: 'test 4' },
	{ id: 5, owner: 1, text: 'test 5' },
	{ id: 6, owner: 1, text: 'test 6' },
];

const searchFilter = item => item.owner == 1;

fetchMock
	.get(MOCK_API_BASE_URL, mockList)
	.get(MOCK_API_BASE_URL + '?owner=1', mockList.filter(searchFilter))
	.post(MOCK_API_BASE_URL, mockList[3])
	.get(MOCK_API_FIRST_ITEM_URL, mockList[1])
	.put(MOCK_API_FIRST_ITEM_URL, mockList[4])
	.put(MOCK_API_THIRD_ITEM_URL, { id: 3, owner: 1, text: 'test 15' })
	.patch(MOCK_API_FIRST_ITEM_URL, mockList[5])
	.delete(MOCK_API_FIRST_ITEM_URL, EMPTY_RESPONSE)
	.delete(MOCK_API_THIRD_ITEM_URL, EMPTY_RESPONSE)
	.catch(404);

const actionCreators = new CrudActionCreators(MOCK_API_BASE_URL, 'TEST');
const resetAction = () => {
	return {
		type: 'RESET_DATA',
	};
};

const getters = {
	getList: list =>
		list.reduce((acc, item) => {
			acc[item.id + ''] = item;
			return acc;
		}, {}),
	getOne: item => ({ ...item, fetchedAsOne: true }),
};
const actionCreatorsWithGetters = new CrudActionCreators(
	MOCK_API_BASE_URL,
	'TEST',
	{ getters },
);

const store = chai.createReduxStore({
	reducer: createCrudReducers(actionCreators, 'CRUD', 'RESET_DATA'),
	middleware: [thunkMiddleware],
});

describe('redux-crud', function() {
	describe('Read', function() {
		it('should fetch a list of resources', function(done) {
			const promise = store.dispatch(actionCreators.fetchList());
			expect(store).to.have.dispatched(actionCreators.actionTypes.request);
			expect(store).to.have.state.like({
				listLoading: true,
				listError: undefined,
			});
			promise
				.then(function() {
					expect(store).to.have.dispatched(actionCreators.actionTypes.receive);
					expect(store).to.have.state.like({
						listLoading: false,
						data: mockList,
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should fetch a list of resources by params', function(done) {
			const promise = store.dispatch(actionCreators.fetchList({ owner: 1 }));
			expect(store).to.have.dispatched(actionCreators.actionTypes.request);
			expect(store).to.have.state.like({
				listLoading: true,
				listError: undefined,
			});
			promise
				.then(function() {
					expect(store).to.have.dispatched(actionCreators.actionTypes.receive);
					expect(store).to.have.state.like({
						listLoading: false,
						data: mockList.filter(searchFilter),
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should fetch a list of resources with a getter', function(done) {
			const promise = store.dispatch(actionCreatorsWithGetters.fetchList());
			expect(store).to.have.dispatched(
				actionCreatorsWithGetters.actionTypes.request,
			);
			expect(store).to.have.state.like({
				listLoading: true,
				listError: undefined,
			});
			promise
				.then(function() {
					expect(store).to.have.dispatched(
						actionCreatorsWithGetters.actionTypes.receive,
					);
					expect(store).to.have.state.like({
						listLoading: false,
						data: getters.getList(mockList),
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should fetch a single resource', function(done) {
			const promise = store.dispatch(actionCreators.fetchOne(1));
			expect(store).to.have.dispatched(actionCreators.actionTypes.requestOne);
			expect(store).to.have.state.like({
				oneLoading: true,
				oneError: undefined,
			});
			promise
				.then(function() {
					expect(store).to.have.dispatched(
						actionCreators.actionTypes.receiveOne,
					);
					expect(store).to.have.state.like({
						oneLoading: false,
						currentId: 1,
						currentData: mockList[1],
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should fetch a single resource with a getter', function(done) {
			const promise = store.dispatch(actionCreatorsWithGetters.fetchOne(1));
			expect(store).to.have.dispatched(
				actionCreatorsWithGetters.actionTypes.requestOne,
			);
			expect(store).to.have.state.like({
				oneLoading: true,
				oneError: undefined,
			});
			promise
				.then(function() {
					expect(store).to.have.dispatched(
						actionCreatorsWithGetters.actionTypes.receiveOne,
					);
					expect(store).to.have.state.like({
						oneLoading: false,
						currentId: 1,
						currentData: getters.getOne(mockList[1]),
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should receive error for a list', function(done) {
			const promise = store.dispatch(
				actionCreators.fetchList({ owner: 'master' }),
			);
			expect(store).to.have.dispatched(actionCreators.actionTypes.request);
			expect(store).to.have.state.like({ listLoading: true });
			promise
				.then(function(data) {
					expect(store).to.have.dispatched(
						actionCreators.actionTypes.receiveError,
					);
					expect(store).to.have.state.like({
						listLoading: false,
						listError: ERROR_MESSAGE,
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should receive error for a single resource', function(done) {
			const promise = store.dispatch(actionCreators.fetchOne(5));
			expect(store).to.have.dispatched(actionCreators.actionTypes.requestOne);
			expect(store).to.have.state.like({ oneLoading: true });
			promise
				.then(function(data) {
					expect(store).to.have.dispatched(
						actionCreators.actionTypes.receiveOneError,
					);
					expect(store).to.have.state.like({
						oneLoading: false,
						oneError: ERROR_MESSAGE,
					});
					done();
				})
				.catch(error => done(error));
		});
	});

	describe('Create/Update', function() {
		it('should create a new resource', function(done) {
			const promise = store.dispatch(
				actionCreators.save({ text: 'test 4', owner: 1 }),
			);
			expect(store).to.have.dispatched(actionCreators.actionTypes.saving);
			expect(store).to.have.state.like({
				isSaving: true,
				saveError: undefined,
			});
			promise
				.then(function() {
					expect(store).to.have.dispatched(actionCreators.actionTypes.saved);
					expect(store).to.have.state.like({
						isSaving: false,
						savedData: { id: 4, owner: 1, text: 'test 4' },
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should update a resource', function(done) {
			const promise = store.dispatch(
				actionCreators.save({ owner: 1, text: 'test 5' }, 1),
			);
			expect(store).to.have.dispatched(actionCreators.actionTypes.saving);
			expect(store).to.have.state.like({
				isSaving: true,
				saveError: undefined,
			});
			promise
				.then(function() {
					expect(store).to.have.dispatched(actionCreators.actionTypes.saved);
					expect(store).to.have.state.like({
						isSaving: false,
						savedData: { id: 5, owner: 1, text: 'test 5' },
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should update a resource with merging response to data', function(
			done,
		) {
			const newStore = chai.createReduxStore({
				reducer: createCrudReducers(actionCreators, 'CRUD', 'RESET_DATA', true),
				middleware: [thunkMiddleware],
			});
			const promise = newStore.dispatch(
				actionCreators.save({ id: 4, owner: 1, text: 'test 4' }),
			);
			expect(newStore).to.have.dispatched(actionCreators.actionTypes.saving);
			expect(newStore).to.have.state.like({
				isSaving: true,
				saveError: undefined,
			});
			promise
				.then(function() {
					expect(newStore).to.have.dispatched(actionCreators.actionTypes.saved);
					expect(newStore).to.have.state.like({
						isSaving: false,
						savedData: { id: 4, owner: 1, text: 'test 4' },
						data: [{ id: 4, owner: 1, text: 'test 4' }],
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should update a resource with merging response to data when data contains item with ID', function(
			done,
		) {
			const newStore = chai.createReduxStore({
				reducer: createCrudReducers(actionCreators, 'CRUD', 'RESET_DATA', true),
				middleware: [thunkMiddleware],
			});
			const promises = newStore
				.dispatch(actionCreators.fetchList())
				.then(function() {
					return newStore.dispatch(
						actionCreators.save({ id: 3, owner: 1, text: 'test 15' }, 3),
					);
				})
				.then(function() {
					expect(newStore).to.have.dispatched(
						actionCreators.actionTypes.saving,
					);
					expect(newStore).to.have.state.like({
						isSaving: true,
						saveError: undefined,
					});
				});
			promises
				.then(function() {
					expect(newStore).to.have.dispatched(actionCreators.actionTypes.saved);
					expect(newStore).to.have.state.like({
						isSaving: false,
						savedData: { id: 3, owner: 1, text: 'test 15' },
						data: mockList.map(function(item) {
							return item.id == 3 ? { id: 3, owner: 1, text: 'test 15' } : item;
						}),
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should update a resource with method override', function(done) {
			const promise = store.dispatch(
				actionCreators.save({ text: 'test 6' }, 1, 'PATCH'),
			);
			expect(store).to.have.dispatched(actionCreators.actionTypes.saving);
			expect(store).to.have.state.like({
				isSaving: true,
				saveError: undefined,
			});
			promise
				.then(function() {
					expect(store).to.have.dispatched(actionCreators.actionTypes.saved);
					expect(store).to.have.state.like({
						isSaving: false,
						savedData: { id: 6, owner: 1, text: 'test 6' },
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should receive a create/update error', function(done) {
			const promise = store.dispatch(
				actionCreators.save({ text: 'test 4' }, 4),
			);
			expect(store).to.have.dispatched(actionCreators.actionTypes.saving);
			expect(store).to.have.state.like({
				isSaving: true,
				saveError: undefined,
			});
			promise
				.then(function() {
					expect(store).to.have.dispatched(
						actionCreators.actionTypes.saveError,
					);
					expect(store).to.have.state.like({
						isSaving: false,
						saveError: ERROR_MESSAGE,
					});
					done();
				})
				.catch(error => done(error));
		});
	});

	describe('Delete', function() {
		it('should delete a resource', function(done) {
			const promise = store.dispatch(actionCreators.delete(1));
			expect(store).to.have.dispatched(actionCreators.actionTypes.deleting);
			expect(store).to.have.state.like({
				isDeleting: true,
				deleteError: undefined,
			});
			promise
				.then(function() {
					expect(store).to.have.dispatched(actionCreators.actionTypes.deleted);
					expect(store).to.have.state.like({ isDeleting: false });
					done();
				})
				.catch(error => done(error));
		});

		it('should delete a resource with merging response to data when data', function(
			done,
		) {
			const newStore = chai.createReduxStore({
				reducer: createCrudReducers(actionCreators, 'CRUD', 'RESET_DATA', true),
				middleware: [thunkMiddleware],
			});
			const promises = newStore
				.dispatch(actionCreators.fetchList())
				.then(function() {
					return newStore.dispatch(actionCreators.delete(3));
				})
				.then(function() {
					expect(newStore).to.have.dispatched(
						actionCreators.actionTypes.deleting,
					);
					expect(newStore).to.have.state.like({
						isDeleting: true,
						deleteError: undefined,
					});
				});
			promises
				.then(function() {
					expect(newStore).to.have.dispatched(
						actionCreators.actionTypes.deleted,
					);
					expect(newStore).to.have.state.like({
						isDeleting: false,
						data: mockList.filter(function(item) {
							return item.id != 3;
						}),
					});
					done();
				})
				.catch(error => done(error));
		});

		it('should receive a delete error', function(done) {
			const promise = store.dispatch(actionCreators.delete(5));
			expect(store).to.have.dispatched(actionCreators.actionTypes.deleting);
			expect(store).to.have.state.like({
				isDeleting: true,
				deleteError: undefined,
			});
			promise
				.then(function() {
					expect(store).to.have.dispatched(
						actionCreators.actionTypes.deleteError,
					);
					expect(store).to.have.state.like({
						isDeleting: false,
						deleteError: ERROR_MESSAGE,
					});
					done();
				})
				.catch(error => done(error));
		});
	});

	describe('Reset all data', function() {
		it('should reset reducer to initial state', function(done) {
			const promise = store.dispatch(actionCreators.fetchList());
			promise
				.then(function() {
					store.dispatch(resetAction());
					expect(store).to.have.dispatched('RESET_DATA');
					expect(store).to.have.state.like({
						data: [],
						listError: undefined,
						params: undefined,
						listLoading: false,
						oneLoading: false,
						currentId: undefined,
						currentData: undefined,
						oneError: undefined,
					});
					done();
				})
				.catch(error => done(error));
		});
	});
});
