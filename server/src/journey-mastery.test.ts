import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {isTopicMastered} from './journey-mastery.js';
import {JOURNEY_STOPS} from './journey-config.js';

test('journey covers every official syllabus topic once across Kerala districts',()=>{
 const syllabus=JSON.parse(fs.readFileSync(fileURLToPath(new URL('../data/syllabus.json',import.meta.url)),'utf8'));
 const topicNames=JOURNEY_STOPS.flatMap(stop=>stop.topics.map(topic=>topic.topic));
 assert.equal(JOURNEY_STOPS.filter(stop=>!stop.final).length,14);
 assert.equal(new Set(JOURNEY_STOPS.filter(stop=>!stop.final).map(stop=>stop.district)).size,14);
 assert.deepEqual([...topicNames].sort(),syllabus.map((topic:any)=>topic.topic).sort());
 assert.equal(new Set(topicNames).size,topicNames.length);
});

test('mastery requires 20 most recent attempts and at least 60 percent correct',()=>{
 assert.equal(isTopicMastered(Array(19).fill(true)),false);
 assert.equal(isTopicMastered([...Array(12).fill(true),...Array(8).fill(false)]),true);
 assert.equal(isTopicMastered([...Array(11).fill(true),...Array(9).fill(false)]),false);
 assert.equal(isTopicMastered([...Array(20).fill(true),...Array(20).fill(false)]),false);
});
