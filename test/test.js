import 'babel-polyfill';
import 'es6-promise/auto';
import 'isomorphic-fetch';

import fetchMock from 'fetch-mock';
import chai, {expect} from 'chai';
import chaiRedux from 'chai-redux';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiRedux);
chai.use(chaiAsPromised);

import thunkMiddleware from 'redux-thunk';

import {createCrudReducers, CrudActionCreators} from '../src/index.js'

const MOCK_API_BASE_URL = 'https://localhost:1337';
const MOCK_API_FIRST_ITEM_URL = MOCK_API_BASE_URL + '/' + '1';

const EMPTY_RESPONSE = {};

const ERROR_MESSAGE = 'Not Found';

const mockList = [
	{id: 1, owner: 1, text: 'test 1'},
	{id: 2, owner: 2, text: 'test 2'},
	{id: 3, owner: 1, text: 'test 3'},
];

const serachFilter = item => item.owner == 1;

fetchMock.get(MOCK_API_BASE_URL, mockList)
	.get(MOCK_API_BASE_URL + '?owner=1', mockList.filter(serachFilter))
	.post(MOCK_API_BASE_URL, EMPTY_RESPONSE)
	.get(MOCK_API_FIRST_ITEM_URL, mockList[1])
	.put(MOCK_API_FIRST_ITEM_URL, EMPTY_RESPONSE)
	.patch(MOCK_API_FIRST_ITEM_URL, EMPTY_RESPONSE)
	.delete(MOCK_API_FIRST_ITEM_URL, EMPTY_RESPONSE)
	.catch(404);

const actionCreators = new CrudActionCreators(MOCK_API_BASE_URL, 'TEST');

const getters = {
	getList: list => list.reduce((acc, item) => {
		acc[item.id+''] = item;
		return acc;
	}, {}),
	getOne: item => ({...item, fetchedAsOne: true}),
};
const actionCreatorsWithGetters = new CrudActionCreators(MOCK_API_BASE_URL, 'TEST', {getters})

const store = chai.createReduxStore({
	reducer: createCrudReducers(actionCreators),
	middleware: [thunkMiddleware],
});

