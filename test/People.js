var env = process.env.NODE_ENV || 'test';

var expect = require('chai').expect;
var _ = require('lodash');
var deleteStream = require('level-delete-stream');

var bob = {
  name: "Bob Loblaw",
  email: "bobloblaw@bobloblawslawblog.com",
};

var checkPerson = function (actual, expected) {
  expect(actual["@type"]).to.equal("Person");
  _.each(expected, function (value, key) {
    expect(actual).to.have.property(key, value);
  });
};

describe("#People", function () {
  var db;
  var graphs;
  var People;

  before(function () {
    var jjv = require('jjv')();
    var level = require('level-test')();
    db = level(env+'.db');

    graphs = require('../')({
      db: db,
      base: "http://open.app/",
    });

    graphs.set(
      require('../lib/People')
    );
    People = graphs.get('People');
  })

  beforeEach(function (done) {
    return db.createKeyStream()
    .pipe(deleteStream(db, done))
  });

  it("should CRUD person", function () {
    var fixture = _.clone(bob);
    var id;
    // check new person
    return People.create(fixture)
    .then(function (savedPerson) {
      id = savedPerson['@id'];
      // check saved person
      expect(id).to.exist;
      checkPerson(savedPerson, fixture);
    })
    .then(function () {
      // get person from db
      return People.get({ '@id': id });
    })
    .then(function (fetchedPerson) {
      // check fetched person
      expect(fetchedPerson).to.have.property('@id');
      checkPerson(fetchedPerson, fixture);
      return fetchedPerson;
    })
    .then(function (person) {
      // update person in db
      fixture.name = 'Bob';
      person.name = 'Bob';
      return People.update(person);
    })
    .then(function (updatedPerson) {
      // check updated person
      expect(updatedPerson).to.have.property('@id');
      checkPerson(updatedPerson, fixture);
    })
    .then(function () {
      // delete person in db
      return People.remove(id);
    })
    .then(function (destroyedPerson) {
      expect(destroyedPerson).to.not.exist;
    })
    .then(function () {
      // get destroyed person from db
      return People.get(id);
    })
    .then(function (destroyedPerson) {
      expect(destroyedPerson).to.not.exist;
    })
    ;
  });
});

