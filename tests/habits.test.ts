import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLongestStreak, calculateStreak, completionRate, heatmapLevel, isScheduledOn } from '../src/features/habits/domain';
import type { Habit, HabitEntry } from '../src/features/habits/types';

const habit:Habit={id:'h1',name:'Run',icon:'🏃',color:'#8068EA',type:'boolean',target:1,unit:'times',schedule:[1,3,5],archived:false,createdAt:'2026-09-01'};
const entry=(date:string,completed=true):HabitEntry=>({id:date,habitId:'h1',date,value:1,completed});

test('schedule uses local weekday and only selected days',()=>{
  assert.equal(isScheduledOn(habit,new Date(2026,9,2,12)),true); // Friday
  assert.equal(isScheduledOn(habit,new Date(2026,9,4,12)),false); // Sunday
});

test('streak spans non-scheduled days and resets on a missed scheduled day',()=>{
  const entries=[entry('2026-09-30'),entry('2026-10-02')];
  assert.equal(calculateStreak(habit,entries,new Date(2026,9,4,12)),2);
  assert.equal(calculateStreak(habit,entries,new Date(2026,9,5,12)),0);
  assert.equal(calculateLongestStreak(habit,entries),2);
});

test('completion rate and quantity heatmap clamp to expected ranges',()=>{
  const values=[entry('2026-10-01',true),entry('2026-10-02',false)];
  assert.equal(completionRate(values),50);
  const quantity:Habit={...habit,type:'quantity',target:8};
  assert.equal(heatmapLevel(entry('2026-10-01'),quantity),1);
  assert.equal(heatmapLevel({...entry('2026-10-01'),value:6},quantity),3);
  assert.equal(heatmapLevel({...entry('2026-10-01'),value:12},quantity),4);
  assert.equal(heatmapLevel(undefined,quantity),0);
});