describe('redux-crud', function() {
	describe('Read', function() {
		it('should fetch a list of resources', function(done) {
			const promise = store.dispatch(actionCreators.fetchList());
			expect(store).to.have.dispatched(actionCreators.actionTypes.request);
			expect(store).to.have.state.like({listLoading: true, listError: undefined});
			promise.then(function() {
				expect(store).to.have.dispatched(actionCreators.actionTypes.receive);
				expect(store).to.have.state.like({listLoading: false, data: mockList});
				done();
			}).catch(error => done(error));
		});

		it('should fetch a list of resources by params', function(done) {
			const promise = store.dispatch(actionCreators.fetchList({owner: 1}));
			expect(store).to.have.dispatched(actionCreators.actionTypes.request);
			expect(store).to.have.state.like({listLoading: true, listError: undefined});
			promise.then(function() {
				expect(store).to.have.dispatched(actionCreators.actionTypes.receive);
				expect(store).to.have.state.like({listLoading: false, data: mockList.filter(serachFilter)});
				done();
			}).catch(error => done(error));
		});

		it('should fetch a list of resources with a getter', function(done) {
			const promise = store.dispatch(actionCreatorsWithGetters.fetchList());
			expect(store).to.have.dispatched(actionCreatorsWithGetters.actionTypes.request);
			expect(store).to.have.state.like({listLoading: true, listError: undefined});
			promise.then(function() {
				expect(store).to.have.dispatched(actionCreatorsWithGetters.actionTypes.receive);
				expect(store).to.have.state.like({listLoading: false, data: getters.getList(mockList)});
				done();
			}).catch(error => done(error));
		});

		it('should fetch a single resource', function(done) {
			const promise = store.dispatch(actionCreators.fetchOne(1));
			expect(store).to.have.dispatched(actionCreators.actionTypes.requestOne);
			expect(store).to.have.state.like({oneLoading: true, oneError: undefined});
			promise.then(function() {
				expect(store).to.have.dispatched(actionCreators.actionTypes.receiveOne);
				expect(store).to.have.state.like({oneLoading: false, currentId: 1, currentData: mockList[1]});
				done();
			}).catch(error => done(error));
		});

		it('should fetch a single resource with a getter', function(done) {
			const promise = store.dispatch(actionCreatorsWithGetters.fetchOne(1));
			expect(store).to.have.dispatched(actionCreatorsWithGetters.actionTypes.requestOne);
			expect(store).to.have.state.like({oneLoading: true, oneError: undefined});
			promise.then(function() {
				expect(store).to.have.dispatched(actionCreatorsWithGetters.actionTypes.receiveOne);
				expect(store).to.have.state.like({oneLoading: false, currentId: 1, currentData: getters.getOne(mockList[1])});
				done();
			}).catch(error => done(error));
		});

		it('should receive error for a list', function(done) {
			const promise = store.dispatch(actionCreators.fetchList({owner: 'master'}));
			expect(store).to.have.dispatched(actionCreators.actionTypes.request);
			expect(store).to.have.state.like({listLoading: true});
			promise.then(function(data) {
				expect(store).to.have.dispatched(actionCreators.actionTypes.receiveError);
				expect(store).to.have.state.like({listLoading: false, listError: ERROR_MESSAGE});
				done();
			}).catch(error => done(error));
		});

		it('should receive error for a single resource', function(done) {
			const promise = store.dispatch(actionCreators.fetchOne(5));
			expect(store).to.have.dispatched(actionCreators.actionTypes.requestOne);
			expect(store).to.have.state.like({oneLoading: true});
			promise.then(function(data) {
				expect(store).to.have.dispatched(actionCreators.actionTypes.receiveOneError);
				expect(store).to.have.state.like({oneLoading: false, oneError: ERROR_MESSAGE});
				done();
			}).catch(error => done(error));
		});
	});

	describe('Create/Update', function() {
		it('should create a new resource', function(done) {
			const promise = store.dispatch(actionCreators.save({text: 'test 4'}));
			expect(store).to.have.dispatched(actionCreators.actionTypes.saving);
			expect(store).to.have.state.like({isSaving: true, saveError: undefined});
			promise.then(function() {
				expect(store).to.have.dispatched(actionCreators.actionTypes.saved);
				expect(store).to.have.state.like({isSaving: false});
				done();
			}).catch(error => done(error));
		});

		it('should update a resource', function(done) {
			const promise = store.dispatch(actionCreators.save({text: 'test 4'}, 1));
			expect(store).to.have.dispatched(actionCreators.actionTypes.saving);
			expect(store).to.have.state.like({isSaving: true, saveError: undefined});
			promise.then(function() {
				expect(store).to.have.dispatched(actionCreators.actionTypes.saved);
				expect(store).to.have.state.like({isSaving: false});
				done();
			}).catch(error => done(error));
		});

		it('should update a resource with method ovrride', function(done) {
			const promise = store.dispatch(actionCreators.save({text: 'test 4'}, 1, 'PATCH'));
			expect(store).to.have.dispatched(actionCreators.actionTypes.saving);
			expect(store).to.have.state.like({isSaving: true, saveError: undefined});
			promise.then(function() {
				expect(store).to.have.dispatched(actionCreators.actionTypes.saved);
				expect(store).to.have.state.like({isSaving: false});
				done();
			}).catch(error => done(error));
		});

		it('should receive a create/update error', function(done) {
			const promise = store.dispatch(actionCreators.save({text: 'test 4'}, 4));
			expect(store).to.have.dispatched(actionCreators.actionTypes.saving);
			expect(store).to.have.state.like({isSaving: true, saveError: undefined});
			promise.then(function() {
				expect(store).to.have.dispatched(actionCreators.actionTypes.saveError);
				expect(store).to.have.state.like({isSaving: false, saveError: ERROR_MESSAGE});
				done();
			}).catch(error => done(error));
		});
	});

	describe('Delete', function() {
		it('should delete a resource', function(done) {
			const promise = store.dispatch(actionCreators.delete(1));
			expect(store).to.have.dispatched(actionCreators.actionTypes.deleting);
			expect(store).to.have.state.like({isDeleting: true, deleteError: undefined});
			promise.then(function() {
				expect(store).to.have.dispatched(actionCreators.actionTypes.deleted);
				expect(store).to.have.state.like({isDeleting: false});
				done();
			}).catch(error => done(error));
		});

		it('should receive a delete error', function(done) {
			const promise = store.dispatch(actionCreators.delete(5));
			expect(store).to.have.dispatched(actionCreators.actionTypes.deleting);
			expect(store).to.have.state.like({isDeleting: true, deleteError: undefined});
			promise.then(function() {
				expect(store).to.have.dispatched(actionCreators.actionTypes.deleteError);
				expect(store).to.have.state.like({isDeleting: false, deleteError: ERROR_MESSAGE});
				done();
			}).catch(error => done(error));
		});
	});
});