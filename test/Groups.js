var env = process.env.NODE_ENV || 'test';

var expect = require('chai').expect;
var _ = require('lodash');
var deleteStream = require('level-delete-stream');
var Promise = require('bluebird');

var musketeers = [{
  name: "Athos",
}, {
  name: "Aramis",
}, {
  name: "Porthos",
}];

var threeMusketeers = {
  name: "The Three Musketeers",
  description: "all for one, one for all",
};

var checkGroup = function (actual, expected) {
  expect(actual).to.have.property('@type', "Group");
  _.each(expected.member, function (expectedMember) {
    var actualMember = _.find(actual.member, expectedMember);
    checkPerson(actualMember, expectedMember);
  })
  _.each(expected, function (value, key) {
    if (key === 'member') { return; }
    expect(actual).to.have.property(key, value);
  });
};

var checkPerson = function (actual, expected) {
  expect(actual).to.have.property("@type", "Person");
  _.each(expected, function (value, key) {
    expect(actual).to.have.property(key, value);
  });
};

describe("#Groups", function () {
  var db;
  var graphs;
  var Groups;
  var Memberships;
  var People;

  before(function () {
    var jjv = require('jjv')();
    var level = require('level-test')();
    db = level(env+'.db');

    graphs = require('../')({
      db: db,
      base: "http://open.app/",
      graphs: require('../lib'),
    });

    People = graphs.get('People');
    Groups = graphs.get('Groups');
    Memberships = graphs.get('Memberships');
  });

  beforeEach(function (done) {
    return db.createKeyStream()
    .pipe(deleteStream(db, done))
  });

  it("should CRUD group", function () {
    var fixture = _.clone(threeMusketeers);
    var id;
    // check new group
    return Groups.create(fixture)
    .then(function (savedGroup) {
      id = savedGroup['@id'];
      // check saved group
      expect(id).to.exist;
      checkGroup(savedGroup, fixture);
    })
    .then(function () {
      // get group from db
      return Groups.get({ '@id': id });
    })
    .then(function (fetchedGroup) {
      // check fetched group
      expect(fetchedGroup).to.have.property('@id');
      checkGroup(fetchedGroup, fixture);
      return fetchedGroup;
    })
    .then(function (group) {
      // update group in db
      fixture.name = group.name = 'Muskets';
      return Groups.update(group);
    })
    .then(function (updatedGroup) {
      // check updated group
      expect(updatedGroup).to.have.property('@id');
      checkGroup(updatedGroup, fixture);
    })
    .then(function () {
      // delete group in db
      return Groups.remove(id);
    })
    .then(function (destroyedGroup) {
      expect(destroyedGroup).to.not.exist;
    })
    .then(function () {
      // get destroyed group from db
      return Groups.get(id);
    })
    .then(function (destroyedGroup) {
      expect(destroyedGroup).to.not.exist;
    })
    ;
  });

  it("should create group and add members", function () {
    var fixture = _.clone(threeMusketeers);
    var id;
    // create new group
    return Groups.create(fixture)
    .then(function (savedGroup) {
      id = savedGroup['@id'];
    })
    .then(function () {
      // create people
      return Promise.all(musketeers.map(function (person) {
        return People.create(person);
      }));
    })
    .then(function (people) {
      // add people as members to group
      return Promise.all(people.map(function (person) {
        return Memberships.create({
          group: id,
          member: person['@id'],
        });
      }));
    })
    .then(function (memberships) {
      console.log("MEMBERSHIPS", memberships);

      // get group again
      return Groups.get(id);
    })
    .then(function (group) {
      console.log("GROUP", group);
      // group should contain memberships
      expect(group).to.have.property('memberships');
      // memberships should contain people
      expect(group.memberships).to.have.length(3);
    })
    ;
  });

  after(function (done) {
    db.close(done)
  });
});

